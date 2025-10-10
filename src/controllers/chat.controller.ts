import { randomUUID } from "crypto";
import { chatModel } from "../database/schemas/chat.schema.js";
import { localUserModel } from "../database/schemas/local_user.schema.js";

export namespace ChatController {
    /**
     * @param sender: string
     * @param receiver: string
     * 
     * Checks if chat exists between the two given users as arguments,
     * if it doesn't returns null
     */
    export async function checkIfChatExists(sender: string, receiver: string): Promise<string | null | undefined> {
        try {
            let chat = await chatModel.find({
                $or:
                    [
                        {
                            $and:
                                [
                                    {
                                        "members.username": sender,
                                    },
                                    {
                                        "members.username": receiver,
                                    }
                                ]
                        },
                        {
                            $and:
                                [
                                    {
                                        "members.username": receiver,
                                    },
                                    {
                                        "members.username": sender,
                                    }
                                ]
                        }
                    ]
            });
            if (chat) {
                return chat[0].id;
            } else {
                return null;
            }
        } catch (err: any) {
            return undefined;
        }
    }

    /**
     * @param username: string
     * @returns: Array of objects
     * 
     * Finds all chat records in db from given user and returns an array of objs
     */
    export async function findAllChatsOfAUser(username: string): Promise<any | null | undefined> {
        try {
            let chats = await chatModel.find({
                "members.username": username,
            })
            if (chats) {
                let chatsData = [];
                for (let i = 0; i < chats.length; i++) {
                    chatsData.push({
                        chatID: chats[i].chatID,
                        members: chats[i].members,
                        last_message: chats[i].messages.pop(),
                    });
                }
                return chatsData;
            }
            else return null;
        } catch (err: any) {
            return undefined;
        }
    }

    /**
     * @param sender: string
     * @param receiver: string
     * 
     * If function checkIfChatExists returns false, this function will be called
     * in order to create a new chat record in db for given users in args
     */
    export async function initiateChat(sender: string, receiver?: string, receivers?: Array<string>): Promise<Boolean | null | undefined> {
        let desc: string;
        let senderQuery: any;
        let receiverQuery: any;
        if (receivers !== null) {
            desc = "private chat"
        } else {
            desc = "group chat"
        }
        try {
            senderQuery = {
                username: sender,
            }
            receiverQuery = {
                username: receiver,
            }
            let senderResult = await localUserModel.findOne(senderQuery);
            let receiverResult = await localUserModel.findOne(receiverQuery);
            if (senderResult && receiverResult) {
                await chatModel.create({
                    chatID: randomUUID(),
                    time: new Date(),
                    members: [
                        {
                            username: senderResult.username,
                            avatar: senderResult.avatar,
                            email: senderResult.email,
                            status: senderResult.status,
                        },
                        {
                            username: receiverResult.username,
                            avatar: receiverResult.avatar,
                            email: receiverResult.email,
                            status: receiverResult.status,
                        }
                    ],
                    messages: [],
                    description: desc,
                    total_messages: 0,
                })
                return true;
            } else return null;
        } catch (err: any) {
            return undefined;
        }
    }

    /**
     * @param chatID: string
     * 
     * Updates chat record on message sent and adds it to the messages array, returns id for further assignments
     */
    export async function sendMessage(sender: string, message: string, chatID: string): Promise<String | undefined> {
        try {
            let chat = await chatModel.findOne({
                chatID: chatID,
            })
            if (chat) {
                let date = Math.floor((new Date()).getTime() / 1000)
                let id = randomUUID();
                await chatModel.updateOne({
                    _id: chat,
                },
                    {
                        $push: {
                            messages: {
                                message_id: id,
                                username: sender,
                                message: message,
                                dateSent: date,
                                dateRead: null,
                            }
                        },
                    })
                return id;
            }
        } catch (err: any) {
            console.error(err)
            return undefined;
        }
    }

    /**
     * @param chatID: string
     * 
     * Loads all of the chat's messages and sends them to the user for front end rendering
     */
    export async function loadChat(chatID: string | null | undefined): Promise<any | null | undefined> {
        try {
            let chat = await chatModel.findOne({
                chatID: chatID,
            });
            if (chat) {
                return chat;
            } else return null;
        } catch (err: any) {
            console.error(err)
            return undefined;
        }
    }

    /**
     * 
     * @param chatID: string
     * @param messageID: string
     * 
     * Updates date of dateRead row in db when message was seen by the reader
     */
    export async function updateIfMessageIsSeen(chatID: string, messageID: string): Promise<any | undefined> {
        let newDate = Math.floor((new Date()).getTime() / 1000);
        let dateToString = newDate.toString();
        try {
            await chatModel.updateMany(
                {
                    chatID, "messages.message_id": messageID,
                },
                {
                    "messages.$.dateRead": dateToString,
                }
            )
            return dateToString;
        }
        catch (err: any) {
            console.log(err);
            return undefined;
        }
    }
}