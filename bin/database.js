import Borgoose from "borgoose";

global.USERS = new Borgoose('data/users.json', { syncOnWrite: true, createWithId: true });