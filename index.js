const app = require('express')()
const http = require('http').createServer(app)
const { addUser, removeUser, getUser,
    getUsersInRoom } = require("./User");

app.get('/', (req, res) => {
    res.send("Node Server is running. Yay!!")
})

//Socket Logic
const socketio = require('socket.io')(http)

socketio.on("connection", (socket) => {
    console.log('connect');
    // userSocket.on("send_message", (data) => {
    //     userSocket.broadcast.emit("receive_message", data)
    // })
    socket.on('join', ({ name,mobileNo,dbId,room }, callback) => {

        const { error, user } = addUser(
            { id: socket.id, name,mobileNo,dbId,room });
  
        if (error) return callback(error);
  
        // Emit will send message to the user
        // who had joined
        socket.emit('message', { user: 'admin', text:
            `${user.name},
            welcome to room ${user.room}.` });
  
        // Broadcast will send message to everyone
        // in the room except the joined user
        socket.broadcast.to(user.room)
            .emit('message', { user: "admin",
            text: `${user.name}, has joined` });
  
        socket.join(user.room);
  
        socketio.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });
        callback();
    })
    
  socket.on('sendMessage', (message, callback) => {

    const user = getUser(socket.id);
    socketio.to(user.room).emit('message',
        { user: user.name, text: message });

        socketio.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
    });
    callback();
})

socket.on('disconnect', () => {
    const user = removeUser(socket.id);
    if (user) {
        socketio.to(user.room).emit('message',
        { user: 'admin', text:
        `${user.name} had left` });
    }
})
})

http.listen(process.env.PORT)