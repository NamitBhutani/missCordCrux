"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "http://localhost:3000",
    }
});
const socketIds = {};
const socketRoomMap = {};
io.on('connection', (socket) => {
    socket.on('join room', (roomID) => {
        if (socketIds[roomID]) {
            socketIds[roomID].push(socket.id);
        }
        else {
            socketIds[roomID] = [socket.id];
        }
        socketRoomMap[socket.id] = roomID;
        const usersInRoom = socketIds[roomID].filter((id) => id !== socket.id);
        //  console.log("usersInThisRoom", JSON.stringify(usersInThisRoom))
        socket.emit('peers list', usersInRoom);
    });
    socket.on('send offer', (payload) => {
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
    });
    socket.on('return answer', (payload) => {
        io.to(payload.callerID).emit('receive return answer', { signal: payload.signal, id: socket.id });
    });
    socket.on('disconnect', () => {
        const roomID = socketRoomMap[socket.id];
        let room = socketIds[roomID];
        if (room) {
            room = room.filter((id) => id !== socket.id);
            socketIds[roomID] = room;
        }
        socket.broadcast.emit('user disconnect', socket.id);
    });
});
const PORT = 6969;
server.listen(PORT, () => console.log(`Server running`));
//# sourceMappingURL=server.js.map