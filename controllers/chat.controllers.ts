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
    console.log("Getting chat info")
    const chat = await ChatModel.getChat(req.params.chatId)
    if (!chat) {
        res.sendStatus(404);
    } else {
        await ChatModel.getMemberInfo(req.body.userId, req.params.chatId)
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
                res.send({ name: chat.name, imageUrl: `/api/chat/${req.params.chatId}/picture`, chatId: req.params.chatId, role: req.body.role })
                break;
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
        memberIds: Joi.array<string>(),
    })
    const validation_result: Joi.ValidationResult = schema.validate(req.body);
    if (validation_result.error) {
        res.statusCode = 400;
        res.send({ error: validation_result.error.message })
    } else {
        const chatId = await ChatModel.addChat(req.body.name, ChatType.GROUP);
        console.log(req.body)
        await ChatModel.addMember(req.body.userId, chatId.toString(), ChatMemberType.OWNER);
        if (req.body.memberIds) {
            req.body.memberIds.forEach(async (memberId: string) => {
                await ChatModel.addMember(memberId, chatId.toString(), ChatMemberType.MEMBER)
            });
        }
        res.statusCode = 201;
        res.send({ chatId, name: req.body.name })
    }
}

const deleteGroupChat = async (req: Request, res: Response) => {
    const schema: Joi.AnySchema = Joi.object().keys({
        userId: Joi.string().required(),
        role: Joi.string().required(),
    })
    const validation_result: Joi.ValidationResult = schema.validate(req.body);
    if (validation_result.error) {
        res.sendStatus(400)
    } else {
        if (req.body.role !== ChatMemberType.OWNER) {
            res.sendStatus(401);
        } else {
            await ChatModel.removeChat(req.params.chatId)
            res.sendStatus(200);
        }
    }
}
export { getMessages, storeMessage, getChatInfo, checkUserInChat, createGroupChat, deleteGroupChat }