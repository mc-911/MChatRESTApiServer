import express, { Express, Request, Response } from 'express';
import * as pg from 'pg'
import bodyParser from 'body-parser'; // Import the body-parser module
import * as bcrpyt from 'bcrypt';
const cors = require('cors');
const app = express()
const port = 3000
const db = require('./db');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!')
})
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})

app.post('/api/login', (req, res) => {
    console.log('req.body: ', req.body);
    const email = req.body.email;
    const password = req.body.password;
    console.log(process.env["db_password"])
    if (email && password) {
        loginUser(email, password)
    }
    res.send("Login Time!")

})

app.post('/api/register', (req, res) => {
    //TODO perform validation on request body
    const email = req.body.email;
    const password = req.body.password;
    console.log(process.env["db_password"])
    if (email && password) {
        registerUser(res, email, password)
    }
})

const loginUser = async (email: string, password: string) => {
    const result: pg.QueryResult = await db.query('SELECT * FROM social_media.users');
    console.log(result)
}
const addNewUser = async (email: string, hashedPassword: string, salt: string): Promise<pg.QueryResult> => {
    return db.query(`INSERT INTO social_media.users (email, password, salt) VALUES ('${email}', '${hashedPassword}', '${salt}');`)
}

const registerUser = async (response : Response, email: string, password: string) => {


    const result: pg.QueryResult = await db.query(`SELECT COUNT(*) as email_count FROM social_media.users WHERE email = '${email}'`);
    console.log(result.rows[0].email_count)
    if (result.rows[0].email_count == 0) {
        const salt = await bcrpyt.genSalt(10);
        const hashedPassword = await bcrpyt.hash(password, salt);
        await addNewUser(email, hashedPassword, salt);
        response.sendStatus(201);
    } else {
        response.sendStatus(400);
    }
}
