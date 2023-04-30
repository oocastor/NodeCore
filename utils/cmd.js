import { spawn } from "child_process";

function runCmd (data, cmd) {
    return new Promise((res, rej) => {
        let path = global.CONFIG.findOne({ entity: "path" }).value;

        let r = spawn(cmd, {shell: true, cwd: `${path}/${data._id}/`});

        r.on("close", (code) => {
            if(code !== 0) {
                rej({error: true, msg: `Error while executing the command: ${cmd}`, payload: null});
                return;
            }
            res({error: false, msg: `Command successfully executed`, payload: null});
        });
    });
}

export {
    runCmd
}