import pm2 from "pm2";

function pm2ListInstances() {
    return new Promise((res, rej) => {
        pm2.connect((err) => {
            if (err) {
                res({ error: true, msg: "Cannot connect to pm2", payload: null});
                console.error(err);
                return;
            }
            pm2.list((err, list) => {
                if (err) {
                    res({ error: true, msg: "Cannot get instances list from pm2", payload: null });
                    console.error(err);
                    return;
                }
                res({ error: false, msg: "Instances list fetched from pm2", payload: list });
            });
        });
    });
}

(async() => console.log(await pm2ListInstances()))();