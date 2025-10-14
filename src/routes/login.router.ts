import { Router } from "express";
import passport from "passport";
import sanitizeHtml from "sanitize-html";
import { localUserModel } from "../database/schemas/local_user.schema.js";
import { Bcrypt } from "../public/utils/bcrypt.util.js";

var router = Router();

// Login
router.post("/login", async (req, res, next) => {
    const email_or_username = sanitizeHtml(req.body.email_or_username);
    const password = sanitizeHtml(req.body.login_password);

    if (email_or_username.length <= 0) {
        req.flash("warning_email", "Email field cannot be empty");
        return res.redirect(301, "/login");
    }

    if (password.length <= 0) {
        req.flash("warning_password", "Password field cannot be empty");
        return res.redirect(301, "/login");
    }

    const localUser = await localUserModel.findOne({
        $or: [{ email: email_or_username }, { username: email_or_username }],
    });
    if (localUser) {
        if (localUser.status === "deleted") {
            req.flash(
                "error_input",
                "Couldn't find an account with this email or username!"
            );
            return res.redirect(301, "/login");
        }
    }
    if (!localUser) {
        req.flash(
            "error_input",
            "Couldn't find an account with this email or username!"
        );
        return res.redirect(301, "/login");
    }

    const isValid = Bcrypt.comparePasswords(password, localUser?.password);
    if (!isValid) {
        req.flash("error_input", "Wrong username or password!");
        return res.redirect(301, "/login");
    } else {
        req.session.authenticated = true;
        passport.authenticate("local", {
            successRedirect: "/",
            failureRedirect: "/login",
            failureFlash: true,
        })(req, res, next)
    }
});

export const loginRouter = router;
