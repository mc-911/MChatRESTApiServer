"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors = require('cors');
const app = (0, express_1.default)();
const port = 3000;
// const db = require('./db');
app.use(cors());
app.get('/', (req, res) => {
    res.send('Hello World!');
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
app.post('/api/login', (req, res) => {
    const { email, password } = req.body; // Use req.body to access JSON data from the request body
    if (email && password) {
        userLogin(email, password);
    }
    res.send("Login Time!");
});
app.post('/api/register', (req, res) => {
    res.send("Register Time!");
});
const userLogin = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    // const result = await db.query('SELECT * FROM users');
});
