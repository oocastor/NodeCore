import "./bin/database.js";
import {io} from "./bin/socket.js";
import { isAuth, checkUserPw, checkJWT, createNewUser } from "./bin/auth.js";

io.on("connect", (socket) => {
    console.log(socket.id);

    socket.on("auth:pw", async (data, ack) => {
        let {user,pw} = data;
        let {err, msg, payload} = await checkUserPw(user, pw);

        //wrong user or pw -> show login page with msg
        if(err) socket.emit("goto:login", {msg})
        else {
            //run ack and set header
            ack(err);
        }
    });

    socket.on("get:secret-data", (data) => isAuth(socket, data, () => {
        console.log(socket.id + " knows the secret now!")
    }));
});

// createNewUser("test", "test");

// checkUserPw("test", "test").then((res) => {
//     console.log(res);
//     if(res.error) return;
//     (async(res) => {
//         console.log((await checkJWT(res.payload.token)))
//     })(res);
// });