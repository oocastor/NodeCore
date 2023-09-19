import os from 'os';
import { resolve4, lookup } from 'node:dns';


function getServerIP() {
    const networkInterfaces = os.networkInterfaces();
    const ipv4Addresses = [];

    for (const key of Object.keys(networkInterfaces)) {
        for (const net of networkInterfaces[key]) {
            // Filtert IPv4-Adressen, die nicht "loopback" sind
            if (net.family === 'IPv4' && !net.internal) {
                ipv4Addresses.push(net.address);
            }
        }
    }
    return ipv4Addresses[0]
}

function checkRootDNS(domain) {
    //Check for Root Domain (@). Use just the main Domain like example.com
    resolve4(domain, (err, addresses) => {
        if (err) {
            global.log.error(err);
            return;
        }
        if(addresses.includes(getServerIP())) return true;
        global.log.warn(`DNS for @ ${domain} not set. Use ${getServerIP()} instead of ${addresses}`)
        return false;
    });
}

function checkDNS(domain) {
    //Check for Subdomains like subdomain.example.com
    lookup(domain, (err, address, family) => {
        if(address == getServerIP()) return true;
        global.log.warn(`DNS for ${domain} not set. Use ${getServerIP()} instead of ${address}`)
        return false
    });
}

export {
    getServerIP,
    checkRootDNS,
    checkDNS
}
