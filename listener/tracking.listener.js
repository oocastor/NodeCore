import { hasAllProperties } from "../helper/object.helper.js";

global.SE.on("tracking:get", async (ack) => {
    let { value } = global.CONFIG.findOne({ entity: "tracking" });
    ack({ error: false, msg: "Tracking status fetched", payload: value });
});

global.SE.on("tracking:set", async (data, ack) => {
    if(!hasAllProperties(data, ["enabled", "anonymizeIP", "saveDays"])) {
        ack({ error: true, msg: "Cannot change tracking settings", payload: null });
        return;
    }

    global.CONFIG.updateOne({ entity: "tracking" }, { value: data });
    ack({ error: false, msg: "Tracking settings changed", payload: null });
});

//TODO: lazy load data
global.SE.on("tracking:data", (ack) => {
    let data = global.TRACKING.findMany();
    ack({ error: false, msg: "Fetched tracking data", payload: data });
});