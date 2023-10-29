- This is a signalling server made using socket.io and simple-peer for the webRTC part.
- This is by no means complete, and is missing important admin control features.

Currently it is using a MESH architecture wherein each peer setups a connection with every other peer in the room.
This is not scalable, I tried setting up a SFU architecture, but could not succeed.
But definitely got to learn a lot of things about webRTC and MCU and SFU architectures.

Envs Used -
CORS_URL = The url where the client is hosted
PORT = The port on which the server will run
