import { domainIsUnused, nameIsUnused, portIsUnused } from "../wrapper/entities.js";

global.SE.on("instance:write", async (data, ack) => {
    console.log(data);
    if (data?.active == undefined || !data?.name || !data?.env || !data?.cmd || data?.network?.isAccessable == true && (!data?.network?.redirect?.sub
        || !data?.network?.redirect?.domain || !data?.network?.redirect?.port || isNaN(!data?.network?.redirect?.port))) {
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
        if (!data.network.isAccessable) {
            //clear network config for instance
            data.network.redirect.sub = "";
            data.network.redirect.domain = "";
            data.network.redirect.port = 0;
            //insert new entity
            global.ENTITIES.insertOne({ type: "instance", ...data });
            //TODO: reload proxy
            ack({ error: false, msg: `Instance successfully ${!data._id ? "created" : "updated"}` });
            return;
        } else {
            if (await portIsUnused(data.network.redirect.port)) {
                if (await domainIsUnused(data.network.redirect.sub, data.network.redirect.domain)) {
                    //insert new entity
                    global.ENTITIES.insertOne({ type: "instance", ...data });
                    //TODO: reload proxy
                    ack({ error: false, msg: `Instance successfully ${!data._id ? "created" : "updated"}` });
                    return;
                } else {
                    ack({ error: true, msg: "Domain already used" });
                }
            } else {
                ack({ error: true, msg: "Port already used" });
            }
        }
    } else {
        ack({ error: true, msg: "Name already used" });
    }

    //insert old entity back if something goes wrong
    if (target) global.ENTITIES.insertOne(target);
});

global.SE.on("instance:list", (ack) => {
    let redirects = global.ENTITIES.findMany({ type: "instance" });
    redirects.sort((a, b) => a.name < b.name ? -1 : 1);
    ack({ error: false, msg: "Fetched all instance entities", payload: redirects });
});

global.SE.on("instance:delete", (data, ack) => {
    if(!data?._id) {
        ack({ error: true, msg: "Cannot delete instance, no _id given.", payload: null });
        return;
    }

    let { _id } = data;
    global.ENTITIES.deleteOne({ _id });
    ack({ error: false, msg: "Instance successfully deleted", payload: null });
});