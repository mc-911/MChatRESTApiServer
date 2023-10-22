import express, { Express, Request, Response } from 'express';
import * as pg from 'pg'
import bodyParser from 'body-parser'; // Import the body-parser module

const cors = require('cors');
const app = express()
const port = 3000
const db = require('./db');

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.get('/', (req : Request, res : Response) => {
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
    userLogin(email, password)
    } 
    res.send("Login Time!")

})

app.post('/api/register', (req, res) => {
    res.send("Register Time!")
})

const userLogin = async (email : string, password : string) => {
    const result :  Promise<pg.QueryResult> = await db.query('SELECT * FROM social_media.users');
    console.log(result)
}