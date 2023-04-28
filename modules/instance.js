import { v4 as uuidv4 } from 'uuid';
import fs from "fs";

import { cloneRepo, pullRepo } from "../utils/git.js";
import { wait } from "../helper/wait.js";

async function createInstance(data, ack) {
    let update = data._id != undefined;

    if (!data._id) {
        data._id = uuidv4();
        //clone git repo
        let clone = await cloneRepo(data.git, data._id);
        if (clone.error) {
            ack(clone);
            return;
        }
    } else {
        //update git repo
        let pull = await pullRepo(data._id);
        if (pull.error) {
            ack(pull);
            return;
        }
    }
    //insert new entity
    global.ENTITIES.insertOne({ type: "instance", ...data });

    //TODO: reload proxy

    ack({ error: false, msg: `Instance successfully ${!update ? "created" : "updated"}` });
}

async function runInstanceAction(data, ack) {
    let { status, _id } = data;

    if (status == 0) {
        /** STOP */

        //TODO: stop instance via pm2

        await wait(1000);

        //set status to stopped (0)
        global.ENTITIES.updateOne({ _id }, { status });
    } else if (status == 1) {
        /** START */

        //TODO: start instance via pm2

        await wait(1000);

        //set status to running (1)
        global.ENTITIES.updateOne({ _id }, { status });
    } else if (status == 2) {
        /** RESTART */

        //set status to restarting (2)
        global.ENTITIES.updateOne({ _id }, { status });

        //TODO: restart instance via pm2

        //finish? -> change status back to running (1)
        await wait(5000);
        global.ENTITIES.updateOne({ _id }, { status: 1 });
    } else if (status == 3) {
        /** UPDATE */

        //set status to updating (3)
        global.ENTITIES.updateOne({ _id }, { status });

        //stop instance

        //TODO: stop instance via pm2

        //pull repo
        let instance = global.ENTITIES.findOne({ _id });
        let pull = await pullRepo(instance._id);
        if (pull.error) {
            ack(pull);
            global.ENTITIES.updateOne({ _id }, { status: 0 });
            return;
        }

        //start instance

        //TODO: start instance via pm2

        await wait(5000);

        //finish? -> change status back to running (1)
        global.ENTITIES.updateOne({ _id }, { status: 1 });
    }
}

async function deleteInstance(data, ack) {
    let { _id } = data;

    //stop instance in pm2

    //TODO: pm2 integration

    let dir = global.ENTITIES.findOne({ _id })._id;
    let path = global.CONFIG.findOne({ entity: "path" }).value;

    //delete instance directory
    fs.rmSync(`${path}/${dir}`, { recursive: true, force: true });

    global.ENTITIES.deleteOne({ _id });
}

export {
    createInstance,
    runInstanceAction,
    deleteInstance
}