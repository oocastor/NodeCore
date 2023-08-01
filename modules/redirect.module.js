import { addOrUpdateDomain } from '../utils/acme.js';
import { isEqual, deepCopy } from '../helper/object.helper.js';

function createRedirect(data, id) {
    return new Promise((res, rej) => {
        //insert new entity
        global.ENTITIES.insertOne({ type: "redirect", ...data });
        //create ssl cert
        addOrUpdateDomain(data.network.sub, data.network.domain).catch(err => {
            global.IO.to(id).emit("msg:get", err);
            global.log.error(err);
        });

        res({ error: false, msg: "Redirect created", payload: null });
    });
}

function updateRedirect(data, id) {
    return new Promise((res, rej) => {

        //save old entity
        let old = deepCopy(global.ENTITIES.findOne({ _id: data._id }));

        if (!old) {
            rej({ error: true, msg: "No redirect to update found", payload: null });
            return;
        }

        //update entity
        global.ENTITIES.updateOne({ _id: data._id }, { ...data });

        //create ssl cert on network config change
        if (data.network.sub !== old.network.sub || data.network.domain !== old.network.domain) {
            addOrUpdateDomain(data.network.sub, data.network.domain).catch(err => {
                global.IO.to(id).emit("msg:get", err);
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