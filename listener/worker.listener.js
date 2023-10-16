// import Borgoose from "borgoose";
// const TRACKING = new Borgoose('data/tracking.json', { syncOnWrite: true, createWithId: true });

// *** LISTENER FOR WORKER MESSAGES
global.SE.on("worker:message", async (message) => {
    let type = message.type
    delete message.type;
    switch (type) {
        case "tracking":
            global.TRACKING.insertOne(message)
            break;
    
        default:
            break;
    }
});