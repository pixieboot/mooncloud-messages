import {
  friendListTabRefresh,
  chatTabRefresh,
  notificationsTabRefresh,
} from "./empty_tabs_controller.html.js";
import { checkIfItsAlphabeticalOrNumeralChar } from "./char_checker.html.js";
import { avatarValidation } from "./avatar_validation.html.js";

// DOM Selectors
const pillsNavbar = document.querySelectorAll("ul#pills-tab > li.nav-item");

const chatTabContent = document.getElementById("chat_tab_content");
const chatListGroup = document.getElementById("chat_list_group");

const socket = io();

// Variables
const chatIdMap = new Map();
const pillsNavbarMap = new Map();
let selectedChat;
let activePill;
let messageCounter = 0;
let messageNavbarCounter = 0;
let currentURL = window.location.pathname;
let imageBase64Data;
let sessionID;

function created() {
  sessionID = localStorage.getItem("sessionID");
  if (sessionID) {
    socket.auth = { sessionID };
    socket.connect();
  }
}

created();

// Sockets
socket.on("connect_error", (err) => {
  if (err.message === "Invalid user") {
    new Error("Unauthorized access");
  }
});

socket.on("session", ({ sessionID, userID, username }) => {
  let request = null;
  let friend = null;
  socket.auth = sessionID;
  localStorage.setItem("sessionID", sessionID);
  socket.userID = userID;
  socket.username = username;
  checkIfItsHomePage(username);
  socket.emit("friend-list-refresh", username);
  socket.emit("update-chat-list", username, friend, request);
  socket.emit("check-friend-requests", username);
  socket.emit("load-user-data", username);
});

socket.on("message-sent", ({ content, chatID, messageID }) => {
  appendSentMessage(content, chatID, messageID);
});

socket.on(
  "receive-private-message",
  ({ content, from, to, chatID, messageID }) => {
    appendReceivedMessage(content, from, chatID, messageID);
    messageNotificationBadgeTrigger(chatID);
  }
);

socket.on("friend-chats-load", ({ chatsData, user, friend, request }) => {
  chatsListLoad(chatsData, user, friend, request);
});

socket.on("friend-list-update", ({ friends }) => {
  updateFriendList(friends);
});

socket.on("single-chat-loaded-response", ({ chatData }) => {
  chatMessagesLoad(chatData);
});

socket.on("new-friend-request", ({ from, to }) => {
  socket.emit("check-friend-requests", to);
});

socket.on("pending-friend-requests", ({ pendingFriendRequests }) => {
  notificationsController(pendingFriendRequests);
});

socket.on("is-friend-declined", ({ result }) => {
  removeNotification(result);
});

socket.on("is-friend-accepted", ({ result }) => {
  socket.emit("friend-list-refresh", socket.username);
  removeNotification(result);
});

socket.on("open-initiated-chat", ({ requesterUsername, receiverUsername }) => {
  updateChatList(requesterUsername, receiverUsername);
});

socket.on("loaded-user-data", ({ result }) => {
  loadUserSettingsData(result);
});

socket.on("is-password-changed", ({ isChanged }) => {
  oldPasswordFeedback(isChanged);
});

socket.on("refresh-user-profile", ({ updatedUser }) => {
  loadUserSettingsData(updatedUser);
});

/**
 *
 * @param {String} username
 *
 * Gets username from URL and checks if it's /user/username or home page
 */
function checkIfItsHomePage(username) {
  if (currentURL === `/user/${username}`) {
    for (let i = 0; i < pillsNavbar.length; i++) {
      pillsNavbarMap.set(pillsNavbar[i].childNodes[1].id, { active: false });
      pillsNavbar[i].addEventListener("click", (e) => {
        activePill = e.target.id;
        pillsNavbarMap.forEach(currentActivePill);
      });
    }
  }
}

/**
 *
 * @param {Object} value
 * @param {String} key
 *
 * Checks which navbar pill is currently active by setting its value to true and the rest is false
 */
function currentActivePill(value, key) {
  if (activePill === key) {
    if (value.active === false) {
      pillsNavbarMap.set(key, { active: true });
    }
  } else {
    pillsNavbarMap.set(key, { active: false });
  }
}

/**
 *
 * @param {Object} value
 * @param {String} key
 *
 * Checks if current chat is active (if user has focus on it)
 */
function isChatActive(value, key) {
  if (selectedChat === key) {
    if (value.active === false) {
      chatIdMap.set(key, { active: true });
    }
  } else {
    chatIdMap.set(key, { active: false });
  }
}

// a bug with message calculation might occur for multiple messages received at the same time
function removeMessageNotificationBadgeFromFriendList(chatID) {
  const friendListRowSpan = document.querySelectorAll(
    "span#friend_list_row_message_notification_badge"
  );
  const navMessagesTabSpan = document.getElementById(
    "nav_message_notification_badge"
  );
  for (let i = 0; i < friendListRowSpan.length; i++) {
    let ariaChatID = friendListRowSpan[i].getAttribute("chat");
    if (ariaChatID === chatID) {
      messageCounter = 0;
      messageNavbarCounter = 0;
      friendListRowSpan[i].remove();
      if (navMessagesTabSpan !== null) {
        navMessagesTabSpan.remove();
      } else return;
    }
  }
}

function appendMessageNotificationBadgeOnNavbar() {
  const navMessagesTabSpan = document.getElementById(
    "nav_message_notification_badge"
  );
  let messagesTabs = document.getElementById("pills-messages-tab");
  if (navMessagesTabSpan !== null) {
    if (messageNavbarCounter === 0) {
      navMessagesTabSpan.style.display = "none";
    } else {
      navMessagesTabSpan.style.display = "inline";
      navMessagesTabSpan.textContent = messageNavbarCounter;
    }
  } else {
    const navNotificationBadge = document.createElement("span");
    navNotificationBadge.setAttribute("id", "nav_message_notification_badge");
    navNotificationBadge.classList.add(
      "badge",
      "text-bg-danger",
      "rounded-pill",
      "ms-auto"
    );
    messagesTabs.append(navNotificationBadge);
    if (messageNavbarCounter >= 99) {
      messageNavbarCounter = 99 + "+";
      navNotificationBadge.textContent = messageNavbarCounter;
    }
  }
}

function appendMessageNotificationBadgeOnFriendList(chatID, placeholder) {
  const friendListRowSpan = document.querySelectorAll(
    "span#friend_list_row_message_notification_badge"
  );
  if (friendListRowSpan.length === 0) {
    const notificationBadge = document.createElement("span");
    notificationBadge.setAttribute(
      "id",
      "friend_list_row_message_notification_badge"
    );
    notificationBadge.setAttribute("chat", `${chatID}`);
    notificationBadge.classList.add(
      "badge",
      "text-bg-danger",
      "rounded-pill",
      "ms-auto"
    );
    const placeholderChild = placeholder.querySelector("div.d-flex");
    placeholderChild.append(notificationBadge);
    notificationBadge.textContent = messageCounter;
  } else {
    for (let i = 0; i < friendListRowSpan.length; i++) {
      let ariaChatID = friendListRowSpan[i].getAttribute("chat");
      let notificationBadge = friendListRowSpan[i];
      if (ariaChatID === chatID) {
        if (messageCounter >= 99) {
          messageCounter = 99 + "+";
          notificationBadge.textContent = messageCounter;
        } else {
          notificationBadge.textContent = messageCounter;
        }
      }
    }
  }
}

