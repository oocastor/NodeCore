import cluster from "cluster";
import { cpus } from "os";
import dotenv from "dotenv";
dotenv.config();

const cores = cpus().length;

if (cluster.isPrimary) {
    //** MASTER */
    for (let i = 0; i < cores; i++) {
        cluster.fork();
    }

    global.sendToWorkers = (event, data) => {
        Object.values(cluster.workers).forEach((worker) => {
            worker.send(JSON.stringify({ event, data }));
        });
    }

    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died`);
        console.log('start new worker...');
        cluster.fork();
    });

    await import("./bin/setup.js");

    await import("./bin/database.js");
    await import("./bin/socket.js");

    await import("./helper/pm2.helper.js");

    await import("./listener/sysInfo.listener.js");
    await import("./listener/redirect.listener.js");
    await import("./listener/instance.listener.js");
    await import("./listener/utils.listener.js");

    await import("./utils/acme.js");
} else if (cluster.isWorker) {
    //** PROXY WORKER */
    await import("./bin/proxy.js");
}