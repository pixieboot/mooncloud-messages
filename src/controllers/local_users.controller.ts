import { friendshipModel } from "../database/schemas/friendship.schema.js";
import { localUserModel } from "../database/schemas/local_user.schema.js";
import { chatModel } from "../database/schemas/chat.schema.js";
import { Bcrypt } from "../public/utils/bcrypt.util.js";
export namespace LocalUsersController {
    /**
     * @param username: string
     * @returns string
     * 
     * Function takes an username and returns userID that is converted
     * from MongoDB's ObjectId to String
     */
    export async function findUserIdViaUsername(username: string): Promise<string | boolean | undefined> {
        try {
            let result = await localUserModel.findOne({
                username: username,
            })
            let userID = result?._id.toString();
            if (userID !== undefined) {
                return userID;
            } else {
                return false;
            }
        } catch (err: any) {
            return undefined;
        }
    }

    /**
     * @returns array of user objects
     * 
     * Calling this function returns an array of objects of all local users
     */
    export async function getAllLocalUsers(): Promise<Array<Object> | null | undefined> {
        try {
            let result = await localUserModel.find().exec();
            if (!result) {
                return null;
            }
            return result;
        } catch (err: any) {
            return undefined;
        }
    }

    type UserArray = {
        username: String,
        avatar: String,
        defaultAvatar: String,
    }

    /**
     * @param regexQuery: string, 
     * @param multiQuery?: String[]
     * @returns array
     * 
     * Takes a string argument or multiple strings in an array,
     * and returns array of user objects
     */
    export async function getLocalUser(regexQuery: string, multiQuery?: String[]): Promise<UserArray[] | null | undefined> {
        let usersData = [];
        let query: any;
        try {
            if (multiQuery) {
                query = {
                    username: {
                        $in: multiQuery,
                    }
                }
            }
            if (regexQuery) {
                query = {
                    username: {
                        $regex: regexQuery,
                    },
                }
            }
            let users = await localUserModel.find(query);
            for (let i = 0; i < users.length; i++) {
                usersData.push({
                    username: users[i].username,
                    avatar: users[i].avatar,
                    defaultAvatar: users[i].defaultAvatar,
                    email: users[i].email,
                    userID: users[i].userID,
                    description: users[i].description,
                })
            }
            return usersData.length > 0 ? usersData : null;
        } catch (err: any) {
            return undefined;
        }
    }

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
    export async function createLocalUser(
        userID: string,
        username: string,
        email: string,
        password: string,
        avatar: string,
        rank: number,
        status: string
    ): Promise<void | null> {
        try {
            await localUserModel.create({
                userID,
                username,
                email,
                password,
                avatar,
                rank,
                status,
            });
        } catch (err: any) {
            return null;
        }
    }

