import Borgoose from "borgoose";

global.USERS = new Borgoose('data/users.json', { syncOnWrite: true, createWithId: true });
global.CONFIG = new Borgoose('data/config.json', { syncOnWrite: true, createWithId: true });
global.STORAGE = new Borgoose('data/storage.json', { syncOnWrite: true, createWithId: true });