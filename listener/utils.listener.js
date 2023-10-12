import fs from "fs";

import { getUnusedPort } from "../utils/entities.js";
import { getUserRepos } from "../utils/github.js";
import { deleteUser, createNewUser } from "../bin/auth.js";
import { hasAllProperties } from "../helper/object.helper.js";
import { updateDomainCerts } from "../utils/acme.js";

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
    if(!hasAllProperties(data, ["enabled", "maintainerEmail"])) {
        ack({ error: true, msg: "Cannot change proxy configuration - input data incomplete", payload: null });
        return;
    }

    if(data.enabled) {
        global.spawnWorkers();
    } else {
        global.killAllWorkers();
    }

    global.CONFIG.updateOne({ entity: "proxy" }, { value: data });

    ack({ error: false, msg: "Proxy configuration updated", payload: null });
});

global.SE.on("proxy:updateCerts", async (data, ack, id) => {
    updateDomainCerts(data.force).catch((err) => {
        global.emitToAllServers(id, "msg:get", err)
        global.log2File.error(err)
        global.log.error(err);
    });
    ack({ error: false, msg: "Cert-Update triggered", payload: null});
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

global.SE.on("network:ready", async (ack) => {
    let proxy = global.CONFIG.findOne({ entity: "proxy" }).value.enabled;
    let domains = global.CONFIG.findOne({ entity: "domains" }).value.length > 0;
    ack({ error: false, msg: "Checked network status", payload: proxy && domains });
});

global.SE.on("tags:add", async (data, ack) => {
    if(!hasAllProperties(data, ["tag"])) {
        ack({ error: true, msg: "Cannot add empty tag", payload: null });
        return;
    }

    let tags = global.CONFIG.findOne({ entity: "tags" }).value;

    if(tags.includes(data.tag)) {
        ack({ error: true, msg: "Tag already exists", payload: null });
        return;
    }

    global.CONFIG.updateOne({ entity: "tags" }, { value: [...tags, data.tag] });

    ack({ error: false, msg: "New tag saved", payload: null });
});

global.SE.on("tags:get", async (ack) => {
    let tags = global.CONFIG.findOne({ entity: "tags" }).value;
    ack({ error: false, msg: "Fetched tags", payload: tags });
});

global.SE.on("tags:delete", async (data, ack) => {
    if(!hasAllProperties(data, ["tag"])) {
        ack({ error: true, msg: "Cannot delete tag", payload: null });
        return;
    }

    //remove tag from all instances
    global.ENTITIES.findMany({ type : "instance" })
    .forEach(inst => inst.tags = inst.tags.filter(f => f !== data.tag));

    let tags = global.CONFIG.findOne({ entity: "tags" }).value;

    global.CONFIG.updateOne({ entity: "tags" }, { value: tags.filter(f => f !== data.tag) });

    ack({ error: false, msg: "Tag deleted", payload: null });
});

global.SE.on("tracking:get", async (ack) => {
    let { value } = global.CONFIG.findOne({ entity: "tracking" });
    ack({ error: false, msg: "Tracking status fetched", payload: value });
});

global.SE.on("tracking:set", async (data, ack) => {
    if(!hasAllProperties(data, ["enabled", "anonymiseIP", "saveDays"])) {
        ack({ error: true, msg: "Cannot change tracking settings", payload: null });
        return;
    }

    global.CONFIG.updateOne({ entity: "tracking" }, { value: data });
    ack({ error: false, msg: "Tracking settings changed", payload: null });
});