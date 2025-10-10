import crypto from "crypto";
import { localUserModel } from "../database/schemas/local_user.schema.js";
import { friendshipModel } from "../database/schemas/friendship.schema.js";

export namespace FriendshipController {

    type FriendshipsData = {
        friendship_id: String,
        username: String,
        status: Number,
    }

    /**
     * @param user: string
     * @param friendshipID: array
     * @returns array
     * 
     * Function that takes a users username or friendshipID
     * as arguments in order to check if friendship exists,
     * if it does, it returns array of friendship data
     */
    export async function findFriendships(user: string, friendshipID?: string): Promise<FriendshipsData[] | null | undefined> {
        let friendshipsData: FriendshipsData[] = [];
        try {
            let query: any;
            if (friendshipID) {
                query = { _id: friendshipID };
            } else {
                query = {
                    'username': user,
                };
            }
            const result = await localUserModel.find(query, { friendships: 1 });
            const firstElem = result[0];
            const friendshipsArray = firstElem.friendships;
            friendshipsArray.forEach(friendshipObj => {
                friendshipsData.push({
                    friendship_id: friendshipObj.friendship_id,
                    username: friendshipObj.username,
                    status: friendshipObj.status,
                });
            })
            return friendshipsData.length > 0 ? friendshipsData : null;
        } catch (err: any) {
            console.error(err);
            return undefined;
        }
    }

    type FriendshipsArray = {
        friendship_id: String,
        requester: String,
        receiver: String,
        status: Number,
        description: String,
    }

    /**
     * 
     * @param multiQuery: String[]
     * @returns array
     * 
     * Takes array of string as query and returns data,
     * returned data is sorted into array that is returned
     * to the function that called it
     */
    export async function findFriendshipsViaIDs(multiQuery: String[]): Promise<FriendshipsArray[] | null | undefined> {
        let friendshipsArray: FriendshipsArray[] = [];
        try {
            let query: any;
            query = {
                friendship_id: {
                    $in: multiQuery,
                }
            }
            let friendships = await friendshipModel.find(query);
            for (let i = 0; i < friendships.length; i++) {
                friendshipsArray.push({
                    friendship_id: friendships[i].friendship_id,
                    requester: friendships[i].requester.username,
                    receiver: friendships[i].receiver.username,
                    status: friendships[i].status,
                    description: friendships[i].description,
                })
            }
            return friendshipsArray.length > 0 ? friendshipsArray : null;
        } catch (err: any) {
            console.error(err);
            return undefined;
        }
    }

    type FriendshipObject = {
        friendship_id: String,
        requester: String,
        receiver: String,
    }

    export async function findAFriendshipViaRequester(requester: string, receiver: string): Promise<FriendshipObject[] | undefined> {
        let friendshipObject: FriendshipObject[] = [];
        try {
            let query: any;
            query = {
                'requester.username': requester,
                'receiver.username': receiver
            }
            let friendship = await friendshipModel.findOne(query);
            if (friendship) {
                friendshipObject.push({
                    friendship_id: friendship.friendship_id,
                    requester: friendship.requester.username,
                    receiver: friendship.receiver.username,
                })
            }
            return friendshipObject;
        } catch (err: any) {
            console.error(err);
            return undefined;
        }
    }

