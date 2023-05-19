import { listProcesses } from "../utils/pm2.js";
import { readFileWithMaxLines } from "./file.helper.js";

async function syncPM2Data() {
    let path = global.CONFIG.findOne({ entity: "path" }).value;
    let list = await listProcesses();
    if (list.error) {
        console.error(list);
        return;
    }

    for (let l of list.payload) {
        let match = global.ENTITIES.findOne({ _id: l.name })
        if (match) {
            //get log data
            let log = await readFileWithMaxLines(`${path}/${l.name}/${l.name}.log`, 75);

            //transform monit data
            let monit = { memory: (l.monit.memory / (1024 * 1024 * 1024)).toFixed(2), cpu: l.monit.cpu };

            //change instance status
            let pm2Status = l.pm2_env.status;
            let status = null;

            if(match.status <= 1) {
                if(pm2Status == "online") {
                    status = 1;
                } else if(pm2Status == "stopped") {
                    status = 0;
                } else if(pm2Status == "errored") {
                    status = -1;
                }
            }

            if(status != null) global.ENTITIES.updateOne({ _id: l.name }, { status });

            match.pm2 = { monit, log };
        }
    }
}

setInterval(syncPM2Data, global.CONFIG.findOne({ entity: "pm2UpdateInterval" })?.value || 2000);