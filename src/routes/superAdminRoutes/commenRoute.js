const express = require("express");
const router = express.Router();
const CommenController = require("../../controllers/superAdminControllers/commenController");
const Middelwares = require("../../middelwares/authMiddelware");
const uploadMiddleware = require("../../middelwares/uploadMiddleware");
const uploadOnS3Middleware = require("../../middelwares/uploadOnS3Middleware");
const { uploadCSVMiddleware, uploadDataCsv } = require("../../middelwares/uploadCSVMiddleware");
router.get("/dashboard", Middelwares.auth, CommenController.dashboard);

router.post("/editAccessPermission", Middelwares.auth, CommenController.editAccessPermission);
router.get("/accessPermission", Middelwares.auth, CommenController.accessPermission);
router.get("/accessPermissions", Middelwares.auth, CommenController.accessPermissions);
router.get("/permissionIntial", Middelwares.auth, CommenController.permissionIntitals);

router.get("/permissions", Middelwares.auth, CommenController.permissions);
router.post("/deletePermission", Middelwares.auth, CommenController.deletePermission);
router.post("/activeDeactivePermission", Middelwares.auth, CommenController.activeDeactivePermission);
router.post("/addPermission", Middelwares.auth, CommenController.addPermission);
router.post("/editPermission", Middelwares.auth, CommenController.editPermission);

router.get("/features", Middelwares.auth, CommenController.features);
router.post("/deleteFeature", Middelwares.auth, CommenController.deleteFeature);
router.post("/activeDeactiveFeature", Middelwares.auth, CommenController.activeDeactiveFeature);
router.post("/addFeature", Middelwares.auth, CommenController.addFeature);
router.post("/editFeature", Middelwares.auth, CommenController.editFeature);
router.get("/allSubFeatures", Middelwares.auth, CommenController.allSubFeatures);
router.get("/subFeatures", Middelwares.auth, CommenController.subFeatures);
router.post("/deleteSubFeature", Middelwares.auth, CommenController.deleteSubFeature);
router.post("/activeDeactiveSubFeature", Middelwares.auth, CommenController.activeDeactiveSubFeature);
router.post("/addSubFeature", Middelwares.auth, CommenController.addSubFeature);
router.post("/editSubFeature", Middelwares.auth, CommenController.editSubFeature);
router.get("/subscriptionPlans", Middelwares.auth, CommenController.subscriptionPlans);
router.get("/subscriptionPlan", Middelwares.auth, CommenController.subscriptionPlan);
router.post("/deleteSubscriptionPlan", Middelwares.auth, CommenController.deleteSubscriptionPlan);
router.post("/activeDeactiveSubscriptionPlan", Middelwares.auth, CommenController.activeDeactiveSubscriptionPlan);
router.post("/subscriptionPlanShowFlagStatus", Middelwares.auth, CommenController.showFlagSubscriptionPlan);
router.post("/addSubscriptionPlan", Middelwares.auth, CommenController.addSubscriptionPlan);
router.post("/editSubscriptionPlan", Middelwares.auth, CommenController.editSubscriptionPlan);
router.get("/owners", Middelwares.auth, CommenController.getUsersAll);
router.get(
  "/buySubscriptionPlans",
  Middelwares.auth,
  CommenController.getBuySubscriptionPlans,
);

router.post("/upload", uploadMiddleware.single("file"), CommenController.uploadFile);
router.get("/myNotification", Middelwares.auth, CommenController.myNotification);
router.get("/myNotificationCount", Middelwares.auth, CommenController.myNotificationCount);
router.post("/deleteNotification", Middelwares.auth, CommenController.deleteNotification);
router.post("/clearNotification", Middelwares.auth, CommenController.clearNotification);
router.get("/getNotificationEmployeeAll", Middelwares.auth, CommenController.getNotificationEmployeeAll);
router.post("/sendAnnouncement", Middelwares.auth, CommenController.sendAnnouncement);
router.use((req, res, next) => {
  res.status(504).json({ success: false, msg: ["Super Admin Commen Invalid Routes!"] });
});

module.exports = router;
