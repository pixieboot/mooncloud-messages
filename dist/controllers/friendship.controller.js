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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendshipController = void 0;
const crypto_1 = __importDefault(require("crypto"));
const local_user_schema_js_1 = require("../database/schemas/local_user.schema.js");
const friendship_schema_js_1 = require("../database/schemas/friendship.schema.js");
var FriendshipController;
(function (FriendshipController) {
    /**
     * @param user: string
     * @param friendshipID: array
     * @returns array
     *
     * Function that takes a users username or friendshipID
     * as arguments in order to check if friendship exists,
     * if it does, it returns array of friendship data
     */
    function findFriendships(user, friendshipID) {
        return __awaiter(this, void 0, void 0, function* () {
            let friendshipsData = [];
            try {
                let query;
                if (friendshipID) {
                    query = { _id: friendshipID };
                }
                else {
                    query = {
                        'username': user,
                    };
                }
                const result = yield local_user_schema_js_1.localUserModel.find(query, { friendships: 1 });
                const firstElem = result[0];
                const friendshipsArray = firstElem.friendships;
                friendshipsArray.forEach(friendshipObj => {
                    friendshipsData.push({
                        friendship_id: friendshipObj.friendship_id,
                        username: friendshipObj.username,
                        status: friendshipObj.status,
                    });
                });
                return friendshipsData.length > 0 ? friendshipsData : null;
            }
            catch (err) {
                console.error(err);
                return undefined;
            }
        });
    }
    FriendshipController.findFriendships = findFriendships;
    /**
     *
     * @param multiQuery: String[]
     * @returns array
     *
     * Takes array of string as query and returns data,
     * returned data is sorted into array that is returned
     * to the function that called it
     */
    function findFriendshipsViaIDs(multiQuery) {
        return __awaiter(this, void 0, void 0, function* () {
            let friendshipsArray = [];
            try {
                let query;
                query = {
                    friendship_id: {
                        $in: multiQuery,
                    }
                };
                let friendships = yield friendship_schema_js_1.friendshipModel.find(query);
                for (let i = 0; i < friendships.length; i++) {
                    friendshipsArray.push({
                        friendship_id: friendships[i].friendship_id,
                        requester: friendships[i].requester.username,
                        receiver: friendships[i].receiver.username,
                        status: friendships[i].status,
                        description: friendships[i].description,
                    });
                }
                return friendshipsArray.length > 0 ? friendshipsArray : null;
            }
            catch (err) {
                console.error(err);
                return undefined;
            }
        });
    }
    FriendshipController.findFriendshipsViaIDs = findFriendshipsViaIDs;
    function findAFriendshipViaRequester(requester, receiver) {
        return __awaiter(this, void 0, void 0, function* () {
            let friendshipObject = [];
            try {
                let query;
                query = {
                    'requester.username': requester,
                    'receiver.username': receiver
                };
                let friendship = yield friendship_schema_js_1.friendshipModel.findOne(query);
                if (friendship) {
                    friendshipObject.push({
                        friendship_id: friendship.friendship_id,
                        requester: friendship.requester.username,
                        receiver: friendship.receiver.username,
                    });
                }
                return friendshipObject;
            }
            catch (err) {
                console.error(err);
                return undefined;
            }
        });
    }
    FriendshipController.findAFriendshipViaRequester = findAFriendshipViaRequester;
    /**
     *
     * @param requester: string
     * @param receiver: string
     * @returns string
     *
     * Function that writes a new object record of a friendship between 2 users and
     * sets it as Pending status (to be resolved depending if the users accepts or declines)
     */
    function requestFriend(requester, receiver) {
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield findFriendships(requester);
            let friend;
            if (result) {
                for (let i = 0; i < result.length; i++) {
                    friend = result[i].username;
                }
            }
            if ((!friend) || (friend !== receiver)) {
                try {
                    let users = yield local_user_schema_js_1.localUserModel.find({
                        username: {
                            $in: [requester, receiver]
                        }
                    });
                    if (users.length === 2) {
                        let id = crypto_1.default.randomUUID();
                        let user1;
                        let user2;
                        for (let i = 0; i < users.length; i++) {
                            if (users[i].username === requester) {
                                user1 = users[i];
                            }
                            else if (users[i].username === receiver) {
                                user2 = users[i];
                            }
                        }
                        yield friendship_schema_js_1.friendshipModel.create({
                            friendship_id: id,
                            requester: {
                                _id: user1 === null || user1 === void 0 ? void 0 : user1._id,
                                username: user1 === null || user1 === void 0 ? void 0 : user1.username,
                                email: user1 === null || user1 === void 0 ? void 0 : user1.email,
                            },
                            receiver: {
                                _id: user2 === null || user2 === void 0 ? void 0 : user2._id,
                                username: user2 === null || user2 === void 0 ? void 0 : user2.username,
                                email: user2 === null || user2 === void 0 ? void 0 : user2.email,
                            },
                            status: 2,
                            description: "Pending",
                        });
                        yield local_user_schema_js_1.localUserModel.findOneAndUpdate({
                            username: requester,
                        }, {
                            $push: {
                                friendships: {
                                    friendship_id: id,
                                    status: 2,
                                    friend_id: user2 === null || user2 === void 0 ? void 0 : user2._id,
                                    username: user2 === null || user2 === void 0 ? void 0 : user2.username,
                                    added_at: Date.now(),
                                },
                            }
                        });
                        yield local_user_schema_js_1.localUserModel.findOneAndUpdate({
                            username: receiver,
                        }, {
                            $push: {
                                friendships: {
                                    friendship_id: id,
                                    status: 2,
                                    friend_id: user1 === null || user1 === void 0 ? void 0 : user1._id,
                                    username: user1 === null || user1 === void 0 ? void 0 : user1.username,
                                    added_at: Date.now(),
                                },
                            }
                        });
                        return receiver;
                    }
                }
                catch (err) {
                    console.log(err);
                    return undefined;
                }
            }
        });
    }
    FriendshipController.requestFriend = requestFriend;
    /**
     * @param friendship: FriendshipObject[]
     * @returns: string
     *
     * If a user doesn't accepts a request from a friend,
     * the friendship placeholder that was recorded when friend
     * request was send is going to be deleted
     */
    function rejectFriend(friendship) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let friendshipID;
                let requester;
                let receiver;
                if (friendship) {
                    for (let i = 0; i < friendship.length; i++) {
                        friendshipID = friendship[i].friendship_id;
                        requester = friendship[i].requester;
                        receiver = friendship[i].receiver;
                    }
                    const friendshipQuery = {
                        friendship_id: friendshipID,
                    };
                    yield friendship_schema_js_1.friendshipModel.deleteOne(friendshipQuery);
                    const requesterQuery = {
                        username: requester,
                    };
                    const requesterQueryUpdate = {
                        $pull: {
                            friendships: {
                                username: receiver,
                            }
                        }
                    };
                    let requesterQueryResult = yield local_user_schema_js_1.localUserModel.updateOne(requesterQuery, requesterQueryUpdate);
                    const receiverQuery = {
                        username: receiver,
                    };
                    const receiverQueryUpdate = {
                        $pull: {
                            friendships: {
                                username: requester,
                            }
                        }
                    };
                    let receiverQueryResult = yield local_user_schema_js_1.localUserModel.updateOne(receiverQuery, receiverQueryUpdate);
                    if (requesterQueryResult.matchedCount === 1 && receiverQueryResult.matchedCount === 1) {
                        return requester;
                    }
                    else {
                        return null;
                    }
                }
            }
            catch (err) {
                return undefined;
            }
        });
    }
    FriendshipController.rejectFriend = rejectFriend;
    /**
     *
     * @param user_id: string
     * @param friendship_id: ObjectId (MongoDB Object)
     * @returns: boolean
     *
     * Takes user ID and friendship ID and checks if given friendship already
     * exists in users friendship array
     */
    function checkIfFriendshipExists(user_id, friendship_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let user = yield local_user_schema_js_1.localUserModel.findOne({
                    _id: user_id,
                });
                if (user !== null || undefined) {
                    let userFriendshipsArray = user === null || user === void 0 ? void 0 : user.friendships;
                    if (!userFriendshipsArray)
                        return null;
                    else {
                        for (let i = 0; i < (userFriendshipsArray === null || userFriendshipsArray === void 0 ? void 0 : userFriendshipsArray.length); i++) {
                            let userFriendship = userFriendshipsArray[i].friendship_id;
                            if (userFriendship === friendship_id)
                                return true;
                            else
                                return false;
                        }
                    }
                }
            }
            catch (err) {
                return undefined;
            }
        });
    }
    FriendshipController.checkIfFriendshipExists = checkIfFriendshipExists;
    /**
     * @param friendship: FriendshipObject[]
     * @returns: string
     *
     * When a user clicks to accept a friend, function takes in user's friendshipID,
     * and changes its status to Accepted, while also adds a new record
     * in user's friendship array adding that friend's ID
     */
    function acceptFriend(friendship) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let friendshipID;
                let requester;
                let receiver;
                if (friendship) {
                    for (let i = 0; i < friendship.length; i++) {
                        friendshipID = friendship[i].friendship_id;
                        requester = friendship[i].requester;
                        receiver = friendship[i].receiver;
                    }
                    const friendshipQuery = {
                        friendship_id: friendshipID,
                    };
                    const friendshipQueryUpdate = {
                        $set: {
                            status: 1,
                            description: "Accepted",
                        }
                    };
                    let friendshipQueryResult = yield friendship_schema_js_1.friendshipModel.updateOne(friendshipQuery, friendshipQueryUpdate);
                    const requesterQuery = {
                        username: requester,
                    };
                    const requesterQueryUpdate = {
                        $set: {
                            "friendships.$[elem].status": 1,
                        }
                    };
                    const requesterUpdateOptions = {
                        arrayFilters: [{ "elem.username": receiver }]
                    };
                    let requesterQueryResult = yield local_user_schema_js_1.localUserModel.updateOne(requesterQuery, requesterQueryUpdate, requesterUpdateOptions);
                    const receiverQuery = { username: receiver, };
                    const receiverQueryUpdate = {
                        $set: {
                            "friendships.$[elem].status": 1,
                        }
                    };
                    const receiverUpdateOptions = {
                        arrayFilters: [{ "elem.username": requester }]
                    };
                    let receiverQueryResult = yield local_user_schema_js_1.localUserModel.updateOne(receiverQuery, receiverQueryUpdate, receiverUpdateOptions);
                    if (friendshipQueryResult.matchedCount === 1 && requesterQueryResult.matchedCount === 1 && receiverQueryResult.matchedCount === 1) {
                        return requester;
                    }
                    else {
                        return null;
                    }
                }
            }
            catch (err) {
                return undefined;
            }
        });
    }
    FriendshipController.acceptFriend = acceptFriend;
    /**
     * @param friendship_id: string
     * @returns: boolean
     *
     * When a users click on delete friends, function takes friendship ID and
     * deletes friendship record as well as that friend's ID on both users
     */
    function deleteFriend(friendship_id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let friendshipID = yield friendship_schema_js_1.friendshipModel.findOne({
                    _id: friendship_id,
                });
                if (friendshipID !== null || undefined) {
                    let requesterID = friendshipID === null || friendshipID === void 0 ? void 0 : friendshipID.requester;
                    let receiverID = friendshipID === null || friendshipID === void 0 ? void 0 : friendshipID.receiver;
                    yield friendship_schema_js_1.friendshipModel.findOneAndDelete({
                        _id: friendshipID,
                    });
                    yield local_user_schema_js_1.localUserModel.updateOne({
                        _id: requesterID,
                    }, {
                        $pull: {
                            friendships: receiverID,
                        }
                    });
                    yield local_user_schema_js_1.localUserModel.updateOne({
                        _id: receiverID,
                    }, {
                        $pull: {
                            friendships: requesterID,
                        }
                    });
                    return true;
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
    FriendshipController.deleteFriend = deleteFriend;
    /**
     *
     * @param username: string
     * @returns: Array<string>
     *
     * Function that returns an array of friends from given username
     */
    function getAllFriends(username) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let result = yield local_user_schema_js_1.localUserModel.findOne({
                    username: username,
                });
                if (result) {
                    let friendUsernames = result.friendships
                        .filter((friend) => friend.status === 1)
                        .map((friend) => friend.username);
                    let friends = yield local_user_schema_js_1.localUserModel.find({
                        username: { $in: friendUsernames },
                    });
                    if (friends) {
                        let friendsArray = [];
                        for (let i = 0; i < friends.length; i++) {
                            friendsArray.push({
                                userID: friends[i].userID,
                                username: friends[i].username,
                                avatar: friends[i].avatar,
                                email: friends[i].email,
                                status: friends[i].status,
                                description: friends[i].description,
                            });
                        }
                        return friendsArray.length > 0 ? friendsArray : null;
                    }
                    else {
                        return null;
                    }
                }
                else {
                    return null;
                }
            }
            catch (err) {
                console.error(err);
                return undefined;
            }
        });
    }
    FriendshipController.getAllFriends = getAllFriends;
})(FriendshipController || (exports.FriendshipController = FriendshipController = {}));
//# sourceMappingURL=friendship.controller.js.map