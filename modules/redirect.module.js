import { addOrUpdateDomain } from '../utils/acme.js';
import { deepCopy } from '../helper/object.helper.js';
import { v4 as uuidv4 } from 'uuid';
function createRedirect(data, id) {
    return new Promise((res, rej) => {
        // *** INSERT NEW ENTITY ***
        data._id = uuidv4();
        global.ENTITIES.insertOne({ type: "redirect", ...data });
        // *** CREATE SSL CERT ***
        addOrUpdateDomain(data.network.sub, data.network.domain).catch(err => {
            global.emitToAllServers(id, "msg:get", err)
            global.log.error(err);
        });

        res({ error: false, msg: "Redirect created", payload: null });
    });
}

function updateRedirect(data, id) {
    return new Promise((res, rej) => {

        // *** SAVE OLD ENTITY ***
        let old = deepCopy(global.ENTITIES.findOne({ _id: data._id }));

        if (!old) {
            rej({ error: true, msg: "No redirect to update found", payload: null });
            return;
        }

        // *** UPDATE ENTITY ***
        global.ENTITIES.updateOne({ _id: data._id }, { ...data });

        // *** CREATE SSL CERT AND RELOAD PROXY ***
        if (data.network.sub !== old.network.sub || data.network.domain !== old.network.domain) {
            addOrUpdateDomain(data.network.sub, data.network.domain).catch(err => {
                global.emitToAllServers(id, "msg:get", err)
                global.log.error(err);
            });
        }

        res({ error: false, msg: "Redirect updated", payload: null });
    });
}

function deleteRedirect(data) {
    return new Promise((res, rej) => {
        let { _id } = data;
        global.ENTITIES.deleteOne({ _id });
        res({ error: false, msg: "Redirect successfully deleted", payload: null });
    });
}

export {
    createRedirect,
    updateRedirect,
    deleteRedirect
}