"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsTabRefresh = exports.chatTabRefresh = exports.friendListTabRefresh = void 0;
function friendListTabRefresh() {
    const listTab = document.getElementById("list-tab");
    const friendListTab = document.getElementById("friend_list_tab");
    const friendListLayout = document.getElementById("friend_list_layout");
    friendListLayout.classList.add("d-flex", "flex-column", "justify-content-start", "align-items-center", friendListTab.childElementCount >= 1);
    if (friendListTab.childElementCount === 0) {
        let p = document.createElement("p");
        p.setAttribute("id", "friend_list_info");
        p.classList.add("text-center", "mx-5", "pt-5", "pb-3", "fs-6");
        p.textContent =
            "Your friend list is currently empty, add a friend by clicking on the button below";
        listTab.append(p);
    }
}
exports.friendListTabRefresh = friendListTabRefresh;
function chatTabRefresh() {
    const chatTab = document.getElementById("chat_list_group");
    chatTab.classList.add("d-flex", "flex-column", "justify-content-center", chatTab.childElementCount >= 1);
    if (chatTab.children.length === 0) {
        let p = document.createElement("p");
        p.setAttribute("id", "chat_list_info");
        p.classList.add("text-center", "mx-5", "pt-5", "pb-3", "fs-6");
        p.textContent =
            "There are currently no messages in your inbox, if you want to start a chat, go to Friends tab and select a friend to start chatting";
        chatTab.append(p);
    }
}
exports.chatTabRefresh = chatTabRefresh;
function notificationsTabRefresh() {
    const notificationsTab = document.getElementById("notifications_rows");
    notificationsTab.classList.remove("my-auto", notificationsTab.childElementCount >= 1);
    if (notificationsTab.childElementCount === 0) {
        let p = document.createElement("p");
        p.setAttribute("id", "notification_info");
        p.classList.add("text-center", "mx-5", "pt-5", "pb-3", "fs-6");
        p.innerText =
            "There are no notifications at the moment, you will be notified if anything arrives here!";
        notificationsTab.append(p);
    }
}
exports.notificationsTabRefresh = notificationsTabRefresh;
//# sourceMappingURL=empty_tabs_controller.html.js.map