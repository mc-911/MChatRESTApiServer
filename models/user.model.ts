import { QueryResult } from "pg";
import User from "../types/user"
import FriendRequest from "../types/friendRequest";
import db from "../db"
const getUserByEmail = async (email: string): Promise<User | null> => {
    const result: QueryResult = await db.query(`SELECT * FROM social_media.users WHERE email = $1`, [email]);
    if (result.rows.length == 0) {
        console.log("No user found");
        return null;
    } else {
        return result.rows[0];
    }
}
const checkEmailExists = async (email: string): Promise<boolean> => {

    const result: QueryResult = await db.query(`SELECT COUNT(*) as email_count FROM social_media.users WHERE email = $1`, [email]);
    return result.rows[0].email_count > 0
}
const addNewUser = async (email: string, username: string, hashedPassword: string, salt: string): Promise<QueryResult> => {
    return db.query(`INSERT INTO social_media.users (email, username, password, salt) VALUES ($1, $2, $3, $4) RETURNING user_id`, [email, username, hashedPassword, salt])
}
const getUserById = async (userId: string): Promise<User | null> => {
    const result: QueryResult = await db.query("SELECT * from social_media.users where user_id = $1", [userId])
    if (result.rows.length == 0) {
        console.log("No user found");
        return null;
    } else {
        return result.rows[0];
    }
}
const updateUsername = async (userId: string, newUsername: string): Promise<Boolean> => {
    const result: QueryResult = await db.query("UPDATE social_media.users SET username=$1 WHERE user_id = $2", [newUsername, userId]);
    return result.rowCount > 0;
}
const activateUser = async (userId: string) => {
    const result: QueryResult = await db.query(`UPDATE social_media.users SET active = true WHERE user_id = '${userId}'`);
}
//Friend Related Functions
const updateProfilePicture = async (userId: string, pictureFilename: string) => {
    await db.query("UPDATE social_media.users SET profile_picture=$1 WHERE user_id = $2", [pictureFilename, userId])
}
const getFriends = async (userId: string): Promise<any> => {
    const query = "SELECT user_friends.*, username from (SELECT CASE WHEN friend_one = $1 THEN friend_two ELSE friend_one END AS user_id, chat_id FROM social_media.friends WHERE $1 IN (friend_one, friend_two)) as user_friends JOIN social_media.users on user_friends.user_id = social_media.users.user_id";
    const result: QueryResult = await db.query(query, [userId]);
    return result.rows;
}
const removeFriend = async (userId: string, friendId: string) => {
    const query = "DELETE FROM social_media.friends WHERE $1 in (friend_one, friend_two) AND $2 in (friend_one, friend_two)"
    const result: QueryResult = await db.query(query, [userId, friendId]);
}
const checkForExistingRequest = async (userOneId: string, userTwoId: string): Promise<Boolean> => {
    const result: QueryResult = await db.query("SELECT friend_request_id, requester, requestee FROM social_media.friend_requests WHERE requester = $1 and requestee = $2", [userOneId, userTwoId])
    return result.rowCount > 0;
}

const checkIfFriends = async (userOneId: string, userTwoId: string): Promise<Boolean> => {
    const result: QueryResult = await db.query("SELECT friend_one, friend_two, chat_id FROM social_media.friends WHERE $1 in (friend_one, friend_two) AND $2 in (friend_one, friend_two)", [userOneId, userTwoId])
    return result.rowCount > 0;
}
const addFriendRequest = async (requesterId: string, requesteeId: string): Promise<String> => {
    const result: QueryResult = await db.query("INSERT INTO social_media.friend_requests(requester, requestee) VALUES ($1, $2) RETURNING friend_request_id", [requesterId, requesteeId]);
    return result.rows[0].friend_request_id;
}
const getFriendRequest = async (friendRequestId: string): Promise<FriendRequest | null> => {
    const result: QueryResult = await db.query("SELECT friend_request_id, requester, requestee FROM social_media.friend_requests WHERE friend_request_id = $1", [friendRequestId])
    return result.rowCount > 0 ? result.rows[0] : null
}
const removeFriendRequest = async (friendRequestId: string) => {
    const result: QueryResult = await db.query("DELETE FROM social_media.friend_requests WHERE friend_request_id = $1;", [friendRequestId]);
}
const getFriendRequests = async (userId: string): Promise<any> => {
    const result: QueryResult = await db.query("SELECT user_requests.*, username from (SELECT CASE WHEN requestee = $1 THEN requester ELSE requestee END AS user_id, CASE WHEN requestee = $1 THEN 'false' ELSE 'true' END AS requested, friend_request_id FROM social_media.friend_requests WHERE $1 IN (requester, requestee)) as user_requests JOIN social_media.users on user_requests.user_id = social_media.users.user_id", [userId]);
    return result.rows;
}
const addFriend = async (userOneId: string, userTwoId: string) => {
    const insertResult: QueryResult = await db.query("INSERT INTO social_media.friends(friend_one, friend_two) VALUES ($1, $2);", [userOneId, userTwoId]);
}

const getChats = async (userId: string, chatType: "DIRECT_MESSAGE" | "GROUP") => {
    const result: QueryResult = await db.query("SELECT social_media.chats.name, chat_id as id FROM social_media.chats where chat_type = $1 AND chat_id in (SELECT chat FROM social_media.chat_members WHERE \"user\" = $2)", [chatType, userId])
    return result.rows;
}

export { getUserByEmail, checkEmailExists, addNewUser, activateUser, getUserById, updateProfilePicture, updateUsername, getFriends, removeFriend, checkForExistingRequest, checkIfFriends, addFriendRequest, getFriendRequest, removeFriendRequest, getFriendRequests, addFriend, getChats }
