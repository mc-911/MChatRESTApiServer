import express, { Express, Request, Response } from 'express';
import * as pg from 'pg'
import bodyParser from 'body-parser'; // Import the body-parser module
import * as bcrpyt from 'bcrypt';
import * as Joi from 'joi';
import * as jsonwebtoken from 'jsonwebtoken';
import * as nodemailer from 'nodemailer';
import * as google from 'googleapis';
import { time } from 'console';
import { chat } from 'googleapis/build/src/apis/chat';

const OAuth2 = google.Auth.OAuth2Client;

const cors = require('cors');
const app = express()
const port = 3000
const db = require('./db');
const cookieParser = require('cookie-parser')
app.use(
    cors({
        origin: process.env.FRONTEND_URL,
        credentials: true,
    })
);
app.use(cookieParser())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const getVerificationMessage = (url: string): string => {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Static Template</title>
  </head>
  <style>
    a {
      color: black;
    }
  </style>
  <body>
    <h1>Welcome to MCSocialMedia</h1>
    <h2>Click the button below to verify your account</h2>
    <a
      href="${url}"
      style="
        border: 1px;
        border-style: solid;
        height: 3rem;
        width: 15rem;
        border-radius: 10px;
        display: flex;
        justify-content: center;
        align-items: center;
        text-decoration: none;
      "
    >
      Verfiy Account
    </a>
  </body>
</html>`
}


const sendEmail = async (email: string, subject: string, text: string) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "live.smtp.mailtrap.io",
            port: 587,
            auth: {
                user: "api",
                pass: process.env.smtp_passwword
            }
        });
        await transporter.sendMail({
            from: process.env.email_address,
            to: email,
            subject: subject,
            text: text,
        });
        console.log("email sent sucessfully");
    } catch (error) {
        console.log("email not sent");
        console.log(error);
    }
};
const sendVerificationEmail = async (email: string, url: string) => {
    try {
        const transporter = nodemailer.createTransport({
            host: "live.smtp.mailtrap.io",
            port: 587,
            auth: {
                user: "api",
                pass: process.env.smtp_passwword
            }
        });
        console.log(getVerificationMessage(url))
        await transporter.sendMail({
            from: process.env.email_address,
            to: email,
            subject: "Verify your email",
            html: getVerificationMessage(url),
        });
        console.log("email sent sucessfully");
    } catch (error) {
        console.log("email not sent");
        console.log(error);
    }
};
app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!')
})
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})

app.get('/api/resetUsers', (req, res) => {
    db.query('')
})
app.post('/api/login', (req, res) => {
    console.log('req.body: ', req.body);
    const schema: Joi.AnySchema = Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#\$&*~]).{8,}$/).required()
    });
    const validation_result: Joi.ValidationResult = schema.validate(req.body);
    const error: Joi.ValidationError | undefined = validation_result.error;
    const email = req.body.email;
    const password = req.body.password;
    if (email && password) {
        loginUser(res, email, password)
    } else {
        console.log("Invalid request body")
        res.sendStatus(400);
    }
})

app.post('/api/register', (req, res) => {
    //TODO perform validation on request body
    const schema: Joi.AnySchema = Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().min(1)
    });

    const email = req.body.email;
    const password = req.body.password;
    const validation_result: Joi.ValidationResult = schema.validate(req.body);
    const error: Joi.ValidationError | undefined = validation_result.error;
    const value = validation_result.value;
    if (!error) {
        registerUser(res, email, password)
    } else {
        console.log("Invalid request body")
        console.log(error.message)
        res.sendStatus(400);
    }

})
const authorization = (req: Request, res: Response, next: Function) => {
    const token = req.cookies["x-auth-token"];
    if (!token || typeof token !== "string") {
        console.log("x-auth-token not found")
        res.sendStatus(401);
    } else {
        try {
            const decoded = jsonwebtoken.verify(token!, process.env["jwt_secret"] as string);
            if (typeof decoded === 'string') {
                throw new Error('Invalid token');
            }
            req.body.userId = decoded.userId;
            console.log("Request Authenticated.. Moving on")
            next();
        } catch (err) {
            console.log("Request not authenticated")
            res.sendStatus(401);
        }
    }
}
app.post('/api/getMessages', authorization, async (req: Request, res: Response) => {
    const schema: Joi.AnySchema = Joi.object().keys({
        userId: Joi.string().required(),
        chatId: Joi.string().required()
    })
    const validation_result: Joi.ValidationResult = schema.validate(req.body);
    if (validation_result.error) {
        res.sendStatus(400);
    } else {
        if (await checkUserInChat(req.body.userId, req.body.chatId)) {
            const messages = await getChatMessages(req.body.chatId);
            res.send({ messages }).status(200)
        } else {
            res.sendStatus(403);
        }
    }
})
app.post('/api/storeMessage', authorization, async (req: Request, res: Response) => {
    const schema: Joi.AnySchema = Joi.object().keys({
        userId: Joi.string().required(),
        chatId: Joi.string().required(),
        timestamp: Joi.number().required(),
        content: Joi.string().required().max(2000)
    })
    const validation_result: Joi.ValidationResult = schema.validate(req.body);
    if (validation_result.error) {
        res.sendStatus(400);
    } else {
        if (await checkUserInChat(req.body.userId, req.body.chatId)) {
            await storeChatMessage(req.body.userId, req.body.chatId, req.body.timestamp, req.body.content)
            res.sendStatus(201);
        } else {
            res.sendStatus(403);
        }
    }
})

const storeChatMessage = async (ownerId: string, chatId: string, timestamp: number, content: string) => {
    console.log("Trying to store message with these values: ", { ownerId, chatId, timestamp, content })
    const result: pg.QueryResult = await db.query(`
  INSERT INTO social_media.messages(content, owner, chat, "timestamp")
  VALUES ($1, $2, $3, to_timestamp($4 / 1000.0));
`, [content, ownerId, chatId, timestamp]);

    console.log(result)
}

const checkUserInChat = async (userId: string, chatId: string): Promise<boolean> => {
    const result: pg.QueryResult = await db.query(`SELECT $1 in (SELECT chat_members.user FROM social_media.chat_members where chat = $2) as user_in_chat`, [userId, chatId]);
    console.log(result.rows[0])
    return result.rows[0].user_in_chat;
}
const getChatMessages = async (chatId: string) => {
    const result: pg.QueryResult = await db.query(`SELECT * FROM social_media.messages where chat = $1`, [chatId]);
    return result.rows;

}
app.get('/api/users', authorization, async (req: Request, res: Response) => {
    console.log("req.body.userId: ", req.body.userId)
});

app.post('/api/verify', async (req: Request, res: Response) => {
    const schema: Joi.AnySchema = Joi.object().keys({
        token: Joi.string().required()
    });
    const validation_result: Joi.ValidationResult = schema.validate(req.body);
    console.log("Verifying Token")

    if (validation_result.error) {
        res.sendStatus(400)
    } else {
        await verifyEmail(req.body.token) ? res.sendStatus(200) : res.sendStatus(400);
    }
});

app.post('/api/authCheck', authorization, async (req: Request, res: Response) => {
    res.send(200);
})

const verifyEmail = async (token: string): Promise<boolean> => {
    try {
        const decoded = jsonwebtoken.verify(token, process.env["jwt_secret"] as string);
        if (typeof decoded === 'string') {
            throw new Error('Invalid token');
        }
        const result: pg.QueryResult = await db.query(`UPDATE social_media.users SET active = true WHERE user_id = '${decoded.userId}'`);
        console.log("result: ", result);
        return true;
    } catch {
        return false;
    }
}

const loginUser = async (res: Response, email: string, password: string) => {
    const result: pg.QueryResult = await db.query(`SELECT * FROM social_media.users WHERE email = $1`, [email]);
    if (result.rows.length == 0) {
        console.log("No user found");
        res.sendStatus(400);
    } else {
        const user = result.rows[0];
        const hashedPassword = await bcrpyt.hash(password, user.salt);
        console.log("hashedPassword: ", hashedPassword)
        console.log("user.password: ", user.password)
        if (user.password == hashedPassword) {
            console.log("Login Successful")
            const signedJWT = jsonwebtoken.sign({ userId: user.user_id }, process.env["jwt_secret"] as string, { expiresIn: '5h' });
            res.cookie("x-auth-token", signedJWT, {
                // can only be accessed by server requests
                httpOnly: false,
                // path = where the cookie is valid
                path: "/",
                // domain = what domain the cookie is valid on
                domain: "localhost",
                // secure = only send cookie over https
                secure: false,
                // sameSite = only send cookie if the request is coming from the same origin
                sameSite: "lax", // "strict" | "lax" | "none" (secure must be true)
                // maxAge = how long the cookie is valid for in milliseconds
                maxAge: 3600000
            }).sendStatus(200);
        } else {
            console.log("Password Invalid")
            res.sendStatus(400);
        }
    }
}
const addNewUser = async (email: string, hashedPassword: string, salt: string): Promise<pg.QueryResult> => {
    return db.query(`INSERT INTO social_media.users (email, password, salt) VALUES ($1, $2, $3) RETURNING user_id`, [email, hashedPassword, salt])
}

const addEmailVerificationToken = async (userId: string, token: string): Promise<pg.QueryResult> => {
    return db.query(`INSERT INTO social_media.email_tokens VALUES ('${userId}', '${token}')`)
}
const checkEmailExists = async (email: string): Promise<boolean> => {

    const result: pg.QueryResult = await db.query(`SELECT COUNT(*) as email_count FROM social_media.users WHERE email = $1`, [email]);
    return result.rows[0].email_count > 0
}
const registerUser = async (response: Response, email: string, password: string) => {

    if (!await checkEmailExists(email)) {
        const salt = await bcrpyt.genSalt(10);
        const hashedPassword = await bcrpyt.hash(password, salt);
        const addUserResult = await addNewUser(email, hashedPassword, salt);
        const emailToken = await jsonwebtoken.sign({ userId: addUserResult.rows[0].user_id }, process.env["jwt_secret"] as string);
        const verificationMessage = `${process.env.FRONTEND_URL as string}/?token=${emailToken}`
        sendVerificationEmail(email, verificationMessage);
        console.log("User added");
        response.sendStatus(201);
    } else {
        console.log("Email already exists");
        response.sendStatus(400);
    }
}
