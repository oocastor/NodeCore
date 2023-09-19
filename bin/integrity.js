import { createNewUser } from "./auth.js";
import * as sslValidator from "ssl-validator"
import fs from "fs";
import {
    checkRootDNS,
    checkDNS
} from "../helper/network.helper.js"
import { addOrUpdateDomain } from "../utils/acme.js"
import { existsSync } from "fs";
export default async function integrityCheck() {
    //Main Funktion to Check NodeCore integrity
    global.log.info('Running NodeCore Integrity Check')
    checkSetup();
    await checkRedirects();
}

function checkSetup() {
    //Checks if the Setup is done correctly and if not => repair
    if (!global.CONFIG.findOne({ entity: "domains" })) global.log.warn('Domain Database empty. Loading initial Config') && global.CONFIG.insertOne({ entity: "domains", value: [] })
    if (!global.CONFIG.findOne({ entity: "github" })) global.log.warn('Github Database empty. Loading initial Config') && global.CONFIG.insertOne({ entity: "github", value: { pat: "" } });
    if (!global.CONFIG.findOne({ entity: "path" })) global.log.warn('Path Database empty. Loading initial Config') && global.CONFIG.insertOne({ entity: "path", value: "/home/nodecore-instances" });
    if (!global.CONFIG.findOne({ entity: "pm2UpdateInterval" })) global.log.warn('PM2 Update Interval not set. Loading initial Config') && global.CONFIG.insertOne({ entity: "pm2UpdateInterval", value: 2000 });
    if (!global.CONFIG.findOne({ entity: "sysInfoUpdateInterval" })) global.log.warn('SysInfo Update Interval not set. Loading initial Config') && global.CONFIG.insertOne({ entity: "sysInfoUpdateInterval", value: 2000 });
    if (!global.CONFIG.findOne({ entity: "proxy" })) global.log.warn('Proxy Database empty. Loading initial Config') && global.CONFIG.insertOne({ entity: "proxy", value: { enabled: false, subscriberEmail: "", cluster: false, workers: 1, pid: "" } });
    if (!global.CONFIG.findOne({ entity: "tags" })) global.log.warn('Tag Database empty. Loading initial Config') && global.CONFIG.insertOne({ entity: "tags", value: [] });
    //If no Users => create default user
    if (global.USERS.findMany().length < 1) global.log.warn('No User found. Create initial user') && createNewUser("nodecore", "nodecore")
}
async function checkRedirects() {
    //Checks if the Redirects are correct and work
    let redirects = global.ENTITIES.findMany({ type: "redirect" })
    redirects.forEach(async element => {
        //DNS Check
        if (element.network.sub == "@") {
            checkRootDNS(element.network.domain)
        } else {
            checkDNS(`${element.network.sub}.${element.network.domain}`)
        }
        global.log.info('Redirect Check ' + element.name)
        // Certificates Check
        if (element.network.sub == "@") {
            let filePath = `${process.cwd()}/certs/${element.network.domain}.json`;
            if (!existsSync(filePath)) global.log.warn(`No Certificate for ${element.network.domain} => Create`)
            let certFileData = JSON.parse(fs.readFileSync(filePath));
            console.log(await sslValidator.default.isValidSSL(certFileData.cert))
            // try {
            //     await addOrUpdateDomain("@", element.network.domain)
            // } catch (error) {
            //     global.log.error(error)
            // }
        } else {
            let filePath = `${process.cwd()}/certs/${element.network.sub}.${element.network.domain}.json`;
            if (!existsSync(filePath)) global.log.warn(`No Certificate for ${element.network.sub}.${element.network.domain} => Create`)
            // try {
            //     await addOrUpdateDomain(element.network.sub, element.network.domain)
            // } catch (error) {
            //     global.log.error(error)
            // }
        }


    });

}
function checkData() {
    //Checks if the Setup is correct
    global.log.info('Data')
}

function checkDatabase() {
    //Checks if the Setup is correct
    global.log.info('Database')
}

function checkInstances() {
    //Checks if the Setup is correct
    global.log.info('Instances')
}
await integrityCheck()