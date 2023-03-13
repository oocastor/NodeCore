import pm2 from "pm2";

function listProcesses() {
    return new Promise((res, rej) => {
        pm2.connect((err) => {
            if (err) {
                res({ error: true, msg: "Cannot connect to pm2", payload: null});
                console.error(err);
                return;
            }
            pm2.list((err, list) => {
                if (err) {
                    res({ error: true, msg: "Cannot get instances list from pm2", payload: null });
                    console.error(err);
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
                res({ error: true, msg: "Cannot connect to pm2", payload: null});
                console.error(err);
                return;
            }
            pm2.start(data, (err) => {
                if (err) {
                    res({ error: true, msg: "Cannot get start node server with pm2", payload: null });
                    console.error(err);
                    return;
                }
                res({ error: false, msg: "Node server successfully started", payload: null });
            });
        });
    });
}

function stopProcess(pid) {
    return new Promise((res, rej) => {
        pm2.connect((err) => {
            if (err) {
                res({ error: true, msg: "Cannot connect to pm2", payload: null});
                console.error(err);
                return;
            }
            pm2.stop(pid, (err) => {
                if (err) {
                    res({ error: true, msg: "Cannot stop node server with pm2", payload: null });
                    console.error(err);
                    return;
                }
                res({ error: false, msg: "Node server successfully stopped", payload: null });
            });
        });
    });
}

function restartProcess(pid) {
    return new Promise((res, rej) => {
        pm2.connect((err) => {
            if (err) {
                res({ error: true, msg: "Cannot connect to pm2", payload: null});
                console.error(err);
                return;
            }
            pm2.stop(pid, (err) => {
                if (err) {
                    res({ error: true, msg: "Cannot restart pm2 process", payload: null });
                    console.error(err);
                    return;
                }
                res({ error: false, msg: "Node server successfully restarted", payload: null });
            });
        });
    });
}

function deleteProcess(pid) {
    return new Promise((res, rej) => {
        pm2.connect((err) => {
            if (err) {
                res({ error: true, msg: "Cannot connect to pm2", payload: null});
                console.error(err);
                return;
            }
            pm2.stop(pid, (err) => {
                if (err) {
                    res({ error: true, msg: "Cannot delete pm2 process", payload: null });
                    console.error(err);
                    return;
                }
                res({ error: false, msg: "Process successfully deleted", payload: null });
            });
        });
    });
}

export {
    listProcesses,
    createProcess,
    stopProcess,
    restartProcess,
    deleteProcess,
}