import { Request, Response } from "express"
import validator from 'validator'
import { checkUserInChat } from "../models/chat.model"
const validateChatIdParam = (req: Request, res: Response, next: Function) => {
    const validUUID = validator.isUUID(req.params.chatId, 4)
    if (validUUID) {
        next()
    } else {
        res.sendStatus(400)
    }
}

const validateChatAccess = async (req: Request, res: Response, next: Function) => {
    if (await checkUserInChat(req.body.userId, req.params.chatId)) {
        next()
    } else {
        res.sendStatus(403)
    }
}

export { validateChatAccess, validateChatIdParam }