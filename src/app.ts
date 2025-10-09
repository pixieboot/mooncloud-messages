import "dotenv/config";
import "ejs";
import fs from "fs";
import express, { Application, Request, Response, NextFunction } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import expressLayouts from "express-ejs-layouts";
import expressSession, { Session } from "express-session";
import bodyParser from "body-parser";
import createError from "http-errors";
import debugLib from "debug";
import { logger } from "./logger";
import http from "http";
import morgan from "morgan";
import passport, { session } from "passport";
import indexRouter from "./routes/index";
import "./strategies/local.strategy";
import "./strategies/discord.strategy";
import mongoStore from "connect-mongo";
import { Database } from "./database/mongodb.database";
import mongoose from "mongoose";
import flash from "express-flash";
import methodOverride from "method-override";
// import "redis";
import { Server } from "socket.io";
import "socket.io-client";
// import { RedisClient } from "./database/redis.database";
import { instrument } from "@socket.io/admin-ui";
import { sessions } from "./database/schemas/sessions.schema";
import { localUserModel } from "./database/schemas/local_user.schema";
import { ChatController } from "./controllers/chat.controller";
import { FriendshipController } from "./controllers/friendship.controller";
import { LocalUsersController } from "./controllers/local_users.controller";
const app: Application = express();

declare module "express-session" {
    interface SessionData {
        userId: string;
        username: string;
        email: string;
    }
}

declare module "http" {
    interface IncomingMessage {
        session: Session & {
            authenticated: boolean
        }
    }
}

// Initial db connection on app start
Database._connect();

// Redis connection on app start
// RedisClient._connect();

// Ejs config
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("layout", "layouts/index");

app.use(expressLayouts);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "/public")));
app.use("**/assets", express.static(path.join(__dirname, "/public/assets")));
app.use("**/utils", express.static(path.join(__dirname, "/public/utils")));

if (!`${process.env.SECRET_KEY}`) {
    console.error("env SECRET_KEY not defined");
    process.exit(1);
}
if (!`${process.env.MONGO_URI}`) {
    console.error("env MONGO_URI not defined");
    process.exit(1);
}
if (!`${process.env.MONGO_DB_NAME}`) {
    console.error("env MONGO_DB_NAME not defined");
    process.exit(1);
}

// Try connecting the session store 
let sessionStore;
try {
    sessionStore = mongoStore.create({ mongoUrl: `${process.env.MONGO_URI}` });
    console.log("Session store created");
} catch (err) {
    console.error("Error creating session store:", err);
}

// Session config
let expressSessionMiddleware = expressSession({
    secret: `${process.env.SECRET_KEY}`,
    saveUninitialized: false,
    resave: false,
    store: sessionStore
})

app.use(expressSessionMiddleware);

// Passport config
app.use(passport.initialize());
app.use(passport.session());

// Display messages during authentication responses
app.use(flash());

// Method override
app.use(methodOverride("_method"));

// Morgan HTTP logger
app.use(morgan("dev"));

// Index routing
app.use("/", indexRouter);

// 404 handler
app.use(function (req: Request, res: Response, next: NextFunction) {
    next(createError(404));
});

// Error handler
app.use(function (err: any, req: Request, res: Response, next: NextFunction) {
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};

    res.status(err.status || 500);
    res.render("error");
});

// Start Server after db connection
Database._connect().then(() => startServer()).catch((err) => {
    console.error("Failed to connect to DB:", err);
    process.exit(1);
});