function messageNotificationBadgeTrigger(chatID) {
  let chats = document.querySelectorAll("div#friend_list_row.list-group-item");
  for (let i = 0; i < chats.length; i++) {
    let ariaChatID = chats[i].getAttribute("chat");
    let selected = chatIdMap.get(chatID);
    if (selected) {
      if (selected.active === false) {
        if (ariaChatID === chatID) {
          let placeholder = chats[i];
          messageCounter++;
          appendMessageNotificationBadgeOnFriendList(chatID, placeholder);
        }
      }
    }
  }
  if (activePill !== "pills-message-tab") {
    messageNavbarCounter = messageCounter;
    appendMessageNotificationBadgeOnNavbar();
  }
}

/**
 *
 * @param {String} message
 * @param {String} sender
 * @param {String} chatID
 *
 * Updates last message sent from the chat in the friend list column respectively
 */
function lastMessageUpdate(message, sender, chatID) {
  let lastMessage = document.getElementById(`last_message_${chatID}`);
  if (lastMessage !== null) {
    if (sender !== null) {
      lastMessage.textContent = `${message}`;
    } else {
      lastMessage.textContent = `You: ${message}`;
    }
  }
}

function appendReceivedMessage(
  message,
  from,
  chatID,
  messageID,
  dateSent,
  dateRead
) {
  let chats = document.querySelectorAll("[chat-container]");
  for (let i = 0; i < chats.length; i++) {
    let friend = chats[i].getAttribute("friend");
    if (friend === from) {
      let chat = chats[i];
      const bubbleContainer = document.createElement("div");
      bubbleContainer.setAttribute("id", `message`);
      bubbleContainer.classList.add(
        "d-flex",
        "flex-column",
        "align-items-start",
        "justify-content-center",
        "me-auto",
        "pb-2"
      );

      const sender = document.createElement("span");
      sender.classList.add("ms-1", "small");
      sender.innerText = from;

      const bubbleText = document.createElement("p");
      bubbleText.setAttribute("id", "received_message");
      bubbleText.setAttribute("message_id", `${messageID}`);
      bubbleText.setAttribute("sent_at", `${dateSent}`);
      bubbleText.classList.add(
        "m-0",
        "text-white",
        "text-bubble-received",
        "p-2",
        "bg-primary",
        "rounded"
      );

      const seenMark = document.createElement("span");
      seenMark.setAttribute("id", "received_message_info_mark");
      seenMark.classList.add("text-primary", "ms-auto", "me-1", "small");

      bubbleText.innerText = message;
      bubbleContainer.append(sender, bubbleText, seenMark);
      chat.append(bubbleContainer);

      if (dateSent && dateRead) {
        bubbleText.setAttribute("read_at", `${dateRead}`);
        let result = unixConversion(dateSent, "sent");
        receivedMessageInfoMark(result);
      } else if (dateSent && !dateRead) {
        let result = unixConversion(dateSent, "sent");
        receivedMessageInfoMark(result);
      } else {
        bubbleText.setAttribute("read_at", "false");
      }
    }
  }
  scrollController(chatID, messageID);
  lastMessageUpdate(message, from, chatID);
  checkIfMessageWasRead(chatID);
}

function appendSentMessage(message, chatID, messageID, dateSent, dateRead) {
  let chats = document.querySelectorAll("[chat-container]");
  for (let i = 0; i < chats.length; i++) {
    let friend = chats[i].getAttribute("friend");
    if (friend === socket.friend) {
      let chat = chats[i];
      const bubbleContainer = document.createElement("div");
      bubbleContainer.setAttribute("id", `message`);
      bubbleContainer.classList.add(
        "d-flex",
        "flex-column",
        "align-items-end",
        "justify-content-center",
        "ms-auto",
        "pb-2"
      );

      const sender = document.createElement("span");
      sender.classList.add("text-secondary", "ms-auto", "me-1", "small");
      sender.innerText = "You";

      const bubbleText = document.createElement("p");
      bubbleText.setAttribute("id", "sent_message");
      bubbleText.setAttribute("message_id", `${messageID}`);
      bubbleText.classList.add(
        "text-bubble-sent",
        "p-2",
        "bg-secondary",
        "rounded",
        "m-0",
        "text-white"
      );
      bubbleText.innerText = message;

      const seenMark = document.createElement("span");
      seenMark.setAttribute("id", "sent_message_info_mark");
      seenMark.classList.add("text-secondary", "ms-auto", "me-1", "small");

      bubbleContainer.append(sender, bubbleText, seenMark);
      chat.append(bubbleContainer);

      if (dateSent && dateRead) {
        bubbleText.setAttribute("read_at", `${dateRead}`);
        let result = unixConversion(dateRead, "seen");
        sentMessageInfoMark(result);
      } else if (dateSent && !dateRead) {
        bubbleText.setAttribute("sent_at", `${dateSent}`);
        bubbleText.setAttribute("read_at", "false");
        let result = unixConversion(dateSent, "sent");
        sentMessageInfoMark(result);
      } else {
        let date = Math.floor(new Date().getTime() / 1000);
        bubbleText.setAttribute("sent_at", `${date}`);
        bubbleText.setAttribute("read_at", "false");
        let result = unixConversion(date, "sent");
        sentMessageInfoMark(result);
      }
    }
  }
  scrollController(chatID, messageID);
  lastMessageUpdate(message, null, chatID);
  //   checkIfMessageWasRead(chatID);
}

function chatMessagesLoad(chatData) {
  for (let i = 0; i < chatData.members.length; i++) {
    if (chatData.members[i].username !== socket.username) {
      socket.friend = chatData.members[i].username;
    }
  }
  let isChatLoaded = document.querySelectorAll(
    "div#friend_list_row.list-group-item"
  );
  for (let i = 0; i < isChatLoaded.length; i++) {
    let friend = isChatLoaded[i].getAttribute("friend");
    let loaded = isChatLoaded[i].getAttribute("loaded");
    if (socket.friend === friend) {
      if (loaded === "0") {
        for (let i = 0; i < chatData.messages.length; i++) {
          if (chatData.messages[i].username === socket.username) {
            appendSentMessage(
              chatData.messages[i].message,
              chatData.chatID,
              chatData.messages[i].message_id,
              chatData.messages[i].dateSent,
              chatData.messages[i].dateRead
            );
          } else {
            socket.friend = chatData.messages[i].username;
            appendReceivedMessage(
              chatData.messages[i].message,
              chatData.messages[i].username,
              chatData.chatID,
              chatData.messages[i].message_id,
              chatData.messages[i].dateSent,
              chatData.messages[i].dateRead
            );
          }
        }
        isChatLoaded[i].setAttribute("loaded", "1");
      }
    }
  }
}

