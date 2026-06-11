//====================================== File return ===========================
require("dotenv").config();
const ExcelJS = require("exceljs");

const workbook = new ExcelJS.Workbook();
const sheet = workbook.addWorksheet("Attendance");
const msg = require("../../helpers/languageMessageHelper");
const axios = require("axios");
const CommenService = require("../../services/superAdminServices/commenService");
const moment = require("moment");
require("moment-duration-format");
const { body, query, validationResult } = require("express-validator");
const logger = require("../../helpers/loggerHelper");
const OneSignalHelper = require("../../helpers/oneSignalHelper");
const Feature = require("../../models/superAdminModels/featureModel");

//====================================== File ===========================
const uploadFile = async (req, res) => {
  if (!req.file && !req.file?.filename) {
    const record = { success: false, msg: msg.msgUploadFileError, key: 3 };
    return res.status(200).json(record);
  }
  const record = { success: true, msg: msg.msgUploadFileSuccess, fileName: req.folderName + "/" + req.file.filename, file: req.file };
  return res.status(200).json(record);
};
//====================================== dashboard===========================

const dashboard = [
  //  validation
  query("dayMonthYear").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      if (!req.currentUserId) {
        return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
      }
      if (!req.currentUser) {
        return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
      } else {
        try {
          const workspaceOwnerCount = await CommenService.getWorkspaceOwnerCount(0);
          const subscriptionPlanCount = await CommenService.getSubscriptionPlanCount(0);
          const record = {
            success: true,
            msg: msg.msgDataFound,
            data: { subscriptionPlanCount, workspaceOwnerCount },
          };
          return res.status(200).json(record);
        } catch (error) {
          logger.error("Database error in dashboard emp 2", { error });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      }
    }
  },
];

const features = [
  query("deleteFlag").trim().exists().withMessage(msg.msgUnitIdReqired).notEmpty().withMessage(msg.msgUnitIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    }

    const { deleteFlag } = req.query;
    try {
      const features = await CommenService.getFeatures(Number(deleteFlag));
      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { features: features },
      };
      return res.status(200).json(record);
    } catch (error) {
      logger.error("Database error features ", { error });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];

