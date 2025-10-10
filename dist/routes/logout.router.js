"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutRouter = void 0;
const express_1 = require("express");
var router = (0, express_1.Router)();
// Logout
router.delete("/logout", (req, res, next) => {
    req.session.authenticated = false;
    req.logOut((err) => {
        if (err)
            return next(err);
        res.redirect("/");
    });
});
router.delete("/delete_account", (req, res, next) => {
    req.session.authenticated = false;
    req.logOut((err) => {
        if (err)
            return next(err);
        res.redirect("/");
    });
});
exports.logoutRouter = router;
//# sourceMappingURL=logout.router.js.map