function chatsListLoad(chatsData, user, friend, request) {
  let userDetails = [];
  let lastMsgObj = {};
  for (let i = 0; i < chatsData.length; i++) {
    let userObj = {};
    for (let x = 0; x < chatsData[i].members.length; x++) {
      if (chatsData[i].members[x].username !== socket.username) {
        userObj = {
          chatID: chatsData[i].chatID,
          name: chatsData[i].members[x].username,
          avatar: chatsData[i].members[x].avatar,
        };
      }
    }
    if (!chatsData[i].last_message) {
      lastMsgObj = {
        sender: "",
        lastMessage: "",
      };
    } else {
      if (chatsData[i].last_message.username === socket.username) {
        lastMsgObj = {
          sender: "You:",
          lastMessage: chatsData[i].last_message.message,
        };
      } else {
        lastMsgObj = {
          sender: "",
          lastMessage: chatsData[i].last_message.message,
        };
      }
      Object.assign(userObj, lastMsgObj);
    }
    userDetails.push(userObj);
    chatIdMap.set(chatsData[i].chatID, { loaded: false, active: false });
  }

  chatListGroup.innerHTML = userDetails
    .map((user) => {
      if (!user.lastMessage) {
        if (user.avatar) {
          return `<div id="friend_list_row" class="list-group-item list-group-item-action" data-bs-toggle="list" href="#tab-chat-with-${user.name}" role="tab" chat="${user.chatID}" friend="${user.name}" loaded="0" aria-selected="false" tabindex="-1">
            <div class="d-flex justify-content-left align-items-center ms-5">
              <div class="user-avatar">
                <img id="friend_list_row_avatar" class="me-1" src="../user/assets/${user.avatar}" alt="user-row-avatar" />
              </div>
              <div class="user-chat px-2 ms-1 my-3 py-md-0">
                <p id="friend_list_row_username" class="m-0 mb-1 fs-5">${user.name}</p>
                <p id="last_message_${user.chatID}" class="m-0 mb-1 fs-6" chat="${user.chatID}"></p>
              </div>
            </div>
          </div>`;
        } else {
          return `<div id="friend_list_row" class="list-group-item list-group-item-action" data-bs-toggle="list" href="#tab-chat-with-${user.name}" role="tab" chat="${user.chatID}" friend="${user.name}" loaded="0" aria-selected="false" tabindex="-1">
            <div class="d-flex justify-content-left align-items-center ms-5">
              <div class="user-avatar">
                <img id="friend_list_row_avatar" class="me-1" src="assets/default_user_avatar.jpg" alt="default-user-row-avatar" />
              </div>
              <div class="user-chat px-2 ms-1 my-3 py-md-0">
                <p id="friend_list_row_username" class="m-0 mb-1 fs-5">${user.name}</p>
                <p id="last_message_${user.chatID}" class="m-0 mb-1 fs-6" chat="${user.chatID}"></p>
              </div>
            </div>
          </div>`;
        }
      } else {
        if (user.avatar) {
          return `<div id="friend_list_row" class="list-group-item list-group-item-action" data-bs-toggle="list" href="#tab-chat-with-${user.name}" role="tab" chat="${user.chatID}" friend="${user.name}" loaded="0" aria-selected="false" tabindex="-1">
          <div class="d-flex justify-content-left align-items-center ms-5">
            <div class="user-avatar">
              <img id="friend_list_row_avatar" class="me-1" src="../user/assets/${user.avatar}" alt="user-row-avatar" />
            </div>
            <div class="user-chat px-2 ms-1 my-1 py-md-0">
              <p id="friend_list_row_username" class="m-0 mb-1 fs-5">${user.name}</p>
              <p id="last_message_${user.chatID}" class="m-0 mb-1 fs-6" chat="${user.chatID}">${user.sender} ${user.lastMessage}</p>
            </div>
          </div>
        </div>`;
        } else {
          return `<div id="friend_list_row" class="list-group-item list-group-item-action" data-bs-toggle="list" href="#tab-chat-with-${user.name}" role="tab" chat="${user.chatID}" friend="${user.name}" loaded="0" aria-selected="false" tabindex="-1">
          <div class="d-flex justify-content-left align-items-center ms-5">
            <div class="user-avatar">
              <img id="friend_list_row_avatar" class="me-1" src="assets/users/default/default_user_avatar.jpg" alt="default-user-row-avatar" />
            </div>
            <div class="user-chat px-2 ms-1 my-1 py-md-0">
              <p id="friend_list_row_username" class="m-0 mb-1 fs-5">${user.name}</p>
              <p id="last_message_${user.chatID}" class="m-0 mb-1 fs-6" chat="${user.chatID}">${user.sender} ${user.lastMessage}</p>
            </div>
          </div>
        </div>`;
        }
      }
    })
    .join(" ");

  chatTabContent.innerHTML = userDetails
    .map((user) => {
      if (!user.avatar) {
        return `<div class="tab-pane" id="tab-chat-with-${user.name}" role="tabpanel">
        <div id="chat_container" class="d-flex flex-column justify-content-between ms-3 p-2">
            <div class="separator">
                <div id="chat_header" class="d-flex align-items-center p-2 px-4 z-3">
                    <div id="header_avatar">
                        <img id="friend_list_row_avatar" class="me-1" src="assets/users/default/default_user_avatar.jpg" alt="default-user-row-avatar" />
                    </div>
                    <p id="header_username" class="m-0 ms-2 fs-5">${user.name}</p>
                </div>
                <div chat-container="${user.name}" id="chat_with_${user.name}" class="d-flex flex-column justify-content-between p-2 scrollable" friend="${user.name}" chat="${user.chatID}"></div>
            </div>
            <div class="chat-input">
                <form id="message_form" class="mb-1">
                    <div class="input-group">
                        <input id="message_input" type="text" class="form-control text-white" placeholder="Type a message..." aria-label="Recipient's username" aria-describedby="button-addon2">
                        <button id="send_message_to_${user.name}" class="btn btn-secondary" type="submit" chat="${user.chatID}">Send <i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                </form>
            </div>
        </div>
    </div>`;
      } else {
        return `<div class="tab-pane" id="tab-chat-with-${user.name}" role="tabpanel">
        <div id="chat_container" class="d-flex flex-column justify-content-between ms-3 p-2">
            <div class="separator">
                <div id="chat_header" class="d-flex align-items-center p-2 px-4 z-3">
                    <div id="header_avatar">
                        <img id="friend_list_row_avatar" class="me-1" src="../user/assets/${user.avatar}" alt="user-row-avatar" />
                    </div>
                    <p id="header_username" class="m-0 ms-2 fs-5">${user.name}</p>
                </div>
                <div chat-container="${user.name}" id="chat_with_${user.name}" class="d-flex flex-column justify-content-between p-2 scrollable" friend="${user.name}" chat="${user.chatID}"></div>
            </div>
            <div class="chat-input">
                <form id="message_form" class="mb-1">
                    <div class="input-group">
                        <input id="message_input" type="text" class="form-control text-white" placeholder="Type a message..." aria-label="Recipient's username" aria-describedby="button-addon2">
                        <button id="send_message_to_${user.name}" class="btn btn-secondary" type="submit" chat="${user.chatID}">Send <i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                </form>
            </div>
        </div>
    </div>`;
      }
    })
    .join(" ");

  const triggerTabList = document.querySelectorAll(
    "#chat_list_group div#friend_list_row"
  );
  triggerTabList.forEach((triggerEl) => {
    const tabTrigger = new bootstrap.Tab(triggerEl);

    triggerEl.addEventListener("click", (event) => {
      event.preventDefault();
      tabTrigger.show();
    });
  });
  if (request === "open-chat-section") {
    openChatTab(user, friend);
  }
  messagesTabActive();
  chatTabRefresh();
}

