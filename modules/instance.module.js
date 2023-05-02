import { v4 as uuidv4 } from 'uuid';
import fs from "fs";

import { cloneRepo, pullRepo } from "../utils/git.js";
import { runCmd } from '../utils/cmd.js';

import { wait } from "../helper/wait.helper.js";
import { getPackageJSON } from '../helper/instance.helper.js';

import { restartProcess, createProcess, stopProcess, deleteProcess } from '../utils/pm2.js';

async function createInstance(data, id) {
    return new Promise(async (res, rej) => {

        //create uuid, ´cause
        data._id = uuidv4();

        //clone git repo
        let clone = await cloneRepo(data.git, data._id);
        if (clone.error) {
            rej(clone);
            //interrupt creation process
            return;
        }

        //get start script via package.json
        let packageJSON = getPackageJSON(data);
        if (packageJSON.error) {
            rej(packageJSON);
            //delete instance directory
            let path = global.CONFIG.findOne({ entity: "path" }).value;
            fs.rmSync(`${path}/${data._id}`, { recursive: true, force: true });
            //interrupt creation process
            return;
        }

        data.script = packageJSON.payload.main;
        data.version = packageJSON.payload.version;
        data.pm2CreationDone = false;


        //insert new entity
        global.ENTITIES.insertOne({ type: "instance", ...data });

        //delete empty CMDs
        data.cmd = data.cmd.filter(f => f.replace(/ /g, "").length != 0);

        //run start CMDs (async)
        Promise.allSettled(data.cmd.map(m => runCmd(data, m)))
            .then((res) => {
                let errs = res.filter(f => f.status == "rejected").map(m => m.reason);

                if (errs.length) {
                    let msgs = errs.map(m => m.msg);
                    errs[0].msg = msgs;
                    global.IO.to(id).emit("msg:get", errs[0]);
                }
            });

        //TODO: reload proxy

        res({ error: false, msg: `Instance successfully created` });
    });

    // let update = data._id != undefined;

    // if (!data._id) {
    //     data._id = uuidv4();
    //     //clone git repo
    //     let clone = await cloneRepo(data.git, data._id);
    //     if (clone.error) {
    //         ack(clone);
    //         return;
    //     }

    //     //get start script via package.json
    //     let packageJSON = getPackageJSON(data);
    //     if (packageJSON.error) {
    //         ack(packageJSON);

    //         //delete instance directory
    //         let path = global.CONFIG.findOne({ entity: "path" }).value;
    //         fs.rmSync(`${path}/${data._id}`, { recursive: true, force: true });

    //         return;
    //     }

    //     data.script = packageJSON.payload.main;
    //     data.version = packageJSON.payload.version;
    //     data.pm2CreationDone = false;
    // }

    // //insert new entity
    // global.ENTITIES.insertOne({ type: "instance", ...data });

    // //delete empty CMDs
    // data.cmd = data.cmd.filter(f => f.replace(/ /g, "").length != 0);

    // //run start CMDs
    // await Promise.all(data.cmd.map(m => runCmd(data, m)))
    //     .then((res) => {
    //         res.forEach(r => {
    //             if (r.error) ack(r);
    //         })
    //     })
    //     .catch((e) => {
    //         console.error(e);
    //     });

    // //TODO: reload proxy

    // ack({ error: false, msg: `Instance successfully ${!update ? "created" : "updated"}` });
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

            let env = instance.env.reduce((acc, str) => {
                const [key, value] = str.split("=");
                acc[key] = value;
                return acc;
            }, {});

            let creation = await createProcess({ cwd: `${path}/${instance._id}/`, script: instance.script, name: instance._id, env });
            if (creation.error) {
                res(creation);
                return;
            }

            instance.pm2CreationDone = true;

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

            //set status to running (1)
            global.ENTITIES.updateOne({ _id }, { status: 1 });

        } else if (status == 3) {
            /** UPDATE */

            let prevStatus = global.ENTITIES.findOne({ _id }).status;

            //set status to updating (3)
            global.ENTITIES.updateOne({ _id }, { status });

            if (prevStatus != 0) {
                //stop instance
                let stop = await stopProcess(_id);
                if (stop.error) {
                    res(stop);
                    return;
                }
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

function deleteInstance(data) {
    return new Promise(async (res, rej) => {
        let { _id } = data;

        let instance = global.ENTITIES.findOne({ _id });

        //delete instance in pm2
        if (instance.pm2CreationDone) {
            let del = await deleteProcess(_id);
            if (del.error) {
                res(del);
                // return;
            }
        }

        let path = global.CONFIG.findOne({ entity: "path" }).value;

        //delete instance directory
        fs.rm(`${path}/${_id}`, { recursive: true, force: true }, (err) => {
            if (err) {
                res({ error: true, msg: "Cannot delete project files", payload: null });
                // return;
            }

            //delete instance in DB
            global.ENTITIES.deleteOne({ _id });

            res({ error: false, msg: "Instance deleted", payload: null });
        });
    });
}

export {
    createInstance,
    runInstanceAction,
    deleteInstance
}