import { createServer } from "http";
import express from "express";

const app = express();
const https = createServer(app);

app.use(express.static('gui/dist'));

const listener = https.listen(1001, () => {
    console.log(`web/socket server running on port ${listener.address().port}`)
});

export {
    app,
    https,
    listener
}