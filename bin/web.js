import AutoEncryptLocalhost from "@small-tech/auto-encrypt-localhost";
import express from "express";

const app = express();
const https = AutoEncryptLocalhost.https.createServer(app);

app.use(express.static('gui/dist'));

https.listen(process.env.PORT, () => {
    console.log(`web/socket server running on port ${process.env.PORT}`)
});

export {
    app,
    https
}