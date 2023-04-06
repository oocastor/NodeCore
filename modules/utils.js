import { getUnusedPort } from "../wrapper/entities.js";

global.SE.on("domain:add", async (data, ack) => {
    let { domain } = data;
    let { value } = await global.STORAGE.findOne({ entity: "domains" });
    value.push(domain);
    await global.STORAGE.updateOne({ entity: "domains" }, { value });
    ack({error: false, msg: "New domain successfully added", payload: null})
})

global.SE.on("domain:delete", async (data, ack) => {
    let { domain } = data;
    let { value }= await global.STORAGE.findOne({ entity: "domains" });
    value = value.filter(f => f !== domain);
    await global.STORAGE.updateOne({ entity: "domains" }, { value });
    ack({error: false, msg: "Domain successfully deleted", payload: null})
})

global.SE.on("domain:list", async (ack) => {
    let { value } = await global.STORAGE.findOne({ entity: "domains" });
    ack({error: false, msg: "Fetched available domains", payload: value})
})

global.SE.on("port:get", async (ack) => {
    ack({error: false, msg: "Unused port created", payload: await getUnusedPort()})
})