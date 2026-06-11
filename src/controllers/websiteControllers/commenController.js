require("dotenv").config();
const CommenService = require("../../services/websiteServices/commenService");
const { body, query, validationResult } = require("express-validator");
const msg = require("../../helpers/languageMessageHelper");
const logger = require("../../helpers/loggerHelper");
const UserCommenService = require("../../services/workspaceServices/commenService");

module.exports = {
  // =========industry-controllers===========
  getCategoryIndustryController: [
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.deleteFlagReqired)
      .notEmpty()
      .withMessage(msg.deleteFlagReqired),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res
            .status(200)
            .json({ success: false, msg: errors.array()[0].msg });
        }
        const { deleteFlag } = req?.query;
        const categories = await CommenService.getCategoryIndustryService(
          Number(deleteFlag)
        );
        if (categories === "NA") {
          const record = {
            success: true,
            msg: msg.dataNotFound,
            data: { categories: [] },
          };
          return res.status(200).json(record);
        }
        const record = {
          success: true,
          msg: msg.dataFound,
          data: { categories: categories },
        };
        return res.status(200).json(record);
      } catch (error) {
        console.error(error);
        const record = {
          success: false,
          msg: msg.internalServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],

  // =========industry-controllers===========
  getIndustryController: [
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.deleteFlagReqired)
      .notEmpty()
      .withMessage(msg.deleteFlagReqired),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res
            .status(200)
            .json({ success: false, msg: errors.array()[0].msg });
        }

        const { deleteFlag } = req?.query;
        const grouped = await CommenService.getIndustryService(
          Number(deleteFlag)
        );
        if (grouped === "NA") {
          const record = {
            success: true,
            msg: msg.dataNotFound,
            data: { grouped: [] },
          };
          return res.status(200).json(record);
        }
        const record = {
          success: true,
          msg: msg.dataFound,
          data: { grouped: grouped },
        };
        return res.status(200).json(record);
      } catch (error) {
        console.error(error);
        const record = {
          success: false,
          msg: msg.internalServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],

  // =========role-desination-controllers===========
  getRoleDesinationController: [
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.deleteFlagReqired)
      .notEmpty()
      .withMessage(msg.deleteFlagReqired),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res
            .status(200)
            .json({ success: false, msg: errors.array()[0].msg });
        }

        const { deleteFlag } = req?.query;
        const roleDesination = await CommenService.getRoleDesinationService(
          Number(deleteFlag)
        );
        if (roleDesination === "NA") {
          const record = {
            success: true,
            msg: msg.dataNotFound,
            data: { roleDesination: [] },
          };
          return res.status(200).json(record);
        }
        const record = {
          success: true,
          msg: msg.dataFound,
          data: { roleDesination: roleDesination },
        };
        return res.status(200).json(record);
      } catch (error) {
        console.error(error);
        const record = {
          success: false,
          msg: msg.internalServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],

  // =========country-controllers===========
  getCountryController: [
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.deleteFlagReqired)
      .notEmpty()
      .withMessage(msg.deleteFlagReqired),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res
            .status(200)
            .json({ success: false, msg: errors.array()[0].msg });
        }
        const { deleteFlag } = req?.query;
        const countries = await CommenService.getCountryService(
          Number(deleteFlag)
        );
        if (countries === "NA") {
          const record = {
            success: true,
            msg: msg.dataNotFound,
            data: { countries: [] },
          };
          return res.status(200).json(record);
        }
        const record = {
          success: true,
          msg: msg.dataFound,
          data: { countries: countries },
        };
        return res.status(200).json(record);
      } catch (error) {
        console.error(error);
        const record = {
          success: false,
          msg: msg.internalServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],

  // =========feature-controllers===========
  getFeatureController: [
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.deleteFlagReqired)
      .notEmpty()
      .withMessage(msg.deleteFlagReqired),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res
            .status(200)
            .json({ success: false, msg: errors.array()[0].msg });
        }
        const { deleteFlag } = req?.query;
        const feature = await CommenService.getFeatureService(
          Number(deleteFlag)
        );
        if (feature === "NA") {
          const record = {
            success: true,
            msg: msg.dataNotFound,
            data: { feature: [] },
          };
          return res.status(200).json(record);
        }
        const record = {
          success: true,
          msg: msg.dataFound,
          data: { feature: feature },
        };
        return res.status(200).json(record);
      } catch (error) {
        logger.error("Database error getFeatureController ", { error });
        const record = {
          success: false,
          msg: msg.internalServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],

  // =========sub-feature-controllers===========
  getSubFeatureController: [
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.deleteFlagReqired)
      .notEmpty()
      .withMessage(msg.deleteFlagReqired),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res
            .status(400)
            .json({ success: false, msg: errors.array()[0].msg });
        }

        const { deleteFlag } = req?.query;
        const subFeature = await CommenService.getSubFeatureService(
          Number(deleteFlag)
        );
        if (subFeature === "NA") {
          const record = {
            success: true,
            msg: msg.dataNotFound,
            data: { subFeature: [] },
          };
          return res.status(200).json(record);
        }
        const record = {
          success: true,
          msg: msg.dataFound,
          data: { subFeature: subFeature },
        };
        return res.status(200).json(record);
      } catch (error) {
        console.error(error);
        const record = {
          success: false,
          msg: msg.internalServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],

  // =========subscription-plan-controllers===========
  getSubscriptionPlanController: [
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.deleteFlagReqired)
      .notEmpty()
      .withMessage(msg.deleteFlagReqired),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res
            .status(400)
            .json({ success: false, msg: errors.array()[0].msg });
        }

        const { deleteFlag } = req?.query;
        const plans = await CommenService.getSubscriptionPlanService(
          Number(deleteFlag)
        );
        if (plans === "NA") {
          const record = {
            success: true,
            msg: msg.dataNotFound,
            data: { plans: [] },
          };
          return res.status(200).json(record);
        }
        const record = {
          success: true,
          msg: msg.dataFound,
          data: { plans: plans },
        };
        return res.status(200).json(record);
      } catch (error) {
        console.error(error);
        const record = {
          success: false,
          msg: msg.internalServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],

  getSubscriptionPlanByPlanCategoryController: [
    query("planCategory")
      .trim()
      .exists()
      .withMessage(msg.planCategoryRequired)
      .notEmpty()
      .withMessage(msg.planCategoryRequired),

    query("businessType")
      .optional()
      .trim()
      .isIn(["Individual", "Business"])
      .withMessage(msg.invalidBusinessType),

    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res
            .status(400)
            .json({ success: false, msg: errors.array()[0].msg });
        }

        const { planCategory } = req.query;

        const plans =
          await CommenService.getSubscriptionPlanByPlanCategoryService(
            planCategory
          );
        if (plans === "NA") {
          const record = {
            success: true,
            msg: msg.dataNotFound,
            data: { plans: [] },
          };
          return res.status(200).json(record);
        }
        const record = {
          success: true,
          msg: msg.dataFound,
          data: { plans: plans },
        };
        return res.status(200).json(record);
      } catch (error) {
        console.error(error);
        console.error(error);
        const record = {
          success: false,
          msg: msg.internalServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],

  getPlanFeatureSubFeatureListController: [
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.deleteFlagReqired)
      .notEmpty()
      .withMessage(msg.deleteFlagReqired),
    query("planCategory")
      .trim()
      .exists()
      .withMessage(msg.subscriptionCategoryIdIsRequired)
      .notEmpty()
      .withMessage(msg.subscriptionCategoryIdIsRequired),

    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res
            .status(400)
            .json({ success: false, msg: errors.array()[0].msg });
        }

        const { deleteFlag, planCategory } = req.query;

        const planFeature =
          await CommenService.getPlanFeatureSubFeatureListService(
            Number(deleteFlag),
            planCategory
          );
        if (planFeature === "NA") {
          const record = {
            success: true,
            msg: msg.dataNotFound,
            data: { planFeature: [] },
          };
          return res.status(200).json(record);
        }
        const record = {
          success: true,
          msg: msg.dataFound,
          data: { planFeature: planFeature },
        };
        return res.status(200).json(record);
      } catch (error) {
        console.error(error);
        console.error(error);
        const record = {
          success: false,
          msg: msg.internalServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],

  // =========employee-range-controllers===========
  getEmployeeRangeController: [
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.deleteFlagReqired)
      .notEmpty()
      .withMessage(msg.deleteFlagReqired),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res
            .status(200)
            .json({ success: false, msg: errors.array()[0].msg });
        }
        const { deleteFlag } = req?.query;
        const employeeRange = await CommenService.getEmployeeRangeService(
          Number(deleteFlag)
        );
        if (employeeRange === "NA") {
          const record = {
            success: true,
            msg: msg.dataNotFound,
            data: { employeeRange: [] },
          };
          return res.status(200).json(record);
        }
        const record = {
          success: true,
          msg: msg.dataFound,
          data: { employeeRange: employeeRange },
        };
        return res.status(200).json(record);
      } catch (error) {
        logger.error("Database error getEmployeeRangeController ", { error });
        const record = {
          success: false,
          msg: msg.internalServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],

  // =========faq-controllers===========
  getFaqController: [
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.deleteFlagReqired)
      .notEmpty()
      .withMessage(msg.deleteFlagReqired),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res
            .status(200)
            .json({ success: false, msg: errors.array()[0].msg });
        }
        const { deleteFlag } = req?.query;
        const faq = await CommenService.getFaqService(Number(deleteFlag));
        if (faq === "NA") {
          const record = {
            success: true,
            msg: msg.dataNotFound,
            data: { faq: [] },
          };
          return res.status(200).json(record);
        }
        const record = {
          success: true,
          msg: msg.dataFound,
          data: { faq: faq },
        };
        return res.status(200).json(record);
      } catch (error) {
        logger.error("Database error getFeatureController ", { error });
        const record = {
          success: false,
          msg: msg.internalServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],

  // =========Content-controllers===========
  getContentController: [
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.deleteFlagReqired)
      .notEmpty()
      .withMessage(msg.deleteFlagReqired),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res
            .status(200)
            .json({ success: false, msg: errors.array()[0].msg });
        }
        const { deleteFlag } = req?.query;
        const content = await CommenService.getContentService(
          Number(deleteFlag)
        );
        if (content === "NA") {
          const record = {
            success: true,
            msg: msg.dataNotFound,
            data: { content: [] },
          };
          return res.status(200).json(record);
        }
        const record = {
          success: true,
          msg: msg.dataFound,
          data: { content: content },
        };
        return res.status(200).json(record);
      } catch (error) {
        logger.error("Database error getContentController ", { error });
        const record = {
          success: false,
          msg: msg.internalServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],

  // =========check-email-company-routes===========
  checkEmailController: [
    body("email")
      .exists()
      .withMessage(msg.msgEmailReqired)
      .notEmpty()
      .withMessage(msg.msgEmailReqired)
      .isEmail()
      .withMessage(msg.msgEmailInvalidFormat),

    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(200).json({
            success: false,
            msg: errors.array()[0].msg,
          });
        }

        const { email } = req.body;
        const checkEmail = await CommenService.checkEmailService(email);

        if (checkEmail !== "NA") {
          return res.status(200).json({
            success: false,
            msg: msg.thisEmailAlreadyExists,
            key: 1,
          });
        } else {
          return res.status(200).json({
            success: true,
            msg: msg.thisEmailNotExists,
            key: 1,
          });
        }
      } catch (error) {
        logger.error("Database error in checkEmailController application", {
          error,
        });
        return res.status(500).json({
          success: false,
          msg: msg.internalServerError,
          key: error,
        });
      }
    },
  ],

  checkCompanyController: [
    body("companyName")
      .trim()
      .exists()
      .withMessage(msg.companyNameIsRequired)
      .notEmpty()
      .withMessage(msg.companyNameIsRequired),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(200).json({
            success: false,
            msg: errors.array()[0].msg,
          });
        }

        const { companyName } = req.body;
        const checkCompany = await CommenService.checkCompanyService(
          companyName
        );

        if (checkCompany !== "NA") {
          return res.status(200).json({
            success: false,
            msg: msg.thisCompanyNameAlreadyExists,
            key: 1,
          });
        } else {
          return res.status(200).json({
            success: true,
            msg: msg.thisCompanyNameNotExists,
            key: 1,
          });
        }
      } catch (error) {
        logger.error("Database error in checkCompanyController application", {
          error,
        });
        return res.status(500).json({
          success: false,
          msg: msg.internalServerError,
          key: error,
        });
      }
    },
  ],

  // =========roles-accesspermissions-controllers===========
  getRolesAccesspermissionsController: [
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.deleteFlagReqired)
      .notEmpty()
      .withMessage(msg.deleteFlagReqired),
    async (req, res) => {
      try {
        const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
        const CURRENT_USER = req?.CURRENT_USER;

        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res
            .status(200)
            .json({ success: false, msg: errors.array()[0].msg });
        }

        const { deleteFlag } = req?.query;
        const rolesAccesspermissions =
          await CommenService.getRolesAccesspermissionsService(
            Number(deleteFlag)
          );

        if (rolesAccesspermissions === "NA") {
          const record = {
            success: true,
            msg: msg.dataNotFound,
            data: { rolesAccesspermissions: [] },
          };
          return res.status(200).json(record);
        }

        // Map with Promise.all to resolve async calls
        const rolesAccesspermissionsFilter = await Promise.all(
          rolesAccesspermissions.map(async (rolesAccesspermission) => {
            const accessData =
              await UserCommenService.getAccessLevelFeatureAccordingToSubscription(
                SITE_DB_NAME,
                rolesAccesspermission.accessLevel,
                CURRENT_USER?.workspaceId
              );
            rolesAccesspermission.accessLevel = accessData?.accessLevel || [];
            return rolesAccesspermission;
          })
        );

        const record = {
          success: true,
          msg: msg.dataFound,
          data: { rolesAccesspermissions: rolesAccesspermissionsFilter },
        };
        return res.status(200).json(record);
      } catch (error) {
        logger.error("Database error getRolesAccesspermissionsController ", {
          error,
        });
        const record = {
          success: false,
          msg: msg.internalServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],
  // =========roles-accesspreferences-controllers===========
  getRolesAccesspreferencesController: [
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.deleteFlagReqired)
      .notEmpty()
      .withMessage(msg.deleteFlagReqired),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res
            .status(200)
            .json({ success: false, msg: errors.array()[0].msg });
        }
        const { deleteFlag } = req?.query;
        const rolesAccesspreferences =
          await CommenService.getRolesAccesspreferencesService(
            Number(deleteFlag)
          );
        if (rolesAccesspreferences === "NA") {
          const record = {
            success: true,
            msg: msg.dataNotFound,
            data: { rolesAccesspreferences: [] },
          };
          return res.status(200).json(record);
        }
        const record = {
          success: true,
          msg: msg.dataFound,
          data: { rolesAccesspreferences: rolesAccesspreferences },
        };
        return res.status(200).json(record);
      } catch (error) {
        logger.error("Database error getRolesAccesspreferencesController ", {
          error,
        });
        const record = {
          success: false,
          msg: msg.internalServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],

  workspaceInfoController: [
    async (req, res) => {
      try {
        const workspaceId = req.CURRENT_SITE_WORKSPACE_ID;
        if (!workspaceId) {
          return res.status(200).json({
            success: false,
            msg: msg.msgWorkspaceDomainIsRequired,
          });
        }

        try {
          const workspaceInfo = await CommenService.getWorkspaceInfoService(
            workspaceId
          );
          if (workspaceInfo === "NA") {
            const record = {
              success: true,
              msg: msg.dataNotFound,
              data: { workspaceInfo: [] },
            };
            return res.status(200).json(record);
          }
          const record = {
            success: true,
            msg: msg.dataFound,
            data: { workspaceInfo: workspaceInfo },
          };
          return res.status(200).json(record);
        } catch (error) {
          logger.error(
            "Database error in workspaceInfoController application",
            {
              error,
            }
          );
          return res.status(500).json({
            success: false,
            msg: msg.internalServerError,
            key: error,
          });
        }
      } catch (error) {
        logger.error("Database error in workspaceInfoController application", {
          error,
        });
        return res.status(500).json({
          success: false,
          msg: msg.internalServerError,
          key: error,
        });
      }
    },
  ],

  getCountries: [
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.msgUnitIdReqired)
      .notEmpty()
      .withMessage(msg.msgUnitIdReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }

      const { deleteFlag } = req.query;
      try {
        const countries = await CommenService.getCountries(Number(deleteFlag));
        const record = {
          success: true,
          msg: msg.msgDataFound,
          data: { countries: countries },
        };
        return res.status(200).json(record);
      } catch (error) {
        logger.error("Database error countries ", { error });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],
};
