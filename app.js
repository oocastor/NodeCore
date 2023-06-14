import cluster from "cluster";
import { cpus } from "os";
import dotenv from "dotenv";
dotenv.config();

const cores = cpus().length;

if (cluster.isPrimary) {
    //** MASTER */

    await import("./bin/setup.js");

    await import("./bin/database.js");
    await import("./bin/socket.js");

    await import("./helper/pm2.helper.js");

    await import("./listener/sysInfo.listener.js");
    await import("./listener/redirect.listener.js");
    await import("./listener/instance.listener.js");
    await import("./listener/utils.listener.js");

    await import("./utils/acme.js");

    let restartWorkers = false;

    global.spawnWorkers = () => {
        restartWorkers = true;
        let workerCount = cores - Object.keys(cluster.workers).length;
        for (let i = 0; i < workerCount; i++) {
            cluster.fork();
        }
    }

    global.killAllWorkers = () => {
        restartWorkers = false;
        Object.values(cluster.workers).forEach((worker) => {
            worker.kill();
        });
    }

    global.sendToWorkers = (event, data) => {
        Object.values(cluster.workers).forEach((worker) => {
            worker.send(JSON.stringify({ event, data }));
        });
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
        if (restartWorkers) {
            console.log('start new worker...');
            cluster.fork();
        }
    });

    //start workers if proxy is enabled
    let proxy = global.CONFIG.findOne({ entity: "proxy" });

    if (proxy.value.enabled) {
        global.spawnWorkers();
    }

} else if (cluster.isWorker) {
    //** PROXY WORKER */
    await import("./bin/proxy.js");
}