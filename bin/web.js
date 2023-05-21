//TODO: Change to HTTPS
import {createServer} from "http";
import express from "express";

const app = express();
const https = createServer(app);

app.use(express.static('public')); 

//** ACME -> for ssl cert creation */
app.get("/.well-known/acme-challenge/:id", (req, res) => {
    let id = req.params.id;

    if(id == global?.ACME?.token) {
        res.send(global.ACME.keyAuthorization)
    } else {
        res.send("Nothing to see here!")
    }
});

const listener = https.listen(80, () => {
    console.log(`web/socket server running on port ${listener.address().port}`)
});

export {
    app,
    https,
    listener
}