const express = require("express");
const router = express.Router();

const AuthController = require("../../controllers/superAdminControllers/authController");
const Middelwares = require("../../middelwares/authMiddelware");
const UploadMiddleware = require("../../middelwares/uploadMiddleware");
// ===================== Start Auth Controller Routes ===============================
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
router.get("/listDns", Middelwares.auth, AuthController.listDns);
router.get("/getDns", Middelwares.auth, AuthController.getDns);
router.post("/updateDns", Middelwares.auth, AuthController.updateDns);
router.post("/deleteDns", Middelwares.auth, AuthController.deleteDns);

//======================= end Auth Controller Routes ===============================
router.use((req, res, next) => {
  res.status(504).json({ success: false, msg: ["Super Admin Auth Invalid Routes!"] });
});

module.exports = router;
