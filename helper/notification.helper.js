import { v4 as uuidv4 } from 'uuid';

function addNotificatioToQueue(title, message) {
    let queue = global.stickyNotification.queue;

    let id = uuidv4();

    queue.push({
        id,
        title,
        message,
    })

    return id;
}

function removeNotificationFromQueue(id) {
    let queue = global.stickyNotification.queue;
    global.stickyNotification.queue = queue.filter(f => f.id !== id);
}

global.stickyNotification = {
    queue: [],
    add: addNotificatioToQueue,
    remove: removeNotificationFromQueue
}