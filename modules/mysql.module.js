import { spawn } from 'child_process';

function syncMysqlData() {
	return new Promise((resolve, reject) => {
		//check if database item exists
		if (!global.DATABASE.findOne({ type: "mysql" })) {
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

		//check if mysql is installed
		const mysqlProcess = spawn('mysql', ['--version']);

		let output = '';
		mysqlProcess.stdout.on('data', (data) => {
			output += data.toString();
		});

		//command not found means mysql is not installed
		const error = (err) => {
			global.DATABASE.updateOne({ type: "mysql" }, {
				installed: false,
				version: null,
				superuser: {
					created: false,
					username: "NodeCore",
					password: null,
					host: "localhost"
				}
			});
			reject({ error: true, msg: `SyncMysqlData errored`, payload: err });
		}

		mysqlProcess.on('error', error);

		mysqlProcess.on('close', (code) => {
			if (code != 0) {
				error(`Close-Code: ${code}`);
				return;
			}
			const version = output.match(/(\d+\.\d+\.\d+)/)[0];
			global.DATABASE.updateOne({ type: "mysql" }, {
				installed: true,
				version: version
			});
			resolve({ error: false, msg: "MySQL Data", payload: global.DATABASE.findOne({ type: "mysql" }) });
		});
	});
};

function installMysql() {
	return new Promise((resolve, reject) => {
		global.logInteractive.await('MySQL installation started');

		//update repositories and install mysql
		const installProcess = spawn('sudo apt update && sudo apt-get -y install mysql-server', { shell: true });

		const error = (err) => {
			global.logInteractive.error(`MySQL installation errored`);
			global.log2File.error(`MySQL installation errored: ${err}`);
			reject({ error: true, msg: "Error while installing MySQL", payload: null });
		}

		installProcess.on('error', error);

		installProcess.on('close', async (code) => {
			if (code != 0) {
				error(code);
			}
			syncMysqlData().then(res => {
				global.logInteractive.success('MySQL successfully installed');
				resolve({ error: false, msg: "MySQL installed", payload: null });
			}).catch(err => {
				global.logInteractive.bug(`MySQL installation finished but syncMysqlData errored: ${err}`);
				global.log2File.bug(`MySQL installation finished but syncMysqlData errored: ${err}`);
				//I assume that the mysql command is not accessible
				reject({ error: true, msg: "MySQL command not found, seems like something went wrong with the installation", payload: err });
			});
		});

		// installProcess.stdout.on('data', (data) => {
		//   global.logInteractive.await(`${data.toString().trim()}`);
		// });
	});
};

const uninstallMysql = () => {
	return new Promise((resolve, reject) => {
		global.logInteractive.await('Uninstalling MySQL');

		const uninstallProcess = spawn('sudo', ['apt-get', '-y', 'purge', 'mysql-server', 'mysql-client', 'mysql-common', 'mysql-server-core-*', 'mysql-client-core-*']);

		const error = (err) => {
			global.logInteractive.error(`Error while uninstalling MySQL`);
			global.log2File.error(`Error while uninstalling MySQL: ${err}`);
			reject({ error: true, msg: "Error while uninstalling MySQL", payload: null });
		}

		uninstallProcess.on('error', error);

		uninstallProcess.on('close', (code) => {
			if (code !== 0) {
				error(`Close-Code: ${code}`);
				return;
			}
			//reset database item properties
			global.DATABASE.updateOne({ type: "mysql" }, {
				installed: false,
				version: null,
				superuser: {
					created: false,
					username: "NodeCore",
					password: null,
					host: "localhost"
				}
			});
			global.logInteractive.success('MySQL successfully uninstalled');
			resolve({ error: false, msg: "MySQL uninstalled", payload: null });
		});
	});
};

const createSuperuser = (user, password, host) => {
	return new Promise((resolve, reject) => {
		global.logInteractive.await('Creating MySQL superuser');

		const createUserProcess = spawn('sudo', [
			'mysql',
			'-u',
			'root',
			'-e',
			`CREATE USER '${user}'@'${host}' IDENTIFIED BY '${password}'; GRANT ALL PRIVILEGES ON *.* TO '${user}'@'${host}' WITH GRANT OPTION; FLUSH PRIVILEGES;`
		]);

		const error = (err) => {
			global.logInteractive.error(`Error while creating MySQL superuser`);
			global.log2File.error(`Error while creating MySQL superuser: ${err}`);
			reject({ error: true, msg: "Error while creating MySQL superuser", payload: null });
		}

		createUserProcess.on('error', error);

		createUserProcess.on('close', (code) => {
			if (code != 0) {
				error(`Close-Code: ${code}`);
				return;
			}
			global.DATABASE.updateOne({ type: "mysql" }, {
				"superuser": {
					created: true,
					username: user,
					password: password,
					host: host
				}
			});
			global.logInteractive.success('Superuser successfully created');
			global.log2File.info(`New MySQL superuser created: ${user}`);
			resolve({ error: false, msg: "Superuser successfully created", payload: null });
		});
	});
};

const deleteSuperuser = (user, host) => {
	return new Promise((resolve, reject) => {
		global.logInteractive.await('Deleting MySQL superuser');

		const deleteUserProcess = spawn('sudo', [
			'mysql',
			'-u',
			'root',
			'-e',
			`DROP USER '${user}'@'${host}'; FLUSH PRIVILEGES;`
		]);

		const error = (err) => {
			global.logInteractive.error(`Error while deleting MySQL superuser`);
			global.log2File.error(`Error while deleting MySQL superuser: ${err}`);
			reject({ error: true, msg: "Error while deleting MySQL superuser", payload: null });
		}

		deleteUserProcess.on('error', error);

		deleteUserProcess.on('close', (code) => {
			if (code != 0) {
				error(`Close-Code: ${code}`);
				return;
			}
			global.DATABASE.updateOne({ type: "mysql" }, {
				superuser: {
					created: false,
					username: "NodeCore",
					password: null,
					host: 'localhost'
				}
			})
			global.logInteractive.success('Superuser successfully deleted');
			resolve({ error: false, msg: "Superuser successfully deleted", payload: null });
		});
	});
};

export { installMysql, uninstallMysql, syncMysqlData, createSuperuser, deleteSuperuser };