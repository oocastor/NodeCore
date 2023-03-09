import osu from "node-os-utils";

global.IO.on("connect", (socket) => {
    socket.on("get:sysInfo", async (ack) => {
        let cpu = await osu.cpu.usage();
        let mem = await osu.mem.info()
        ack({cpu, mem: {total: mem.totalMemMb, used: mem.usedMemMb}})
    })
});