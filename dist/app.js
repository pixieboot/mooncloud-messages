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
require("dotenv/config");
require("ejs");
// import fs from "fs";
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_ejs_layouts_1 = __importDefault(require("express-ejs-layouts"));
const express_session_1 = __importDefault(require("express-session"));
const body_parser_1 = __importDefault(require("body-parser"));
const http_errors_1 = __importDefault(require("http-errors"));
const debug_1 = __importDefault(require("debug"));
const logger_js_1 = require("./logger.js");
const http_1 = __importDefault(require("http"));
const morgan_1 = __importDefault(require("morgan"));
const passport_1 = __importDefault(require("passport"));
const index_js_1 = __importDefault(require("./routes/index.js"));
require("./strategies/local.strategy.js");
require("./strategies/discord.strategy.js");
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const mongodb_database_js_1 = require("./database/mongodb.database.js");
// import mongoose from "mongoose";
const express_flash_1 = __importDefault(require("express-flash"));
const method_override_1 = __importDefault(require("method-override"));
// import "redis";
const socket_io_1 = require("socket.io");
require("socket.io-client");
// import { RedisClient } from "./database/redis.database";
const admin_ui_1 = require("@socket.io/admin-ui");
const sessions_schema_js_1 = require("./database/schemas/sessions.schema.js");
const local_user_schema_js_1 = require("./database/schemas/local_user.schema.js");
const chat_controller_js_1 = require("./controllers/chat.controller.js");
const friendship_controller_js_1 = require("./controllers/friendship.controller.js");
const local_users_controller_js_1 = require("./controllers/local_users.controller.js");
const app = (0, express_1.default)();
const db_uri = `mongodb://${process.env.MONGOUSER}:${process.env.MONGOPASSWORD}@${process.env.MONGOHOST}:27017`;
// Redis connection on app start
// RedisClient._connect();
// Ejs config
app.set("view engine", "ejs");
app.set("views", path_1.default.join(__dirname, "views"));
app.set("layout", "layouts/index");
app.use(express_ejs_layouts_1.default);
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, "/public")));
app.use("**/assets", express_1.default.static(path_1.default.join(__dirname, "/public/assets")));
app.use("**/utils", express_1.default.static(path_1.default.join(__dirname, "/public/utils")));
app.use((0, express_flash_1.default)());
app.use((0, method_override_1.default)("_method"));
app.use((0, morgan_1.default)("dev"));
// Try connecting the session store 
let sessionStore;
try {
    sessionStore = connect_mongo_1.default.create({ mongoUrl: `${db_uri}` });
    console.log("Session store created");
}
catch (err) {
    console.error("Error creating session store:", err);
}
// Session config
let expressSessionMiddleware = (0, express_session_1.default)({
    secret: `${process.env.SECRET_KEY}`,
    saveUninitialized: false,
    resave: false,
    store: sessionStore
});
console.log("expressSessionMiddleware variable set");
app.use(expressSessionMiddleware);
console.log("expressSessionMiddleware app use set");
// Passport config
app.use(passport_1.default.initialize());
console.log("passport initialized");
app.use(passport_1.default.session());
console.log("passport session set");
// Index routing
app.use("/", index_js_1.default);
console.log("index / routing set");
// 404 handler
app.use(function (req, res, next) {
    next((0, http_errors_1.default)(404));
});
console.log("404 handler set");
// Error handler
app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    res.status(err.status || 500);
    res.render("error");
});
console.log("error handler set");
// Start Server after db connection
mongodb_database_js_1.Database._connect().then(() => startServer()).catch((err) => {
    console.error("Failed to connect to DB:", err);
    process.exit(1);
});
// Start the server if db connection is established
function startServer() {
    const port = normalizePort(`${process.env.PORT}` || '3000');
    console.log("port set to:", port);
    const domain = '0.0.0.0';
    console.log("domain set to:", domain);
    // const admin_url = `${process.env.SOCKET_IO_ADMIN_URL}` || "";
    app.set("port", port);
    console.log("port set");
    console.log("Starting server setup…");
    const server = http_1.default.createServer(app);
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: ["*"],
            credentials: true
        },
    });
    console.log(`Server running on port ${domain}:${port}`);
    io.engine.use(expressSessionMiddleware);
    io.use((socket, next) => {
        expressSessionMiddleware(socket.request, {}, next);
    });
    (0, admin_ui_1.instrument)(io, { auth: false });
    io.use((socket) => __awaiter(this, void 0, void 0, function* () {
        logger_js_1.logger.info(`User connected: ${socket.id}`);
        const sessionID = socket.request.session.id;
        if (sessionID) {
            try {
                const result = yield sessions_schema_js_1.sessions.findOne({
                    _id: sessionID,
                });
                if (result) {
                    let session = result.session;
                    let parsedSession = JSON.parse(session) || "";
                    let userID = parsedSession.passport.user;
                    const user = yield local_user_schema_js_1.localUserModel.findOne({
                        _id: userID,
                    });
                    if (user) {
                        socket.data.sessionID = sessionID;
                        socket.data.userID = userID;
                        socket.data.username = user === null || user === void 0 ? void 0 : user.username;
                        return;
                    }
                    else
                        throw new Error("No user found during SocketIO session search");
                }
            }
            catch (err) {
                console.error("Socket session fetch error:", err);
                return;
            }
        }
        else
            throw new Error("No sessionID found");
        socket.on("disconnect", () => logger_js_1.logger.info(`User(${socket.id}) has disconnected`));
        socket.emit("session", {
            sessionID: socket.data.sessionID,
            userID: socket.data.userID,
            username: socket.data.username,
        });
        socket.on("load-user-data", (user) => __awaiter(this, void 0, void 0, function* () {
            try {
                let result = yield local_users_controller_js_1.LocalUsersController.getLocalUser(user);
                if (result) {
                    socket.emit("loaded-user-data", { result });
                }
            }
            catch (err) {
                console.error(err);
                return;
            }
        }));
        socket.on("send-private-message", (content, to, chatID) => __awaiter(this, void 0, void 0, function* () {
            try {
                let messageID = yield chat_controller_js_1.ChatController.sendMessage(socket.data.username, content, chatID);
                if (messageID) {
                    socket.to(to).to(socket.data.username).emit("receive-private-message", {
                        content,
                        from: socket.data.username,
                        to,
                        chatID,
                        messageID
                    });
                    socket.emit("message-sent", {
                        content,
                        chatID,
                        messageID
                    });
                }
            }
            catch (err) {
                throw new Error(err);
            }
        }));
        socket.join(socket.data.username);
        socket.on("disconnect", () => __awaiter(this, void 0, void 0, function* () {
            const matchingSockets = yield io.in(socket.data.userID).fetchSockets();
            const isDisconnected = matchingSockets.length === 0;
            if (isDisconnected) {
                socket.broadcast.emit("user-disconnected", socket.data.userID);
            }
        }));
        socket.on("friend-request", (user, target) => __awaiter(this, void 0, void 0, function* () {
            try {
                let result = yield friendship_controller_js_1.FriendshipController.requestFriend(user, target);
                if (result) {
                    socket.emit("is-friend-request-successful", { result });
                    socket.to(target).emit("new-friend-request", {
                        from: user,
                        to: target,
                    });
                }
            }
            catch (err) {
                console.error(err);
                return;
            }
        }));
        socket.on("check-friend-requests", (user) => __awaiter(this, void 0, void 0, function* () {
            try {
                let pendingFriendRequests;
                let result = yield friendship_controller_js_1.FriendshipController.findFriendships(user);
                if (result) {
                    let multiQueryFriendships = [];
                    for (let i = 0; i < result.length; i++) {
                        if (result[i].status === 2) {
                            multiQueryFriendships.push(result[i].friendship_id);
                        }
                    }
                    let multiFriendshipData = yield friendship_controller_js_1.FriendshipController.findFriendshipsViaIDs(multiQueryFriendships);
                    if (multiFriendshipData) {
                        let multiQueryUsers = [];
                        for (let i = 0; i < multiFriendshipData.length; i++) {
                            if (multiFriendshipData[i].receiver === user) {
                                multiQueryUsers.push(multiFriendshipData[i].requester);
                            }
                        }
                        pendingFriendRequests = yield local_users_controller_js_1.LocalUsersController.getLocalUser("", multiQueryUsers);
                    }
                    socket.emit("pending-friend-requests", { pendingFriendRequests });
                }
                else {
                    pendingFriendRequests = null;
                    socket.emit("pending-friend-requests", { pendingFriendRequests });
                }
            }
            catch (err) {
                console.error(err);
                return;
            }
        }));
        socket.on("accept-friend-request", (requester, receiver) => __awaiter(this, void 0, void 0, function* () {
            if (requester) {
                try {
                    let friendship = yield friendship_controller_js_1.FriendshipController.findAFriendshipViaRequester(requester, receiver);
                    if (friendship) {
                        let result = yield friendship_controller_js_1.FriendshipController.acceptFriend(friendship);
                        if (result) {
                            socket.to(requester).emit("is-friend-accepted", { result });
                            socket.emit("is-friend-accepted", { result });
                        }
                    }
                }
                catch (err) {
                    console.error(err);
                    return;
                }
            }
        }));
        socket.on("decline-friend-request", (requester, receiver) => __awaiter(this, void 0, void 0, function* () {
            if (requester) {
                try {
                    let friendship = yield friendship_controller_js_1.FriendshipController.findAFriendshipViaRequester(requester, receiver);
                    let result = yield friendship_controller_js_1.FriendshipController.rejectFriend(friendship);
                    socket.emit("is-friend-declined", { result });
                }
                catch (err) {
                    console.error(err);
                    return;
                }
            }
        }));
        socket.on("friend-list-refresh", (user) => __awaiter(this, void 0, void 0, function* () {
            if (user) {
                try {
                    let friends = yield friendship_controller_js_1.FriendshipController.getAllFriends(user);
                    if (friends) {
                        socket.emit("friend-list-update", { friends });
                    }
                    else {
                        socket.emit("friend-list-update", { friends });
                    }
                }
                catch (err) {
                    console.error(err);
                    return;
                }
            }
        }));
        socket.on("initiate-chat", (requesterUsername, receiverUsername) => __awaiter(this, void 0, void 0, function* () {
            try {
                let chatID = yield chat_controller_js_1.ChatController.checkIfChatExists(requesterUsername, receiverUsername);
                if (!chatID) {
                    let initiated = yield chat_controller_js_1.ChatController.initiateChat(requesterUsername, receiverUsername);
                    if (!initiated) {
                        return null;
                    }
                    ;
                }
                socket.emit("open-initiated-chat", { requesterUsername, receiverUsername });
            }
            catch (err) {
                console.error(err);
                return;
            }
        }));
        socket.on("request-single-chat-load", (chatID) => __awaiter(this, void 0, void 0, function* () {
            try {
                let chatData = yield chat_controller_js_1.ChatController.loadChat(chatID);
                if (chatData) {
                    socket.emit("single-chat-loaded-response", { chatData });
                }
                else
                    return null;
            }
            catch (err) {
                console.error(err);
                return;
            }
        }));
        socket.on("update-chat-list", (user, friend, request) => __awaiter(this, void 0, void 0, function* () {
            try {
                let chatsData = yield chat_controller_js_1.ChatController.findAllChatsOfAUser(user);
                if (chatsData) {
                    if (request === null) {
                        socket.emit("friend-chats-load", { chatsData, user, friend, request });
                    }
                    else {
                        socket.emit("friend-chats-load", { chatsData, user, friend, request });
                    }
                }
                else
                    return null;
            }
            catch (err) {
                console.error(err);
                return;
            }
        }));
        socket.on("search-input", (user, searchInput) => __awaiter(this, void 0, void 0, function* () {
            try {
                let usersResult = yield local_users_controller_js_1.LocalUsersController.getLocalUser(searchInput);
                let friendshipsResult = yield friendship_controller_js_1.FriendshipController.findFriendships(user);
                socket.emit("search-result", { usersResult, friendshipsResult });
            }
            catch (err) {
                console.error(err);
                return;
            }
        }));
        socket.on("old-password-change-input", (user, password, newPassword) => __awaiter(this, void 0, void 0, function* () {
            try {
                let isChanged;
                let result = yield local_users_controller_js_1.LocalUsersController.checkLocalUserPassword(user, password);
                if (result === true) {
                    isChanged = yield local_users_controller_js_1.LocalUsersController.changeLocalUserPassword(user, newPassword);
                }
                else
                    isChanged = false;
                socket.emit("is-password-changed", { isChanged });
            }
            catch (err) {
                console.error(err);
                return;
            }
        }));
        socket.on("update-user-profile", (user, newUsername, newEmail, newBio, newAvatar, newAvatarBase64Data) => __awaiter(this, void 0, void 0, function* () {
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
            }
            else {
                filteredOriginalAvatar = newAvatar;
            }
            let date = new Date().getTime();
            try {
                let userResult = yield local_users_controller_js_1.LocalUsersController.getLocalUser(user);
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
                }
                else {
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
                console.log(filteredUserResultAvatarName, filteredOriginalAvatar);
                if (filteredUserResultAvatarName === filteredOriginalAvatar) {
                    let result = yield local_users_controller_js_1.LocalUsersController.updateLocalUserInfo(user, newUsername, newEmail, newBio, userResultAvatarName);
                    if (result === true) {
                        if (newUsername) {
                            let updatedUser = yield local_users_controller_js_1.LocalUsersController.getLocalUser(newUsername);
                            socket.emit("refresh-user-profile", { updatedUser });
                        }
                        else {
                            let updatedUser = yield local_users_controller_js_1.LocalUsersController.getLocalUser(user);
                            socket.emit("refresh-user-profile", { updatedUser });
                        }
                    }
                }
                else {
                    let result = yield local_users_controller_js_1.LocalUsersController.updateLocalUserInfo(user, newUsername, newEmail, newBio, newAvatarName);
                    if (result === true) {
                        if (newUsername) {
                            let updatedUser = yield local_users_controller_js_1.LocalUsersController.getLocalUser(newUsername);
                            socket.emit("refresh-user-profile", { updatedUser });
                        }
                        else {
                            let updatedUser = yield local_users_controller_js_1.LocalUsersController.getLocalUser(user);
                            socket.emit("refresh-user-profile", { updatedUser });
                        }
                    }
                }
            }
            catch (err) {
                console.error(err);
                return;
            }
        }));
        socket.on("remove-account", (approval, user) => __awaiter(this, void 0, void 0, function* () {
            if (approval === true) {
                let result = yield local_users_controller_js_1.LocalUsersController.deleteLocalUser(user);
            }
        }));
    }));
    server.listen(port, domain, () => logger_js_1.logger.info("Server running on port: " + port));
    server.on("error", onError);
    server.on("listening", onListening);
    function normalizePort(val) {
        var port = parseInt(val, 10);
        return isNaN(port) ? val : port >= 0 ? port : false;
    }
    function onError(error) {
        if (error.syscall !== "listen")
            throw error;
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
        var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
        (0, debug_1.default)("node_app:server")("Listening on " + bind);
    }
}
;
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
    .on("SIGINT", mongodb_database_js_1.Database.gracefulExit)
    .on("SIGTERM", mongodb_database_js_1.Database.gracefulExit);
// process
//     .on("SIGINT", RedisClient.redisGracefulExit)
//     .on("SIGTERM", RedisClient.redisGracefulExit);
exports.default = app;
//# sourceMappingURL=app.js.map