function unixConversion(date, type) {
  if (date) {
    let sentDateNum = Number(date);
    let unixTimestamp = new Date(sentDateNum * 1000);
    let hours = unixTimestamp.getHours();
    let minutes = unixTimestamp.getMinutes();
    if (minutes < 10) minutes = `0${minutes}`;
    if (type == "sent") {
      let string = `Sent • ${hours}:${minutes}`;
      return string;
    } else if (type == "seen") {
      let string = `Seen • ${hours}:${minutes}`;
      return string;
    } else {
      new Error("Error: Incorrect type value");
    }
  } else {
    new Error("Error: Undefined date argument");
  }
}

function onClickMessageDetail(chatID) {
  let selected = chatIdMap.get(chatID);
  if (selected) {
    if (selected.active === true) {
      const messages = document.querySelectorAll("div#message");
      if (messages.length !== 0) {
        for (let i = 0; i < messages.length; i++) {
          messages[i].addEventListener("click", (e) => {
            let seenMark = messages[i].childNodes[2];
            if (seenMark) {
              if (seenMark.style.display === "block") {
                seenMark.style.display = "none";
              } else {
                seenMark.style.display = "block";
              }
            }
          });
        }
      }
    }
  } else return;
}

function checkIfMessageWasRead(chatID) {
  let selected = chatIdMap.get(chatID);
  if (selected) {
    if (selected.active === true) {
      let messages = document.querySelectorAll("div#message");
      if (messages.length !== 0) {
        for (let i = 0; i < messages.length; i++) {
          let messageText = messages[i].childNodes[1];
          // let messageSeenMark = messages[i].childNodes[2].textContent;
          let messageTextID = messageText.getAttribute("id");
          if (messageTextID === "received_message") {
            let isMessageRead = messageText.getAttribute("read_at");
            if (isMessageRead !== "false") {
              let result = unixConversion(isMessageRead, "seen");
              sentMessageInfoMark(result);
            } else {
              let messageID = messageText.getAttribute("message_id");
              let date = Math.floor(new Date().getTime() / 1000);
              let result = unixConversion(date, "seen");
              sentMessageInfoMark(result);
              socket.emit("seen", chatID, messageID);
            }
          }
        }
      }
    }
  } else return;
}

function sentMessageInfoMark(result) {
  let sentMessageSeenMark = document.querySelectorAll(
    "div#message > span#sent_message_info_mark"
  );
  if (sentMessageSeenMark) {
    for (let i = 0; i < sentMessageSeenMark.length; i++) {
      if (sentMessageSeenMark[i].textContent.trim() !== "") {
        sentMessageSeenMark[i].style.display = "none";
      }
    }
    let lastMessageMark = sentMessageSeenMark[sentMessageSeenMark.length - 1];
    if (lastMessageMark) {
      lastMessageMark.textContent = result;
      lastMessageMark.style.display = "inline-block";
    }
  }
}

function receivedMessageInfoMark(result) {
  let receivedMessageSeenMark = document.querySelectorAll(
    "div#message > span#received_message_info_mark"
  );
  if (receivedMessageSeenMark) {
    for (let i = 0; i < receivedMessageSeenMark.length; i++) {
      receivedMessageSeenMark[i].style.display = "none";
    }
    let messageMark =
      receivedMessageSeenMark[receivedMessageSeenMark.length - 1];
    if (messageMark) {
      messageMark.textContent = result;
    }
  }
}

function scrollController() {
  let container = document.querySelectorAll("div#chat_container > div.chat");
  for (let i = 0; i < container.length; i++) {
    if (container[i].scrollTop <= container[i].scrollHeight - 633) {
      container[i].scrollTo(0, container[i].scrollHeight);
    }
  }
}

function notificationsController(data) {
  if (data) {
    let notificationsTab = document.getElementById("notifications_rows");
    let notificationsCounter = document.getElementById("notifications-count");
    notificationsCounter.textContent = data.length;
    notificationsTab.innerHTML = data
      .map((user) => {
        if (user.avatar !== "") {
          return `<div id="notification_row" class="p-3 pt-1 mb-4">
                      <div class="d-flex flex-column justify-content-center align-items-center">
                          <div class="d-flex align-items-center">
                              <div class="user-avatar">
                                  <img id="friend_list_row_avatar" class="me-1" src="../user/assets/${user.avatar}" alt="user-row-avatar" />
                              </div>
                              <div class="user-username ms-2 py-2 py-md-0">
                                  <p id="friend_list_row_username" class="m-0 fs-6"><span class="text-secondary fs-5"><strong>${user.username}</strong></span>  has sent you a friend request</p>
                              </div>
                          </div>
                          <div class="d-flex align-items-center py-2">
                              <button
                                  decline-btn="${user.username}"
                                  type="button"
                                  class="btn btn-danger me-1"
                              >
                              Decline
                              <i class="fa-solid fa-xmark"></i>
                              </button>
                              <button
                                  accept-btn="${user.username}"
                                  type="button"
                                  class="btn btn-light ms-1"
                              >
                              Accept
                              <i class="fa-solid fa-check"></i>
                              </button>
                          </div>
                      </div>
                  </div>`;
        } else {
          return `<div id="notification_row" class="p-3 pt-1 mb-4">
                      <div class="d-flex flex-column justify-content-center align-items-center">
                          <div class="d-flex align-items-center">
                              <div class="user-avatar">
                                  <img id="friend_list_row_avatar" class="me-1" src="assets/users/default/${user.defaultAvatar}" alt="user-row-avatar" />
                              </div>
                              <div class="user-username ms-2 py-2 py-md-0">
                                  <p id="friend_list_row_username" class="m-0 fs-6"><span class="text-secondary fs-5"><strong>${user.username}</strong></span>  has sent you a friend request</p>
                              </div>
                          </div>
                          <div class="d-flex align-items-center py-2">
                              <button
                                  decline-btn="${user.username}"
                                  type="button"
                                  class="btn btn-danger me-1"
                              >
                              Decline
                              <i class="fa-solid fa-xmark"></i>
                              </button>
                              <button
                                  accept-btn="${user.username}"
                                  type="button"
                                  class="btn btn-light ms-1"
                              >
                              Accept
                              <i class="fa-solid fa-check"></i>
                              </button>
                          </div>
                      </div>
                  </div>`;
        }
      })
      .join(" ");
    notificationsButtonsController();
  }
  notificationsTabRefresh();
}

