import "./bin/database.js";
import {io} from "./bin/socket.js";
import { isAuth, checkUserPw, checkJWT, createNewUser } from "./bin/auth.js";

io.on("connect", (socket) => {
    console.log(socket.id);

    socket.on("auth:pw", async (data, ack) => {
        console.log(data);
        let {user,pw} = data;
        let {error, msg, payload} = await checkUserPw(user, pw);

        //wrong user or pw -> show login page with msg
        if(error) socket.emit("goto:login", {msg})
        else {
            //run ack, send jwt token to client
            ack({token: payload.token});
        }
    });

    socket.on("auth:token", async (data, ack) => {
        let {token} = data;
        let {error, msg, payload} = await checkJWT(token);
        if(error) socket.emit("goto:login", {msg})
        else {
            //run ack, send new jwt token to client
            ack({token: payload.newToken});
        }
    });

    socket.on("get:secret-data", (data) => isAuth(socket, data, () => {
        console.log(socket.id + " knows the secret now!")
    }));
});

checkUserPw("test", "test").then((res) => {
    console.log(res);
    if(res.error) return;
    setTimeout(async(res) => {
        console.log((await checkJWT(res.payload.token)))
    }, 1000, res);
});