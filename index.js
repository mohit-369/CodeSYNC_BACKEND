const express = require("express");
const dotenv=require('dotenv');
dotenv.config();
const app = express();
const http=require('http');
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);
const userSocketMap = {};
const PORT=process.env.PORT || 6000;

const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        userName: userSocketMap[socketId],
      };
    }
  );
};

io.on('connection', (socket) => {

  // console.log('socket id generation',socket.id);

  socket.on("join", ({ roomId, userName }) => {

    userSocketMap[socket.id] = userName;

    socket.join(roomId);

    const updatedClients = getAllConnectedClients(roomId);
    // console.log(updatedClients);

    updatedClients.forEach(({ socketId }) => {
      io.to(socketId).emit("joined", {
        clients: updatedClients,
        userName,
        socketId:socket.id
      });
    });
  });

  socket.on('change',({roomId,code})=>{
    socket.in(roomId).emit('change',{code});

  })
  socket.on("codesync", ({code,socketId}) => {
    io.to(socketId).emit("change", { code });
  });

  socket.on('disconnecting',()=>{
    const rooms=[...socket.rooms];

    rooms.forEach((roomId)=>{
      socket.in(roomId).emit('disconnected',{
        socketId:socket.id,
        userName:userSocketMap[socket.id]
      })
    })

    delete userSocketMap[socket.id];

    socket.leave();

  })
});

app.get("/", (req, res) => {
  res.send("Hello World");
});

server.listen(PORT, () => {
  console.log(`listen on port ${PORT}`);
});
