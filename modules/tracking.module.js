import Borgoose from "borgoose";
function track(ip, target, authorized = true){
    const CONFIG = new Borgoose('data/config.json', { syncOnWrite: true, createWithId: true });
    let config = CONFIG.findOne({entity: "tracking"}).value;
    if(config.enabled){
        // *** TRACKING ENABLED ***
        if(target !== "undefined" && config.anonymizeIp) ip = anonymizeIp(ip);
        process.send({
          type: "tracking",
          timestamp: new Date(),
          ip: ip,
          target: target,
          authorized: authorized
        });     
    }   
}

function anonymizeIp(ip) {
    const octets = ip.split('.');
    if (octets.length !== 4) {
      return null; // Ungültige IP-Adresse
    }
    octets[3] = '0';
    return octets.join('.');
  }

export default {
    track
}