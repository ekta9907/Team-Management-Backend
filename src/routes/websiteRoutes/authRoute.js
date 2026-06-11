const express = require("express");
const AuthController = require("../../controllers/websiteControllers/authController");
const Middelwares = require("../../middelwares/authMiddelware");
const UploadMiddleware = require("../../middelwares/uploadMiddleware");
const router = express.Router();
// router.post("/signIn", AuthController.signIn);
router.post("/check-email", AuthController.checkEmail);
router.post("/sign-up", AuthController.signup);
router.post("/otp-verify", AuthController.otpVerify);
router.post("/resend-otp", AuthController.otpResend);
router.post("/check-company", AuthController.checkWorkspaceDomain);
router.post("/sign-up-step2", AuthController.signupStep2);
router.post("/login", Middelwares.originAuth, AuthController.login);
router.post("/forgot-password", Middelwares.originAuth, AuthController.forgotPassword);
router.post("/forgot-otp-verify", Middelwares.originAuth, AuthController.forgotPasswordOtpVerify);
router.post("/forgot-resend-otp", Middelwares.originAuth, AuthController.forgotPasswordOtpResend);
router.post("/reset-password", Middelwares.originAuth, AuthController.resetPassword);

router.post("/generate2FA", Middelwares.originAuth, Middelwares.siteAuth, AuthController.generate2FA);
router.post("/verify2FASetup", Middelwares.originAuth, Middelwares.siteAuth, AuthController.verify2FASetup);
router.post("/verify2FALogin", Middelwares.originAuth, Middelwares.getAppSiteAuth2F, AuthController.verify2FALogin);

router.post("/punch", Middelwares.originAuth, AuthController.punch);

router.use((req, res, next) => {
  res.status(504).json({ success: false, msg: ["website auth Invalid Routes!"] });
});
module.exports = router;
