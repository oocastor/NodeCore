import http from "http";
import https from "https";
import express from "express";
import fs from "fs";
import httpProxy from "http-proxy";
import Borgoose from "borgoose";
import cluster from "cluster";

//** HTTP */
const app = express();
const _http = http.createServer(app);
let ACME = {
    token: "",
    keyAuthorization: ""
}

process.on("message", (data) => {
    data = JSON.parse(data);
    if (data.event == "updateACME") {
        console.log(data.data);
        ACME = data.data;
    }
});

function redirectHttpToHttps(req, res, next) {
    if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
        if (!req.url.startsWith('/.well-known/acme-challenge/')) {
            const httpsUrl = `https://${req.hostname}${req.url}`;
            return res.redirect(301, httpsUrl);
        }
    }
    next();
}

app.use(redirectHttpToHttps);

//** ACME -> for ssl cert creation */
app.get("/.well-known/acme-challenge/:id", (req, res) => {
    let id = req.params.id;

    if (id == ACME?.token) {
        res.send(ACME.keyAuthorization)
    } else {
        res.send("Nothing to see here!")
    }
});

const http_listener = _http.listen(80, () => {
    console.log(`http redirect/acme challenge running on port ${http_listener.address().port}`)
});

// ** HTTPS */

var _https = null;
const path = `${process.cwd()}/certs`;

createHttpsServer();

fs.watch(path, () => {
    console.log("CHANGED");
    //give him some time
    setTimeout(() => {
        createHttpsServer();
        updateHttpsServer();
    }, 1000);
})

function getAllCertsInDir() {
    return fs.readdirSync(path).map(file => {
        let target = JSON.parse(fs.readFileSync(`${path}/${file}`));
        return { altNames: target.altNames, data: { key: target.key, cert: target.cert } }
    });
}

function createHttpsServer() {
    let certs = getAllCertsInDir();

    if (certs.length == 0 || _https != null) return;

    let proxy = httpProxy.createProxyServer({ xfwd: true });
    _https = https.createServer(certs[0].data, (req, res) => {
        let ip = req.socket.remoteAddress;
        let target = getTargetByDomain(req.headers.host);
        console.log(`worker ${cluster.worker.id} handled a redirect for ${ip} to ${target}`);
        proxy.web(req, res, { target });
    });

    certs.slice(1).forEach(o => {
        o.altNames.forEach(alt => _https.addContext(alt, o.data));
    });

    proxy.on("error", function (err, req, res) {
        console.error(err);
        res.statusCode = 500;
        res.end();
        return;
    });

    _https.on("upgrade", function (req, socket, head) {
        proxy.ws(req, socket, head, {
            ws: true,
            target: getTargetByDomain(req.headers.host)
        });
    });

    const https_listener = _https.listen(443, () => {
        console.log(`https proxy running on port ${https_listener.address().port}`)
    });
}

function updateHttpsServer() {
    if (_https == null) return;

    let certs = getAllCertsInDir();
    console.log("UPDATE!")

    certs.forEach(o => {
        o.altNames.forEach(alt => {
            _https.addContext(alt, o.data);
            console.log(`worker ${cluster.worker.id} SSL Context updated ${alt} ${o.data.key.split(0, 20)}`);
        });
    });
}

function getTargetByDomain(host) {
    const ENTITIES = new Borgoose('data/entities.json', { syncOnWrite: true, createWithId: true });

    let address = host.split(".");
    let found;
    if (address.length == 2) {
        //example.de
        found = ENTITIES.findOne({ type: "instance", network: { redirect: { domain: `${address[0]}.${address[1]}`, sub: "@" } } }) ||
            ENTITIES.findOne({ type: "redirect", network: { domain: `${address[0]}.${address[1]}`, sub: "@" } });
    } else if (address.length == 3) {
        // *.example.de
        found = ENTITIES.findOne({ type: "instance", network: { redirect: { domain: `${address[1]}.${address[2]}`, sub: address[0] } } }) ||
            ENTITIES.findOne({ type: "redirect", network: { domain: `${address[1]}.${address[2]}`, sub: address[0] } });
    }

    if (!found) return "undefined"; //force an error

    return `http://localhost:${found.network?.redirect.port || found.network.port}`
}