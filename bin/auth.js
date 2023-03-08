import cookie from "cookie";
import { hash, compare } from "bcrypt";
import jwt from "jsonwebtoken"; //TODO: create and import long secret
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
        console.log(target);
        if (target && await compare(pw, target.hash)) {
            let {payload: { token }} = await createJWT(target.user);
            res({ error: false, msg: "user and password correct", payload: {user: target, token} });
        } else {
            res({ error: true, msg: "user or password incorrect" });
        }
    });
}

function createJWT(user) {
    return new Promise(async (res, rej) => {
        let target = global.USERS.findOne({ user });
        if (target) {
            jwt.sign({ user: {user: target.user, _id: target._id} }, keys.exportKey(), { algorithm: 'RS256', expiresIn: '7d' }, function (err, token) {
                if (err) {
                    console.log(err);
                    console.error(new Error("cannot sign jwt token"));
                    res({ error: true, msg: "something went wrong", payload: { token: null } });
                    return;
                }
                res({ error: false, msg: "jwt token created", payload: { token } });
            });
        } else {
            res({ error: true, msg: "user not found", payload: { token: null }  });
        }
    });
}

function checkJWT(tk) {
    return new Promise(async (res, rej) => {
        jwt.verify(tk, keys.exportKey(), async function (err, decoded) {
            if (err && !decoded) res({ error: true, msg: "JWT invalid or expired" })
            else {
                let {payload: { token }} = await createJWT(decoded.user.user);
                res({ error: false, msg: "JWT valid", payload: {user: decoded.user, newToken: token} });
            }
        });
    });
}

async function isAuth(socket, data, cb) {
    let raw = socket.handshake.headers.cookie;
    let cookies = raw ? cookie.parse(raw) : null;

    //if token is not present or invalid -> show login page and prevent cb function
    if (!cookies || cookies?.token || (await checkJWT(cookie.token)).error) {
        socket.emit("goto:login", {msg: "access denied"});
        return;
    }

    cb(data);
}

export {
    createNewUser,
    checkUserPw,
    createJWT,
    checkJWT,
    isAuth
}