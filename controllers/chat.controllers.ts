import { Request, Response } from "express";
import * as Joi from 'joi'
import * as ChatModel from "../models/chat.model";
import * as UserModel from "../models/user.model";
import ChatMemberType from "../enums/ChatMemberType";
import ChatType from "../enums/ChatType"

import validator from 'validator'
const getMessages = async (req: Request, res: Response) => {
    const schema: Joi.AnySchema = Joi.object().keys({
        userId: Joi.string().required(),
        role: Joi.any()
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
        content: Joi.string().required().max(2000),
        role: Joi.any()
    })
    const validation_result: Joi.ValidationResult = schema.validate(req.body);
    if (validation_result.error) {
        console.log(validation_result.error.message)
        res.sendStatus(400);
    } else {
        await ChatModel.storeChatMessage(req.body.userId, req.params.chatId, req.body.timestamp, req.body.content)
        res.sendStatus(201);
    }
}
const getChatInfo = async (req: Request, res: Response) => {
    console.log("Getting chat info")
    const chat = await ChatModel.getChat(req.params.chatId)
    console.log(chat)
    if (!chat) {
        res.sendStatus(404);
    } else {
        switch (chat.chat_type) {
            case (ChatType.DIRECT_MESSAGE):
                const result = await ChatModel.getDMChatInfo(req.params.chatId, req.body.userId);
                if (!result) {
                    console.log("Error getting chat info")
                    res.sendStatus(500);
                } else {
                    res.send({ name: result[0].username, imageUrl: `/api/user/${result[0].user_id}/profilePicture`, chatId: req.params.chatId, role: req.body.role, type: chat.chat_type })
                }
                break;
            case (ChatType.GROUP):
                var responseBody = { name: chat.name, imageUrl: `/api/chat/${req.params.chatId}/picture`, chatId: req.params.chatId, role: req.body.role, type: chat.chat_type, members: await ChatModel.getMembers(chat.chat_id), inviteCode: '' };
                if (req.body.role === ChatMemberType.OWNER) {
                    responseBody.inviteCode = chat.invite_code;
                }
                res.send(responseBody)
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
const joinChat = async (req: Request, res: Response) => {
    const bodySchema: Joi.AnySchema = Joi.object().keys({
        userId: Joi.string().required(),
        role: Joi.string(),
        inviteCode: Joi.string().required()
    })
    const body_validation_result: Joi.ValidationResult = bodySchema.validate(req.body);
    if (body_validation_result.error) {
        res.sendStatus(400)
    } else if (!validator.isUUID(req.body.inviteCode, 4)) {
        res.statusCode = 400;
        res.send({ error: "Invalid Code" })
    } else {
        const chat = await ChatModel.getChatByInviteCode(req.body.inviteCode)
        if (!chat) {
            res.statusCode = 404;
            res.send({ error: "No Chat found with that invite code" })
        } else if (await ChatModel.getMemberInfo(req.body.userId, chat.chat_id)) {
            res.statusCode = 400;
            res.send({ error: "Already in chat" })
        } else {
            console.log(req.body.userId)
            await ChatModel.addMember(req.body.userId, chat.chat_id, ChatMemberType.MEMBER);
            res.send({ id: chat.chat_id, name: chat.name })
        }
    }
}
const addMember = async (req: Request, res: Response) => {
    const bodySchema: Joi.AnySchema = Joi.object().keys({
        userId: Joi.string().required(),
        memberId: Joi.string().required(),
        role: Joi.string().required(),
    })

    const paramsSchema: Joi.AnySchema = Joi.object().keys({
        chatId: Joi.string().required(),
    })

    const body_validation_result: Joi.ValidationResult = bodySchema.validate(req.body);
    const params_validation_result: Joi.ValidationResult = paramsSchema.validate(req.params);
    if (body_validation_result.error || params_validation_result.error) {
        console.log(body_validation_result.error?.message)
        console.log(params_validation_result.error?.message)
        res.sendStatus(400)
    } else if (req.body.role !== ChatMemberType.OWNER) {
        res.statusCode = 401;
        res.send({ error: "Must be owner to add members" })
    } else if (!(await UserModel.getUserById(req.body.memberId))) {
        res.statusCode = 404;
        res.send({ error: "User not found" })
    } else if (await ChatModel.getMemberInfo(req.body.memberId, req.body.chatId)) {
        res.statusCode = 400;
        res.send({ error: "User already in chat" })
    } else {
        await ChatModel.addMember(req.body.memberId, req.params.chatId, ChatMemberType.MEMBER)
        res.sendStatus(201)
    }

}
const removeMember = async (req: Request, res: Response) => {
    const bodySchema: Joi.AnySchema = Joi.object().keys({
        userId: Joi.string().required(),
        role: Joi.string().required(),
    })
    const paramsSchema: Joi.AnySchema = Joi.object().keys({
        chatId: Joi.string().required(),
        memberUserId: Joi.string().required(),
    })
    const body_validation_result: Joi.ValidationResult = bodySchema.validate(req.body);
    const params_validation_result: Joi.ValidationResult = paramsSchema.validate(req.params);
    if (body_validation_result.error || params_validation_result.error) {
        console.log(body_validation_result.error?.message)
        console.log(params_validation_result.error?.message)
        res.sendStatus(400)
    } else {
        const memberInfo = await ChatModel.getMemberInfo(req.params.memberUserId, req.params.chatId);
        console.log({ memberInfo })
        if (!memberInfo) {
            res.statusCode = 400;
            res.send({ error: "User not in chat" })
        } else if (memberInfo.role === ChatMemberType.OWNER) {
            res.statusCode = 400;
            res.send({ error: "Owners cannot be removed from their chats, either transfer ownership or delete the chat to leave the chat" })
        }
        else if (req.body.role !== ChatMemberType.OWNER && req.body.userId !== req.params.memberUserId) {
            console.log({ role: req.body.role })
            res.statusCode = 401;
            res.send({ error: "You may only remove a member if you are a owner, or you are removing yourself" })
        } else {
            console.log({ chatId: req.params.chatId, userId: req.params.memberUserId })
            await ChatModel.removeMember(req.params.chatId, req.params.memberUserId)
            res.sendStatus(200)
        }
    }
}
export { getMessages, storeMessage, getChatInfo, checkUserInChat, createGroupChat, deleteGroupChat, removeMember, addMember, joinChat }