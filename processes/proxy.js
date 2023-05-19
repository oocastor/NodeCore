import greenExpress from "greenlock-express";
import httpProxy from "http-proxy";
import "../bin/database.js";

function start() {
    let data = global.CONFIG.findOne({ entity: "proxy" }).value;

    if (!data) {
        console.log("stopped proxy, config invalid");
        process.stop(0);
    }

    let config = {
        maintainerEmail: data.maintainerEmail,
        packageRoot: process.cwd(),
        configDir: "./greenlock.d",
        agreeToTerms: true,
        staging: true,
        workers: data.workers,
        cluster: data.cluster
    }

    greenExpress.init(config).ready(httpsWorker);
}

start();

function httpsWorker(glx) {

    // we need the raw https server
    var server = glx.httpsServer();
    var proxy = httpProxy.createProxyServer({ xfwd: true });

    // catches error events during proxying
    proxy.on("error", function (err, req, res) {
        console.error(err);
        res.statusCode = 500;
        res.end();
        return;
    });

    // We'll proxy websockets too
    server.on("upgrade", function (req, socket, head) {
        proxy.ws(req, socket, head, {
            ws: true,
            target: getTargetByDomain(req.headers.host)
        });
    });

    // servers a node app that proxies requests to a localhost
    glx.serveApp(function (req, res) {
        proxy.web(req, res, {
            target: getTargetByDomain(req.headers.host)
        });
    });
}

function getTargetByDomain(host) {
    let address = host.split(".");
    let found;
    if (address.length == 2) {
        //example.de
        found = global.ENTITES.findOne({ type: "instance", network: { redirect: { domain: address[0], sub: "@" } } }) ||
            global.ENTITES.findOne({ type: "redirect", network: { domain: address[0], sub: "@" } });
    } else if(address.length == 3) {
        // *.example.de
        found = global.ENTITES.findOne({ type: "instance", network: { redirect: { domain: address[1], sub: address[0] } } }) ||
            global.ENTITES.findOne({ type: "redirect", network: { domain: address[1], sub: address[0] } });
    }

    if(!found) return "undefined"; //force an error

    return `http://localhost:${found.network?.redirect.port || found.network.port}`
}