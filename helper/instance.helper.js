import fs from "fs";
import { spawn } from 'child_process';
import path from "path"
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
  let basePath = global.CONFIG.findOne({ entity: "path" }).value+"/"+instance._id;
  return new Promise((resolve, reject) => {
    const walkDir = (dir) => {
      fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (file === 'node_modules') return; // Überspringe den node_modules Ordner
        if (fs.lstatSync(fullPath).isDirectory()) {
          walkDir(fullPath);
        } else if (file === 'package.json') {
          installNodeModules(dir).catch(err => reject(err));
        }
      });
    };

    const installNodeModules = (dir) => {
      return new Promise((res, rej) => {
        const install = spawn('npm', ['install'], { cwd: dir, stdio: 'ignore' });

        install.on('close', code => {
          if (code !== 0) {
            rej({ error: true, msg: `npm install in ${dir} failed with code ${code}` });
          } else {
            global.log.success(`npm install in ${dir} done`);
            res({ error: false, msg: `npm install in ${dir} done` });
          }
        });

        install.on('error', err => {
          global.log.error(`Failed to start npm install in ${dir}`, err);
          global.log2File.error(`Failed to start npm install in ${dir}`, err);
          rej({ error: true, msg: err.toString() });
        });
      });
    };

    try {
      walkDir(basePath);
      resolve({ error: false, msg: 'All installations done' });
    } catch (err) {
      reject({ error: true, msg: err.toString() });
    }
  });
};

export {
    getPackageJSON, checkAndInstallModules
}