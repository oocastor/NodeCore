import cookie from "cookie";
import { hash, compare } from "bcrypt";
import jwt from "jsonwebtoken";
import RSA from "node-rsa";

//bcrypt config
const saltRounds = 10;

//jwt config
const keys = new RSA(global.STORAGE.findOne({ entity: "privateKey" })?.value || generateKeyPair());

function generateKeyPair () {
    let _key = new RSA({b: 1024}).exportKey();
    global.STORAGE.insertOne({ entity: "privateKey", value: _key});
    return _key;
}

function createNewUser(user, pw) {
    return new Promise(async (res, rej) => {
        if (!global.USERS.findOne({ user })) {
            global.USERS.insertOne({ user, hash: await hash(pw, saltRounds) });
            res({ error: false, msg: "user created" });
        } else {
            res({ error: true, msg: "user already exist" });
        }
    });
}

function checkUserPw(user, pw) {
    return new Promise(async (res, rej) => {
        let target = global.USERS.findOne({ user });
        if (target && await compare(pw, target.hash)) {
            let {payload: { token }} = await createJWT(target.user);
            res({ error: false, msg: "User and password correct", payload: {user: target, token} });
        } else {
            res({ error: true, msg: "User or password incorrect" });
        }
    });
}

function createJWT(user) {
    return new Promise(async (res, rej) => {
        let target = global.USERS.findOne({ user });
        if (target) {
            jwt.sign({ user: {user: target.user, _id: target._id} }, keys.exportKey(), { algorithm: 'RS256', expiresIn: '7d' }, function (err, token) {
                if (err) {
                    console.error(err);
                    res({ error: true, msg: "Something went wrong", payload: { token: null } });
                    return;
                }
                res({ error: false, msg: "JWT token created", payload: { token } });
            });
        } else {
            res({ error: true, msg: "User not found", payload: { token: null }  });
        }
    });
}

function checkJWT(tk) {
    return new Promise(async (res, rej) => {
        jwt.verify(tk, keys.exportKey(), async function (err, decoded) {
            if (err && !decoded) res({ error: true, msg: "Token invalid or expired" })
            else {
                let {payload: { token }} = await createJWT(decoded.user.user);
                res({ error: false, msg: "JWT valid", payload: {user: decoded.user, newToken: token} });
            }
        });
    });
}

export {
    createNewUser,
    checkUserPw,
    createJWT,
    checkJWT
}