    /**
     * 
     * @param requester: string
     * @param receiver: string
     * @returns string
     * 
     * Function that writes a new object record of a friendship between 2 users and
     * sets it as Pending status (to be resolved depending if the users accepts or declines)
     */
    export async function requestFriend(requester: string, receiver: string): Promise<String | null | undefined> {
        let result = await findFriendships(requester);
        let friend;
        if (result) {
            for (let i = 0; i < result.length; i++) {
                friend = result[i].username;
            }
        }
        if ((!friend) || (friend !== receiver)) {
            try {
                let users = await localUserModel.find({
                    username:
                    {
                        $in: [requester, receiver]
                    }
                });
                if (users.length === 2) {
                    let id = crypto.randomUUID();
                    let user1;
                    let user2;
                    for (let i = 0; i < users.length; i++) {
                        if (users[i].username === requester) {
                            user1 = users[i];
                        } else if (users[i].username === receiver) {
                            user2 = users[i];
                        }
                    }
                    await friendshipModel.create({
                        friendship_id: id,
                        requester: {
                            _id: user1?._id,
                            username: user1?.username,
                            email: user1?.email,
                        },
                        receiver: {
                            _id: user2?._id,
                            username: user2?.username,
                            email: user2?.email,
                        },
                        status: 2,
                        description: "Pending",
                    });
                    await localUserModel.findOneAndUpdate({
                        username: requester,
                    },
                        {
                            $push: {
                                friendships: {
                                    friendship_id: id,
                                    status: 2,
                                    friend_id: user2?._id,
                                    username: user2?.username,
                                    added_at: Date.now(),
                                },
                            }
                        }
                    )
                    await localUserModel.findOneAndUpdate({
                        username: receiver,
                    },
                        {
                            $push: {
                                friendships: {
                                    friendship_id: id,
                                    status: 2,
                                    friend_id: user1?._id,
                                    username: user1?.username,
                                    added_at: Date.now(),
                                },
                            }
                        }
                    )
                    return receiver;
                }
            } catch (err: any) {
                console.log(err)
                return undefined;
            }
        }
    }

    /**
     * @param friendship: FriendshipObject[]
     * @returns: string
     * 
     * If a user doesn't accepts a request from a friend, 
     * the friendship placeholder that was recorded when friend
     * request was send is going to be deleted
     */
    export async function rejectFriend(friendship: FriendshipObject[] | undefined): Promise<string | null | undefined> {
        try {
            let friendshipID: any;
            let requester: any;
            let receiver: any;
            if (friendship) {
                for (let i = 0; i < friendship.length; i++) {
                    friendshipID = friendship[i].friendship_id;
                    requester = friendship[i].requester;
                    receiver = friendship[i].receiver;
                }

                const friendshipQuery = {
                    friendship_id: friendshipID,
                }
                await friendshipModel.deleteOne(friendshipQuery)

                const requesterQuery = {
                    username: requester,
                }
                const requesterQueryUpdate = {
                    $pull: {
                        friendships: {
                            username: receiver,
                        }
                    }
                }
                let requesterQueryResult = await localUserModel.updateOne(requesterQuery, requesterQueryUpdate)

                const receiverQuery = {
                    username: receiver,
                }
                const receiverQueryUpdate = {
                    $pull: {
                        friendships: {
                            username: requester,
                        }
                    }
                }
                let receiverQueryResult = await localUserModel.updateOne(receiverQuery, receiverQueryUpdate)

                if (requesterQueryResult.matchedCount === 1 && receiverQueryResult.matchedCount === 1) {
                    return requester;
                } else {
                    return null;
                }
            }
        }
        catch (err: any) {
            return undefined;
        }
    }

    /**
     * 
     * @param user_id: string
     * @param friendship_id: ObjectId (MongoDB Object)
     * @returns: boolean
     * 
     * Takes user ID and friendship ID and checks if given friendship already
     * exists in users friendship array
     */
    export async function checkIfFriendshipExists(user_id: String | undefined, friendship_id: String | undefined): Promise<boolean | null | undefined> {
        try {
            let user = await localUserModel.findOne({
                _id: user_id,
            })
            if (user !== null || undefined) {
                let userFriendshipsArray = user?.friendships;
                if (!userFriendshipsArray) return null;
                else {
                    for (let i = 0; i < userFriendshipsArray?.length; i++) {
                        let userFriendship = userFriendshipsArray[i].friendship_id;
                        if (userFriendship === friendship_id) return true;
                        else return false;
                    }
                }
            }
        } catch (err) {
            return undefined;
        }
    }

