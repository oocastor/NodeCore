import acme from "acme-client";
import fs from "fs";

async function challengeCreateFn(authz, challenge, keyAuthorization) {
    if (challenge.type === 'http-01') {
        // const filePath = `/var/www/html/.well-known/acme-challenge/${challenge.token}`;
        global.ACME = {
            token: challenge.token,
            keyAuthorization
        };
    }
}

async function challengeRemoveFn(authz, challenge, keyAuthorization) {
    if (challenge.type === 'http-01') {
        global.KEY = {
            token: "",
            keyAuthorization: ""
        };
    }
}

async function getAccountKey() {
    let key = global.STORAGE.findOne({ entity: "acmeClientKey" })?.value;

    //create account key if no one found
    if (key == undefined) {
        key = await acme.crypto.createPrivateKey();
        global.STORAGE.insertOne({ entity: "acmeClientKey", value: key })
    }

    return key;
}

let _client = null;
async function initClient() {
    if (!_client) {
        _client = new acme.Client({
            directoryUrl: acme.directory.letsencrypt.staging,
            accountKey: getAccountKey()
        });
    }
    return _client;
}

async function waitForIt() {
    while (global.ACME.token !== "") {
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

async function addOrUpdateDomain(_subdomain, _domain) {
    return new Promise(async (res, rej) => {
        try {
            let proxyConfig = global.CONFIG.findOne({ entity: "proxy" })?.value;

            if (!proxyConfig || !proxyConfig.enabled) {
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

            //wait if acme challenge is currently running!
            waitForIt();

            let client = initClient();

            let [key, csr] = await acme.crypto.createCsr({
                commonName: _domain,
                altNames: [_domain, ...foundedSubdomains.map(m => `${m}.${_domain}`)]
            });

            let cert = await client.auto({
                csr,
                email: proxyConfig.maintainerEmail,
                termsOfServiceAgreed: true,
                challengeCreateFn,
                challengeRemoveFn
            });

            let path = `${process.cwd()}/certs/${_domain}`;

            fs.mkdirSync(path, (err) => new Error(err));
            fs.writeFileSync(`${path}/cert.json`, JSON.stringify({ key, cert, csr }), (err) => new Error(err));

            res({ error: false, msg: "Certifcate successfully created or updated", payload: null });
        } catch (err) {
            rej({ error: true, msg: "Something went wrong while creating the ssl certs", payload: null })
        }
    });
}

export {
    addOrUpdateDomain
}