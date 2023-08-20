import AutoEncryptLocalhost from "@small-tech/auto-encrypt-localhost";
import express from "express";
// import { createServer } from "https";
import projectData from "../package.json" assert { type: 'json' };

const app = express();
const cert = AutoEncryptLocalhost.getKeyMaterial();

// const https = createServer(cert, app);

/** DEBUG */
import { createServer } from "http";
const https = createServer(app);
/** END */

app.use(express.static('gui/dist'));

https.listen(process.env.PORT, () => {
    global.log.blank("*********************************************************************************************");
    global.log.blank();
    global.log.nodecore(`v${projectData.version}`);
    global.log.blank();
    global.log.blank("If you have a feature in mind that could improve our project, we'd love to hear about it.");
    global.log.blank("Mail to hello@nodecore.xyz or create an feature request on our GitHub repository.");
    global.log.blank();
    global.log.blank("*********************************************************************************************");
    global.log.blank();
    global.log.success(`web/socket server running on port ${process.env.PORT}`)
});

export {
    app,
    https
}