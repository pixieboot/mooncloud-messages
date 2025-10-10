"use strict";
let url = window.location.pathname;
let userPattern = /^\/user\/(.*)/;
let match = url.match(userPattern);
if (url === "/") {
    document.title = "Mooncloud - Home";
}
if (url === "/login") {
    document.title = "Mooncloud - Login";
}
if (url === "/register") {
    document.title = "Mooncloud - Register";
}
if (match) {
    let userProfileName = match[1];
    document.title = "Mooncloud - Profile of " + userProfileName;
}
//# sourceMappingURL=title_controller.html.js.map