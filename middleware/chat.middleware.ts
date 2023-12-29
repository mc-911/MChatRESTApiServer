import { Request, Response } from "express"
import validator from 'validator'
import { getMemberInfo } from "../models/chat.model"
import * as ChatModel from "../models/chat.model"
const validateChatIdParam = async (req: Request, res: Response, next: Function) => {
    const validUUID = validator.isUUID(req.params.chatId, 4)
    if (validUUID) {
        if (!(await ChatModel.getChat(req.params.chatId))) {
            res.sendStatus(404)
        } else {
            next()
        }
    } else {
        res.sendStatus(400)
    }
}

const validateChatAccess = async (req: Request, res: Response, next: Function) => {
    const memberInfo = await getMemberInfo(req.body.userId, req.params.chatId)
    if (memberInfo) {
        req.body.role = memberInfo.role;
        next()
    } else {
        res.sendStatus(403)
    }
}

export { validateChatAccess, validateChatIdParam }