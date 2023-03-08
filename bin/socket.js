import {https} from "./web.js";
import {Server} from "socket.io";

const io = new Server(https, {
    cors: {
        origin: ["http://localhost:8080"]
    }
});

export {
    io
}
