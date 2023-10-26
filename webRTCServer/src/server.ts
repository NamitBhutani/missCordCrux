import express, { Application } from 'express';
import http from 'http';
import { Server } from 'socket.io';

const app: Application = express();
const server = http.createServer(app);
const io: Server = new Server(server, {
    cors: {
        origin: "http://localhost:3000",

    }
});

interface User {
    [roomID: string]: string[];
}

const users: User = {};

interface SocketToRoom {
    [socketID: string]: string;
}

const socketToRoom: SocketToRoom = {};
let usersInThisRoomTest: string[] = [];
io.on('connection', (socket) => {
    console.log('connected');
    socket.on('join room', (roomID: string) => {
        console.log("user joined room", "roomID", roomID, "socket ID", socket.id)
        if (users[roomID]) {
            const length = users[roomID].length;
            if (length === 4) {
                socket.emit('room full');
                return;
            }
            users[roomID].push(socket.id);
        } else {
            users[roomID] = [socket.id];
        }
        console.log("users", users)
        socketToRoom[socket.id] = roomID;
        usersInThisRoomTest = users[roomID]
        const usersInThisRoom = users[roomID].filter((id) => id !== socket.id);
        console.log("usersInThisRoom", JSON.stringify(usersInThisRoom))
        socket.emit('users list', usersInThisRoom);
    });

    socket.on('sending signal', (payload: { userToSignal: string, signal: any, callerID: string }) => {
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

    socket.on('returning signal', (payload: { callerID: string, signal: any }) => {
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
