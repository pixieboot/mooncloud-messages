"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.avatarValidation = void 0;
function avatarValidation(file) {
    let allowedTypes = ["image/jpg", "image/jpeg", "image/png", "image/gif"];
    let fileSize = file.size;
    let fileType = file.type;
    let validationMessage;
    if (allowedTypes.includes(fileType) === false) {
        validationMessage =
            "Incorrect image type, please choose an image with jpg, jpeg, png or gif extensions";
        return validationMessage;
    }
    if (fileSize > 2000000) {
        validationMessage =
            "Image size exceeded, please choose an image up to 2MB in size";
        return validationMessage;
    }
    return true;
}
exports.avatarValidation = avatarValidation;
//# sourceMappingURL=avatar_validation.html.js.map