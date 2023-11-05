import { http, https } from "./web.js";
import { Server } from "socket.io";
import { checkUserPw, checkJWT } from "./auth.js";
import { EventEmitter } from "events";

const se = new EventEmitter();

const setupSocket = (server) => {
    // *** INIT SOCKET
    const io = new Server(server, {
        cors: {
            origin: ["https://localhost:8081"]
        }
    });

    io.on("connect", (socket) => {

        socket.on("auth:pw", async (data, ack) => {
            let { user, pw } = data;
            let { error, msg, payload } = await checkUserPw(user, pw);

            //wrong user or pw -> show login page with msg
            if (error) socket.emit("goto:login", { msg })
            else {
                //add socket to authed room
                socket.join("authed");
                //run ack, send jwt token to client
                ack(payload.token);
            }
        });

        socket.on("auth:token", async (data, ack) => {
            let { token } = data;
            let { error, msg, payload } = await checkJWT(token);
            if (error) socket.emit("goto:login", { msg })
            else {
                //add socket to authed room
                socket.join("authed");
                //run ack, send new jwt token to client
                ack(payload.newToken);
            }
        });

        socket.onAny((event, ...args) => {
            if (socket.rooms.has("authed")) se.emit(event, ...args, socket.id)
            else socket.emit("goto:login", { msg: "Access denied" });
        });
        socket.on("connect_error", (err) => {
            console.log(`connect_error due to ${err.message}`);
          });
    });
}
// HTTP Socket
const ioHttp = setupSocket(http);
// HTTPS Socket
const ioHttps = setupSocket(https);

function emitToAllServers(id, event, message) {
    if(!id || !event) return;
    ioHttp.to(id).emit(event, message);
    ioHttps.to(id).emit(event, message);
}

global.emitToAllServers = emitToAllServers;
global.SE = se;
