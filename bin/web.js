import AutoEncryptLocalhost from "@small-tech/auto-encrypt-localhost";
import express from "express";
import { createServer } from "https";

const app = express();
const cert = AutoEncryptLocalhost.getKeyMaterial();
const https = createServer(cert, app);

app.use(express.static('gui/dist'));

https.listen(process.env.PORT, () => {
    console.log(`web/socket server running on port ${process.env.PORT}`)
});

export {
    app,
    https
}