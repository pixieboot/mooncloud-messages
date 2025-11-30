# Mooncloud Instant Messages Website
Project hosted [here](https://mooncloud-messages.up.railway.app/)

## Personal project
Written mainly in TypeScript, vanilla JavaScript and NodeJS as its (server) framework, with EJS template, CSS styling, Socket.io library for server-browser communications and MongoDB as database, is a project I’ve engaged to dive deeper into the JavaScript world. The reason for picking NodeJS instead of any other sophisticated JS-like framework is because I wanted to create a website app that’s written in vanilla JS / TS to understand it’s core functionality and workflow before getting my hands on other frameworks that wraps and covers all of the JS basics and functionalities underneath. As for the project’s theme, I was interested in how instant messaging (chatting) works and is transmitted, as well as adding / removing friends, getting notifications, user settings and other similar miscellaneous things similar to my previous PHP project.

## Tech
- [HTML & CSS] - markup and styling language
- [JavaScript & TypeScript] - programming language
- [Node.js] - evented I/O for the backend
- [Express] - fast node.js network app framework
- [EJS] - embedded JS template
- [.sh] - shell
- [socket.io] - library package
- [MongoDB Atlas] - database
- [Bootstrap] - css framework
- [Bootswatch - Vapor theme] - css theme for bootstrap

## Live testing on site
If you want to check out the site and test things, simply make a new profile or you can use on of these already made users:
| username | email | password | 
| -------- | ----- | -------- |
| Jane | jane@mail.com | Jane123! |
| John | john@mail.com | John123! |

> Be aware that given user credentials above might've been changed by someone during testing and they no longer apply as they were written here

## Local setup
You will need to make an .env file in the root folder where you'll clone this repo

Since this project is using MongoDB, you will also need to insert your own server and db credentials to the .env file

## Necessary environmental variables

| key | value |
| --- | ----- |
| SERVER= | "Your server (example: http://0.0.0.0/)" |
| MONGO_URI= | "Your Mongo URI (this example is from Atlas MongoDB: mongodb+srv://username:password@yourCluster.yhbh4de.mongodb.net/mooncloud)" |
| MONGO_DB_NAME= | "Your DB name" |
| SECRET_KEY= | "Your secret key from express session" |

Clone repo with SSH (or any other you want):
```sh 
git clone git@github.com:astral-express/mooncloud-messages.git
```

Npm install:
```sh
npm install
```

Npm run start:
```sh
npm run start
```

## Known bugs
- When user adds another user and initiates a chat, the other user doesn't get a chat section popout, page needs to be manually refreshed
- Message notification counter doesn't work as intended
- Notifications info about empty list pops out when there are multiple requests after a user is accepted as a friend
- Removed users might still be disaplyed in friend list

## Future ideas and plans
- Integration of forgot password system
- Email verification via mail providers with digit codes
- Additional features for friend lists and chat options
- Notification sounds and message sounds that can be muted
- Online activity (user is online, offline, away, last seen online)
- Adding friends to favorites
