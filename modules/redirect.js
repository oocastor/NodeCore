import { portIsUnused, domainIsUnused } from "../wrapper/entities.js";

global.IO.on("connect", (socket) => {
    socket.on("redirect:create", (data, ack) => {
        let {name, domain, port} = data;
        if(!data || !data.name || !data.domain || !data.port) {
            ack({error: true, msg: "Input data incomplete"});
            return;
        }
        if(portIsUnused(port)) {
            if(domainIsUnused(domain)) {
                //port and domain unused
                global.ENTITIES.insertOne({type: "redirect", name, port, domain, active: true});
                //TODO: reload proxy
                ack({error: false, msg: "Redirect successfully created"});
            } else {
                ack({error: true, msg: "Domain already used"});
            }
        } else {
            ack({error: true, msg: "Port already used"});
        }
    });

    socket.on("redirect:list", (ack) => {
        
    })
});