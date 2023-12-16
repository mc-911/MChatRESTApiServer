import express, { Request, Response } from 'express';
import { authentication } from './middleware/auth.middleware';
import { config } from 'dotenv'
config();
const cors = require('cors');
const app = express()
const port = process.env.PORT ? process.env.PORT : 3000
const cookieParser = require('cookie-parser')


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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})

app.post('/api/authCheck', authentication, async (req: Request, res: Response) => {
    res.json({ jwt: req.cookies["x-auth-token"] });
})