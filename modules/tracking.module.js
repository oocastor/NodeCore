import Borgoose from "borgoose";
function track(ip, target, authorized = true) {
	const CONFIG = new Borgoose('data/config.json', { syncOnWrite: true, createWithId: true });
	let config = CONFIG.findOne({ entity: "tracking" }).value;
	if (config.enabled) {
		// *** TRACKING ENABLED ***
		if (target !== "undefined" && config.anonymizeIP) ip = anonymizeIp(ip);
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

function checkIfDomainIsUsed(host) {
	let address = host.split(".");
	let found;
	if (address.length == 2) {
		//example.de
		found = ENTITIES.findOne({ type: "instance", network: { redirect: { domain: `${address[0]}.${address[1]}`, sub: "@" } } }) ||
			ENTITIES.findOne({ type: "redirect", network: { domain: `${address[0]}.${address[1]}`, sub: "@" }, status: 1 });
	} else if (address.length == 3) {
		// *.example.de
		found = ENTITIES.findOne({ type: "instance", network: { redirect: { domain: `${address[1]}.${address[2]}`, sub: address[0] } } }) ||
			ENTITIES.findOne({ type: "redirect", network: { domain: `${address[1]}.${address[2]}`, sub: address[0] }, status: 1 });
	}
	return found != undefined && found != null;
}

export {
	track,
	checkIfDomainIsUsed
}