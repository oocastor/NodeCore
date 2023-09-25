import cluster from "cluster";
import { cpus } from "os";
import dotenv from "dotenv";
import "./utils/logger.js";

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
    await import("./listener/database.listener.js");
    await import("./listener/worker.listener.js");

    await import("./utils/acme.js");

    await import("./bin/integrity.js");

    let restartWorkers = false;

    global.spawnWorkers = () => {
        restartWorkers = true;
        let workerCount = cores - Object.keys(cluster.workers).length;
        for (let i = 0; i < workerCount; i++) {
            cluster.fork({ WORKER_NAME: `Slave${i}`, WORKER_ID: i });
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

    cluster.on('message', (worker, message) => {
        global.SE.emit('worker:message', message)
      });

    cluster.on('exit', (worker, code, signal) => {
        global.log.info(`worker ${worker.process.pid} died`);
        if (restartWorkers) {
            global.log.info('start new worker...');
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
    //global.log = global.log.scope(process.env.WORKER_NAME);
    await import("./bin/proxy.js");
}