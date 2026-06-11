const express = require("express");
const router = express.Router();
const CommenController = require("../../controllers/websiteControllers/commenController");
const Middelwares = require("../../middelwares/authMiddelware");
const uploadMiddleware = require("../../middelwares/uploadMiddleware");
// =========category-industry-routes===========

router.get(
  "/get-category-industry-list",
  CommenController.getCategoryIndustryController
);

// =========industry-routes===========

router.get("/get-industry-list", CommenController.getIndustryController);

// =========role-desination-routes===========

router.get(
  "/get-role-desination",
  CommenController.getRoleDesinationController
);

// =========country-routes===========

router.get("/get-country", CommenController.getCountryController);

// =========feature-routes===========

router.get("/get-feature", CommenController.getFeatureController);

// =========sub-feature-routes===========

router.get("/get-subFeature", CommenController.getSubFeatureController);

// =========subscription-plan-routes===========

router.get(
  "/get-subscription-plan",
  CommenController.getSubscriptionPlanController
);

router.get(
  "/get-subscription-plan-by-category",
  CommenController.getSubscriptionPlanByPlanCategoryController
);

router.get(
  "/get-plan-feature-subFeature-list",
  CommenController.getPlanFeatureSubFeatureListController
);

// =========employee-range-routes===========

router.get("/get-employee-range", CommenController.getEmployeeRangeController);

// =========faq-routes===========

router.get("/get-faq", CommenController.getFaqController);

// =========content-routes===========

router.get("/get-content", CommenController.getContentController);

// =========check-email-company-routes===========
router.post("/check-email", CommenController.checkEmailController);
router.post("/check-company", CommenController.checkCompanyController);

// =========roles-accesspermissions===========
router.get(
  "/get-roles-accesspermissions",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getRolesAccesspermissionsController
);

// =========roles-accesspreferences===========
router.get(
  "/get-roles-accesspreferences",
  Middelwares.originAuth,
  Middelwares.siteAuth,
  CommenController.getRolesAccesspreferencesController
);

// =========workspace-info===========
router.get(
  "/workspace-info",
  Middelwares.originAuth,
  CommenController.workspaceInfoController
);


router.get("/countries", CommenController.getCountries);

router.use((req, res, next) => {
  res
    .status(504)
    .json({ success: false, msg: ["website Commen Invalid Routes!"] });
});
module.exports = router;
