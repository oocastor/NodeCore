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

global.SE.on("tracking:data", (data, ack) => {
    let { page, filter, sort } = data;
    let totalTrackingData = global.TRACKING.findMany().reverse().sort((a, b) => !sort.ascending ? Date.parse(b.timestamp) - Date.parse(a.timestamp) : Date.parse(a.timestamp) - Date.parse(b.timestamp))
        .filter(f => JSON.stringify(f).includes(filter.text)).filter(f => {
            switch(filter.authorized) {
                case 0:
                    return true;
                case 1:
                    return f.authorized;
                case 2:
                    return !f.authorized;
            }
        });
    let trackingData = totalTrackingData.slice(page * 20, (page + 1) * 20);
    let totalRecords = totalTrackingData.length;
    ack({ error: false, msg: "Fetched tracking data", payload: { trackingData, totalRecords } });
});