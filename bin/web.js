import AutoEncryptLocalhost from "@small-tech/auto-encrypt-localhost";
import express from "express";
import { createServer } from "https";
import projectData from "../package.json" assert { type: 'json' };

const app = express();
const cert = AutoEncryptLocalhost.getKeyMaterial();

const https = createServer(cert, app);

/** DEBUG */
// import { createServer } from "http";
// const https = createServer(app);
/** END */

app.use(express.static('gui/dist'));

https.listen(process.env.PORT, () => {
    global.log.welcome1(`v${projectData.version}`);
    global.log.welcome2();
    global.log.coffee1("Buy us a Coffee");
    global.log.coffee1("BTC - bc1qtqvd95ynuhly4eu8taq4hl0arvtxysd0zc2fg9");
    global.log.coffee2("ETH - 0xdccA038c1F53D071029B55117c7e2926E68aC852");
    global.log.coffee2("SOL - 3gESKNexSqDRpYi8gKMfs6BSRkPruG7YHgxakfQ5e5ij");
    global.log.coffee3("If you have a feature in mind that could improve our project, we'd love to hear about it.");
    global.log.coffee3("Email us at hello@node-code.dev");
    global.log.success(`web/socket server running on port ${process.env.PORT}`)
});

export {
    app,
    https
}