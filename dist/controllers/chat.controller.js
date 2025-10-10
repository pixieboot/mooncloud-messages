"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const crypto_1 = require("crypto");
const chat_schema_js_1 = require("../database/schemas/chat.schema.js");
const local_user_schema_js_1 = require("../database/schemas/local_user.schema.js");
var ChatController;
(function (ChatController) {
    /**
     * @param sender: string
     * @param receiver: string
     *
     * Checks if chat exists between the two given users as arguments,
     * if it doesn't returns null
     */
    function checkIfChatExists(sender, receiver) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let chat = yield chat_schema_js_1.chatModel.find({
                    $or: [
                        {
                            $and: [
                                {
                                    "members.username": sender,
                                },
                                {
                                    "members.username": receiver,
                                }
                            ]
                        },
                        {
                            $and: [
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
                }
                else {
                    return null;
                }
            }
            catch (err) {
                return undefined;
            }
        });
    }
    ChatController.checkIfChatExists = checkIfChatExists;
    /**
     * @param username: string
     * @returns: Array of objects
     *
     * Finds all chat records in db from given user and returns an array of objs
     */
    function findAllChatsOfAUser(username) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let chats = yield chat_schema_js_1.chatModel.find({
                    "members.username": username,
                });
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
                else
                    return null;
            }
            catch (err) {
                return undefined;
            }
        });
    }
    ChatController.findAllChatsOfAUser = findAllChatsOfAUser;
    /**
     * @param sender: string
     * @param receiver: string
     *
     * If function checkIfChatExists returns false, this function will be called
     * in order to create a new chat record in db for given users in args
     */
    function initiateChat(sender, receiver, receivers) {
        return __awaiter(this, void 0, void 0, function* () {
            let desc;
            let senderQuery;
            let receiverQuery;
            if (receivers !== null) {
                desc = "private chat";
            }
            else {
                desc = "group chat";
            }
            try {
                senderQuery = {
                    username: sender,
                };
                receiverQuery = {
                    username: receiver,
                };
                let senderResult = yield local_user_schema_js_1.localUserModel.findOne(senderQuery);
                let receiverResult = yield local_user_schema_js_1.localUserModel.findOne(receiverQuery);
                if (senderResult && receiverResult) {
                    yield chat_schema_js_1.chatModel.create({
                        chatID: (0, crypto_1.randomUUID)(),
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
                    });
                    return true;
                }
                else
                    return null;
            }
            catch (err) {
                return undefined;
            }
        });
    }
    ChatController.initiateChat = initiateChat;
    /**
     * @param chatID: string
     *
     * Updates chat record on message sent and adds it to the messages array, returns id for further assignments
     */
    function sendMessage(sender, message, chatID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let chat = yield chat_schema_js_1.chatModel.findOne({
                    chatID: chatID,
                });
                if (chat) {
                    let date = Math.floor((new Date()).getTime() / 1000);
                    let id = (0, crypto_1.randomUUID)();
                    yield chat_schema_js_1.chatModel.updateOne({
                        _id: chat,
                    }, {
                        $push: {
                            messages: {
                                message_id: id,
                                username: sender,
                                message: message,
                                dateSent: date,
                                dateRead: null,
                            }
                        },
                    });
                    return id;
                }
            }
            catch (err) {
                console.error(err);
                return undefined;
            }
        });
    }
    ChatController.sendMessage = sendMessage;
    /**
     * @param chatID: string
     *
     * Loads all of the chat's messages and sends them to the user for front end rendering
     */
    function loadChat(chatID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let chat = yield chat_schema_js_1.chatModel.findOne({
                    chatID: chatID,
                });
                if (chat) {
                    return chat;
                }
                else
                    return null;
            }
            catch (err) {
                return undefined;
            }
        });
    }
    ChatController.loadChat = loadChat;
    /**
     *
     * @param chatID: string
     * @param messageID: string
     *
     * Updates date of dateRead row in db when message was seen by the reader
     */
    function updateIfMessageIsSeen(chatID, messageID) {
        return __awaiter(this, void 0, void 0, function* () {
            let newDate = Math.floor((new Date()).getTime() / 1000);
            let dateToString = newDate.toString();
            try {
                yield chat_schema_js_1.chatModel.updateMany({
                    chatID, "messages.message_id": messageID,
                }, {
                    "messages.$.dateRead": dateToString,
                });
                return dateToString;
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    ChatController.updateIfMessageIsSeen = updateIfMessageIsSeen;
})(ChatController || (exports.ChatController = ChatController = {}));
//# sourceMappingURL=chat.controller.js.map