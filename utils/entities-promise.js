function portIsUnused(port) {
    return new Promise((res, rej) => !global.ENTITIES.findOne({ network: { redirect: { port: port } } }) ?
        res({ error: false, msg: "Port unused", payload: null }) :
        rej({ error: true, msg: "Port used", payload: null }))
}

function nameIsUnused(name) {
    return new Promise((res, rej) => !global.ENTITIES.findOne({ name }) ?
        res({ error: false, msg: "Name unused", payload: null }) :
        rej({ error: true, msg: "Name used", payload: null }));
}

function domainIsUnused(sub, domain) {
    return new Promise((res, rej) => !global.ENTITIES.findOne({ network: { redirect: { sub: sub, domain: domain } } }) ?
        res({ error: false, msg: "Domain unused", payload: null }) :
        rej({ error: true, msg: "Domain used", payload: null }));
}

async function getUnusedPort() {
    let port = 0;
    while (port == 0 || !await portIsUnused(port).error) {
        port = Math.round(Math.random() * 9000) + 1005;
    }
    return port;
}

export {
    portIsUnused,
    domainIsUnused,
    nameIsUnused,
    getUnusedPort
}