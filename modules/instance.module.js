import { v4 as uuidv4 } from 'uuid';
import fs from "fs";

import { cloneRepo, pullRepo } from "../utils/git.js";
import { wait } from "../helper/wait.helper.js";
import { getPackageJSON } from '../helper/instance.helper.js';
import { restartProcess, createProcess, stopProcess } from '../utils/pm2.js';

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

        //get start script via package.json
        let packageJSON = await getPackageJSON(data);
        if (packageJSON.error) {
            ack(packageJSON);
            deleteInstance(data);
            return;
        }

        data.script = packageJSON.payload.main;
    }

    //insert new entity
    global.ENTITIES.insertOne({ type: "instance", ...data });

    //TODO: reload proxy

    ack({ error: false, msg: `Instance successfully ${!update ? "created" : "updated"}` });
}

async function runInstanceAction(data) {
    return new Promise(async (res, rej) => {
        let { status, _id } = data;

        if (status == 0) {
            /** STOP */

            let stop = await stopProcess(_id);
            if (stop.error) {
                res(stop);
                return;
            }

            //set status to stopped (0)
            global.ENTITIES.updateOne({ _id }, { status });
        } else if (status == 1) {
            /** START */

            let path = global.CONFIG.findOne({ entity: "path" }).value;
            let instance = global.ENTITIES.findOne({ _id });

            let creation = await createProcess({ cwd: `${path}/${instance._id}/`, script: instance.script, name: instance._id });
            if (creation.error) {
                res(creation);
                return;
            }

            //set status to running (1)
            global.ENTITIES.updateOne({ _id }, { status });
        } else if (status == 2) {
            /** RESTART */

            //set status to restarting (2)
            global.ENTITIES.updateOne({ _id }, { status });

            //restart instance
            let restart = await restartProcess(_id);
            if (restart.error) {
                res(restart);
                return;
            }

            await wait(2000);

            //change status back to running (1)
            global.ENTITIES.updateOne({ _id }, { status: 1 });

        } else if (status == 3) {
            /** UPDATE */

            let prevStatus = global.ENTITIES.findOne({ _id }).status;

            //set status to updating (3)
            global.ENTITIES.updateOne({ _id }, { status });

            //stop instance
            let stop = await stopProcess(_id);
            if (stop.error) {
                res(stop);
                return;
            }

            //pull repo
            let instance = global.ENTITIES.findOne({ _id });
            let pull = await pullRepo(instance._id);
            if (pull.error) {
                res(pull);
                global.ENTITIES.updateOne({ _id }, { status: 0 });
                return;
            }

            //if instance was running, start them again
            if (prevStatus != 0) {
                let restart = await restartProcess(_id);
                if (restart.error) {
                    res(restart);
                    return;
                }

                await wait(2000);
            }

            //change status back
            global.ENTITIES.updateOne({ _id }, { status: prevStatus });
        }

        res({ error: false, msg: "Action executed", payload: null });
    });
}

async function deleteInstance(data, ack) {
    let { _id } = data;

    //stop instance in pm2

    //TODO: pm2 integration

    let path = global.CONFIG.findOne({ entity: "path" }).value;

    //delete instance directory
    fs.rmSync(`${path}/${_id}`, { recursive: true, force: true });

    global.ENTITIES.deleteOne({ _id });
}

export {
    createInstance,
    runInstanceAction,
    deleteInstance
}