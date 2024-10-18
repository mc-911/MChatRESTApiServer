import { Request, Response } from "express";
import * as Joi from 'joi'
import * as UserModel from "../models/user.model";
import { hash } from 'bcrypt'
import { sign, verify } from "jsonwebtoken";
import { genSalt } from "bcrypt";
import Mailgun from 'mailgun.js'
import FormData from 'form-data';
import User from "../types/user";
import { S3, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import FriendRequest from "../types/friendRequest";
//General User Controllers
const loginUser = async (req: Request, res: Response) => {
    console.log('req.body: ', req.body);
    const schema: Joi.AnySchema = Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().min(1)
    });
    const validation_result: Joi.ValidationResult = schema.validate(req.body);
    if (!validation_result.error) {
        const email = req.body.email;
        const password = req.body.password;
        console.log({ email, password })
        const user = await UserModel.getUserByEmail(email)
        if (!user) {
            res.sendStatus(404);
        } else {
            if (user.active !== true) {
                res.sendStatus(401)
            } else if (user.password !== await hash(password, user.salt)) {
                res.send(400);
            } else {
                console.log("Login Successful")
                const signedJWT = sign({ userId: user.user_id, username: user.username }, process.env["jwt_secret"] as string, { expiresIn: '5h', issuer: process.env["base_url"], audience: req.headers.origin });
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
            }
        }
    } else {
        console.log("Invalid request body")
        res.sendStatus(400);
    }
}
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

const registerUser = async (req: Request, res: Response) => {
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
        if (!await UserModel.checkEmailExists(email)) {
            const salt = await genSalt(10);
            const hashedPassword = await hash(password, salt);
            const addUserResult = await UserModel.addNewUser(email, username, hashedPassword, salt);
            const emailToken = await sign({ userId: addUserResult.rows[0].user_id }, process.env["jwt_secret"] as string);
            const verificationMessage = `${process.env.FRONTEND_URL as string}/?token=${emailToken}`
            sendVerificationEmail(email, verificationMessage, username);
            console.log("User added");
            res.sendStatus(201);
        } else {
            console.log("Email already exists");
            res.sendStatus(400);
        }
    } else {
        console.log("Invalid request body")
        console.log(error.message)
        res.sendStatus(400);
    }

}

const getUserIdFromJwt = async (token: string): Promise<String | null> => {
    try {
        const decoded = verify(token, process.env["jwt_secret"] as string);
        if (typeof decoded === 'string') {
            throw new Error('Invalid token');
        }
        return decoded.userId;
    } catch {
        return null;
    }
}

const verifyUser = async (req: Request, res: Response) => {
    const schema: Joi.AnySchema = Joi.object().keys({
        token: Joi.string().required()
    });
    const validation_result: Joi.ValidationResult = schema.validate(req.body);
    console.log("Verifying Token")

    if (validation_result.error) {
        res.sendStatus(400)
    } else {
        const userId = await getUserIdFromJwt(req.body.token);
        if (!userId) {
            res.sendStatus(400);
        } else {
            await UserModel.activateUser(userId.valueOf())
            res.sendStatus(200)
        }
    }
}
const s3 = new S3({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string
    },
    region: process.env.AWS_S3_REGION
});

const getPictureUrl = async (profilePicturePath: string) => {
    console.log("Getting image from s3")
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME as string,
        Key: profilePicturePath,
    })
    return await getSignedUrl(s3, command, { expiresIn: 3600 });
}

const getProfilePicture = async (req: Request, res: Response) => {
    const user: User | null = await UserModel.getUserById(req.params.userId)
    if (!user) {
        res.sendStatus(404)
    } else {
        if (!user.profile_picture) {
            res.sendStatus(404)
        } else {
            const url = await getPictureUrl(user.profile_picture);
            res.redirect(url);
        }
    }

}

const updateProfilePicture = async (req: Request, res: Response) => {
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
        const user = await UserModel.getUserById(req.params.userId);
        if (user?.profile_picture) {
            s3.deleteObject({ Bucket: process.env.AWS_S3_BUCKET_NAME as string, Key: user.profile_picture })
        }
        await UserModel.updateProfilePicture(req.params.userId, new_filename)
        return res.sendStatus(201);
    }
}
const updateUsername = async (req: Request, res: Response) => {
    const schema: Joi.AnySchema = Joi.object().keys({
        new_username: Joi.string().required(),
        userId: Joi.string().required()
    });
    const validation_result: Joi.ValidationResult = schema.validate(req.body);
    if (!validation_result.error) {
        if (req.params.userId !== req.body.userId) {
            res.sendStatus(403);
        } else {
            const success: Boolean = await UserModel.updateUsername(req.body.userId, req.body.new_username)
            if (!success) {
                res.sendStatus(404);
            } else {
                res.json({ new_username: req.body.new_username });
            }
        }
    } else {
        res.statusCode = 400;
        res.send(validation_result.error);
    }
}

