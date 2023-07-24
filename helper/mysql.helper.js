import { spawn } from 'child_process';
const syncMysqlData = async () => {
  await getMysqlVersion()
}
const getMysqlVersion = () => {
  return new Promise((resolve, reject) => {
    let mySQLData = global.DATABASE.findOne({ type: "mysql" })
    if (!mySQLData) {
      global.DATABASE.insertOne({
        type: "mysql",
        installed: false,
        version: null,
        superuser: {
          created: false,
          username: "NodeCore",
          password: null,
          host: "localhost"
        }
      })
    }
    const mysqlProcess = spawn('mysql', ['--version']);

    let output = '';
    mysqlProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    mysqlProcess.on('error', (error) => {
      resolve(false);
    });

    mysqlProcess.on('close', (code) => {
      if (code !== 0) {
        global.DATABASE.updateOne({ type: "mysql" }, {
          installed: false,
          version: null,
          superuser: {
            created: false,
            username: "NodeCore",
            password: null,
            host: "localhost"
          }
        })
        resolve(false);
      } else {
        const version = output.match(/(\d+\.\d+\.\d+)/)[0];
        global.DATABASE.updateOne({ type: "mysql" }, {
          installed: true,
          version: version
        })
        resolve(version);
      }
    });
  });
};
const installMysql = () => {
  return new Promise((resolve, reject) => {
    const installProcess = spawn('sudo', ['apt-get', '-y', 'install', 'mysql-server']);

    installProcess.on('error', (error) => {
      reject('Fehler bei der Installation von MySQL.');
    });
    installProcess.stdout.on('data', (data) => {
      console.log(`${data.toString().trim()}`);
    });
    installProcess.on('close', (code) => {
      if (code !== 0) {
        reject(`Installationsprozess beendet sich mit code ${code}`);
      } else {
        resolve('MySQL erfolgreich installiert');
      }
    });
  });
};
const uninstallMysql = () => {
  return new Promise((resolve, reject) => {
    const uninstallProcess = spawn('sudo', ['apt-get', '-y', 'purge', 'mysql-server', 'mysql-client', 'mysql-common', 'mysql-server-core-*', 'mysql-client-core-*']);

    uninstallProcess.stdout.on('data', (data) => {
      console.log(`${data.toString().trim()}`);
    });

    uninstallProcess.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    uninstallProcess.on('error', (error) => {
      reject('Fehler beim Deinstallieren von MySQL');
    });

    uninstallProcess.on('close', (code) => {
      if (code !== 0) {
        reject(`Deinstallationsprozess beendet sich mit code ${code}`);
      } else {
        console.log('Mysql erfolgreich installiert')
        resolve(true);
      }
    });
  });
};

const createSuperuser = (user, password, host) => {
  return new Promise((resolve, reject) => {
    const createUserProcess = spawn('mysql', [
      '-u',
      'root',
      '-e',
      `CREATE USER '${user}'@'${host}' IDENTIFIED BY '${password}'; GRANT ALL PRIVILEGES ON *.* TO '${user}'@'${host}' WITH GRANT OPTION; FLUSH PRIVILEGES;`
    ]);


    createUserProcess.on('close', (code) => {
      if (code === 0) {
        global.DATABASE.updateOne({ type: "mysql" }, {
          "superuser": {
            created: true,
            username: user,
            password: password,
            host: host
          }
        })
        console.log('Superuser erfolgreich erstellt')
        resolve('Superuser erfolgreich erstellt.');
      } else {
        reject(new Error(`Fehler beim Erstellen des Superusers. Exit-Code: ${code}`));
      }
    });

    createUserProcess.on('error', (err) => {
      reject(err);
    });
  });
};

const deleteSuperuser = (user, password, host) => {
  return new Promise((resolve, reject) => {
    const deleteUserProcess = spawn('mysql', [
      '-u',
      'root',
      '-e',
      `DROP USER '${user}'@'${host}'; FLUSH PRIVILEGES;`
    ]);

    deleteUserProcess.on('close', (code) => {
      if (code === 0) {
        global.DATABASE.updateOne({ type: "mysql" }, {
          superuser: {
            created: false,
            username: "NodeCore",
            password: null,
            host: 'localhost'
          }
        })
        resolve('Superuser erfolgreich gelöscht.');
      } else {
        reject(new Error(`Fehler beim Löschen des Superusers. Exit-Code: ${code}`));
      }
    });

    deleteUserProcess.on('error', (err) => {
      reject(err);
    });
  });
};










export { getMysqlVersion, installMysql, uninstallMysql, syncMysqlData, createSuperuser, deleteSuperuser };
