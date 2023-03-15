async function portIsUnused(port) {
    return !(await global.ENTITIES.findOne({ network: {port: port} }));
}

async function nameIsUnused(name) {
    return !(await global.ENTITIES.findOne({ name }));
}

async function domainIsUnused(sub, domain) {
    return !(await global.ENTITIES.findOne({ network: { sub: sub, domain: domain} }));
}

async function getUnusedPort() {
    let port = 0;
    while(port == 0 || !(await portIsUnused(port))) {
        port = Math.round(Math.random() * 9000) + 1000;
    }
    return port;
}

export {
    portIsUnused,
    domainIsUnused,
    nameIsUnused,
    getUnusedPort
}