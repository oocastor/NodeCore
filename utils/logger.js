import signale from "signale"
import fs from "fs";

const logStream = fs.createWriteStream('log/error.log', { flags: 'a' });
const options = {
    disabled: false,
    interactive: false,
    logLevel: 'info',
    secrets: [],
    stream: process.stdout,
    types: {
        bug: {
            badge: '🐛',
            color: 'red',
            label: 'Bug',
            logLevel: 'info'
        },
        nodecore: {
            badge: '',
            color: 'magenta',
            label: 'NodeCore',
            logLevel: 'info'
        },
        blank: {
            badge: '',
            color: 'magenta',
            label: '',
            logLevel: 'info'
        }
        
    }
};
const optionsInteractive = {
    disabled: false,
    interactive: true,
    logLevel: 'info',
    secrets: [],
    stream: process.stdout,
    types: {}
};
const optionsLog2File = {
    disabled: false,
    interactive: false,
    logLevel: 'info',
    secrets: [],
    stream: logStream
};

export const logMain = new signale.Signale(options);
export const logInteractive = new signale.Signale(optionsInteractive);
export const log2File = new signale.Signale(optionsLog2File);

logMain.config({
    displayScope: false,
    underlineLabel: false,
    displayLabel: true,
    displayBadge: true,
    displayTimestamp: true,
    displayFilename: true
})
logInteractive.config({
    displayScope: false,
    underlineLabel: false,
    displayLabel: true,
    displayBadge: true,
    displayTimestamp: true,
    displayFilename: true
})
log2File.config({
    displayScope: true,
    underlineLabel: false,
    displayLabel: false,
    displayBadge: false
})


global.log = logMain;
global.log2File = log2File
global.logInteractive = logInteractive
// loggerMain.debug('Logger Check')
// loggerMain.error('error')
// loggerMain.fatal('fatal')
// loggerMain.watch('watch')
// loggerMain.pending('pending')
// loggerMain.complete('complete')
// loggerMain.success('success')
// loggerMain.coffee('Buy us a Coffee')