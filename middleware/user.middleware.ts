import validator from 'validator'
import { Request, Response } from "express"
import multer from 'multer'
import path from 'path'

const validateUserIdParam = (req: Request, res: Response, next: Function) => {
    const validUUID = validator.isUUID(req.params.userId, 4)
    if (validUUID) {
        next()
    } else {
        res.sendStatus(400)
    }
}
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage, limits: {}, fileFilter: function (req, file, cb) {
        const acceptableFileTypes = /\.(jpg|jpeg|png|gif)$/;
        if (!path.extname(file.originalname).match(acceptableFileTypes)) {
            return cb(null, false);
        }
        cb(null, true)

    }
})
export { validateUserIdParam, upload }