Misscord (Video Chat Platform)

- Made using Next.js for frontend and the backend.
- Supabase - For OAuth and Database
- Redis- For caching chats and dm rooms
- Socket.io and WebRTC(simple-peer) - For real time video chat
- Tailwind - for Styling
- ShadCN UI- UI components
- Vercel - For hosting the frontend
- Render - For hosting the signalling (websockets) server
- Railway - For hosting the Redis DB
- Docker - For containerizing the signalling server and redis.
  INFO-
  Free instance types will spin down with inactivity - The webrtc server will spin down, to wake it up, visit https://webrtc-y1s8.onrender.com, if you get the response - Cannot GET / , it should work fine then!

Known BUGS -

- When a new member joins a group call, the stream isn't rendered for other members, but the new member can see the streams of other members. This is not consistent, sometimes it does render.
  (I feel this is due to how Next.js handles the rendering of components, and I'm working on a fix for this)

Things I can improve -

- I can add a lot of admin controls for the webRTC server, like kicking out a user, muting a user, etc.
- Error handling and error popups can be improved.
