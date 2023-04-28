import { domainIsUnused, nameIsUnused } from "../utils/entities.js";

global.SE.on("redirect:write", async (data, ack) => {
    if (data?.status == undefined || !data?.name || !data?.network?.sub || !data?.network?.domain || !data?.network?.port || isNaN(!data?.network?.port)) {
        ack({ error: true, msg: "Input data incomplete or invalid" });
        return;
    }

    //delete old entity by _id
    let target;
    if (data?._id) {
        target = global.ENTITIES.findOne({ _id: data._id });
        global.ENTITIES.deleteOne(target);
    }

    //name is unused
    if (await nameIsUnused(data.name)) {
        if (await domainIsUnused(data.network.sub, data.network.domain)) {
            //insert new entity
            global.ENTITIES.insertOne({ type: "redirect", ...data });
            //TODO: reload proxy
            ack({ error: false, msg: `Redirect successfully ${!data._id ? "created" : "updated"}` });
            return;
        } else {
            ack({ error: true, msg: "Domain already used" });
        }
    } else {
        ack({ error: true, msg: "Name already used" });
    }

    //insert old entity back if something goes wrong
    if (target) global.ENTITIES.insertOne(target);
});

global.SE.on("redirect:list", (ack) => {
    let redirects = global.ENTITIES.findMany({ type: "redirect" });
    redirects.sort((a, b) => a.name < b.name ? -1 : 1);
    ack({ error: false, msg: "Fetched all redirect entities", payload: redirects });
});

global.SE.on("redirect:delete", (data, ack) => {
    if(!data?._id) {
        ack({ error: true, msg: "Cannot delete redirect, no _id given.", payload: null });
        return;
    }

    let { _id } = data;
    global.ENTITIES.deleteOne({ _id });
    ack({ error: false, msg: "Redirect successfully deleted", payload: null });
});