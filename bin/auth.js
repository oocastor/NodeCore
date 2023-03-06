import cookie from "cookie";
import { hash, compare } from "bcrypt";
import jwt from "jsonwebtoken"; //TODO: create and import long secret

//bcrypt config
const saltRounds = 10;

//jwt config
const TOKEN = "jwtTOKEN2023"

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
            delete target.hash;
            jwt.sign({ user: target }, TOKEN, { expiresIn: '7d' }, function (err, token) {
                if (err) {
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
        jwt.verify(tk, TOKEN, async function (err, decoded) {
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
        socket.emit("goto:login", {error: true, msg: "access denied"});
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