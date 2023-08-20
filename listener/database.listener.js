import {createSuperuser, deleteSuperuser, installMysql, uninstallMysql, syncMysqlData} from "../modules/mysql.module.js"

global.SE.on("databases:get:mysqlData", async (ack) => {
    let data = await syncMysqlData();
    ack({ error: false, msg: "MySQL Data", payload: data });
});
global.SE.on("databases:install:mysql", async (ack) => {
    await installMysql()
    await syncMysqlData()
    ack({ error: false, msg: "MySQL installed", payload: true });
});
global.SE.on("databases:uninstall:mysql", async (ack) => {
    await uninstallMysql()
    await syncMysqlData()
    ack({ error: false, msg: "MySQL uninstalled", payload: true });
});
global.SE.on("databases:mysql:createSuperUser", async (data, ack) => {
    await createSuperuser(data.username, data.password, data.host)
    await syncMysqlData()
    ack({ error: false, msg: "MySQL Superuser created", payload: true });
});
global.SE.on("databases:mysql:deleteSuperUser", async (data, ack) => {
    await deleteSuperuser(data.username, data.password, data.host)
    await syncMysqlData()
    ack({ error: false, msg: "MySQL Superuser created", payload: true });
});
