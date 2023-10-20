const express = require('express')
const cors = require('cors');
const app = express()
const port = 3000
app.use(cors());
app.get('/', (req, res) => {
 res.send('Hello World!')
})
app.listen(port, () => {
 console.log(`Server running at http://localhost:${port}`)
})

app.post('/api/login', (req, res) => {
    const email = req.query.email;
    const password = req.query.password;
    res.send("Login Time!")
})

app.post('/api/register', (req, res) => {
    res.send("Register Time!")
    req.va
})
