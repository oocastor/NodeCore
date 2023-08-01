import { spawn } from 'child_process';
const syncMysqlData = async () => {
  await getMysqlVersion()
}
const getMysqlVersion = () => {
  global.log.bug('Hier ist irgendwo ein Bug. Wenn MySQL deinstalliert wird muss der SU auch gelöscht werden!')
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
  global.log.bug('Hier ist irgendwo ein Bug. Wenn MySQL deinstalliert wird muss der SU auch gelöscht werden!')
  return new Promise((resolve, reject) => {
    global.logInteractive.await('mysql installation');
    const installProcess = spawn('sudo', ['apt-get', '-y', 'install', 'mysql-server']);

    installProcess.on('error', (error) => {
      global.logInteractive.error(`mysql installation error ${error}`);
      global.log2File.error(`stderr: ${error}`);
      reject('Fehler bei der Installation von mysql.');
    });
    // installProcess.stdout.on('data', (data) => {
    //   global.logInteractive.await(`${data.toString().trim()}`);
    // });
    installProcess.on('close', (code) => {
      if (code !== 0) {
        global.logInteractive.error(`mysql installation error ${code}`);
        reject(`Installationsprozess beendet sich mit code ${code}`);
      } else {
        global.logInteractive.success('mysql installation done');
        resolve('MySQL erfolgreich installiert');
      }
    });
  });
};
const uninstallMysql = () => {
  global.log.bug('Hier ist irgendwo ein Bug. Wenn MySQL deinstalliert wird muss der SU auch gelöscht werden!')
  return new Promise((resolve, reject) => {
    global.logInteractive.await('mysql uninstallation');
    const uninstallProcess = spawn('sudo', ['apt-get', '-y', 'purge', 'mysql-server', 'mysql-client', 'mysql-common', 'mysql-server-core-*', 'mysql-client-core-*']);

    // uninstallProcess.stdout.on('data', (data) => {
    //   global.logInteractive.await(`${data.toString().trim()}`);
    // });

    uninstallProcess.on('error', (error) => {
      global.logInteractive.error(`mysql uninstallation error ${error}`);
      global.log2File.error(`stderr: ${error}`);
      reject('Fehler beim Deinstallieren von MySQL');
    });

    uninstallProcess.on('close', (code) => {
      if (code !== 0) {
        global.logInteractive.error(`mysql uninstallation error ${code}`);
        reject(`Deinstallationsprozess beendet sich mit code ${code}`);
      } else {
        global.logInteractive.success('mysql uninstallation done');
        resolve(true);
      }
    });
  });
};

const createSuperuser = (user, password, host) => {
  global.log.bug('Hier ist irgendwo ein Bug. Wenn MySQL deinstalliert wird muss der SU auch gelöscht werden!')
  return new Promise((resolve, reject) => {
    global.logInteractive.await('create mysql superuser');
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
        global.logInteractive.success('create mysql superuser done');
        resolve('Superuser erfolgreich erstellt.');
      } else {
        global.logInteractive.await(`create mysql superuser error - Exit-Code: ${code}`);
        global.log2File.error(`create mysql superuser error - Exit-Code: ${code}`);
        reject(new Error(`Fehler beim Erstellen des Superusers. Exit-Code: ${code}`));
      }
    });

    createUserProcess.on('error', (err) => {
      reject(err);
    });
  });
};

const deleteSuperuser = (user, password, host) => {
  global.log.bug('Hier ist irgendwo ein Bug. Wenn MySQL deinstalliert wird muss der SU auch gelöscht werden!')
  return new Promise((resolve, reject) => {
    global.logInteractive.await('delete mysql superuser');
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
        global.logInteractive.success('delete mysql superuser done');
        resolve('Superuser erfolgreich gelöscht.');
      } else {
        global.logInteractive.error(`delete mysql superuser error - Exit-Code: ${code}`);
        global.log2File.error(new Error(`Fehler beim Löschen des Superusers. Exit-Code: ${code}`));
        reject(new Error(`Fehler beim Löschen des Superusers. Exit-Code: ${code}`));
      }
    });

    deleteUserProcess.on('error', (err) => {
      global.logInteractive.error(`delete mysql superuser error - Error: ${err}`);
        global.log2File.error(new Error(err));
      reject(err);
    });
  });
};










export { getMysqlVersion, installMysql, uninstallMysql, syncMysqlData, createSuperuser, deleteSuperuser };
