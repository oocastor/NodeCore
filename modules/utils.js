import { getUnusedPort } from "../wrapper/entities.js";
import { getUserRepos } from "../wrapper/github.js";
import { deleteUser, createNewUser } from "../bin/auth.js";

global.SE.on("path:get", async (ack) => {
    let { value } = await global.CONFIG.findOne({ entity: "path" });
    ack({ error: false, msg: "Path successfully fetched", payload: value });
});

global.SE.on("path:set", async (data, ack) => {
    if(!data?.path) {
        ack({ error: true, msg: "Cannot change path - input incomplete.", payload: null });
        return;
    }
    if (await global.ENTITIES.findOne({ type: "instance" })) {
        ack({ error: true, msg: "Cannot change path - there are already running intances!", payload: null });
        return;
    }
    let { path } = data;
    await global.CONFIG.updateOne({ entity: "path" }, { value: path });
    ack({ error: false, msg: "Path successfully changed", payload: null });
});

global.SE.on("account:set", async (data, ack) => {
    if(!data?.user || !data?.pwd) {
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
    let { value } = JSON.parse(JSON.stringify(await global.CONFIG.findOne({ entity: "github" }))); //deep copy element
    value.pat = value.pat && "hehe got u, no token to see here :P";
    ack({ error: false, msg: "Gihtub account data successfully fetched", payload: value });
});

global.SE.on("github:set", async (data, ack) => {
    await global.CONFIG.updateOne({ entity: "github" }, { value: data });
    ack({ error: false, msg: "Github account data has been changed", payload: null });
});

global.SE.on("github:repos", async (ack) => {
    let repos = await getUserRepos();
    if(!repos.length) {
        ack({ error: true, msg: "No github user repos found", payload: null });
        return;
    }
    ack({ error: false, msg: "Github user repos fetched", payload: repos });
});

global.SE.on("domain:add", async (data, ack) => {
    let { domain } = data;
    let { value } = await global.CONFIG.findOne({ entity: "domains" });
    value.push(domain);
    await global.CONFIG.updateOne({ entity: "domains" }, { value });
    ack({ error: false, msg: "New domain successfully added", payload: null });
})

global.SE.on("domain:delete", async (data, ack) => {
    let { domain } = data;
    let { value } = await global.CONFIG.findOne({ entity: "domains" });
    value = value.filter(f => f !== domain);
    await global.CONFIG.updateOne({ entity: "domains" }, { value });
    ack({ error: false, msg: "Domain successfully deleted", payload: null });
})

global.SE.on("domain:list", async (ack) => {
    let { value } = await global.CONFIG.findOne({ entity: "domains" });
    ack({ error: false, msg: "Fetched available domains", payload: value });
})

global.SE.on("port:get", async (ack) => {
    ack({ error: false, msg: "Unused port created", payload: await getUnusedPort() });
});