import { Request, Response } from "express";
import * as Joi from 'joi'
import * as ChatModel from "../models/chat.model";
import ChatMemberType from "../enums/ChatMemberType";
import ChatType from "../enums/ChatType"

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
    const chat = await ChatModel.getChat(req.body.chatId)
    if (!chat) {
        return null;
    } else {
        switch (chat.chat_type) {
            case (ChatType.DIRECT_MESSAGE):
                const result = await ChatModel.getDMChatInfo(req.params.chatId, req.body.userId);
                if (!result) {
                    console.log("Error getting chat info")
                    res.sendStatus(500);
                } else {
                    res.send({ name: result[0].username, imageUrl: `/api/user/${result[0].user_id}/profilePicture`, chatId: req.params.chatId })
                }
                break;
            case (ChatType.GROUP):
                res.send({ name: chat.name, imageUrl: `/api/chat/${req.params.chatId}/picture`, chatId: req.params.chatId })
            default:
                console.log("Unsupported chat type: ", chat.chat_type);
                res.sendStatus(500);
        }
    }
}
const checkUserInChat = async (req: Request, res: Response) => {
    console.log("Checking access")
    res.sendStatus(200);
}
const createGroupChat = async (req: Request, res: Response) => {
    const schema: Joi.AnySchema = Joi.object().keys({
        userId: Joi.string().required(),
        name: Joi.string().min(1).required(),
    })
    const validation_result: Joi.ValidationResult = schema.validate(req.body);
    if (validation_result.error) {
        res.sendStatus(400)
    } else {
        const chatId = await ChatModel.addChat(req.body.name, ChatType.GROUP);
        await ChatModel.addMember(req.body.userId, chatId.toString(), ChatMemberType.OWNER);
        res.statusCode = 201;
        res.send({ chatId, name: req.body.name })
    }
}
const deleteGroupChat = async (req: Request, res: Response) => {
    const schema: Joi.AnySchema = Joi.object().keys({
        userId: Joi.string().required(),
    })
    const validation_result: Joi.ValidationResult = schema.validate(req.body);
    if (validation_result.error) {
        res.sendStatus(400)
    } else {
        const chatOwner = await ChatModel.getChatOwner(req.params.chatId);
        if (!chatOwner) {
            console.log("Chat has no owner!!")
            res.sendStatus(500)
        } else {
            if (chatOwner.user === req.body.userId) {
                await ChatModel.removeChat(req.params.chatId)
                res.sendStatus(200);
            } else {
                res.sendStatus(401);
            }
        }
    }
}
export { getMessages, storeMessage, getChatInfo, checkUserInChat, createGroupChat, deleteGroupChat }