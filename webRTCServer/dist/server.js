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
const users = {};
const socketToRoom = {};
let usersInThisRoomTest = [];
io.on('connection', (socket) => {
    console.log('connected');
    socket.on('join room', (roomID) => {
        console.log("user joined room", "roomID", roomID, "socket ID", socket.id);
        if (users[roomID]) {
            const length = users[roomID].length;
            if (length === 4) {
                socket.emit('room full');
                return;
            }
            users[roomID].push(socket.id);
        }
        else {
            users[roomID] = [socket.id];
        }
        console.log("users", users);
        socketToRoom[socket.id] = roomID;
        usersInThisRoomTest = users[roomID];
        const usersInThisRoom = users[roomID].filter((id) => id !== socket.id);
        console.log("usersInThisRoom", JSON.stringify(usersInThisRoom));
        socket.emit('users list', usersInThisRoom);
    });
    socket.on('sending signal', (payload) => {
        // console.log("sending signal", payload)
        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
        // usersInThisRoomTest.forEach((userID) => {
        //     if (userID !== socket.id) {
        //         console.log("inside new stuff SENDING signal", socket.id)
        //         io.to(userID).emit('user joined', { signal: payload.signal, callerID: payload.callerID });
        //     }
        //     else { console.log("inside new stuff else", socket.id, userID) }
        // })
    });
    socket.on('returning signal', (payload) => {
        //console.log("returning signal", payload)
        io.to(payload.callerID).emit('receive return signal', { signal: payload.signal, id: socket.id });
        // usersInThisRoomTest.forEach((userID) => {
        //     if (userID !== socket.id) {
        //         console.log("inside new stuff", socket.id)
        //         io.to(userID).emit('receive return signal', { signal: payload.signal, id: socket.id });
        //     }
        //     else { console.log("inside new stuff else", socket.id, userID) }
        // })
    });
    socket.on('disconnect', () => {
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if (room) {
            room = room.filter((id) => id !== socket.id);
            users[roomID] = room;
        }
    });
});
const PORT = 8000;
server.listen(PORT, () => console.log(`Server is running on port 8000`));
//# sourceMappingURL=server.js.map