import { portIsUnused, domainIsUnused, nameIsUnused } from "../wrapper/entities.js";

global.SE.on("redirect:create", async (data, ack) => {
    if (!data?.name || !data?.network?.sub || !data?.network?.domain || !data?.network?.port) {
        ack({ error: true, msg: "Input data incomplete" });
        return;
    }
    if (await nameIsUnused(data.name)) {
        if (await portIsUnused(data.network.port)) {
            if (await domainIsUnused(data.network.sub, data.network.domain)) {
                //port and domain unused
                global.ENTITIES.insertOne({ type: "redirect", ...data, active: true });
                //TODO: reload proxy
                ack({ error: false, msg: "Redirect successfully created" });
            } else {
                ack({ error: true, msg: "Domain already used" });
            }
        } else {
            ack({ error: true, msg: "Port already used" });
        }
    } else {
        ack({ error: true, msg: "Name already used" });
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