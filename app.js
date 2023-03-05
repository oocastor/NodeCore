import {io} from "./bin/socket.js";
import { isAuth, checkUserPw, checkJWT, createNewUser } from "./bin/auth.js";
import "./bin/database.js";

io.on("connect", (socket) => {
    console.log(socket.id);

    socket.on("authMe", (data) => {
        let {us,pw} = data;
        //TODO: 
    })

    socket.on("get:secret-data", (data) => isAuth(socket, data, () => {
        console.log(socket.id + " knows the secret now!")
    }));
});

createNewUser("test", "test");

checkUserPw("test", "test").then((res) => {
    console.log(res);
    //res.payload += "123";
    (async(res) => {
        console.log((await checkJWT(res.payload)))
    })(res);
});