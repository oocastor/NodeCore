import Borgoose from "borgoose";
import fs from "fs-extra";

fs.ensureDirSync('data');

global.USERS = new Borgoose('data/users.json', { syncOnWrite: true, createWithId: true });
global.ENTITIES = new Borgoose('data/entities.json', { syncOnWrite: true, createWithId: true });
global.CONFIG = new Borgoose('data/config.json', { syncOnWrite: true, createWithId: true });
global.STORAGE = new Borgoose('data/storage.json', { syncOnWrite: true, createWithId: true });
global.DATABASE = new Borgoose('data/database.json', { syncOnWrite: true, createWithId: true });
global.TRACKING = new Borgoose('data/tracking.json', { syncOnWrite: true, createWithId: true });