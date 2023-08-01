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
        coffee1: {
            badge: '❤️ ❤️ ❤️',
            color: 'black',
            label: 'Support us',
            logLevel: 'info'
        },
        coffee2: {
            badge: '❤️ ❤️ ❤️',
            color: 'red',
            label: 'Support us',
            logLevel: 'info'
        },
        coffee3: {
            badge: '❤️ ❤️ ❤️',
            color: 'yellow',
            label: 'Support us',
            logLevel: 'info'
        },
        bug: {
            badge: '🪳',
            color: 'red',
            label: 'Bug',
            logLevel: 'info'
        },
        findme: {
            badge: '👻',
            color: 'black',
            label: 'Here I am',
            logLevel: 'info'
        },
        welcome1: {
            badge: '❤️ ❤️ ❤️',
            color: 'magenta',
            label: 'NodeCore',
            logLevel: 'info'
        },
        welcome2: {
            badge: '❤️ ❤️ ❤️',
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
    types: {
        coffee1: {
            badge: '🪲',
            color: 'black',
            label: 'Support us',
            logLevel: 'info'
        },
        coffee2: {
            badge: '❤️ ❤️ ❤️',
            color: 'red',
            label: 'Support us',
            logLevel: 'info'
        },
        coffee3: {
            badge: '❤️ ❤️ ❤️',
            color: 'yellow',
            label: 'Support us',
            logLevel: 'info'
        },
    }
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
    displayTimestamp: true
})
logInteractive.config({
    displayScope: false,
    underlineLabel: false,
    displayLabel: true,
    displayBadge: true,
    displayTimestamp: true
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