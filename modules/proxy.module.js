import Greenlock from "greenlock";
import { createProcess, deleteProcess, restartProcess } from "../utils/pm2.js";
import { v4 as uuidv4 } from 'uuid';

var greenlock;

async function initGreenlock(data) {
    // let data = {
    //     maintainerEmail: "schneider-jonas@mein.gmx",
    //     agreeToTerms: true,
    //     enabled: true
    // }

    data = data || global.CONFIG.findOne({ entity: "proxy" }).value;

    if (!data.enabled) {
        console.log("skipped greenlock init because proxy is not enabled")
        return;
    }

    let config = {
        maintainerEmail: data.maintainerEmail,
        packageRoot: process.cwd(),
        configDir: "./greenlock.d",
        agreeToTerms: true,
        staging: true,
    }

    greenlock = Greenlock.create(config);

    startProxyInstance(data).catch(err => console.error(err));
}

async function addOrUpdateDomain(_subdomain, _domain) {
    return new Promise(async (res, rej) => {
        if(!global.CONFIG.findOne({entity: "proxy"}).value.enabled) {
            return;
        }
        if (!greenlock) {
            initGreenlock();
        }

        let gm = greenlock.manager;

        let instances = global.ENTITIES.findMany({ type: "instance", network: { redirect: { domain: _domain } } }) || [];
        instances = instances.filter(f => f.network.redirect.sub != "@");
        instances = instances.map(m => m.network.redirect.sub);

        let redirects = global.ENTITIES.findMany({ type: "redirect", network: { domain: _domain } }) || [];
        redirects = redirects.filter(f => f.network.sub != "@");
        redirects = redirects.map(m => m.network.sub)

        let foundedSubdomains = [...instances, ...redirects];

        gm.add({
            subject: _domain,
            altnames: [_domain, ...foundedSubdomains.map(m => `${m}.${_domain}`)]
        }).then(() => {
            res({ error: false, msg: "Domain(s) added to greenlock instance, creating ssl certs hopefully", payload: null });
        }).catch((err) => {
            console.error(err);
            res({ error: true, msg: "Something went wrong with greenlock", payload: null });
        })
    });
}

function startProxyInstance(data) {
    return new Promise(async (res, rej) => {
        data.pid = data?.pid || uuidv4();

        let creation = await createProcess({ cwd: `${process.cwd()}/`, script: `processes/proxy.js`, name: data.pid });
        if (creation.error) {
            rej(creation);
            return;
        }

        global.CONFIG.updateOne({ entity: "proxy" }, { value: data });

        res({ error: false, msg: "proxy instance started", payload: null });
    });
}

function restartProxyInstance() {
    return new Promise(async (res, rej) => {
        let proxy = global.CONFIG.findOne({ entity: "proxy" }).value;

        if(!proxy.pid) {
            rej({ error: true, msg: "no proxy pid found", payload: null });
            return;
        }

        let restart = await restartProcess(proxy.pid);
        if (restart.error) {
            rej(restart);
            return;
        }

        res({ error: false, msg: "proxy instance restarted", payload: null });
    });
}

function stopProxyInstance() {
    return new Promise(async (res, rej) => {
        let proxy = global.CONFIG.findOne({ entity: "proxy" }).value;

        if(!proxy.pid) {
            rej({ error: true, msg: "no proxy pid found", payload: null });
            return;
        }

        let del = await deleteProcess(proxy.pid);
        console.log(del);
        if (del.error) {
            rej(del);
            return;
        }

        proxy.pid = "";

        global.CONFIG.updateOne({ entity: "proxy" }, { value: proxy });

        res({ error: false, msg: "proxy instance stopped.", payload: null });
    });
}

export {
    initGreenlock,
    addOrUpdateDomain,
    startProxyInstance,
    restartProxyInstance,
    stopProxyInstance
}