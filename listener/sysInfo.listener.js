import osu from "node-os-utils";

const intv = global.CONFIG.findOne({ entity: "sysInfoUpdateInterval" }).value;
const sysInfo = new Array(10).fill({cpu: 0, mem: 0});
let maxMemory = (async() => ((await osu.mem.info()).totalMemMb/1024).toFixed(1))();

setInterval(async () => {
    let cpu = (await osu.cpu.usage()).toFixed(2);
    let mem = ((await osu.mem.info()).usedMemMb/1024).toFixed(1);
    sysInfo.push({cpu, mem});
}, intv);

global.SE.on("sysInfo:get", async (ack) => {
    ack({ maxMemory: await maxMemory, cpu: sysInfo.map(m => m.cpu), mem: sysInfo.map(m => m.mem) });
});