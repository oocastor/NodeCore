import "./database.js";

if (!global.CONFIG.findOne({ entity: "firstSetupDone" })) {
    global.CONFIG.insertOne({ entity: "domains", value: [] });
    global.CONFIG.insertOne({ entity: "github", value: { user: "", pat: "" } });
    global.CONFIG.insertOne({ entity: "firstSetupDone", value: true });
}