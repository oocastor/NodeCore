import { getUnusedPort } from "../wrapper/entities.js";

global.SE.on("github:get", async (ack) => {
    let { value } = await global.CONFIG.findOne({ entity: "github" });
    value.pat = value.pat && "hehe got u, no token to see here :P";
    ack({error: false, msg: "Gihtub account data successfully fetched", payload: value});
});

global.SE.on("github:set", async (data, ack) => {
    await global.CONFIG.updateOne({ entity: "github" }, { value: data });
    ack({error: false, msg: "Github account data has been changed", payload: null});
});

global.SE.on("domain:add", async (data, ack) => {
    let { domain } = data;
    let { value } = await global.CONFIG.findOne({ entity: "domains" });
    value.push(domain);
    await global.CONFIG.updateOne({ entity: "domains" }, { value });
    ack({error: false, msg: "New domain successfully added", payload: null});
})

global.SE.on("domain:delete", async (data, ack) => {
    let { domain } = data;
    let { value }= await global.CONFIG.findOne({ entity: "domains" });
    value = value.filter(f => f !== domain);
    await global.CONFIG.updateOne({ entity: "domains" }, { value });
    ack({error: false, msg: "Domain successfully deleted", payload: null});
})

global.SE.on("domain:list", async (ack) => {
    let { value } = await global.CONFIG.findOne({ entity: "domains" });
    ack({error: false, msg: "Fetched available domains", payload: value });
})

global.SE.on("port:get", async (ack) => {
    ack({error: false, msg: "Unused port created", payload: await getUnusedPort()});
});