import {createSuperuser, deleteSuperuser, installMysql, uninstallMysql, syncMysqlData} from "../modules/mysql.module.js"

global.SE.on("databases:get:mysqlData", async (ack) => {
    syncMysqlData().then(res => ack(res)).catch(err => {/*NO ERRORS*/});
});
global.SE.on("databases:install:mysql", async (ack) => {
    installMysql().then(res => ack(res)).catch(err => ack(err));
});
global.SE.on("databases:uninstall:mysql", async (ack) => {
    uninstallMysql().then(res => ack(res)).catch(err => ack(err));
});
global.SE.on("databases:mysql:createSuperUser", async (data, ack) => {
    createSuperuser(data.username, data.password, data.host).then(res => ack(res)).catch(err => ack(err));
});
global.SE.on("databases:mysql:deleteSuperUser", async (data, ack) => {
    deleteSuperuser(data.username).then(res => ack(res)).catch(err => ack(err));
});
