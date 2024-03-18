import pm2 from "pm2";
import { spawn } from "child_process";

function listProcesses() {
    return new Promise((res, rej) => {
        pm2.connect((err) => {
            if (err) {
                res({ error: true, msg: "Cannot connect to pm2", payload: null });
                global.log.error(err);
                pm2.disconnect();
                return;
            }
            pm2.list((err, list) => {
                pm2.disconnect();
                if (err) {
                    res({ error: true, msg: "Cannot get instances list from pm2", payload: null });
                    global.log.error(err);
                    return;
                }
                res({ error: false, msg: "Instances list fetched from pm2", payload: list });
            });
        });
    });
}

function createProcess(data) {
    return new Promise((res, rej) => {
        pm2.connect((err) => {
            if (err) {
                res({ error: true, msg: "Cannot connect to pm2", payload: null });
                global.log.error(err);
                pm2.disconnect();
                return;
            }
            pm2.start(data, async (err) => {
                pm2.disconnect();
                if (err) {
                    res({ error: true, msg: "Cannot start node instance with pm2", payload: null });
                    global.log.error(err);
                    return;
                }
                res({ error: false, msg: "Node instance successfully started", payload: null });

                saveProcessList();
            });
        });
    });
}

function stopProcess(pid) {
    return new Promise((res, rej) => {
        pm2.connect((err) => {
            if (err) {
                res({ error: true, msg: "Cannot connect to pm2", payload: null });
                global.log.error(err);
                pm2.disconnect();
                return;
            }
            pm2.stop(pid, (err) => {
                pm2.disconnect();
                if (err) {
                    res({ error: true, msg: "Cannot stop node server with pm2", payload: null });
                    global.log.error(err);
                    return;
                }
                res({ error: false, msg: "Node server successfully stopped", payload: null });

                //save pm2 list
                saveProcessList();
            });
        });
    });
}

function restartProcess(pid) {
    return new Promise((res, rej) => {
        pm2.connect((err) => {
            if (err) {
                res({ error: true, msg: "Cannot connect to pm2", payload: null });
                global.log.error(err);
                pm2.disconnect();
                return;
            }
            pm2.restart(pid, (err) => {
                pm2.disconnect();
                if (err) {
                    res({ error: true, msg: "Cannot restart pm2 process", payload: null });
                    global.log.error(err);
                    return;
                }
                res({ error: false, msg: "Node instance successfully restarted", payload: null });
            });
        });
    });
}

function deleteProcess(pid) {
    return new Promise((res, rej) => {
        pm2.connect((err) => {
            if (err) {
                res({ error: true, msg: "Cannot connect to pm2", payload: null });
                global.log.error(err);
                pm2.disconnect();
                return;
            }
            pm2.delete(pid, (err) => {
                pm2.disconnect();
                if (err) {
                    res({ error: true, msg: "Cannot delete pm2 process", payload: null });
                    global.log.error(err);
                    return;
                }
                res({ error: false, msg: "Process successfully deleted", payload: null });
                //save pm2 list
                saveProcessList();
            });
        });
    });
}

function saveProcessList() {
    let cmd = spawn("pm2 save", { shell: true });

    cmd.on("close", (code) => {
        if (code !== 0) {
            global.log.error({ error: true, msg: `Error while executing the command: pm2 save`, payload: null });
            return;
        }
    });
}

export {
    listProcesses,
    createProcess,
    stopProcess,
    restartProcess,
    deleteProcess,
}