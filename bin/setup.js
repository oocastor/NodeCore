import "./database.js";
import { createNewUser } from "./auth.js";

//*** RUN ON FIRST START ***
if (!global.CONFIG.findOne({ entity: "firstSetupDone" })) {

    // *** CREATE VARS ***
    global.CONFIG.insertOne({ entity: "domains", value: [] });
    global.CONFIG.insertOne({ entity: "github", value: { user: "", pat: "" } });
    global.CONFIG.insertOne({ entity: "path", value: "/home/node-up" });
    global.CONFIG.insertOne({ entity: "pm2UpdateInterval", value: 2000 });

    global.CONFIG.insertOne({ entity: "firstSetupDone", value: true });

    // *** CREATE INIT LOGIN  ***
    createNewUser("nodeup", "nodeup");
}