function notificationsButtonsController() {
  let acceptBtn = document.querySelectorAll("[accept-btn]");
  let declineBtn = document.querySelectorAll("[decline-btn]");

  for (let i = 0; i < acceptBtn.length; i++) {
    acceptBtn[i].addEventListener("click", (e) => {
      let requester = acceptBtn[i].getAttribute("accept-btn");
      socket.emit("accept-friend-request", requester, socket.username);
    });
  }

  for (let i = 0; i < declineBtn.length; i++) {
    declineBtn[i].addEventListener("click", (e) => {
      let requester = declineBtn[i].getAttribute("decline-btn");
      socket.emit("decline-friend-request", requester, socket.username);
    });
  }
}

function removeNotification(result) {
  let notificationsTab = document.getElementById("notifications_rows");
  let friendListRow = notificationsTab.querySelectorAll("#notification_row");
  for (let i = 0; i < friendListRow.length; i++) {
    let username =
      friendListRow[i].childNodes[1].childNodes[1].childNodes[3].childNodes[1]
        .childNodes[0].textContent;
    if (result === username) {
      friendListRow[i].remove();
      checkIfNotificationsAreEmpty();
    }
  }
}

function checkIfNotificationsAreEmpty() {
  const notificationsTab = document.getElementById("notifications_rows");
  const notificationCount = document.getElementById("notifications-count");
  notificationsTab.classList.add(
    "d-flex",
    "flex-column",
    "justify-content-center",
    "px-5",
    notificationsTab.children.length <= 1
  );
  if (notificationsTab.children.length <= 1) {
    let p = document.createElement("p");
    p.setAttribute("id", "notification_info");
    p.classList.add("text-center", "mx-5", "mt-3", "pb-3", "fs-6");
    p.innerText =
      "There are no notifications at the moment, you will be notified if anything arrives here!";
    notificationsTab.append(p);
    notificationCount.remove();
  }
}

function updateFriendList(friends) {
  if (friends) {
    let friendListTab = document.getElementById("friend_list_tab");
    let friendListTabDetails = document.getElementById("v-pills-tabContent");
    friendListTab.innerHTML = friends
      .map((friend) => {
        if (friend.avatar !== "") {
          return `<div id="friend_list_row" class="p-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="user-avatar">
                        <img id="friend_list_row_avatar" class="me-1" src="../user/assets/${friend.avatar}" alt="user-row-avatar" />
                    </div>
                    <div class="user-username px-2 me-2 py-2 py-md-0">
                        <p id="friend_list_row_username" class="m-0 fs-5">${friend.username}</p>
                    </div>
                    <button
                        type="button"
                        class="btn btn-secondary ms-md-2 ms-auto"
                        id="v-pills-profile-tab"
                        data-bs-toggle="pill"
                        data-bs-target="#v-pills-profile-${friend.username}"
                        role="tab"
                        aria-controls="v-pills-profile"
                        aria-selected="false"
                    >
                    Profile
                    <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            </div>`;
        } else {
          return `<div id="friend_list_row" class="p-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="user-avatar">
                        <img id="friend_list_row_avatar" class="me-1" src="assets/users/default/default_user_avatar.jpg" alt="default-user-row-avatar" />
                    </div>
                    <div class="user-username px-2 me-2 py-2 py-md-0">
                        <p id="friend_list_row_username" class="m-0 fs-5">${friend.username}</p>
                    </div>
                    <button
                        type="button"
                        class="btn btn-secondary ms-md-2 ms-auto"
                        id="v-pills-profile-tab"
                        data-bs-toggle="pill"
                        data-bs-target="#v-pills-profile-${friend.username}"
                        role="tab"
                        aria-controls="v-pills-profile"
                        aria-selected="false"
                    >
                    Profile
                    <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            </div>`;
        }
      })
      .join(" ");

    friendListTabDetails.innerHTML = friends
      .map((friend) => {
        if (friend.avatar !== "") {
          return `<div
            class="tab-pane fade"
            id="v-pills-profile-${friend.username}"
            role="tabpanel"
            aria-labelledby="v-pills-profile-tab"
            tabindex="0"
            >
                <div id="user_details" class="d-flex flex-column align-items-center bg-dark p-4">
                    <div class="user-details-avatar">
                        <img id="user_details_avatar" class="me-1" src="../user/assets/${friend.avatar}" alt="user-details-avatar" />
                    </div>
                    <div id="user_details_username" class="user-details-username pt-2 pb-1">
                        <p class="m-0">${friend.username}</p>
                    </div>
                    <div class="user-details-description w-85 pb-3">
                        <p class="m-0 small text-break text-center">${friend.description}</p>
                    </div>
                    <div class="user-details-action">
                        <button
                            friend="${friend.username}"
                            id="initiate_chat"
                            type="button"
                            class="btn btn-secondary"
                            >
                            <i class="fa-solid fa-message me-1"></i>
                            Message
                        </button>
                    </div>
                </div>
            </div>`;
        } else {
          return `<div
            class="tab-pane fade"
            id="v-pills-profile-${friend.username}"
            role="tabpanel"
            aria-labelledby="v-pills-profile-tab"
            tabindex="0"
            >
                <div id="user_details" class="d-flex flex-column align-items-center bg-dark p-4">
                    <div class="user-details-avatar">
                        <img id="user_details_avatar" class="me-1" src="assets/users/default/default_user_avatar.jpg" alt="default-user-details-avatar" />
                    </div>
                    <div id="user_details_username" class="user-details-username pt-2 pb-1">
                        <p class="m-0">${friend.username}</p>
                    </div>
                    <div class="user-details-description w-85 pb-3">
                        <p class="m-0 small text-break text-center">${friend.description}</p>
                    </div>
                    <div class="user-details-action">
                        <button
                            friend="${friend.username}"
                            id="initiate_chat"
                            type="button"
                            class="btn btn-secondary"
                            >
                            <i class="fa-solid fa-message me-1"></i>
                            Message
                        </button>
                    </div>
                </div>
            </div>`;
        }
      })
      .join(" ");
    messageButtonsController();
  }
  friendListTabRefresh();
}

function messageButtonsController() {
  let initiateButtons = document.querySelectorAll("#initiate_chat");
  for (let i = 0; i < initiateButtons.length; i++) {
    initiateButtons[i].addEventListener("click", (e) => {
      let friend = initiateButtons[i].getAttribute("friend");
      socket.emit("initiate-chat", socket.username, friend);
    });
  }
}

function updateChatList(user, friend) {
  let request = "open-chat-section";
  socket.emit("update-chat-list", user, friend, request);
}

