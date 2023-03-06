import cookie from "cookie";
import { hash, compare } from "bcrypt";
import jwt from "jsonwebtoken"; //TODO: create and import long secret

//bcrypt config
const saltRounds = 10;

//jwt config
const TOKEN = "testTOKEN1234"

function createNewUser(user, pw) {
    return new Promise(async (res, rej) => {
        if (!global.USERS.find({ user }).length) {
            global.USERS.insertOne({ user, hash: await hash(pw, saltRounds) });
            res({ error: false, msg: "user created" });
        } else {
            res({ error: true, msg: "user already exist" });
        }
    });
}

function checkUserPw(user, pw) {
    return new Promise(async (res, rej) => {
        let target = global.USERS.find({ user })[0];
        if (target && await compare(pw, target.hash)) {
            jwt.sign({ user: target.user }, TOKEN, { expiresIn: '7d' }, function (err, token) {
                if (err) {
                    console.error(new Error("cannot sign jwt token"));
                    res({ error: true, msg: "something went wrong" });
                    return;
                }
                res({ error: false, msg: "user and password correct", payload: {user: target, token} });
            });
        } else {
            res({ error: true, msg: "user or password incorrect" });
        }
    });
}

function checkJWT(tk) {
    return new Promise(async (res, rej) => {
        jwt.verify(tk, TOKEN, function (err, decoded) {
            if(err && !decoded) res({ error: true, msg: "JWT invalid or expired"})
            else res({ error: false, msg: "JWT valid", payload: decoded})
        });
    });
}

async function isAuth(socket, data, cb) {
    let raw = socket.handshake.headers.cookie;
    let cookies = raw ? cookie.parse(raw) : null;

    //if token is not present or invalid -> show login page and prevent cb function
    if (!cookies || cookies?.token || !(await checkJWT(cookie.token)).error) {
        socket.emit("goto:login");
        return;
    }

    cb(data);
}

export {
    createNewUser,
    checkUserPw,
    checkJWT,
    isAuth
}