import express, { Express, Request, Response } from 'express';
import * as pg from 'pg'
import * as bcrpyt from 'bcrypt';
import * as Joi from 'joi';
import * as jsonwebtoken from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import Mailgun from 'mailgun.js'
import FormData from 'form-data';
import validator from 'validator'
import { S3, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const cors = require('cors');
const app = express()
const port = process.env.PORT ? process.env.PORT : 3000
const db = require('./db');
const cookieParser = require('cookie-parser')

const s3 = new S3({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string
    },
    region: process.env.AWS_S3_REGION
});
const storage = multer.memoryStorage();


const upload = multer({
    storage: storage, limits: {}, fileFilter: function (req, file, cb) {
        const acceptableFileTypes = /\.(jpg|jpeg|png|gif)$/;
        if (!path.extname(file.originalname).match(acceptableFileTypes)) {
            return cb(null, false);
        }
        cb(null, true)

    }
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

const getVerificationMessage = (url: string, username: string): string => {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Static Template</title>
  </head>
  <style>
    .btn, .btn:hover {
      	color: rgb(229 231 235);
    	height: 3.5rem;
    	display: flex;
    	flex-direction: column;
    justify-content: center
    	border-radius: 0.5rem;
    	background-color: #0c4469;
    	width: 25%;
    	margin:auto;
    min-width: min-content;
    	
    }
    body {
          	color: rgb(229 231 235);

    	background-color: #051b29;
    gap: 3rem;
    padding: 1rem;
       display: flex;
    flex-direction: column;
    }
    
    
    .form {
    background-color: rgb(31 41 55 / 200);
    padding: 1rem;
    width: 65%;
    margin: auto;
    display: flex;
    flex-direction: column;
    gap: 3rem;
    }
  </style>
  <body>
<svg height="50" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 217.04 85.04"><defs><style>.cls-1{fill:#dceefa;}</style></defs><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><polygon class="cls-1" points="14.19 83.96 0 83.83 26.02 21.74 40.21 21.87 14.19 83.96"/><polygon class="cls-1" points="66.51 84.12 55.94 84.12 77.85 0 88.42 0 66.51 84.12"/><polygon class="cls-1" points="55.97 83.96 65.36 83.96 43.52 0.16 34.13 0.16 55.97 83.96"/><path class="cls-1" d="M126.38,65v2.26c0,8.5-1.53,17.8-13.61,17.8-11.57,0-13.55-8.2-13.55-18V33c0-10.69,4.59-16.59,13.64-16.59,11.21,0,13.22,8,13.22,16.71v2.61h-7.22V32.63c0-5.29-.83-9.69-6.11-9.69-5,0-6.27,4-6.27,9.86V67.48c0,6.7,1.46,11.11,6.48,11.11,5.21,0,6.15-4.52,6.15-10.81V65Z"/><path class="cls-1" d="M140.88,14.39V37.82c1.32-3,4.28-5.39,9.32-5.39,7.62,0,9.9,5.73,9.9,13.08V84.15H153V47.31c0-4.25-.58-8.37-5.39-8.37-5.45,0-6.72,4.17-6.72,11.58V84.15h-7.1V14.39Z"/><path class="cls-1" d="M192.52,75.34c0,3.47.06,7.31.2,8.81h-6.6a35.85,35.85,0,0,1-.53-4.14C184,83.77,180.81,85,177.26,85,169.9,85,167,78.42,167,70.56v-.9c0-11.52,7.15-15.59,16.22-15.59h2.21V46c0-4.61-.78-7.53-4.77-7.53s-5,3-5,7v1.35h-7V45.58c0-7.11,2.8-13.15,12.3-13.15,8.88,0,11.65,5.56,11.65,13.07Zm-7-15.6h-2.48c-5.77,0-9.2,2.42-9.2,9.77v.85c0,4.55,1.41,8.21,5.39,8.21,4.68,0,6.29-3.74,6.29-11.36Z"/><path class="cls-1" d="M197,33.23h5.84V20.72h7.05V33.23H217v6.31h-7.18V73.73c0,2.62.47,5.13,3.68,5.13a15.51,15.51,0,0,0,3.19-.3v5.5a16,16,0,0,1-5.52.78c-4.94,0-8.4-2-8.4-9.82V39.54H197Z"/><rect class="cls-1" x="81.99" width="9.95" height="84.12"/></g></g></svg>
    <div class="form">
          <div>
      Hey <b>${username}</b>, <br /> <br/>
      
      Your nearly ready to start chatting. Click on the button below to verify your email and address.

    </div>
    <a class="btn"
      href="${url}"
      
    >
     <div>
       Verfiy Account </div>
    </a>
    </div>

  </body>
</html>`
}
console.log("Database_URL", process.env.DATABASE_URL);

const mailgun = new Mailgun(FormData);
const mg = mailgun.client({ username: 'api', key: process.env.MAILGUN_API_KEY || 'key-yourkeyhere' });

const sendVerificationEmail = async (email: string, url: string, username: string) => {
    console.log(process.env.MAILGUN_API_KEY)

    mg.messages.create('email.mustapha-conteh.me', {
        from: "MChat <mailer@email.mustapha-conteh.me>",
        to: [email],
        subject: "Email Verification",
        text: "Testing some Mailgun awesomeness!",
        html: getVerificationMessage(url, username)
    })
        .then(msg => console.log(msg)) // logs response data
        .catch(err => console.log(err)); // logs any error
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
    if (email && password && req.headers.origin) {
        loginUser(res, email, password, req.headers.origin)
    } else {
        console.log("Invalid request body")
        res.sendStatus(400);
    }
})

app.post('/api/register', (req, res) => {
    //TODO perform validation on request body
    const schema: Joi.AnySchema = Joi.object().keys({
        email: Joi.string().email().required(),
        username: Joi.string().required(),
        password: Joi.string().min(1)
    });

    const email = req.body.email;
    const password = req.body.password;
    const username = req.body.username;
    const validation_result: Joi.ValidationResult = schema.validate(req.body);
    const error: Joi.ValidationError | undefined = validation_result.error;
    const value = validation_result.value;
    if (!error) {
        registerUser(res, email, password, username)
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

const validateUserIdParam = (req: Request, res: Response, next: Function) => {
    const validUUID = validator.isUUID(req.params.userId, 4)
    if (validUUID) {
        next()
    } else {
        res.sendStatus(400)
    }
}

const validateChatIdParam = (req: Request, res: Response, next: Function) => {
    const validUUID = validator.isUUID(req.params.chatId, 4)
    if (validUUID) {
        next()
    } else {
        res.sendStatus(400)
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
    res.json({ jwt: req.cookies["x-auth-token"] });
})

app.get('/api/checkChatAccess/:chatId', authorization, async (req: Request, res: Response) => {
    console.log(req.params.chatId);
    const validUUID = validator.isUUID(req.params.chatId, 4)
    if (validUUID) {
        const valid = await checkUserInChat(req.body.userId, req.params.chatId);
        if (valid) {
            res.sendStatus(200);
        } else {
            res.sendStatus(401);
        }
    } else {
        res.sendStatus(400);
    }
})

app.get('/api/users/:userId/profilePicture', authorization, validateUserIdParam, async (req: Request, res: Response) => {
    const result: pg.QueryResult = await db.query("SELECT * from social_media.users where user_id = $1", [req.params.userId])
    if (!result.rowCount) {
        res.sendStatus(404);
    } else if (result.rows[0].profile_picture) {
        const command = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME as string,
            Key: result.rows[0].profile_picture,
        })
        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        res.redirect(url);

    } else {
        res.sendStatus(404)
    }
}
)

app.get('/api/users/:userId/friends', authorization, validateUserIdParam, async (req: Request, res: Response) => {
    if (req.params.userId !== req.body.userId) {
        res.sendStatus(403);
    } else {
        const query = "SELECT user_friends.*, username from (SELECT CASE WHEN friend_one = $1 THEN friend_two ELSE friend_one END AS user_id, chat_id FROM social_media.friends WHERE $1 IN (friend_one, friend_two)) as user_friends JOIN social_media.users on user_friends.user_id = social_media.users.user_id";
        const result: pg.QueryResult = await db.query(query, [req.params.userId]);
        return res.json({ friends: result.rows });
    }
})
app.delete('/api/users/:userId/friends/:friendId', authorization, validateUserIdParam, async (req: Request, res: Response) => {
    const schema: Joi.AnySchema = Joi.object().keys({
        userId: Joi.string().required(),
        friendId: Joi.string().required()
    });
    const error = schema.validate(req.params).error;
    if (req.params.userId !== req.body.userId) {
        res.sendStatus(403);
    } else if (error) {
        res.statusCode = 400;
        res.send(error.message)
    } else {
        const query = "DELETE FROM social_media.friends WHERE $1 in (friend_one, friend_two) AND $2 in (friend_one, friend_two)"
        const result: pg.QueryResult = await db.query(query, [req.params.userId, req.params.friendId]);
        return res.json({ friends: result.rows });
    }
})
app.post('/api/users/:userId/friend_request', authorization, validateUserIdParam, async (req: Request, res: Response) => {
    const schema: Joi.AnySchema = Joi.object().keys({
        friend_email: Joi.string().required(),
        userId: Joi.string().required()
    });
    const error = schema.validate(req.body).error;
    if (!error) {
        const emailResult: pg.QueryResult = await db.query("SELECT * from social_media.users where email = $1", [req.body.friend_email])
        if (emailResult.rowCount == 0) {
            res.sendStatus(404);
        } else if (req.params.userId === emailResult.rows[0].user_id) {
            res.statusCode = 403;
            res.json({ error: "Can't send friend request to self" })
        } else {
            const checkExistingRequestResult = await db.query("SELECT friend_request_id, requester, requestee FROM social_media.friend_requests WHERE requester = $1 and requestee = $2", [req.params.userId, emailResult.rows[0].user_id])
            const checkIfFriendResult = await db.query("SELECT friend_one, friend_two, chat_id FROM social_media.friends WHERE $1 in (friend_one, friend_two) AND $2 in (friend_one, friend_two)", [req.params.userId, emailResult.rows[0].user_id])
            console.log(checkExistingRequestResult)
            if (checkExistingRequestResult.rowCount > 0) {
                res.statusCode = 403;
                res.json({ error: "Friend request already exists" })
            } else if (checkIfFriendResult.rowCount > 0) {
                res.statusCode = 403;
                res.json({ error: "Already friends" })
            } else {
                const result: pg.QueryResult = await db.query("INSERT INTO social_media.friend_requests(requester, requestee) VALUES ($1, $2) RETURNING friend_request_id", [req.params.userId, emailResult.rows[0].user_id]);
                console.log(result.rows[0])
                res.json({ username: emailResult.rows[0].username, friend_request_id: result.rows[0].friend_request_id, friend_id: emailResult.rows[0].user_id })
            }
        }
    } else {
        res.statusCode = 400;
        res.send(error.message);
    }
});


app.post('/api/users/:userId/deny_request', authorization, validateUserIdParam, async (req: Request, res: Response) => {
    const schema: Joi.AnySchema = Joi.object().keys({
        request_id: Joi.string().required(),
        userId: Joi.string().required()
    });
    const error = schema.validate(req.body).error;
    if (!error) {
        const requestResult: pg.QueryResult = await db.query("SELECT friend_request_id, requester, requestee FROM social_media.friend_requests WHERE friend_request_id = $1", [req.body.request_id])

        if (requestResult.rowCount == 0) {
            res.sendStatus(404);
        } else if (requestResult.rows[0].requester != req.body.userId && requestResult.rows[0].requestee != req.body.userId) {
            res.sendStatus(401);
        } else {
            const result: pg.QueryResult = await db.query("DELETE FROM social_media.friend_requests WHERE friend_request_id = $1;", [req.body.request_id]);
            console.log(result)
            res.sendStatus(201);
        }

    } else {
        res.statusCode = 400;
        res.send(error.message);
    }
});

app.get('/api/users/:userId/friend_request', authorization, validateUserIdParam, async (req: Request, res: Response) => {
    const schema: Joi.AnySchema = Joi.object().keys({
        userId: Joi.string().required()
    });
    const error = schema.validate(req.body).error;
    if (!error) {
        const result: pg.QueryResult = await db.query("SELECT user_requests.*, username from (SELECT CASE WHEN requestee = $1 THEN requester ELSE requestee END AS user_id, CASE WHEN requestee = $1 THEN 'false' ELSE 'true' END AS requested, friend_request_id FROM social_media.friend_requests WHERE $1 IN (requester, requestee)) as user_requests JOIN social_media.users on user_requests.user_id = social_media.users.user_id", [req.params.userId]);
        console.log(result)
        res.send(result.rows)
    } else {
        res.statusCode = 400;
        res.send(error.message);
    }
});


app.get('/api/chats/:chatId/info', authorization, validateChatIdParam, async (req: Request, res: Response) => {
    if (await checkUserInChat(req.body.userId, req.params.chatId)) {
        const result: pg.QueryResult = await db.query("SELECT social_media.users.* FROM (SELECT * FROM social_media.chat_members WHERE chat = $1 AND social_media.chat_members.user != $2) as other_users, social_media.users WHERE user_id = other_users.user", [req.params.chatId, req.body.userId]);
        if (result.rowCount > 0) {
            res.send({ name: result.rows[0].username, imageUrl: `/api/users/${result.rows[0].user_id}/profilePicture`, chatId: req.params.chatId })
        } else {
            res.sendStatus(404)
        }
    } else {
        res.sendStatus(401);
    }
});

app.post('/api/users/:userId/accept_request', authorization, validateUserIdParam, async (req: Request, res: Response) => {
    const schema: Joi.AnySchema = Joi.object().keys({
        request_id: Joi.string().required(),
        userId: Joi.string().required()
    });
    const error = schema.validate(req.body).error;
    if (!error) {
        const requestResult: pg.QueryResult = await db.query("SELECT friend_request_id, requester, requestee FROM social_media.friend_requests WHERE friend_request_id = $1", [req.body.request_id])
        if (requestResult.rowCount == 0) {
            res.sendStatus(404);
        } else if (requestResult.rows[0].requestee != req.body.userId) {
            res.sendStatus(401);
        } else {
            const deleteResult: pg.QueryResult = await db.query("DELETE FROM social_media.friend_requests WHERE friend_request_id = $1", [req.body.request_id]);
            const insertResult: pg.QueryResult = await db.query("INSERT INTO social_media.friends(friend_one, friend_two) VALUES ($1, $2);", [requestResult.rows[0].requester, requestResult.rows[0].requestee]);
            res.sendStatus(201);
        }

    } else {
        res.statusCode = 400;
        res.send(error.message);
    }
});

app.put('/api/users/:userId/username', authorization, validateUserIdParam, async (req: Request, res: Response) => {
    const schema: Joi.AnySchema = Joi.object().keys({
        new_username: Joi.string().required(),
        userId: Joi.string().required()
    });
    const validation_result: Joi.ValidationResult = schema.validate(req.body);
    if (!validation_result.error) {
        if (req.params.userId !== req.body.userId) {
            res.sendStatus(403);
        } else {
            const result: pg.QueryResult = await db.query("UPDATE social_media.users SET username=$1 WHERE user_id = $2", [req.body.new_username, req.params.userId]);
            if (result.rowCount == 0) {
                res.sendStatus(404);
            } else {
                res.json({ new_username: req.body.new_username });
            }
        }
    } else {
        res.statusCode = 400;
        res.send(validation_result.error);
    }
})


app.put('/api/users/:userId/profilePicture', authorization, validateUserIdParam, upload.single("profilePicture"), async (req: Request, res: Response) => {
    req.setTimeout(0);
    if (!req.file) {
        return res.sendStatus(400);
    } else {
        const file = req.file;
        const new_filename = Date.now() + '-' + file.originalname;
        console.log("Running2")
        console.log(process.env.AWS_S3_BUCKET_NAME)
        const uploadResult = await s3.putObject({
            Bucket: process.env.AWS_S3_BUCKET_NAME as string,
            Key: new_filename,
            Body: file.buffer,
            ContentType: file.mimetype
        })
        console.log("Blah")
        console.log("Upload Result", uploadResult)
        const result: pg.QueryResult = await db.query("SELECT * FROM social_media.users where user_id = $1", [req.params.userId])
        if (result.rows[0].profile_picture) {
            s3.deleteObject({ Bucket: process.env.AWS_S3_BUCKET_NAME as string, Key: result.rows[0].profile_picture })
        }
        await db.query("UPDATE social_media.users SET profile_picture=$1 WHERE user_id = $2", [new_filename, req.params.userId])
        return res.sendStatus(201);
    }
});

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


const loginUser = async (res: Response, email: string, password: string, origin: string) => {
    const result: pg.QueryResult = await db.query(`SELECT * FROM social_media.users WHERE email = $1`, [email]);
    if (result.rows.length == 0) {
        console.log("No user found");
        res.sendStatus(404);
    } else {
        const user = result.rows[0];
        const hashedPassword = await bcrpyt.hash(password, user.salt);
        console.log("hashedPassword: ", hashedPassword)
        console.log("user.password: ", user.password)
        if (user.active !== true) {
            console.log("Account not verified")
            res.sendStatus(401);
        } else if (user.password == hashedPassword) {
            console.log("Login Successful")
            const signedJWT = jsonwebtoken.sign({ userId: user.user_id, username: user.username }, process.env["jwt_secret"] as string, { expiresIn: '5h', issuer: process.env["base_url"], audience: origin });
            res.cookie("x-auth-token", signedJWT, {
                // can only be accessed by server requests
                httpOnly: false,
                // path = where the cookie is valid
                path: "/",
                // domain = what domain the cookie is valid on
                domain: process.env["base_url"],
                // secure = only send cookie over https
                secure: process.env.ENVIRONMENT === "dev" ? false : true,
                // sameSite = only send cookie if the request is coming from the same origin
                sameSite: process.env.ENVIRONMENT === "dev" ? "lax" : "none", // "strict" | "lax" | "none" (secure must be true)
                // maxAge = how long the cookie is valid for in milliseconds
                maxAge: 3600000
            }).json({ userId: user.user_id, username: user.username })
        } else {
            console.log("Password Invalid")
            res.sendStatus(400);
        }
    }
}
const addNewUser = async (email: string, username: string, hashedPassword: string, salt: string): Promise<pg.QueryResult> => {
    return db.query(`INSERT INTO social_media.users (email, username, password, salt) VALUES ($1, $2, $3, $4) RETURNING user_id`, [email, username, hashedPassword, salt])
}

const checkEmailExists = async (email: string): Promise<boolean> => {

    const result: pg.QueryResult = await db.query(`SELECT COUNT(*) as email_count FROM social_media.users WHERE email = $1`, [email]);
    return result.rows[0].email_count > 0
}
const registerUser = async (response: Response, email: string, password: string, username: string) => {

    if (!await checkEmailExists(email)) {
        const salt = await bcrpyt.genSalt(10);
        const hashedPassword = await bcrpyt.hash(password, salt);
        const addUserResult = await addNewUser(email, username, hashedPassword, salt);
        const emailToken = await jsonwebtoken.sign({ userId: addUserResult.rows[0].user_id }, process.env["jwt_secret"] as string);
        const verificationMessage = `${process.env.FRONTEND_URL as string}/?token=${emailToken}`
        sendVerificationEmail(email, verificationMessage, username);
        console.log("User added");
        response.sendStatus(201);
    } else {
        console.log("Email already exists");
        response.sendStatus(400);
    }
}


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
    const result: pg.QueryResult = await db.query(`SELECT message_id, content, owner, chat, "timestamp", username
	FROM social_media.messages JOIN social_media.users ON owner=user_id WHERE chat = $1`, [chatId]);
    return result.rows;
}