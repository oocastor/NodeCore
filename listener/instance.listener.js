import { domainIsUnused, nameIsUnused, portIsUnused } from "../utils/entities-promise.js";
import { createInstance, deleteInstance, runInstanceAction } from "../modules/instance.module.js";

import { hasAllProperties } from "../helper/object.helper.js";

global.SE.on("instance:write", async (data, ack, id) => {
    if (!hasAllProperties(data, ["status", "name", "env", "cmd", "git", "network", "isAccessable", "method"])
        || data.network.isAccessable == true && !hasAllProperties(data, ["redirect", "sub", "domain", "port"])) {
        ack({ error: true, msg: "Input data incomplete or invalid" });
        return;
    }

    let { status, name, git, network, cmd, env, method } = data;

    if (method == "CREATE") {

        /** CREATE NEW PROCESS */

        let scopes = [nameIsUnused(name)];

        if (network.isAccessable) scopes = scopes.concat([portIsUnused(network.redirect.port), domainIsUnused(network.redirect.sub, network.redirect.domain)])
        else {
            //clear network config for instance
            network.redirect.sub = "";
            network.redirect.domain = "";
            network.redirect.port = 0;
        }

        //check if all scopes passed
        Promise.allSettled(scopes).then((res) => {
            let errs = res.filter(f => f.status == "rejected").map(m => m.reason);

            if (errs.length) {
                let msgs = errs.map(m => m.msg);
                errs[0].msg = msgs;
                ack(errs[0]);
                return;
            }

            //creation process
            createInstance(data, id).then((res) => ack(res)).catch((err) => ack(err));
        }).catch((e) => console.error(e));
    } else {

        /** UPDATE EXISTING PROCESS */



    }

    // if (data?.status == undefined || !data?.name || !data?.env || !data?.cmd || !data?.git || data?.network?.isAccessable == true && (!data?.network?.redirect?.sub
    //     || !data?.network?.redirect?.domain || !data?.network?.redirect?.port || isNaN(!data?.network?.redirect?.port))) {
    //     ack({ error: true, msg: "Input data incomplete or invalid" });
    //     return;
    // }

    // let target;
    // if (data?._id) {
    //     //delete old entity by _id
    //     target = global.ENTITIES.findOne({ _id: data._id });
    //     global.ENTITIES.deleteOne(target);
    // }

    // //name is unused
    // if (nameIsUnused(data.name)) {
    //     if (!data.network.isAccessable) {
    //         //clear network config for instance
    //         data.network.redirect.sub = "";
    //         data.network.redirect.domain = "";
    //         data.network.redirect.port = 0;

    //         await createInstance(data, ack);
    //         return;
    //     } else {
    //         if (portIsUnused(data.network.redirect.port)) {
    //             if (domainIsUnused(data.network.redirect.sub, data.network.redirect.domain)) {
    //                 await createInstance(data, ack)
    //                 return;
    //             } else {
    //                 ack({ error: true, msg: "Domain already used" });
    //             }
    //         } else {
    //             ack({ error: true, msg: "Port already used" });
    //         }
    //     }
    // } else {
    //     ack({ error: true, msg: "Name already used" });
    // }

    // //insert old entity back if something goes wrong
    // if (target) global.ENTITIES.insertOne(target);
});

global.SE.on("instance:action", async (data, ack) => {
    if (!data?._id || data?.status == undefined) {
        ack({ error: true, msg: `Cannot execute instance action`, payload: null });
        return;
    }

    let currentStatus = global.ENTITIES.findOne({ _id: data._id }).status;

    //stop task if instance is restarting or updating
    if (currentStatus > 1) {
        ack({ error: true, msg: `Cannot execute instance action`, payload: null });
        return;
    }

    let run = await runInstanceAction(data);
    if (run.error) {
        ack(run);
        return;
    }

    ack({ error: false, msg: "Instance action successfully executed", payload: null });
});

global.SE.on("instance:get", (data, ack) => {
    if (!data?._id) {
        ack({ error: true, msg: "Cannot get instance by id", payload: null });
        return;
    }

    let { _id } = data;
    let instance = global.ENTITIES.findOne({ type: "instance", _id });
    ack({ error: false, msg: "Fetched instance entity", payload: instance });
});

global.SE.on("instance:list", (ack) => {
    let instances = global.ENTITIES.findMany({ type: "instance" });
    instances.sort((a, b) => a.name < b.name ? -1 : 1);
    ack({ error: false, msg: "Fetched all instance entities", payload: instances });
});

global.SE.on("instance:delete", async (data, ack) => {
    if (!data?._id) {
        ack({ error: true, msg: "Cannot delete instance, no _id given.", payload: null });
        return;
    }

    let del = await deleteInstance(data, ack);
    if (del.error) {
        ack(del);
        return;
    }

    ack({ error: false, msg: "Instance successfully deleted", payload: null });
});