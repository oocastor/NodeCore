import {https} from "./web.js";
import {Server} from "socket.io";
import { isAuth, checkUserPw, checkJWT, createNewUser } from "./auth.js";

const io = new Server(https, {
    cors: {
        origin: ["http://localhost:8080"],
        credentials: true,
    }
});

io.on("connect", (socket) => {
    console.log(socket.id);

    socket.on("auth:pw", async (data, ack) => {
        let {user,pw} = data;
        let {error, msg, payload} = await checkUserPw(user, pw);

        //wrong user or pw -> show login page with msg
        if(error) socket.emit("goto:login", {msg})
        else {
            //run ack, send jwt token to client
            ack(payload.token);
        }
    });

    socket.on("auth:token", async (data, ack) => {
        let {token} = data;
        let {error, msg, payload} = await checkJWT(token);
        if(error) socket.emit("goto:login", {msg})
        else {
            //run ack, send new jwt token to client
            ack(payload.newToken);
        }
    });

    //example: endpoint with auth
    socket.on("get:secret-data", (data) => isAuth(socket, data, () => {
        console.log(socket.id + " knows the secret now!")
    }));
});

global.IO = io;
