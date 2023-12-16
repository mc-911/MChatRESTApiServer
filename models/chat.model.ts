import { QueryResult } from "pg";
import db from "../db"
const checkUserInChat = async (userId: string, chatId: string): Promise<boolean> => {
    const result: QueryResult = await db.query(`SELECT $1 in (SELECT chat_members.user FROM social_media.chat_members where chat = $2) as user_in_chat`, [userId, chatId]);
    console.log(result.rows[0])
    return result.rows[0].user_in_chat;
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
const getChatInfo = async (chatId: string, userId: string): Promise<{ user_id: string, username: string }[]> => {
    const result: QueryResult = await db.query("SELECT social_media.users.* FROM (SELECT * FROM social_media.chat_members WHERE chat = $1 AND social_media.chat_members.user != $2) as other_users, social_media.users WHERE user_id = other_users.user", [chatId, userId]);
    return result.rows;
}
export { checkUserInChat, getChatMessages, storeChatMessage, getChatInfo }