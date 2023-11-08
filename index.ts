import express, { Express, Request, Response } from 'express';
import * as pg from 'pg'
import bodyParser from 'body-parser'; // Import the body-parser module
import * as bcrpyt from 'bcrypt';
import * as Joi from 'joi';
import * as jsonwebtoken from 'jsonwebtoken';
import * as nodemailer from 'nodemailer';
const cors = require('cors');
const app = express()
const port = 3000
const db = require('./db');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


const sendEmail = async (email : string, subject : string, text : string) => {
  try {
    const transporter = nodemailer.createTransport({
    service: process.env["email_service"],
      auth: {
        user: process.env["email_address"],
        pass: process.env["email_password"],
      },
    });

    await transporter.sendMail({
      from: process.env.USER,
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
    const schema : Joi.AnySchema = Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#\$&*~]).{8,}$/).required()
    });
    const validation_result : Joi.ValidationResult = schema.validate(req.body);
    const error : Joi.ValidationError | undefined = validation_result.error; 
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
    const schema : Joi.AnySchema = Joi.object().keys({
        email: Joi.string().email().required(),
        password: Joi.string().regex(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#\$&*~]).{8,}$/).required()
    });
    
    const email = req.body.email;
    const password = req.body.password;
    const validation_result : Joi.ValidationResult = schema.validate(req.body);
    const error : Joi.ValidationError | undefined = validation_result.error; 
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
    const token = req.headers.authorization;
    if (!token) {
        res.sendStatus(401);
    } 
    try {
        const decoded = jsonwebtoken.verify(token!, process.env["jwt_secret"] as string);
        if (typeof decoded === 'string') {
            throw new Error('Invalid token');
        }
        req.body.userId = decoded.userId;
        next();
    } catch (err) {
        res.sendStatus(401);
    } 
}

app.get('/api/users', authorization, async (req: Request, res: Response) => {
    console.log("req.body.userId: ", req.body.userId)
});

app.get('/verify/:token', async (req: Request, res: Response) => {
    const token = req.params.token;
    try {
    
        res.sendStatus(200);
    } catch (err) {
        res.sendStatus(401);
    } 
});

const verifyEmail = async (token: string) => {
    try {
        const decoded = jsonwebtoken.verify(token, process.env["jwt_secret"] as string);
        if (typeof decoded === 'string') {
            throw new Error('Invalid token');
        }
        const email = decoded.userId;
        const result: pg.QueryResult = await db.query(`UPDATE social_media.users SET email_verified = true WHERE email = '${email}'`);
        console.log("result: ", result);
    } catch (err) {
        console.log("err: ", err);
    }

}

const loginUser = async (res: Response, email: string, password: string) => {
    const result: pg.QueryResult = await db.query(`SELECT * FROM social_media.users WHERE email = '${email}'`);
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
            res.json({token : jsonwebtoken.sign({userId : email}, process.env["jwt_secret"] as string)});
        } else {
            console.log("Password Invalid")
            res.sendStatus(400);
        }
    }
}
const addNewUser = async (email: string, hashedPassword: string, salt: string): Promise<pg.QueryResult> => {
    return db.query(`INSERT INTO social_media.users (email, password, salt) VALUES ('${email}', '${hashedPassword}', '${salt}') RETURNING user_id`)
}

const addEmailVerificationToken = async (userId : string, token : string) : Promise<pg.QueryResult> => {
    return db.query(`INSERT INTO social_media.email_tokens VALUES ('${userId}', '${token}')`)
}
const checkEmailExists = async (email : string) : Promise<boolean> => {

    const result: pg.QueryResult = await db.query(`SELECT COUNT(*) as email_count FROM social_media.users WHERE email = '${email}'`);
    return result.rows[0].email_count > 0
}
const registerUser = async (response : Response, email: string, password: string) => {

    if (!await checkEmailExists(email)) {
        const salt = await bcrpyt.genSalt(10);
        const hashedPassword = await bcrpyt.hash(password, salt);
        const addUserResult = await addNewUser(email, hashedPassword, salt);
        const emailToken = await bcrpyt.genSalt();
        const verificationMessage = `${process.env.BASE_URL}/api/verify/${emailToken}`
        await addEmailVerificationToken(addUserResult.rows[0].user_id, emailToken)
        sendEmail(email, "Verify your Email", verificationMessage)
        console.log("User added");
        response.sendStatus(201);
    } else {
        console.log("Email already exists");
        response.sendStatus(400);
    }
}
