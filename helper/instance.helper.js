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
      if (!fs.existsSync(`${path}/node_modules`)) {
        const install = spawn('npm', ['install'], { cwd: path, stdio: 'ignore' });
  
        install.on('close', (code) => {
          if (code !== 0) {
            resolve({error: true, msg: `npm install failed with code ${code}`, payload: null})
          } else {
            global.log.success('npm install done');
            resolve({error: false, msg: `npm install done`, payload: null})
          }
        });
  
        install.on('error', (err) => {
          global.log.error('Failed to start npm install', err);
          global.log2File.error('Failed to start npm install', err);
          resolve({error: true, msg: err, payload: null})
        });
      } else {
        global.log.info('node_modules already installed')
        resolve({error: false, msg: `node_modules bereits vorhanden`, payload: null})
      }
    });
  };
export {
    getPackageJSON, checkAndInstallModules
}