// Start the server if db connection is established
function startServer() {

    const debug = debugLib("node_app:server");

    var port = normalizePort(`${process.env.PORT}` || '3000');
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
    app.set("port", port);

    var server = http.createServer(app);
    var domain = `${process.env.SERVER}` || '0.0.0.0';
    var admin_url = `${process.env.SOCKET_IO_ADMIN_URL}` || "";
    const io = new Server(server, {
        cors: {
            origin: [domain, admin_url],
            credentials: true
        },
    });

    io.engine.use(expressSessionMiddleware);

    io.use((socket, next) => {
        expressSessionMiddleware(socket.request as Request, {} as Response, next as NextFunction);
    });

    instrument(io, { auth: false });

    io.use(async (socket, next) => {
        logger.info(`User connected: ${socket.id}`);
        const sessionID = socket.request.session.id;
        if (sessionID) {
            try {
                const result = await sessions.findOne({
                    _id: sessionID,
                })
                if (result) {
                    let session = result.session;
                    let parsedSession = JSON.parse(session) || "";
                    let userID = parsedSession.passport.user;
                    const user = await localUserModel.findOne({
                        _id: userID,
                    })
                    if (user) {
                        socket.data.sessionID = sessionID;
                        socket.data.userID = userID;
                        socket.data.username = user?.username;
                        return next();
                    }
                    else throw new Error("No user found during SocketIO session search");
                }
            } catch (err: any) {
                console.error("Socket session fetch error:", err);
                return undefined;
            }
        } else throw new Error("No sessionID found");
    })

    io.on("connection", (socket) => {
        logger.info(`A user(${socket.id}) has connected`);
        socket.on("disconnect", () =>
            logger.info(`User(${socket.id}) has disconnected`)
        );
    });

    io.on("connection", (socket) => {
        socket.emit("session", {
            sessionID: socket.data.sessionID,
            userID: socket.data.userID,
            username: socket.data.username,
        })
    })

    io.on("connection", (socket) => {
        socket.on("load-user-data", async (user) => {
            try {
                let result = await LocalUsersController.getLocalUser(user);
                if (result) {
                    socket.emit("loaded-user-data", { result });
                }
            } catch (err: any) {
                console.error(err);
                return undefined;
            }
        })
    })

    io.on("connection", (socket) => {
        socket.on("send-private-message", async (content, to, chatID) => {
            try {
                let messageID = await ChatController.sendMessage(socket.data.username, content, chatID);
                if (messageID) {
                    socket.to(to).to(socket.data.username).emit("receive-private-message", {
                        content,
                        from: socket.data.username,
                        to,
                        chatID,
                        messageID
                    })
                    socket.emit("message-sent", {
                        content,
                        chatID,
                        messageID
                    })
                }
            } catch (err: any) {
                throw new Error(err);
            }
        })
    })

    io.on("connection", (socket) => {
        socket.join(socket.data.username);
    })

    io.on("connection", (socket) => {
        socket.on("disconnect", async () => {
            const matchingSockets = await io.in(socket.data.userID).fetchSockets();
            const isDisconnected = matchingSockets.length === 0;
            if (isDisconnected) {
                socket.broadcast.emit("user-disconnected", socket.data.userID);
            }
        })
    })

    io.on("connection", (socket) => {
        socket.on("friend-request", async (user, target) => {
            try {
                let result = await FriendshipController.requestFriend(user, target);
                if (result) {
                    socket.emit("is-friend-request-successful", { result });
                    socket.to(target).emit("new-friend-request", {
                        from: user,
                        to: target,
                    })
                }
            } catch (err: any) {
                console.error(err);
                return undefined;
            }
        })
    })

    io.on("connection", (socket) => {
        socket.on("check-friend-requests", async (user) => {
            try {
                let pendingFriendRequests;
                let result = await FriendshipController.findFriendships(user);
                if (result) {
                    let multiQueryFriendships = [];
                    for (let i = 0; i < result.length; i++) {
                        if (result[i].status === 2) {
                            multiQueryFriendships.push(result[i].friendship_id);
                        }
                    }
                    let multiFriendshipData = await FriendshipController.findFriendshipsViaIDs(multiQueryFriendships);
                    if (multiFriendshipData) {
                        let multiQueryUsers = [];
                        for (let i = 0; i < multiFriendshipData.length; i++) {
                            if (multiFriendshipData[i].receiver === user) {
                                multiQueryUsers.push(multiFriendshipData[i].requester);
                            }
                        }
                        pendingFriendRequests = await LocalUsersController.getLocalUser("", multiQueryUsers);
                    }
                    socket.emit("pending-friend-requests", { pendingFriendRequests });
                } else {
                    pendingFriendRequests = null;
                    socket.emit("pending-friend-requests", { pendingFriendRequests });
                }
            } catch (err: any) {
                console.error(err);
                return undefined;
            }
        })
    })

    io.on("connection", async (socket) => {
        socket.on("accept-friend-request", async (requester, receiver) => {
            if (requester) {
                try {
                    let friendship = await FriendshipController.findAFriendshipViaRequester(requester, receiver);
                    if (friendship) {
                        let result = await FriendshipController.acceptFriend(friendship);
                        if (result) {
                            socket.to(requester).emit("is-friend-accepted", { result });
                            socket.emit("is-friend-accepted", { result });
                        }
                    }
                } catch (err: any) {
                    console.error(err);
                    return undefined;
                }
            }
        })
    })

    io.on("connection", async (socket) => {
        socket.on("decline-friend-request", async (requester, receiver) => {
            if (requester) {
                try {
                    let friendship = await FriendshipController.findAFriendshipViaRequester(requester, receiver);
                    let result = await FriendshipController.rejectFriend(friendship);
                    socket.emit("is-friend-declined", { result });
                } catch (err: any) {
                    console.error(err);
                    return undefined;
                }
            }
        })
    })

    io.on("connection", async (socket) => {
        socket.on("friend-list-refresh", async (user) => {
            if (user) {
                try {
                    let friends = await FriendshipController.getAllFriends(user);
                    if (friends) {
                        socket.emit("friend-list-update", { friends });
                    } else {
                        socket.emit("friend-list-update", { friends });
                    }
                } catch (err: any) {
                    console.error(err);
                    return undefined;
                }
            }
        })
    })

    io.on("connection", (socket) => {
        socket.on("initiate-chat", async (requesterUsername, receiverUsername) => {
            try {
                let chatID = await ChatController.checkIfChatExists(requesterUsername, receiverUsername);
                if (!chatID) {
                    let initiated = await ChatController.initiateChat(requesterUsername, receiverUsername);
                    if (!initiated) {
                        return null;
                    };
                }
                socket.emit("open-initiated-chat", { requesterUsername, receiverUsername });
            } catch (err) {
                console.error(err);
                return undefined;
            }
        }
        )
    })

    io.on("connection", (socket) => {
        socket.on("request-single-chat-load", async (chatID) => {
            try {
                let chatData = await ChatController.loadChat(chatID);
                if (chatData) {
                    socket.emit("single-chat-loaded-response", { chatData })
                } else return null;
            }
            catch (err: any) {
                console.error(err);
                return undefined;
            }
        })
    })

    io.on("connection", async (socket) => {
        socket.on("update-chat-list", async (user, friend, request) => {
            try {
                let chatsData = await ChatController.findAllChatsOfAUser(user);
                if (chatsData) {
                    if (request === null) {
                        socket.emit("friend-chats-load", { chatsData, user, friend, request })
                    } else {
                        socket.emit("friend-chats-load", { chatsData, user, friend, request })
                    }
                } else return null;
            } catch (err: any) {
                console.error(err);
                return undefined;
            }
        })
    })

    io.on("connection", (socket) => {
        socket.on("search-input", async (user, searchInput) => {
            try {
                let usersResult = await LocalUsersController.getLocalUser(searchInput);
                let friendshipsResult = await FriendshipController.findFriendships(user);
                socket.emit("search-result", { usersResult, friendshipsResult });
            } catch (err: any) {
                console.error(err);
                return undefined;
            }
        });
    });

    io.on("connection", (socket) => {
        socket.on("old-password-change-input", async (user, password, newPassword) => {
            try {
                let isChanged;
                let result = await LocalUsersController.checkLocalUserPassword(user, password);
                if (result === true) {
                    isChanged = await LocalUsersController.changeLocalUserPassword(user, newPassword);
                } else isChanged = false;
                socket.emit("is-password-changed", { isChanged });
            } catch (err: any) {
                console.error(err);
                return undefined;
            }
        })
    })

    io.on("connection", (socket) => {
        socket.on("update-user-profile", async (user, newUsername, newEmail, newBio, newAvatar, newAvatarBase64Data) => {
            let filteredOriginalAvatar;
            let newAvatarName;
            let filteredUserResultAvatarName;
            let userResultAvatarName;
            let defaultAvatarRegex = /.*\/default\/default_user_avatar.jpg/;
            let newAvatarRegex = /(.*)uploads\/(.*)/;
            let defaultAvatarMatch = newAvatar.match(defaultAvatarRegex);
            let newAvatarMatch = newAvatar.match(newAvatarRegex);
            if (newAvatar.indexOf("--") !== -1) {
                filteredOriginalAvatar = newAvatar.split("--")[1];
            } else {
                filteredOriginalAvatar = newAvatar;
            }
            let date = new Date().getTime();
            try {
                let userResult = await LocalUsersController.getLocalUser(user);
                if (userResult) {
                    for (let i = 0; i < userResult.length; i++) {
                        userResultAvatarName = userResult[i].avatar.toString();
                        filteredUserResultAvatarName = userResultAvatarName.split("--")[1];
                    }
                }
                if (defaultAvatarMatch) {
                    newAvatarName = "default_user_avatar.jpg";
                }
                else if (newAvatarMatch) {
                    newAvatarName = date + "--" + newAvatarMatch[2];
                } else {
                    newAvatarName = date + "--" + newAvatar;
                }
                // if (newAvatarBase64Data) {
                //     const avatarBuffer = Buffer.from(newAvatarBase64Data, 'base64');
                //     const filePath = path.join(__dirname, "./public/assets/users/uploads/");
                //     fs.writeFile(filePath + newAvatarName, avatarBuffer, (err) => {
                //         if (err) {
                //             console.error("Error saving the image:", err);
                //         }
                //     })
                // }
                console.log(filteredUserResultAvatarName, filteredOriginalAvatar)
                if (filteredUserResultAvatarName === filteredOriginalAvatar) {
                    let result = await LocalUsersController.updateLocalUserInfo(user, newUsername, newEmail, newBio, userResultAvatarName);
                    if (result === true) {
                        if (newUsername) {
                            let updatedUser = await LocalUsersController.getLocalUser(newUsername)
                            socket.emit("refresh-user-profile", { updatedUser })
                        } else {
                            let updatedUser = await LocalUsersController.getLocalUser(user)
                            socket.emit("refresh-user-profile", { updatedUser })
                        }
                    }
                } else {
                    let result = await LocalUsersController.updateLocalUserInfo(user, newUsername, newEmail, newBio, newAvatarName);
                    if (result === true) {
                        if (newUsername) {
                            let updatedUser = await LocalUsersController.getLocalUser(newUsername)
                            socket.emit("refresh-user-profile", { updatedUser })
                        } else {
                            let updatedUser = await LocalUsersController.getLocalUser(user)
                            socket.emit("refresh-user-profile", { updatedUser })
                        }
                    }
                }
            } catch (err: any) {
                console.error(err);
                return undefined;
            }
        })
    })

    io.on("connection", (socket) => {
        socket.on("remove-account", async (approval, user) => {
            if (approval === true) {
                let result = await LocalUsersController.deleteLocalUser(user);
            }
        })
    })

    server.listen(port, domain, () => logger.info("Server running on port: " + port));
    server.on("error", onError);
    server.on("listening", onListening);

    function normalizePort(val: any) {
        var port = parseInt(val, 10);
        return isNaN(port) ? val : port >= 0 ? port : false
    }

    function onError(error: any) {
        if (error.syscall !== "listen") throw error;

        var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

        switch (error.code) {
            case "EACCES":
                console.error(bind + " requires elevated privileges");
                process.exit(1);
            case "EADDRINUSE":
                console.error(bind + " is already in use");
                process.exit(1);
            default:
                throw error;
        }
    }

    function onListening() {
        var addr = server.address();
        var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr!.port;
        debugLib("node_app:server")("Listening on " + bind);
    }

};

// Global error catchers
process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at Promise', p, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception thrown', err);
    process.exit(1);
});

// Close all connections if the app is exited
process
    .on("SIGINT", Database.gracefulExit)
    .on("SIGTERM", Database.gracefulExit);

// process
//     .on("SIGINT", RedisClient.redisGracefulExit)
//     .on("SIGTERM", RedisClient.redisGracefulExit);

export default app;
