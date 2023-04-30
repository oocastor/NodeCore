function portIsUnused(port) {
    return !(global.ENTITIES.findOne({ network: {port: port} }));
}

function nameIsUnused(name) {
    return !(global.ENTITIES.findOne({ name }));
}

function domainIsUnused(sub, domain) {
    return !(global.ENTITIES.findOne({ network: { sub: sub, domain: domain} }));
}

function getUnusedPort() {
    let port = 0;
    while(port == 0 || !(portIsUnused(port))) {
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