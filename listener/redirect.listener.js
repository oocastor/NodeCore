import { domainIsUnused, nameIsUnused } from "../utils/entities-promise.js";
import { createRedirect, updateRedirect, deleteRedirect } from "../modules/redirect.module.js";
import { hasAllProperties } from "../helper/object.helper.js";

global.SE.on("redirect:write", async (data, ack, id) => {
    if(!hasAllProperties(data, ["status", "name", "method", "network", "network.sub", "network.domain", "network.port"])) {
        ack({ error: true, msg: "Input data incomplete or invalid" });
        return;
    }

    let { _id, status, name, network, method } = data;

    //delete method prop
    delete data.method;

    let scopes = [];

    if (method == "CREATE") {
        scopes = [nameIsUnused(name), domainIsUnused(network.sub, network.domain)];
    } else if (method == "UPDATE") {
        let old = global.ENTITIES.findOne({ _id });
        global.log.bug('Bug! Cannot read properties of undefined => reading name (old ist undefined)')
        //name changed, add to scope
        if (old.name != name) scopes.push(nameIsUnused(name))
        //(sub)domain changed, add to scope
        else if (old.network.sub != network.sub
            || old.network.domain != network.domain) scopes.push(domainIsUnused(network.sub, network.domain));
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

            /** CREATE NEW REDIRECT */
            createRedirect(data, id).then((res) => ack(res)).catch((err) => ack(err));

        } else if (method == "UPDATE") {

            /** UPDATE EXISTING REDIRECT */
            updateRedirect(data, id).then((res) => ack(res)).catch((err) => ack(err));

        }
    }).catch((e) => global.log.error(e));
});

global.SE.on("redirect:list", (ack) => {
    let redirects = global.ENTITIES.findMany({ type: "redirect" });
    redirects.sort((a, b) => a.name < b.name ? -1 : 1);
    ack({ error: false, msg: "Fetched all redirect entities", payload: redirects });
});

global.SE.on("redirect:delete", (data, ack) => {
    if (!hasAllProperties(data, ["_id"])) {
        ack({ error: true, msg: "Cannot delete redirect, no _id given.", payload: null });
        return;
    }

    deleteRedirect(data).then((res) => ack(res));
});