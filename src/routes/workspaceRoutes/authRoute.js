const express = require("express");
const router = express.Router();
const passport = require("passport");

const AuthController = require("../../controllers/workspaceControllers/authController");
const Middelwares = require("../../middelwares/authMiddelware");
const UploadMiddleware = require("../../middelwares/uploadMiddleware");

const failedUrl = `${process.env.FRONTEND_GOOGLE_CALLBACK_URL}?status=failure`;

// ===================== Start Auth Controller Routes ===============================

// router.post(
//   "/editProfile",
//   Middelwares.auth,
//   UploadMiddleware.single("image"),
//   AuthController.editProfile
// );
// router.post(
//   "/editUserProfile",
//   Middelwares.auth,
//   AuthController.editUserProfile
// );
// router.post(
//   "/updateProfileImage",
//   Middelwares.auth,
//   AuthController.updateProfileImage
// );
router.post("/updatePassword", Middelwares.auth, AuthController.updatePassword);
router.get("/userProfile", Middelwares.auth, AuthController.profile);
router.post("/updatePlayerId", Middelwares.auth, AuthController.updatePlayerId);
//======================= end Auth Controller Routes ===============================

router.use((req, res, next) => {
  res.status(504).json({ success: false, msg: ["Site Auth Invalid Routes!"] });
});

module.exports = router;
