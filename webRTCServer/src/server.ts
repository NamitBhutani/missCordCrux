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

const socketIds: User = {};

interface socketRoomMap {
    [socketID: string]: string;
}

const socketRoomMap: socketRoomMap = {};

io.on('connection', (socket) => {

    socket.on('join room', (roomID: string) => {

        if (socketIds[roomID]) {
            socketIds[roomID].push(socket.id);
        } else {
            socketIds[roomID] = [socket.id];
        }

        socketRoomMap[socket.id] = roomID;
        const usersInRoom = socketIds[roomID].filter((id) => id !== socket.id);
        //  console.log("usersInThisRoom", JSON.stringify(usersInThisRoom))
        socket.emit('peers list', usersInRoom);

    });

    socket.on('send offer', (payload: { userToSignal: string, signal: any, callerID: string }) => {

        io.to(payload.userToSignal).emit('user joined', { signal: payload.signal, callerID: payload.callerID });

    });

    socket.on('return answer', (payload: { callerID: string, signal: any }) => {
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
