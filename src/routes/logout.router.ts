import { Router } from "express";
import { checkIsNotAuthenticated } from "../controllers/auth.controller.js";
var router = Router();

// Logout
router.delete("/logout", (req, res, next) => {
    req.session.authenticated = false;
    req.logOut((err) => {
        if (err) return next(err);
        res.redirect("/");
    });
});

router.delete("/delete_account", (req, res, next) => {
    req.session.authenticated = false;
    req.logOut((err) => {
        if (err) return next(err);
        res.redirect("/");
    });
})

export const logoutRouter = router;
