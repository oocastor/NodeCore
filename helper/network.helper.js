import os from 'os';
import { resolve4, lookup } from 'node:dns';
import http from "http"
import forge from 'node-forge';
import fs from 'fs/promises';

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

function checkDNS(domain) {
    // *** DNS Check ***
    // *** NOTICE: lookup() is sync but its behavior is async! Keep the Promise to catch that behavior.
    return new Promise((resolve, reject) => {
        try {
            if(!domain || domain == "") {
                reject('Empty Hostname')
                return;
            }
            lookup(domain, (err, address, family) => {
                if (err) {
                  global.log.error(err);
                  reject(err);
                  return;
                }
                if (address !== getServerIP()) {
                  global.log.warn(`DNS for ${domain} not set. Use ${getServerIP()} instead of ${address}`);
                }
                resolve(address === getServerIP());
              });
        } catch (error) {
            global.log.error(error);
            reject(error)
        }
      
    });
  }

async function checkWebsiteStatus(link) {
    //Checks the Website Status
    return new Promise((resolve, reject) => {
        const options = {
            host: link,
            port: 80,
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            if (res.statusCode === 200) {
                resolve(true);
            } else {
                global.log.warn(`${link} Status: ${res.statusCode}`)
                resolve(false);
            }
        });

        req.on('error', (err) => {
            global.log.warn(err)
            resolve(false);
        });
        req.end();
    });
}

async function createLocalCert() {
    const keys = forge.pki.rsa.generateKeyPair(2048);
    const cert = forge.pki.createCertificate();
  
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
  
    const attrs = [
      { name: 'commonName', value: 'localhost' },
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([
        {
          name: 'subjectAltName',
          altNames: [
            {
              type: 7, // IP
              ip: getServerIP() // Server IP
            }
          ]
        }
      ]);
    cert.sign(keys.privateKey);
  
    const pemCert = forge.pki.certificateToPem(cert);
    const pemKeys = forge.pki.privateKeyToPem(keys.privateKey);
  
    return { key: pemKeys, cert: pemCert };
  };

export {
    getServerIP,
    checkDNS,
    checkWebsiteStatus,
    createLocalCert
}
