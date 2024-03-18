import { domainIsUnused, nameIsUnused, portIsUnused } from "../utils/entities-promise.js";
import { createInstance, updateInstance, deleteInstance, runInstanceAction } from "../modules/instance.module.js";

import { hasAllProperties } from "../helper/object.helper.js";

global.SE.on("instance:write", async (data, ack, id) => {
    if (!hasAllProperties(data, ["status", "name", "env", "cmd", "git", "network", "network.isAccessable", "method"])
        || data.network.isAccessable == true && !hasAllProperties(data, ["network.redirect", "network.redirect.sub", "network.redirect.domain", "network.redirect.port"])) {
        ack({ error: true, msg: "Input data incomplete or invalid" });
        return;
    }

    let { _id, status, name, git, network, cmd, env, method } = data;

    //delete method prop
    delete data.method;

    //delete pm2 data
    delete data.pm2;

    let scopes = [];

    if (method == "CREATE") {
        scopes.push(nameIsUnused(name));
        if (network.isAccessable) scopes = scopes.concat([portIsUnused(network.redirect.port), domainIsUnused(network.redirect.sub, network.redirect.domain)]);
    } else if (method == "UPDATE") {
        let old = global.ENTITIES.findOne({ _id });

        //name changed, add to scope
        if (old.name != name) scopes.push(nameIsUnused(name))
        //port changed, add to scope
        else if (old.network.redirect.port != network.redirect.port) scopes.push(portIsUnused(network.redirect.port))
        //(sub)domain changed, add to scope
        else if (old.network.redirect.sub != network.redirect.sub
            || old.network.redirect.domain != network.redirect.domain) scopes.push(domainIsUnused(network.redirect.sub, network.redirect.domain));
    }


    if (!network.isAccessable) {
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

        if (method == "CREATE") {

            /** CREATE NEW PROCESS */
            createInstance(data, id).then((res) => ack(res)).catch((err) => ack(err));

        } else if (method == "UPDATE") {

            //delete status prop
            delete data.status;

            /** UPDATE EXISTING PROCESS */
            updateInstance(data, id).then((res) => ack(res)).catch((err) => ack(err));

        }
    }).catch((e) => global.log.error(e));
});

global.SE.on("instance:action", async (data, ack) => {
    if (!hasAllProperties(data, ["_id", "status"])) {
        ack({ error: true, msg: `Cannot execute instance action`, payload: null });
        return;
    }

    let currentStatus = global.ENTITIES.findOne({ _id: data._id }).status;

    //stop task if instance is restarting or updating
    if (currentStatus > 1) {
        ack({ error: true, msg: `Cannot execute instance action`, payload: null });
        return;
    }

    /** RUN INSTANCE ACTION */
    runInstanceAction(data).then(res => ack(res)).catch(err => ack(err));
});

global.SE.on("instance:get", async (data, ack) => {
    if (!hasAllProperties(data, ["_id"])) {
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

global.SE.on("instance:delete", (data, ack) => {
    if (!hasAllProperties(data, ["_id"])) {
        ack({ error: true, msg: "Cannot delete instance, no _id given.", payload: null });
        return;
    }

    /** DELETE INSTANCE */
    deleteInstance(data, ack).then(res => ack(res)).catch(err => ack(err));
});