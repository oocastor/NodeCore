import {https} from "./web.js";
import {Server} from "socket.io";

const io = new Server(https, {});

export {
    io
}
