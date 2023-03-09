import osu from "node-os-utils";

global.IO.on("connect", (socket) => {
    socket.on("get:sysInfo", async (ack) => {
        let cpu = (await osu.cpu.usage()).toFixed(2);
        let mem = await osu.mem.info();
        ack({cpu, mem: {total: (mem.totalMemMb/1024).toFixed(1), used: (mem.usedMemMb/1024).toFixed(1)}});
    })
});