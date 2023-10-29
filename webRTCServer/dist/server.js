"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const dotenv = require('dotenv');
dotenv.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    path: '/api',
    cors: {
        origin: process.env.CORS_URL,
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
const port = process.env.PORT;
server.listen(port, () => console.log(`Server running on ${port}`));
//# sourceMappingURL=server.js.map