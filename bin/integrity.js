import { createNewUser } from "./auth.js";
import * as sslValidator from "ssl-validator"
import fs_promises from 'fs/promises';
import isJsonValue from 'is-json-value'
import path from 'path';
import fs from "fs-extra";
import {
    checkRootDNS,
    checkDNS
} from "../helper/network.helper.js"
import { addOrUpdateDomain } from "../utils/acme.js"
await (async () => {
    global.log.info('running NodeCore integrity check')
    // *** CHECK SETUP ***
    checkSetup();
    // *** CHECK CERTIFICATES ***
    await checkCertificates()
    // *** CHECK REDIRECTS ***
    await checkRedirects();
    // *** CHECK INSTANCES ***
    await checkInstances()
    // *** CHECK MYSQL ***
    await checkMySQL()

})()

async function checkMySQL() {
// *** CHECK MYSQL INTEGRITY ***

}

async function checkInstances() {
    // *** CHECK INSTANCES ***
    let redirects = global.ENTITIES.findMany({ type: "instance" })
    redirects.forEach(async element => {
        
        // *** CHECK DATABASE DATA INTEGRITY ***
        let possibleAttr = ['type', 'name', 'network', 'status', 'git', 'env', 'cmd', 'script', '_id', 'version', 'pm2CreationDone']
        let possibleNetworkAttr = ['isAccessable', 'redirect']
        let possibleNetworkRedirectAttr = ['sub', 'domain', 'port']
        let possibleGitAttr = ['name', 'uri', 'lang']
        Object.keys(element).forEach(attr => {
            let error = false;
            if (possibleAttr.includes(attr)) {
                if (attr == "network") {
                    Object.keys(element[attr]).forEach(networkAttr => {
                        if (possibleNetworkAttr.includes(networkAttr)) {
                            if (networkAttr == "redirect") {
                                Object.keys(element[attr][networkAttr]).forEach(networkRedirectAttr => {
                                    if (!possibleNetworkRedirectAttr.includes(networkRedirectAttr)) {
                                        global.log.warn('redirect integrity error. try to repair')
                                        delete element[networkAttr][networkRedirectAttr];
                                        error = true;
                                    }
                                })
                            }
                        } else {
                            global.log.warn('redirect integrity error. try to repair')
                            delete element[attr][networkAttr];
                            error = true;

                        }
                    })
                }
                if (attr == "git") {
                    Object.keys(element[attr]).forEach(gitAttr => {
                        if (!possibleGitAttr.includes(gitAttr)) {
                            global.log.warn('redirect integrity error. try to repair')
                            delete element[attr][gitAttr];
                            error = true;
                        }
                    })
                }
            } else {
                global.log.warn('redirect integrity error. try to repair')
                delete element[attr];
                error = true
            }
            if (error) {
                // *** REPAIR WRONG REDIRECT ***
                if (element.name)
                    global.ENTITIES.updateOne({ type: "instance", name: element.name }, element)
            }
        });
        // *** CHECK DNS ENTRIES ***
        if (element.network.redirect.sub == "@") {
            checkRootDNS(element.network.redirect.domain)
        } else {
            checkDNS(`${element.network.redirect.sub}.${element.network.redirect.domain}`)
        }
        global.log.success('check instance ' + element.name)
    });

}
async function checkRedirects() {
    // *** CHECK REDIRECTS ***
    let redirects = global.ENTITIES.findMany({ type: "redirect" })
    redirects.forEach(async element => {
        
        // *** CHECK DATABASE DATA INTEGRITY ***
        let possibleAttr = ['type', 'name', 'network', 'status', '_id']
        let possibleNetworkAttr = ['sub', 'domain', 'port']
        Object.keys(element).forEach(attr => {
            let error = false;
            if (possibleAttr.includes(attr)) {
                if (attr == "network") {
                    Object.keys(element[attr]).forEach(networkAttr => {
                        if (!possibleNetworkAttr.includes(networkAttr)) {
                            global.log.warn('redirect integrity error. try to repair')
                            delete element[attr][networkAttr];
                            error = true;
                        }
                    })
                }
            } else {
                global.log.warn('redirect integrity error. try to repair')
                delete element[attr];
                error = true
            }
            if (error) {
                // *** REPAIR WRONG REDIRECT ***
                if (element.name)
                    global.ENTITIES.updateOne({ type: "redirect", name: element.name }, element)
            }
        });
        // *** CHECK DNS ENTRIES ***
        if (element.network.sub == "@") {
            checkRootDNS(element.network.domain)
        } else {
            checkDNS(`${element.network.sub}.${element.network.domain}`)
        }
        global.log.success('check redirect' + element.name)
    });

}
async function checkCertificates() {
    // *** CHECK CERT DIR FOR BROKEN CERTS ***
    try {
        let certFiles = await fs_promises.readdir(`${process.cwd()}/certs/`);
        certFiles = certFiles.map(datei => path.join(`${process.cwd()}/certs/`, datei));
        certFiles.forEach(async cert => {
            let certFileData = JSON.parse(fs.readFileSync(cert));
            let repair = false
            if (isJsonValue(certFileData).length > 0) {
                global.log.warn(cert + ' invalid is no valid json')
                repair = true
            }
            if (!await sslValidator.default.isValidSSL(certFileData.cert)) {
                global.log.warn(cert + ' invalid try to repair')
                repair = true
            }
            if (repair) {
                // *** REPAIR BROKEN CERT ***
                const domain = path.basename(cert, path.extname(cert));
                // *** DELETE CERT ***
                fs_promises.unlink(cert)
                    .then(() => {
                        global.log.info('deleted broken cert')
                    })
                    .catch(err => {
                        global.log.error('error deleting broken cert:', err);
                    });
                let possibleDomains = global.CONFIG.findOne({ entity: "domains" })
                if (possibleDomains.value.includes(domain)) {
                    // *** CREATE NEW CERT ***
                    await addOrUpdateDomain('@', domain)
                    global.log.info('repaired broken cert')
                } else {
                    global.log.warn('no domain found for cert ' + domain)
                }
            }
        });
        global.log.success('check certificates')
    } catch (err) {
        console.error('Ein Fehler ist aufgetreten:', err);
    }
}
function checkSetup() {
    // *** CREATE OR REPAIR VARS ***
    if (!global.CONFIG.findOne({ entity: "domains" })) global.log.info('Domain Database empty. Loading initial Config') && global.CONFIG.insertOne({ entity: "domains", value: [] })
    if (!global.CONFIG.findOne({ entity: "github" })) global.log.info('Github Database empty. Loading initial Config') && global.CONFIG.insertOne({ entity: "github", value: { pat: "" } });
    if (!global.CONFIG.findOne({ entity: "path" })) global.log.info('Path Database empty. Loading initial Config') && global.CONFIG.insertOne({ entity: "path", value: "/home/nodecore-instances" });
    if (!global.CONFIG.findOne({ entity: "pm2UpdateInterval" })) global.log.info('PM2 Update Interval not set. Loading initial Config') && global.CONFIG.insertOne({ entity: "pm2UpdateInterval", value: 2000 });
    if (!global.CONFIG.findOne({ entity: "sysInfoUpdateInterval" })) global.log.info('SysInfo Update Interval not set. Loading initial Config') && global.CONFIG.insertOne({ entity: "sysInfoUpdateInterval", value: 2000 });
    if (!global.CONFIG.findOne({ entity: "proxy" })) global.log.info('Proxy Database empty. Loading initial Config') && global.CONFIG.insertOne({ entity: "proxy", value: { enabled: false, subscriberEmail: "", cluster: false, workers: 1, pid: "" } });
    if (!global.CONFIG.findOne({ entity: "tags" })) global.log.info('Tag Database empty. Loading initial Config') && global.CONFIG.insertOne({ entity: "tags", value: [] });
    // *** CREATE OR REPAIR LOGIN  ***
    if (global.USERS.findMany().length < 1) global.log.info('No User found. Create initial user') && createNewUser("nodecore", "nodecore")
    // *** CREATE INSTANCE DIR ***
    fs.ensureDirSync("/home/nodecore-instances");
    fs.ensureDirSync("certs");
    global.log.success('check setup')
}
