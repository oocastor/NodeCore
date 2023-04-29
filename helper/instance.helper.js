import fs from "fs";

function getPackageJSON(instance) {
    let path = global.CONFIG.findOne({ entity: "path" }).value;

    if(fs.existsSync(`${path}/${instance._id}/package.json`)) {
        let json = JSON.parse(fs.readFileSync(`${path}/${instance._id}/package.json`));
        return {error: false, msg: "Data from package.json loaded", payload: json}
    } else {
        return {error: true, msg: "No package.json found", payload: null}
    }
}

export {
    getPackageJSON
}