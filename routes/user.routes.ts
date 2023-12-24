import { Express } from "express";
import * as UserControllers from "../controllers/user.controllers"
import * as UserMiddleware from "../middleware/user.middleware"
import { authentication } from "../middleware/auth.middleware";

module.exports = (app: Express) => {
    app.route("/api/user/login").post(UserControllers.loginUser)
    app.route("/api/user/register").post(UserControllers.registerUser)
    app.route("/api/user/verify").post(UserControllers.verifyUser)
    app.route("/api/user/:userId/profilePicture").get(authentication, UserMiddleware.validateUserIdParam, UserControllers.getProfilePicture).put(authentication, UserMiddleware.validateUserIdParam, UserMiddleware.upload.single("profilePicture"), UserControllers.updateProfilePicture)
    app.route("/api/user/:userId/friends").get(authentication, UserMiddleware.validateUserIdParam, UserControllers.getFriends)
    app.route("/api/user/:userId/friends/:friendId").delete(authentication, UserMiddleware.validateUserIdParam, UserControllers.removeFriend)
    app.route("/api/user/:userId/friend_request").post(authentication, UserMiddleware.validateUserIdParam, UserControllers.sendFriendRequest).get(authentication, UserMiddleware.validateUserIdParam, UserControllers.getFriendRequests)
    app.route("/api/user/:userId/deny_request").post(authentication, UserMiddleware.validateUserIdParam, UserControllers.denyFriendRequest)
    app.route("/api/user/:userId/accept_request").post(authentication, UserMiddleware.validateUserIdParam, UserControllers.acceptFriendRequest)
    app.route("/api/user/:userId/username").put(authentication, UserMiddleware.validateUserIdParam, UserControllers.updateUsername)
    app.route("/api/user/:userId/groupChats").get(authentication, UserMiddleware.validateUserIdParam, UserControllers.getGroupChats)
}