    /**
     * @param email: string
     * @param username: string
     * @param avatar: string
     * @returns void
     * 
     * Function for changing and updating user info
     */
    export async function updateLocalUser(
        email: string,
        username?: string | undefined,
        avatar?: string | undefined
    ): Promise<void | null> {
        try {
            await localUserModel.findOneAndUpdate(
                { email: email },
                {
                    $set: {
                        email: email,
                        username: username,
                        avatar: avatar,
                    },
                }
            );
        } catch (err: any) {
            return null;
        }
    }

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
    export async function updateLocalUserInfo(user: string, username: string, email: string, description: string, avatar: string | undefined): Promise<boolean | null | undefined> {
        console.log(avatar)
        try {
            let filterQuery = { username: user };

            let updateFields: { [key: string]: any } = { username, email, description, avatar };

            for (let [key, value] of Object.entries(updateFields)) {
                if (value !== null && value !== undefined && value !== "") {
                    updateFields[key] = value;
                } else {
                    delete updateFields[key];
                }
            }

            if (Object.keys(updateFields).length > 0) {
                let updateQuery = {
                    $set: updateFields,
                }

                let result = await localUserModel.updateOne(filterQuery, updateQuery);
                console.log(result)
                if (result) {
                    console.log(`${result.matchedCount} document(s) matched the filter criteria.`);
                    console.log(`${result.modifiedCount} document(s) was/were updated.`);
                } else return null;
            };

            if (username) {
                let userResult = await localUserModel.findOne({
                    $or: [
                        { username: username },
                        { username: user }
                    ]
                })
                if (userResult) {
                    for (let i = 0; i < userResult.friendships.length; i++) {
                        let friendUsername = userResult.friendships[i].username;
                        let friend = await localUserModel.findOne({
                            username: friendUsername,
                        })
                        if (friend) {
                            for (let i = 0; i < friend.friendships.length; i++) {
                                if (userResult.username === username) {
                                    await localUserModel.updateOne(
                                        { 'friendships.username': user },
                                        { $set: { 'friendships.$.username': username } }
                                    )

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

                                    await friendshipModel.updateMany(friendshipQuery, friendshipUpdate)

                                    let chatQuery = {
                                        "members.username": user,
                                    };

                                    let chatUpdate = {
                                        $set: {
                                            "members.$.username": username,
                                        },
                                    };

                                    await chatModel.updateMany(chatQuery, chatUpdate);

                                    let messageQuery = {
                                        "messages.username": user,
                                    }

                                    let messagesUpdate = {
                                        $set: {
                                            "messages.$.username": username,
                                        },
                                    }

                                    await chatModel.updateMany(messageQuery, messagesUpdate);
                                }
                            }
                        }
                    }
                }
            }

            if (email) {
                let userResult = await localUserModel.findOne({
                    $or: [
                        { username: username },
                        { username: user }
                    ]
                })
                if (userResult) {
                    let userResultEmail = userResult.email;

                    if (username) {
                        const documentToUpdate = await friendshipModel.findOne({
                            $or: [
                                { "requester.username": username },
                                { "receiver.username": username }
                            ]
                        });

                        // Determine whether to update requester.email or receiver.email based on the found document
                        let updateField;
                        if (documentToUpdate && documentToUpdate.requester && documentToUpdate.requester.username === username) {
                            updateField = "requester.email";
                        } else if (documentToUpdate && documentToUpdate.receiver && documentToUpdate.receiver.username === username) {
                            updateField = "receiver.email";
                        }

                        // Update the email address
                        if (updateField && documentToUpdate) {
                            const result = await friendshipModel.updateOne(
                                { _id: documentToUpdate._id },
                                { $set: { [updateField]: email } }
                            );
                        }
                    } else {
                        const documentToUpdate = await friendshipModel.findOne({
                            $or: [
                                { "requester.username": user },
                                { "receiver.username": user }
                            ]
                        });

                        // Determine whether to update requester.email or receiver.email based on the found document
                        let updateField;
                        if (documentToUpdate && documentToUpdate.requester && documentToUpdate.requester.username === user) {
                            updateField = "requester.email";
                        } else if (documentToUpdate && documentToUpdate.receiver && documentToUpdate.receiver.username === user) {
                            updateField = "receiver.email";
                        }

                        // Update the email address
                        if (updateField && documentToUpdate) {
                            const result = await friendshipModel.updateOne(
                                { _id: documentToUpdate._id },
                                { $set: { [updateField]: email } }
                            );
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

                    await chatModel.updateMany(chatQuery, chatUpdate);
                }
            }
        }
        catch (err: any) {
            return null;
        }
    }

    /**
     * @param username: string
     * @returns void
     * 
     * Function for removing an user from db
     */
    export async function deleteLocalUser(username: string): Promise<boolean | null | undefined> {
        try {
            let userResult = await localUserModel.findOne({
                username: username,
            }) 
            await localUserModel.updateOne(
                { 'username': username },
                { $set: { 'friendships.$[].status': 3 } }
            )
            if (userResult) {
                for (let i = 0; i < userResult.friendships.length; i++) {
                    let friendUsername = userResult.friendships[i].username;
                    let friend = await localUserModel.findOne({
                        username: friendUsername,
                    })
                    if (friend) {
                        for (let i = 0; i < friend.friendships.length; i++) {
                            if (userResult.username === username) {
                                await localUserModel.updateOne(
                                    { 'friendships.username': username },
                                    { $set: { 'friendships.$.status': 3 } }
                                )

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

                                await friendshipModel.updateMany(friendshipQuery, friendshipUpdate)

                                let chatQuery = {
                                    "members.username": username,
                                };

                                await chatModel.deleteMany(chatQuery);
                            }
                        }
                    }
                }
                let deleteUserQuery = { username: username }
                let setDeleteStatus = {
                    $set: { status: "deleted" }
                }
                await localUserModel.updateOne(deleteUserQuery, setDeleteStatus);
            }
            return true;
        } catch (err: any) {
            console.error(err);
            return null;
        }
    }

    /**
     * @param user: string
     * @param password: string
     * @returns boolean
     * 
     * Function for checking passwords
     */
    export async function checkLocalUserPassword(user: string, password: string): Promise<boolean | null | undefined> {
        try {
            let result = await localUserModel.findOne({ username: user });
            if (result) {
                let isMatch = Bcrypt.comparePasswords(password, result.password);
                return isMatch;
            } return null;
        } catch (err: any) {
            console.error(err);
            return undefined;
        }
    }

    /**
     * @param user: string
     * @param newPassword: string
     * @returns boolean
     * 
     * Hashes and updates new password
     */
    export async function changeLocalUserPassword(user: string, newPassword: string): Promise<boolean | null | undefined> {
        try {
            let newHashedPassword = Bcrypt.hashedPassword(newPassword);
            let userQuery = {
                username: user,
            }
            let newPasswordQuery = {
                $set: {
                    password: newHashedPassword,
                }
            }
            let result = await localUserModel.updateOne(userQuery, newPasswordQuery)
            if (result?.matchedCount === 1) {
                return true;
            } else return false;
        } catch (err: any) {
            console.error(err);
            return undefined;
        }
    }
}
