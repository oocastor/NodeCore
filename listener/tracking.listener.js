import { hasAllProperties } from "../helper/object.helper.js";

global.SE.on("tracking:get", async (ack) => {
    let { value } = global.CONFIG.findOne({ entity: "tracking" });
    ack({ error: false, msg: "Tracking status fetched", payload: value });
});

global.SE.on("tracking:set", async (data, ack) => {
    if (!hasAllProperties(data, ["enabled", "anonymizeIP", "saveDays"])) {
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
            switch (filter.authorized) {
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

global.SE.on("tracking:data:last7days", (ack) => {
    let totalTrackingData = global.TRACKING.findMany().sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

    let groupedTrackingData = [];

    totalTrackingData.forEach((trackingData, index) => {
        if (!groupedTrackingData.find(f => f.target === trackingData.target) && trackingData.authorized) {
            groupedTrackingData.push({
                target: trackingData.target,
                connectionsPerDay: totalTrackingData.filter(f => f.target === trackingData.target).reduce((acc, curr) => {
                    let date = new Date(curr.timestamp);
                    let dateStr = date.toLocaleDateString("DE-de", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit"
                    });
                    if (!acc.find(f => f.date === dateStr)) {
                        acc.push({
                            date: dateStr,
                            count: 1
                        });
                    } else {
                        let group = acc.find(f => f.date === dateStr);
                        group.count++;
                    }
                    return acc;
                }, [])
            });
        }
    });

    ack({ error: false, msg: "Fetched tracking data", payload: groupedTrackingData });
});

global.SE.on("tracking:data:byUrl", (data, ack) => {
    if (!hasAllProperties(data, ["url"])) {
        ack({ error: true, msg: "No url parameter provided.", payload: null });
        return;
    }

    let { url } = data;

    let totalTrackingData = global.TRACKING.findMany();

    let localDateString = (string) => new Date(string).toLocaleDateString("DE-de", { year: "numeric", month: "2-digit", day: "2-digit" });

    //get all requests per day
    let requestsPerDay = totalTrackingData.filter(f => url.find(u => u == f.target) && f.authorized && localDateString(f.timestamp) == localDateString(new Date()));

    //get all unique requests per day
    let uniqueRequestsPerDay = requestsPerDay.reduce((acc, curr) => {
        if (!acc.find(f => f.ip === curr.ip)) {
            acc.push(curr);
        }
        return acc;
    }, []);

    //get all request per week
    let requestsPerWeek = totalTrackingData.filter(f => url.find(u => u == f.target) && f.authorized && new Date(f.timestamp) >= new Date(new Date().setDate(new Date().getDate() - 7)));

    ack({ error: false, msg: "Fetched tracking data", payload: { requestsPerDay: requestsPerDay.length, uniqueRequestsPerDay: uniqueRequestsPerDay.length, requestsPerWeek: requestsPerWeek.length } });
});