const addFeature = [
  body("name").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("keyName").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { name, keyName } = req.body;

        const checkFeatureName = await CommenService.checkFeatureName(name, keyName);
        if (checkFeatureName !== "NA") {
          const record = {
            success: false,
            msg: msg.msgFeatureExist,
          };
          return res.status(200).json(record);
        }
        const data = { name, keyName };
        try {
          const addFeature = await CommenService.addFeature(data);
          if (addFeature === "NA") {
            const record = {
              success: false,
              msg: msg.msgFeatureAddError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgFeatureAddSuccess,
              data: { feature: addFeature },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          logger.error("addFeature error database ", { error, message: error.message, key: 1 });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("addFeature error database ", { error, message: error.message, key: 2 });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const editFeature = [
  //  validation

  body("name").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("featureId").trim().exists().withMessage(msg.msgFeatureIdReqired).notEmpty().withMessage(msg.msgFeatureIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { name, featureId } = req.body;

        const checkFeature = await CommenService.checkFeature(featureId);
        if (checkFeature === "NA") {
          const record = {
            success: false,
            msg: msg.msgFeatureNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const checkFeatureWithName = await CommenService.checkFeatureWithName(featureId, name);
          if (checkFeatureWithName !== "NA") {
            const record = {
              success: false,
              msg: msg.msgFeatureExist,
            };
            return res.status(200).json(record);
          }
          const data = { name };
          try {
            const editFeature = await CommenService.editFeature(featureId, data);
            if (editFeature === "NA") {
              const record = {
                success: false,
                msg: msg.msgFeatureUpdateError,
              };
              return res.status(200).json(record);
            } else {
              const record = {
                success: true,
                msg: msg.msgFeatureUpdateSuccess,
                data: { feature: editFeature },
              };
              return res.status(200).json(record);
            }
          } catch (error) {
            logger.error("editFeature error database ", { error, message: error.message, key: 0 });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: error,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("editFeature error database ", { error, message: error.message, key: 1 });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("editFeature error database ", { error, message: error.message, key: 2 });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const activeDeactiveFeature = [
  //  validation
  body("featureId").exists().withMessage(msg.msgFeatureIdReqired).notEmpty().withMessage(msg.msgFeatureIdReqired),
  body("activeFlag").trim().exists().withMessage(msg.msgActiveFlagReqired).notEmpty().withMessage(msg.msgActiveFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { featureId, activeFlag } = req.body;
        const checkFeature = await CommenService.checkFeature(featureId);
        if (checkFeature === "NA") {
          const record = {
            success: false,
            msg: msg.msgFeatureNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          let activeDeactiveFlag = 0;
          if (activeFlag === "0") {
            activeDeactiveFlag = 1;
          } else {
            activeDeactiveFlag = 0;
          }
          const activeDeactiveFeature = await CommenService.activeDeactiveFeature(featureId, activeDeactiveFlag);
          if (activeDeactiveFeature === 0) {
            const record = {
              success: false,
              msg: msg.msgFeatureUpdateError,
            };
            return res.status(200).json(record);
          } else {
            if (activeFlag === "0") {
              const record = {
                success: true,
                msg: msg.msgFeatureActiveSuccess,
                data: { feature: activeDeactiveFeature },
              };
              return res.status(200).json(record);
            } else {
              const record = {
                success: true,
                msg: msg.msgFeatureDeactiveSuccess,
                data: { Feature: activeDeactiveFeature },
              };
              return res.status(200).json(record);
            }
          }
        } catch (error) {
          logger.error("activeDeactiveFeature error database ", { error, message: error.message, key: 1 });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("activeDeactiveFeature error database ", { error, message: error.message, key: 2 });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const deleteFeature = [
  //  validation
  body("featureId").trim().exists().withMessage(msg.msgFeatureIdReqired).notEmpty().withMessage(msg.msgFeatureIdReqired),
  body("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { featureId, deleteFlag } = req.body;

        const checkFeature = await CommenService.checkFeature(featureId);
        if (checkFeature === "NA") {
          const record = {
            success: false,
            msg: msg.msgFeatureNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const deleteFeature = await CommenService.deleteFeature(featureId, deleteFlag);
          if (deleteFeature === 0) {
            const record = {
              success: false,
              msg: msg.msgFeatureDeleteError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgFeatureDeleteSuccess,
              data: { feature: deleteFeature },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          logger.error("activeDeactiveFeature error database ", { error, message: error.message, key: 1 });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("activeDeactiveFeature error database ", { error, message: error.message, key: 2 });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

//======================================= subFeatures =============================================
const subFeatures = [
  query("featureId").exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  query("deleteFlag").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    }

    const { featureId, deleteFlag } = req.query;
    try {
      const subFeatures = await CommenService.getSubFeatures(featureId, Number(deleteFlag));
      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { subFeatures: subFeatures },
      };
      return res.status(200).json(record);
    } catch (error) {
      logger.error("Database error subFeatures ", { error });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const allSubFeatures = [
  query("deleteFlag").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    }

    const { deleteFlag } = req.query;
    try {
      const subFeatures = await CommenService.getAllSubFeatures(Number(deleteFlag));
      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { subFeatures: subFeatures },
      };
      return res.status(200).json(record);
    } catch (error) {
      logger.error("Database error subFeatures ", { error });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];

const addSubFeature = [
  body("featureId").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("name").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("keyName").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("valueType").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { featureId, name, keyName, valueType } = req.body;

        const checkSubFeatureName = await CommenService.checkSubFeatureName(featureId, name, keyName);
        if (checkSubFeatureName !== "NA") {
          const record = {
            success: false,
            msg: msg.msgSubFeatureExist,
          };
          return res.status(200).json(record);
        }
        const data = { featureId, name, keyName, valueType };
        try {
          const addSubFeature = await CommenService.addSubFeature(data);
          if (addSubFeature === "NA") {
            const record = {
              success: false,
              msg: msg.msgSubFeatureAddError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgSubFeatureAddSuccess,
              data: { subFeature: addSubFeature },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          logger.error("addSubFeature error database ", { error, message: error.message, key: 1 });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("addSubFeature error database ", { error, message: error.message, key: 2 });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const editSubFeature = [
  //  validation
  body("featureId").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("valueType").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("name").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("subFeatureId").trim().exists().withMessage(msg.msgFeatureIdReqired).notEmpty().withMessage(msg.msgFeatureIdReqired),
  body("keyName").trim().exists().withMessage(msg.msgFeatureIdReqired).notEmpty().withMessage(msg.msgFeatureIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { subFeatureId, name, featureId, valueType, keyName } = req.body;

        const checkSubFeature = await CommenService.checkSubFeature(subFeatureId);
        if (checkSubFeature === "NA") {
          const record = {
            success: false,
            msg: msg.msgSubFeatureNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const checkSubFeatureWithName = await CommenService.checkSubFeatureWithName(subFeatureId, featureId, name);
          if (checkSubFeatureWithName !== "NA") {
            const record = {
              success: false,
              msg: msg.msgSubFeatureExist,
            };
            return res.status(200).json(record);
          }
          const data = { name, featureId, valueType, keyName };
          try {
            const editSubFeature = await CommenService.editSubFeature(subFeatureId, data);
            if (editSubFeature === "NA") {
              const record = {
                success: false,
                msg: msg.msgSubFeatureUpdateError,
              };
              return res.status(200).json(record);
            } else {
              const record = {
                success: true,
                msg: msg.msgSubFeatureUpdateSuccess,
                data: { subFeature: editSubFeature },
              };
              return res.status(200).json(record);
            }
          } catch (error) {
            logger.error("editSubFeature error database ", { error, message: error.message, key: 0 });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: error,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("editSubFeature error database ", { error, message: error.message, key: 1 });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("editSubFeature error database ", { error, message: error.message, key: 2 });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const activeDeactiveSubFeature = [
  //  validation
  body("subFeatureId").exists().withMessage(msg.msgSubFeatureIdReqired).notEmpty().withMessage(msg.msgSubFeatureIdReqired),
  body("activeFlag").trim().exists().withMessage(msg.msgActiveFlagReqired).notEmpty().withMessage(msg.msgActiveFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { subFeatureId, activeFlag } = req.body;
        const checkSubFeature = await CommenService.checkSubFeature(subFeatureId);
        if (checkSubFeature === "NA") {
          const record = {
            success: false,
            msg: msg.msgSubFeatureNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          let activeDeactiveFlag = 0;
          if (activeFlag === "0") {
            activeDeactiveFlag = 1;
          } else {
            activeDeactiveFlag = 0;
          }
          const activeDeactiveSubFeature = await CommenService.activeDeactiveSubFeature(subFeatureId, activeDeactiveFlag);
          if (activeDeactiveSubFeature === 0) {
            const record = {
              success: false,
              msg: msg.msgSubFeatureUpdateError,
            };
            return res.status(200).json(record);
          } else {
            if (activeFlag === "0") {
              const record = {
                success: true,
                msg: msg.msgSubFeatureActiveSuccess,
                data: { subFeature: activeDeactiveSubFeature },
              };
              return res.status(200).json(record);
            } else {
              const record = {
                success: true,
                msg: msg.msgSubFeatureDeactiveSuccess,
                data: { subFeature: activeDeactiveSubFeature },
              };
              return res.status(200).json(record);
            }
          }
        } catch (error) {
          logger.error("activeDeactiveSubFeature error database ", { error, message: error.message, key: 1 });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("activeDeactiveSubFeature error database ", { error, message: error.message, key: 2 });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const deleteSubFeature = [
  //  validation
  body("subFeatureId").trim().exists().withMessage(msg.msgSubFeatureIdReqired).notEmpty().withMessage(msg.msgSubFeatureIdReqired),
  body("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { subFeatureId, deleteFlag } = req.body;

        const checkSubFeature = await CommenService.checkSubFeature(subFeatureId);
        if (checkSubFeature === "NA") {
          const record = {
            success: false,
            msg: msg.msgSubFeatureNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const deleteSubFeature = await CommenService.deleteSubFeature(subFeatureId, deleteFlag);
          if (deleteSubFeature === 0) {
            const record = {
              success: false,
              msg: msg.msgSubFeatureDeleteError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgSubFeatureDeleteSuccess,
              data: { subFeature: deleteSubFeature },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          logger.error("deleteSubFeature error database ", { error, message: error.message, key: 1 });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("deleteSubFeature error database ", { error, message: error.message, key: 2 });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];
//======================================= subscriptionPlans =============================================
const subscriptionPlans = [
  query("deleteFlag").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    }

    const { deleteFlag } = req.query;
    try {
      const subscriptionPlans = await CommenService.getSubscriptionPlans(Number(deleteFlag));
      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { subscriptionPlans: subscriptionPlans },
      };
      return res.status(200).json(record);
    } catch (error) {
      logger.error("Database error subscriptionPlans ", { error });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const subscriptionPlan = [
  query("subscriptionPlanId").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  query("deleteFlag").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    }

    const { subscriptionPlanId, deleteFlag } = req.query;
    try {
      const subscriptionPlan = await CommenService.getSubscriptionPlan(subscriptionPlanId, Number(deleteFlag));
      if (subscriptionPlan === "NA") {
        const record = {
          success: false,
          msg: msg.msgDataNotFound,
          data: { subscriptionPlan: {} },
        };
        return res.status(200).json(record);
      }
      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { subscriptionPlan: subscriptionPlan },
      };
      return res.status(200).json(record);
    } catch (error) {
      logger.error("Database error subscriptionPlans ", { error });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];

const addSubscriptionPlan = [
  body("users").exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("url").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("title").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("businessType").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("by_index").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("currency").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("planCategory").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("description").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  // body("projects").exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("price").exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  // body("discountPercentage").exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  // body("discountStartDate").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  // body("discountEndDate").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("durationInDays").exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("featureIds").exists().withMessage(msg.msgAllFieldReqired),
  body("subFeatures").exists().withMessage(msg.msgAllFieldReqired),
  body("projects").exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("shortDescription").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("most_popular").exists().withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const {
          users,
          url,
          title,
          businessType,
          by_index,
          currency,
          planCategory,
          description,
          projects,
          price,
          discountPercentage,
          discountStartDate,
          discountEndDate,
          durationInDays,
          featureIds,
          subFeatures,
          shortDescription,
          most_popular,
        } = req.body;

        const checkSubscriptionPlanName = await CommenService.checkSubscriptionPlanName(title, planCategory, price, durationInDays);
        if (checkSubscriptionPlanName !== "NA") {
          const record = {
            success: false,
            msg: msg.msgSubscriptionPlanExist,
          };
          return res.status(200).json(record);
        }
        const data = {
          users,
          url,
          title,
          businessType,
          by_index,
          currency,
          planCategory,
          description,
          projects,
          price,
          discountPercentage,
          discountStartDate,
          discountEndDate,
          durationInDays,
          featureIds,
          subFeatures,
          shortDescription,
          most_popular,
        };
        try {
          const addSubscriptionPlan = await CommenService.addSubscriptionPlan(data);
          if (addSubscriptionPlan === "NA") {
            const record = {
              success: false,
              msg: msg.msgSubscriptionPlanAddError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgSubscriptionPlanAddSuccess,
              data: { subscriptionPlan: addSubscriptionPlan },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          logger.error("addSubscriptionPlan error database ", { error, message: error.message, key: 1 });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("addSubscriptionPlan error database ", { error, message: error.message, key: 2 });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];
const editSubscriptionPlan = [
  body("users").exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("url").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("title").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("businessType").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("by_index").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("currency").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("planCategory").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("description").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  // body("projects").exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("price").exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  // body("discountPercentage").exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  // body("discountStartDate").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  // body("discountEndDate").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("durationInDays").exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("featureIds").exists().withMessage(msg.msgAllFieldReqired),
  body("subFeatures").exists().withMessage(msg.msgAllFieldReqired),
  body("projects").exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("shortDescription").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("most_popular").exists().withMessage(msg.msgAllFieldReqired),
  body("subscriptionPlanId").exists().withMessage(msg.msgSubscriptionPlanReqired).notEmpty().withMessage(msg.msgSubscriptionPlanReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const {
          subscriptionPlanId,
          users,
          url,
          title,
          businessType,
          by_index,
          currency,
          planCategory,
          description,
          projects,
          price,
          discountPercentage,
          discountStartDate,
          discountEndDate,
          durationInDays,
          featureIds,
          subFeatures,
          shortDescription,
          most_popular,
          showFlag,
        } = req.body;

        const checkSubscriptionPlan = await CommenService.checkSubscriptionPlan(subscriptionPlanId);
        if (checkSubscriptionPlan === "NA") {
          const record = {
            success: false,
            msg: msg.msgSubscriptionPlanNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const checkSubscriptionPlanWithName = await CommenService.checkSubscriptionPlanWithName(subscriptionPlanId, title, planCategory, price, durationInDays);
          if (checkSubscriptionPlanWithName !== "NA") {
            const record = {
              success: false,
              msg: msg.msgSubscriptionPlanExist,
            };
            return res.status(200).json(record);
          }
          const data = {
            users,
            url,
            title,
            businessType,
            by_index,
            currency,
            planCategory,
            description,
            projects,
            price,
            discountPercentage,
            discountStartDate,
            discountEndDate,
            durationInDays,
            featureIds,
            subFeatures,
            shortDescription,
            most_popular,
            showFlag,
          };
          try {
            const editSubscriptionPlan = await CommenService.editSubscriptionPlan(subscriptionPlanId, data);
            if (editSubscriptionPlan === "NA") {
              const record = {
                success: false,
                msg: msg.msgSubscriptionPlanUpdateError,
              };
              return res.status(200).json(record);
            } else {
              const record = {
                success: true,
                msg: msg.msgSubscriptionPlanUpdateSuccess,
                data: { subscriptionPlan: editSubscriptionPlan },
              };
              return res.status(200).json(record);
            }
          } catch (error) {
            logger.error("editSubscriptionPlan error database ", { error, message: error.message, key: 0 });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: error,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("editSubscriptionPlan error database ", { error, message: error.message, key: 1 });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("editSubscriptionPlan error database ", { error, message: error.message, key: 2 });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const activeDeactiveSubscriptionPlan = [
  body("subscriptionPlanId").exists().withMessage(msg.msgSubscriptionPlanIdReqired).notEmpty().withMessage(msg.msgSubscriptionPlanIdReqired),
  body("activeFlag").trim().exists().withMessage(msg.msgActiveFlagReqired).notEmpty().withMessage(msg.msgActiveFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { subscriptionPlanId, activeFlag } = req.body;
        const checkSubscriptionPlan = await CommenService.checkSubscriptionPlan(subscriptionPlanId);
        if (checkSubscriptionPlan === "NA") {
          const record = {
            success: false,
            msg: msg.msgSubscriptionPlanNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          let activeDeactiveFlag = activeFlag === "0" ? 1 : 0;
          const activeDeactiveSubscriptionPlan = await CommenService.activeDeactiveSubscriptionPlan(subscriptionPlanId, activeDeactiveFlag);
          if (activeDeactiveSubscriptionPlan === 0) {
            const record = {
              success: false,
              msg: msg.msgSubscriptionPlanUpdateError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: activeFlag === "0" ? msg.msgSubscriptionPlanActiveSuccess : msg.msgSubscriptionPlanDeactiveSuccess,
              data: { subscriptionPlan: activeDeactiveSubscriptionPlan },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          logger.error("activeDeactiveSubscriptionPlan error database ", { error, message: error.message, key: 1 });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("activeDeactiveSubscriptionPlan error database ", { error, message: error.message, key: 2 });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];
const showFlagSubscriptionPlan = [
  body("subscriptionPlanId").exists().withMessage(msg.msgSubscriptionPlanIdReqired).notEmpty().withMessage(msg.msgSubscriptionPlanIdReqired),
  body("showFlag").trim().exists().withMessage(msg.msgActiveFlagReqired).notEmpty().withMessage(msg.msgActiveFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { subscriptionPlanId } = req.body;
        const checkSubscriptionPlan = await CommenService.checkSubscriptionPlan(subscriptionPlanId);
        if (checkSubscriptionPlan === "NA") {
          const record = {
            success: false,
            msg: msg.msgSubscriptionPlanNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          let showFlag = req.body.showFlag;
          const showFlagSubscriptionPlan = await CommenService.showFlagSubscriptionPlan(subscriptionPlanId, showFlag);
          if (showFlagSubscriptionPlan === 0) {
            const record = {
              success: false,
              msg: msg.msgSubscriptionPlanUpdateError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: Number(showFlag) === 1 ? msg.msgSubscriptionPlanShowFlagSttausSuccess : msg.msgSubscriptionPlanShowFlagSttausSuccess,
              data: { subscriptionPlan: showFlagSubscriptionPlan },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          logger.error("showFlagSubscriptionPlan error database ", { error, message: error.message, key: 1 });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("showFlagSubscriptionPlan error database ", { error, message: error.message, key: 2 });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const deleteSubscriptionPlan = [
  body("subscriptionPlanId").trim().exists().withMessage(msg.msgSubscriptionPlanIdReqired).notEmpty().withMessage(msg.msgSubscriptionPlanIdReqired),
  body("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { subscriptionPlanId, deleteFlag } = req.body;

        const checkSubscriptionPlan = await CommenService.checkSubscriptionPlan(subscriptionPlanId);
        if (checkSubscriptionPlan === "NA") {
          const record = {
            success: false,
            msg: msg.msgSubscriptionPlanNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const deleteSubscriptionPlan = await CommenService.deleteSubscriptionPlan(subscriptionPlanId, deleteFlag);
          if (deleteSubscriptionPlan === 0) {
            const record = {
              success: false,
              msg: msg.msgSubscriptionPlanDeleteError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgSubscriptionPlanDeleteSuccess,
              data: { subscriptionPlan: deleteSubscriptionPlan },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          logger.error("deleteSubscriptionPlan error database ", { error, message: error.message, key: 1 });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("deleteSubscriptionPlan error database ", { error, message: error.message, key: 2 });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];
const permissionIntitals = [
  //  validation
  query("deleteFlag").trim().exists().withMessage(msg.msgPermissionIdReqired).notEmpty().withMessage(msg.msgPermissionIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { deleteFlag } = req.query;

        try {
          const permissions = await CommenService.getPermissionIntitals(deleteFlag);
          if (permissions === "NA") {
            const record = {
              success: true,
              msg: msg.msgDataNotFound,
              data: { permissions: [] },
            };
            return res.status(200).json(record);
          }
          const record = {
            success: true,
            msg: msg.msgDataFound,
            data: { permissions: permissions },
          };
          return res.status(200).json(record);
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];
const accessPermission = [
  //  validation
  query("permissionId").trim().exists().withMessage(msg.msgPermissionIdReqired).notEmpty().withMessage(msg.msgPermissionIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { permissionId } = req.query;
        const checkPermission = await CommenService.checkAccessPermission(permissionId);
        if (checkPermission === 0) {
          const record = {
            success: false,
            msg: msg.msgEmployeeNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const permission = await CommenService.getAccessPermissionOne(checkPermission);
          if (permission === "NA") {
            const record = {
              success: true,
              msg: msg.msgDataNotFound,
              data: { permission: "NA" },
            };
            return res.status(200).json(record);
          }
          const record = {
            success: true,
            msg: msg.msgDataFound,
            data: { permission: permission },
          };
          return res.status(200).json(record);
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const accessPermissions = [
  query("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    }

    const { deleteFlag } = req.query;
    try {
      const permissions = await CommenService.getAccessPermissions(Number(deleteFlag));

      if (permissions === "NA") {
        const record = {
          success: true,
          msg: msg.msgDataNotFound,
          data: { permissions: [] },
        };
        return res.status(200).json(record);
      }
      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { permissions: permissions },
      };
      return res.status(200).json(record);
    } catch (error) {
      console.log("database error key 2", error);
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const editAccessPermission = [
  body("permissionId").trim().exists().withMessage(msg.msgPermissionIdReqired).notEmpty().withMessage(msg.msgPermissionIdReqired),
  body("accessLevel").exists().withMessage(msg.msgDateReqired).notEmpty().withMessage(msg.msgDateReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { permissionId, accessLevel } = req.body;
        const checkPermission = await CommenService.checkAccessPermission(permissionId);
        if (checkPermission === 0) {
          const record = {
            success: false,
            msg: msg.msgPermissionIdReqired,
          };
          return res.status(200).json(record);
        }

        try {
          const permissionStatus = await CommenService.editAccessPermission(permissionId, accessLevel);
          if (permissionStatus === 0) {
            const record = {
              success: false,
              msg: msg.msgPermissionUpdateError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgPermissionUpdateSuccess,
              data: { permission: permissionStatus },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          console.log("database error key 3", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];
// =========================================================permission
const permissions = [
  query("deleteFlag").trim().exists().withMessage(msg.msgUnitIdReqired).notEmpty().withMessage(msg.msgUnitIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    }

    const { deleteFlag } = req.query;
    try {
      const permissions = await CommenService.getPermissions(Number(deleteFlag));
      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { permissions: permissions },
      };
      return res.status(200).json(record);
    } catch (error) {
      logger.error("Database error permissions ", { error });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];

const addPermission = [
  body("label").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("levelName").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("orderBy").exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("description").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { label, levelName, description, orderBy, briefDescription } = req.body;

        const checkPermissionName = await CommenService.checkPermissionName(label, levelName);
        if (checkPermissionName !== "NA") {
          const record = {
            success: false,
            msg: msg.msgPermissionExist,
          };
          return res.status(200).json(record);
        }
        const data = { label, levelName, description, orderBy, briefDescription };
        try {
          const addPermission = await CommenService.addPermission(data);
          if (addPermission === "NA") {
            const record = {
              success: false,
              msg: msg.msgPermissionAddError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgPermissionAddSuccess,
              data: { permission: addPermission },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          logger.error("addPermission error database ", { error, message: error.message, key: 1 });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("addPermission error database ", { error, message: error.message, key: 2 });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const editPermission = [
  //  validation
  body("label").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("levelName").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("orderBy").exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("description").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("permissionId").trim().exists().withMessage(msg.msgPermissionIdReqired).notEmpty().withMessage(msg.msgPermissionIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { label, levelName, description, orderBy, briefDescription, permissionId } = req.body;

        const checkPermission = await CommenService.checkPermission(permissionId);
        if (checkPermission === "NA") {
          const record = {
            success: false,
            msg: msg.msgPermissionNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const checkPermissionWithName = await CommenService.checkPermissionWithName(permissionId, label);
          if (checkPermissionWithName !== "NA") {
            const record = {
              success: false,
              msg: msg.msgPermissionExist,
            };
            return res.status(200).json(record);
          }
          const data = { label, levelName, description, orderBy, briefDescription };
          try {
            const editPermission = await CommenService.editPermission(permissionId, data);
            if (editPermission === "NA") {
              const record = {
                success: false,
                msg: msg.msgPermissionUpdateError,
              };
              return res.status(200).json(record);
            } else {
              const editAccessPermissionByKeyName = await CommenService.editAccessPermissionByKeyName(permissionId, data);
              if (editAccessPermissionByKeyName === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgPermissionUpdateError,
                };
                return res.status(200).json(record);
              }

              const record = {
                success: true,
                msg: msg.msgPermissionUpdateSuccess,
                data: { permission: editPermission },
              };
              return res.status(200).json(record);
            }
          } catch (error) {
            logger.error("editPermission error database ", { error, message: error.message, key: 0 });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: error,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("editPermission error database ", { error, message: error.message, key: 1 });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("editPermission error database ", { error, message: error.message, key: 2 });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const activeDeactivePermission = [
  //  validation
  body("permissionId").exists().withMessage(msg.msgPermissionIdReqired).notEmpty().withMessage(msg.msgPermissionIdReqired),
  body("activeFlag").trim().exists().withMessage(msg.msgActiveFlagReqired).notEmpty().withMessage(msg.msgActiveFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { permissionId, activeFlag } = req.body;
        const checkPermission = await CommenService.checkPermission(permissionId);
        if (checkPermission === "NA") {
          const record = {
            success: false,
            msg: msg.msgPermissionNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          let activeDeactiveFlag = 0;
          if (activeFlag === "0") {
            activeDeactiveFlag = 1;
          } else {
            activeDeactiveFlag = 0;
          }
          const activeDeactivePermission = await CommenService.activeDeactivePermission(permissionId, activeDeactiveFlag);
          if (activeDeactivePermission === 0) {
            const record = {
              success: false,
              msg: msg.msgPermissionUpdateError,
            };
            return res.status(200).json(record);
          } else {
            if (activeFlag === "0") {
              const record = {
                success: true,
                msg: msg.msgPermissionActiveSuccess,
                data: { permission: activeDeactivePermission },
              };
              return res.status(200).json(record);
            } else {
              const record = {
                success: true,
                msg: msg.msgPermissionDeactiveSuccess,
                data: { permission: activeDeactivePermission },
              };
              return res.status(200).json(record);
            }
          }
        } catch (error) {
          logger.error("activeDeactivePermission error database ", { error, message: error.message, key: 1 });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("activeDeactivePermission error database ", { error, message: error.message, key: 2 });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const deletePermission = [
  //  validation
  body("permissionId").trim().exists().withMessage(msg.msgPermissionIdReqired).notEmpty().withMessage(msg.msgPermissionIdReqired),
  body("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { permissionId, deleteFlag } = req.body;

        const checkPermission = await CommenService.checkPermission(permissionId);
        if (checkPermission === "NA") {
          const record = {
            success: false,
            msg: msg.msgPermissionNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const deletePermission = await CommenService.deletePermission(permissionId, deleteFlag);
          if (deletePermission === 0) {
            const record = {
              success: false,
              msg: msg.msgPermissionDeleteError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgPermissionDeleteSuccess,
              data: { permission: deletePermission },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          logger.error("activeDeactivePermission error database ", { error, message: error.message, key: 1 });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("activeDeactivePermission error database ", { error, message: error.message, key: 2 });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];
const getUsersAll = [
  query("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    }
    const userId = req?.currentUserId;
    const unitIds = req?.currentUser?.unitId;
    const roleName = req?.currentUser?.roleName;
    if (roleName !== "Super-Admin") {
      if (!unitIds || unitIds?.length === 0) {
        return res.status(200).json({ success: false, msg: msg.msgUnitNotExist, leaves: [] });
      }
    }
    const { deleteFlag } = req.query;

    try {
      const filterData = { deleteFlag: 0, roleName: { $ne: roleName } };
      const employees = await CommenService.getUsersAll(filterData);
      if (employees === "NA") {
        const record = {
          success: true,
          msg: msg.msgDataNotFound,
          data: { owners: [] },
        };
        return res.status(200).json(record);
      }
      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { owners: employees },
      };
      return res.status(200).json(record);
    } catch (error) {
      logger.error("Database error in  getUsersAll application", { error });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];

const getBuySubscriptionPlans = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }

    const { deleteFlag } = req.query;
    try {
      const getBuySubscriptionPlans =
        await CommenService.getBuySubscriptionPlans(Number(deleteFlag));
      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { getBuySubscriptionPlans: getBuySubscriptionPlans },
      };
      return res.status(200).json(record);
    } catch (error) {
      logger.error("Database error getBuySubscriptionPlans ", { error });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];

//======================================= old =============================================

const getNotificationEmployeeAll = [
  query("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  query("unitId").exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  query("roleId").exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    }
    const userId = req?.currentUserId;
    const unitIds = req?.currentUser?.unitId;
    const roleName = req?.currentUser?.roleName;
    if (roleName !== "Super-Admin") {
      if (!unitIds || unitIds?.length === 0) {
        return res.status(200).json({ success: false, msg: msg.msgUnitNotExist, leaves: [] });
      }
    }
    const { deleteFlag, roleId, unitId } = req.query;
    try {
      const employees = await CommenService.getNotificationUsersAll(roleName, unitIds, roleId, unitId, Number(deleteFlag));
      if (employees === "NA") {
        const record = {
          success: true,
          msg: msg.msgDataNotFound,
          data: { employees: [] },
        };
        return res.status(200).json(record);
      }
      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { employees: employees },
      };
      return res.status(200).json(record);
    } catch (error) {
      logger.error("Database error in  getUsersAll application", { error });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];

const myNotification = [
  query("limit").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  query("offset").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else if (!req.currentUserId) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    } else if (!req.currentUser) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    } else {
      const { limit, offset } = req.query;
      const userId = req.currentUserId;
      try {
        const checkUser = await CommenService.checkUser(userId);
        const notifications = await CommenService.getNotifications(userId, checkUser, limit, offset);
        const notificationCount = await CommenService.getNotificationCount(userId);
        const loadmore = notifications.length === parseInt(limit);
        return res.status(200).json({ success: true, msg: ["data found"], data: { notifications, loadmore, notificationCount } });
      } catch (error) {
        logger.error("Database error in notifications application", { error: error.message });
        const record = { success: true, msg: error.message, key: "error" };
        return res.status(500).json(record);
      }
    }
  },
];
const myNotificationCount = async (req, res) => {
  if (!req.currentUser) {
    return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
  } else {
    const userId = req.currentUserId;
    try {
      const checkUser = await CommenService.checkUser(userId);
      const notificationCount = await CommenService.getNotificationCount(userId);
      return res.status(200).json({ success: true, msg: ["data found"], data: { notificationCount } });
    } catch (error) {
      logger.error("Database error in notifications application", { error: error.message });
      const record = { success: true, msg: error.message, key: "error" };
      return res.status(500).json(record);
    }
  }
};
const deleteNotification = [
  //  validation
  body("NotificationId").trim().exists().withMessage(msg.msgNotificationIdReqired).notEmpty().withMessage(msg.msgNotificationIdReqired),
  body("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { NotificationId, deleteFlag } = req.body;

        const checkNotificationId = await CommenService.checkNotification(NotificationId);
        if (checkNotificationId === 0) {
          const record = {
            success: false,
            msg: msg.msgNotificationIdNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const NotificationStatus = await CommenService.deleteNotification(NotificationId, deleteFlag);
          if (NotificationStatus === 0) {
            const record = {
              success: false,
              msg: msg.msgNotificationDeleteError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgNotificationDeleteSuccess,
              data: { Notification: NotificationStatus },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          logger.error("Database error in Notification", { error });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in Notification", { error });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];
const clearNotification = [
  body("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { deleteFlag } = req.body;
        const userId = req.currentUserId;
        try {
          const NotificationStatus = await CommenService.clearNotification(userId, deleteFlag);
          if (NotificationStatus === 0) {
            const record = {
              success: false,
              msg: msg.msgNotificationDeleteError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgNotificationDeleteSuccess,
              data: { Notification: NotificationStatus },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          logger.error("Database error in Notification", { error });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in Notification", { error });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];
//====================================== Compoff ===========================
const sendAnnouncement = [
  //  validation
  body("message").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("subject").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { message, subject } = req.body;
        const employeeIdsSend = req.body.employeeIds;
        const unitIdsSend = req.body.unitIds;
        const roleIdsSend = req.body.roleIds;

        const userId = req?.currentUserId;
        const roleName = req?.currentUser?.roleName;
        const reportingManager = req?.currentUser?.reportingManagerId;
        const unitIds = req?.currentUser?.unitId;
        const notifyUsers = await CommenService.getUsersByUnitIdsAndRoleAndUserId(unitIdsSend, roleIdsSend, employeeIdsSend, roleName, unitIds);

        const recipientIds = notifyUsers.map((user) => user._id);
        //==
        const APP_LOGO = process.env.APP_LOGO || "";
        const APP_SITE_URL = process.env.SITE_URL || "";
        const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
        const notiUserId = userId;
        const action = "announcement";
        const actionId = null;
        const titles = [subject, subject, subject, subject];
        const messages = [message, message, message, message];

        const actionJson = {
          actionId: actionId,
          action: action,
          option: {
            logoUrl: APP_LOGO,
            redirectionUrl: { webLink: APP_SITE_URL, deepLink: APP_DEEP_LINK_URL },
            imageUrl: "",
            soundFile: "",
          },
          appType: "customer",
        };

        let notificationArr = [];

        async function addNotifications(notiOtherUserIds) {
          for (const notiOtherUserId of notiOtherUserIds) {
            const notification = await OneSignalHelper.getNotificationArrSingle(notiUserId, notiOtherUserId, action, actionId, titles, messages, actionJson);
            if (notification !== "NA") {
              notificationArr.push(notification);
            }
          }
        }

        await addNotifications(recipientIds);
        let announcement = null;
        if (notificationArr.length > 0) {
          announcement = await OneSignalHelper.oneSignalNotificationSendCall(notificationArr);
        }

        const record = {
          success: true,
          msg: msg.msgNotificationSendSuccess,
          data: { announcement: announcement },
        };
        return res.status(200).json(record);
      } catch (error) {
        logger.error("Database error in Reg application 2", { error: error.message, key: 1 });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];
// ==================================================  ==========================================

//====================================== File return ===========================
module.exports = {
  uploadFile,
  dashboard,
  features,
  addFeature,
  editFeature,
  activeDeactiveFeature,
  deleteFeature,
  allSubFeatures,
  subFeatures,
  addSubFeature,
  editSubFeature,
  activeDeactiveSubFeature,
  deleteSubFeature,
  subscriptionPlans,
  subscriptionPlan,
  addSubscriptionPlan,
  editSubscriptionPlan,
  activeDeactiveSubscriptionPlan,
  showFlagSubscriptionPlan,
  deleteSubscriptionPlan,
  accessPermissions,
  editAccessPermission,
  accessPermission,
  permissionIntitals,
  permissions,
  addPermission,
  editPermission,
  activeDeactivePermission,
  deletePermission,
  getUsersAll,
  myNotification,
  myNotificationCount,
  deleteNotification,
  clearNotification,
  getNotificationEmployeeAll,
  sendAnnouncement,
  getBuySubscriptionPlans,
};