function openChatTab(user, friend) {
  if (user && friend) {
    const friendsTab = document.getElementById("pills-friends");
    const friendsTabButton = document.getElementById("pills-friends-tab");

    const messagesTab = document.getElementById("pills-messages");
    const messagesTabButton = document.getElementById("pills-messages-tab");

    friendsTab.classList.remove("active");
    setTimeout(() => {
      friendsTab.classList.remove("show");
    }, 200);

    messagesTab.classList.add("active");
    setTimeout(() => {
      messagesTab.classList.add("show");
    }, 200);

    friendsTabButton.classList.remove("active");
    friendsTabButton.setAttribute("aria-selected", "false");
    friendsTabButton.setAttribute("tabindex", "-1");

    messagesTabButton.classList.add("active");
    messagesTabButton.setAttribute("aria-selected", "true");
    messagesTabButton.removeAttribute("tabindex", "-1");
    openSelectedChat(friend);
  }
}

function openSelectedChat(friend) {
  const friendListRow = document.querySelector(
    `#chat_list_group div[href="#tab-chat-with-${friend}"]`
  );
  bootstrap.Tab.getInstance(friendListRow).show();
}

function loadUserSettingsData(user) {
  if (user) {
    let settingsTab = document.getElementById("settings_tab");
    settingsTab.innerHTML = user.map((user) => {
      if (user.avatar) {
        return `<div id="tab_title" class="p-1 d-flex justify-content-center">
            <h5 class="m-1">Your profile</h5>
        </div>
        <div id="settings_details_wrapper" class="p-3 my-auto">
        <div class="d-flex justify-content-center mb-2">
            <span id="settings_avatar_error_message" class="text-warning text-center fs-6"></span>
        </div>
        <div id="settings_details_divider_top" class="d-flex pb-3">
            <div id="settings_details_left_divider" class="left-divider">
                <div id="settings-username">
                    <label for="settings_username_form_control" class="form-label">Username</label>
                    <input type="email" class="form-control" id="settings_username_form_control"
                    placeholder="${user.username}">
                </div>
                <span id="settings_username_notification" class="text-warning ms-1 mb-3"></span>
                <div class="settings-email">
                    <label for="settings_email_form_control" class="form-label">Email address</label>
                    <input type="email" class="form-control" id="settings_email_form_control"
                    placeholder="${user.email}">
                </div>
                <span id="settings_email_notification" class="text-warning ms-1"></span>
            </div>
            <div id="settings_details_right_divider"
                class="right-divider d-flex justify-content-center align-items-center mx-auto ps-2">
                <img id="settings_avatar_form_control" class="me-1" src="../app/assets/${user.avatar}"
                    alt="settings-user-avatar" />
                <div class="btn-group">
                    <button type="button" class="btn btn-secondary dropdown-toggle" data-bs-toggle="dropdown"
                        aria-expanded="false">
                        <i class="fa-solid fa-pen me-1"></i>Edit
                    </button>
                    <ul id="avatar_dropdown_menu" class="dropdown-menu mt-1">
                        <li>
                            <input type="file" id="settings_uploaded_user_avatar" name="settings_uploaded_user_avatar"
                                style="display: none;" class="m-0 p-0" />
                            <label for="settings_uploaded_user_avatar"
                                class="dropdown-item upload-user-avatar-label mt-1"><i
                                    class="fa-solid fa-arrow-up me-1"></i>Upload avatar</label>
                        </li>
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li>
                            <a id="settings_remove_uploaded_user_avatar" class="dropdown-item text-danger mb-1"
                                href="#"><i class="fa-solid fa-trash me-1"></i>Remove
                                avatar</a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        <div id="settings_details_divider_bottom" class="d-flex">
            <div id="settings_bio" class="w-100">
                <label for="settings_bio_form_control" class="form-label">Your bio</label>
                <textarea class="form-control" id="settings_bio_form_control" rows="3"
                placeholder="${user.description}"></textarea>
            </div>
        </div>
        <div class="d-flex justify-content-between mb-3">
            <span id="textarea_max_char_warning" class="text-danger"></span>
            <span id="textarea_num_counter" class="text-secondary">0/160</span>
        </div>
        <div id="settings_details_password" class="d-flex flex-column">
            <p class="m-0 mb-2">Password</p>
            <div class="change-password-button">
                <button type="button" data-bs-toggle="modal" data-bs-target="#password_change_modal" class="btn btn-secondary"><i class="fa-solid fa-key me-1"></i>Change password</button>
            </div>
        </div>
    </div>
    <div class="d-flex flex-column settings-bottom-wrapper mt-auto pb-2">
        <hr class="mx-3">
        <div class="d-flex align-items-center justify-content-between settings-update-profile px-3">
            <button type="button" data-bs-toggle="modal" data-bs-target="#remove_profile_modal" class="btn btn-danger"><i class="fa-solid fa-trash me-1"></i>Remove profile</button>
            <button id="settings_update_profile" type="button" class="btn btn-secondary"><i class="fa-solid fa-check me-1"></i>Update profile</button>
        </div>
    </div>`;
      } else {
        return `<div id="tab_title" class="p-1 d-flex justify-content-center">
            <h5 class="m-1">Your profile</h5>
        </div>
        <div id="settings_details_wrapper" class="p-3 my-auto">
        <div class="d-flex justify-content-center mb-2">
            <span id="settings_avatar_error_message" class="text-warning text-center fs-6"></span>
        </div>
        <div id="settings_details_divider_top" class="d-flex pb-3">
            <div id="settings_details_left_divider" class="left-divider">
                <div id="settings-username">
                    <label for="settings_username_form_control" class="form-label">Username</label>
                    <input type="email" class="form-control" id="settings_username_form_control"
                    placeholder="${user.username}">
                </div>
                <span id="settings_username_notification" class="text-warning mb-3 ms-1"></span>
                <div class="settings-email">
                    <label for="settings_email_form_control" class="form-label">Email address</label>
                    <input type="email" class="form-control" id="settings_email_form_control"
                    placeholder="${user.email}">
                </div>
                <span id="settings_email_notification" class="text-warning ms-1"></span>
            </div>
            <div id="settings_details_right_divider"
                class="right-divider d-flex justify-content-center align-items-center mx-auto ps-2">
                <img id="settings_avatar_form_control" class="me-1" src="assets/users/default/default_user_avatar.jpg"
                    alt="settings-default-user-avatar" />
                <div class="btn-group">
                    <button type="button" class="btn btn-secondary dropdown-toggle" data-bs-toggle="dropdown"
                        aria-expanded="false">
                        <i class="fa-solid fa-pen me-1"></i>Edit
                    </button>
                    <ul id="avatar_dropdown_menu" class="dropdown-menu mt-1">
                        <li>
                            <input type="file" id="settings_uploaded_user_avatar" name="settings_uploaded_user_avatar"
                                style="display: none;" class="m-0 p-0" />
                            <label for="settings_uploaded_user_avatar"
                                class="dropdown-item upload-user-avatar-label mt-1"><i
                                    class="fa-solid fa-arrow-up me-1"></i>Upload avatar</label>
                        </li>
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li>
                            <a id="settings_remove_uploaded_user_avatar" class="dropdown-item text-danger mb-1"
                                href="#"><i class="fa-solid fa-trash me-1"></i>Remove
                                avatar</a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        <div id="settings_details_divider_bottom" class="d-flex">
            <div id="settings_bio" class="w-100">
                <label for="settings_bio_form_control" class="form-label">Your bio</label>
                <textarea class="form-control" id="settings_bio_form_control" rows="3"
                placeholder="${user.description}"></textarea>
            </div>
        </div>
        <div class="d-flex justify-content-end mb-3">
            <span id="textarea_max_char_warning" class="text-danger"></span>
            <span id="textarea_num_counter" class="text-secondary">0/160</span>
        </div>
        <div id="settings_details_password" class="d-flex flex-column">
            <p class="m-0 mb-2">Password</p>
            <div class="change-password-button">
                <button type="button" data-bs-toggle="modal" data-bs-target="#password_change_modal" class="btn btn-secondary"><i class="fa-solid fa-key me-1"></i>Change password</button>
            </div>
        </div>
    </div>
    <div class="d-flex flex-column settings-bottom-wrapper mt-auto pb-2">
        <hr class="mx-3">
        <div class="d-flex align-items-center justify-content-between settings-update-profile px-3">
            <button type="button" data-bs-toggle="modal" data-bs-target="#remove_profile_modal" class="btn btn-danger"><i class="fa-solid fa-trash me-1"></i>Remove profile</button>
            <button id="settings_update_profile" type="button" class="btn btn-secondary"><i class="fa-solid fa-check me-1"></i>Update profile</button>
        </div>
    </div>`;
      }
    });
    avatarPreviewController();
    userSettingsController();
    changePasswordController();
    removeAccount();
  }
}

