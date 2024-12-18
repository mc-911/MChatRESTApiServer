import { QueryResult } from "pg";
import db from "../db"
import Chat from "../types/chat";
import ChatMemberType from "../enums/ChatMemberType";
const checkUserInChat = async (userId: string, chatId: string): Promise<boolean> => {
    const result: QueryResult = await db.query(`SELECT $1 in (SELECT chat_members.user FROM social_media.chat_members where chat = $2) as user_in_chat`, [userId, chatId]);
    console.log(result.rows[0])
    return result.rows[0].user_in_chat;
}
const getMemberInfo = async (userId: string, chatId: string): Promise<{ username: string, user_id: string, role: string } | undefined> => {
    const result: QueryResult = await db.query('SELECT chat, "user", role FROM social_media.chat_members WHERE "user" = $1 AND chat = $2', [userId, chatId]);
    return result.rowCount > 0 ? result.rows[0] : undefined
}
const getChatMessages = async (chatId: string) => {
    const result: QueryResult = await db.query(`SELECT message_id, content, owner, chat, "timestamp", username
	FROM social_media.messages JOIN social_media.users ON owner=user_id WHERE chat = $1 ORDER BY timestamp asc`, [chatId]);
    return result.rows;
}

const storeChatMessage = async (ownerId: string, chatId: string, timestamp: number, content: string) => {
    console.log("Trying to store message with these values: ", { ownerId, chatId, timestamp, content })
    const result: QueryResult = await db.query(`
  INSERT INTO social_media.messages(content, owner, chat, "timestamp")
  VALUES ($1, $2, $3, to_timestamp($4 / 1000.0));
`, [content, ownerId, chatId, timestamp]);

    console.log(result)
}
const getDMChatInfo = async (chatId: string, userId: string): Promise<{ user_id: string, username: string }[] | null> => {
    const result: QueryResult = await db.query("SELECT social_media.users.* FROM (SELECT * FROM social_media.chat_members WHERE chat = $1 AND social_media.chat_members.user != $2) as other_users, social_media.users WHERE user_id = other_users.user", [chatId, userId]);
    return result.rowCount ? result.rows : null;
}
const getChat = async (chatId: string): Promise<Chat | null> => {
    return (await db.query("SELECT * FROM social_media.chats WHERE chat_id = $1", [chatId])).rows[0] ?? null;
}
const getChatByInviteCode = async (inviteCode: string): Promise<Chat | null> => {
    return (await db.query("SELECT * FROM social_media.chats WHERE invite_code = $1", [inviteCode])).rows[0] ?? null;
}
const addChat = async (chatName: string, type: string): Promise<String> => {
    const result: QueryResult = await db.query("INSERT INTO social_media.chats(chat_type, name) VALUES ($1, $2) RETURNING chat_id", [type, chatName])
    return result.rows[0].chat_id;
}

const addMember = async (userId: string, chatId: string, memberType: string) => {
    await db.query('INSERT INTO social_media.chat_members(chat, "user", role) VALUES ($1, $2, $3)', [chatId, userId, memberType])
}

const getMembers = async (chatId: string): Promise<{ username: string, user_id: string, role: string }[]> => {
    const result = await db.query('SELECT username, user_id, role from social_media.users, (SELECT * FROM social_media.chat_members WHERE chat = $1) as members WHERE user_id = members.user', [chatId])
    return result.rows;
}
const getChatOwner = async (chatId: string): Promise<{ chat: string, user: string, role: ChatMemberType } | null> => {
    const result = await db.query("SELECT * FROM social_media.chats_members WHERE chat = $1 AND \"role\" = 'OWNER'")
    return result.rowCount > 0 ? result.rows[0] : null
}
const removeChat = async (chatId: string) => {
    const result = await db.query("DELETE FROM social_media.chats WHERE chat_id = $1", [chatId])
}
const removeMember = async (chatId: string, userId: string) => {
    const result = await db.query("DELETE FROM social_media.chat_members WHERE chat = $1 AND \"user\" = $2", [chatId, userId])
    console.log(result)

}
export { getChatByInviteCode, checkUserInChat, getChatMessages, storeChatMessage, getDMChatInfo, addChat, removeChat, addMember, getChat, getChatOwner, getMemberInfo, getMembers, removeMember }