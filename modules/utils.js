import { getUnusedPort } from "../wrapper/entities.js";

global.SE.on("domain:list", async (ack) => {
    let domains = await global.STORAGE.findOne({ entity: "domains" }).value;
    ack({error: false, msg: "Fetched available domains", payload: domains})
})

global.SE.on("port:get", async (ack) => {
    ack({error: false, msg: "Unused port created", payload: await getUnusedPort()})
})