function avatarPreviewController() {
  let settingsAvatarPreview = document.getElementById(
    "settings_avatar_form_control"
  );
  let settingsUploadedUserAvatar = document.getElementById(
    "settings_uploaded_user_avatar"
  );
  let settingsRemoveUploadedUserAvatar = document.getElementById(
    "settings_remove_uploaded_user_avatar"
  );
  let settingsErrorMessage = document.getElementById(
    "settings_avatar_error_message"
  );

  settingsUploadedUserAvatar.addEventListener("change", () => {
    preloadAvatar(settingsUploadedUserAvatar, settingsAvatarPreview);
  });

  settingsRemoveUploadedUserAvatar.addEventListener("click", () => {
    if (settingsUploadedUserAvatar.files[0] !== undefined) {
      settingsUploadedUserAvatar.value = "";
      settingsAvatarPreview.src =
        "assets/users/default/default_user_avatar.jpg";
    } else {
      settingsAvatarPreview.src =
        "assets/users/default/default_user_avatar.jpg";
    }
  });

  let preloadAvatar = (settingsUploadedUserAvatar, settingsAvatarPreview) => {
    let file = settingsUploadedUserAvatar.files[0];
    let reader = new FileReader();
    let isValidated = avatarValidation(file);

    if (isValidated === true) {
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        imageBase64Data = e.target.result.split(",")[1];
        settingsAvatarPreview.src = reader.result;
      };
    } else {
      settingsErrorMessage.textContent = isValidated;
    }
  };
}

function userSettingsController() {
  const bioInput = document.getElementById("settings_bio_form_control");
  const textareaNumCounter = document.getElementById("textarea_num_counter");
  const textareaMaxCharWarning = document.getElementById(
    "textarea_max_char_warning"
  );
  const updateProfileBtn = document.getElementById("settings_update_profile");

  bioInput.addEventListener("keyup", () => {
    let bioInputCharacters = bioInput.value.length;
    textareaNumCounter.textContent = bioInputCharacters + "/160";
    if (bioInputCharacters > 160) {
      textareaNumCounter.classList.add("text-danger");
      textareaMaxCharWarning.textContent =
        "You can write maximum 160 characters in your bio!";
      updateProfileBtn.disabled = true;
    } else {
      textareaNumCounter.classList.remove("text-danger");
      textareaMaxCharWarning.textContent = "";
      updateProfileBtn.disabled = false;
    }
  });

  const emailInput = document.getElementById("settings_email_form_control");
  const emailFeedback = document.getElementById("settings_email_notification");
  emailInput.addEventListener("keyup", () => {
    let isEmailValidated = emailValidation(emailInput.value);
    if (isEmailValidated === false) {
      emailFeedback.textContent = "This email address is not valid";
      updateProfileBtn.disabled = true;
    } else {
      emailFeedback.textContent = "";
      updateProfileBtn.disabled = false;
    }
    if (emailInput.value.length <= 0) {
      emailFeedback.textContent = "";
      updateProfileBtn.disabled = false;
    }
  });

  const usernameInput = document.getElementById(
    "settings_username_form_control"
  );
  const usernameNotification = document.getElementById(
    "settings_username_notification"
  );
  usernameInput.addEventListener("keyup", () => {
    let filteredUsername = usernameInput.value.trim().toLowerCase();
    let isUsernameValidated = usernameValidation(filteredUsername);

    if (isUsernameValidated === true) {
      updateProfileBtn.disabled = false;
    } else {
      updateProfileBtn.disabled = true;
    }
    if (filteredUsername.length <= 0) {
      usernameNotification.textContent = "";
      updateProfileBtn.disabled = false;
    }
  });

  updateProfileBtn.addEventListener("click", () => {
    const avatarUpload = document.getElementById(
      "settings_uploaded_user_avatar"
    );
    const currentAvatar = document.getElementById(
      "settings_avatar_form_control"
    );
    let usernameValue = usernameInput.value.trim().toLowerCase();
    let emailValue = emailInput.value;
    let bioValue = bioInput.value;
    let avatarValue;
    if (avatarUpload.files[0] !== undefined) {
      avatarValue = avatarUpload.files[0].name;
      
    } else {
      avatarValue = currentAvatar.src;
    }
    if (
      usernameValue ||
      emailValue ||
      bioValue ||
      avatarValue ||
      imageBase64Data
    ) {
      socket.emit(
        "update-user-profile",
        socket.username,
        usernameValue,
        emailValue,
        bioValue,
        avatarValue,
        imageBase64Data
      );
    }
  });
}

function emailValidation(email) {
  if (email.search(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/) < 0) {
    return false;
  } else return true;
}

function usernameValidation(username) {
  const usernameNotification = document.getElementById(
    "settings_username_notification"
  );
  let isUsernameValidated = checkIfItsAlphabeticalOrNumeralChar(username);
  if (isUsernameValidated === null) {
    usernameNotification.textContent = "Cannot contain white space characters";
  }
  if (isUsernameValidated === false) {
    usernameNotification.textContent = "Cannot contain special characters";
  } else if (!isUsernameValidated === false) {
    usernameNotification.textContent = "Cannot contain uppercase characters";
  } else if (username.length <= 2) {
    usernameNotification.textContent = "Must be at least 3 characters";
  } else if (username.length > 16) {
    usernameNotification.textContent = "Maximum of 16 characters";
  } else {
    usernameNotification.textContent = "";
    return true;
  }
}

