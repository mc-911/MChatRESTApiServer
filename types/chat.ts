import ChatType from "../enums/ChatType";

type Chat = {
    chat_id: string,
    chat_type: ChatType,
    chat_photo: string,
    name: string,
    invite_code: string

}

export default Chat;