import { Express } from "express";
import * as chat from "../controllers/chat.controllers"
import * as chatAuth from "../middleware/chat.middleware"
import { authentication } from "../middleware/auth.middleware"

module.exports = (app: Express) => {
    app.route("/api/chat/:chatId/getMessages").get(authentication, chatAuth.validateChatIdParam, chatAuth.validateChatAccess, chat.getMessages)
    app.route("/api/chat/:chatId/storeMessage").post(authentication, chatAuth.validateChatIdParam, chatAuth.validateChatAccess, chat.storeMessage)
    app.route("/api/chat/:chatId/info").get(authentication, chatAuth.validateChatIdParam, chatAuth.validateChatAccess, chat.getChatInfo)
    app.route("/api/chat/:chatId/checkChatAccess").get(authentication, chatAuth.validateChatIdParam, chatAuth.validateChatAccess, chat.checkUserInChat)
    app.route("/api/chat").post(authentication, chat.createGroupChat)
    app.route("/api/chat/:chatId").delete(authentication, chat.deleteGroupChat)
}