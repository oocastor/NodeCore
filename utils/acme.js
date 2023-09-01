import acme from "acme-client";
import fs from "fs-extra";
import { existsSync } from "fs";
import { wait } from "../helper/wait.helper.js";

async function challengeCreateFn(authz, challenge, keyAuthorization) {
    // global.log.debug(challenge, keyAuthorization)
    try {
        if (challenge.type === 'http-01') {
            global.sendToWorkers("updateACME", {
                add: {
                    token: challenge.token,
                    keyAuthorization
                }
            });
            global.log.info(challenge.token, keyAuthorization);
        }
    } catch (err) {
        global.log.error(err);
    }
}

async function challengeRemoveFn(authz, challenge, keyAuthorization) {
    // global.log.debug(challenge, keyAuthorization)
    try {
        if (challenge.type === 'http-01') {
            global.sendToWorkers("updateACME", {
                delete: {
                    token: challenge.token,
                }
            });
        }
    } catch (err) {
        global.log.error(err);
    }
}

async function getAccountKey() {
    let key = global.STORAGE.findOne({ entity: "acmeClientKey" })?.value;

    //create account key if no one found
    if (key == undefined) {
        key = await acme.crypto.createPrivateKey();
        global.STORAGE.insertOne({ entity: "acmeClientKey", value: key.toString() })
    }

    return key;
}

let _client = null;
async function initClient() {
    if (_client == null) {
        _client = new acme.Client({
            directoryUrl: acme.directory.letsencrypt.production,
            // directoryUrl: acme.directory.letsencrypt.staging,
            accountKey: await getAccountKey()
        });
    }
    return _client;
}

async function addOrUpdateDomain(_subdomain, _domain) {
    return new Promise(async (res, rej) => {
        try {
            let proxyConfig = global.CONFIG.findOne({ entity: "proxy" })?.value;

            if (!proxyConfig || !proxyConfig.enabled) {
                rej({ error: true, msg: "Cannot create ssl cert - enable proxy first!", payload: null });
                return;
            }

            //get all subdomains from instances
            let instances = global.ENTITIES.findMany({ type: "instance", network: { redirect: { domain: _domain } } }) || [];
            instances = instances.filter(f => f.network.redirect.sub != "@");
            instances = instances.map(m => m.network.redirect.sub);

            //get all subdomains from redirects
            let redirects = global.ENTITIES.findMany({ type: "redirect", network: { domain: _domain } }) || [];
            redirects = redirects.filter(f => f.network.sub != "@");
            redirects = redirects.map(m => m.network.sub)

            let foundedSubdomains = [...instances, ...redirects];

            let client = await initClient();

            let altNames = [_domain, ...foundedSubdomains.map(m => `${m}.${_domain}`)];

            let [key, csr] = await acme.crypto.createCsr({
                commonName: _domain,
                altNames
            });

            let cert = await client.auto({
                csr,
                email: proxyConfig.maintainerEmail,
                termsOfServiceAgreed: true,
                challengeCreateFn,
                challengeRemoveFn
            });

            let timestap = new Date().getTime();

            fs.writeJsonSync(`${process.cwd()}/certs/${_domain}.json`, { key: key.toString(), cert: cert.toString(), csr: csr.toString(), altNames, timestap }, (err) => new Error(err));

            res({ error: false, msg: "Certifcate successfully created or updated", payload: null });
        } catch (err) {
            rej({ error: true, msg: "Something went wrong while creating the ssl certs", payload: err });
        }
    });
}

async function updateDomainCerts(force = false) {
    return new Promise(async (res, rej) => {
        try {
            let proxyConfig = global.CONFIG.findOne({ entity: "proxy" })?.value;

            if (!proxyConfig || !proxyConfig.enabled) {
                return;
            }

            global.logInteractive.await('update domain certificates');

            let domains = global.CONFIG.findOne({ entity: "domains" }).value;

            for (let _domain of domains) {
                let filePath = `${process.cwd()}/certs/${_domain}.json`;

                if (!existsSync(filePath)) {
                    global.logInteractive.await(`update domain certificates - skipped ${_domain}, no cert file found`)
                    continue;
                }

                let certFile = fs.readJSONSync(filePath);

                if (((new Date().getTime() - certFile.timestap) / (24 * 60 * 60 * 1000)) < 30 && !force) {
                    global.logInteractive.await(`update domain certificates - skipped ${_domain}, cert not older then 30 days`)
                    continue;
                }

                let client = await initClient();

                let altNames = certFile.altNames;

                let [key, csr] = await acme.crypto.createCsr({
                    commonName: _domain,
                    altNames
                });

                let cert = await client.auto({
                    csr,
                    email: proxyConfig.maintainerEmail,
                    termsOfServiceAgreed: true,
                    challengeCreateFn,
                    challengeRemoveFn
                });

                let timestap = new Date().getTime();

                fs.writeJsonSync(`${process.cwd()}/certs/${_domain}.json`, { key: key.toString(), cert: cert.toString(), csr: csr.toString(), altNames, timestap }, (err) => new Error(err));

                //wait 5 seconds
                wait(5000);
            }
            global.logInteractive.success(`update domain certificates`)
                   
            res({ error: false, msg: "Certifcates successfully updated", payload: null });
        } catch (err) {
            global.logInteractive.error(`update domain certificates error ${err}`)
            rej({ error: true, msg: "Something went wrong while updating the ssl certs", payload: err })
        }
    });
}

//check certificates and update them if needed

setTimeout(updateDomainCerts, 5000);
setInterval(updateDomainCerts, 1000 * 60 * 120);

export {
    addOrUpdateDomain,
    updateDomainCerts
}