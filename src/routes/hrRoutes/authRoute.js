const express = require("express");
const router = express.Router();

const AuthController = require("../../controllers/hrControllers/authController");
const Middelwares = require("../../middelwares/hrAuthMiddelware");
const UploadMiddleware = require("../../middelwares/uploadMiddleware");
// ===================== Start Auth Controller Routes ===============================
router.post("/punch", AuthController.punch);
router.post("/signIn", AuthController.signIn);
router.post("/forgotPassword", AuthController.forgotPassword);
router.post("/resetPassword", AuthController.resetPassword);
router.post("/verifyToken", Middelwares.auth, AuthController.verifyToken);
router.get("/profile", Middelwares.auth, AuthController.getProfile);
router.post("/editProfile", Middelwares.auth, UploadMiddleware.single("image"), AuthController.editProfile);
router.post("/editUserProfile", Middelwares.auth, AuthController.editUserProfile);
router.post("/updateProfileImage", Middelwares.auth, AuthController.updateProfileImage);
router.post("/updatePassword", Middelwares.auth, AuthController.updatePassword);
router.get("/userProfile", Middelwares.auth, AuthController.profile);
router.post("/updatePlayerId", Middelwares.auth, AuthController.updatePlayerId);
router.post("/generate2FA", Middelwares.auth, AuthController.generate2FA);
router.post("/verify2FASetup", Middelwares.auth, AuthController.verify2FASetup);
router.post("/verify2FALogin", Middelwares.getAppAuth2F, AuthController.verify2FALogin);
//======================= end Auth Controller Routes ===============================
router.use((req, res, next) => {
  res.status(504).json({ success: false, msg: ["Auth Invalid Routes!"] });
});

module.exports = router;
