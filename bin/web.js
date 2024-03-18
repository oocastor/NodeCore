import {createLocalCert } from "../helper/network.helper.js"
import express from "express";
import { createServer as createHttpServer } from "http";
import { createServer as createHttpsServer } from "https";
import { getServerIP } from "../helper/network.helper.js"
import projectData from "../package.json" assert { type: 'json' };

const app = express();
const http = createHttpServer(app);
const https = createHttpsServer(await createLocalCert(), app);
const serverIP = getServerIP()
app.use(express.static('gui/dist'));

http.listen(process.env.HTTPPORT, () => {
    global.log.blank("*********************************************************************************************");
    global.log.blank();
    global.log.nodecore(`v${projectData.version}`);
    global.log.blank();
    global.log.blank("If you have a feature in mind that could improve our project, we'd love to hear about it.");
    global.log.blank("Mail to hello@nodecore.xyz or create an feature request on our GitHub repository.");
    global.log.blank();
    global.log.blank("*********************************************************************************************");
    global.log.blank();
    global.log.success(`web/socket server running on http://${serverIP}:${process.env.HTTPPORT}`)
});
https.listen(process.env.HTTPSPORT, () => {
    global.log.success(`web/socket server running on https://${serverIP}:${process.env.HTTPSPORT}`)
});
export {
    app,
    http,
    https
}