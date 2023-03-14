import { portIsUnused, domainIsUnused } from "../wrapper/entities.js";

global.SE.on("redirect:create", (data, ack) => {
    let { name, domain, port } = data;
    if (!data || !data.name || !data.domain || !data.port) {
        ack({ error: true, msg: "Input data incomplete" });
        return;
    }
    if (portIsUnused(port)) {
        if (domainIsUnused(domain)) {
            //port and domain unused
            global.ENTITIES.insertOne({ type: "redirect", name, port, domain, active: true });
            //TODO: reload proxy
            ack({ error: false, msg: "Redirect successfully created" });
        } else {
            ack({ error: true, msg: "Domain already used" });
        }
    } else {
        ack({ error: true, msg: "Port already used" });
    }
});

global.SE.on("redirect:list", (ack) => {
    let redirects = global.ENTITIES.findMany({ type: "redirect" });
    ack({ error: false, msg: "Fetched all redirect entities", payload: redirects });
});

global.SE.on("redirect:delete", (data, ack) => {
    let { _id } = data;
    global.ENTITIES.deleteOne({ _id });
    ack({ error: false, msg: "Redirect successfully deleted", payload: null });
});