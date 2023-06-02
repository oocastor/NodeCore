import "./database.js";
import { createNewUser } from "./auth.js";
import fs from "fs";

// *** RUN ON FIRST START ***
if (!global.CONFIG.findOne({ entity: "firstSetupDone" })) {

    // *** CREATE VARS ***
    global.CONFIG.insertOne({ entity: "domains", value: [] });
    global.CONFIG.insertOne({ entity: "github", value: { pat: "" } });
    global.CONFIG.insertOne({ entity: "path", value: "/home/node-up" });
    global.CONFIG.insertOne({ entity: "pm2UpdateInterval", value: 2000 });
    global.CONFIG.insertOne({ entity: "proxy", value: { enabled: false, subscriberEmail: "", cluster: false, workers: 1, pid: "" } });

    global.CONFIG.insertOne({ entity: "firstSetupDone", value: true });

    // *** CREATE INIT LOGIN  ***
    createNewUser("nodeup", "nodeup");

    // *** CREATE INSTANCE DIR ***
    fs.mkdirSync("/home/node-up");

    fs.mkdirSync("certs");
}

// *** RUN EVERY START ***
global.ENTITIES.updateMany({ type: "instance" }, { status: 0 });