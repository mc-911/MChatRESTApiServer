import { Request, Response } from "express";
import * as Joi from 'joi'
import * as ChatModel from "../models/chat.model";

const getMessages = async (req: Request, res: Response) => {
    const schema: Joi.AnySchema = Joi.object().keys({
        userId: Joi.string().required(),
    })
    const validation_result: Joi.ValidationResult = schema.validate(req.body);
    if (validation_result.error) {
        res.sendStatus(400);
    } else {
        const messages = await ChatModel.getChatMessages(req.params.chatId);
        res.send({ messages }).status(200)
    }
}
const storeMessage = async (req: Request, res: Response) => {
    const schema: Joi.AnySchema = Joi.object().keys({
        userId: Joi.string().required(),
        timestamp: Joi.number().required(),
        content: Joi.string().required().max(2000)
    })
    const validation_result: Joi.ValidationResult = schema.validate(req.body);
    if (validation_result.error) {
        res.sendStatus(400);
    } else {
        await ChatModel.storeChatMessage(req.body.userId, req.params.chatId, req.body.timestamp, req.body.content)
        res.sendStatus(201);
    }
}
const getChatInfo = async (req: Request, res: Response) => {
    const result = await ChatModel.getChatInfo(req.params.chatId, req.body.userId);
    res.send({ name: result[0].username, imageUrl: `/api/user/${result[0].user_id}/profilePicture`, chatId: req.params.chatId })
}
const checkUserInChat = async (req: Request, res: Response) => {
    console.log("Checking access")
    res.sendStatus(200);
}
export { getMessages, storeMessage, getChatInfo, checkUserInChat }