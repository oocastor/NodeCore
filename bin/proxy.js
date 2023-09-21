import http from "http";
import https from "https";
import express from "express";
import fs from "fs";
import { ensureDirSync } from "fs-extra";
import httpProxy from "http-proxy";
import Borgoose from "borgoose";
import cluster from "cluster";

//** HTTP */
const app = express();
const _http = http.createServer(app);
let ACME = []

process.on("message", (data) => {
    data = JSON.parse(data);
    if (data.event == "updateACME") {
        if (data.data.add) {
            ACME.push(data.data.add);
        } else if (data.data.delete) {
            ACME = ACME.filter(o => o.token != data.data.delete.token);
        }
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
    let target = ACME.find(f => f.token == id);

    if (target == undefined) {
        res.send("Nothing to see here!");
        return;
    }

    res.send(target.keyAuthorization);
});

const http_listener = _http.listen(80, () => {
    global.log.success(`http redirect/acme challenge running on port ${http_listener.address().port}`)
});

// ** HTTPS */

var _https = null;
const path = `${process.cwd()}/certs`;
ensureDirSync(path);

createHttpsServer();

fs.watch(path, () => {
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

    let proxy = httpProxy.createProxyServer({ xfwd: true, secure: false, changeOrigin: true });
    _https = https.createServer(certs[0].data, (req, res) => {
        let ip = req.socket.remoteAddress;
        let target = getTargetByDomain(req.headers.host);
        if (target !== "undefined") {
            global.log.success(`redirect ${convertIPv6MappedToIPv4(ip)} to ${target} (${req.headers.host})`);
            proxy.web(req, res, { target });
        } else {
            global.log.warn(`blocked redirect ${convertIPv6MappedToIPv4(ip)} to ${target} (${req.headers.host})`);
            //IPs tracken?
            res.statusCode = 404;
        }
    });

    certs.slice(1).forEach(o => {
        o.altNames.forEach(alt => _https.addContext(alt, o.data));
    });
    proxy.on("error", function (err, req, res) {
        global.log.info(req.headers)
        global.log.error('Proxy', err);
        global.log2File.error(err)
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
        global.log.success(`https proxy running on port ${https_listener.address().port}`)
    });
}

function updateHttpsServer() {
    if (_https == null) return;

    let certs = getAllCertsInDir();

    certs.forEach(o => {
        o.altNames.forEach(alt => {
            _https.addContext(alt, o.data);
            global.log.success(`worker ${cluster.worker.id} SSL Context updated ${alt} ${o.data.key.split(0, 20)}`);
        });
    });
}

function getTargetByDomain(host) {
    if (!host) return "undefined"; 
    const ENTITIES = new Borgoose('data/entities.json', { syncOnWrite: true, createWithId: true });

    let address = host.split(".");
    let found;
    if (address.length == 2) {
        //example.de
        found = ENTITIES.findOne({ type: "instance", network: { redirect: { domain: `${address[0]}.${address[1]}`, sub: "@" } } }) ||
            ENTITIES.findOne({ type: "redirect", network: { domain: `${address[0]}.${address[1]}`, sub: "@" }, status: 1 });
    } else if (address.length == 3) {
        // *.example.de
        found = ENTITIES.findOne({ type: "instance", network: { redirect: { domain: `${address[1]}.${address[2]}`, sub: address[0] } } }) ||
            ENTITIES.findOne({ type: "redirect", network: { domain: `${address[1]}.${address[2]}`, sub: address[0] }, status: 1 });
    }
    if (!found) return "undefined"; //force an error

    let port = found.network?.redirect?.port || found.network.port;

    return `http://localhost:${port}`
}

function convertIPv6MappedToIPv4(ipv6Mapped) {
    // Die IPv6-Mapped-IPv4-Adresse beginnt mit '::ffff:'.
    const prefix = '::ffff:';

    // Prüfen, ob die gegebene Adresse mit '::ffff:' beginnt.
    if (ipv6Mapped.startsWith(prefix)) {
        // Die IPv4-Adresse ist der Teil der Adresse nach dem Prefix '::ffff:'.
        const ipv4Address = ipv6Mapped.substr(prefix.length);
        return ipv4Address;
    } else {
        // Falls die Adresse nicht mit '::ffff:' beginnt, ist es bereits eine normale IPv4-Adresse.
        return ipv6Mapped;
    }
}