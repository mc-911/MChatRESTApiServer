import { Request, Response } from "express";
import { verify } from "jsonwebtoken";
const authentication = (req: Request, res: Response, next: Function) => {
    const token = req.cookies["x-auth-token"];
    if (!token || typeof token !== "string") {
        console.log("x-auth-token not found")
        res.sendStatus(401);
    } else {
        try {
            const decoded = verify(token!, process.env["jwt_secret"] as string);
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

export { authentication }