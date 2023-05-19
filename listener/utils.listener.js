import fs from "fs";

import { getUnusedPort } from "../utils/entities.js";
import { getUserRepos } from "../utils/github.js";
import { deleteUser, createNewUser } from "../bin/auth.js";
import { hasAllProperties } from "../helper/object.helper.js";
import { initGreenlock, stopProxyInstance } from "../modules/proxy.module.js";

global.SE.on("path:get", async (ack) => {
    let { value } = global.CONFIG.findOne({ entity: "path" });
    ack({ error: false, msg: "Path successfully fetched", payload: value });
});

global.SE.on("path:set", async (data, ack) => {
    if (!data?.path) {
        ack({ error: true, msg: "Cannot change path - input incomplete.", payload: null });
        return;
    }
    if (global.ENTITIES.findOne({ type: "instance" })) {
        ack({ error: true, msg: "Cannot change path - there are already running intances!", payload: null });
        return;
    }

    let { path } = data;

    //create dir
    if (!fs.existsSync(path)) fs.mkdirSync(path);

    //change path
    global.CONFIG.updateOne({ entity: "path" }, { value: path });

    ack({ error: false, msg: "Path successfully changed", payload: null });
});

global.SE.on("account:set", async (data, ack) => {
    if (!data?.user || !data?.pwd) {
        ack({ error: true, msg: "Cannot change login data - input incomplete.", payload: null });
        return;
    }
    //TODO: multiple user management
    let { user, pwd } = data;
    let oldUser = global.USERS.findMany()[0];
    await deleteUser(oldUser._id);
    await createNewUser(user, pwd);
    ack({ error: false, msg: "Login data successfully changed", payload: null });
});

global.SE.on("github:get", async (ack) => {
    let { value } = JSON.parse(JSON.stringify(global.CONFIG.findOne({ entity: "github" }))); //deep copy element
    value.pat = value.pat && "hehe got u, no token to see here :P";
    ack({ error: false, msg: "Gihtub account data successfully fetched", payload: value });
});

global.SE.on("github:set", async (data, ack) => {
    global.CONFIG.updateOne({ entity: "github" }, { value: data });
    ack({ error: false, msg: "Github account data has been changed", payload: null });
});

global.SE.on("github:repos", async (ack) => {
    let repos = await getUserRepos();
    if (!repos.length) {
        ack({ error: true, msg: "No github user repos found", payload: null });
        return;
    }
    ack({ error: false, msg: "Github user repos fetched", payload: repos });
});

global.SE.on("proxy:get", async (ack) => {
    let proxy = global.CONFIG.findOne({ entity: "proxy" }).value;
    ack({ error: false, msg: "Proxy configuration fetched", payload: proxy });
});

global.SE.on("proxy:set", async (data, ack) => {
    if(!hasAllProperties(data, ["enabled", "maintainerEmail", "cluster", "workers"])) {
        ack({ error: true, msg: "Cannot change proxy configuration - input data incomplete", payload: null });
        return;
    }

    //init greenlock
    if(data.enabled) initGreenlock(data)
    else await stopProxyInstance().catch((err) => ack(err));

    ack({ error: false, msg: "Proxy configuration updated", payload: null });
});

global.SE.on("domain:add", async (data, ack) => {
    if (!data.domain) {
        ack({ error: true, msg: "Cannot add domain - input data incomplete", payload: null });
        return;
    }
    let { domain } = data;
    let { value } = global.CONFIG.findOne({ entity: "domains" });
    value.push(domain);
    global.CONFIG.updateOne({ entity: "domains" }, { value });
    ack({ error: false, msg: "New domain successfully added", payload: null });
})

global.SE.on("domain:delete", async (data, ack) => {
    let { domain } = data;
    let { value } = global.CONFIG.findOne({ entity: "domains" });
    value = value.filter(f => f !== domain);
    global.CONFIG.updateOne({ entity: "domains" }, { value });
    ack({ error: false, msg: "Domain successfully deleted", payload: null });
})

global.SE.on("domain:list", async (ack) => {
    let { value } = global.CONFIG.findOne({ entity: "domains" });
    ack({ error: false, msg: "Fetched available domains", payload: value });
})

global.SE.on("port:get", async (ack) => {
    ack({ error: false, msg: "Unused port created", payload: await getUnusedPort() });
});