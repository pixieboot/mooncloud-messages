"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkIsNotAuthenticated = exports.checkIsAuthenticated = void 0;
function checkIsAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}
exports.checkIsAuthenticated = checkIsAuthenticated;
function checkIsNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect("/");
    }
    next();
}
exports.checkIsNotAuthenticated = checkIsNotAuthenticated;
//# sourceMappingURL=auth.controller.js.map