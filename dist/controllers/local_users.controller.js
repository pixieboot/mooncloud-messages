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
exports.LocalUsersController = void 0;
const friendship_schema_js_1 = require("../database/schemas/friendship.schema.js");
const local_user_schema_js_1 = require("../database/schemas/local_user.schema.js");
const chat_schema_js_1 = require("../database/schemas/chat.schema.js");
const bcrypt_util_js_1 = require("../public/utils/bcrypt.util.js");
var LocalUsersController;
(function (LocalUsersController) {
    /**
     * @param username: string
     * @returns string
     *
     * Function takes an username and returns userID that is converted
     * from MongoDB's ObjectId to String
     */
    function findUserIdViaUsername(username) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let result = yield local_user_schema_js_1.localUserModel.findOne({
                    username: username,
                });
                let userID = result === null || result === void 0 ? void 0 : result._id.toString();
                if (userID !== undefined) {
                    return userID;
                }
                else {
                    return false;
                }
            }
            catch (err) {
                return undefined;
            }
        });
    }
    LocalUsersController.findUserIdViaUsername = findUserIdViaUsername;
    /**
     * @returns array of user objects
     *
     * Calling this function returns an array of objects of all local users
     */
    function getAllLocalUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let result = yield local_user_schema_js_1.localUserModel.find().exec();
                if (!result) {
                    return null;
                }
                return result;
            }
            catch (err) {
                return undefined;
            }
        });
    }
    LocalUsersController.getAllLocalUsers = getAllLocalUsers;
    /**
     * @param regexQuery: string,
     * @param multiQuery?: String[]
     * @returns array
     *
     * Takes a string argument or multiple strings in an array,
     * and returns array of user objects
     */
    function getLocalUser(regexQuery, multiQuery) {
        return __awaiter(this, void 0, void 0, function* () {
            let usersData = [];
            let query;
            try {
                if (multiQuery) {
                    query = {
                        username: {
                            $in: multiQuery,
                        }
                    };
                }
                if (regexQuery) {
                    query = {
                        username: {
                            $regex: regexQuery,
                        },
                    };
                }
                let users = yield local_user_schema_js_1.localUserModel.find(query);
                for (let i = 0; i < users.length; i++) {
                    usersData.push({
                        username: users[i].username,
                        avatar: users[i].avatar,
                        defaultAvatar: users[i].defaultAvatar,
                        email: users[i].email,
                        userID: users[i].userID,
                        description: users[i].description,
                    });
                }
                return usersData.length > 0 ? usersData : null;
            }
            catch (err) {
                return undefined;
            }
        });
    }
    LocalUsersController.getLocalUser = getLocalUser;
    /**
     * @param userID: string
     * @param username: string
     * @param email: string
     * @param password: string
     * @param avatar: string
     * @param rank: string
     * @param status: string
     * @returns void
     *
     * Function for creating a new user record
     */
    function createLocalUser(userID, username, email, password, avatar, rank, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield local_user_schema_js_1.localUserModel.create({
                    userID,
                    username,
                    email,
                    password,
                    avatar,
                    rank,
                    status,
                });
            }
            catch (err) {
                return null;
            }
        });
    }
    LocalUsersController.createLocalUser = createLocalUser;
    /**
     * @param email: string
     * @param username: string
     * @param avatar: string
     * @returns void
     *
     * Function for changing and updating user info
     */
    function updateLocalUser(email, username, avatar) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield local_user_schema_js_1.localUserModel.findOneAndUpdate({ email: email }, {
                    $set: {
                        email: email,
                        username: username,
                        avatar: avatar,
                    },
                });
            }
            catch (err) {
                return null;
            }
        });
    }
    LocalUsersController.updateLocalUser = updateLocalUser;
    /**
     * @param user: string
     * @param username: string
     * @param email: string
     * @param description: string
     * @param avatar: string
     * @returns void
     *
     * Function for changing and updating user info
     */
    function updateLocalUserInfo(user, username, email, description, avatar) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(avatar);
            try {
                let filterQuery = { username: user };
                let updateFields = { username, email, description, avatar };
                for (let [key, value] of Object.entries(updateFields)) {
                    if (value !== null && value !== undefined && value !== "") {
                        updateFields[key] = value;
                    }
                    else {
                        delete updateFields[key];
                    }
                }
                if (Object.keys(updateFields).length > 0) {
                    let updateQuery = {
                        $set: updateFields,
                    };
                    let result = yield local_user_schema_js_1.localUserModel.updateOne(filterQuery, updateQuery);
                    console.log(result);
                    if (result) {
                        console.log(`${result.matchedCount} document(s) matched the filter criteria.`);
                        console.log(`${result.modifiedCount} document(s) was/were updated.`);
                    }
                    else
                        return null;
                }
                ;
                if (username) {
                    let userResult = yield local_user_schema_js_1.localUserModel.findOne({
                        $or: [
                            { username: username },
                            { username: user }
                        ]
                    });
                    if (userResult) {
                        for (let i = 0; i < userResult.friendships.length; i++) {
                            let friendUsername = userResult.friendships[i].username;
                            let friend = yield local_user_schema_js_1.localUserModel.findOne({
                                username: friendUsername,
                            });
                            if (friend) {
                                for (let i = 0; i < friend.friendships.length; i++) {
                                    if (userResult.username === username) {
                                        yield local_user_schema_js_1.localUserModel.updateOne({ 'friendships.username': user }, { $set: { 'friendships.$.username': username } });
                                        let friendshipQuery = {
                                            $or: [
                                                { "requester.username": user },
                                                { "receiver.username": user }
                                            ]
                                        };
                                        let friendshipField = friendshipQuery["$or"][i]["requester.username"] === user
                                            ? "requester.username"
                                            : "receiver.username";
                                        let friendshipUpdate = {
                                            $set: {
                                                [friendshipField]: username
                                            }
                                        };
                                        yield friendship_schema_js_1.friendshipModel.updateMany(friendshipQuery, friendshipUpdate);
                                        let chatQuery = {
                                            "members.username": user,
                                        };
                                        let chatUpdate = {
                                            $set: {
                                                "members.$.username": username,
                                            },
                                        };
                                        yield chat_schema_js_1.chatModel.updateMany(chatQuery, chatUpdate);
                                        let messageQuery = {
                                            "messages.username": user,
                                        };
                                        let messagesUpdate = {
                                            $set: {
                                                "messages.$.username": username,
                                            },
                                        };
                                        yield chat_schema_js_1.chatModel.updateMany(messageQuery, messagesUpdate);
                                    }
                                }
                            }
                        }
                    }
                }
                if (email) {
                    let userResult = yield local_user_schema_js_1.localUserModel.findOne({
                        $or: [
                            { username: username },
                            { username: user }
                        ]
                    });
                    if (userResult) {
                        let userResultEmail = userResult.email;
                        if (username) {
                            const documentToUpdate = yield friendship_schema_js_1.friendshipModel.findOne({
                                $or: [
                                    { "requester.username": username },
                                    { "receiver.username": username }
                                ]
                            });
                            // Determine whether to update requester.email or receiver.email based on the found document
                            let updateField;
                            if (documentToUpdate && documentToUpdate.requester && documentToUpdate.requester.username === username) {
                                updateField = "requester.email";
                            }
                            else if (documentToUpdate && documentToUpdate.receiver && documentToUpdate.receiver.username === username) {
                                updateField = "receiver.email";
                            }
                            // Update the email address
                            if (updateField && documentToUpdate) {
                                const result = yield friendship_schema_js_1.friendshipModel.updateOne({ _id: documentToUpdate._id }, { $set: { [updateField]: email } });
                            }
                        }
                        else {
                            const documentToUpdate = yield friendship_schema_js_1.friendshipModel.findOne({
                                $or: [
                                    { "requester.username": user },
                                    { "receiver.username": user }
                                ]
                            });
                            // Determine whether to update requester.email or receiver.email based on the found document
                            let updateField;
                            if (documentToUpdate && documentToUpdate.requester && documentToUpdate.requester.username === user) {
                                updateField = "requester.email";
                            }
                            else if (documentToUpdate && documentToUpdate.receiver && documentToUpdate.receiver.username === user) {
                                updateField = "receiver.email";
                            }
                            // Update the email address
                            if (updateField && documentToUpdate) {
                                const result = yield friendship_schema_js_1.friendshipModel.updateOne({ _id: documentToUpdate._id }, { $set: { [updateField]: email } });
                            }
                        }
                        let chatQuery = {
                            $or: [
                                { "members.username": user },
                                { "members.username": username },
                            ]
                        };
                        let chatUpdate = {
                            $set: {
                                "members.$.email": userResultEmail,
                            },
                        };
                        yield chat_schema_js_1.chatModel.updateMany(chatQuery, chatUpdate);
                    }
                }
            }
            catch (err) {
                return null;
            }
        });
    }
    LocalUsersController.updateLocalUserInfo = updateLocalUserInfo;
    /**
     * @param username: string
     * @returns void
     *
     * Function for removing an user from db
     */
    function deleteLocalUser(username) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let userResult = yield local_user_schema_js_1.localUserModel.findOne({
                    username: username,
                });
                yield local_user_schema_js_1.localUserModel.updateOne({ 'username': username }, { $set: { 'friendships.$[].status': 3 } });
                if (userResult) {
                    for (let i = 0; i < userResult.friendships.length; i++) {
                        let friendUsername = userResult.friendships[i].username;
                        let friend = yield local_user_schema_js_1.localUserModel.findOne({
                            username: friendUsername,
                        });
                        if (friend) {
                            for (let i = 0; i < friend.friendships.length; i++) {
                                if (userResult.username === username) {
                                    yield local_user_schema_js_1.localUserModel.updateOne({ 'friendships.username': username }, { $set: { 'friendships.$.status': 3 } });
                                    let friendshipQuery = {
                                        $or: [
                                            { "requester.username": username },
                                            { "receiver.username": username }
                                        ]
                                    };
                                    let friendshipUpdate = {
                                        $set: {
                                            status: 3
                                        }
                                    };
                                    yield friendship_schema_js_1.friendshipModel.updateMany(friendshipQuery, friendshipUpdate);
                                    let chatQuery = {
                                        "members.username": username,
                                    };
                                    yield chat_schema_js_1.chatModel.deleteMany(chatQuery);
                                }
                            }
                        }
                    }
                    let deleteUserQuery = { username: username };
                    let setDeleteStatus = {
                        $set: { status: "deleted" }
                    };
                    yield local_user_schema_js_1.localUserModel.updateOne(deleteUserQuery, setDeleteStatus);
                }
                return true;
            }
            catch (err) {
                console.error(err);
                return null;
            }
        });
    }
    LocalUsersController.deleteLocalUser = deleteLocalUser;
    /**
     * @param user: string
     * @param password: string
     * @returns boolean
     *
     * Function for checking passwords
     */
    function checkLocalUserPassword(user, password) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let result = yield local_user_schema_js_1.localUserModel.findOne({ username: user });
                if (result) {
                    let isMatch = bcrypt_util_js_1.Bcrypt.comparePasswords(password, result.password);
                    return isMatch;
                }
                return null;
            }
            catch (err) {
                console.error(err);
                return undefined;
            }
        });
    }
    LocalUsersController.checkLocalUserPassword = checkLocalUserPassword;
    /**
     * @param user: string
     * @param newPassword: string
     * @returns boolean
     *
     * Hashes and updates new password
     */
    function changeLocalUserPassword(user, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let newHashedPassword = bcrypt_util_js_1.Bcrypt.hashedPassword(newPassword);
                let userQuery = {
                    username: user,
                };
                let newPasswordQuery = {
                    $set: {
                        password: newHashedPassword,
                    }
                };
                let result = yield local_user_schema_js_1.localUserModel.updateOne(userQuery, newPasswordQuery);
                if ((result === null || result === void 0 ? void 0 : result.matchedCount) === 1) {
                    return true;
                }
                else
                    return false;
            }
            catch (err) {
                console.error(err);
                return undefined;
            }
        });
    }
    LocalUsersController.changeLocalUserPassword = changeLocalUserPassword;
})(LocalUsersController || (exports.LocalUsersController = LocalUsersController = {}));
//# sourceMappingURL=local_users.controller.js.map