// Friend related Controllers

const getFriends = async (req: Request, res: Response) => {
    if (req.params.userId !== req.body.userId) {
        res.sendStatus(403);
    } else {
        const friends = await UserModel.getFriends(req.params.userId)
        return res.json({ friends });
    }
}

const removeFriend = async (req: Request, res: Response) => {
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
        UserModel.removeFriend(req.params.userId, req.params.friendId)
        return res.sendStatus(200);
    }
}

const sendFriendRequest = async (req: Request, res: Response) => {
    const schema: Joi.AnySchema = Joi.object().keys({
        friend_email: Joi.string().optional(),
        requesteeId: Joi.string().optional(),
        userId: Joi.string().required()
    });
    const error = schema.validate(req.body).error;
    if (!error && req.body.requesteeId || req.body.friend_email) {
        const friend = await (req.body.requesteeId ? UserModel.getUserById(req.body.requesteeId) : UserModel.getUserByEmail(req.body.friend_email));
        if (!friend) {
            res.sendStatus(404);
        } else if (req.params.userId === friend.user_id) {
            res.statusCode = 403;
            res.json({ error: "Can't send friend request to self" })
        } else {
            if (await UserModel.checkForExistingRequest(req.params.userId, friend.user_id)) {
                res.statusCode = 403;
                res.json({ error: "Friend request already exists" })
            } else if (await UserModel.checkIfFriends(req.params.userId, friend.user_id)) {
                res.statusCode = 403;
                res.json({ error: "Already friends" })
            } else {
                const friendRequestId = await UserModel.addFriendRequest(req.params.userId, friend.user_id);
                res.json({ username: friend.username, friend_request_id: friendRequestId, user_id: friend.user_id })
            }
        }
    } else {
        res.sendStatus(400);
    }
}
const denyFriendRequest = async (req: Request, res: Response) => {
    const schema: Joi.AnySchema = Joi.object().keys({
        request_id: Joi.string().required(),
        userId: Joi.string().required()
    });
    const error = schema.validate(req.body).error;
    if (!error) {
        const request = await UserModel.getFriendRequest(req.body.request_id)
        if (!request) {
            res.sendStatus(404);
        } else if (request.requester != req.body.userId && request.requestee != req.body.userId) {
            res.sendStatus(401);
        } else {
            UserModel.removeFriendRequest(request.friend_request_id)
            res.sendStatus(201);
        }
    } else {
        res.statusCode = 400;
        res.send(error.message);
    }
}

const getFriendRequests = async (req: Request, res: Response) => {
    const schema: Joi.AnySchema = Joi.object().keys({
        userId: Joi.string().required()
    });
    const error = schema.validate(req.body).error;
    if (!error) {
        res.send(await UserModel.getFriendRequests(req.body.userId))
    } else {
        res.statusCode = 400;
        res.send(error.message);
    }
}

const acceptFriendRequest = async (req: Request, res: Response) => {
    const schema: Joi.AnySchema = Joi.object().keys({
        request_id: Joi.string().required(),
        userId: Joi.string().required()
    });
    const error = schema.validate(req.body).error;
    if (!error) {
        const request: FriendRequest | null = await UserModel.getFriendRequest(req.body.request_id)
        if (!request) {
            res.sendStatus(404);
        } else if (request.requestee != req.body.userId) {
            res.sendStatus(401);
        } else {
            await UserModel.removeFriendRequest(req.body.request_id)
            await UserModel.addFriend(request.requester, request.requestee)
            res.sendStatus(201);
        }

    } else {
        res.statusCode = 400;
        res.send(error.message);
    }
}

const getGroupChats = async (req: Request, res: Response) => {
    const chats = await UserModel.getChats(req.params.userId, "GROUP");
    res.send({ chats });
}

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
export { loginUser, registerUser, verifyUser, getProfilePicture, updateProfilePicture, updateUsername, getFriends, removeFriend, sendFriendRequest, denyFriendRequest, getFriendRequests, acceptFriendRequest, getGroupChats }
