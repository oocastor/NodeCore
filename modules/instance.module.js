import { v4 as uuidv4 } from 'uuid';
import fs from "fs";

import { cloneRepo, pullRepo } from "../utils/git.js";
import { runCmd } from '../utils/cmd.js';

import { wait } from "../helper/wait.helper.js";
import { getPackageJSON, checkAndInstallModules } from '../helper/instance.helper.js';
import { isEqual, deepCopy } from '../helper/object.helper.js';

import { restartProcess, createProcess, stopProcess, deleteProcess } from '../utils/pm2.js';

import { addOrUpdateDomain } from '../utils/acme.js';

async function createInstance(data, id) {
    return new Promise(async (res, rej) => {

        //create uuid, ´cause
        data._id = uuidv4();
        global.logInteractive.await('[%d/7] start - create instance', 1)
        global.logInteractive.await('[%d/7] git clone - create instance', 2)
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
        global.logInteractive.await('[%d/7] npm install - create instance', 3)
        await checkAndInstallModules(data)
        
        data.script = data.script || packageJSON.payload.main;
        data.version = packageJSON.payload.version;
        data.pm2CreationDone = false;
        global.logInteractive.await('[%d/7] save instance data - create instance', 4)
        //insert new entity
        global.ENTITIES.insertOne({ type: "instance", ...data });

        //delete empty CMDs
        data.cmd = data.cmd.filter(f => f.replace(/ /g, "").length != 0);
        global.logInteractive.await('[%d/7] run cmds - create instance', 5)
        //run start CMDs (async)
        Promise.allSettled(data.cmd.map(m => runCmd(data, m)))
            .then((res) => {
                let errs = res.filter(f => f.status == "rejected").map(m => m.reason);

                if (errs.length) {
                    let msgs = errs.map(m => m.msg);
                    errs[0].msg = msgs;
                    global.emitToAllServers(id, "msg:get", errs[0])
                }
            });

            global.log.debug(data);
            global.logInteractive.await('[%d/7] create ssl certificates - create instance', 6)
        //create ssl certificates
        if (data.network.isAccessable) {
            addOrUpdateDomain(data.network.redirect.sub, data.network.redirect.domain).catch(err => {
                global.emitToAllServers(id, "msg:get", err)
                global.log.error(err);
                global.log2File.error(err)
            });
        }
        global.logInteractive.success('[%d/7] done - create instance', 7)
        res({ error: false, msg: `Instance successfully created` });
    });
}

function updateInstance(data, id) {
    return new Promise(async (res, rej) => {
        //save old entity
        let old = deepCopy(global.ENTITIES.findOne({ _id: data._id }));

        if (!old) {
            rej({ error: true, msg: "No instance to update found", payload: null });
            return;
        }

        //update entity
        global.ENTITIES.updateOne({ _id: data._id }, { ...data });

        //create ssl cert on network config change
        if (data.network.isAccessable && data.network.redirect.sub !== old.network.redirect.sub || data.network.redirect.domain !== old.network.redirect.domain) {
            addOrUpdateDomain(data.network.redirect.sub, data.network.redirect.domain).catch(err => {
                global.emitToAllServers(id, "msg:get", err)
                global.log.error(err);
            });
        }

        //run start cmds again
        if (!isEqual(data.cmd, old.cmd)) {
            //delete empty CMDs
            data.cmd = data.cmd.filter(f => f.replace(/ /g, "").length != 0);

            //run start CMDs (sync)
            await Promise.allSettled(data.cmd.map(m => runCmd(data, m)))
                .then((res) => {
                    let errs = res.filter(f => f.status == "rejected").map(m => m.reason);

                    if (errs.length) {
                        let msgs = errs.map(m => m.msg);
                        errs[0].msg = msgs;
                        global.emitToAllServers(id, "msg:get", errs[0])
                    }
                });
        }

        //restart instance if env vars, cmds or port changed
        if (old.status == 1 &&
            !isEqual(data.cmd, old.cmd)
            || !isEqual(data.env, old.env)
            || data.network.redirect.port !== old.network.redirect.port) {
            runInstanceAction({ _id: data._id, status: 1 }).then(() => {
            }).catch((err) => {
                global.emitToAllServers(id, "msg:get", err)
            });
        }

        res({ error: false, msg: "Instance updated", payload: null });
    });
}

async function runInstanceAction(data) {
    return new Promise(async (res, rej) => {
        let { status, _id } = data;

        if (status == 0) {
            /** STOP */

            let stop = await stopProcess(_id);
            if (stop.error) {
                rej(stop);
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
            //set port if instance is accessable
            if (instance.network.isAccessable) {
                env["PORT"] = instance.network.redirect.port;
            }
            global.log.debug({
                cwd: `${path}/${instance._id}/`, script: instance.script, name: instance._id, env,
                output: `${path}/${instance._id}/${instance._id}.log`, error: `${path}/${instance._id}/${instance._id}.log`
            })
            let creation = await createProcess({
                cwd: `${path}/${instance._id}/`, script: instance.script, name: instance._id, env,
                output: `${path}/${instance._id}/${instance._id}.log`, error: `${path}/${instance._id}/${instance._id}.log`
            });
            if (creation.error) {
                rej(creation);
                return;
            }

            instance.pm2CreationDone = true;

            //set status to running (1)
            global.ENTITIES.updateOne({ _id }, { status });
        } else if (status == 2) {
            /** RESTART */

            //restart instance
            let restart = await restartProcess(_id);
            if (restart.error) {
                rej(restart);
                return;
            }

            //set status to restarting (2)
            global.ENTITIES.updateOne({ _id }, { status });

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
                    rej(stop);
                    return;
                }
            }

            //pull repo
            let instance = global.ENTITIES.findOne({ _id });
            let pull = await pullRepo(instance._id);
            if (pull.error) {
                rej(pull);
                global.ENTITIES.updateOne({ _id }, { status: 0 });
                return;
            }

            //if instance was running, start them again
            if (prevStatus != 0) {
                let restart = await restartProcess(_id);
                if (restart.error) {
                    rej(restart);
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
                rej(del);
                // return;
            }
        }

        let path = global.CONFIG.findOne({ entity: "path" }).value;

        //delete instance directory
        fs.rm(`${path}/${_id}`, { recursive: true, force: true }, (err) => {
            if (err) {
                rej({ error: true, msg: "Cannot delete project files", payload: null });
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
    updateInstance,
    runInstanceAction,
    deleteInstance
}