function changePasswordController() {
  let passwordFields = document.querySelectorAll(
    "#password_change_fields input"
  );
  let fieldsArray = Array.from(passwordFields);
  let oldPasswordInput = document.getElementById("old_password");
  let newPasswordInput = document.getElementById("new_password");
  let repeatNewPasswordInput = document.getElementById("confirm_new_password");
  let newPasswordToggler = document.getElementById(
    "settings_change_password_toggler"
  );
  let oldPasswordToggler = document.getElementById(
    "settings_change_old_password_toggler"
  );
  let updatePasswordBtn = document.getElementById("update_password_btn");
  updatePasswordBtn.disabled = true;

  const toggleNewPasswordVisibility = () => {
    if (newPasswordInput.type == "password") {
      newPasswordInput.setAttribute("type", "text");
      repeatNewPasswordInput.setAttribute("type", "text");
      newPasswordToggler.classList.remove("fa-eye");
      newPasswordToggler.classList.add("fa-eye-slash");
    } else {
      newPasswordToggler.classList.remove("fa-eye-slash");
      newPasswordToggler.classList.add("fa-eye");
      newPasswordInput.setAttribute("type", "password");
      repeatNewPasswordInput.setAttribute("type", "password");
    }
  };

  const toggleOldPasswordVisibility = () => {
    if (oldPasswordInput.type == "password") {
      oldPasswordInput.setAttribute("type", "text");
      oldPasswordToggler.classList.remove("fa-eye");
      oldPasswordToggler.classList.add("fa-eye-slash");
    } else {
      oldPasswordToggler.classList.remove("fa-eye-slash");
      oldPasswordToggler.classList.add("fa-eye");
      oldPasswordInput.setAttribute("type", "password");
    }
  };

  newPasswordToggler.addEventListener("click", toggleNewPasswordVisibility);
  oldPasswordToggler.addEventListener("click", toggleOldPasswordVisibility);

  let password_popover = document.getElementById("change_password_popover");
  new bootstrap.Popover(password_popover);

  let newPasswordSpanInvalidFeedback = document.getElementById(
    "new_password_invalid_feedback"
  );
  let confirmNewPasswordSpanInvalidFeedback = document.getElementById(
    "confirm_new_password_invalid_feedback"
  );

  for (let i = 0; i < fieldsArray.length; i++) {
    fieldsArray[i].addEventListener("keyup", () => {
      let newPasswordField = fieldsArray[1].value.trim();
      let repeatNewPasswordField = fieldsArray[2].value.trim();
      let isPasswordChangeValidated = passwordValidation(
        newPasswordField,
        repeatNewPasswordField,
        newPasswordSpanInvalidFeedback,
        confirmNewPasswordSpanInvalidFeedback
      );
      if (isPasswordChangeValidated === true) {
        updatePasswordBtn.disabled = false;
      } else {
        updatePasswordBtn.disabled = true;
      }
    });
  }

  updatePasswordBtn.addEventListener("click", () => {
    let oldPasswordValue = oldPasswordInput.value;
    let newPasswordValue = newPasswordInput.value;
    updatePasswordBtn.disabled = true;
    socket.emit(
      "old-password-change-input",
      socket.username,
      oldPasswordValue,
      newPasswordValue
    );
    inputCoolDown();
  });

  function inputCoolDown() {
    setTimeout(() => {
      updatePasswordBtn.disabled = false;
    }, 2000);
  }

  let closeModalButtons = document.querySelectorAll(
    "[close-password-change-modal]"
  );
  for (let i = 0; i < closeModalButtons.length; i++) {
    closeModalButtons[i].addEventListener("click", () => {
      oldPasswordInput.value = "";
      newPasswordInput.value = "";
      repeatNewPasswordInput.value = "";
    });
  }
}

function passwordValidation(
  password,
  confirm_password,
  passwordElem,
  confirmPasswordElem
) {
  let errors = [];

  if (password.search(/(?=.*[a-z])/i) < 0) {
    errors.push("Your password must contain at least one letter");
  }
  if (password.search(/(?=.*[0-9])/) < 0) {
    errors.push("Your password must contain at least one digit");
  }
  if (password.search(/(?=.*[A-Z])/) < 0) {
    errors.push("Your password must contain at least one uppercase letter");
  }
  if (password.search(/(?=.*[!@#$%^&*])/) < 0) {
    errors.push("Your password must contain at least one special character");
  }
  if (password.length < 6) {
    errors.push("Your password must be at least 6 characters long");
  }
  if (errors.length > 0) {
    passwordElem.textContent = errors[0];
    return false;
  }
  if (errors.length === 0) {
    passwordElem.textContent = "";
    if (password !== confirm_password) {
      confirmPasswordElem.textContent = "Your passwords do not match!";
      return false;
    } else {
      confirmPasswordElem.textContent = "";
      return true;
    }
  }
}

function oldPasswordFeedback(feedback) {
  let oldPasswordInput = document.getElementById("old_password");
  let oldPasswordSpanInvalidFeedback = document.getElementById(
    "old_password_invalid_feedback"
  );
  let successFeedback = document.getElementById(
    "settings_password_change_success"
  );
  if (feedback === false) {
    successFeedback.style.display = "none";
    oldPasswordSpanInvalidFeedback.textContent =
      "Wrong password, please try again";
  } else {
    successFeedback.textContent = "Password has been successfully changed!";
    successFeedback.style.display = "block";
    oldPasswordSpanInvalidFeedback.textContent = "";
  }
  oldPasswordInput.addEventListener("change", () => {
    oldPasswordSpanInvalidFeedback.textContent = "";
  });
}

function removeAccount() {
  const removeAccountButton = document.getElementById("remove_account_btn");
  removeAccountButton.addEventListener("click", (e) => {
    let approval = true;
    socket.emit("remove-account", approval, socket.username);
    socket.off();
  });
}

// EVENT LISTENERS
const messagesTabActive = () => {
  const messageInputForm = chatTabContent.querySelectorAll(
    "div.chat-input > form"
  );
  messageInputForm.forEach((submit) => {
    submit.addEventListener("submit", (e) => {
      e.preventDefault();
      const message = e.target[0].value;
      const to = e.target[1].id.split("_").pop();
      const chatID = e.target[1].getAttribute("chat");
      if (message === "" || null || undefined) return;
      socket.emit("send-private-message", message, to, chatID);
      e.target[0].value = "";
    });
  });

  const friendListRows = chatListGroup.querySelectorAll("#friend_list_row");
  friendListRows.forEach((row) => {
    row.addEventListener("click", (e) => {
      let chatID = e.currentTarget.getAttribute("chat");
      socket.emit("request-single-chat-load", chatID);
      selectedChat = chatID;
      chatIdMap.forEach(isChatActive);
      let selected = chatIdMap.get(chatID);
      if (selected) {
        if (selected.active === true) {
          setTimeout(() => {
            onClickMessageDetail(chatID);
            checkIfMessageWasRead(chatID);
          }, 10);
        }
      }
      removeMessageNotificationBadgeFromFriendList(chatID);
    });
  });
};

export default socket;
