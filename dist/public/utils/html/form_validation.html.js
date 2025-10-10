"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const avatar_validation_html_js_1 = require("./avatar_validation.html.js");
const char_checker_html_js_1 = require("./char_checker.html.js");
// Form validation
let fields = document.querySelectorAll("#signup-modal input");
let nextBtn = document.getElementById("nextBtn");
let passwordErrorMsg = document.getElementById("password_error_msg");
let passwordSuccessMsg = document.getElementById("password_success_msg");
let confirmPasswordErrorMsg = document.getElementById("confirm_password_error_msg");
let confirmPasswordSuccessMsg = document.getElementById("confirm_password_success_msg");
let emailErrorMsg = document.getElementById("email_error_msg");
let usernameField = document.getElementById("username");
let submitBtn = document.getElementById("submit_finish_btn");
let usernameSuccessMsg = document.getElementById("username_success_msg");
let usernameErrorMsg = document.getElementById("username_error_msg");
const fieldsArray = Array.from(fields);
// Fields input validation
for (let i = 0; i < fieldsArray.length; i++) {
    fieldsArray[i].addEventListener("keyup", () => {
        let emailField = fieldsArray[0].value.trim();
        let passwordField = fieldsArray[1].value.trim();
        let confirmPasswordField = fieldsArray[2].value.trim();
        let isEmailValidated = emailValidation(emailField);
        let isPasswordValidated = passwordValidation(passwordField, confirmPasswordField);
        if (isEmailValidated === true && isPasswordValidated === true) {
            nextBtn.disabled = false;
        }
        else {
            nextBtn.disabled = true;
        }
    });
}
// Email validation
let emailValidation = (email) => {
    if (email.search(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/) < 0) {
        emailErrorMsg.textContent = "This email address is not valid";
        return false;
    }
    else {
        emailErrorMsg.textContent = "";
        return true;
    }
};
// Password validation
let passwordValidation = (password, confirm_password) => {
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
        passwordErrorMsg.textContent = errors[0];
        passwordSuccessMsg.textContent = "";
        return false;
    }
    if (errors.length === 0) {
        passwordErrorMsg.textContent = "";
        passwordSuccessMsg.textContent = "Looks good!";
        if (password != confirm_password) {
            confirmPasswordSuccessMsg.textContent = "";
            confirmPasswordErrorMsg.textContent = "Your passwords do not match!";
            return false;
        }
        else {
            confirmPasswordErrorMsg.textContent = "";
            confirmPasswordSuccessMsg.textContent = "Your passwords match!";
            return true;
        }
    }
};
// Username validation
usernameField.addEventListener("keyup", (e) => {
    let username = e.target.value.trim();
    let isUsernameValidated = usernameValidation(username);
    if (isUsernameValidated === true) {
        submitBtn.disabled = false;
    }
    else {
        submitBtn.disabled = true;
    }
});
let usernameValidation = (username) => {
    let isUsernameValidated = (0, char_checker_html_js_1.checkIfItsAlphabeticalOrNumeralChar)(username);
    if (isUsernameValidated === null) {
        usernameSuccessMsg.textContent = "";
        usernameErrorMsg.textContent =
            "Username cannot contain white space characters";
        return false;
    }
    if (isUsernameValidated === false) {
        usernameSuccessMsg.textContent = "";
        usernameErrorMsg.textContent = "Username cannot contain special characters";
        return false;
    }
    else if (!isUsernameValidated === false) {
        usernameSuccessMsg.textContent = "";
        usernameErrorMsg.textContent =
            "Username cannot contain uppercase characters";
        return false;
    }
    else if (username.length <= 2) {
        usernameSuccessMsg.textContent = "";
        usernameErrorMsg.textContent =
            "Username must be at least 3 characters long";
        return false;
    }
    else if (username.length > 16) {
        usernameSuccessMsg.textContent = "";
        usernameErrorMsg.textContent = "Username can have maximum of 16 characters";
        return false;
    }
    else {
        usernameSuccessMsg.textContent = "Looks good!";
        usernameErrorMsg.textContent = "";
        return true;
    }
};
// Function for pre-loading avatar on client side
let avatarPreview = document.getElementById("avatar_preview");
let uploadedUserAvatar = document.getElementById("upload_user_avatar");
let avatarErrorMessage = document.getElementById("avatar_error_message");
let removeAvatarPreview = document.getElementById("remove_avatar_preview");
uploadedUserAvatar.addEventListener("change", () => {
    preloadAvatar(uploadedUserAvatar, avatarPreview);
});
removeAvatarPreview.addEventListener("click", () => {
    avatarPreview.src = "assets/users/default/default_user_avatar.jpg";
});
let preloadAvatar = (upload_user_avatar, avatar_preview) => {
    let file = upload_user_avatar.files[0];
    let reader = new FileReader();
    let isValidated = (0, avatar_validation_html_js_1.avatarValidation)(file);
    if (isValidated === true) {
        reader.readAsDataURL(file);
        reader.onload = () => {
            avatar_preview.src = reader.result;
        };
    }
    else {
        avatarErrorMessage.textContent = isValidated;
    }
};
// Toggles password visibility on button click
let password = document.getElementById("password");
let confirm_password = document.getElementById("confirm_password");
let toggler = document.getElementById("show_password");
const togglePasswordVisibility = () => {
    if (password.type == "password") {
        password.setAttribute("type", "text");
        confirm_password.setAttribute("type", "text");
        toggler.classList.remove("fa-eye");
        toggler.classList.add("fa-eye-slash");
    }
    else {
        toggler.classList.remove("fa-eye-slash");
        toggler.classList.add("fa-eye");
        password.setAttribute("type", "password");
        confirm_password.setAttribute("type", "password");
    }
};
toggler.addEventListener("click", togglePasswordVisibility);
// Shop bootstrap popover on click
const password_popover = document.getElementById("password_popover");
window.addEventListener("DOMContentLoaded", () => {
    new bootstrap.Popover(password_popover);
});
//# sourceMappingURL=form_validation.html.js.map