    /**
     * @param friendship: FriendshipObject[]
     * @returns: string
     * 
     * When a user clicks to accept a friend, function takes in user's friendshipID,
     * and changes its status to Accepted, while also adds a new record 
     * in user's friendship array adding that friend's ID
     */
    export async function acceptFriend(friendship: FriendshipObject[] | undefined): Promise<string | null | undefined> {
        try {
            let friendshipID: any;
            let requester: any;
            let receiver: any;
            if (friendship) {
                for (let i = 0; i < friendship.length; i++) {
                    friendshipID = friendship[i].friendship_id;
                    requester = friendship[i].requester;
                    receiver = friendship[i].receiver;
                }

                const friendshipQuery = {
                    friendship_id: friendshipID,
                }
                const friendshipQueryUpdate = {
                    $set: {
                        status: 1,
                        description: "Accepted",
                    }
                }
                let friendshipQueryResult = await friendshipModel.updateOne(friendshipQuery, friendshipQueryUpdate)

                const requesterQuery = {
                    username: requester,
                }
                const requesterQueryUpdate = {
                    $set: {
                        "friendships.$[elem].status": 1,
                    }
                }
                const requesterUpdateOptions = {
                    arrayFilters: [{ "elem.username": receiver }]
                };
                let requesterQueryResult = await localUserModel.updateOne(requesterQuery, requesterQueryUpdate, requesterUpdateOptions)

                const receiverQuery = { username: receiver, };
                const receiverQueryUpdate = {
                    $set: {
                        "friendships.$[elem].status": 1,
                    }
                };
                const receiverUpdateOptions = {
                    arrayFilters: [{ "elem.username": requester }]
                };
                let receiverQueryResult = await localUserModel.updateOne(receiverQuery, receiverQueryUpdate, receiverUpdateOptions);

                if (friendshipQueryResult.matchedCount === 1 && requesterQueryResult.matchedCount === 1 && receiverQueryResult.matchedCount === 1) {
                    return requester;
                } else {
                    return null;
                }
            }
        }
        catch (err: any) {
            return undefined;
        }
    }

    /**
     * @param friendship_id: string
     * @returns: boolean
     * 
     * When a users click on delete friends, function takes friendship ID and 
     * deletes friendship record as well as that friend's ID on both users
     */
    export async function deleteFriend(friendship_id: string): Promise<Boolean | undefined> {
        try {
            let friendshipID = await friendshipModel.findOne({
                _id: friendship_id,
            });
            if (friendshipID !== null || undefined) {
                let requesterID = friendshipID?.requester;
                let receiverID = friendshipID?.receiver;
                await friendshipModel.findOneAndDelete({
                    _id: friendshipID,
                })
                await localUserModel.updateOne({
                    _id: requesterID,
                },
                    {
                        $pull: {
                            friendships: receiverID,
                        }
                    },
                )
                await localUserModel.updateOne({
                    _id: receiverID,
                },
                    {
                        $pull: {
                            friendships: requesterID,
                        }
                    },
                )
                return true;
            } else {
                return false;
            }
        } catch (err: any) {
            return undefined;
        }
    }

    /**
     * 
     * @param username: string
     * @returns: Array<string>
     * 
     * Function that returns an array of friends from given username
     */
    export async function getAllFriends(username: string): Promise<Array<Object> | null | undefined> {
        try {
            let result = await localUserModel.findOne({
                username: username,
            });
            if (result) {
                let friendUsernames = result.friendships
                    .filter((friend) => friend.status === 1)
                    .map((friend) => friend.username);
                let friends = await localUserModel.find({
                    username: { $in: friendUsernames },
                })
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
                        })
                    }
                    return friendsArray.length > 0 ? friendsArray : null;
                } else {
                    return null;
                }
            } else {
                return null;
            }
        } catch (err) {
            console.error(err);
            return undefined;
        }
    }
}
