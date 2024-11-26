import express, { Request, Response } from 'express';
import { authentication } from './middleware/auth.middleware';
import { config } from 'dotenv'
import { Server } from 'socket.io';
import { createServer } from 'node:http'
import { verify } from "jsonwebtoken";
import { getMemberInfo } from './models/chat.model';
config();
const cors = require('cors');
const app = express()
const server = createServer(app)
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});
const port = process.env.PORT ? process.env.PORT : 3000
const cookieParser = require('cookie-parser')

io.on('connection', (socket) => {
    console.log("User Connected!")
    socket.on("join chat", async (chatId, jwt) => {
        if (true) {
            try {
                const decoded = verify(jwt, process.env["jwt_secret"] as string);
                if (typeof decoded === 'string') {
                    throw new Error('Invalid token');
                }
                const userId = decoded.userId as string;
                if (await getMemberInfo(userId, chatId)) {
                    await socket.join(chatId);
                    console.log(`Joined Chat, User Id: ${userId}, Chat Id: ${chatId}`)
                } else {
                    console.log('Client is not a member of chat!')
                }
            } catch (err) {
                console.log("Client did not join chat")
            }
        }
    })
    socket.on("send message", async (chatId, message, timestamp, jwt) => {
        try {
            const decoded = verify(jwt, process.env["jwt_secret"] as string);
            if (typeof decoded === 'string') {
                throw new Error('Invalid token');
            }
            const userId = decoded.userId as string;
            const username = decoded.username as string;
            if (await getMemberInfo(userId, chatId)) {
                console.log("Request Authenticated.. Moving on")
                io.to(chatId).emit("receive message", message, timestamp, userId, username)
            } else {
                console.log('Client is not a member of chat!')
            }
        } catch (err) {
            console.log("Request not authenticated")
        }
    })
    socket.on("join request", async (jwt) => {
        try {
            const decoded = verify(jwt, process.env["jwt_secret"] as string);
            if (typeof decoded === 'string') {
                throw new Error('Invalid token');
            }
            const userId = decoded.userId as string;
            console.log("Connecting to " + userId)
            await socket.join(userId)
        } catch (err) {
            console.log("Request not authenticated")
        }
    })
    socket.on("send friend request", (friendRequestId, receiverId, jwt) => {
        try {
            const decoded = verify(jwt, process.env["jwt_secret"] as string);
            if (typeof decoded === 'string') {
                throw new Error('Invalid token');
            }
            const userId = decoded.userId as string;
            const username = decoded.username as string;
            io.to(receiverId).emit("receive friend request", friendRequestId, "false", userId, username)
        } catch (err) {
            console.log("Request not authenticated")
        }
    })
    socket.on("notify friend request accepted", (requesterId, friendRequestId) => {
        io.to(requesterId).emit("friend request accepted", friendRequestId);
    })
    socket.on("notify friend request denied", (requesterId, friendRequestId) => {
        io.to(requesterId).emit("friend request denied", friendRequestId);
    })
});


app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

require('./routes/user.routes')(app)
require('./routes/chat.routes')(app)

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})

app.post('/api/authCheck', authentication, async (req: Request, res: Response) => {
    res.json({ jwt: req.cookies["x-auth-token"] });
})