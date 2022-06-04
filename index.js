const app = require('express')();
const dotenv = require('dotenv');
const server = require('http').createServer(app);
const axios = require('axios')
const path = require('path')

dotenv.config({path:'./config.env'});

const io = require('socket.io')(server,{
    cors:{
        origin: process.env.CLIENT_URL
    }
});

app.get('/',(req,res)=>{
    res.send('Socket io server is running');
})

let users = [];

const addUser = (userId, socketId)=>{
    users.push({userId,socketId})
    return;
}

const removeUser = (socketId)=>{
    users = users.filter(user=>user.socketId !== socketId);
}

const getUser = (userId)=>{

    return users.find((user)=>user.userId === userId);
}

io.on("connection", (socket) => {

    socket.on("addUser", (userId)=>{
        addUser(userId, socket.id);
        io.emit("getUsers", users)
    })

    // Send and get message
    socket.on("sendMessage", ({userId,receiverId,text})=>{

        try {
            const user = getUser(receiverId);

            io.to(user.socketId).emit("getMessage", {
                userId,
                text
            });
            
        } catch (error) {
            
        }

    })

    // When disconnect
    socket.on("disconnect", ()=>{
        const user = users.find((user)=>user.socketId === socket.id);
       removeUser(socket.id);
       io.emit("getUsers", users);

        const updateLastSeen = async(req,res)=>{
            try {
                
                const res = await axios.put(`${process.env.BACKEND_URL}/api/v1/lastseen/${user.userId}`);

            } catch (error) {
                console.log(error);
            }
        }

        user? updateLastSeen(): null;
    })
})

const PORT= process.env.PORT || 5000;
server.listen(PORT, ()=>{
    console.log("server is listening at port 5000...");
})