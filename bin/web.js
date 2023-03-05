//TODO: Change to HTTPS
import {createServer} from "http";
import express from "express";

const app = express();
const https = createServer(app);

app.use(express.static('public'));

const listener = https.listen(3001, () => {
    console.log(`web/socket server running on port ${listener.address().port}`)
});

export {
    app,
    https,
    listener
}