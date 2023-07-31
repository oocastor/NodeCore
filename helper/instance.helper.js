import fs from "fs";
import { spawn } from 'child_process';
function getPackageJSON(instance) {
    let path = global.CONFIG.findOne({ entity: "path" }).value;

    if(fs.existsSync(`${path}/${instance._id}/package.json`)) {
        let json = JSON.parse(fs.readFileSync(`${path}/${instance._id}/package.json`));
        return {error: false, msg: "Data from package.json loaded", payload: json}
    } else {
        return {error: true, msg: "No package.json found", payload: null}
    }
}
const checkAndInstallModules = (instance) => {
    let path = global.CONFIG.findOne({ entity: "path" }).value+"/"+instance._id;
    return new Promise((resolve, reject) => {
        console.log(`${path}/node_modules`)
      if (!fs.existsSync(`${path}/node_modules`)) {
        const install = spawn('npm', ['install'], { cwd: path, stdio: 'inherit' });
  
        install.on('close', (code) => {
          if (code !== 0) {
            resolve({error: true, msg: `npm install failed with code ${code}`, payload: null})
          } else {
            console.log('npm install erfolgreich durchgeführt');
            resolve({error: false, msg: `npm install done`, payload: null})
          }
        });
  
        install.on('error', (err) => {
          console.error('Failed to start npm install', err);
          resolve({error: true, msg: err, payload: null})
        });
      } else {
        console.log('node_modules bereits vorhanden')
        resolve({error: false, msg: `node_modules bereits vorhanden`, payload: null})
      }
    });
  };
export {
    getPackageJSON, checkAndInstallModules
}