async function portIsUnused(port) {
    return !(await global.ENTITIES.findOne({ port }));
}

async function domainIsUnused(domain) {
    return !(await global.ENTITIES.findOne({ domain }));
}

export {
    portIsUnused,
    domainIsUnused
}