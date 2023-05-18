import { listProcesses } from "../utils/pm2.js";
import { readFileWithMaxLines } from "./file.helper.js";

let pm2Data = [];

async function getPM2Data() {
    let path = global.CONFIG.findOne({ entity: "path" }).value;
    let list = await listProcesses();
    if (list.error) {
        console.error(list);
        return;
    }

    for (let l of list.payload) {
        if (global.ENTITIES.findOne({ _id: l.name })) {
            l.log = await readFileWithMaxLines(`${path}/${l.name}/${l.name}.log`, 100);
        }
    }

    pm2Data = list.payload;
}

setInterval(getPM2Data, global.CONFIG.findOne({ entity: "pm2UpdateInterval" }) || 2000);

async function addPM2Data(instance) {
    //find process data
    let pm2 = pm2Data.find(f => f.name == instance._id);

    if (pm2) {
        //transform monit data
        pm2.monit.memory = (pm2.monit.memory / (1024 * 1024 * 1024)).toFixed(2);

        return { ...instance, pm2 };
    }

    return instance;
}

export {
    addPM2Data
}