//====================================== File return ===========================
require("dotenv").config();
const jwt = require("jsonwebtoken");
const msg = require("../../helpers/languageMessageHelper");
const CommenFunction = require("../../helpers/commenHelper");
const MailFunctions = require("../../helpers/mailSendHelper");
const UserCommenService = require("../../services/workspaceServices/commenService");
const CommenService = require("../../services/websiteServices/commenService");
const oneSignalHelper = require("../../helpers/oneSignalHelper");
const oneSignalHelperUser = require("../../helpers/oneSignalHelperTenant");
const { default: slugify } = require("slugify");
const moment = require("moment");
require("moment-duration-format");
const { body, query, validationResult } = require("express-validator");
const logger = require("../../helpers/loggerHelper");
const { default: mongoose } = require("mongoose");
const path = require("path");
const { agents } = require("../../../agentsMap");
const { isNull } = require("util");
const { log } = require("util");
module.exports = {
  //====================================== dashboard===========================
  agents: [
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(200).json({
          success: false,
          msg: errors.array()[0].msg,
        });
      }

      const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
      const CURRENT_SITE_WORKSPACE_NUMBER = req?.CURRENT_SITE_WORKSPACE_NUMBER;

      if (!SITE_DB_NAME || !CURRENT_SITE_WORKSPACE_NUMBER) {
        return res.status(200).json({
          success: false,
          msg: msg.msgDBNotIdentified,
          key: 4,
        });
      }

      // 🔥 ONLY AGENTS (desktop app)
      const tenantAgentsSet = agents.get(CURRENT_SITE_WORKSPACE_NUMBER);

      const tenantAgents = tenantAgentsSet ? Array.from(tenantAgentsSet) : [];

      return res.status(200).json({
        success: true,
        msg: ["Data Found"],
        data: {
          tenantAgents,
        },
      });
    },
  ],
  dashboard: [
    //  validation
    query("dayMonthYear")
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
      } else {
        if (!req.CURRENT_USER_ID) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgUserNotExist });
        }
        if (!req.currentUser) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgUserNotExist });
        } else {
          const { deleteFlag, monthYear, monthDay, dayMonthYear } = req.query;
          try {
            try {
              const record = {
                success: true,
                msg: msg.msgDataFound,
                data: {},
              };
              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in dashboard emp 1", { error });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: error,
              };
              return res.status(500).json(record);
            }
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
  ],
  uploadFile: async (req, res) => {
    if (!req.file && !req.file?.filename) {
      const record = { success: false, msg: msg.msgUploadFileError, key: 3 };
      return res.status(200).json(record);
    }
    const record = {
      success: true,
      msg: msg.msgUploadFileSuccess,
      fileName: req.folderName + "/" + req.file.filename,
      file: req.file,
    };
    return res.status(200).json(record);
  },
  //======================================= subscriptionPlans =============================================
  buysubscriptionPlans: [
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
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }

      const CurrentUserId = req.CURRENT_USER_ID;
      if (!CurrentUserId && CurrentUserId === 0) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const { deleteFlag } = req.query;
      try {
        const buySubscriptionPlans =
          await UserCommenService.getBuySubscriptionPlans(
            SITE_DB_NAME,
            Number(deleteFlag),
          );
        const getCurrentBuySubscriptionPlans =
          await UserCommenService.getCurrentBuySubscriptionPlans(
            SITE_DB_NAME,
            req?.CURRENT_SITE_WORKSPACE_NUMBER,
            Number(deleteFlag),
          );

        const record = {
          success: true,
          msg: msg.msgDataFound,
          data: {
            currentPlan: getCurrentBuySubscriptionPlans,
            buySubscriptionPlans: buySubscriptionPlans,
          },
        };
        return res.status(200).json(record);
      } catch (error) {
        logger.error("Database error buySubscriptionPlans ", { error });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],

  //====================================== Update-Profile-Tanant ===========================
  editEssentials: [
    body("email")
      .trim()
      .exists()
      .withMessage(msg.msgEmailReqired)
      .notEmpty()
      .withMessage(msg.msgEmailReqired)
      .isEmail()
      .withMessage(msg.msgEmailInvalidFormat),
    body("firstName")
      .trim()
      .exists()
      .withMessage(msg.msgNameReqired)
      .notEmpty()
      .withMessage(msg.msgNameReqired),
    body("lastName")
      .trim()
      .exists()
      .withMessage(msg.msgNameReqired)
      .notEmpty()
      .withMessage(msg.msgNameReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        let { workingHours } = req.body;
        let { unitId } = req.body;
        try {
          if (typeof workingHours === "string") {
            workingHours = JSON.parse(workingHours);
          }
          if (typeof unitId === "string") {
            unitId = JSON.parse(unitId);
          }
          const {
            email,
            firstName,
            lastName,
            designationId,
            billableRate,
            billableCost,
            shiftId,
            joiningDate,
            departmentId,
          } = data;
          const name = firstName + " " + lastName;
          try {
            let image = null;

            if (!req.file) {
              image = req?.CURRENT_USER?.image;
            } else if ("key" in req.file) {
              const filename = req.file.key;
              image = filename;
            } else {
              image = req.folderName + "/" + req.file.filename;
            }

            const userUpdate = {
              name,
              email,
              image,
              firstName,
              lastName,
              workingHours,
            };
            if (
              req?.CURRENT_USER?.roleName &&
              req?.CURRENT_USER?.roleName === "Site-Owner"
            ) {
              userUpdate.designationId = designationId;
              userUpdate.departmentId = departmentId;
              userUpdate.billableRate = billableRate;
              userUpdate.billableCost = billableCost;
              userUpdate.unitId = unitId;
              userUpdate.shiftId = shiftId;
              userUpdate.joiningDate = joiningDate;
            }

            const updateUser = await UserCommenService.updateTenantUserProfile(
              SITE_DB_NAME,
              userId,
              userUpdate,
            );

            if (updateUser === "NA") {
              const record = {
                success: false,
                msg: msg.msgProfileUpdateError,
              };
              return res.status(200).json(record);
            }
            const userDetails = await UserCommenService.getUserDetails(
              SITE_DB_NAME,
              userId,
            );

            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "profile";
            const notificationOrActivity = 1;
            const actorId = userId;

            const { title, message } = msg.generateActivityCommenMessage(
              userDetails.name,
              "",
              "",
              "Updated",
            );
            const titles = title;
            const messages = message;
            const actionId = userId;
            const notiUserId = actorId;
            const notiOtherUserId = userId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const {
              dbName,
              dbHost,
              dbUserName,
              dbPassword,
              ...workspaceDetails
            } = req?.CURRENT_SITE_WORKSPACE.toObject();
            const record = {
              success: true,
              msg: msg.msgEssentialsUpdateSuccess,
              data: {
                userDetails: userDetails,
                workspaceDetails: workspaceDetails,
              },
            };

            return res.status(200).json(record);
          } catch (error) {
            console.log("database error key 3", error);
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = { success: false, msg: msg.msgServerError, key: 1 };
        return res.status(500).json(record);
      }
    },
  ],
  editDetails: [
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }

      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          const {
            jobTitle,
            mobileNumber,
            emergencyContactNumber,
            personalEmail,
            officePhone,
            gender,
            maritalStatus,
            originalDob,
            spouseName,
            fatherName,
            bloodGroup,
            motherName,
            religion,
            physicallyChallenged,
          } = data;
          const updateData = {
            jobTitle,
            mobileNumber,
            emergencyContactNumber,
            personalEmail,
            officePhone,
            gender,
            maritalStatus,
            originalDob,
            spouseName,
            fatherName,
            bloodGroup,
            motherName,
            religion,
            physicallyChallenged,
          };

          const updateUser = await UserCommenService.updateTenantUserProfile(
            SITE_DB_NAME,
            userId,
            updateData,
          );
          if (updateUser === "NA") {
            const record = {
              success: false,
              msg: msg.msgProfileUpdateError,
            };
            return res.status(200).json(record);
          }
          const userDetails = await UserCommenService.getUserDetails(
            SITE_DB_NAME,
            userId,
          );
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const action = "profile";
          const notificationOrActivity = 1;
          const actorId = userId;
          const { title, message } = msg.generateActivityCommenMessage(
            userDetails.name,
            "",
            "",
            "Updated",
          );
          const titles = title;
          const messages = message;
          const actionId = userId;
          const notiUserId = actorId;
          const notiOtherUserId = userId;
          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };
          let notificationArr = [];

          const notification =
            await oneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson,
              notificationOrActivity,
            );

          if (notification !== "NA") {
            notificationArr.push(notification);
          }
          if (notificationArr.length > 0) {
            notificationArr.push(notification);
            await oneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr,
            );
          }
          const {
            dbName,
            dbHost,
            dbUserName,
            dbPassword,
            ...workspaceDetails
          } = req?.CURRENT_SITE_WORKSPACE.toObject();

          const record = {
            success: true,
            msg: msg.msgEssentialsUpdateSuccess,
            data: {
              userDetails: userDetails,
              workspaceDetails: workspaceDetails,
            },
          };

          return res.status(200).json(record);
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],
  editAddress: [
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }

      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          const {
            landMark,
            address,
            city,
            state,
            countryId,
            pincode,
            addressProof,
            pLandMark,
            pAddress,
            pCity,
            pState,
            pPincode,
          } = data;

          let checkCountry;
          if (countryId) {
            checkCountry = await UserCommenService.checkCountry(countryId);
          }

          const updateData = {
            landMark,
            address,
            city,
            state,
            countryName: checkCountry ? checkCountry?.countryName : null,
            countryId: checkCountry ? checkCountry?._id : null,
            countryCode: checkCountry ? checkCountry?.countryCode : null,
            pincode,
            addressProof,
            pLandMark,
            pAddress,
            pCity,
            pState,
            pCountryName: checkCountry ? checkCountry?.countryName : null,
            pPincode,
          };

          const updateUser = await UserCommenService.updateTenantUserProfile(
            SITE_DB_NAME,
            userId,
            updateData,
          );
          if (updateUser === "NA") {
            const record = {
              success: false,
              msg: msg.msgProfileUpdateError,
            };
            return res.status(200).json(record);
          }
          const userDetails = await UserCommenService.getUserDetails(
            SITE_DB_NAME,
            userId,
          );
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const action = "profile";
          const notificationOrActivity = 1;
          const actorId = userId;
          const { title, message } = msg.generateActivityCommenMessage(
            userDetails.name,
            "",
            "",
            "Updated",
          );
          const titles = title;
          const messages = message;
          const actionId = userId;
          const notiUserId = actorId;
          const notiOtherUserId = userId;
          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };
          let notificationArr = [];

          const notification =
            await oneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson,
              notificationOrActivity,
            );

          if (notification !== "NA") {
            notificationArr.push(notification);
          }
          if (notificationArr.length > 0) {
            notificationArr.push(notification);
            await oneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr,
            );
          }
          const {
            dbName,
            dbHost,
            dbUserName,
            dbPassword,
            ...workspaceDetails
          } = req?.CURRENT_SITE_WORKSPACE.toObject();

          const record = {
            success: true,
            msg: msg.msgEssentialsUpdateSuccess,
            data: {
              userDetails: userDetails,
              workspaceDetails: workspaceDetails,
            },
          };

          return res.status(200).json(record);
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  editAccountDetails: [
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }

      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          const { bankName, bankAccountNumber, IFSCCode, accountHolderName } =
            data;
          const bankStatus = bankAccountNumber ? 1 : 0;
          const updateData = {
            bankName,
            bankAccountNumber,
            IFSCCode,
            accountHolderName,
            bankStatus,
          };

          const updateUser = await UserCommenService.updateTenantUserProfile(
            SITE_DB_NAME,
            userId,
            updateData,
          );
          if (updateUser === "NA") {
            const record = {
              success: false,
              msg: msg.msgProfileUpdateError,
            };
            return res.status(200).json(record);
          }
          const userDetails = await UserCommenService.getUserDetails(
            SITE_DB_NAME,
            userId,
          );
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const action = "profile";
          const notificationOrActivity = 1;
          const actorId = userId;
          const { title, message } = msg.generateActivityCommenMessage(
            userDetails.name,
            "",
            "",
            "Updated",
          );
          const titles = title;
          const messages = message;
          const actionId = userId;
          const notiUserId = actorId;
          const notiOtherUserId = userId;
          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };
          let notificationArr = [];

          const notification =
            await oneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson,
              notificationOrActivity,
            );

          if (notification !== "NA") {
            notificationArr.push(notification);
          }
          if (notificationArr.length > 0) {
            notificationArr.push(notification);
            await oneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr,
            );
          }
          const {
            dbName,
            dbHost,
            dbUserName,
            dbPassword,
            ...workspaceDetails
          } = req?.CURRENT_SITE_WORKSPACE.toObject();

          const record = {
            success: true,
            msg: msg.msgEssentialsUpdateSuccess,
            data: {
              userDetails: userDetails,
              workspaceDetails: workspaceDetails,
            },
          };

          return res.status(200).json(record);
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  editDocuments: [
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }

      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const userId = req.CURRENT_USER_ID;
      const CURRENT_USER = req.CURRENT_USER;
      if (!SITE_DB_NAME || !CURRENT_USER) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUserNotExist });
      }

      try {
        const data = req.body || {};

        const { aadharNumber, PANNumber } = data;

        const filesArray = Array.isArray(req.files)
          ? req.files
          : Object.values(req.files || {}).flat();
        const oldDocuments = CURRENT_USER?.documents || [];
        const aadharImage =
          filesArray.find((f) => f.fieldname === "aadharImage")?.key ||
          CURRENT_USER?.aadharImage ||
          null;
        const PANImage =
          filesArray.find((f) => f.fieldname === "PANImage")?.key ||
          CURRENT_USER?.PANImage ||
          null;
        const newDocuments = Array.isArray(req.body.documents)
          ? req.body.documents
          : [];
        const documents = newDocuments.map((doc, index) => {
          const uploadedFile = filesArray.find(
            (f) => f.fieldname === `documents[${index}][document]`,
          );
          const oldDoc =
            oldDocuments.find(
              (od) =>
                od.documentName &&
                doc.documentName &&
                od.documentName.toLowerCase() ===
                  doc.documentName.toLowerCase(),
            ) || {};

          return {
            documentName: doc.documentName || oldDoc.documentName || null,
            organizationName:
              doc.organizationName || oldDoc.organizationName || null,
            start: doc.start || oldDoc.start || null,
            end: doc.end || oldDoc.end || null,
            document: uploadedFile ? uploadedFile.key : oldDoc.document || null,
          };
        });

        const documentStatus =
          Array.isArray(documents) && documents.length > 0 ? 1 : 0;

        const updateData = {
          aadharNumber,
          PANNumber,
          aadharImage,
          PANImage,
          documents,
          documentStatus,
        };
        try {
          const updateUser = await UserCommenService.updateTenantUserProfile(
            SITE_DB_NAME,
            userId,
            updateData,
          );
          if (updateUser === "NA") {
            return res
              .status(200)
              .json({ success: false, msg: msg.msgProfileUpdateError });
          }

          const userDetails = await UserCommenService.getUserDetails(
            SITE_DB_NAME,
            userId,
          );

          // --- notifications & workspace details (unchanged from your code) ---
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const action = "profile";
          const notificationOrActivity = 1;
          const actorId = userId;
          const { title, message } = msg.generateActivityCommenMessage(
            userDetails.name,
            "",
            "",
            "Updated",
          );
          const titles = title;
          const messages = message;
          const actionId = userId;
          const notiUserId = actorId;
          const notiOtherUserId = userId;
          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };
          let notificationArr = [];

          const notification =
            await oneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson,
              notificationOrActivity,
            );

          if (notification !== "NA") notificationArr.push(notification);
          if (notificationArr.length > 0) {
            notificationArr.push(notification);
            await oneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr,
            );
          }

          const {
            dbName,
            dbHost,
            dbUserName,
            dbPassword,
            ...workspaceDetails
          } = req?.CURRENT_SITE_WORKSPACE.toObject();

          const record = {
            success: true,
            msg: msg.msgEssentialsUpdateSuccess,
            data: {
              userDetails,
              workspaceDetails,
            },
          };

          return res.status(200).json(record);
        } catch (error) {
          console.log("database error key 2", error);
          return res
            .status(500)
            .json({ success: false, msg: msg.msgServerError, key: 2 });
        }
      } catch (error) {
        console.log("database error key 1", error);
        return res
          .status(500)
          .json({ success: false, msg: msg.msgServerError, key: 1 });
      }
    },
  ],

  editProfileDescription: [
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }

      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          const { publicProfile } = data;
          const updateData = {
            publicProfile,
          };

          const updateUser = await UserCommenService.updateTenantUserProfile(
            SITE_DB_NAME,
            userId,
            updateData,
          );

          if (updateUser === "NA") {
            const record = {
              success: false,
              msg: msg.msgProfileUpdateError,
            };
            return res.status(200).json(record);
          }
          const userDetails = await UserCommenService.getUserDetails(
            SITE_DB_NAME,
            userId,
          );
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const notiUserId = userId;
          const notiOtherUserId = userId;
          const action = "profile";
          const notificationOrActivity = 1;
          const actionId = null;
          const { title, message } = msg.generateActivityCommenMessage(
            userDetails.name,
            "",
            "",
            "Updated",
          );
          const titles = title;
          const messages = message;
          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };
          let notificationArr = [];

          const notification =
            await oneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson,
              notificationOrActivity,
            );

          if (notification !== "NA") {
            notificationArr.push(notification);
          }
          if (notificationArr.length > 0) {
            notificationArr.push(notification);
            await oneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr,
            );
          }
          const {
            dbName,
            dbHost,
            dbUserName,
            dbPassword,
            ...workspaceDetails
          } = req?.CURRENT_SITE_WORKSPACE.toObject();
          const record = {
            success: true,
            msg: msg.msgEssentialsUpdateSuccess,
            data: {
              userDetails: userDetails,
              workspaceDetails: workspaceDetails,
            },
          };

          return res.status(200).json(record);
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],
  editPrivateNotes: [
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }

      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          const { privateNotes } = data;
          const updateData = {
            privateNotes,
          };

          const updateUser = await UserCommenService.updateTenantUserProfile(
            SITE_DB_NAME,
            userId,
            updateData,
          );
          if (updateUser === "NA") {
            const record = {
              success: false,
              msg: msg.msgProfileUpdateError,
            };
            return res.status(200).json(record);
          }
          const userDetails = await UserCommenService.getUserDetails(
            SITE_DB_NAME,
            userId,
          );
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const action = "profile";
          const notificationOrActivity = 1;
          const actorId = userId;
          const { title, message } = msg.generateActivityCommenMessage(
            userDetails.name,
            "",
            "",
            "Updated",
          );
          const titles = title;
          const messages = message;
          const actionId = userId;
          const notiUserId = actorId;
          const notiOtherUserId = userId;
          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };
          let notificationArr = [];

          const notification =
            await oneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson,
              notificationOrActivity,
            );

          if (notification !== "NA") {
            notificationArr.push(notification);
          }
          if (notificationArr.length > 0) {
            notificationArr.push(notification);
            await oneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr,
            );
          }
          const {
            dbName,
            dbHost,
            dbUserName,
            dbPassword,
            ...workspaceDetails
          } = req?.CURRENT_SITE_WORKSPACE.toObject();
          const record = {
            success: true,
            msg: msg.msgEssentialsUpdateSuccess,
            data: {
              userDetails: userDetails,
              workspaceDetails: workspaceDetails,
            },
          };

          return res.status(200).json(record);
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],
  editSocial: [
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;

        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          let { social } = req.body;
          if (typeof social === "string") {
            social = JSON.parse(social);
          }
          const updateData = {
            social,
          };

          const updateUser = await UserCommenService.updateTenantUserProfile(
            SITE_DB_NAME,
            userId,
            updateData,
          );
          if (updateUser === "NA") {
            const record = {
              success: false,
              msg: msg.msgProfileUpdateError,
            };
            return res.status(200).json(record);
          }
          const userDetails = await UserCommenService.getUserDetails(
            SITE_DB_NAME,
            userId,
          );
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const action = "profile";
          const notificationOrActivity = 1;
          const actorId = userId;
          const { title, message } = msg.generateActivityCommenMessage(
            userDetails.name,
            "",
            "",
            "Updated",
          );
          const titles = title;
          const messages = message;
          const actionId = userId;
          const notiUserId = actorId;
          const notiOtherUserId = userId;
          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };
          let notificationArr = [];

          const notification =
            await oneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson,
              notificationOrActivity,
            );

          if (notification !== "NA") {
            notificationArr.push(notification);
          }
          if (notificationArr.length > 0) {
            notificationArr.push(notification);
            await oneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr,
            );
          }
          const {
            dbName,
            dbHost,
            dbUserName,
            dbPassword,
            ...workspaceDetails
          } = req?.CURRENT_SITE_WORKSPACE.toObject();
          const record = {
            success: true,
            msg: msg.msgEssentialsUpdateSuccess,
            data: {
              userDetails: userDetails,
              workspaceDetails: workspaceDetails,
            },
          };

          return res.status(200).json(record);
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  editLocalization: [
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      console.log("SITE_DB_NAME", SITE_DB_NAME);

      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          const {
            languageId,
            dateFormat,
            timeFormat,
            timeZone,
            calendarStart,
          } = data;
          const updateData = {
            languageId,
            dateFormat,
            timeFormat,
            timeZone,
            calendarStart,
          };

          const updateUser = await UserCommenService.updateTenantUserProfile(
            SITE_DB_NAME,
            userId,
            updateData,
          );
          if (updateUser === "NA") {
            const record = {
              success: false,
              msg: msg.msgProfileUpdateError,
            };
            return res.status(200).json(record);
          }
          const userDetails = await UserCommenService.getUserDetails(
            SITE_DB_NAME,
            userId,
          );
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const action = "profile";
          const notificationOrActivity = 1;
          const actorId = userId;
          const { title, message } = msg.generateActivityCommenMessage(
            userDetails.name,
            "",
            "",
            "Updated",
          );
          const titles = title;
          const messages = message;
          const actionId = userId;
          const notiUserId = actorId;
          const notiOtherUserId = userId;
          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };
          let notificationArr = [];

          const notification =
            await oneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson,
              notificationOrActivity,
            );

          if (notification !== "NA") {
            notificationArr.push(notification);
          }
          if (notificationArr.length > 0) {
            notificationArr.push(notification);
            await oneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr,
            );
          }
          const {
            dbName,
            dbHost,
            dbUserName,
            dbPassword,
            ...workspaceDetails
          } = req?.CURRENT_SITE_WORKSPACE.toObject();
          const record = {
            success: true,
            msg: msg.msgEssentialsUpdateSuccess,
            data: {
              userDetails: userDetails,
              workspaceDetails: workspaceDetails,
            },
          };

          return res.status(200).json(record);
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],
  editPreferences: [
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }

      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          const { accessPreferenceLevel } = data;
          const updateData = {
            accessPreferenceLevel,
          };
          const updateUserMain = await CommenService.updateUserProfile(
            userId,
            updateData,
          );
          if (updateUserMain === "NA") {
            const record = {
              success: false,
              msg: msg.msgProfileUpdateError,
            };
            return res.status(200).json(record);
          }
          const updateUser = await UserCommenService.updateTenantUserProfile(
            SITE_DB_NAME,
            userId,
            updateData,
          );
          if (updateUser === "NA") {
            const record = {
              success: false,
              msg: msg.msgProfileUpdateError,
            };
            return res.status(200).json(record);
          }
          const userDetails = await UserCommenService.getUserDetails(
            SITE_DB_NAME,
            userId,
          );
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const action = "profile";
          const notificationOrActivity = 1;
          const actorId = userId;
          const { title, message } = msg.generateActivityCommenMessage(
            userDetails.name,
            "",
            "",
            "Updated",
          );
          const titles = title;
          const messages = message;
          const actionId = userId;
          const notiUserId = actorId;
          const notiOtherUserId = userId;
          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };
          let notificationArr = [];

          const notification =
            await oneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson,
              notificationOrActivity,
            );

          if (notification !== "NA") {
            notificationArr.push(notification);
          }
          if (notificationArr.length > 0) {
            notificationArr.push(notification);
            await oneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr,
            );
          }
          const {
            dbName,
            dbHost,
            dbUserName,
            dbPassword,
            ...workspaceDetails
          } = req?.CURRENT_SITE_WORKSPACE.toObject();
          const record = {
            success: true,
            msg: msg.msgEssentialsUpdateSuccess,
            data: {
              userDetails: userDetails,
              workspaceDetails: workspaceDetails,
            },
          };

          return res.status(200).json(record);
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],
  updatePassword: [
    body("oldPassword")
      .trim()
      .exists()
      .withMessage(msg.msgOldPasswordReqired)
      .notEmpty()
      .withMessage(msg.msgOldPasswordReqired),
    body("password")
      .trim()
      .exists()
      .withMessage(msg.msgPasswordReqired)
      .notEmpty()
      .withMessage(msg.msgPasswordReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      } else {
        if (
          !req.CURRENT_USER_ID ||
          !("CURRENT_USER_ID" in req) ||
          req.CURRENT_USER_ID === ""
        ) {
          const record = {
            success: false,
            msg: msg.msgAllFieldReqired,
            key: 1,
          };
          return res.status(200).json(record);
        } else {
          try {
            const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
            if (!SITE_DB_NAME) {
              const record = { success: false, msg: msg.msgUserNotExist };
              return res.status(200).json(record);
            }
            const data = req.body;
            const userId = req.CURRENT_USER_ID;
            const checkUserID = await UserCommenService.checkUser(
              SITE_DB_NAME,
              userId,
            );
            if (checkUserID === "NA") {
              const record = { success: false, msg: msg.msgUserNotExist };
              return res.status(200).json(record);
            } else {
              try {
                const password = await CommenFunction.hashPassword(
                  data.password,
                );

                const oldPasswordStatus = await CommenFunction.comparePassword(
                  data.oldPassword,
                  checkUserID.password,
                );
                if (oldPasswordStatus !== true) {
                  const record = {
                    success: false,
                    msg: msg.msgOldPasswordWrong,
                  };
                  return res.status(200).json(record);
                } else {
                  const updateData = {
                    showPassword: data.password,
                    password,
                  };

                  const updateUserPassword =
                    await UserCommenService.updateUserPassword(
                      SITE_DB_NAME,
                      data.password,
                      password,
                      userId,
                    );
                  if (updateUserPassword === "NA") {
                    const record = {
                      success: false,
                      msg: msg.msgPasswordUpdateError,
                    };
                    return res.status(200).json(record);
                  } else {
                    const userDetails = await UserCommenService.getUserDetails(
                      SITE_DB_NAME,
                      userId,
                    );
                    const APP_LOGO = process.env.APP_LOGO || "";
                    const APP_SITE_URL = process.env.SITE_URL || "";
                    const APP_DEEP_LINK_URL =
                      process.env.APP_DEEP_LINK_URL || "";
                    const notiUserId = userId;
                    const notiOtherUserId = userId;
                    const action = "profile";
                    const notificationOrActivity = 1;
                    const actionId = null;
                    const { title, message } =
                      msg.generateActivityCommenMessage(
                        userDetails.name,
                        "",
                        "",
                        "PasswordUpdated",
                      );
                    const titles = title;
                    const messages = message;
                    const actionJson = {
                      actionId: actionId,
                      action: action,
                      option: {
                        logoUrl: APP_LOGO,
                        redirectionUrl: {
                          webLink: APP_SITE_URL,
                          deepLink: APP_DEEP_LINK_URL,
                        },
                        imageUrl: "",
                        soundFile: "",
                      },
                      appType: "customer",
                    };
                    let notificationArr = [];

                    const notification =
                      await oneSignalHelperUser.getNotificationArrSingle(
                        SITE_DB_NAME,
                        notiUserId,
                        notiOtherUserId,
                        action,
                        actionId,
                        titles,
                        messages,
                        actionJson,
                        notificationOrActivity,
                      );

                    if (notification !== "NA") {
                      notificationArr.push(notification);
                    }
                    if (notificationArr.length > 0) {
                      notificationArr.push(notification);
                      await oneSignalHelperUser.oneSignalNotificationSendCall(
                        notificationArr,
                      );
                    }
                    const record = {
                      success: true,
                      msg: msg.msgPasswordUpdateSuccess,
                    };
                    return res.status(200).json(record);
                  }
                }
              } catch (error) {
                console.log("database error key 2", error);

                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: error,
                };

                return res.status(500).json(record);
              }
            }
          } catch (error) {
            console.log("database error key 3", error);

            const record = { success: false, msg: msg.msgServerError, key: 3 };
            return res.status(500).json(record);
          }
        }
      }
    },
  ],
  editPermissions: [
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }

      const data = req.body;
      try {
        const roleName = req.CURRENT_USER?.roleName;
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          const { accessLevel } = data;
          const updateData = {
            accessLevel,
          };
          const updateUserMain = await CommenService.updateUserProfile(
            userId,
            updateData,
          );
          if (updateUserMain === "NA") {
            const record = {
              success: false,
              msg: msg.msgProfileUpdateError,
            };
            return res.status(200).json(record);
          }
          const updateUser = await UserCommenService.updateTenantUserProfile(
            SITE_DB_NAME,
            userId,
            updateData,
          );
          if (updateUser === "NA") {
            const record = {
              success: false,
              msg: msg.msgProfileUpdateError,
            };
            return res.status(200).json(record);
          }
          const userDetails = await UserCommenService.getUserDetails(
            SITE_DB_NAME,
            userId,
          );

          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const action = "profile";
          const notificationOrActivity = 1;
          const actorId = userId;
          const { title, message } = msg.generateActivityCommenMessage(
            userDetails.name,
            "",
            "",
            "PermissionsUpdated",
          );
          const titles = title;
          const messages = message;
          const actionId = userId;
          const notiUserId = actorId;
          const notiOtherUserId = userId;
          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };
          let notificationArr = [];

          const notification =
            await oneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson,
              notificationOrActivity,
            );

          if (notification !== "NA") {
            notificationArr.push(notification);
          }
          if (notificationArr.length > 0) {
            notificationArr.push(notification);
            await oneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr,
            );
          }
          const {
            dbName,
            dbHost,
            dbUserName,
            dbPassword,
            ...workspaceDetails
          } = req?.CURRENT_SITE_WORKSPACE.toObject();
          const record = {
            success: true,
            msg: msg.msgEssentialsUpdateSuccess,
            data: {
              userDetails: userDetails,
              workspaceDetails: workspaceDetails,
            },
          };

          return res.status(200).json(record);
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  getProfile: [
    async (req, res) => {
      try {
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = {
            success: false,
            msg: msg.msgAllFieldReqired,
            key: 4,
          };
          return res.status(200).json(record);
        }
        let userDetails = req?.CURRENT_USER;
        if ("userId" in req.query && req.query.userId) {
          let userIdReq = req?.query?.userId;
          const checkUser = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userIdReq,
          );
          userDetails = await UserCommenService.getUserDetails(
            SITE_DB_NAME,
            checkUser._id,
          );
        }
        if (!userDetails) {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
            key: 3,
          };
          return res.status(200).json(record);
        }
        const { dbName, dbHost, dbUserName, dbPassword, ...workspaceDetails } =
          req?.CURRENT_SITE_WORKSPACE.toObject();
        const record = {
          success: true,
          msg: msg.msgDataFound,
          data: {
            userDetails,
            workspaceDetails: workspaceDetails,
          },
        };
        return res.status(200).json(record);
      } catch (error) {
        const record = { success: false, msg: msg.msgServerError, key: 2 };
        return res.status(500).json(record);
      }
    },
  ],

  verifyToken: [
    async (req, res) => {
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = {
          success: false,
          msg: msg.msgAllFieldReqired,
          key: 4,
        };
        return res.status(200).json(record);
      }

      if (
        req.CURRENT_USER_ID === "" ||
        !("CURRENT_USER_ID" in req) ||
        !("CURRENT_USER" in req)
      ) {
        const record = {
          success: false,
          msg: msg.msgAllFieldReqired,
          key: 3,
        };
        return res.status(200).json(record);
      }
      try {
        const { dbName, dbHost, dbUserName, dbPassword, ...workspaceDetails } =
          req?.CURRENT_SITE_WORKSPACE.toObject();
        const record = {
          success: true,
          msg: msg.msgDataFound,
          data: {
            userDetails: req?.CURRENT_USER,
            workspaceDetails: workspaceDetails,
          },
        };

        return res.status(200).json(record);
      } catch (error) {
        const record = { success: false, msg: msg.msgServerError, key: 2 };

        return res.status(500).json(record);
      }
    },
  ],
  //====================================== Tanant-Company-Flow ===========================
  createCompany: [
    body("companyName")
      .trim()
      .exists()
      .withMessage(msg.msgCompanyNameReqired)
      .notEmpty()
      .withMessage(msg.msgCompanyNameReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = { success: false, msg: msg.msgUserNotExist };
            return res.status(200).json(record);
          }
          try {
            const companyNumber =
              await UserCommenService.checkCompanyLastNumber(SITE_DB_NAME);
            if (companyNumber === "NA") {
              const record = {
                success: false,
                msg: msg.msgCompanyLastNumberIsNotFind,
                key: 4,
              };
              return res.status(200).json(record);
            }
            try {
              const { companyName } = req.body;
              const checkCompany = await UserCommenService.checkCompanyName(
                SITE_DB_NAME,
                companyName,
              );
              if (checkCompany !== "NA") {
                const record = {
                  success: false,
                  msg: msg.msgCompanyAlreadyExist,
                  key: 1,
                };
                return res.status(200).json(record);
              }
              try {
                // const companyLogo = req?.file?.filename;

                let companyLogo = null;
                if (!req.file) {
                  companyLogo = req?.CURRENT_USER?.companyLogo;
                } else if ("key" in req.file) {
                  const filename = req.file.key;
                  companyLogo = filename;
                } else {
                  companyLogo = req.folderName + "/" + req.file.filename;
                }
                const {
                  companyURL,
                  companyEmail,
                  companyLandmark,
                  companyAddress,
                  companyCity,
                  companyState,
                  companyCode,
                  companycountryId,
                  companyPincode,
                  companyPrivateNotes,
                  companyPublicProfile,
                  companyPhone,
                } = data;
                let checkCountry;
                if (companycountryId) {
                  checkCountry =
                    await UserCommenService.checkCountry(companycountryId);
                }
                try {
                  const companyData = {
                    companyName,
                    createdBy: userId,
                    companyURL,
                    companyEmail,
                    companyNumber,
                    companyLogo,
                    companyLandmark,
                    companyAddress,
                    companyCity,
                    companyState,
                    companyCode,
                    companycountryName: checkCountry
                      ? checkCountry?.countryName
                      : null,
                    companyCountryCode: checkCountry
                      ? checkCountry?.countryCode
                      : null,
                    companycountryId: checkCountry ? checkCountry?._id : null,
                    companyPincode,
                    companyPrivateNotes,
                    companyPublicProfile,
                    companyPhone,
                  };

                  // if (
                  //   req?.CURRENT_USER?.roleName &&
                  //   req?.CURRENT_USER?.roleName === "Site-Owner"
                  // ) {
                  //   userUpdate.designationId = designationId;
                  //   userUpdate.billableRate = billableRate;
                  //   userUpdate.billableCost = billableCost;
                  // }

                  const createCompany = await UserCommenService.createCompany(
                    SITE_DB_NAME,
                    companyData,
                  );

                  if (createCompany === "NA") {
                    const record = {
                      success: false,
                      msg: msg.msgCompanyError,
                    };
                    return res.status(200).json(record);
                  }
                  const companyId = createCompany?._id;
                  const companyDetails =
                    await UserCommenService.getCompanyDetails(
                      SITE_DB_NAME,
                      companyId,
                    );

                  const APP_LOGO = process.env.APP_LOGO || "";
                  const APP_SITE_URL = process.env.SITE_URL || "";
                  const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                  const action = "company";
                  const notificationOrActivity = 1;
                  const actorId = userId;
                  const targetCompanyId = companyId;
                  const { title, message } = msg.generateActivityCommenMessage(
                    checkUserID.name,
                    companyDetails.companyName,
                    "",
                    "CreateCompany",
                  );
                  const titles = title;
                  const messages = message;
                  const actionId = targetCompanyId;
                  const notiUserId = actorId;
                  const notiOtherUserId = actorId;
                  const actionJson = {
                    actionId: actionId,
                    action: action,
                    option: {
                      logoUrl: APP_LOGO,
                      redirectionUrl: {
                        webLink: APP_SITE_URL,
                        deepLink: APP_DEEP_LINK_URL,
                      },
                      imageUrl: "",
                      soundFile: "",
                    },
                    appType: "customer",
                  };
                  let notificationArr = [];

                  const notification =
                    await oneSignalHelperUser.getNotificationArrSingle(
                      SITE_DB_NAME,
                      notiUserId,
                      notiOtherUserId,
                      action,
                      actionId,
                      titles,
                      messages,
                      actionJson,
                      notificationOrActivity,
                    );

                  if (notification !== "NA") {
                    notificationArr.push(notification);
                  }
                  if (notificationArr.length > 0) {
                    notificationArr.push(notification);
                    await oneSignalHelperUser.oneSignalNotificationSendCall(
                      notificationArr,
                    );
                  }
                  const record = {
                    success: true,
                    msg: msg.msgCompanyCreatedSuccess,
                    data: { companyDetails: companyDetails },
                  };

                  return res.status(200).json(record);
                } catch (error) {
                  console.log("database error key 4", error);
                  const record = {
                    success: false,
                    msg: msg.msgServerError,
                    key: 4,
                  };
                  return res.status(500).json(record);
                }
              } catch (error) {
                console.log("database error key 3", error);
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 3,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              console.log("database error key 2", error);
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 2,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            console.log("database error key 3", error);
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = { success: false, msg: msg.msgServerError, key: 1 };
        return res.status(500).json(record);
      }
    },
  ],

  getCompanies: [
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.msgUnitIdReqired)
      .notEmpty()
      .withMessage(msg.msgUnitIdReqired),
    async (req, res) => {
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const { deleteFlag } = req.query;
      if (!SITE_DB_NAME) {
        const record = {
          success: false,
          msg: msg.msgAllFieldReqired,
          key: 4,
        };
        return res.status(200).json(record);
      }

      if (
        req.CURRENT_USER_ID === "" ||
        !("CURRENT_USER_ID" in req) ||
        !("CURRENT_USER" in req)
      ) {
        const record = {
          success: false,
          msg: msg.msgAllFieldReqired,
          key: 3,
        };
        return res.status(200).json(record);
      } else {
        try {
          // Company pagination
          const pagination = {
            pageSize: parseInt(req.query.pageSize) || 10, // 👈 company ke liye
            pageNumber: parseInt(req.query.pageNumber) || 1,
          };

          // Project pagination
          const projectPagination = {
            projectPageSize: parseInt(req.query.projectPageSize) || 10, // 👈 project ke liye
            projectPageNumber: parseInt(req.query.projectPageNumber) || 1,
          };

          const search = req.query.search || "";
          const companyDetails = await UserCommenService.getCompanies(
            Number(deleteFlag),
            SITE_DB_NAME,
            pagination,
            search,
            projectPagination,
          );
          if (companyDetails === "NA") {
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                companyDetails: [],
              },
            };
            return res.status(200).json(record);
          }
          const record = {
            success: true,
            msg: msg.msgDataFound,
            data: {
              companyDetails: companyDetails,
            },
          };

          return res.status(200).json(record);
        } catch (error) {
          const record = { success: false, msg: msg.msgServerError, key: 2 };

          return res.status(500).json(record);
        }
      }
    },
  ],

  updateCompany: [
    query("companyId")
      .trim()
      .exists()
      .withMessage(msg.msgCompanyIdReqired)
      .notEmpty()
      .withMessage(msg.msgCompanyIdReqired),
    body("companyName")
      .trim()
      .exists()
      .withMessage(msg.msgCompanyNameReqired)
      .notEmpty()
      .withMessage(msg.msgCompanyNameReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const {
        companyType,
        companyName,
        companyURL,
        companyEmail,
        companyLandmark,
        companyAddress,
        companyCity,
        companyState,
        companyCode,
        companycountryId,
        companyPincode,
        ownerId,
        companyPrivateNotes,
        companyPublicProfile,
        companyPhone,
      } = req.body;
      let checkCountry;
      if (companycountryId) {
        checkCountry = await UserCommenService.checkCountry(companycountryId);
      }
      const { companyId } = req.query;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const checkComapny = await UserCommenService.checkCompany(
              SITE_DB_NAME,
              companyId,
            );
            if (checkComapny === "NA") {
              const record = {
                success: false,
                msg: msg.msgCompanyIsNotExist,
                key: 4,
              };
              return res.status(200).json(record);
            }

            const checkCopmanyUpdateName =
              await UserCommenService.checkCopmanyUpdateName(
                SITE_DB_NAME,
                checkComapny._id,
                companyName,
              );

            if (checkCopmanyUpdateName !== "NA") {
              const record = {
                success: false,
                msg: msg.msgCompanyAlreadyExist,
                key: 4,
              };
              return res.status(200).json(record);
            }

            try {
              let companyLogo = null;
              if (!req.file) {
                companyLogo = checkComapny.companyLogo;
              } else if ("key" in req.file) {
                const filename = req.file.key;
                companyLogo = filename;
              } else {
                companyLogo = req.folderName + "/" + req.file.filename;
              }
              let companyHealthLabels = req.body.companyHealthLabels;
              let tagsId = req.body.tagsId;
              if (typeof companyHealthLabels === "string") {
                companyHealthLabels = JSON.parse(companyHealthLabels);
              }
              if (typeof tagsId === "string") {
                tagsId = JSON.parse(tagsId);
              }

              if (Array.isArray(tagsId)) {
                tagsId = tagsId.map((id) => new mongoose.Types.ObjectId(id));
              }
              const companyData = {
                companyType,
                companyName,
                createdBy: userId,
                companyURL,
                companyEmail,
                companyLogo,
                companyLandmark,
                companyAddress,
                companyCity,
                companyState,
                companyCode,
                companycountryName: checkCountry
                  ? checkCountry?.countryName
                  : null,
                companyCountryCode: checkCountry
                  ? checkCountry?.countryCode
                  : null,
                companycountryId: checkCountry ? checkCountry?._id : null,
                companyPincode,
                companyPrivateNotes,
                companyPublicProfile,
                companyHealthLabels,
                ownerId,
                tagsId,
                companyPhone,
              };

              const updateCompanyDetails =
                await UserCommenService.updateCompany(
                  SITE_DB_NAME,
                  companyId,
                  companyData,
                );
              if (updateCompanyDetails === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgCompanyUpdateError,
                  key: 5,
                };
                return res.status(200).json(record);
              }
              const companyDetails = await UserCommenService.getCompanyDetails(
                SITE_DB_NAME,
                checkComapny._id,
              );

              console.log("companyDetails", companyDetails);

              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const action = "company";
              const notificationOrActivity = 1;
              const actorId = userId;
              const targetCompanyId =
                companyDetails._id || req.query.companyId || null;
              const { title, message } = msg.generateActivityCommenMessage(
                checkUserID.name,
                companyDetails.companyName,
                "",
                "UpdateCompany",
              );
              const titles = title;
              const messages = message;
              const actionId = targetCompanyId;
              const notiUserId = actorId;
              const notiOtherUserId = companyDetails?.ownerId ?? actorId;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];

              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }
              const record = {
                success: true,
                msg: msg.msgCompanyUpdatedSuccess,
                data: { companyDetails: companyDetails },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in updateCompany emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in updateCompany emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in updateCompany emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateCompany emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateTagCompany: [
    query("companyId")
      .trim()
      .exists()
      .withMessage(msg.msgCompanyIdReqired)
      .notEmpty()
      .withMessage(msg.msgCompanyIdReqired),
    body("tagsId")
      .trim()
      .exists()
      .withMessage(msg.msgTagIdReqired)
      .notEmpty()
      .withMessage(msg.msgTagIdReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      let { tagsId } = req.body;
      const { companyId } = req.query;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const checkComapny = await UserCommenService.checkCompany(
              SITE_DB_NAME,
              companyId,
            );
            if (checkComapny === "NA") {
              const record = {
                success: false,
                msg: msg.msgCompanyIsNotExist,
                key: 4,
              };
              return res.status(200).json(record);
            }
            try {
              if (Array.isArray(tagsId)) {
                tagsId = tagsId.map((id) => new mongoose.Types.ObjectId(id));
              }
              const companyData = {
                tagsId,
              };

              const updateCompanyDetails =
                await UserCommenService.updateCompany(
                  SITE_DB_NAME,
                  companyId,
                  companyData,
                );
              if (updateCompanyDetails === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgCompanyTagsError,
                  key: 5,
                };
                return res.status(200).json(record);
              }
              const companyDetails =
                await UserCommenService.getCompanyTagsDetails(
                  SITE_DB_NAME,
                  companyId,
                );

              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const action = "company";
              const notificationOrActivity = 1;
              const actorId = userId;
              const targetCompanyId =
                companyDetails._id || req.query.companyId || null;
              const { title, message } = msg.generateActivityCommenMessage(
                checkUserID.name,
                checkComapny.companyName,
                "",
                "UpdateCompanyTags",
              );
              const titles = title;
              const messages = message;
              const actionId = targetCompanyId;
              const notiUserId = actorId;
              const notiOtherUserId = companyDetails?.ownerId ?? actorId;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];

              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }
              const record = {
                success: true,
                msg: msg.msgCompanyTagsUpdatedSuccess,
                data: { tags: companyDetails.tags },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in updateCompany emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in updateCompany emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in updateCompany emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateCompany emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateCompanyField: [
    query("companyId")
      .trim()
      .exists()
      .withMessage(msg.msgCompanyIdReqired)
      .notEmpty()
      .withMessage(msg.msgCompanyIdReqired),
    body("fieldName")
      .trim()
      .exists()
      .withMessage(msg.msgFieldNameReqired)
      .notEmpty()
      .withMessage(msg.msgFieldNameReqired),

    body("value").exists().withMessage(msg.msgFieldValueReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      let { fieldName, value } = req.body;
      const { companyId } = req.query;
      try {
        const userId = req.CURRENT_USER_ID;
        const currentUser = req.CURRENT_USER;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkComapny = await UserCommenService.checkCompany(
            SITE_DB_NAME,
            companyId,
          );
          if (checkComapny === "NA") {
            const record = {
              success: false,
              msg: msg.msgCompanyIsNotExist,
              key: 4,
            };
            return res.status(200).json(record);
          }
          try {
            const companyData = {
              [fieldName]: value,
            };

            const updateCompanyDetails =
              await UserCommenService.updateCompanyField(
                SITE_DB_NAME,
                companyId,
                companyData,
              );
            if (updateCompanyDetails === "NA") {
              const record = {
                success: false,
                msg: msg.msgCompanyFieldError,
                key: 5,
              };
              return res.status(200).json(record);
            }
            const companyDetails =
              await UserCommenService.getCompanyFieldDetails(
                SITE_DB_NAME,
                companyId,
                fieldName,
              );

            if (companyDetails === "NA") {
              const record = {
                success: true,
                msg: msg.msgDataFound,
                data: {
                  task: [],
                },
              };
              return res.status(200).json(record);
            }

            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "company";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetCompanyId =
              companyDetails._id || req.query.companyId || null;
            const { title, message } = msg.generateActivityCommenMessage(
              currentUser.name,
              checkComapny.companyName,
              "",
              "UpdateCompanyField",
            );
            const titles = title;
            const messages = message;
            const actionId = targetCompanyId;
            const notiUserId = actorId;
            const notiOtherUserId = companyDetails?.ownerId ?? actorId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgCompanyFieldUpdatedSuccess,
              data: { companyField: companyDetails },
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in updateCompany emp 5", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 5,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in updateCompany emp 4", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 4,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateCompany emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  deleteCompany: [
    query("companyId")
      .trim()
      .exists()
      .withMessage(msg.msgCompanyIdReqired)
      .notEmpty()
      .withMessage(msg.msgCompanyIdReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { companyId } = req.query;
          const checkCompany = await UserCommenService.checkCompanyId(
            SITE_DB_NAME,
            companyId,
          );
          if (checkCompany === "NA") {
            const record = {
              success: false,
              msg: msg.msgCompanyIDIsNotExist,
              key: 4,
            };
            return res.status(200).json(record);
          }
          try {
            const company = await UserCommenService.deleteCompany(
              SITE_DB_NAME,
              companyId,
            );

            if (company === "NA") {
              const record = {
                success: false,
                msg: msg.msgCompanyDeleteError,
                key: 3,
              };
              return res.status(200).json(record);
            }
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "company";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetCompanyId =
              companyDetails._id || req.query.companyId || null;
            const { title, message } = msg.generateActivityCommenMessage(
              checkUserID.name,
              checkCompany?.companyName,
              "",
              "DeleteCompany",
            );
            const titles = title;
            const messages = message;
            const actionId = targetCompanyId;
            const notiUserId = actorId;
            const notiOtherUserId = companyDetails?.ownerId ?? actorId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }

            const record = {
              success: true,
              msg: msg.msgCompanyDeleteSuccess,
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in deleteCompany emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in deleteCompany emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in deleteCompany emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  //====================================== Update-Company-Tanant ===========================
  editCompanyEssentials: [
    body("companyName")
      .trim()
      .exists()
      .withMessage(msg.msgCompanyNameReqired)
      .notEmpty()
      .withMessage(msg.msgCompanyNameReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        const userName = req.CURRENT_USER?.name;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          const {
            companyName,
            companyURL,
            companyEmail,
            industryId,
            companyNumber,
          } = data;
          try {
            let companyLogo = null;
            if (!req.file) {
              companyLogo = await UserCommenService.getCompany(
                SITE_DB_NAME,
                userId,
              ).companyLogo;
            } else if ("key" in req.file) {
              const filename = req.file.key;
              companyLogo = filename;
            } else {
              companyLogo = req.folderName + "/" + req.file.filename;
            }

            const userUpdate = {
              companyName,
              companyLogo,
              companyURL,
              companyEmail,
              industryId,
              companyNumber,
            };
            const updateUserCompany = await UserCommenService.updateUserCompany(
              SITE_DB_NAME,
              userId,
              userUpdate,
            );
            if (updateUserCompany === "NA") {
              const record = {
                success: false,
                msg: msg.msgCompanyUpdateError,
              };
              return res.status(200).json(record);
            }
            const userCompanyDetails = await UserCommenService.getCompany(
              SITE_DB_NAME,
              userId,
            );
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "company";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetCompanyId = userCompanyDetails._id || null;
            const { title, message } = msg.generateActivityCommenMessage(
              userName,
              userCompanyDetails.companyName,
              "",
              "UpdateCompany",
            );
            const titles = title;
            const messages = message;
            const actionId = targetCompanyId;
            const notiUserId = actorId;
            const notiOtherUserId = userCompanyDetails?.ownerId ?? actorId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgCompanyUpdateSuccess,
              data: { userCompanyDetails: userCompanyDetails },
            };
            return res.status(200).json(record);
          } catch (error) {
            console.log("database error key 3", error);
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = { success: false, msg: msg.msgServerError, key: 1 };
        return res.status(500).json(record);
      }
    },
  ],

  editCompanyAddress: [
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      } else {
        const data = req.body;
        try {
          const userId = req.CURRENT_USER_ID;
          const userName = req.CURRENT_USER?.name;
          if (!userId && userId === 0) {
            const record = { success: false, msg: msg.msgUserNotExist };
            return res.status(200).json(record);
          } else {
            const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
            if (!SITE_DB_NAME) {
              const record = { success: false, msg: msg.msgUserNotExist };
              return res.status(200).json(record);
            }
            try {
              const {
                companyLandmark,
                companyAddress,
                companyCity,
                companyState,
                countryName,
                countryId,
                countryCode,
                pincode,
              } = data;
              try {
                const userUpdate = {
                  companyLandmark,
                  companyAddress,
                  companyCity,
                  companyState,
                  countryName,
                  countryId,
                  countryCode,
                  pincode,
                };
                const updateUserCompany =
                  await UserCommenService.updateUserCompany(
                    SITE_DB_NAME,
                    userId,
                    userUpdate,
                  );
                if (updateUserCompany === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgCompanyUpdateError,
                  };
                  return res.status(200).json(record);
                } else {
                  const userCompanyDetails = await UserCommenService.getCompany(
                    SITE_DB_NAME,
                    userId,
                  );
                  const APP_LOGO = process.env.APP_LOGO || "";
                  const APP_SITE_URL = process.env.SITE_URL || "";
                  const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                  const action = "company";
                  const notificationOrActivity = 1;
                  const actorId = userId;
                  const targetCompanyId = userCompanyDetails._id || null;
                  const { title, message } = msg.generateActivityCommenMessage(
                    userName,
                    userCompanyDetails.companyName,
                    "",
                    "UpdateCompany",
                  );
                  const titles = title;
                  const messages = message;
                  const actionId = targetCompanyId;
                  const notiUserId = actorId;
                  const notiOtherUserId =
                    userCompanyDetails?.ownerId ?? actorId;
                  const actionJson = {
                    actionId: actionId,
                    action: action,
                    option: {
                      logoUrl: APP_LOGO,
                      redirectionUrl: {
                        webLink: APP_SITE_URL,
                        deepLink: APP_DEEP_LINK_URL,
                      },
                      imageUrl: "",
                      soundFile: "",
                    },
                    appType: "customer",
                  };
                  let notificationArr = [];

                  const notification =
                    await oneSignalHelperUser.getNotificationArrSingle(
                      SITE_DB_NAME,
                      notiUserId,
                      notiOtherUserId,
                      action,
                      actionId,
                      titles,
                      messages,
                      actionJson,
                      notificationOrActivity,
                    );

                  if (notification !== "NA") {
                    notificationArr.push(notification);
                  }
                  if (notificationArr.length > 0) {
                    notificationArr.push(notification);
                    await oneSignalHelperUser.oneSignalNotificationSendCall(
                      notificationArr,
                    );
                  }
                  const record = {
                    success: true,
                    msg: msg.msgCompanyUpdateSuccess,
                    data: { userCompanyDetails: userCompanyDetails },
                  };
                  return res.status(200).json(record);
                }
              } catch (error) {
                console.log("database error key 3", error);
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 2,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              console.log("database error key 2", error);
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 2,
              };
              return res.status(500).json(record);
            }
          }
        } catch (error) {
          console.log("database error key 1", error);
          const record = { success: false, msg: msg.msgServerError, key: 1 };
          return res.status(500).json(record);
        }
      }
    },
  ],
  editCompanyProfileDescription: [
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        const userName = req.CURRENT_USER?.name;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          const { companyPublicProfile } = data;
          try {
            const userUpdate = {
              companyPublicProfile,
            };
            const updateUserCompany = await UserCommenService.updateUserCompany(
              SITE_DB_NAME,
              userId,
              userUpdate,
            );
            if (updateUserCompany === "NA") {
              const record = {
                success: false,
                msg: msg.msgCompanyUpdateError,
              };
              return res.status(200).json(record);
            }
            const userCompanyDetails = await UserCommenService.getCompany(
              SITE_DB_NAME,
              userId,
            );
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "company";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetCompanyId = userCompanyDetails._id || null;
            const { title, message } = msg.generateActivityCommenMessage(
              userName,
              userCompanyDetails.companyName,
              "",
              "UpdateCompany",
            );
            const titles = title;
            const messages = message;
            const actionId = targetCompanyId;
            const notiUserId = actorId;
            const notiOtherUserId = userCompanyDetails?.ownerId ?? actorId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgCompanyUpdateSuccess,
              data: { userCompanyDetails: userCompanyDetails },
            };
            return res.status(200).json(record);
          } catch (error) {
            console.log("database error key 3", error);
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = { success: false, msg: msg.msgServerError, key: 1 };
        return res.status(500).json(record);
      }
    },
  ],
  editCompanyCustomField: [
    body("companyId")
      .exists()
      .withMessage(msg.msgCompanyIdReqired)
      .notEmpty()
      .withMessage(msg.msgCompanyIdReqired),
    body("keyName")
      .exists()
      .withMessage(msg.msgCompanyKeyNameReqired)
      .notEmpty()
      .withMessage(msg.msgCompanyKeyNameReqired),
    body("value")
      .exists()
      .withMessage(msg.msgCompanyCustomFieldValueReqired)
      .notEmpty()
      .withMessage(msg.msgCompanyCustomFieldValueReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        const userName = req.CURRENT_USER?.name;
        const roleName = req.CURRENT_USER?.roleName;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        if (roleName !== "Site-Owner" && roleName !== "Admin") {
          const record = {
            success: false,
            msg: msg.msgPermissionDenied,
          };
          return res.status(200).json(record);
        }
        try {
          const { companyId, keyName, value } = data;
          try {
            const checkCompany = await UserCommenService.checkCompany(
              SITE_DB_NAME,
              companyId,
            );
            if (checkCompany === "NA") {
              const record = {
                success: false,
                msg: msg.msgCompanyIsNotExist,
              };
              return res.status(200).json(record);
            }
            const updateCompanyData = {
              [`customFields.${keyName}.value`]: value,
            };

            const updateCompany =
              await UserCommenService.updateCompanyCustomField(
                SITE_DB_NAME,
                checkCompany._id,
                keyName,
                updateCompanyData,
              );
            if (updateCompany === "NA") {
              const record = {
                success: false,
                msg: msg.msgCompanyUpdateError,
              };
              return res.status(200).json(record);
            }

            const getCompanyDetails = await UserCommenService.getCompanyDetails(
              SITE_DB_NAME,
              checkCompany._id,
            );
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "company";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetCompanyId = checkCompany._id || null;
            const { title, message } = msg.generateActivityCommenMessage(
              userName,
              getCompanyDetails.companyName,
              "",
              "UpdateCompany",
            );
            const titles = title;
            const messages = message;
            const actionId = targetCompanyId;
            const notiUserId = actorId;
            const notiOtherUserId = checkCompany?.ownerId ?? actorId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgCompanyUpdateSuccess,
              data: { companyDetails: getCompanyDetails },
            };
            return res.status(200).json(record);
          } catch (error) {
            console.log("database error key 3", error);
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = { success: false, msg: msg.msgServerError, key: 1 };
        return res.status(500).json(record);
      }
    },
  ],

  editCompanyPrivateNotes: [
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        const userName = req.CURRENT_USER?.name;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          const { companyPrivateNotes } = data;
          try {
            const userUpdate = {
              companyPrivateNotes,
            };
            const updateUserCompany = await UserCommenService.updateUserCompany(
              SITE_DB_NAME,
              userId,
              userUpdate,
            );
            if (updateUserCompany === "NA") {
              const record = {
                success: false,
                msg: msg.msgCompanyUpdateError,
              };
              return res.status(200).json(record);
            }
            const userCompanyDetails = await UserCommenService.getCompany(
              SITE_DB_NAME,
              userId,
            );
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "company";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetCompanyId = userCompanyDetails._id || null;
            const { title, message } = msg.generateActivityCommenMessage(
              userName,
              userCompanyDetails.companyName,
              "",
              "UpdateCompany",
            );
            const titles = title;
            const messages = message;
            const actionId = targetCompanyId;
            const notiUserId = actorId;
            const notiOtherUserId = userCompanyDetails?.ownerId ?? actorId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgCompanyUpdateSuccess,
              data: { userCompanyDetails: userCompanyDetails },
            };
            return res.status(200).json(record);
          } catch (error) {
            console.log("database error key 3", error);
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = { success: false, msg: msg.msgServerError, key: 1 };
        return res.status(500).json(record);
      }
    },
  ],
  //====================================== Tanant-Peopel-Flow ===========================
  getRoles: [
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
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const userId = req.CURRENT_USER_ID;
      const roleName = req.CURRENT_USER?.roleName;
      const { deleteFlag } = req.query;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const roleDetails = await UserCommenService.getRoles(
              SITE_DB_NAME,
              Number(deleteFlag),
            );
            if (roleDetails === "NA") {
              const record = {
                success: true,
                msg: msg.msgDataFound,
                data: {
                  roleDetails: [],
                },
              };
              return res.status(200).json(record);
            }

            const filteredRoles = roleDetails.filter(
              (item) =>
                item.roleName !== "Super-Admin" &&
                item.roleName !== "Site-Owner",
            );
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                roles: filteredRoles,
              },
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in getRoles emp 4", {
              error,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in getRoles emp 2", {
            error,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in getRoles emp 1", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],
  createPeople: [
    body("playerId")
      .trim()
      .exists()
      .withMessage(msg.msgPlayerIdReqired)
      .notEmpty()
      .withMessage(msg.msgPlayerIdReqired),
    body("deviceType")
      .trim()
      .exists()
      .withMessage(msg.msgdeviceTypeReqired)
      .notEmpty()
      .withMessage(msg.msgdeviceTypeReqired),
    body("loginType")
      .trim()
      .exists()
      .withMessage(msg.msgloginTypeReqired)
      .notEmpty()
      .withMessage(msg.msgloginTypeReqired),
    body("email")
      .trim()
      .exists()
      .withMessage(msg.msgEmailReqired)
      .notEmpty()
      .withMessage(msg.msgEmailReqired)
      .isEmail()
      .withMessage(msg.msgEmailInvalidFormat),
    body("firstName")
      .trim()
      .exists()
      .withMessage(msg.msgFirstNameReqired)
      .notEmpty()
      .withMessage(msg.msgFirstNameReqired),
    body("lastName")
      .trim()
      .exists()
      .withMessage(msg.msgLastNameReqired)
      .notEmpty()
      .withMessage(msg.msgLastNameReqired),
    body("companyId")
      .trim()
      .exists()
      .withMessage(msg.msgCompanyIdReqired)
      .notEmpty()
      .withMessage(msg.msgCompanyIdReqired),
    body("roleId")
      .trim()
      .exists()
      .withMessage(msg.msgRoleIdReqired)
      .notEmpty()
      .withMessage(msg.msgRoleIdReqired),
    body("roleName")
      .trim()
      .exists()
      .withMessage(msg.msgRoleNameReqired)
      .notEmpty()
      .withMessage(msg.msgRoleNameReqired),
    body("accessLevel")
      .trim()
      .exists()
      .withMessage(msg.msgAccessPermissionReqired)
      .notEmpty()
      .withMessage(msg.msgAccessPermissionReqired),
    body("accessPreferenceLevel")
      .trim()
      .exists()
      .withMessage(msg.msgAccesPreferenceReqired)
      .notEmpty()
      .withMessage(msg.msgAccesPreferenceReqired),
    // body("unitId")
    //   .trim()
    //   .exists()
    //   .withMessage(msg.msgUnitIdReqired)
    //   .notEmpty()
    //   .withMessage(msg.msgUnitIdReqired),
    // body("shiftId")
    //   .trim()
    //   .exists()
    //   .withMessage(msg.msgShiftIdReqired)
    //   .notEmpty()
    //   .withMessage(msg.msgShiftIdReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      const { email } = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        const workspaceName = req.CURRENT_SITE_WORKSPACE?.workspaceName;
        const currentUserName = req.CURRENT_USER?.name;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const checkEmail = await UserCommenService.checkEmail(
              SITE_DB_NAME,
              email,
            );
            if (checkEmail !== "NA") {
              const record = {
                success: false,
                msg: msg.msgEmailAlreadyExist,
                key: 4,
              };
              return res.status(200).json(record);
            }

            try {
              const filesArray = Array.isArray(req.files)
                ? req.files
                : Object.values(req.files).flat();

              // Single images
              const image =
                filesArray.find((f) => f.fieldname === "image")?.key || null;
              const aadharImage =
                filesArray.find((f) => f.fieldname === "aadharImage")?.key ||
                null;
              const PANImage =
                filesArray.find((f) => f.fieldname === "PANImage")?.key || null;

              // Documents from body
              const newDocuments = Array.isArray(req.body.documents)
                ? req.body.documents
                : [];

              const documents = newDocuments.map((doc, index) => {
                // Multer se fieldname EXACTLY yahi aa raha hai:
                const fieldName = `documents[${index}][document]`;

                // Matching file
                const uploadedFile = filesArray.find(
                  (f) => f.fieldname === fieldName,
                );

                return {
                  documentName: doc.documentName || null,
                  organizationName: doc.organizationName || null,
                  start: doc.start || null,
                  end: doc.end || null,

                  document: uploadedFile
                    ? uploadedFile.key // new uploaded file
                    : doc.document || null, // if already exists (old)
                };
              });

              let { workingHours } = req.body;
              let { social } = req.body;
              if (typeof workingHours === "string") {
                try {
                  workingHours = JSON.parse(workingHours);
                } catch (e) {
                  const record = {
                    success: false,
                    msg: msg.msgInvalidJSONWorkingHours,
                    key: "workingHours",
                  };
                  return res.status(200).json(record);
                }
              }
              if (typeof social === "string") {
                try {
                  social = JSON.parse(social);
                } catch (e) {
                  const record = {
                    success: false,
                    msg: msg.msgInvalidJSONSocial,
                    key: "social",
                  };
                  return res.status(200).json(record);
                }
              }
              const signupSteps = 1;
              const otpVerify = 1;
              const registeredById = userId;
              const workspaceId = req.CURRENT_USER?.workspaceId;
              const uniqueIdNumber = req.CURRENT_SITE_WORKSPACE_NUMBER;

              const uniqueId = await UserCommenService.checkPeopleLastNumber(
                SITE_DB_NAME,
                uniqueIdNumber,
              );

              if (uniqueId === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgPeopleLastNumberIsNotFind,
                  key: 4,
                };
                return res.status(200).json(record);
              }
              let reportingManagerId = req.body.reportingManagerId
                ? req.body.reportingManagerId
                : null;
              const {
                playerId,
                deviceType,
                loginType,
                email,
                firstName,
                lastName,
                companyId,
                roleId,
                designationId,
                billableRate,
                billableCost,
                jobTitle,
                mobileNumber,
                emergencyContactNumber,
                personalEmail,
                officePhone,
                landMark,
                address,
                city,
                state,
                countryId,
                pincode,
                publicProfile,
                privateNotes,
                languageId = 0,
                dateFormat,
                timeFormat,
                timeZone,
                calendarStart,
                roleName,
                projectIds,
                sendInviteType,
                aadharNumber,
                PANNumber,
                bankName,
                bankAccountNumber,
                IFSCCode,
                accountHolderName,
                addressProof,
                pLandMark,
                pAddress,
                pCity,
                pState,
                pPincode,
                unitId,
                shiftId,
                gender,
                originalDob,
                fatherName,
                motherName,
                spouseName,
                maritalStatus,
                bloodGroup,
                religion,
                physicallyChallenged,
                joiningDate,
              } = data;

              let checkCountry;
              if (countryId) {
                checkCountry = await UserCommenService.checkCountry(countryId);
              }

              let accessLevel = data.accessLevel;
              let accessPreferenceLevel = data.accessPreferenceLevel;
              const name = firstName + " " + lastName;
              if (typeof accessLevel === "string") {
                try {
                  accessLevel = JSON.parse(accessLevel);
                } catch (e) {
                  const record = {
                    success: false,
                    msg: msg.msgInvalidJSONAccessLevel,
                    key: "accessLevel",
                  };
                  return res.status(200).json(record);
                }
              }

              if (typeof accessPreferenceLevel === "string") {
                try {
                  accessPreferenceLevel = JSON.parse(accessPreferenceLevel);
                } catch (e) {
                  const record = {
                    success: false,
                    msg: msg.msgInvalidJSONAccessPreferenceLevel,
                    key: "accessPreferenceLevel",
                  };
                  return res.status(200).json(record);
                }
              }
              const designationDetails =
                await UserCommenService.getDesignationById(
                  SITE_DB_NAME,
                  designationId,
                );
              const roleDetails = await UserCommenService.getRoleById(
                SITE_DB_NAME,
                roleId,
              );
              const companyDetails = await UserCommenService.getCompanyById(
                SITE_DB_NAME,
                companyId,
              );

              const bankStatus = bankAccountNumber ? 1 : 0;

              const documentStatus =
                Array.isArray(documents) && documents.length > 0 ? 1 : 0;

              const peopleData = {
                workspaceId,
                otpVerify,
                playerId,
                deviceType,
                loginType,
                image,
                email,
                aadharImage,
                PANImage,
                firstName,
                lastName,
                uniqueId,
                empId: uniqueId,
                name,
                companyId: companyDetails?._id || null,
                designationId: designationDetails?._id || null,
                designationName: designationDetails?.name || null,
                billableRate,
                billableCost,
                jobTitle,
                mobileNumber,
                emergencyContactNumber,
                personalEmail,
                officePhone,
                landMark,
                address,
                city,
                state,
                countryName: checkCountry ? checkCountry?.countryName : null,
                countryId: checkCountry ? checkCountry?._id : null,
                countryCode: checkCountry ? checkCountry?.countryCode : null,
                pincode,
                publicProfile,
                privateNotes,
                languageId,
                dateFormat,
                timeFormat,
                timeZone,
                calendarStart,
                social,
                workingHours,
                roleId: roleDetails?._id || null,
                roleName,
                accessLevel,
                accessPreferenceLevel,
                signupSteps,
                registeredById,
                documents,
                documentStatus,
                aadharNumber,
                PANNumber,
                bankName,
                bankAccountNumber,
                IFSCCode,
                accountHolderName,
                bankStatus,
                addressProof,
                pLandMark,
                pAddress,
                pCity,
                pState,
                pCountryName: checkCountry ? checkCountry?.countryName : null,
                pPincode,
                unitId,
                shiftId,
                reportingManagerId,
                gender,
                originalDob,
                fatherName,
                motherName,
                spouseName,
                maritalStatus,
                bloodGroup,
                religion,
                physicallyChallenged,
                joiningDate,
              };

              const createPeople = await UserCommenService.createPeople(
                SITE_DB_NAME,
                peopleData,
              );

              if (createPeople === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgCreatePeopleError,
                };
                return res.status(200).json(record);
              }
              const createdUserId = createPeople?._id;
              const createdUserName = createPeople?.name;
              const userDetails = await UserCommenService.getUserDetails(
                SITE_DB_NAME,
                createdUserId,
              );
              const now = new Date();
              const expireTime = now.setMinutes(
                now.getMinutes() + process.env.MAIL_EXPIRE_TIME,
              );
              const forgotPassIdentity =
                await CommenFunction.generateRandomPassword(15);
              const fpCode = Buffer.from(
                createdUserId + "-" + expireTime + "-" + forgotPassIdentity,
              ).toString("base64");
              const siteURL =
                `https://` + req.CURRENT_SITE_WORKSPACE?.workspaceFullDomain;
              const mailEmail = email;
              const mailName = await CommenFunction.capitalizeFirstLetter(name);
              const resetPassLink = siteURL + "/accept-invite/" + fpCode;
              const mailSubject = msg.mailSubjectInvite(
                currentUserName,
                roleName,
                workspaceName,
              )[languageId];
              const mailHeading = msg.mailHeadingInvite(
                currentUserName,
                roleName,
                workspaceName,
              )[languageId];
              const headerGreeting = msg.mailHeaderGreetingInvite[languageId];

              try {
                const mailFromName = process.env.MAIL_FROM_NAME;
                const appName = process.env.APP_NAME;
                const appLogo = process.env.APP_LOGO;
                const INVITE_PNG = process.env.INVITE_PNG;
                const borderBackground = process.env.BORDERBACKGROUND;
                const footerGreeting = msg.mailFooterGreeting[languageId];
                const footerDescription = msg.mailFooterDescription[languageId];
                const footerBackground = process.env.FOOTERBACKGROUND;
                const bodyData = {
                  appName,
                  resetPassLink,
                  INVITE_PNG,
                  footerBackground,
                  currentUserName,
                  workspaceName,
                };
                const mailContent = msg.mailContentInvite(bodyData)[languageId];

                const mailBody = await MailFunctions.mailBodyData({
                  appName: appName,
                  appLogo: appLogo,
                  borderBackground: borderBackground,
                  mailHeading: mailHeading,
                  headerGreeting: headerGreeting,
                  name: mailName,
                  mailContent: mailContent,
                  footerGreeting: footerGreeting,
                  footerBackground: footerBackground,
                  footerDescription: footerDescription,
                });

                try {
                  if (Number(sendInviteType) === 1) {
                    const responce = await MailFunctions.mailSend(
                      mailEmail,
                      mailFromName,
                      mailSubject,
                      mailBody,
                    );
                    if (!responce) {
                      const record = {
                        success: false,
                        msg: msg.msgOTPMailSendError,
                      };
                      return res.status(200).json(record);
                    }
                    const record = {
                      success: true,
                      msg: msg.msgPeopleCreatedSuccess,
                      data: {
                        userDetails,
                        userDetails,
                        responce: responce,
                      },
                      key: 1,
                    };
                    return res.status(200).json(record);
                  }
                  const APP_LOGO = process.env.APP_LOGO || "";
                  const APP_SITE_URL = process.env.SITE_URL || "";
                  const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                  const action = "people";
                  const notificationOrActivity = 1;
                  const actorId = userId;
                  const targetPeopleId = createPeople._id;

                  const { title, message } = msg.generateActivityCommenMessage(
                    checkUserID.name,
                    createdUserName,
                    "",
                    "CreatePeople",
                  );
                  const titles = title;
                  const messages = message;
                  const actionId = targetPeopleId;
                  const notiUserId = actorId;
                  const notiOtherUserId = targetPeopleId;
                  const actionJson = {
                    actionId: actionId,
                    action: action,
                    option: {
                      logoUrl: APP_LOGO,
                      redirectionUrl: {
                        webLink: APP_SITE_URL,
                        deepLink: APP_DEEP_LINK_URL,
                      },
                      imageUrl: "",
                      soundFile: "",
                    },
                    appType: "customer",
                  };
                  let notificationArr = [];

                  const notification =
                    await oneSignalHelperUser.getNotificationArrSingle(
                      SITE_DB_NAME,
                      notiUserId,
                      notiOtherUserId,
                      action,
                      actionId,
                      titles,
                      messages,
                      actionJson,
                      notificationOrActivity,
                    );

                  if (notification !== "NA") {
                    notificationArr.push(notification);
                  }
                  if (notificationArr.length > 0) {
                    notificationArr.push(notification);
                    await oneSignalHelperUser.oneSignalNotificationSendCall(
                      notificationArr,
                    );
                  }
                  const record = {
                    success: true,
                    msg: msg.msgPeopleCreatedSuccess,
                    data: { userDetails, userDetails },
                    key: 1,
                  };
                  return res.status(200).json(record);
                } catch (error) {
                  logger.error("mail error key 2", {
                    error: error.message,
                  });
                  const record = {
                    success: false,
                    msg: msg.msgServerError,
                    key: error,
                  };
                  return res.status(500).json(record);
                }
              } catch (error) {
                logger.error("mail error key 1", {
                  error: error.message,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: error.message,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              logger.error("Database error in createPeople emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in createPeople emp 4", {
              error,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createPeople emp 2", { error });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in createPeople emp 1", { error });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],
  resendInvite: [
    body("userId")
      .trim()
      .exists()
      .withMessage(msg.msgUserIdReqired)
      .notEmpty()
      .withMessage(msg.msgUserIdReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      const { userId, sendInviteType = 0 } = data;
      try {
        const currentUserId = req.CURRENT_USER_ID;
        const currentRoleName = req.CURRENT_USER?.roleName;
        const workspaceName = req.CURRENT_SITE_WORKSPACE?.workspaceName;
        const currentUserName = await CommenFunction.capitalizeFirstLetter(
          req.CURRENT_USER?.name || "NA",
        );
        if (!currentUserId && currentUserId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          currentUserId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
            key: 2,
          };
          return res.status(200).json(record);
        }
        if (currentRoleName !== "Site-Owner" && currentRoleName !== "Admin") {
          const record = {
            success: false,
            msg: msg.msgPermissionDenied,
            key: 3,
          };
          return res.status(200).json(record);
        }

        try {
          const checkUser = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUser === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 4,
            };
            return res.status(200).json(record);
          }

          const createdUserId = userId;
          const userDetails = await UserCommenService.getUserDetails(
            SITE_DB_NAME,
            checkUser._id,
          );
          const now = new Date();
          const expireTime = now.setMinutes(
            now.getMinutes() + process.env.MAIL_EXPIRE_TIME,
          );
          const forgotPassIdentity =
            await CommenFunction.generateRandomPassword(15);
          const fpCode = Buffer.from(
            createdUserId + "-" + expireTime + "-" + forgotPassIdentity,
          ).toString("base64");
          const siteURL =
            `https://` + req.CURRENT_SITE_WORKSPACE?.workspaceFullDomain;
          const mailEmail = userDetails.email;
          const mailName = await CommenFunction.capitalizeFirstLetter(
            userDetails.name,
          );
          const languageId = userDetails.languageId || 0;
          const resetPassLink = siteURL + "/accept-invite/" + fpCode;
          const mailSubject = msg.mailSubjectInvite(
            currentUserName,
            userDetails.roleName,
            workspaceName,
          )[languageId];
          const mailHeading = msg.mailHeadingInvite(
            currentUserName,
            userDetails.roleName,
            workspaceName,
          )[languageId];
          const headerGreeting = msg.mailHeaderGreetingInvite[languageId];

          const mailFromName = process.env.MAIL_FROM_NAME;
          const appName = process.env.APP_NAME;
          const appLogo = process.env.APP_LOGO;
          const INVITE_PNG = process.env.INVITE_PNG;
          const borderBackground = process.env.BORDERBACKGROUND;
          const footerGreeting = msg.mailFooterGreeting[languageId];
          const footerDescription = msg.mailFooterDescription[languageId];
          const footerBackground = process.env.FOOTERBACKGROUND;
          const bodyData = {
            appName,
            resetPassLink,
            INVITE_PNG,
            footerBackground,
            currentUserName,
            workspaceName,
          };
          const mailContent = msg.mailContentInvite(bodyData)[languageId];
          const mailBody = await MailFunctions.mailBodyData({
            appName: appName,
            appLogo: appLogo,
            borderBackground: borderBackground,
            mailHeading: mailHeading,
            headerGreeting: headerGreeting,
            name: mailName,
            mailContent: mailContent,
            footerGreeting: footerGreeting,
            footerBackground: footerBackground,
            footerDescription: footerDescription,
          });

          try {
            if (Number(sendInviteType) === 1) {
              const responce = await MailFunctions.mailSend(
                mailEmail,
                mailFromName,
                mailSubject,
                mailBody,
              );
              if (!responce) {
                const record = {
                  success: false,
                  msg: msg.msgOTPMailSendError,
                };
                return res.status(200).json(record);
              }
              const record = {
                success: true,
                msg: msg.msgPeopleInviteSuccess,
                data: {
                  userDetails,
                  userDetails,
                  responce: responce,
                  inviteLink: resetPassLink,
                },
                key: 1,
              };
              return res.status(200).json(record);
            } else {
              const record = {
                success: true,
                msg: msg.msgPeopleInviteSuccess,
                data: { userDetails, userDetails, inviteLink: resetPassLink },
                key: 1,
              };
              return res.status(200).json(record);
            }
          } catch (error) {
            logger.error("mail error key 1", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: error.message,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createPeople emp 5", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 5,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in createPeople emp 1", { error });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  getInvitePeopleDetails: [
    query("fpCode")
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
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      try {
        const { fpCode } = req.query;
        if (typeof fpCode !== "string" || !fpCode.trim()) {
          const record = {
            success: false,
            msg: msg.msgInvalidToken,
            key: 1,
          };
          return res.status(200).json(record);
        }
        const uniqueIdDataDecode = Buffer.from(fpCode, "base64").toString();
        const uniqueIdDataArr = uniqueIdDataDecode.split("-");
        if (uniqueIdDataArr.length === 0) {
          const record = {
            success: false,
            msg: msg.msgAllFieldReqired,
            key: 1,
          };
          return res.status(200).json(record);
        }
        const userId = uniqueIdDataArr[0];
        //  || checkUserId?.profileComplete === 1
        const checkUserId = await UserCommenService.checkUserId(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserId === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
            key: 1,
          };
          return res.status(200).json(record);
        }
        try {
          const userDetails = await UserCommenService.getUserDetails(
            SITE_DB_NAME,
            checkUserId._id,
          );
          if (userDetails === "NA") {
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                userDetails: [],
              },
            };
            return res.status(200).json(record);
          }
          const record = {
            success: true,
            msg: msg.msgDataFound,
            data: {
              userDetails: userDetails,
            },
          };
          return res.status(200).json(record);
        } catch (error) {
          logger.error("Database error in getInvitePeopleDetails emp 5", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 5,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in getInvitePeopleDetails emp 1", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  peopleCompleteSetup: [
    body("fpCode")
      .exists()
      .withMessage(msg.msgAllFieldReqired)
      .notEmpty()
      .withMessage(msg.msgAllFieldReqired),
    body("playerId")
      .trim()
      .exists()
      .withMessage(msg.msgPlayerIdReqired)
      .notEmpty()
      .withMessage(msg.msgPlayerIdReqired),
    body("loginType")
      .trim()
      .exists()
      .withMessage(msg.msgloginTypeReqired)
      .notEmpty()
      .withMessage(msg.msgloginTypeReqired),
    body("deviceType")
      .trim()
      .exists()
      .withMessage(msg.msgdeviceTypeReqired)
      .notEmpty()
      .withMessage(msg.msgdeviceTypeReqired),
    body("firstName")
      .trim()
      .exists()
      .withMessage(msg.msgFirstNameReqired)
      .notEmpty()
      .withMessage(msg.msgFirstNameReqired),
    body("lastName")
      .trim()
      .exists()
      .withMessage(msg.msgLastNameReqired)
      .notEmpty()
      .withMessage(msg.msgLastNameReqired),
    body("password")
      .trim()
      .exists()
      .withMessage(msg.msgPasswordReqired)
      .notEmpty()
      .withMessage(msg.msgPasswordReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      } else {
        try {
          const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;

          const {
            playerId,
            loginType,
            deviceType,
            fpCode,
            password,
            //essentials
            firstName,
            lastName,
            designationId,
            mobileNumber,
            //details
            gender,
            maritalStatus,
            jobTitle,
            originalDob,
            spouseName,
            emergencyContactNumber,
            fatherName,
            bloodGroup,
            officePhone,
            motherName,
            religion,
            personalEmail,
            physicallyChallenged,
            //account details
            bankName,
            bankAccountNumber,
            IFSCCode,
            accountHolderName,
            //documents
            aadharNumber,
            PANNumber,
            //address
            landMark,
            address,
            city,
            state,
            countryId,
            pincode,
            addressProof,
            pLandMark,
            pAddress,
            pCity,
            pState,
            pPincode,
            profileComplete, // send 1 in last tab
          } = req.body;

          let checkCountry;
          if (countryId) {
            checkCountry = await UserCommenService.checkCountry(countryId);
          }
          if (typeof fpCode !== "string" || !fpCode.trim()) {
            const record = {
              success: false,
              msg: msg.msgInvalidToken,
              key: 1,
            };
            return res.status(200).json(record);
          }
          const uniqueIdDataDecode = Buffer.from(fpCode, "base64").toString();
          const uniqueIdDataArr = uniqueIdDataDecode.split("-");
          if (uniqueIdDataArr.length === 0) {
            const record = {
              success: false,
              msg: msg.msgAllFieldReqired,
              key: 1,
            };
            return res.status(200).json(record);
          }
          const userId = uniqueIdDataArr[0];
          //  || checkUserId?.profileComplete === 1
          const checkUserId = await UserCommenService.checkUserId(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserId === "NA" || checkUserId.profileComplete == 1) {
            const record = {
              success: false,
              msg: msg.msgLinkExpired,
              key: 1,
            };
            return res.status(200).json(record);
          }
          let showPassword = password
            ? password
            : await CommenFunction.generateRandomPassword(10);
          let hashPassword = await CommenFunction.hashPassword(showPassword);
          const designationDetails = await UserCommenService.getDesignationById(
            SITE_DB_NAME,
            designationId,
          );
          const signupSteps = 2;
          const name = firstName + " " + lastName;
          const filesArray = Array.isArray(req.files)
            ? req.files
            : Object.values(req.files || {}).flat();

          const oldDocuments = checkUserId?.documents || [];

          const image =
            filesArray.find((f) => f.fieldname === "image")?.key ||
            checkUserId?.image ||
            null;

          const aadharImage =
            filesArray.find((f) => f.fieldname === "aadharImage")?.key ||
            checkUserId?.aadharImage ||
            null;
          const PANImage =
            filesArray.find((f) => f.fieldname === "PANImage")?.key ||
            checkUserId?.PANImage ||
            null;

          const newDocuments = Array.isArray(req.body.documents)
            ? req.body.documents
            : [];

          const documents = newDocuments.map((doc, index) => {
            const uploadedFile = filesArray.find(
              (f) => f.fieldname === `documents[${index}][document]`,
            );
            const oldDoc =
              oldDocuments.find(
                (od) =>
                  od.documentName &&
                  doc.documentName &&
                  od.documentName.toLowerCase() ===
                    doc.documentName.toLowerCase(),
              ) || {};

            return {
              documentName: doc.documentName || oldDoc.documentName || null,
              organizationName:
                doc.organizationName || oldDoc.organizationName || null,
              start: doc.start || oldDoc.start || null,
              end: doc.end || oldDoc.end || null,
              document: uploadedFile
                ? uploadedFile.key
                : oldDoc.document || null,
            };
          });

          const bankStatus = bankAccountNumber ? 1 : 0;
          const documentStatus =
            Array.isArray(documents) && documents.length > 0 ? 1 : 0;

          const data = {
            playerId,
            loginType,
            deviceType,
            password: hashPassword,
            showPassword,
            signupSteps,
            //essentials
            image,
            name,
            firstName,
            lastName,
            designationId: designationDetails?._id || null,
            mobileNumber,
            //details
            gender,
            maritalStatus,
            jobTitle,
            originalDob,
            spouseName,
            emergencyContactNumber,
            fatherName,
            bloodGroup,
            officePhone,
            motherName,
            religion,
            personalEmail,
            physicallyChallenged,
            //account details
            bankName,
            bankAccountNumber,
            IFSCCode,
            accountHolderName,
            bankStatus,
            //documents
            aadharNumber,
            PANNumber,
            aadharImage,
            PANImage,
            documents,
            documentStatus,
            //address
            landMark,
            address,
            city,
            state,
            countryName: checkCountry ? checkCountry?.countryName : null,
            countryId: checkCountry ? checkCountry?._id : null,
            countryCode: checkCountry ? checkCountry?.countryCode : null,
            pincode,
            addressProof,
            pLandMark,
            pAddress,
            pCity,
            pState,
            pCountryName: checkCountry ? checkCountry?.countryName : null,
            pPincode,
            timeZone: checkCountry ? checkCountry?.timeZone[0].value : null,
            profileComplete, // send 1 in last tab
          };

          const updateUser = await UserCommenService.updateTenantUserProfile(
            SITE_DB_NAME,
            checkUserId._id,
            data,
          );
          if (updateUser === "NA") {
            const record = {
              success: false,
              msg: msg.msgProfileUpdateError,
            };
            return res.status(200).json(record);
          } else {
            const userDetails = await UserCommenService.getUserDetails(
              SITE_DB_NAME,
              checkUserId._id,
            );

            const jwtSecretKey = process.env.JWT_SECRET_KEY;
            const expiresIn = process.env.JWT_EXPIRES_IN;
            const token = jwt.sign({ userId: userId }, jwtSecretKey, {
              expiresIn: expiresIn,
            });
            const deviceStatus =
              await oneSignalHelperUser.DeviceTokenStore_1_Signal(
                SITE_DB_NAME,
                userId,
                deviceType,
                loginType,
                playerId,
              );

            if (deviceStatus === "no") {
              await oneSignalHelperUser.DeviceTokenStore_1_Signal(
                SITE_DB_NAME,
                userId,
                deviceType,
                loginType,
                playerId,
              );
            }
            if (!checkUserId.lastLoginTime) {
              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const notiUserId = userId;
              const notiOtherUserId = userId;
              const action = "login";
              const actionId = null;
              const titles = msg.msgNotificationWelcomeTitle;
              const messages = msg.msgNotificationWelcomeMessage;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];
              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  (notificationOrActivity = 1),
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }
            }
            const workspaceDetails = await CommenService.getWorkspaceDetails(
              userDetails?.workspaceId || null,
            );
            const otherUserDetails = await UserCommenService.getUserDetails(
              SITE_DB_NAME,
              userDetails?.registeredById,
            );

            const createdUserId = userId;
            const now = new Date();
            const expireTime = now.setMinutes(
              now.getMinutes() + process.env.MAIL_EXPIRE_TIME,
            );
            const forgotPassIdentity =
              await CommenFunction.generateRandomPassword(15);
            const fpCode = Buffer.from(
              createdUserId + "-" + expireTime + "-" + forgotPassIdentity,
            ).toString("base64");
            const siteURL =
              `https://` + req.CURRENT_SITE_WORKSPACE?.workspaceFullDomain;
            const mailEmail = otherUserDetails.email;
            const mailName = await CommenFunction.capitalizeFirstLetter(
              otherUserDetails.name,
            );
            const currentUserName = await CommenFunction.capitalizeFirstLetter(
              userDetails?.name || "NA",
            );
            const languageId = userDetails.languageId || 0;
            const resetPassLink = siteURL + "/people/details/" + userId;
            const mailSubject = msg.mailSubjectInviteAccept(
              currentUserName,
              userDetails.roleName,
              workspaceDetails?.workspaceName,
            )[languageId];
            const mailHeading = msg.mailHeadingInviteAccept(
              currentUserName,
              userDetails.roleName,
              workspaceDetails?.workspaceName,
            )[languageId];
            const headerGreeting =
              msg.mailHeaderGreetingInviteAccept[languageId];

            const mailFromName = process.env.MAIL_FROM_NAME;
            const appName = process.env.APP_NAME;
            const appLogo = process.env.APP_LOGO;
            const ACCEPT_INVITE_PNG = process.env.ACCEPT_INVITE_PNG;
            const borderBackground = process.env.BORDERBACKGROUND;
            const footerGreeting = msg.mailFooterGreeting[languageId];
            const footerDescription = msg.mailFooterDescription[languageId];
            const footerBackground = process.env.FOOTERBACKGROUND;
            const bodyData = {
              appName,
              resetPassLink,
              ACCEPT_INVITE_PNG,
              footerBackground,
              currentUserName,
              workspaceName: workspaceDetails?.workspaceName,
              siteURL,
            };
            const mailContent =
              msg.mailContentInviteAccept(bodyData)[languageId];
            const mailBody = await MailFunctions.mailBodyData({
              appName: appName,
              appLogo: appLogo,
              borderBackground: borderBackground,
              mailHeading: mailHeading,
              headerGreeting: headerGreeting,
              name: mailName,
              mailContent: mailContent,
              footerGreeting: footerGreeting,
              footerBackground: footerBackground,
              footerDescription: footerDescription,
            });
            const responce = await MailFunctions.mailSend(
              mailEmail,
              mailFromName,
              mailSubject,
              mailBody,
            );
            if (!responce) {
              const record = {
                success: false,
                msg: msg.msgProfileUpdateError,
              };
              return res.status(200).json(record);
            } else {
              const userDetails = await UserCommenService.getUserDetails(
                SITE_DB_NAME,
                checkUserId._id,
              );

              const jwtSecretKey = process.env.JWT_SECRET_KEY;
              const expiresIn = process.env.JWT_EXPIRES_IN;
              const token = jwt.sign({ userId: userId }, jwtSecretKey, {
                expiresIn: expiresIn,
              });
              const deviceStatus =
                await oneSignalHelperUser.DeviceTokenStore_1_Signal(
                  SITE_DB_NAME,
                  userId,
                  deviceType,
                  loginType,
                  playerId,
                );

              if (deviceStatus === "no") {
                await oneSignalHelperUser.DeviceTokenStore_1_Signal(
                  SITE_DB_NAME,
                  userId,
                  deviceType,
                  loginType,
                  playerId,
                );
              }
              if (!checkUserId.lastLoginTime) {
                const APP_LOGO = process.env.APP_LOGO || "";
                const APP_SITE_URL = process.env.SITE_URL || "";
                const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                const notiUserId = userId;
                const notiOtherUserId = userId;
                const action = "login";
                const actionId = null;
                const titles = msg.msgNotificationWelcomeTitle;
                const messages = msg.msgNotificationWelcomeMessage;
                const actionJson = {
                  actionId: actionId,
                  action: action,
                  option: {
                    logoUrl: APP_LOGO,
                    redirectionUrl: {
                      webLink: APP_SITE_URL,
                      deepLink: APP_DEEP_LINK_URL,
                    },
                    imageUrl: "",
                    soundFile: "",
                  },
                  appType: "customer",
                };
                let notificationArr = [];
                const notification =
                  await oneSignalHelperUser.getNotificationArrSingle(
                    SITE_DB_NAME,
                    notiUserId,
                    notiOtherUserId,
                    action,
                    actionId,
                    titles,
                    messages,
                    actionJson,
                    (notificationOrActivity = 1),
                  );

                if (notification !== "NA") {
                  notificationArr.push(notification);
                }
                if (notificationArr.length > 0) {
                  notificationArr.push(notification);
                  await oneSignalHelperUser.oneSignalNotificationSendCall(
                    notificationArr,
                  );
                }
              }
              const workspaceDetails = await CommenService.getWorkspaceDetails(
                userDetails?.workspaceId || null,
              );
              const otherUserDetails = await UserCommenService.getUserDetails(
                SITE_DB_NAME,
                userDetails?.registeredById,
              );

              const createdUserId = userId;
              const now = new Date();
              const expireTime = now.setMinutes(
                now.getMinutes() + process.env.MAIL_EXPIRE_TIME,
              );
              const forgotPassIdentity =
                await CommenFunction.generateRandomPassword(15);
              const fpCode = Buffer.from(
                createdUserId + "-" + expireTime + "-" + forgotPassIdentity,
              ).toString("base64");
              const siteURL =
                `https://` + req.CURRENT_SITE_WORKSPACE?.workspaceFullDomain;
              const mailEmail = otherUserDetails.email;
              const mailName = await CommenFunction.capitalizeFirstLetter(
                otherUserDetails.name,
              );
              const currentUserName =
                await CommenFunction.capitalizeFirstLetter(
                  userDetails?.name || "NA",
                );
              const languageId = userDetails.languageId || 0;
              const resetPassLink = siteURL + "/people/details/" + userId;
              const mailSubject = msg.mailSubjectInviteAccept(
                currentUserName,
                userDetails.roleName,
                workspaceDetails?.workspaceName,
              )[languageId];
              const mailHeading = msg.mailHeadingInviteAccept(
                currentUserName,
                userDetails.roleName,
                workspaceDetails?.workspaceName,
              )[languageId];
              const headerGreeting =
                msg.mailHeaderGreetingInviteAccept[languageId];

              const mailFromName = process.env.MAIL_FROM_NAME;
              const appName = process.env.APP_NAME;
              const appLogo = process.env.APP_LOGO;
              const ACCEPT_INVITE_PNG = process.env.ACCEPT_INVITE_PNG;
              const borderBackground = process.env.BORDERBACKGROUND;
              const footerGreeting = msg.mailFooterGreeting[languageId];
              const footerDescription = msg.mailFooterDescription[languageId];
              const footerBackground = process.env.FOOTERBACKGROUND;
              const bodyData = {
                appName,
                resetPassLink,
                ACCEPT_INVITE_PNG,
                footerBackground,
                currentUserName,
                workspaceName: workspaceDetails?.workspaceName,
                siteURL,
              };
              const mailContent =
                msg.mailContentInviteAccept(bodyData)[languageId];
              const mailBody = await MailFunctions.mailBodyData({
                appName: appName,
                appLogo: appLogo,
                borderBackground: borderBackground,
                mailHeading: mailHeading,
                headerGreeting: headerGreeting,
                name: mailName,
                mailContent: mailContent,
                footerGreeting: footerGreeting,
                footerBackground: footerBackground,
                footerDescription: footerDescription,
              });
              const responce = await MailFunctions.mailSend(
                mailEmail,
                mailFromName,
                mailSubject,
                mailBody,
              );
              if (!responce) {
                const record = {
                  success: false,
                  msg: msg.msgOTPMailSendError,
                };
                return res.status(200).json(record);
              }
              let record = {
                success: true,
                msg:
                  userDetails?.profileComplete === 0
                    ? msg.msgPeopleStepCompletedSuccess
                    : msg.msgInvitationAcceptSuccess,
                data: { userDetails: userDetails },
              };
              if (userDetails?.profileComplete === 1) {
                record.token = token;
                record.data = { userDetails };
              }
              return res.status(200).json(record);
            }
            const record = {
              success: true,
              msg: msg.msgInvitationAcceptSuccess,
              token: token,
              data: { userDetails: userDetails },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          logger.error("Database error in peopleCompleteSetup emp 1", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 1,
          };
          return res.status(500).json(record);
        }
      }
    },
  ],

  getPeople: [
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
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const userId = req.CURRENT_USER_ID;
      const { deleteFlag } = req.query;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          const pagination = {
            pageSize: parseInt(req.query.pageSize) || null,
            pageNumber: parseInt(req.query.pageNumber) || null,
          };
          const search = req.query.search || "";
          const byCompany = req.query.companyId || "";
          const byRoleId = req.query.roleId || "";
          const byRole = req.query.byRole || "";
          const byProject = req.query.projectId || "";
          try {
            const peopleDetails = await UserCommenService.getPeople(
              SITE_DB_NAME,
              Number(deleteFlag),
              pagination,
              search,
              byCompany,
              byRoleId,
              byRole,
              byProject,
            );
            if (peopleDetails === "NA") {
              const record = {
                success: true,
                msg: msg.msgDataFound,
                data: {
                  peopleDetails: [],
                },
              };
              return res.status(200).json(record);
            }
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                peopleDetails: peopleDetails,
              },
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in getPeople emp 3", {
              error,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in getPeople emp 2", {
            error,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in getPeople emp 1", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  editPeople: [
    body("targetUserId")
      .trim()
      .exists()
      .withMessage(msg.msgUserIdReqired)
      .notEmpty()
      .withMessage(msg.msgUserIdReqired),
    body("email")
      .trim()
      .exists()
      .withMessage(msg.msgEmailReqired)
      .notEmpty()
      .withMessage(msg.msgEmailReqired)
      .isEmail()
      .withMessage(msg.msgEmailInvalidFormat),
    body("firstName")
      .trim()
      .exists()
      .withMessage(msg.msgFirstNameReqired)
      .notEmpty()
      .withMessage(msg.msgFirstNameReqired),
    body("lastName")
      .trim()
      .exists()
      .withMessage(msg.msgLastNameReqired)
      .notEmpty()
      .withMessage(msg.msgLastNameReqired),
    body("companyId")
      .trim()
      .exists()
      .withMessage(msg.msgCompanyIdReqired)
      .notEmpty()
      .withMessage(msg.msgCompanyIdReqired),
    body("roleId")
      .trim()
      .exists()
      .withMessage(msg.msgRoleIdReqired)
      .notEmpty()
      .withMessage(msg.msgRoleIdReqired),
    body("roleName")
      .trim()
      .exists()
      .withMessage(msg.msgRoleNameReqired)
      .notEmpty()
      .withMessage(msg.msgRoleNameReqired),
    body("accessLevel")
      .trim()
      .exists()
      .withMessage(msg.msgAccessPermissionReqired)
      .notEmpty()
      .withMessage(msg.msgAccessPermissionReqired),
    body("accessPreferenceLevel")
      .trim()
      .exists()
      .withMessage(msg.msgAccesPreferenceReqired)
      .notEmpty()
      .withMessage(msg.msgAccesPreferenceReqired),

    // body("unitId")
    //   .trim()
    //   .exists()
    //   .withMessage(msg.msgUnitIdReqired)
    //   .notEmpty()
    //   .withMessage(msg.msgUnitIdReqired),
    // body("shiftId")
    //   .trim()
    //   .exists()
    //   .withMessage(msg.msgShiftIdReqired)
    //   .notEmpty()
    //   .withMessage(msg.msgShiftIdReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      const { email, targetUserId } = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        const CURRENT_USER = req.CURRENT_USER;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const checkPeopleId = await UserCommenService.checkPeopleId(
              SITE_DB_NAME,
              targetUserId,
            );
            if (checkPeopleId === "NA") {
              const record = {
                success: false,
                msg: msg.msgPeopleIsNotExist,
                key: 4,
              };
              return res.status(200).json(record);
            }
            const checkEmail = await UserCommenService.checkUpdateEmail(
              SITE_DB_NAME,
              targetUserId,
              email,
            );
            if (checkEmail !== "NA") {
              const record = {
                success: false,
                msg: msg.msgEmailAlreadyExist,
                key: 4,
              };
              return res.status(200).json(record);
            }
            try {
              const filesArray = Array.isArray(req.files)
                ? req.files
                : Object.values(req.files || {}).flat();

              const oldDocuments = checkPeopleId?.documents || [];

              const image =
                filesArray.find((f) => f.fieldname === "image")?.key ||
                checkPeopleId?.image ||
                null;

              const aadharImage =
                filesArray.find((f) => f.fieldname === "aadharImage")?.key ||
                checkPeopleId?.aadharImage ||
                null;
              const PANImage =
                filesArray.find((f) => f.fieldname === "PANImage")?.key ||
                checkPeopleId?.PANImage ||
                null;

              const newDocuments = Array.isArray(req.body.documents)
                ? req.body.documents
                : [];

              const documents = newDocuments.map((doc, index) => {
                const uploadedFile = filesArray.find(
                  (f) => f.fieldname === `documents[${index}][document]`,
                );
                const oldDoc =
                  oldDocuments.find(
                    (od) =>
                      od.documentName &&
                      doc.documentName &&
                      od.documentName.toLowerCase() ===
                        doc.documentName.toLowerCase(),
                  ) || {};

                return {
                  documentName: doc.documentName || oldDoc.documentName || null,
                  organizationName:
                    doc.organizationName || oldDoc.organizationName || null,
                  start: doc.start || oldDoc.start || null,
                  end: doc.end || oldDoc.end || null,
                  document: uploadedFile
                    ? uploadedFile.key
                    : oldDoc.document || null,
                };
              });

              let { workingHours } = req.body;
              let { social } = req.body;
              if (typeof workingHours === "string") {
                try {
                  workingHours = JSON.parse(workingHours);
                } catch (e) {
                  const record = {
                    success: false,
                    msg: msg.msgInvalidJSONWorkingHours,
                    key: "workingHours",
                  };
                  return res.status(200).json(record);
                }
              }
              if (typeof social === "string") {
                try {
                  social = JSON.parse(social);
                } catch (e) {
                  const record = {
                    success: false,
                    msg: msg.msgInvalidJSONSocial,
                    key: "social",
                  };
                  return res.status(200).json(record);
                }
              }

              let reportingManagerId = req.body.reportingManagerId
                ? req.body.reportingManagerId
                : null;

              const {
                email,
                firstName,
                lastName,
                companyId,
                roleId,
                designationId,
                billableRate,
                billableCost,
                jobTitle,
                mobileNumber,
                emergencyContactNumber,
                personalEmail,
                officePhone,
                landMark,
                address,
                city,
                state,
                countryId,
                pincode,
                publicProfile,
                privateNotes,
                languageId,
                dateFormat,
                timeFormat,
                timeZone,
                calendarStart,
                roleName,
                aadharNumber,
                PANNumber,
                bankName,
                bankAccountNumber,
                IFSCCode,
                accountHolderName,
                addressProof,
                pLandMark,
                pAddress,
                pCity,
                pState,
                pPincode,
                unitId,
                shiftId,
                gender,
                originalDob,
                fatherName,
                motherName,
                spouseName,
                maritalStatus,
                bloodGroup,
                religion,
                physicallyChallenged,
                joiningDate,
              } = data;
              let checkCountry;
              if (countryId) {
                checkCountry = await UserCommenService.checkCountry(countryId);
              }
              let accessLevel = data.accessLevel;
              let accessPreferenceLevel = data.accessPreferenceLevel;
              const name = firstName + " " + lastName;
              if (typeof accessLevel === "string") {
                try {
                  accessLevel = JSON.parse(accessLevel);
                } catch (e) {
                  const record = {
                    success: false,
                    msg: msg.msgInvalidJSONAccessLevel,
                    key: "accessLevel",
                  };
                  return res.status(200).json(record);
                }
              }

              if (typeof accessPreferenceLevel === "string") {
                try {
                  accessPreferenceLevel = JSON.parse(accessPreferenceLevel);
                } catch (e) {
                  const record = {
                    success: false,
                    msg: msg.msgInvalidJSONAccessPreferenceLevel,
                    key: "accessPreferenceLevel",
                  };
                  return res.status(200).json(record);
                }
              }
              const designationDetails =
                await UserCommenService.getDesignationById(
                  SITE_DB_NAME,
                  designationId,
                );
              const roleDetails = await UserCommenService.getRoleById(
                SITE_DB_NAME,
                roleId,
              );
              const companyDetails = await UserCommenService.getCompanyById(
                SITE_DB_NAME,
                companyId,
              );
              const bankStatus = bankAccountNumber ? 1 : 0;
              const documentStatus =
                Array.isArray(documents) && documents.length > 0 ? 1 : 0;
              const peopleData = {
                image,
                email,
                aadharImage,
                PANImage,
                firstName,
                lastName,
                name,
                companyId: companyDetails?._id || null,
                designationId: designationDetails?._id || null,
                designationName: designationDetails?.name || null,
                billableRate,
                billableCost,
                jobTitle,
                mobileNumber,
                emergencyContactNumber,
                personalEmail,
                officePhone,
                landMark,
                address,
                city,
                state,
                countryName: checkCountry ? checkCountry?.countryName : null,
                countryId: checkCountry ? checkCountry?._id : null,
                countryCode: checkCountry ? checkCountry?.countryCode : null,
                pincode,
                publicProfile,
                privateNotes,
                languageId,
                dateFormat,
                timeFormat,
                timeZone,
                calendarStart,
                social,
                workingHours,
                roleId: roleDetails?._id || null,
                roleName,
                accessLevel,
                accessPreferenceLevel,
                documents,
                documentStatus,
                aadharNumber,
                PANNumber,
                bankName,
                bankAccountNumber,
                IFSCCode,
                accountHolderName,
                bankStatus,
                addressProof,
                pLandMark,
                pAddress,
                pCity,
                pState,
                pCountryName: checkCountry ? checkCountry?.countryName : null,
                pPincode,
                unitId,
                shiftId,
                reportingManagerId,
                gender,
                originalDob,
                fatherName,
                motherName,
                spouseName,
                maritalStatus,
                bloodGroup,
                religion,
                physicallyChallenged,
                joiningDate,
              };

              const updatePeople = await UserCommenService.updatePeople(
                SITE_DB_NAME,
                targetUserId,
                peopleData,
              );
              if (updatePeople === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUpdatePeopleError,
                };
                return res.status(200).json(record);
              }
              const userDetails = await UserCommenService.getPeopleDetails(
                SITE_DB_NAME,
                targetUserId,
              );

              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const action = "people";
              const notificationOrActivity = 1;
              // const actionId = userId;
              const actorId = userId;
              const targetPeopleId =
                userDetails._id || req.body.targetUserId || null;
              const { title, message } = msg.generateActivityCommenMessage(
                checkUserID.name,
                name,
                "",
                "UpdatePeople",
              );
              const titles = title;
              const messages = message;
              // const actionOtherId = targetPeopleId;
              const actionId = targetPeopleId;
              const notiUserId = actorId;
              const notiOtherUserId = targetPeopleId;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];

              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }
              const record = {
                success: true,
                msg: msg.msgPeopleUpdatedSuccess,
                data: { userDetails: userDetails },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in editPeople emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in editPeople emp 4", {
              error,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in editPeople emp 2", { error });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in editPeople emp 1", { error });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  deletePeople: [
    query("peopleId")
      .trim()
      .exists()
      .withMessage(msg.msgPeopleIdReqired)
      .notEmpty()
      .withMessage(msg.msgPeopleIdReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { peopleId } = req.query;
          const checkPeople = await UserCommenService.checkPeopleId(
            SITE_DB_NAME,
            peopleId,
          );
          if (checkPeople === "NA") {
            const record = {
              success: false,
              msg: msg.msgPeopleIDIsNotExist,
              key: 4,
            };
            return res.status(200).json(record);
          }

          try {
            const people = await UserCommenService.deletePeople(
              SITE_DB_NAME,
              checkPeople._id,
            );

            if (people === "NA") {
              const record = {
                success: false,
                msg: msg.msgPeopleDeleteError,
                key: 3,
              };
              return res.status(200).json(record);
            }
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "people";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetPeopleId =
              checkPeople._id || req.query.peopleId || null;
            const { title, message } = msg.generateActivityCommenMessage(
              checkUserID.name,
              checkPeople?.name,
              "",
              "DeletedPeople",
            );
            const titles = title;
            const messages = message;
            const actionId = targetPeopleId;
            const notiUserId = actorId;
            const notiOtherUserId = targetPeopleId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }

            const record = {
              success: true,
              msg: msg.msgPeopleDeleteSuccess,
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in deletePeople emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in deletePeople emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in deletePeople emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  activeDeactivePeople: [
    query("peopleId")
      .trim()
      .exists()
      .withMessage(msg.msgPeopleIdReqired)
      .notEmpty()
      .withMessage(msg.msgPeopleIdReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { peopleId } = req.query;
          const checkPeople = await UserCommenService.checkPeopleId(
            SITE_DB_NAME,
            peopleId,
          );
          if (checkPeople === "NA") {
            const record = {
              success: false,
              msg: msg.msgPeopleIDIsNotExist,
              key: 4,
            };
            return res.status(200).json(record);
          }

          try {
            const people = await UserCommenService.activeDeactivePeople(
              SITE_DB_NAME,
              checkPeople._id,
              checkPeople?.activeFlag,
            );

            if (people === "NA") {
              const record = {
                success: false,
                msg:
                  checkPeople?.activeFlag === 0
                    ? msg.msgPeopleActiveError
                    : msg.msgPeopleDeactiveError,
                key: 3,
              };
              return res.status(200).json(record);
            }
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "people";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetPeopleId =
              checkPeople._id || req.query.peopleId || null;
            const { title, message } = msg.generateActivityCommenMessage(
              checkUserID.name,
              checkPeople?.name,
              "",
              checkPeople?.activeFlag === 0 ? "ActivePeople" : "DeactivePeople",
            );
            const titles = title;
            const messages = message;
            const actionId = targetPeopleId;
            const notiUserId = actorId;
            const notiOtherUserId = targetPeopleId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }

            const record = {
              success: true,
              msg:
                checkPeople?.activeFlag === 0
                  ? msg.msgPeopleActiveSuccess // Activated successfully
                  : msg.msgPeopleDeactiveSuccess,
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in activeDeactivePeople emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in activeDeactivePeople emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in activeDeactivePeople emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  createSkill: [
    body("skillName")
      .trim()
      .exists()
      .withMessage(msg.msgSkillNameReqired)
      .notEmpty()
      .withMessage(msg.msgSkillNameReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const { skillName } = data;
            const checkSkill = await UserCommenService.checkSkill(
              SITE_DB_NAME,
              skillName,
            );
            if (checkSkill !== "NA") {
              const record = {
                success: false,
                msg: msg.msgSkillAlreadyExist,
                key: 4,
              };
              return res.status(200).json(record);
            }
            try {
              const { skillName, peopleId } = data;
              const userData = { skillName };
              const createSkill = await UserCommenService.createSkill(
                SITE_DB_NAME,
                userData,
              );
              if (createSkill === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgCreateSkillError,
                  key: 5,
                };
                return res.status(200).json(record);
              }
              const createdSkillId = createSkill?._id;
              const updatePeople =
                await UserCommenService.updateMultiPeopleAndRemoveInSkills(
                  SITE_DB_NAME,
                  peopleId,
                  createdSkillId,
                );
              if (updatePeople === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUpdatePeopleError,
                };
                return res.status(200).json(record);
              }
              const skillsDetails = await UserCommenService.getSkillDetails(
                SITE_DB_NAME,
                createdSkillId,
              );

              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const action = "people";
              const notificationOrActivity = 1;
              const actorId = userId;
              const peopleIdArray =
                peopleId && peopleId.length > 0 ? peopleId : [null];

              let notificationArr = [];
              // const targetPeopleId = peopleId || null;

              for (const targetPeopleId of peopleIdArray) {
                const { title, message } = msg.generateActivityCommenMessage(
                  checkUserID.name,
                  skillsDetails?.skillName,
                  "",
                  "SkillCreate",
                );
                const titles = title;
                const messages = message;
                const actionId = targetPeopleId;
                const notiUserId = actorId;
                const notiOtherUserId = targetPeopleId ?? userId;
                const actionJson = {
                  actionId: actionId,
                  action: action,
                  option: {
                    logoUrl: APP_LOGO,
                    redirectionUrl: {
                      webLink: APP_SITE_URL,
                      deepLink: APP_DEEP_LINK_URL,
                    },
                    imageUrl: "",
                    soundFile: "",
                  },
                  appType: "customer",
                };
                const notification =
                  await oneSignalHelperUser.getNotificationArrSingle(
                    SITE_DB_NAME,
                    notiUserId,
                    notiOtherUserId,
                    action,
                    actionId,
                    titles,
                    messages,
                    actionJson,
                    notificationOrActivity,
                  );

                if (notification !== "NA") {
                  notificationArr.push(notification);
                }
                if (notificationArr.length > 0) {
                  notificationArr.push(notification);
                  await oneSignalHelperUser.oneSignalNotificationSendCall(
                    notificationArr,
                  );
                }
              }

              const record = {
                success: true,
                msg: msg.msgSkillCreatedSuccess,
                data: { skillsDetails: skillsDetails },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in createSkill emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in createSkill emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createSkill emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in createSkill emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  getSkills: [
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
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const userId = req.CURRENT_USER_ID;
      const roleName = req.CURRENT_USER?.roleName;
      const { deleteFlag } = req.query;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const pagination = {
              pageSize: parseInt(req.query.pageSize) || 10,
              pageNumber: parseInt(req.query.pageNumber) || 1,
            };

            const search = req.query.search || "";
            const skillsDetails = await UserCommenService.getSkills(
              SITE_DB_NAME,
              Number(deleteFlag),
              pagination,
              search,
            );
            if (skillsDetails === "NA") {
              const record = {
                success: true,
                msg: msg.msgDataFound,
                data: {
                  skillsDetails: [],
                },
              };
              return res.status(200).json(record);
            }
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                skillsDetails: skillsDetails,
              },
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in getSkills emp 4", {
              error,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in getSkills emp 2", {
            error,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in getSkills emp 1", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateSkill: [
    body("skillName")
      .trim()
      .exists()
      .withMessage(msg.msgSkillNameReqired)
      .notEmpty()
      .withMessage(msg.msgSkillNameReqired),
    body("skillId")
      .trim()
      .exists()
      .withMessage(msg.msgskillIdIsReqired)
      .notEmpty()
      .withMessage(msg.msgskillIdIsReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const { skillName, skillId } = data;
            const checkSkillId = await UserCommenService.checkSkillId(
              SITE_DB_NAME,
              skillId,
            );
            if (checkSkillId === "NA") {
              const record = {
                success: false,
                msg: msg.msgSkillIDIsNotExist,
                key: 4,
              };
              return res.status(200).json(record);
            }

            const checkSkillName = await UserCommenService.checkUpdateSkillName(
              SITE_DB_NAME,
              skillId,
              skillName,
            );

            if (checkSkillName !== "NA") {
              const record = {
                success: false,
                msg: msg.msgSkillAlreadyExist,
                key: 4,
              };
              return res.status(200).json(record);
            }
            try {
              const userData = { skillName };
              const updateSkill = await UserCommenService.updateSkill(
                SITE_DB_NAME,
                skillId,
                userData,
              );
              if (updateSkill === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUpdateSkillError,
                  key: 5,
                };
                return res.status(200).json(record);
              }
              const { peopleId } = req.body;
              try {
                const updatePeople =
                  await UserCommenService.updateMultiPeopleAndRemoveInSkills(
                    SITE_DB_NAME,
                    peopleId,
                    skillId,
                  );
                if (updatePeople === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgUpdatePeopleError,
                  };
                  return res.status(200).json(record);
                }
                const skillsDetails = await UserCommenService.getSkillDetails(
                  SITE_DB_NAME,
                  skillId,
                );
                const APP_LOGO = process.env.APP_LOGO || "";
                const APP_SITE_URL = process.env.SITE_URL || "";
                const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                const action = "people";
                const notificationOrActivity = 1;
                const actorId = userId;
                const peopleIdArray =
                  peopleId && peopleId.length > 0 ? peopleId : [null];

                let notificationArr = [];
                for (const targetPeopleId of peopleIdArray) {
                  const { title, message } = msg.generateActivityCommenMessage(
                    checkUserID.name,
                    skillsDetails?.skillName,
                    "",
                    "SkillUpdated",
                  );
                  const titles = title;
                  const messages = message;
                  const actionId = targetPeopleId;
                  const notiUserId = actorId;
                  const notiOtherUserId = targetPeopleId ?? userId;
                  const actionJson = {
                    actionId: actionId,
                    action: action,
                    option: {
                      logoUrl: APP_LOGO,
                      redirectionUrl: {
                        webLink: APP_SITE_URL,
                        deepLink: APP_DEEP_LINK_URL,
                      },
                      imageUrl: "",
                      soundFile: "",
                    },
                    appType: "customer",
                  };
                  const notification =
                    await oneSignalHelperUser.getNotificationArrSingle(
                      SITE_DB_NAME,
                      notiUserId,
                      notiOtherUserId,
                      action,
                      actionId,
                      titles,
                      messages,
                      actionJson,
                      notificationOrActivity,
                    );

                  if (notification !== "NA") {
                    notificationArr.push(notification);
                  }
                  if (notificationArr.length > 0) {
                    notificationArr.push(notification);
                    await oneSignalHelperUser.oneSignalNotificationSendCall(
                      notificationArr,
                    );
                  }
                }
                const record = {
                  success: true,
                  msg: msg.msgSkillUpdateSuccess,
                  data: { skillsDetails: skillsDetails },
                };

                return res.status(200).json(record);
              } catch (error) {
                logger.error("Database error in updateSkill emp 4", {
                  error: error.message,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 4,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              logger.error("Database error in updateSkill emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in updateSkill emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in updateSkill emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateSkill emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  deleteUserSkill: [
    query("skillId")
      .trim()
      .exists()
      .withMessage(msg.msgskillIdIsReqired)
      .notEmpty()
      .withMessage(msg.msgskillIdIsReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { skillId } = req.query;

          const checkSkillId = await UserCommenService.checkSkillId(
            SITE_DB_NAME,
            skillId,
          );
          if (checkSkillId === "NA") {
            const record = {
              success: false,
              msg: msg.msgSkillIDIsNotExist,
              key: 4,
            };
            return res.status(200).json(record);
          }
          try {
            const peopleId = await UserCommenService.findSkillIdToUserIds(
              SITE_DB_NAME,
              skillId,
            );

            const skill = await UserCommenService.deleteUserSkill(
              SITE_DB_NAME,
              skillId,
            );

            if (skill === "NA") {
              const record = {
                success: false,
                msg: msg.msgDeleteSkillError,
                key: 3,
              };
              return res.status(200).json(record);
            }

            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "people";
            const notificationOrActivity = 1;
            const actorId = userId;
            const peopleIdArray =
              peopleId && peopleId.length > 0 ? peopleId : [null];

            let notificationArr = [];
            for (const targetPeopleId of peopleIdArray) {
              const { title, message } = msg.generateActivityCommenMessage(
                checkUserID.name,
                checkSkillId?.skillName,
                "",
                "DeleteMultiPeopleDesignation",
              );
              const titles = title;
              const messages = message;
              const actionId = targetPeopleId;
              const notiUserId = actorId;
              const notiOtherUserId = targetPeopleId ?? userId;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }
            }

            const record = {
              success: true,
              msg: msg.msgSkillDeleteSuccess,
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in deleteDesignation emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in deleteDesignation emp 3", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 3,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in deleteDesignation emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  createUserSkill: [
    body("userId")
      .trim()
      .exists()
      .withMessage(msg.msgUserIdReqired)
      .notEmpty()
      .withMessage(msg.msgUserIdReqired),
    body("skillId")
      .trim()
      .exists()
      .withMessage(msg.msgSkillIdReqired)
      .notEmpty()
      .withMessage(msg.msgSkillIdReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }

          try {
            const { userId, skillId } = data;
            const checkSkill = await UserCommenService.checkUserSkill(
              SITE_DB_NAME,
              userId,
              skillId,
            );
            if (checkSkill !== "NA") {
              const record = {
                success: false,
                msg: msg.msgUserSkillAlreadyExist,
                key: 4,
              };
              return res.status(200).json(record);
            }
            try {
              const { userId, skillId } = data;
              const userData = { userId, skillId };
              const findUserById = await UserCommenService.checkUser(
                SITE_DB_NAME,
                userId,
              );
              if (findUserById === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUserNotExist,
                  key: 2,
                };
                return res.status(200).json(record);
              }
              const createUserSkill = await UserCommenService.createUserSkill(
                SITE_DB_NAME,
                userData,
              );
              if (createUserSkill === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgCreateUserSkillError,
                  key: 5,
                };
                return res.status(200).json(record);
              }
              const createdUserSkillId = createUserSkill?._id;
              const userSkillsDetails =
                await UserCommenService.getUserSkillDetails(
                  SITE_DB_NAME,
                  createdUserSkillId,
                );

              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const notiUserId = userId;
              const notiOtherUserId = userId;
              const action = "people";
              const notificationOrActivity = 1;
              const actionId = null;
              const { title, message } = msg.generateActivityCommenMessage(
                checkUserID.name,
                findUserById?.name,
                "",
                "SkillPeopleCreate",
              );
              const titles = title;
              const messages = message;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];

              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }
              const record = {
                success: true,
                msg: msg.msgSkillCreatedSuccess,
                data: { userSkillsDetails: userSkillsDetails },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in createUserSkill emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in createUserSkill emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createUserSkill emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in createUserSkill emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  getUsersGroupedBySkills: [
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
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const userId = req.CURRENT_USER_ID;
      const { deleteFlag } = req.query;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const userSkillsDetails =
              await UserCommenService.getUsersGroupedBySkills(
                SITE_DB_NAME,
                Number(deleteFlag),
              );
            if (userSkillsDetails === "NA") {
              const record = {
                success: true,
                msg: msg.msgDataFound,
                data: {
                  userSkillsDetails: [],
                },
              };
              return res.status(200).json(record);
            }
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                userSkillsDetails: userSkillsDetails,
              },
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in getUsersGroupedBySkills emp 3", {
              error,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in getUsersGroupedBySkills emp 2", {
            error,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in getUsersGroupedBySkills emp 1", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateUserSkill: [
    body("userId")
      .trim()
      .exists()
      .withMessage(msg.msgUserIdReqired)
      .notEmpty()
      .withMessage(msg.msgUserIdReqired),
    body("skillId")
      .trim()
      .exists()
      .withMessage(msg.msgSkillIdReqired)
      .notEmpty()
      .withMessage(msg.msgSkillIdReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const { userId, skillId, targetSkillId } = data;
            const checkSkill = await UserCommenService.checkUpdateUserSkill(
              SITE_DB_NAME,
              targetSkillId,
              userId,
              skillId,
            );
            if (checkSkill !== "NA") {
              const record = {
                success: false,
                msg: msg.msgUserSkillAlreadyExist,
                key: 4,
              };
              return res.status(200).json(record);
            }
            try {
              const { userId, skillId, targetSkillId } = data;
              const userData = { userId, skillId };
              const findUserById = await UserCommenService.checkUser(
                SITE_DB_NAME,
                userId,
              );
              if (findUserById === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUserNotExist,
                  key: 2,
                };
                return res.status(200).json(record);
              }
              const updateUserSkill = await UserCommenService.updateUserSkill(
                SITE_DB_NAME,
                targetSkillId,
                userData,
              );
              if (updateUserSkill === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUpdateUserSkillError,
                  key: 5,
                };
                return res.status(200).json(record);
              }
              const usesSkillsDetails =
                await UserCommenService.getUserSkillDetails(
                  SITE_DB_NAME,
                  targetSkillId,
                );

              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const notiUserId = userId;
              const notiOtherUserId = userId;
              const action = "people";
              const notificationOrActivity = 1;
              const actionId = null;
              const { title, message } = msg.generateActivityCommenMessage(
                checkUserID.name,
                findUserById?.name,
                "",
                "SkillPeopleUpdated",
              );
              const titles = title;
              const messages = message;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];

              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }
              const record = {
                success: true,
                msg: msg.msgSkillUpdatedSuccess,
                data: { usesSkillsDetails: usesSkillsDetails },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in updateUserSkill emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in updateUserSkill emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in updateUserSkill emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateUserSkill emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  createTeam: [
    body("teamName")
      .trim()
      .exists()
      .withMessage(msg.msgTeamNameReqired)
      .notEmpty()
      .withMessage(msg.msgTeamNameReqired),
    body("users")
      .trim()
      .exists()
      .withMessage(msg.msgTeamMembersReqired)
      .notEmpty()
      .withMessage(msg.msgTeamMembersReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
            key: 1,
          };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const { teamName } = data;
            const checkTeam = await UserCommenService.checkTeamName(
              SITE_DB_NAME,
              teamName,
            );
            if (checkTeam !== "NA") {
              const record = {
                success: false,
                msg: msg.msgTeamAlreadyExist,
                key: 4,
              };
              return res.status(200).json(record);
            }
            try {
              const { teamName, handleBy, description } = data;
              let { users, companyId } = data;

              let teamLogo = null;
              if (!req.file) {
                teamLogo = req?.file?.teamLogo;
              } else if ("key" in req.file) {
                const filename = req.file.key;
                teamLogo = filename;
              } else {
                teamLogo = req.folderName + "/" + req.file.filename;
              }
              if (!companyId) {
                companyId = null;
              }
              const userData = {
                teamName,
                teamLogo,
                handleBy,
                description,
                companyId,
              };
              const createTeam = await UserCommenService.createTeam(
                SITE_DB_NAME,
                userData,
              );
              if (createTeam === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgCreateTeamError,
                  key: 5,
                };
                return res.status(200).json(record);
              }
              try {
                if (typeof users === "string") {
                  users = JSON.parse(users);
                }
                const teamId = createTeam._id;
                const userTeamData = users.map((userId) => {
                  return { userId, teamId };
                });

                const checkUserTeam = await UserCommenService.checkUserTeam(
                  SITE_DB_NAME,
                  userTeamData,
                );

                if (checkUserTeam !== "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgUserTeamAlreadyExist,
                    key: 6,
                  };
                  return res.status(200).json(record);
                }
                try {
                  const createUserTeamData =
                    await UserCommenService.createUserTeam(
                      SITE_DB_NAME,
                      userTeamData,
                    );
                  if (createUserTeamData === "NA") {
                    const record = {
                      success: false,
                      msg: msg.msgCreateUserTeamError,
                      key: 7,
                    };
                    return res.status(200).json(record);
                  }
                  const teamDetails =
                    await UserCommenService.getUsersGroupedByTeamsSingle(
                      SITE_DB_NAME,
                      teamId,
                    );

                  const APP_LOGO = process.env.APP_LOGO || "";
                  const APP_SITE_URL = process.env.SITE_URL || "";
                  const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                  const action = "people";
                  const notificationOrActivity = 1;
                  const actorId = userId;
                  const peopleIdArray =
                    users && users.length > 0 ? users : [null];

                  let notificationArr = [];
                  for (const targetPeopleId of peopleIdArray) {
                    const { title, message } =
                      msg.generateActivityCommenMessage(
                        checkUserID.name,
                        teamDetails?.teamName,
                        "",
                        "TeamCreate",
                      );
                    const titles = title;
                    const messages = message;
                    const actionId = targetPeopleId;
                    const notiUserId = actorId;
                    const notiOtherUserId = targetPeopleId ?? userId;
                    const actionJson = {
                      actionId: actionId,
                      action: action,
                      option: {
                        logoUrl: APP_LOGO,
                        redirectionUrl: {
                          webLink: APP_SITE_URL,
                          deepLink: APP_DEEP_LINK_URL,
                        },
                        imageUrl: "",
                        soundFile: "",
                      },
                      appType: "customer",
                    };
                    const notification =
                      await oneSignalHelperUser.getNotificationArrSingle(
                        SITE_DB_NAME,
                        notiUserId,
                        notiOtherUserId,
                        action,
                        actionId,
                        titles,
                        messages,
                        actionJson,
                        notificationOrActivity,
                      );

                    if (notification !== "NA") {
                      notificationArr.push(notification);
                    }
                    if (notificationArr.length > 0) {
                      notificationArr.push(notification);
                      await oneSignalHelperUser.oneSignalNotificationSendCall(
                        notificationArr,
                      );
                    }
                  }

                  const record = {
                    success: true,
                    msg: msg.msgTeamAndUserTeamCreatedSuccess,
                    data: {
                      teamDetails: teamDetails,
                    },
                  };

                  return res.status(200).json(record);
                } catch (error) {
                  logger.error("Database error in createTeam emp 7", {
                    error: error.message,
                  });
                  const record = {
                    success: false,
                    msg: msg.msgServerError,
                    key: 7,
                  };
                  return res.status(500).json(record);
                }
              } catch (error) {
                logger.error("Database error in createTeam emp 6", {
                  error: error.message,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 6,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              logger.error("Database error in createTeam emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in createTeam emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createTeam emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in createTeam emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  getUsersGroupedByTeams: [
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
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const userId = req.CURRENT_USER_ID;
      const { deleteFlag } = req.query;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const pagination = {
              pageSize: parseInt(req.query.pageSize) || 10,
              pageNumber: parseInt(req.query.pageNumber) || 1,
            };

            const search = req.query.search || "";
            const byUser = req.query.userId || "";
            const userTeamDetails =
              await UserCommenService.getUsersGroupedByTeams(
                SITE_DB_NAME,
                Number(deleteFlag),
                pagination,
                search,
                byUser,
              );
            if (userTeamDetails === "NA") {
              const record = {
                success: true,
                msg: msg.msgDataFound,
                data: {
                  userTeamDetails: [],
                },
              };
              return res.status(200).json(record);
            }
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                userTeamDetails: userTeamDetails,
              },
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in getUsersGroupedByTeams emp 3", {
              error,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in getUsersGroupedByTeams emp 2", {
            error,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in getUsersGroupedByTeams emp 1", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateTeam: [
    body("teamName")
      .trim()
      .exists()
      .withMessage(msg.msgTeamNameReqired)
      .notEmpty()
      .withMessage(msg.msgTeamNameReqired),
    body("users")
      .trim()
      .exists()
      .withMessage(msg.msgTeamMembersReqired)
      .notEmpty()
      .withMessage(msg.msgTeamMembersReqired),
    body("targetTeamId")
      .trim()
      .exists()
      .withMessage(msg.msgTeamNameReqired)
      .notEmpty()
      .withMessage(msg.msgTeamNameReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      const { teamName, handleBy, description, targetTeamId } = data;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
            key: 1,
          };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const checkTeamID = await UserCommenService.checkTeam(
              SITE_DB_NAME,
              targetTeamId,
            );
            if (checkTeamID === "NA") {
              const record = {
                success: false,
                msg: msg.msgTeamNotExist,
                key: 2,
              };
              return res.status(200).json(record);
            }

            const checkTeam = await UserCommenService.checkTeamNameWithId(
              SITE_DB_NAME,
              targetTeamId,
              teamName,
            );
            if (checkTeam !== "NA") {
              const record = {
                success: false,
                msg: msg.msgTeamAlreadyExist,
                key: 4,
              };
              return res.status(200).json(record);
            }
            try {
              let { users, companyId } = data;
              let teamLogo = null;
              if (!req.file) {
                teamLogo = checkTeam.teamLogo;
              } else if ("key" in req.file) {
                const filename = req.file.key;
                teamLogo = filename;
              } else {
                teamLogo = req.folderName + "/" + req.file.filename;
              }
              if (!companyId) {
                companyId = null;
              }
              const userData = {
                teamName,
                teamLogo,
                handleBy,
                description,
                companyId,
                targetTeamId,
              };
              const updateTeam = await UserCommenService.updateTeam(
                SITE_DB_NAME,
                targetTeamId,
                userData,
              );
              if (updateTeam === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUpdateTeamError,
                  key: 5,
                };
                return res.status(200).json(record);
              }
              try {
                if (typeof users === "string") {
                  users = JSON.parse(users);
                }
                const teamId = targetTeamId;
                const userTeamData = users.map((userId) => {
                  return { userId, teamId };
                });

                const deleteUserTeam = await UserCommenService.deleteUserTeam(
                  SITE_DB_NAME,
                  { teamId },
                );

                if (deleteUserTeam === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgUserTeamDelete,
                    key: 6,
                  };
                  return res.status(200).json(record);
                }
                try {
                  const createUserTeamData =
                    await UserCommenService.createUserTeam(
                      SITE_DB_NAME,
                      userTeamData,
                    );
                  if (createUserTeamData === "NA") {
                    const record = {
                      success: false,
                      msg: msg.msgCreateUserTeamError,
                      key: 7,
                    };
                    return res.status(200).json(record);
                  }
                  const teamDetails =
                    await UserCommenService.getUsersGroupedByTeamsSingle(
                      SITE_DB_NAME,
                      checkTeamID._id,
                    );

                  const APP_LOGO = process.env.APP_LOGO || "";
                  const APP_SITE_URL = process.env.SITE_URL || "";
                  const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                  const action = "people";
                  const notificationOrActivity = 1;
                  const actorId = userId;
                  const peopleIdArray =
                    users && users.length > 0 ? users : [null];

                  let notificationArr = [];
                  for (const targetPeopleId of peopleIdArray) {
                    const { title, message } =
                      msg.generateActivityCommenMessage(
                        checkUserID.name,
                        teamDetails?.teamName,
                        "",
                        "TeamUpdated",
                      );
                    const titles = title;
                    const messages = message;
                    const actionId = targetPeopleId;
                    const notiUserId = actorId;
                    const notiOtherUserId = targetPeopleId ?? userId;
                    const actionJson = {
                      actionId: actionId,
                      action: action,
                      option: {
                        logoUrl: APP_LOGO,
                        redirectionUrl: {
                          webLink: APP_SITE_URL,
                          deepLink: APP_DEEP_LINK_URL,
                        },
                        imageUrl: "",
                        soundFile: "",
                      },
                      appType: "customer",
                    };
                    const notification =
                      await oneSignalHelperUser.getNotificationArrSingle(
                        SITE_DB_NAME,
                        notiUserId,
                        notiOtherUserId,
                        action,
                        actionId,
                        titles,
                        messages,
                        actionJson,
                        notificationOrActivity,
                      );

                    if (notification !== "NA") {
                      notificationArr.push(notification);
                    }
                    if (notificationArr.length > 0) {
                      notificationArr.push(notification);
                      await oneSignalHelperUser.oneSignalNotificationSendCall(
                        notificationArr,
                      );
                    }
                  }

                  const record = {
                    success: true,
                    msg: msg.msgTeamAndUserTeamUpdateSuccess,
                    data: {
                      teamDetails: teamDetails,
                    },
                  };

                  return res.status(200).json(record);
                } catch (error) {
                  logger.error("Database error in createTeam emp 7", {
                    error: error.message,
                  });
                  const record = {
                    success: false,
                    msg: msg.msgServerError,
                    key: 7,
                  };
                  return res.status(500).json(record);
                }
              } catch (error) {
                logger.error("Database error in createTeam emp 6", {
                  error: error.message,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 6,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              logger.error("Database error in createTeam emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in createTeam emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createTeam emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in createTeam emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  deleteUserteam: [
    query("targetTeamId")
      .trim()
      .exists()
      .withMessage(msg.msgTeamNameReqired)
      .notEmpty()
      .withMessage(msg.msgTeamNameReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { targetTeamId } = req.query;
          const checkTeam = await UserCommenService.checkTeamId(
            SITE_DB_NAME,
            targetTeamId,
          );
          if (checkTeam === "NA") {
            const record = {
              success: false,
              msg: msg.msgTeamNotExist,
              key: 4,
            };
            return res.status(200).json(record);
          }
          const team = await UserCommenService.deleteUserTeamID(
            SITE_DB_NAME,
            targetTeamId,
          );

          if (team === "NA") {
            const record = {
              success: false,
              msg: msg.msgDeleteTeamError,
              key: 3,
            };
            return res.status(200).json(record);
          }

          const peopleId = await UserCommenService.findTeamIdToUserIds(
            SITE_DB_NAME,
            checkTeam._id,
          );

          const deleteUserTeam = await UserCommenService.deleteUserTeam(
            SITE_DB_NAME,
            checkTeam._id,
          );

          if (deleteUserTeam === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserTeamDelete,
              key: 6,
            };
            return res.status(200).json(record);
          }
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const action = "people";
          const notificationOrActivity = 1;
          const actorId = userId;
          const peopleIdArray =
            peopleId && peopleId.length > 0 ? peopleId : [null];

          let notificationArr = [];
          for (const targetPeopleId of peopleIdArray) {
            const { title, message } = msg.generateActivityCommenMessage(
              checkUserID?.name,
              checkTeam?.teamName,
              "",
              "DeleteTeam",
            );
            const titles = title;
            const messages = message;
            const actionId = targetPeopleId;
            const notiUserId = actorId;
            const notiOtherUserId = targetPeopleId ?? userId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
          }
          const record = {
            success: true,
            msg: msg.msgTeamDeleteSuccess,
          };

          return res.status(200).json(record);
        } catch (error) {
          logger.error("Database error in deleteUserteam emp 3", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 3,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in deleteUserteam emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  //====================================== Tanant-Designation-Role-Flow ===========================
  createDesignation: [
    body("name")
      .trim()
      .exists()
      .withMessage(msg.msgDesignationIsRequired)
      .notEmpty()
      .withMessage(msg.msgDesignationIsRequired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        const roleName = req.CURRENT_USER?.roleName;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { name } = req.body;
          const checkDesignation = await UserCommenService.checkDesignation(
            SITE_DB_NAME,
            name,
          );
          if (checkDesignation !== "NA") {
            const record = {
              success: false,
              msg: msg.msgDesignationAlreadyExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const { name } = data;
            const designationData = { name };
            const designation = await UserCommenService.createDesignation(
              SITE_DB_NAME,
              designationData,
            );

            console.log("designation", designation);

            if (designation === "NA") {
              const record = {
                success: false,
                msg: msg.msgDesignationError,
                key: 3,
              };
              return res.status(200).json(record);
            }
            const designationId = designation._id;
            const designationDetails =
              await UserCommenService.getDesignationById(
                SITE_DB_NAME,
                designationId,
              );
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const notiUserId = userId;
            const notiOtherUserId = userId;
            const action = "profile";
            const notificationOrActivity = 1;
            const actionId = null;
            const { title, message } = msg.generateActivityCommenMessage(
              checkUserID.name,
              designation?.name,
              "",
              "DesignationCreate",
            );
            const titles = title;
            const messages = message;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgDesignationSuccess,
              data: { designationDetails: designationDetails },
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in createDesignation emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createDesignation emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in createDesignation emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  getDesignation: [
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
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const { deleteFlag } = req.query;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const pagination = {
          pageSize: parseInt(req.query.pageSize) || 10,
          pageNumber: parseInt(req.query.pageNumber) || 1,
        };

        const search = req.query.search || "";
        const userDesignation = await UserCommenService.getDesignation(
          SITE_DB_NAME,
          Number(deleteFlag),
          pagination,
          search,
        );
        if (userDesignation === "NA") {
          const record = {
            success: true,
            msg: msg.msgDataFound,
            data: {
              userDesignation: [],
            },
          };
          return res.status(200).json(record);
        }
        const record = {
          success: true,
          msg: msg.msgDataFound,
          data: {
            userDesignation: userDesignation,
          },
        };

        return res.status(200).json(record);
      } catch (error) {
        logger.error("Database error in getDesignation emp 4", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 4,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateDesignation: [
    body("name")
      .trim()
      .exists()
      .withMessage(msg.msgDesignationIsRequired)
      .notEmpty()
      .withMessage(msg.msgDesignationIsRequired),
    body("targetDesignationId")
      .trim()
      .exists()
      .withMessage(msg.msgtargetDesignationId)
      .notEmpty()
      .withMessage(msg.msgtargetDesignationId),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        const roleName = req.CURRENT_USER?.roleName;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { name, targetDesignationId } = req.body;

          const checkDesignationId = await UserCommenService.checkDesignationId(
            SITE_DB_NAME,
            targetDesignationId,
          );
          if (checkDesignationId === "NA") {
            const record = {
              success: false,
              msg: msg.msgDesignationIDIsNotExist,
              key: 4,
            };
            return res.status(200).json(record);
          }

          const checkUpdatedDesignationId =
            await UserCommenService.checkUpdatedDesignationId(
              SITE_DB_NAME,
              targetDesignationId,
              name,
            );
          if (checkUpdatedDesignationId !== "NA") {
            const record = {
              success: false,
              msg: msg.msgDesignationIDIsNotExist,
              key: 4,
            };
            return res.status(200).json(record);
          }
          try {
            const designationData = { name };
            const designation = await UserCommenService.updateDesignation(
              SITE_DB_NAME,
              targetDesignationId,
              designationData,
            );

            if (designation === "NA") {
              const record = {
                success: false,
                msg: msg.msgDesignationError,
                key: 3,
              };
              return res.status(200).json(record);
            }
            const designationId = checkDesignationId._id;
            const designationDetails =
              await UserCommenService.getDesignationById(
                SITE_DB_NAME,
                designationId,
              );
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const notiUserId = userId;
            const notiOtherUserId = userId;
            const action = "profile";
            const notificationOrActivity = 1;
            const actionId = null;
            const { title, message } = msg.generateActivityCommenMessage(
              checkUserID.name,
              designation?.name,
              "",
              "DesignationCreate",
            );
            const titles = title;
            const messages = message;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgUpdateDesignationSuccess,
              data: { designationDetails: designationDetails },
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in updateDesignation emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in updateDesignation emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateDesignation emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  deleteDesignation: [
    body("designationId")
      .trim()
      .exists()
      .withMessage(msg.msgtargetDesignationId)
      .notEmpty()
      .withMessage(msg.msgtargetDesignationId),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        const roleName = req.CURRENT_USER?.roleName;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        const { designationId } = req.body;
        try {
          const designation = await UserCommenService.deleteDesignation(
            SITE_DB_NAME,
            designationId,
          );

          if (designation === "NA") {
            const record = {
              success: false,
              msg: msg.msgDesignationError,
              key: 3,
            };
            return res.status(200).json(record);
          }
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const notiUserId = userId;
          const notiOtherUserId = userId;
          const action = "people";
          const notificationOrActivity = 1;
          const actionId = null;
          const { title, message } = msg.generateActivityCommenMessage(
            checkUserID.name,
            designation?.name,
            "",
            "DeleteMultiPeopleDesignation",
          );
          const titles = title;
          const messages = message;
          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };
          let notificationArr = [];

          const notification =
            await oneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson,
              notificationOrActivity,
            );

          if (notification !== "NA") {
            notificationArr.push(notification);
          }
          if (notificationArr.length > 0) {
            notificationArr.push(notification);
            await oneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr,
            );
          }
          const record = {
            success: true,
            msg: msg.msgDesignationDeleteSuccess,
          };

          return res.status(200).json(record);
        } catch (error) {
          logger.error("Database error in deleteDesignation emp 3", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 3,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in deleteDesignation emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  //====================================== Tanant-Designation-Role-Multi-User-Flow ===========================
  createMultiPeopleDesignation: [
    body("name")
      .trim()
      .exists()
      .withMessage(msg.msgDesignationNameIsRequired)
      .notEmpty()
      .withMessage(msg.msgDesignationNameIsRequired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { name } = req.body;
          const checkDesignation = await UserCommenService.checkDesignation(
            SITE_DB_NAME,
            name,
          );
          if (checkDesignation !== "NA") {
            const record = {
              success: false,
              msg: msg.msgDesignationAlreadyExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const { name } = data;
            const designationData = { name };
            const designation = await UserCommenService.createDesignation(
              SITE_DB_NAME,
              designationData,
            );

            if (designation === "NA") {
              const record = {
                success: false,
                msg: msg.msgDesignationError,
                key: 3,
              };
              return res.status(200).json(record);
            }
            try {
              const { peopleId } = req.body;

              try {
                const designationId = designation?._id;

                const updatePeople =
                  await UserCommenService.updateMultiPeopleAndRemove(
                    SITE_DB_NAME,
                    peopleId,
                    designationId,
                  );

                if (updatePeople === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgUpdatePeopleError,
                  };
                  return res.status(200).json(record);
                }
                const designationDetails =
                  await UserCommenService.getMultiPeopleDesignation(
                    SITE_DB_NAME,
                    designationId,
                  );

                const APP_LOGO = process.env.APP_LOGO || "";
                const APP_SITE_URL = process.env.SITE_URL || "";
                const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                const action = "people";
                const notificationOrActivity = 1;
                const actorId = userId;
                const peopleIdArray =
                  peopleId && peopleId.length > 0 ? peopleId : [null];

                let notificationArr = [];
                for (const targetPeopleId of peopleIdArray) {
                  const { title, message } = msg.generateActivityCommenMessage(
                    checkUserID.name,
                    designation.name,
                    "",
                    "UpdateMultiPeopleDesignation",
                  );
                  const titles = title;
                  const messages = message;
                  const actionId = targetPeopleId;
                  const notiUserId = actorId;
                  const notiOtherUserId = targetPeopleId ?? userId;
                  const actionJson = {
                    actionId: actionId,
                    action: action,
                    option: {
                      logoUrl: APP_LOGO,
                      redirectionUrl: {
                        webLink: APP_SITE_URL,
                        deepLink: APP_DEEP_LINK_URL,
                      },
                      imageUrl: "",
                      soundFile: "",
                    },
                    appType: "customer",
                  };
                  const notification =
                    await oneSignalHelperUser.getNotificationArrSingle(
                      SITE_DB_NAME,
                      notiUserId,
                      notiOtherUserId,
                      action,
                      actionId,
                      titles,
                      messages,
                      actionJson,
                      notificationOrActivity,
                    );

                  if (notification !== "NA") {
                    notificationArr.push(notification);
                  }
                  if (notificationArr.length > 0) {
                    notificationArr.push(notification);
                    await oneSignalHelperUser.oneSignalNotificationSendCall(
                      notificationArr,
                    );
                  }
                }
                const record = {
                  success: true,
                  msg: msg.msgCreateSuccess,
                  data: {
                    designations: designationDetails,
                  },
                };

                return res.status(200).json(record);
              } catch (error) {
                logger.error(
                  "Database error in createMultiPeopleDesignation emp 5",
                  {
                    error: error.message,
                  },
                );
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 5,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              logger.error(
                "Database error in createMultiPeopleDesignation emp 4",
                {
                  error,
                },
              );
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 4,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error(
              "Database error in createMultiPeopleDesignation emp 3",
              {
                error: error.message,
              },
            );
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createMultiPeopleDesignation emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in createMultiPeopleDesignation emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  getMultiPeopleDesignations: [
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
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const { deleteFlag } = req.query;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const pagination = {
          pageSize: parseInt(req.query.pageSize) || 10,
          pageNumber: parseInt(req.query.pageNumber) || 1,
        };
        const search = req.query.search || "";
        const userDesignation =
          await UserCommenService.getMultiPeopleDesignations(
            SITE_DB_NAME,
            Number(deleteFlag),
            pagination,
            search,
          );
        if (userDesignation === "NA") {
          const record = {
            success: true,
            msg: msg.msgDataFound,
            data: {
              userDesignation: [],
            },
          };
          return res.status(200).json(record);
        }
        const record = {
          success: true,
          msg: msg.msgDataFound,
          data: {
            userDesignation: userDesignation,
          },
        };

        return res.status(200).json(record);
      } catch (error) {
        logger.error("Database error in getDesignation emp 4", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 4,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateMultiPeopleDesignation: [
    body("name")
      .trim()
      .exists()
      .withMessage(msg.msgDesignationNameIsRequired)
      .notEmpty()
      .withMessage(msg.msgDesignationNameIsRequired),
    body("designationId")
      .trim()
      .exists()
      .withMessage(msg.msgtargetDesignationId)
      .notEmpty()
      .withMessage(msg.msgtargetDesignationId),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { name, designationId } = req.body;

          const checkDesignationId = await UserCommenService.checkDesignationId(
            SITE_DB_NAME,
            designationId,
          );
          if (checkDesignationId === "NA") {
            const record = {
              success: false,
              msg: msg.msgDesignationIDIsNotExist,
              key: 4,
            };
            return res.status(200).json(record);
          }

          const checkDesignationName =
            await UserCommenService.checkUpdatedDesignationId(
              SITE_DB_NAME,
              designationId,
              name,
            );

          if (checkDesignationName !== "NA") {
            console.log("❌ DUPLICATE SKILL FOUND. STOPPING UPDATE.");
            const record = {
              success: false,
              msg: msg.msgDesignationAlreadyExist,
              key: 4,
            };
            return res.status(200).json(record);
          }
          try {
            const designationData = { name };
            const designation = await UserCommenService.updateDesignation(
              SITE_DB_NAME,
              designationId,
              designationData,
            );

            if (designation === "NA") {
              const record = {
                success: false,
                msg: msg.msgDesignationError,
                key: 3,
              };
              return res.status(200).json(record);
            }
            const { peopleId } = req.body;

            try {
              const updatePeople =
                await UserCommenService.updateMultiPeopleAndRemove(
                  SITE_DB_NAME,
                  peopleId,
                  designationId,
                );
              if (updatePeople === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUpdatePeopleError,
                };
                return res.status(200).json(record);
              }
              const designationDetails =
                await UserCommenService.getMultiPeopleDesignation(
                  SITE_DB_NAME,
                  designationId,
                );

              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const action = "people";
              const notificationOrActivity = 1;
              const actorId = userId;
              const peopleIdArray =
                peopleId && peopleId.length > 0 ? peopleId : [null];

              let notificationArr = [];
              for (const targetPeopleId of peopleIdArray) {
                const { title, message } = msg.generateActivityCommenMessage(
                  checkUserID.name,
                  designationDetails.name,
                  "",
                  "UpdateMultiPeopleDesignation",
                );
                const titles = title;
                const messages = message;
                const actionId = targetPeopleId;
                const notiUserId = actorId;
                const notiOtherUserId = targetPeopleId ?? userId;
                const actionJson = {
                  actionId: actionId,
                  action: action,
                  option: {
                    logoUrl: APP_LOGO,
                    redirectionUrl: {
                      webLink: APP_SITE_URL,
                      deepLink: APP_DEEP_LINK_URL,
                    },
                    imageUrl: "",
                    soundFile: "",
                  },
                  appType: "customer",
                };
                const notification =
                  await oneSignalHelperUser.getNotificationArrSingle(
                    SITE_DB_NAME,
                    notiUserId,
                    notiOtherUserId,
                    action,
                    actionId,
                    titles,
                    messages,
                    actionJson,
                    notificationOrActivity,
                  );

                if (notification !== "NA") {
                  notificationArr.push(notification);
                }
                if (notificationArr.length > 0) {
                  notificationArr.push(notification);
                  await oneSignalHelperUser.oneSignalNotificationSendCall(
                    notificationArr,
                  );
                }
              }
              const record = {
                success: true,
                msg: msg.msgDesignationUpdateSuccess,
                data: {
                  designations: designationDetails,
                },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in editPeople emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in updateDesignation emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in updateDesignation emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateDesignation emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  deleteMultiPeopleDesignation: [
    query("designationId")
      .trim()
      .exists()
      .withMessage(msg.msgtargetDesignationId)
      .notEmpty()
      .withMessage(msg.msgtargetDesignationId),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { designationId } = req.query;
          const checkDesignationId = await UserCommenService.checkDesignationId(
            SITE_DB_NAME,
            designationId,
          );
          if (checkDesignationId === "NA") {
            const record = {
              success: false,
              msg: msg.msgDesignationIDIsNotExist,
              key: 4,
            };
            return res.status(200).json(record);
          }
          const peopleId = await UserCommenService.findDesignationIdToUserIds(
            SITE_DB_NAME,
            designationId,
          );
          const designation = await UserCommenService.deleteDesignation(
            SITE_DB_NAME,
            designationId,
          );

          if (designation === "NA") {
            const record = {
              success: false,
              msg: msg.msgDesignationError,
              key: 3,
            };
            return res.status(200).json(record);
          }
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const action = "profile";
          const notificationOrActivity = 1;
          const actorId = userId;
          const peopleIdArray =
            peopleId && peopleId.length > 0 ? peopleId : [null];

          let notificationArr = [];
          for (const targetPeopleId of peopleIdArray) {
            const { title, message } = msg.generateActivityCommenMessage(
              checkUserID.name,
              checkDesignationId?.name,
              "",
              "DeleteMultiPeopleDesignation",
            );
            const titles = title;
            const messages = message;
            const actionId = targetPeopleId;
            const notiUserId = actorId;
            const notiOtherUserId = targetPeopleId ?? userId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
          }
          const record = {
            success: true,
            msg: msg.msgDesignationDeleteSuccess,
          };

          return res.status(200).json(record);
        } catch (error) {
          logger.error("Database error in deleteDesignation emp 3", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 3,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in deleteDesignation emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  //====================================== Tanant-Activity-And-History-Flow ===========================
  getActivity: [
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.msgDeleteFlagReqired)
      .notEmpty()
      .withMessage(msg.msgDeleteFlagReqired),
    query("notificationOrActivity")
      .trim()
      .exists()
      .withMessage(msg.notificationOrActivityReqired)
      .notEmpty()
      .withMessage(msg.notificationOrActivityReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const userId = req.CURRENT_USER_ID;
      const { deleteFlag, notificationOrActivity, module, actorId, moduleId } =
        req.query;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }

      try {
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
            key: 2,
          };
          return res.status(200).json(record);
        }
        try {
          const pagination = {
            pageSize: parseInt(req.query.pageSize) || 10,
            pageNumber: parseInt(req.query.pageNumber) || 1,
          };
          const queryData = {
            deleteFlag,
            notificationOrActivity,
            module,
            actorId,
            moduleId,
          };
          const activity = await UserCommenService.getActivity(
            SITE_DB_NAME,
            queryData,
            userId,
            pagination,
          );
          if (activity === "NA") {
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                activity: [],
              },
            };
            return res.status(200).json(record);
          }
          const record = {
            success: true,
            msg: msg.msgDataFound,
            data: {
              activity: activity,
            },
          };

          return res.status(200).json(record);
        } catch (error) {
          logger.error("Database error in getProfileActivity emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in getProfileActivity emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  //====================================== Tanant-Setting-Flow ===========================
  getWorkspaceDetails: [
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const userId = req.CURRENT_USER_ID;
      const workspaceId = req.CURRENT_SITE_WORKSPACE_ID;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }

      try {
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
            key: 2,
          };
          return res.status(200).json(record);
        }
        try {
          const workspaceDetails =
            await CommenService.getInDashWorkspaceDetails(workspaceId);

          if (workspaceDetails === "NA") {
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                workspaceDetails: [],
              },
            };
            return res.status(200).json(record);
          }
          const record = {
            success: true,
            msg: msg.msgDataFound,
            data: {
              workspaceDetails: workspaceDetails,
            },
          };

          return res.status(200).json(record);
        } catch (error) {
          logger.error("Database error in getGeneralDetails emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in getGeneralDetails emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateGeneralDetails: [
    body("workspaceName")
      .trim()
      .exists()
      .withMessage(msg.msgWorkspaceNameIsRequired)
      .notEmpty()
      .withMessage(msg.msgWorkspaceNameIsRequired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const workspaceId = req.CURRENT_SITE_WORKSPACE_ID;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const checkWorkspaceDomain =
            await CommenService.checkUpdatedWorkspaceDomain(
              workspaceId,
              workspaceName,
            );
          if (checkWorkspaceDomain !== "NA") {
            return res.status(200).json({
              success: false,
              msg: msg.thisCompanyNameAlreadyExists,
              key: 1,
            });
          }
        } catch (error) {
          logger.error("Database error in updateGeneralDetails emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
        try {
          const {
            workspaceName,
            workspaceCurrency,
            siteNameOnLoginPage,
            clientsView,
            dashboardMessage,
            dashboardProjectList,
            canShareFiles,
            canUploadFiles,
            allowReactions,
            allowTags,
            lockEditingOfTags,
            cleanPastedHTML,
            newlineMode,
            projectHealthLabels,
            automaticLogOut,
            allowTeamworkBrand,
            customAutoLogout,
          } = req.body;
          const workspaceData = {
            workspaceName,
            workspaceCurrency,
            siteNameOnLoginPage,
            clientsView,
            dashboardMessage,
            dashboardProjectList,
            canShareFiles,
            canUploadFiles,
            allowReactions,
            allowTags,
            lockEditingOfTags,
            cleanPastedHTML,
            newlineMode,
            projectHealthLabels,
            automaticLogOut,
            allowTeamworkBrand,
            customAutoLogout,
          };
          const updateGeneralDetails = await CommenService.updateGeneralDetails(
            workspaceId,
            workspaceData,
          );
          if (updateGeneralDetails === "NA") {
            const record = {
              success: false,
              msg: msg.msgWorkspaceError,
              key: 3,
            };
            return res.status(200).json(record);
          }
          const workspaceDetails =
            await CommenService.getWorkspaceDetails(workspaceId);
          if (workspaceDetails === "NA") {
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                workspaceDetails: [],
              },
            };
            return res.status(200).json(record);
          }
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const notiUserId = userId;
          const notiOtherUserId = userId;
          const action = "setting";
          const notificationOrActivity = 1;
          const actionId = userId;
          const { title, message } = msg.generateActivityCommenMessage(
            checkUserID.name,
            workspaceDetails?.workspaceName,
            "",
            "WorksapceUpdated",
          );
          const titles = title;
          const messages = message;
          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };
          let notificationArr = [];

          const notification =
            await oneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson,
              notificationOrActivity,
            );

          if (notification !== "NA") {
            notificationArr.push(notification);
          }
          if (notificationArr.length > 0) {
            notificationArr.push(notification);
            await oneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr,
            );
          }

          const record = {
            success: true,
            msg: msg.msgDataFound,
            data: {
              workspaceDetails: workspaceDetails,
            },
          };

          return res.status(200).json(record);
        } catch (error) {
          logger.error("Database error in updateGeneralDetails emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateGeneralDetails emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateGeneralField: [
    body("fieldName")
      .trim()
      .exists()
      .withMessage(msg.msgFieldNameReqired)
      .notEmpty()
      .withMessage(msg.msgFieldNameReqired),

    body("value").exists().withMessage(msg.msgFieldValueReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const workspaceId = req.CURRENT_SITE_WORKSPACE_ID;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      let { fieldName, value } = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        const currentUser = req.CURRENT_USER;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const workspaceData = {
            [fieldName]: value,
          };

          const updateGeneralDetails = await CommenService.updateGeneralDetails(
            workspaceId,
            workspaceData,
          );
          if (updateGeneralDetails === "NA") {
            const record = {
              success: false,
              msg: msg.msgWorkspaceError,
              key: 3,
            };
            return res.status(200).json(record);
          }
          const workspaceDetails =
            await CommenService.getWorkspaceDetails(workspaceId);
          if (workspaceDetails === "NA") {
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                workspaceDetails: [],
              },
            };
            return res.status(200).json(record);
          }
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const notiUserId = userId;
          const notiOtherUserId = userId;
          const action = "setting";
          const notificationOrActivity = 1;
          const actionId = userId;
          const { title, message } = msg.generateActivityCommenMessage(
            currentUser.name,
            workspaceDetails?.workspaceName,
            "",
            "WorksapceUpdated",
          );
          const titles = title;
          const messages = message;
          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };
          let notificationArr = [];

          const notification =
            await oneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson,
              notificationOrActivity,
            );

          if (notification !== "NA") {
            notificationArr.push(notification);
          }
          if (notificationArr.length > 0) {
            notificationArr.push(notification);
            await oneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr,
            );
          }

          const record = {
            success: true,
            msg: msg.msgDataFound,
            data: {
              workspaceDetails: workspaceDetails,
            },
          };

          return res.status(200).json(record);
        } catch (error) {
          logger.error("Database error in updateCompany emp 5", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 5,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateCompany emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateWorkspaceDomain: [
    body("workspaceDomain")
      .trim()
      .exists()
      .withMessage(msg.msgWorkspaceDomainIsRequired)
      .notEmpty()
      .withMessage(msg.msgWorkspaceDomainIsRequired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const workspaceId = req.CURRENT_SITE_WORKSPACE_ID;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { workspaceDomain } = req.body;
          const workspaceDomainReplace = workspaceDomain
            .replace(/\s+/g, "")
            .toLowerCase();
          const checkWorkspaceDomain =
            await CommenService.checkUpdatedWorkspaceDomain(
              workspaceId,
              workspaceDomainReplace,
            );
          if (checkWorkspaceDomain !== "NA") {
            return res.status(200).json({
              success: false,
              msg: msg.thisCompanyNameAlreadyExists,
              key: 1,
            });
          }
          try {
            const workspaceDomainClean = slugify(workspaceDomainReplace, {
              lower: true,
              strict: true,
              replacement: "",
            });

            console.log("workspaceDomainClean", workspaceDomainClean);

            const workspaceFullDomain = `${workspaceDomainClean}.${process.env.SITE_URL.replace(
              /^https?:\/\//,
              "",
            ).replace(/\/$/, "")}`;
            const workspaceUrl = `https://${workspaceFullDomain}`;

            let domainResult = checkWorkspaceDomain?.domainResult;
            if (checkWorkspaceDomain?.domainResult) {
              domainResult = await CommenFunction.updateDns(
                checkWorkspaceDomain?.domainResult?.result?.id,
                {
                  name: workspaceDomainClean,
                  content: checkWorkspaceDomain?.domainResult?.result?.content,
                  ttl: checkWorkspaceDomain?.domainResult?.result?.ttl,
                  proxied: checkWorkspaceDomain?.domainResult?.result?.proxied,
                },
              );
            }

            const workspaceData = {
              workspaceDomain: workspaceDomainClean,
              workspaceFullDomain,
              workspaceUrl,
              domainResult,
            };

            const updateGeneralDetails =
              await CommenService.updateGeneralDetails(
                workspaceId,
                workspaceData,
              );
            if (updateGeneralDetails === "NA") {
              const record = {
                success: false,
                msg: msg.msgWorkspaceError,
                key: 3,
              };
              return res.status(200).json(record);
            }
            const workspaceDetails =
              await CommenService.getWorkspaceDetails(workspaceId);
            if (workspaceDetails === "NA") {
              const record = {
                success: true,
                msg: msg.msgDataFound,
                data: {
                  workspaceDetails: [],
                },
              };
              return res.status(200).json(record);
            }
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const notiUserId = userId;
            const notiOtherUserId = userId;
            const action = "setting";
            const notificationOrActivity = 1;
            const actionId = userId;
            const { title, message } = msg.generateActivityCommenMessage(
              checkUserID.name,
              workspaceDetails?.workspaceName,
              "",
              "WorksapceUpdated",
            );
            const titles = title;
            const messages = message;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }

            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                workspaceDetails: workspaceDetails,
              },
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in updateWorkspaceDomain emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in updateWorkspaceDomain emp 3", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 3,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateWorkspaceDomain emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateWorkspaceFavIcon: [
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const workspaceId = req.CURRENT_SITE_WORKSPACE_ID;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      // if (!req.file && !req.body.workspaceFavIcon) {
      //   return res
      //     .status(200)
      //     .json({ success: false, msg: msg.msgWorkspaceFavIconIsRequired });
      // }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          let workspaceFavIcon = null;

          if (req.file) {
            if ("key" in req.file) {
              workspaceFavIcon = req.file.key;
            } else {
              workspaceFavIcon = req.folderName + "/" + req.file.filename;
            }
          } else if (typeof req.body.workspaceFavIcon !== "undefined") {
            if (
              req.body.workspaceFavIcon === "" ||
              req.body.workspaceFavIcon === "null"
            ) {
              workspaceFavIcon = null; // explicit remove
            } else {
              workspaceFavIcon = req.body.workspaceFavIcon;
            }
          } else {
            // Preserve existing value: **call getWorkspaceDetails with workspaceId**
            const existing =
              await CommenService.getWorkspaceDetails(workspaceId);
            workspaceFavIcon = existing?.workspaceFavIcon ?? null;
          }
          const workspaceData = {
            workspaceFavIcon,
          };
          const updateGeneralDetails = await CommenService.updateGeneralDetails(
            workspaceId,
            workspaceData,
          );
          if (updateGeneralDetails === "NA") {
            const record = {
              success: false,
              msg: msg.msgWorkspaceError,
              key: 3,
            };
            return res.status(200).json(record);
          }
          const workspaceDetails =
            await CommenService.getWorkspaceDetails(workspaceId);
          if (workspaceDetails === "NA") {
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                workspaceDetails: [],
              },
            };
            return res.status(200).json(record);
          }
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const notiUserId = userId;
          const notiOtherUserId = userId;
          const action = "setting";
          const notificationOrActivity = 1;
          const actionId = userId;
          const { title, message } = msg.generateActivityCommenMessage(
            checkUserID.name,
            workspaceDetails?.workspaceName,
            "",
            "WorksapceUpdated",
          );
          const titles = title;
          const messages = message;
          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };
          let notificationArr = [];

          const notification =
            await oneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson,
              notificationOrActivity,
            );

          if (notification !== "NA") {
            notificationArr.push(notification);
          }
          if (notificationArr.length > 0) {
            notificationArr.push(notification);
            await oneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr,
            );
          }

          const record = {
            success: true,
            msg: msg.msgWorkspaceFavIconSuccess,
            data: {
              workspaceDetails: workspaceDetails,
            },
          };

          return res.status(200).json(record);
        } catch (error) {
          logger.error("Database error in updateGeneralDetails emp 3", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 3,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateGeneralDetails emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateWorkspaceCheckName: [
    body("checkName")
      .trim()
      .exists()
      .withMessage(msg.msgCheckNameIsRequired)
      .notEmpty()
      .withMessage(msg.msgCheckNameIsRequired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const workspaceId = req.CURRENT_SITE_WORKSPACE_ID;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { checkName } = req.body;
          const workspaceData = {
            checkName,
          };
          const updateGeneralDetails = await CommenService.updateGeneralDetails(
            workspaceId,
            workspaceData,
          );
          if (updateGeneralDetails === "NA") {
            const record = {
              success: false,
              msg: msg.msgWorkspaceError,
              key: 3,
            };
            return res.status(200).json(record);
          }
          const workspaceDetails =
            await CommenService.getWorkspaceDetails(workspaceId);
          if (workspaceDetails === "NA") {
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                workspaceDetails: [],
              },
            };
            return res.status(200).json(record);
          }
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const notiUserId = userId;
          const notiOtherUserId = userId;
          const action = "setting";
          const notificationOrActivity = 1;
          const actionId = userId;
          const { title, message } = msg.generateActivityCommenMessage(
            checkUserID.name,
            workspaceDetails?.workspaceName,
            "",
            "WorksapceUpdated",
          );
          const titles = title;
          const messages = message;
          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };
          let notificationArr = [];

          const notification =
            await oneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson,
              notificationOrActivity,
            );

          if (notification !== "NA") {
            notificationArr.push(notification);
          }
          if (notificationArr.length > 0) {
            notificationArr.push(notification);
            await oneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr,
            );
          }

          const record = {
            success: true,
            msg: msg.msgDataFound,
            data: {
              workspaceDetails: workspaceDetails,
            },
          };

          return res.status(200).json(record);
        } catch (error) {
          logger.error("Database error in updateGeneralDetails emp 3", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 3,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateGeneralDetails emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateWorkspaceLogo: [
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }

      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const workspaceId = req.CURRENT_SITE_WORKSPACE_ID;

      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }

      // basic validation: workspaceId should look like an ObjectId string
      if (!workspaceId || !/^[0-9a-fA-F]{24}$/.test(String(workspaceId))) {
        logger.error("Invalid workspaceId passed to updateWorkspaceLogo", {
          workspaceId,
        });
        return res.status(200).json({
          success: false,
          msg: "Invalid workspace identifier",
          key: 4,
        });
      }

      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }

        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          // --------------------------------------------
          // Determine workspaceLogo:
          // - if req.file exists => use uploaded file (key / folder + filename)
          // - else if req.body.workspaceLogo provided:
          //      - if empty string or "null" => set workspaceLogo = null (remove)
          //      - else use value from req.body.workspaceLogo
          // - else => preserve existing DB value (call getWorkspaceDetails with workspaceId)
          // --------------------------------------------
          let workspaceLogo = null;

          if (req.file) {
            if ("key" in req.file) {
              workspaceLogo = req.file.key;
            } else {
              workspaceLogo = req.folderName + "/" + req.file.filename;
            }
          } else if (typeof req.body.workspaceLogo !== "undefined") {
            if (
              req.body.workspaceLogo === "" ||
              req.body.workspaceLogo === "null"
            ) {
              workspaceLogo = null; // explicit remove
            } else {
              workspaceLogo = req.body.workspaceLogo;
            }
          } else {
            // Preserve existing value: **call getWorkspaceDetails with workspaceId**
            const existing =
              await CommenService.getWorkspaceDetails(workspaceId);
            workspaceLogo = existing?.workspaceLogo ?? null;
          }

          const workspaceData = { workspaceLogo };

          const updateGeneralDetails = await CommenService.updateGeneralDetails(
            workspaceId,
            workspaceData,
          );

          if (updateGeneralDetails === "NA") {
            const record = {
              success: false,
              msg: msg.msgWorkspaceError,
              key: 3,
            };
            return res.status(200).json(record);
          }

          // fetch updated workspace details (use workspaceId only)
          const workspaceDetails =
            await CommenService.getWorkspaceDetails(workspaceId);
          if (workspaceDetails === "NA") {
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: { workspaceDetails: [] },
            };
            return res.status(200).json(record);
          }

          // notification/activity logic (unchanged)
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const notiUserId = userId;
          const notiOtherUserId = userId;
          const action = "setting";
          const notificationOrActivity = 1;
          const actionId = userId;
          const { title, message } = msg.generateActivityCommenMessage(
            checkUserID.name,
            workspaceDetails?.workspaceName,
            "",
            "WorksapceUpdated",
          );
          const titles = title;
          const messages = message;
          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };
          let notificationArr = [];

          const notification =
            await oneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson,
              notificationOrActivity,
            );

          if (notification !== "NA") {
            notificationArr.push(notification);
          }
          if (notificationArr.length > 0) {
            notificationArr.push(notification);
            await oneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr,
            );
          }

          const record = {
            success: true,
            msg: msg.msgWorkspaceLogoSuccess,
            data: { workspaceDetails },
          };

          return res.status(200).json(record);
        } catch (error) {
          logger.error("Database error in updateGeneralDetails emp 3", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 3,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateGeneralDetails emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  // updateWorkspaceLogo: [
  //   async (req, res) => {
  //     const errors = validationResult(req);
  //     if (!errors.isEmpty()) {
  //       return res
  //         .status(200)
  //         .json({ success: false, msg: errors.array()[0].msg });
  //     }
  //     const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
  //     const workspaceId = req.CURRENT_SITE_WORKSPACE_ID;
  //     if (!SITE_DB_NAME) {
  //       const record = { success: false, msg: msg.msgUserNotExist };
  //       return res.status(200).json(record);
  //     }
  //     if (!req.file && !req.body.workspaceLogo) {
  //       return res
  //         .status(200)
  //         .json({ success: false, msg: msg.msgWorkspaceLogoIsRequired });
  //     }
  //     try {
  //       const userId = req.CURRENT_USER_ID;
  //       if (!userId && userId === 0) {
  //         const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
  //         return res.status(200).json(record);
  //       }
  //       const checkUserID = await UserCommenService.checkUser(
  //         SITE_DB_NAME,
  //         userId
  //       );
  //       if (checkUserID === "NA") {
  //         const record = {
  //           success: false,
  //           msg: msg.msgUserNotExist,
  //         };
  //         return res.status(200).json(record);
  //       }
  //       try {
  //         let workspaceLogo = null;
  //         if (!req.file) {
  //           workspaceLogo = await CommenService.getWorkspaceDetails(
  //             SITE_DB_NAME,
  //             workspaceId
  //           ).workspaceLogo;
  //         } else if ("key" in req.file) {
  //           const filename = req.file.key;
  //           workspaceLogo = filename;
  //         } else {
  //           workspaceLogo = req.folderName + "/" + req.file.filename;
  //         }
  //         const workspaceData = {
  //           workspaceLogo,
  //         };
  //         const updateGeneralDetails = await CommenService.updateGeneralDetails(
  //           workspaceId,
  //           workspaceData
  //         );
  //         if (updateGeneralDetails === "NA") {
  //           const record = {
  //             success: false,
  //             msg: msg.msgWorkspaceError,
  //             key: 3,
  //           };
  //           return res.status(200).json(record);
  //         }
  //         const workspaceDetails = await CommenService.getWorkspaceDetails(
  //           workspaceId
  //         );
  //         if (workspaceDetails === "NA") {
  //           const record = {
  //             success: true,
  //             msg: msg.msgDataFound,
  //             data: {
  //               workspaceDetails: [],
  //             },
  //           };
  //           return res.status(200).json(record);
  //         }
  //         const APP_LOGO = process.env.APP_LOGO || "";
  //         const APP_SITE_URL = process.env.SITE_URL || "";
  //         const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
  //         const notiUserId = userId;
  //         const notiOtherUserId = userId;
  //         const action = "setting";
  //         const notificationOrActivity = 1;
  //         const actionId = userId;
  //         const { title, message } = msg.generateActivityCommenMessage(
  //           checkUserID.name,
  //           workspaceDetails?.workspaceName,
  //           "",
  //           "WorksapceUpdated"
  //         );
  //         const titles = title;
  //         const messages = message;
  //         const actionJson = {
  //           actionId: actionId,
  //           action: action,
  //           option: {
  //             logoUrl: APP_LOGO,
  //             redirectionUrl: {
  //               webLink: APP_SITE_URL,
  //               deepLink: APP_DEEP_LINK_URL,
  //             },
  //             imageUrl: "",
  //             soundFile: "",
  //           },
  //           appType: "customer",
  //         };
  //         let notificationArr = [];

  //         const notification =
  //           await oneSignalHelperUser.getNotificationArrSingle(
  //             SITE_DB_NAME,
  //             notiUserId,
  //             notiOtherUserId,
  //             action,
  //             actionId,
  //             titles,
  //             messages,
  //             actionJson,
  //             notificationOrActivity
  //           );

  //         if (notification !== "NA") {
  //           notificationArr.push(notification);
  //         }
  //         if (notificationArr.length > 0) {
  //           notificationArr.push(notification);
  //           await oneSignalHelperUser.oneSignalNotificationSendCall(
  //             notificationArr
  //           );
  //         }

  //         const record = {
  //           success: true,
  //           msg: msg.msgDataFound,
  //           data: {
  //             workspaceDetails: workspaceDetails,
  //           },
  //         };

  //         return res.status(200).json(record);
  //       } catch (error) {
  //         logger.error("Database error in updateGeneralDetails emp 3", {
  //           error: error.message,
  //         });
  //         const record = {
  //           success: false,
  //           msg: msg.msgServerError,
  //           key: 3,
  //         };
  //         return res.status(500).json(record);
  //       }
  //     } catch (error) {
  //       logger.error("Database error in updateGeneralDetails emp 1", {
  //         error: error.message,
  //       });
  //       const record = {
  //         success: false,
  //         msg: msg.msgServerError,
  //         key: 1,
  //       };
  //       return res.status(500).json(record);
  //     }
  //   },
  // ],

  updateWorkspaceEmailSettings: [
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const workspaceId = req.CURRENT_SITE_WORKSPACE_ID;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const {
            useLogoInNotifications,
            fromAddressFormat,
            defaultEmailUserId,
            forwardedMessageOption,
            forwardedUserFallback,
            similarMessagesOption,
            logFailedEmails,
          } = req.body;
          const workspaceData = {
            useLogoInNotifications,
            fromAddressFormat,
            defaultEmailUserId,
            forwardedMessageOption,
            forwardedUserFallback,
            similarMessagesOption,
            logFailedEmails,
          };
          const updateGeneralDetails = await CommenService.updateGeneralDetails(
            workspaceId,
            workspaceData,
          );
          if (updateGeneralDetails === "NA") {
            const record = {
              success: false,
              msg: msg.msgWorkspaceError,
              key: 3,
            };
            return res.status(200).json(record);
          }
          const workspaceDetails =
            await CommenService.getWorkspaceDetails(workspaceId);
          if (workspaceDetails === "NA") {
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                workspaceDetails: [],
              },
            };
            return res.status(200).json(record);
          }
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const notiUserId = userId;
          const notiOtherUserId = userId;
          const action = "setting";
          const notificationOrActivity = 1;
          const actionId = userId;
          const { title, message } = msg.generateActivityCommenMessage(
            checkUserID.name,
            workspaceDetails?.workspaceName,
            "",
            "WorksapceUpdated",
          );
          const titles = title;
          const messages = message;
          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };
          let notificationArr = [];

          const notification =
            await oneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson,
              notificationOrActivity,
            );

          if (notification !== "NA") {
            notificationArr.push(notification);
          }
          if (notificationArr.length > 0) {
            notificationArr.push(notification);
            await oneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr,
            );
          }

          const record = {
            success: true,
            msg: msg.msgDataFound,
            data: {
              workspaceDetails: workspaceDetails,
            },
          };

          return res.status(200).json(record);
        } catch (error) {
          logger.error("Database error in updateGeneralDetails emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateGeneralDetails emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  //====================================== Tanant-Tages-Flow ===========================
  createTag: [
    body("name")
      .trim()
      .exists()
      .withMessage(msg.msgTagNameReqired)
      .notEmpty()
      .withMessage(msg.msgTagNameReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const { name, color, projectId } = data;
            const checkTag = await UserCommenService.checkTag(
              SITE_DB_NAME,
              name,
            );
            if (checkTag !== "NA") {
              const record = {
                success: false,
                msg: msg.msgTagAlreadyExist,
                key: 4,
              };
              return res.status(200).json(record);
            }
            try {
              const tagData = {
                name,
                color,
                projectId: projectId === "" ? null : projectId,
              };
              const createTag = await UserCommenService.createTag(
                SITE_DB_NAME,
                tagData,
              );
              if (createTag === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgCreateTagError,
                  key: 5,
                };
                return res.status(200).json(record);
              }
              const tagId = createTag?._id;
              console.log("tagId", tagId);

              const tagDetails = await UserCommenService.getTagDetails(
                SITE_DB_NAME,
                tagId,
              );

              const projectAddTagId = tagDetails.projectId;

              if (projectAddTagId !== null) {
                // const tagIds = tagId;
                // const ProjectData = {
                //   tagIds,
                // };
                const ProjectData = {
                  $addToSet: { tagIds: tagId },
                };
                const updateProject =
                  await UserCommenService.updateForTagProject(
                    SITE_DB_NAME,
                    projectAddTagId,
                    ProjectData,
                  );
                if (updateProject === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgUpdateProjectTagsError,
                    key: 5,
                  };
                  return res.status(200).json(record);
                }
              }

              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const notiUserId = userId;
              const notiOtherUserId = userId;
              const action = "settings";
              const notificationOrActivity = 1;
              const actionId = userId;
              const { title, message } = msg.generateActivityCommenMessage(
                checkUserID.name,
                tagDetails?.name,
                "",
                "TagCreate",
              );
              const titles = title;
              const messages = message;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];

              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }
              const record = {
                success: true,
                msg: msg.msgTagCreatedSuccess,
                data: { tagDetails: tagDetails },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in createTag emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in createTag emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createTag emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in createTag emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  getTags: [
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
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const userId = req.CURRENT_USER_ID;
      const { deleteFlag } = req.query;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const pagination = {
              pageSize: parseInt(req.query.pageSize),
              pageNumber: parseInt(req.query.pageNumber),
            };

            const search = req.query.search || "";
            const tagsDetails = await UserCommenService.getTags(
              SITE_DB_NAME,
              Number(deleteFlag),
              pagination,
              search,
            );
            if (tagsDetails === "NA") {
              const record = {
                success: true,
                msg: msg.msgDataFound,
                data: {
                  tagsDetails: [],
                },
              };
              return res.status(200).json(record);
            }
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                tagsDetails: tagsDetails,
              },
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in getTags emp 4", {
              error,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in getTags emp 2", {
            error,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in getTags emp 1", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateTag: [
    query("tagId")
      .trim()
      .exists()
      .withMessage(msg.msgTagIdIsRequired)
      .notEmpty()
      .withMessage(msg.msgTagIdIsRequired),
    body("name")
      .trim()
      .exists()
      .withMessage(msg.msgTagNameReqired)
      .notEmpty()
      .withMessage(msg.msgTagNameReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const { name, color, projectId } = req.body;
      const { tagId } = req.query;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const checkTag = await UserCommenService.checkUpdateTag(
              SITE_DB_NAME,
              tagId,
            );
            if (checkTag === "NA") {
              const record = {
                success: false,
                msg: msg.msgTagAlreadyExist,
                key: 4,
              };
              return res.status(200).json(record);
            }
            try {
              const userData = {
                name,
                color,
                projectId: projectId === "" ? null : projectId,
              };
              const updateTag = await UserCommenService.updateTag(
                SITE_DB_NAME,
                checkTag._id,
                userData,
              );
              if (updateTag === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUpdateTagError,
                  key: 5,
                };
                return res.status(200).json(record);
              }
              const tagDetails = await UserCommenService.getTagDetails(
                SITE_DB_NAME,
                checkTag._id,
              );

              const projectAddTagId = tagDetails.projectId;

              if (projectAddTagId !== null) {
                // const tagIds = tagId;
                // const ProjectData = {
                //   tagIds,
                // };
                const ProjectData = {
                  $addToSet: { tagIds: tagId },
                };
                const updateProject =
                  await UserCommenService.updateForTagProject(
                    SITE_DB_NAME,
                    projectAddTagId,
                    ProjectData,
                  );
                if (updateProject === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgUpdateProjectTagsError,
                    key: 5,
                  };
                  return res.status(200).json(record);
                }
              }

              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const notiUserId = userId;
              const notiOtherUserId = userId;
              const action = "settings";
              const notificationOrActivity = 1;
              const actionId = userId;
              const { title, message } = msg.generateActivityCommenMessage(
                checkUserID.name,
                checkTag?.name,
                "",
                "TagUpdated",
              );
              const titles = title;
              const messages = message;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];

              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }
              const record = {
                success: true,
                msg: msg.msgTagUpdatedSuccess,
                data: { tagDetails: tagDetails },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in updateTag emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in updateTag emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in updateTag emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateTag emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  deleteTag: [
    query("tagId")
      .trim()
      .exists()
      .withMessage(msg.msgTagIdIsRequired)
      .notEmpty()
      .withMessage(msg.msgTagIdIsRequired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { tagId } = req.query;
          const checkTag = await UserCommenService.checkUpdateTag(
            SITE_DB_NAME,
            tagId,
          );
          if (checkTag === "NA") {
            const record = {
              success: false,
              msg: msg.msgTagNotExist,
              key: 4,
            };
            return res.status(200).json(record);
          }
          try {
            const tag = await UserCommenService.deleteTag(SITE_DB_NAME, tagId);

            if (tag === "NA") {
              const record = {
                success: false,
                msg: msg.msgTagDeleteError,
                key: 3,
              };
              return res.status(200).json(record);
            }

            // const projectAddTagId = checkTag.projectId;
            const tagIds = checkTag._id;
            const tags = checkTag._id;
            const tagsId = checkTag._id;
            const ProjectData = {
              tagIds,
            };

            const removeTagIdCompany =
              await UserCommenService.removeTagIdCompany(SITE_DB_NAME, tagsId);
            // if (removeTagIdCompany === "NA") {
            //   const record = {
            //     success: false,
            //     msg: msg.msgRemoveCompanyAllProjectError,
            //     key: 5,
            //   };
            //   return res.status(200).json(record);
            // }

            const removeTagIdProject =
              await UserCommenService.removeTagIdProject(
                SITE_DB_NAME,
                ProjectData,
              );
            // if (removeTagIdProject === "NA") {
            //   const record = {
            //     success: false,
            //     msg: msg.msgRemoveTagsAllProjectError,
            //     key: 5,
            //   };
            //   return res.status(200).json(record);
            // }

            const removeTagIdTask = await UserCommenService.removeTagIdTask(
              SITE_DB_NAME,
              tags,
            );
            // if (removeTagIdTask === "NA") {
            //   const record = {
            //     success: false,
            //     msg: msg.msgRemoveTagsAllTaskError,
            //     key: 5,
            //   };
            //   return res.status(200).json(record);
            // }

            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const notiUserId = userId;
            const notiOtherUserId = userId;
            const action = "settings";
            const notificationOrActivity = 1;
            const actionId = userId;
            const { title, message } = msg.generateActivityCommenMessage(
              checkUserID.name,
              checkTag?.name,
              "",
              "DeletedTag",
            );
            const titles = title;
            const messages = message;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgTagDeleteSuccess,
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in deleteTag emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in deleteTag emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in deleteTag emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  //====================================== Tanant-company-Custom-Fields-Flow ===========================
  createCustomField: [
    body("moduleType")
      .exists()
      .withMessage(msg.msgModuleTypeRequired)
      .isIn(["Project", "Task", "Company"])
      .withMessage(msg.msgModuleTypeRequired),
    body("fieldName")
      .trim()
      .exists()
      .withMessage(msg.msgFieldNameIsRequired)
      .notEmpty()
      .withMessage(msg.msgFieldNameIsRequired),
    body("keyName")
      .trim()
      .exists()
      .withMessage(msg.msgKeyNameIsRequired)
      .notEmpty()
      .withMessage(msg.msgKeyNameIsRequired),
    // body("fieldType")
    //   .exists()
    //   .withMessage(msg.msgTypeIsRequired)
    //   .isIn(["text", "number", "date", "checkbox", "url", "status", "dropdown"])
    //   .withMessage(msg.msgTypeIsRequired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const {
              moduleType,
              fieldName,
              keyName,
              fieldType,
              options,
              description,
            } = data;
            const checkCustomField = await UserCommenService.checkCustomField(
              SITE_DB_NAME,
              moduleType,
              fieldName,
            );
            if (checkCustomField !== "NA") {
              const record = {
                success: false,
                msg: msg.msgCustomFieldAlreadyExist,
                key: 4,
              };
              return res.status(200).json(record);
            } else {
              try {
                const customFieldData = {
                  moduleType,
                  fieldName,
                  keyName,
                  fieldType,
                  options,
                  description,
                };
                const createCustomField =
                  await UserCommenService.createCustomField(
                    SITE_DB_NAME,
                    customFieldData,
                  );
                if (createCustomField === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgCreateCustomFieldError,
                    key: 5,
                  };
                  return res.status(200).json(record);
                } else {
                  const customFieldId = createCustomField?._id;
                  const customFieldDetails =
                    await UserCommenService.getCustomFieldDetails(
                      SITE_DB_NAME,
                      customFieldId,
                    );

                  const APP_LOGO = process.env.APP_LOGO || "";
                  const APP_SITE_URL = process.env.SITE_URL || "";
                  const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                  const notiUserId = userId;
                  const notiOtherUserId = userId;
                  const action = "settings";
                  const notificationOrActivity = 1;
                  const actionId = userId;
                  const { title, message } = msg.generateActivityCommenMessage(
                    checkUserID.name,
                    customFieldDetails?.fieldName,
                    "",
                    "CustomFieldCreate",
                  );
                  const titles = title;
                  const messages = message;
                  const actionJson = {
                    actionId: actionId,
                    action: action,
                    option: {
                      logoUrl: APP_LOGO,
                      redirectionUrl: {
                        webLink: APP_SITE_URL,
                        deepLink: APP_DEEP_LINK_URL,
                      },
                      imageUrl: "",
                      soundFile: "",
                    },
                    appType: "customer",
                  };
                  let notificationArr = [];

                  const notification =
                    await oneSignalHelperUser.getNotificationArrSingle(
                      SITE_DB_NAME,
                      notiUserId,
                      notiOtherUserId,
                      action,
                      actionId,
                      titles,
                      messages,
                      actionJson,
                      notificationOrActivity,
                    );

                  if (notification !== "NA") {
                    notificationArr.push(notification);
                  }
                  if (notificationArr.length > 0) {
                    notificationArr.push(notification);
                    await oneSignalHelperUser.oneSignalNotificationSendCall(
                      notificationArr,
                    );
                  }
                  const record = {
                    success: true,
                    msg: msg.msgCustomFieldCreatedSuccess,
                    data: { customFieldDetails: customFieldDetails },
                  };

                  return res.status(200).json(record);
                }
              } catch (error) {
                logger.error("Database error in createTag emp 5", {
                  error: error.message,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 5,
                };
                return res.status(500).json(record);
              }
            }
          } catch (error) {
            logger.error("Database error in createTag emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createTag emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in createTag emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  getCustomField: [
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
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const userId = req.CURRENT_USER_ID;
      const { deleteFlag } = req.query;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const moduleType = req.query.moduleType || "";
            const customFieldDetails = await UserCommenService.getCustomField(
              SITE_DB_NAME,
              Number(deleteFlag),
              moduleType,
            );
            if (customFieldDetails === "NA") {
              const record = {
                success: true,
                msg: msg.msgDataFound,
                data: {
                  customFieldDetails: [],
                },
              };
              return res.status(200).json(record);
            }
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                customFieldDetails: customFieldDetails,
              },
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in getCustomField emp 4", {
              error,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in getCustomField emp 2", {
            error,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in getCustomField emp 1", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateCustomField: [
    query("customFieldId")
      .trim()
      .exists()
      .withMessage(msg.msgCustomFieldIdError)
      .notEmpty()
      .withMessage(msg.msgCustomFieldIdError),
    body("fieldName")
      .trim()
      .exists()
      .withMessage(msg.msgFieldNameIsRequired)
      .notEmpty()
      .withMessage(msg.msgFieldNameIsRequired),
    body("keyName")
      .trim()
      .exists()
      .withMessage(msg.msgKeyNameIsRequired)
      .notEmpty()
      .withMessage(msg.msgKeyNameIsRequired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const {
        moduleType,
        fieldName,
        keyName,
        fieldType,
        options,
        description,
      } = req.body;
      const { customFieldId } = req.query;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const checkCustomFieldId =
              await UserCommenService.checkCustomFieldId(
                SITE_DB_NAME,
                customFieldId,
              );
            if (checkCustomFieldId === "NA") {
              const record = {
                success: false,
                msg: msg.msgCustomFieldIDIsNotExist,
                key: 4,
              };
              return res.status(200).json(record);
            }

            const checkCustomFieldName =
              await UserCommenService.checkCustomFieldName(
                SITE_DB_NAME,
                checkCustomFieldId._id,
                fieldName,
              );

            if (checkCustomFieldName !== "NA") {
              const record = {
                success: false,
                msg: msg.msgCustomFieldNameAlreadyExist,
                key: 4,
              };
              return res.status(200).json(record);
            }
            try {
              const customFieldData = {
                moduleType,
                fieldName,
                keyName,
                fieldType,
                options,
                description,
              };
              const updateCustomField =
                await UserCommenService.updateCustomField(
                  SITE_DB_NAME,
                  customFieldId,
                  customFieldData,
                );
              if (updateCustomField === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUpdateCustomFieldError,
                  key: 5,
                };
                return res.status(200).json(record);
              }
              const customFieldDetails =
                await UserCommenService.getCustomFieldDetails(
                  SITE_DB_NAME,
                  customFieldId,
                );
              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const notiUserId = userId;
              const notiOtherUserId = userId;
              const action = "settings";
              const notificationOrActivity = 1;
              const actionId = userId;
              const { title, message } = msg.generateActivityCommenMessage(
                checkUserID.name,
                customFieldDetails?.fieldName,
                "",
                "CustomFieldUpdated",
              );
              const titles = title;
              const messages = message;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];

              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }
              const record = {
                success: true,
                msg: msg.msgCustomFieldUpdateSuccess,
                data: { customFieldDetails: customFieldDetails },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in updateCustomField emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in updateCustomField emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in updateCustomField emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateCustomField emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  deleteCustomField: [
    query("customFieldId")
      .trim()
      .exists()
      .withMessage(msg.msgCustomFieldIdError)
      .notEmpty()
      .withMessage(msg.msgCustomFieldIdError),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { customFieldId } = req.query;
          const checkCustomField = await UserCommenService.checkCustomFieldId(
            SITE_DB_NAME,
            customFieldId,
          );
          if (checkCustomField === "NA") {
            const record = {
              success: false,
              msg: msg.msgCustomFieldIDIsNotExist,
              key: 4,
            };
            return res.status(200).json(record);
          }
          try {
            const customField = await UserCommenService.deleteCustomField(
              SITE_DB_NAME,
              customFieldId,
            );

            if (customField === "NA") {
              const record = {
                success: false,
                msg: msg.msgCustomFieldDeleteError,
                key: 3,
              };
              return res.status(200).json(record);
            }
            const deleteFlag = 0;
            const customFieldDetails = await UserCommenService.getCustomField(
              SITE_DB_NAME,
              deleteFlag,
            );
            if (customFieldDetails === "NA") {
              const record = {
                success: true,
                msg: msg.msgDataFound,
                data: {
                  customFieldDetails: [],
                },
              };
              return res.status(200).json(record);
            }
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const notiUserId = userId;
            const notiOtherUserId = userId;
            const action = "settings";
            const notificationOrActivity = 1;
            const actionId = userId;
            const { title, message } = msg.generateActivityCommenMessage(
              checkUserID.name,
              checkCustomField?.fieldName,
              "",
              "DeletedCustomField",
            );
            const titles = title;
            const messages = message;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }

            const record = {
              success: true,
              msg: msg.msgCustomFieldDeleteSuccess,
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in deleteCustomField emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in deleteCustomField emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in deleteCustomField emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  //====================================== Tanant-Workflow-Flow ===========================
  createWorkflow: [
    body("name")
      .trim()
      .exists()
      .withMessage(msg.msgWorkflowNameReqired)
      .notEmpty()
      .withMessage(msg.msgWorkflowNameReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const { name, stages } = data;
            const checkWorkflow = await UserCommenService.checkWorkflow(
              SITE_DB_NAME,
              name,
            );
            if (checkWorkflow !== "NA") {
              const record = {
                success: false,
                msg: msg.msgWorkflowAlreadyExist,
                key: 4,
              };
              return res.status(200).json(record);
            }
            try {
              const cleanedStages = stages.map((stage) => {
                return {
                  stageName: stage.stageName,
                  color: stage.color,
                  order: stage.order,
                };
              });
              const workflowData = {
                name,
                stages: cleanedStages,
                createdBy: checkUserID._id,
              };
              const createWorkflow = await UserCommenService.createWorkflow(
                SITE_DB_NAME,
                workflowData,
              );
              if (createWorkflow === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgCreateWorkflowError,
                  key: 5,
                };
                return res.status(200).json(record);
              }
              const workflowId = createWorkflow?._id;
              const workflowDetails =
                await UserCommenService.getWorkflowDetails(
                  SITE_DB_NAME,
                  workflowId,
                );

              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const notiUserId = userId;
              const notiOtherUserId = userId;
              const action = "settings";
              const notificationOrActivity = 1;
              const actionId = userId;
              const { title, message } = msg.generateActivityCommenMessage(
                checkUserID.name,
                workflowDetails?.name,
                "",
                "WorkflowCreate",
              );
              const titles = title;
              const messages = message;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];

              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }
              const record = {
                success: true,
                msg: msg.msgWorkflowCreatedSuccess,
                data: { workflow: workflowDetails },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in createWorkflow emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in createWorkflow emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createWorkflow emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in createWorkflow emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  getWorkflow: [
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
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const userId = req.CURRENT_USER_ID;
      const { deleteFlag } = req.query;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const pagination = {
              pageSize: parseInt(req.query.pageSize) || 10,
              pageNumber: parseInt(req.query.pageNumber) || 1,
            };

            const search = req.query.search || "";
            const workflowDetails = await UserCommenService.getWorkflow(
              SITE_DB_NAME,
              Number(deleteFlag),
              pagination,
              search,
            );
            if (workflowDetails === "NA") {
              const record = {
                success: true,
                msg: msg.msgDataFound,
                data: {
                  workflow: [],
                },
              };
              return res.status(200).json(record);
            }
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                workflow: workflowDetails,
              },
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in getWorkflow emp 4", {
              error,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in getWorkflow emp 2", {
            error,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in getWorkflow emp 1", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateWorkflow: [
    query("workflowId")
      .trim()
      .exists()
      .withMessage(msg.msgWorkflowIdIsRequired)
      .notEmpty()
      .withMessage(msg.msgWorkflowIdIsRequired),
    body("name")
      .trim()
      .exists()
      .withMessage(msg.msgWorkflowNameReqired)
      .notEmpty()
      .withMessage(msg.msgWorkflowNameReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const { name, stages } = req.body;
      const { workflowId } = req.query;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const checkWorkflowId = await UserCommenService.checkWorkflowId(
              SITE_DB_NAME,
              workflowId,
            );
            if (checkWorkflowId === "NA") {
              const record = {
                success: false,
                msg: msg.msgWorkflowIDIsNotExist,
                key: 4,
              };
              return res.status(200).json(record);
            }

            const checkWorkflowName = await UserCommenService.checkWorkflowName(
              SITE_DB_NAME,
              checkWorkflowId._id,
              name,
            );

            if (checkWorkflowName !== "NA") {
              const record = {
                success: false,
                msg: msg.msgWorkflowNameAlreadyExist,
                key: 4,
              };
              return res.status(200).json(record);
            }
            try {
              const cleanedStages = stages.map((stage) => {
                // ✅ sirf valid MongoDB ObjectId allow
                if (stage._id && mongoose.Types.ObjectId.isValid(stage._id)) {
                  return {
                    _id: stage._id,
                    stageName: stage.stageName,
                    color: stage.color,
                    order: stage.order,
                  };
                }

                // ❌ random / fake / new stage → _id mat bhejo
                return {
                  stageName: stage.stageName,
                  color: stage.color,
                  order: stage.order,
                };
              });

              const userData = { name, stages: cleanedStages };
              const updateWorkflow = await UserCommenService.updateWorkflow(
                SITE_DB_NAME,
                workflowId,
                userData,
              );
              if (updateWorkflow === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUpdateWorkflowError,
                  key: 5,
                };
                return res.status(200).json(record);
              }
              const workflowDetails =
                await UserCommenService.getWorkflowDetails(
                  SITE_DB_NAME,
                  workflowId,
                );
              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const notiUserId = userId;
              const notiOtherUserId = userId;
              const action = "settings";
              const notificationOrActivity = 1;
              const actionId = userId;
              const { title, message } = msg.generateActivityCommenMessage(
                checkUserID.name,
                workflowDetails?.name,
                "",
                "WorkflowUpdated",
              );
              const titles = title;
              const messages = message;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];

              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }
              const record = {
                success: true,
                msg: msg.msgWorkflowUpdatedSuccess,
                data: { workflow: workflowDetails },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in updateWorkflow emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in updateWorkflow emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in updateWorkflow emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateWorkflow emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateWorkflowAddProject: [
    query("workflowId")
      .exists()
      .withMessage(msg.msgWorkflowIdIsRequired)
      .notEmpty()
      .withMessage(msg.msgWorkflowIdIsRequired),
    body("projectIds")
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const { workflowId } = req.query;
      const { projectIds } = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const checkWorkflowId = await UserCommenService.checkWorkflowId(
              SITE_DB_NAME,
              workflowId,
            );
            if (checkWorkflowId === "NA") {
              const record = {
                success: false,
                msg: msg.msgWorkflowIDIsNotExist,
                key: 4,
              };
              return res.status(200).json(record);
            }

            const firstStage =
              checkWorkflowId.stages && checkWorkflowId.stages.length > 0
                ? checkWorkflowId.stages[0]._id
                : null;

            try {
              const updateWorkflowAddProject =
                await UserCommenService.updateWorkflowAddProject(
                  SITE_DB_NAME,
                  projectIds,
                  checkWorkflowId._id,
                  firstStage,
                );

              if (updateWorkflowAddProject === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUpdateProjectWorkflowAddError,
                };
                return res.status(200).json(record);
              }

              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const notiUserId = userId;
              const notiOtherUserId = userId;
              const action = "setting";
              const notificationOrActivity = 1;
              const actionId = userId;
              const { title, message } = msg.generateActivityCommenMessage(
                checkUserID.name,
                checkWorkflowId?.name,
                "",
                "WorkflowUpdated",
              );
              const titles = title;
              const messages = message;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];

              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }
              const record = {
                success: true,
                msg: msg.msgUpdateProjectWorkflowAddSuccess,
                workflow: updateWorkflowAddProject,
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in updateWorkflowAddProject emp 4", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 4,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in updateWorkflowAddProject emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in updateWorkflowAddProject emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateWorkflowAddProject emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  deleteWorkflow: [
    query("workflowId")
      .trim()
      .exists()
      .withMessage(msg.msgWorkflowIdIsRequired)
      .notEmpty()
      .withMessage(msg.msgWorkflowIdIsRequired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { workflowId } = req.query;
          const checkWorkflow = await UserCommenService.checkDeleteWorkflow(
            SITE_DB_NAME,
            workflowId,
          );
          if (checkWorkflow === "NA") {
            const record = {
              success: false,
              msg: msg.msgWorkflowIDIsNotExist,
              key: 4,
            };
            return res.status(200).json(record);
          }
          const removeWorkflowIdProject =
            await UserCommenService.removeWorkflowIdProject(
              SITE_DB_NAME,
              checkWorkflow._id,
            );

          const removeWorkflowIdTask =
            await UserCommenService.removeWorkflowIdTask(
              SITE_DB_NAME,
              checkWorkflow._id,
            );
          try {
            const workflow = await UserCommenService.deleteWorkflow(
              SITE_DB_NAME,
              workflowId,
            );

            if (workflow === "NA") {
              const record = {
                success: false,
                msg: msg.msgWorkflowDeleteError,
                key: 3,
              };
              return res.status(200).json(record);
            }
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const notiUserId = userId;
            const notiOtherUserId = userId;
            const action = "settings";
            const notificationOrActivity = 1;
            const actionId = userId;
            const { title, message } = msg.generateActivityCommenMessage(
              checkUserID.name,
              checkWorkflow?.name,
              "",
              "DeletedWorkflow",
            );
            const titles = title;
            const messages = message;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }

            const record = {
              success: true,
              msg: msg.msgWorkflowDeleteSuccess,
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in deleteWorkflow emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in deleteWorkflow emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in deleteWorkflow emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  // =========roles-accesspermissions-controllers===========
  getRolesAccesspermissionsController: [
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
      } else {
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        const userId = req.CURRENT_USER_ID;
        const roleName = req.CURRENT_USER?.roleName;
        const { deleteFlag } = req.query;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          if (!userId && userId === 0) {
            const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
            return res.status(200).json(record);
          } else {
            try {
              const checkUserID = await UserCommenService.checkUser(
                SITE_DB_NAME,
                userId,
              );
              if (checkUserID === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUserNotExist,
                  key: 2,
                };
                return res.status(200).json(record);
              } else {
                try {
                  if (roleName !== "Site-Owner" && roleName !== "Admin") {
                    const record = {
                      success: false,
                      msg: msg.msgPermissionDenied,
                      key: 3,
                    };
                    return res.status(200).json(record);
                  } else {
                    try {
                      const workflowDetails =
                        await UserCommenService.getRolesAccesspermissionsService(
                          SITE_DB_NAME,
                          Number(deleteFlag),
                        );
                      if (workflowDetails === "NA") {
                        const record = {
                          success: true,
                          msg: msg.msgDataFound,
                          data: {
                            data: { rolesAccesspermissions: [] },
                          },
                        };
                        return res.status(200).json(record);
                      }

                      const filteredPermissions = rolesAccesspermissions.filter(
                        (item) =>
                          item.roleName !== "Super-Admin" &&
                          item.roleName !== "Site-Owner",
                      );
                      const record = {
                        success: true,
                        msg: msg.msgDataFound,
                        data: { rolesAccesspermissions: filteredPermissions },
                      };

                      return res.status(200).json(record);
                    } catch (error) {
                      logger.error(
                        "Database error in getRolesAccesspermissionsController emp 4",
                        {
                          error,
                        },
                      );
                      const record = {
                        success: false,
                        msg: msg.msgServerError,
                        key: 4,
                      };
                      return res.status(500).json(record);
                    }
                  }
                } catch (error) {
                  logger.error(
                    "Database error in getRolesAccesspermissionsController emp 3",
                    {
                      error,
                    },
                  );
                  const record = {
                    success: false,
                    msg: msg.msgServerError,
                    key: 3,
                  };
                  return res.status(500).json(record);
                }
              }
            } catch (error) {
              logger.error(
                "Database error in getRolesAccesspermissionsController emp 2",
                {
                  error,
                },
              );
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 2,
              };
              return res.status(500).json(record);
            }
          }
        } catch (error) {
          logger.error(
            "Database error in getRolesAccesspermissionsController emp 1",
            {
              error,
            },
          );
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 1,
          };
          return res.status(500).json(record);
        }
      }
    },
  ],

  //====================================== Tanant-Project-Flow ===========================
  createProjectCategory: [
    body("name")
      .trim()
      .exists()
      .withMessage(msg.msgProjectCategoryNameReqired)
      .notEmpty()
      .withMessage(msg.msgProjectCategoryNameReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const { name, description, subCategory } = data;
            const checkProjectCategory =
              await UserCommenService.checkProjectCategory(SITE_DB_NAME, name);
            if (checkProjectCategory !== "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectCategoryAlreadyExist,
                key: 4,
              };
              return res.status(200).json(record);
            }
            try {
              const ProjectCategoryData = {
                name,
                description,
                subCategory,
              };
              const createProjectCategory =
                await UserCommenService.createProjectCategory(
                  SITE_DB_NAME,
                  ProjectCategoryData,
                );
              if (createProjectCategory === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgCreateProjectCategoryError,
                  key: 5,
                };
                return res.status(200).json(record);
              }
              const createProjectCategoryId = createProjectCategory?._id;
              const projectCategoryDetails =
                await UserCommenService.getProjectCategory(
                  SITE_DB_NAME,
                  createProjectCategoryId,
                );

              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const notiUserId = userId;
              const notiOtherUserId = userId;
              const action = "project";
              const notificationOrActivity = 1;
              const actionId = userId;
              const { title, message } = msg.generateActivityCommenMessage(
                checkUserID.name,
                projectCategoryDetails?.name,
                "",
                "ProjectCategoryCreate",
              );
              const titles = title;
              const messages = message;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];

              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }
              const record = {
                success: true,
                msg: msg.msgProjectCategoryCreatedSuccess,
                data: { projectCategory: projectCategoryDetails },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in createProjectCategory emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in createProjectCategory emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createProjectCategory emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in createProjectCategory emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  getProjectCategories: [
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
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const userId = req.CURRENT_USER_ID;
      const { deleteFlag } = req.query;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const ProjectCategoryDetails =
              await UserCommenService.getProjectCategories(
                SITE_DB_NAME,
                Number(deleteFlag),
              );
            if (ProjectCategoryDetails === "NA") {
              const record = {
                success: true,
                msg: msg.msgDataFound,
                data: {
                  projectCategory: [],
                },
              };
              return res.status(200).json(record);
            }
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                projectCategory: ProjectCategoryDetails,
              },
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in getProjectCategory emp 4", {
              error,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in getProjectCategory emp 2", {
            error,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in getProjectCategory emp 1", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  createProject: [
    body("name")
      .trim()
      .exists()
      .withMessage(msg.msgProjectNameReqired)
      .notEmpty()
      .withMessage(msg.msgProjectNameReqired),

    body("companyId")
      .trim()
      .exists()
      .withMessage(msg.msgCompanyIdReqired)
      .notEmpty()
      .withMessage(msg.msgCompanyIdReqired),

    body("workflowId")
      .trim()
      .exists()
      .withMessage(msg.msgWorkflowIdIsRequired)
      .notEmpty()
      .withMessage(msg.msgWorkflowIdIsRequired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const projectNumber =
              await UserCommenService.checkProjectLastNumber(SITE_DB_NAME);
            if (projectNumber === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectLastNumberIsNotFind,
                key: 4,
              };
              return res.status(200).json(record);
            }
            try {
              const {
                name,
                description,
                ownerId,
                companyId,
                workflowId,
                peopleIds,
                projectCategoryId,
                projectSubCategoryId,
                tagIds,
                isBillable,
                notifyIds,
                projectHealthLabels,
              } = data;
              const checkProject = await UserCommenService.checkProject(
                SITE_DB_NAME,
                name,
              );
              if (checkProject !== "NA") {
                const record = {
                  success: false,
                  msg: msg.msgProjectAlreadyExist,
                  key: 4,
                };
                return res.status(200).json(record);
              }
              try {
                const ProjectData = {
                  name,
                  description,
                  ownerId,
                  companyId,
                  workflowId,
                  peopleIds,
                  projectCategoryId,
                  projectSubCategoryId,
                  tagIds,
                  isBillable,
                  notifyIds,
                  projectNumber,
                  createdById: userId,
                  projectHealthLabels,
                };
                const createProject = await UserCommenService.createProject(
                  SITE_DB_NAME,
                  ProjectData,
                );
                if (createProject === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgCreateProjectError,
                    key: 5,
                  };
                  return res.status(200).json(record);
                }
                try {
                  const {
                    budgetName,
                    budgetType,
                    budgetAmountType,
                    budgetAmount,
                    budgetRepeats,
                    budgetStartDate,
                    budgetEndDate,
                    budgetBasedOn,
                    retainerOption,
                    financialTarget,
                  } = data;
                  const ProjectBudgetData = {
                    createdById: createProject.createdById,
                    projectId: createProject._id,
                    budgetName,
                    budgetType,
                    budgetAmountType,
                    budgetAmount,
                    budgetRepeats,
                    budgetStartDate,
                    budgetEndDate,
                    budgetBasedOn,
                    retainerOption,
                    financialTarget,
                  };
                  const createProjectBudget =
                    await UserCommenService.createProjectBudget(
                      SITE_DB_NAME,
                      ProjectBudgetData,
                    );
                  if (createProjectBudget === "NA") {
                    const record = {
                      success: false,
                      msg: msg.msgCreateProjectBudgetError,
                      key: 5,
                    };
                    return res.status(200).json(record);
                  }
                  try {
                    const { customFields } = req.body;
                    if (
                      customFields &&
                      Array.isArray(customFields) &&
                      customFields.length > 0
                    ) {
                      let updateFields = {};
                      for (const { keyName, value } of customFields) {
                        updateFields[`customFields.${keyName}.value`] = value;
                      }

                      const updateProjectMultiCustomField =
                        await UserCommenService.updateProjectMultiCustomField(
                          SITE_DB_NAME,
                          createProject._id,
                          updateFields,
                        );

                      if (updateProjectMultiCustomField === "NA") {
                        const record = {
                          success: false,
                          msg: msg.msgUpdateProjectCustomFieldError,
                        };
                        return res.status(200).json(record);
                      }
                    }

                    const createProjectId = createProject?._id;
                    const projectDetails = await UserCommenService.getProject(
                      SITE_DB_NAME,
                      createProjectId,
                    );

                    const APP_LOGO = process.env.APP_LOGO || "";
                    const APP_SITE_URL = process.env.SITE_URL || "";
                    const APP_DEEP_LINK_URL =
                      process.env.APP_DEEP_LINK_URL || "";
                    const action = "project";
                    const notificationOrActivity = 1;
                    const actorId = userId;
                    const targetProjectId = createProject?._id;
                    const { title, message } =
                      msg.generateActivityCommenMessage(
                        checkUserID.name,
                        projectDetails?.name,
                        "",
                        "ProjectCreate",
                      );
                    const titles = title;
                    const messages = message;
                    const actionId = targetProjectId;
                    const notiUserId = actorId;
                    const notiOtherUserId = targetProjectId;
                    const actionJson = {
                      actionId: actionId,
                      action: action,
                      option: {
                        logoUrl: APP_LOGO,
                        redirectionUrl: {
                          webLink: APP_SITE_URL,
                          deepLink: APP_DEEP_LINK_URL,
                        },
                        imageUrl: "",
                        soundFile: "",
                      },
                      appType: "customer",
                    };
                    let notificationArr = [];

                    const notification =
                      await oneSignalHelperUser.getNotificationArrSingle(
                        SITE_DB_NAME,
                        notiUserId,
                        notiOtherUserId,
                        action,
                        actionId,
                        titles,
                        messages,
                        actionJson,
                        notificationOrActivity,
                      );

                    if (notification !== "NA") {
                      notificationArr.push(notification);
                    }
                    if (notificationArr.length > 0) {
                      notificationArr.push(notification);
                      await oneSignalHelperUser.oneSignalNotificationSendCall(
                        notificationArr,
                      );
                    }
                    const record = {
                      success: true,
                      msg: msg.msgProjectCreatedSuccess,
                      data: {
                        project: projectDetails,
                      },
                    };

                    return res.status(200).json(record);
                  } catch (error) {
                    logger.error("Database error in createProject emp 7", {
                      error: error.message,
                    });
                    const record = {
                      success: false,
                      msg: msg.msgServerError,
                      key: 7,
                    };
                    return res.status(500).json(record);
                  }
                } catch (error) {
                  logger.error("Database error in createProject emp 6", {
                    error: error.message,
                  });
                  const record = {
                    success: false,
                    msg: msg.msgServerError,
                    key: 6,
                  };
                  return res.status(500).json(record);
                }
              } catch (error) {
                logger.error("Database error in createProject emp 5", {
                  error: error.message,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 5,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              logger.error("Database error in createProject emp 4", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 4,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in createProject emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createProject emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in createProject emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateProject: [
    query("projectId")
      .trim()
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),

    body("name")
      .trim()
      .exists()
      .withMessage(msg.msgProjectNameReqired)
      .notEmpty()
      .withMessage(msg.msgProjectNameReqired),

    body("companyId")
      .trim()
      .exists()
      .withMessage(msg.msgCompanyIdReqired)
      .notEmpty()
      .withMessage(msg.msgCompanyIdReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      const { projectId } = req.query;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const {
              name,
              description,
              ownerId,
              companyId,
              projectStartDate,
              projectEndDate,
              peopleIds,
              projectCategoryId,
              projectSubCategoryId,
              tagIds,
              isBillable,
              projectHealthLabels,
              favorite,
            } = data;

            const checkProjectId = await UserCommenService.checkProjectId(
              SITE_DB_NAME,
              projectId,
            );
            if (checkProjectId === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectIsNotExist,
                key: 4,
              };
              return res.status(200).json(record);
            }

            const checkProjectUpdateName =
              await UserCommenService.checkProjectUpdateName(
                SITE_DB_NAME,
                checkProjectId._id,
                name,
              );

            if (checkProjectUpdateName !== "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectAlreadyExist,
                key: 4,
              };
              return res.status(200).json(record);
            }
            try {
              const ProjectData = {
                name,
                description,
                ownerId,
                companyId,
                projectStartDate,
                projectEndDate,
                peopleIds,
                projectCategoryId,
                projectSubCategoryId,
                tagIds,
                isBillable,
                projectHealthLabels,
                favorite,
              };
              const updateProject = await UserCommenService.updateProject(
                SITE_DB_NAME,
                checkProjectId._id,
                ProjectData,
              );
              if (updateProject === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUpdateProjectError,
                  key: 5,
                };
                return res.status(200).json(record);
              }
              const updateProjectId = checkProjectId?._id;
              const projectDetails = await UserCommenService.getProject(
                SITE_DB_NAME,
                updateProjectId,
              );

              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const action = "project";
              const notificationOrActivity = 1;
              const actorId = userId;
              const targetProjectId =
                projectDetails?._id || req.body.projectId || null;
              const { title, message } = msg.generateActivityCommenMessage(
                checkUserID.name,
                projectDetails?.name,
                "",
                "ProjectUpdated",
              );
              const titles = title;
              const messages = message;
              const actionId = targetProjectId;
              const notiUserId = actorId;
              const notiOtherUserId = targetProjectId;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];

              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }
              const record = {
                success: true,
                msg: msg.msgProjectUpdatedSuccess,
                data: {
                  project: projectDetails,
                },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in createProject emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in createProject emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createProject emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in createProject emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  autoPermanentDeleteController: async (SITE_DB_NAME, workspaceTimeZone) => {
    if (!SITE_DB_NAME) {
      return {
        success: false,
        msg: msg.msgUserNotExist,
        key: 1,
      };
    }

    try {
      const beforeDate = await CommenFunction.getPermanentDeleteBeforeDate(
        30,
        workspaceTimeZone,
      );

      if (beforeDate === "NA") {
        return {
          success: false,
          msg: msg.msgServerError,
          key: 2,
        };
      }

      const expiredProjects =
        await UserCommenService.getExpiredSoftDeletedProjects(
          SITE_DB_NAME,
          beforeDate,
        );

      if (expiredProjects === "NA") {
        return {
          success: true,
          msg: msg.msgNoExpiredProjectFound,
          data: { deleted: 0 },
        };
      }

      let successCount = 0;
      let failCount = 0;

      const BATCH_SIZE = 10;

      for (let i = 0; i < expiredProjects.length; i += BATCH_SIZE) {
        const batch = expiredProjects.slice(i, i + BATCH_SIZE);

        const results = await Promise.allSettled(
          batch.map((p) =>
            UserCommenService.permanentDeleteProject(SITE_DB_NAME, p._id),
          ),
        );

        results.forEach((r) => {
          if (r.status === "fulfilled" && r.value !== "NA") {
            successCount++;
          } else {
            failCount++;
          }
        });
      }

      return {
        success: true,
        msg: msg.msgProjectPermanentDeleteSuccess,
        data: {
          deleted: successCount,
          failed: failCount,
        },
      };
    } catch (error) {
      logger.error("CRON: autoPermanentDeleteController failed", {
        error: error.message,
      });

      return {
        success: false,
        msg: msg.msgServerError,
        key: 500,
      };
    }
  },

  deleteProject: [
    query("projectId")
      .trim()
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { projectId } = req.query;
          const checkProject = await UserCommenService.checkProjectId(
            SITE_DB_NAME,
            projectId,
          );
          if (checkProject === "NA") {
            const record = {
              success: false,
              msg: msg.msgProjectAlreadyExist,
              key: 4,
            };
            return res.status(200).json(record);
          }
          try {
            const project = await UserCommenService.softDeleteProject(
              SITE_DB_NAME,
              projectId,
            );

            if (project === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectDeleteError,
                key: 3,
              };
              return res.status(200).json(record);
            }
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const notiUserId = userId;
            const notiOtherUserId = userId;
            const action = "project";
            const notificationOrActivity = 1;
            const actionId = null;
            const { title, message } = msg.generateActivityCommenMessage(
              checkUserID.name,
              checkProject?.name,
              "",
              "DeletedProject",
            );
            const titles = title;
            const messages = message;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }

            const record = {
              success: true,
              msg: msg.msgProjectDeleteSuccess,
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in deleteProject emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in deleteProject emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in deleteProject emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  restoreProject: [
    query("projectId")
      .trim()
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { projectId } = req.query;
          const checkProject = await UserCommenService.checkProjectRestoreId(
            SITE_DB_NAME,
            projectId,
          );
          if (checkProject === "NA") {
            const record = {
              success: false,
              msg: msg.msgProjectAlreadyExist,
              key: 4,
            };
            return res.status(200).json(record);
          }
          try {
            const project = await UserCommenService.restoreProject(
              SITE_DB_NAME,
              projectId,
            );

            if (project === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectRestoreError,
                key: 3,
              };
              return res.status(200).json(record);
            }
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "project";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetProjectId = checkProject.projectId || null;
            const { title, message } = msg.generateActivityCommenMessage(
              checkUserID.name,
              checkProject?.name || "",
              "",
              "RestoredProject",
            );
            const titles = title;
            const messages = message;
            const actionId = targetProjectId;
            const notiUserId = actorId;
            const notiOtherUserId = targetProjectId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }

            const record = {
              success: true,
              msg: msg.msgProjectRestoreSuccess,
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in restoreProject emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in restoreProject emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in restoreProject emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  copyProject: [
    query("projectId")
      .trim()
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const { projectId } = req.query;
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const checkProjectId = await UserCommenService.checkProjectId(
              SITE_DB_NAME,
              projectId,
            );
            if (checkProjectId === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectIsNotExist,
                key: 4,
              };
              return res.status(200).json(record);
            }
            try {
              const {
                name,
                description,
                companyId,
                includePeople = false,
                includeCustomFields = false,
                includeBudget = false,
                includeDate = false,
                // includeNotifyIds = false,
              } = data;
              const checkProject = await UserCommenService.checkProject(
                SITE_DB_NAME,
                name,
              );
              if (checkProject !== "NA") {
                const record = {
                  success: false,
                  msg: msg.msgProjectAlreadyExist,
                  key: 4,
                };
                return res.status(200).json(record);
              }
              const projectNumber =
                await UserCommenService.checkProjectLastNumber(SITE_DB_NAME);
              if (projectNumber === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgProjectLastNumberIsNotFind,
                  key: 4,
                };
                return res.status(200).json(record);
              }
              try {
                let projectStartDate = null;
                let projectEndDate = null;

                if (includeDate === true) {
                  projectStartDate = checkProjectId?.projectStartDate || null;
                  projectEndDate = checkProjectId?.projectEndDate || null;
                } else {
                  projectStartDate =
                    req.body?.projectStartDate &&
                    req.body.projectStartDate !== ""
                      ? req.body.projectStartDate
                      : null;

                  projectEndDate =
                    req.body?.projectEndDate && req.body.projectEndDate !== ""
                      ? req.body.projectEndDate
                      : null;
                }

                const ProjectData = {
                  name,
                  description,
                  companyId,
                  ownerId: checkProjectId?.ownerId || null,
                  workflowId: checkProjectId?.workflowId || null,
                  peopleIds: includePeople
                    ? checkProjectId?.peopleIds || []
                    : [],
                  projectCategoryId: checkProjectId?.projectCategoryId || null,
                  projectSubCategoryId:
                    checkProjectId?.projectSubCategoryId || null,
                  tagIds: checkProjectId?.tagIds || [],
                  isBillable: checkProjectId?.isBillable || false,
                  notifyIds: checkProjectId?.notifyIds || [],
                  projectNumber,
                  createdById: userId,
                  projectHealthLabels:
                    checkProjectId?.projectHealthLabels || null,
                  projectStartDate,
                  projectEndDate,
                };
                const createProject = await UserCommenService.createProject(
                  SITE_DB_NAME,
                  ProjectData,
                );
                if (createProject === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgCreateProjectError,
                    key: 5,
                  };
                  return res.status(200).json(record);
                }
                try {
                  let ProjectBudgetData = {};

                  if (includeBudget === true) {
                    const checkBudgetProjectId =
                      await UserCommenService.checkBudgetProjectId(
                        SITE_DB_NAME,
                        checkProjectId?._id,
                      );

                    if (checkBudgetProjectId === "NA") {
                      const record = {
                        success: false,
                        msg: msg.msgBudgetProjectIsNotExist,
                      };
                      return res.status(200).json(record);
                    }
                    // COPY OLD PROJECT BUDGET
                    ProjectBudgetData = {
                      createdById: createProject.createdById,
                      projectId: createProject._id,
                      budgetName: checkBudgetProjectId?.budgetName,
                      budgetType: checkBudgetProjectId?.budgetType,
                      budgetAmountType: checkBudgetProjectId?.budgetAmountType,
                      budgetAmount: checkBudgetProjectId?.budgetAmount,
                      budgetRepeats: checkBudgetProjectId?.budgetRepeats,
                      budgetStartDate: checkBudgetProjectId?.budgetStartDate,
                      budgetEndDate: checkBudgetProjectId?.budgetEndDate,
                      budgetBasedOn: checkBudgetProjectId?.budgetBasedOn,

                      retainerOption: {
                        enabled: checkBudgetProjectId.retainerOption.enabled,
                        addUnspentToNext:
                          checkBudgetProjectId.retainerOption.addUnspentToNext,
                        subtractOverspentFromNext:
                          checkBudgetProjectId.retainerOption
                            .subtractOverspentFromNext,
                      },

                      financialTarget: {
                        enabled: checkBudgetProjectId.financialTarget.enabled,
                        profitMargin:
                          checkBudgetProjectId.financialTarget.profitMargin,
                        targetProfit:
                          checkBudgetProjectId.financialTarget.targetProfit,
                        targetCosts:
                          checkBudgetProjectId.financialTarget.targetCosts,
                      },
                    };
                  } else {
                    // DEFAULT NO BUDGET
                    ProjectBudgetData = {
                      createdById: createProject.createdById,
                      projectId: createProject._id,
                      budgetName: "No Budget",
                      budgetType: "no_budget",
                      budgetAmountType: "never",
                      budgetAmount: null,
                      budgetRepeats: "never",
                      budgetStartDate: null,
                      budgetEndDate: null,
                      budgetBasedOn: null,

                      retainerOption: {
                        enabled: false,
                        addUnspentToNext: false,
                        subtractOverspentFromNext: false,
                      },

                      financialTarget: {
                        enabled: false,
                        profitMargin: 0,
                        targetProfit: 0,
                        targetCosts: 0,
                      },
                    };
                  }
                  const createProjectBudget =
                    await UserCommenService.createProjectBudget(
                      SITE_DB_NAME,
                      ProjectBudgetData,
                    );
                  if (createProjectBudget === "NA") {
                    const record = {
                      success: false,
                      msg: msg.msgCreateProjectBudgetError,
                      key: 5,
                    };
                    return res.status(200).json(record);
                  }
                  try {
                    const projectCopyDetails =
                      await UserCommenService.getProject(
                        SITE_DB_NAME,
                        checkProjectId?._id,
                      );

                    const projectCustomFields =
                      projectCopyDetails?.customFields;

                    if (
                      includeCustomFields === true &&
                      projectCustomFields &&
                      typeof projectCustomFields === "object" &&
                      Object.keys(projectCustomFields).length > 0
                    ) {
                      let updateFields = {};

                      for (const key in projectCustomFields) {
                        const fieldObj = projectCustomFields[key];

                        updateFields[`customFields.${fieldObj.keyName}.value`] =
                          fieldObj.value;
                      }

                      const updateProjectMultiCustomField =
                        await UserCommenService.updateProjectMultiCustomField(
                          SITE_DB_NAME,
                          createProject._id,
                          updateFields,
                        );

                      if (updateProjectMultiCustomField === "NA") {
                        const record = {
                          success: false,
                          msg: msg.msgUpdateProjectCustomFieldError,
                        };
                        return res.status(200).json(record);
                      }
                    }

                    const createProjectId = createProject?._id;
                    const projectDetails = await UserCommenService.getProject(
                      SITE_DB_NAME,
                      createProjectId,
                    );

                    const APP_LOGO = process.env.APP_LOGO || "";
                    const APP_SITE_URL = process.env.SITE_URL || "";
                    const APP_DEEP_LINK_URL =
                      process.env.APP_DEEP_LINK_URL || "";
                    const action = "project";
                    const notificationOrActivity = 1;
                    const actorId = userId;
                    const targetProjectId = createProject?._id;
                    const { title, message } =
                      msg.generateActivityCommenMessage(
                        checkUserID.name,
                        projectDetails?.name,
                        "",
                        "ProjectCreate",
                      );
                    const titles = title;
                    const messages = message;
                    const actionId = targetProjectId;
                    const notiUserId = actorId;
                    const notiOtherUserId = targetProjectId;
                    const actionJson = {
                      actionId: actionId,
                      action: action,
                      option: {
                        logoUrl: APP_LOGO,
                        redirectionUrl: {
                          webLink: APP_SITE_URL,
                          deepLink: APP_DEEP_LINK_URL,
                        },
                        imageUrl: "",
                        soundFile: "",
                      },
                      appType: "customer",
                    };
                    let notificationArr = [];

                    const notification =
                      await oneSignalHelperUser.getNotificationArrSingle(
                        SITE_DB_NAME,
                        notiUserId,
                        notiOtherUserId,
                        action,
                        actionId,
                        titles,
                        messages,
                        actionJson,
                        notificationOrActivity,
                      );

                    if (notification !== "NA") {
                      notificationArr.push(notification);
                    }
                    if (notificationArr.length > 0) {
                      notificationArr.push(notification);
                      await oneSignalHelperUser.oneSignalNotificationSendCall(
                        notificationArr,
                      );
                    }
                    const record = {
                      success: true,
                      msg: msg.msgProjectCreatedSuccess,
                      data: {
                        project: projectDetails,
                      },
                    };

                    return res.status(200).json(record);
                  } catch (error) {
                    logger.error("Database error in createProject emp 7", {
                      error: error.message,
                    });
                    const record = {
                      success: false,
                      msg: msg.msgServerError,
                      key: 7,
                    };
                    return res.status(500).json(record);
                  }
                } catch (error) {
                  logger.error("Database error in createProject emp 6", {
                    error: error.message,
                  });
                  const record = {
                    success: false,
                    msg: msg.msgServerError,
                    key: 6,
                  };
                  return res.status(500).json(record);
                }
              } catch (error) {
                logger.error("Database error in createProject emp 5", {
                  error: error.message,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 5,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              logger.error("Database error in createProject emp 4", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 4,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in createProject emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createProject emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in createProject emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateProjectTags: [
    query("projectId")
      .trim()
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),

    body("tagIds")
      .trim()
      .exists()
      .withMessage(msg.msgTagIdReqired)
      .notEmpty()
      .withMessage(msg.msgTagIdReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      const { projectId } = req.query;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            let { tagIds } = data;

            const checkProjectId = await UserCommenService.checkProjectId(
              SITE_DB_NAME,
              projectId,
            );
            if (checkProjectId === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectIsNotExist,
                key: 4,
              };
              return res.status(200).json(record);
            }
            try {
              const ProjectData = {
                tagIds,
              };
              const updateProject = await UserCommenService.updateProject(
                SITE_DB_NAME,
                checkProjectId._id,
                ProjectData,
              );
              if (updateProject === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUpdateProjectTagsError,
                  key: 5,
                };
                return res.status(200).json(record);
              }
              const updateProjectId = checkProjectId?._id;
              const projectDetails = await UserCommenService.getProjectTags(
                SITE_DB_NAME,
                updateProjectId,
              );

              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const action = "project";
              const notificationOrActivity = 1;
              const actorId = userId;
              const targetProjectId =
                checkProjectId._id || req.query.projectId || null;
              const { title, message } = msg.generateActivityCommenMessage(
                checkUserID.name,
                checkProjectId?.name,
                "",
                "ProjectTagsUpdated",
              );
              const titles = title;
              const messages = message;
              const actionId = targetProjectId;
              const notiUserId = actorId;
              const notiOtherUserId = targetProjectId;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];

              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }
              const record = {
                success: true,
                msg: msg.msgProjectTagsUpdatedSuccess,
                data: { tags: projectDetails.tags },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in createProject emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in createProject emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createProject emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in createProject emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  editProjectCustomField: [
    body("projectId")
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),
    body("keyName")
      .exists()
      .withMessage(msg.msgProjectKeyNameReqired)
      .notEmpty()
      .withMessage(msg.msgProjectKeyNameReqired),
    body("value")
      .exists()
      .withMessage(msg.msgProjectCustomFieldValueReqired)
      .notEmpty()
      .withMessage(msg.msgProjectCustomFieldValueReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        const userName = req.CURRENT_USER?.name;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          const { projectId, keyName, value } = data;
          try {
            const checkProjectId = await UserCommenService.checkProjectId(
              SITE_DB_NAME,
              projectId,
            );
            if (checkProjectId === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectIsNotExist,
              };
              return res.status(200).json(record);
            }
            const updateProjectData = {
              [`customFields.${keyName}.value`]: value,
            };

            const updateCompany =
              await UserCommenService.updateProjectCustomField(
                SITE_DB_NAME,
                checkProjectId._id,
                updateProjectData,
              );
            if (updateCompany === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectCustomFieldUpdateError,
              };
              return res.status(200).json(record);
            }

            const getProjectDetails = await UserCommenService.getProject(
              SITE_DB_NAME,
              checkProjectId._id,
            );
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "project";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetProjectId =
              getProjectDetails._id || req.body.projectId || null;
            const { title, message } = msg.generateActivityCommenMessage(
              userName,
              getProjectDetails.name,
              "",
              "ProjectUpdatedCustomField",
            );
            const titles = title;
            const messages = message;
            const actionId = targetProjectId;
            const notiUserId = actorId;
            const notiOtherUserId = targetProjectId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgProjectCustomFieldSuccess,
              data: { projectDetails: getProjectDetails },
            };
            return res.status(200).json(record);
          } catch (error) {
            console.log("database error key 3", error);
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = { success: false, msg: msg.msgServerError, key: 1 };
        return res.status(500).json(record);
      }
    },
  ],

  getAllProject: [
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
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const userId = req.CURRENT_USER_ID;
      const userRoleName = req.CURRENT_USER?.roleName;
      const { deleteFlag } = req.query;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const pagination = {
              pageSize: parseInt(req.query.pageSize) || 10,
              pageNumber: parseInt(req.query.pageNumber) || 1,
            };
            const search = req.query.search || "";
            const status = req.query.status || "";
            const byCompany = req.query.companyId || "";
            const byUser = req.query.userId || "";
            const byProjectId = req.query.projectId || "";
            const currentUser = userId;
            const projectDetails = await UserCommenService.getAllProject(
              SITE_DB_NAME,
              Number(deleteFlag),
              pagination,
              search,
              status,
              byCompany,
              byUser,
              byProjectId,
              currentUser,
              userRoleName,
            );
            if (projectDetails === "NA") {
              const record = {
                success: true,
                msg: msg.msgDataFound,
                data: {
                  projects: [],
                },
              };
              return res.status(200).json(record);
            }
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                projects: projectDetails,
              },
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in getAllProject emp 3", {
              error,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in getAllProject emp 2", {
            error,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in getAllProject emp 1", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  editProjectBudget: [
    query("budgetId")
      .exists()
      .withMessage(msg.msgBudgetIDReqired)
      .notEmpty()
      .withMessage(msg.msgBudgetIDReqired),
    body("projectId")
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),
    body("budgetName")
      .exists()
      .withMessage(msg.msgProjectBudgetNameReqired)
      .notEmpty()
      .withMessage(msg.msgProjectBudgetNameReqired),
    body("budgetStartDate")
      .exists()
      .withMessage(msg.msgProjectBudgetStartDateReqired)
      .notEmpty()
      .withMessage(msg.msgProjectBudgetStartDateReqired),
    body("budgetType")
      .exists()
      .withMessage(msg.msgProjectBudgetTypeReqired)
      .notEmpty()
      .withMessage(msg.msgProjectBudgetTypeReqired),
    body("budgetAmountType")
      .exists()
      .withMessage(msg.msgProjectBudgetAmountTypeReqired)
      .notEmpty()
      .withMessage(msg.msgProjectBudgetAmountTypeReqired),
    body("budgetAmount")
      .exists()
      .withMessage(msg.msgProjectBudgetAmountReqired)
      .notEmpty()
      .withMessage(msg.msgProjectBudgetAmountReqired),
    body("budgetEndDate")
      .exists()
      .withMessage(msg.msgProjectBudgetEndDateReqired)
      .notEmpty()
      .withMessage(msg.msgProjectBudgetEndDateReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const data = req.body;
      const { budgetId } = req.query;
      try {
        const userId = req.CURRENT_USER_ID;
        const userName = req.CURRENT_USER?.name;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          const {
            projectId,
            budgetName,
            budgetType,
            budgetAmountType,
            budgetAmount,
            budgetRepeats,
            budgetStartDate,
            budgetEndDate,
            budgetBasedOn,
            retainerOption,
            financialTarget,
          } = data;
          try {
            const checkBudgetId = await UserCommenService.checkBudgetId(
              SITE_DB_NAME,
              budgetId,
            );

            if (checkBudgetId === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectIsNotExist,
              };
              return res.status(200).json(record);
            }

            const checkProjectId = await UserCommenService.checkProjectId(
              SITE_DB_NAME,
              projectId,
            );
            if (checkProjectId === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectIsNotExist,
              };
              return res.status(200).json(record);
            }
            const budgetData = {
              createdById: checkProjectId.createdById,
              projectId: checkProjectId._id,
              budgetName,
              budgetType,
              budgetAmountType,
              budgetAmount,
              budgetRepeats,
              budgetStartDate,
              budgetEndDate,
              budgetBasedOn,
              retainerOption,
              financialTarget,
            };

            console.log("budgetData", budgetData);
            console.log("checkProjectId", checkProjectId);

            const updateProjectBudget =
              await UserCommenService.editProjectBudget(
                SITE_DB_NAME,
                checkBudgetId._id,
                budgetData,
              );
            if (updateProjectBudget === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectBudgetUpdateError,
              };
              return res.status(200).json(record);
            }

            const getProjectDetails = await UserCommenService.getProject(
              SITE_DB_NAME,
              checkProjectId._id,
            );
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "project";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetProjectId =
              checkProjectId._id || req.body.projectId || null;
            const { title, message } = msg.generateActivityCommenMessage(
              userName,
              getProjectDetails.name,
              "",
              "ProjectUpdatedBudget",
            );
            const titles = title;
            const messages = message;
            const actionId = targetProjectId;
            const notiUserId = actorId;
            const notiOtherUserId = targetProjectId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgProjectBudgetSuccess,
              data: { projectDetails: getProjectDetails },
            };
            return res.status(200).json(record);
          } catch (error) {
            console.log("database error key 3", error);
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = { success: false, msg: msg.msgServerError, key: 1 };
        return res.status(500).json(record);
      }
    },
  ],

  updateProjectField: [
    query("projectId")
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),
    body("fieldName")
      .trim()
      .exists()
      .withMessage(msg.msgFieldNameReqired)
      .notEmpty()
      .withMessage(msg.msgFieldNameReqired),

    body("value").exists().withMessage(msg.msgFieldValueReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      let { fieldName, value } = req.body;
      const { projectId } = req.query;
      try {
        const userId = req.CURRENT_USER_ID;
        const currentUser = req.CURRENT_USER;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkProjectId = await UserCommenService.checkProjectId(
            SITE_DB_NAME,
            projectId,
          );
          if (checkProjectId === "NA") {
            const record = {
              success: false,
              msg: msg.msgProjectIsNotExist,
            };
            return res.status(200).json(record);
          }
          try {
            const projectData = {
              [fieldName]: value,
            };

            const updateProjectDetails =
              await UserCommenService.updateProjectField(
                SITE_DB_NAME,
                projectId,
                projectData,
              );
            if (updateProjectDetails === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectFieldError,
                key: 5,
              };
              return res.status(200).json(record);
            }
            const projectDetails =
              await UserCommenService.getProjectFieldDetails(
                SITE_DB_NAME,
                projectId,
                fieldName,
              );

            if (projectDetails === "NA") {
              return res.status(200).json({
                success: false,
                msg: msg.msgCompanyFieldError,
                key: 5,
              });
            }

            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "project";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetProjectId =
              projectDetails._id || req.query.projectId || null;
            const { title, message } = msg.generateActivityCommenMessage(
              currentUser.name,
              checkProjectId.name,
              "",
              "UpdateProjectField",
            );
            const titles = title;
            const messages = message;
            const actionId = targetProjectId;
            const notiUserId = actorId;
            const notiOtherUserId = targetProjectId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgProjectFieldUpdatedSuccess,
              data: { projectField: projectDetails },
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in updateProjectField emp 5", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 5,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in updateProjectField emp 4", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 4,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateProjectField emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  createProjectLink: [
    body("projectId")
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),
    body("title")
      .trim()
      .exists()
      .withMessage(msg.msgProjectTitleIsReqired)
      .notEmpty()
      .withMessage(msg.msgProjectTitleIsReqired),
    body("link")
      .trim()
      .exists()
      .withMessage(msg.msgProjectLinkIsReqired)
      .notEmpty()
      .withMessage(msg.msgProjectLinkIsReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const {
              projectId,
              title,
              message,
              link,
              projectCategoryId,
              projectSubCategoryId,
              privacyPeopleIds,
              notifyIds,
              tagIds,
            } = data;
            const checkProjectId = await UserCommenService.checkProjectId(
              SITE_DB_NAME,
              projectId,
            );
            if (checkProjectId === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectIsNotExist,
              };
              return res.status(200).json(record);
            }
            try {
              const ProjectLinkData = {
                projectId,
                title,
                message,
                link,
                createdBy: userId,
                projectCategoryId,
                projectSubCategoryId,
                privacyPeopleIds,
                notifyIds,
                tagIds,
              };
              const createProjectLink =
                await UserCommenService.createProjectLink(
                  SITE_DB_NAME,
                  ProjectLinkData,
                );
              if (createProjectLink === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgProjectLinkError,
                  key: 5,
                };
                return res.status(200).json(record);
              }
              const projectLinkId = createProjectLink?._id;
              const projectLinkDetails = await UserCommenService.getProjectLink(
                SITE_DB_NAME,
                projectLinkId,
              );

              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const action = "project";
              const notificationOrActivity = 1;
              const actorId = userId;
              const targetProjectId =
                checkProjectId._id || req.body.projectId || null;
              const { title: activityTitle, message: activityMessage } =
                msg.generateActivityCommenMessage(
                  checkUserID.name,
                  projectLinkDetails?.title,
                  "",
                  "CreateProjectLink",
                );

              const titles = activityTitle;
              const messages = activityMessage;
              const actionId = targetProjectId;
              const notiUserId = actorId;
              const notiOtherUserId = targetProjectId;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];

              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }
              const record = {
                success: true,
                msg: msg.msgProjectLinkSuccess,
                data: { projectLink: projectLinkDetails },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in createProjectLink emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in createProjectLink emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createProjectLink emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in createProjectLink emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateProjectLink: [
    query("projectLinkId")
      .exists()
      .withMessage(msg.msgProjectLinkIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectLinkIDReqired),
    body("title")
      .trim()
      .exists()
      .withMessage(msg.msgProjectTitleIsReqired)
      .notEmpty()
      .withMessage(msg.msgProjectTitleIsReqired),
    body("link")
      .trim()
      .exists()
      .withMessage(msg.msgProjectLinkIsReqired)
      .notEmpty()
      .withMessage(msg.msgProjectLinkIsReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const data = req.body;
      const { projectLinkId } = req.query;
      try {
        const userId = req.CURRENT_USER_ID;
        const userName = req.CURRENT_USER?.name;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          const {
            title,
            message,
            link,
            projectCategoryId,
            projectSubCategoryId,
            privacyPeopleIds,
            notifyIds,
            tagIds,
          } = data;
          try {
            const checkProjectLinkId =
              await UserCommenService.checkProjectLinkId(
                SITE_DB_NAME,
                projectLinkId,
              );

            if (checkProjectLinkId === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectLinkIdNotExist,
              };
              return res.status(200).json(record);
            }
            const linkData = {
              title,
              message,
              link,
              projectCategoryId,
              projectSubCategoryId,
              privacyPeopleIds,
              notifyIds,
              tagIds,
            };

            const updateProjectLink = await UserCommenService.updateProjectLink(
              SITE_DB_NAME,
              checkProjectLinkId._id,
              linkData,
            );
            if (updateProjectLink === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectLinkUpdateError,
              };
              return res.status(200).json(record);
            }

            const projectLinkDetails = await UserCommenService.getProjectLink(
              SITE_DB_NAME,
              checkProjectLinkId._id,
            );
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "project";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetProjectId = checkProjectLinkId.projectId || null;
            const { title: activityTitle, message: activityMessage } =
              msg.generateActivityCommenMessage(
                userName,
                projectLinkDetails.title,
                "",
                "UpdateProjectLink",
              );

            const titles = activityTitle;
            const messages = activityMessage;
            const actionId = targetProjectId;
            const notiUserId = actorId;
            const notiOtherUserId = targetProjectId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgProjectUpdatedLinkSuccess,
              data: { projectLinkDetails: projectLinkDetails },
            };
            return res.status(200).json(record);
          } catch (error) {
            console.log("database error key 3", error);
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = { success: false, msg: msg.msgServerError, key: 1 };
        return res.status(500).json(record);
      }
    },
  ],

  getAllProjectLink: [
    query("projectId")
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),
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
      } else {
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        const userId = req.CURRENT_USER_ID;
        const roleName = req.CURRENT_USER?.roleName;
        const { projectId, deleteFlag } = req.query;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          if (!userId && userId === 0) {
            const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
            return res.status(200).json(record);
          } else {
            try {
              const checkUserID = await UserCommenService.checkUser(
                SITE_DB_NAME,
                userId,
              );
              if (checkUserID === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUserNotExist,
                  key: 2,
                };
                return res.status(200).json(record);
              }
              try {
                if (
                  roleName !== "Site-Owner" &&
                  roleName !== "Admin" &&
                  roleName !== "Member" &&
                  roleName !== "Client"
                ) {
                  const record = {
                    success: false,
                    msg: msg.msgPermissionDenied,
                    key: 3,
                  };
                  return res.status(200).json(record);
                }
                const checkProjectId = await UserCommenService.checkProjectId(
                  SITE_DB_NAME,
                  projectId,
                );
                if (checkProjectId === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgProjectIsNotExist,
                  };
                  return res.status(200).json(record);
                }
                try {
                  const pagination = {
                    pageSize: parseInt(req.query.pageSize) || 10,
                    pageNumber: parseInt(req.query.pageNumber) || 1,
                  };
                  const projectLinkDetails =
                    await UserCommenService.getAllProjectLink(
                      SITE_DB_NAME,
                      Number(deleteFlag),
                      checkProjectId?._id,
                      pagination,
                    );
                  if (projectLinkDetails === "NA") {
                    const record = {
                      success: true,
                      msg: msg.msgDataFound,
                      data: {
                        projectLinks: [],
                      },
                    };
                    return res.status(200).json(record);
                  }
                  const record = {
                    success: true,
                    msg: msg.msgDataFound,
                    data: {
                      projectLinks: projectLinkDetails,
                    },
                  };

                  return res.status(200).json(record);
                } catch (error) {
                  logger.error("Database error in getAllProjectLink emp 4", {
                    error,
                  });
                  const record = {
                    success: false,
                    msg: msg.msgServerError,
                    key: 4,
                  };
                  return res.status(500).json(record);
                }
              } catch (error) {
                logger.error("Database error in getAllProjectLink emp 3", {
                  error,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 3,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              logger.error("Database error in getAllProjectLink emp 2", {
                error,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 2,
              };
              return res.status(500).json(record);
            }
          }
        } catch (error) {
          logger.error("Database error in getAllProjectLink emp 1", {
            error,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 1,
          };
          return res.status(500).json(record);
        }
      }
    },
  ],

  deleteProjectLink: [
    query("projectLinkId")
      .exists()
      .withMessage(msg.msgProjectLinkIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectLinkIDReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { projectLinkId } = req.query;
          const checkProjectLink =
            await UserCommenService.checkDeleteProjectLink(
              SITE_DB_NAME,
              projectLinkId,
            );
          if (checkProjectLink === "NA") {
            const record = {
              success: false,
              msg: msg.msgProjectLinkIDIsNotExist,
              key: 4,
            };
            return res.status(200).json(record);
          }
          try {
            const projectLink = await UserCommenService.deleteProjectLink(
              SITE_DB_NAME,
              projectLinkId,
            );

            if (projectLink === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectLinkDeleteError,
                key: 3,
              };
              return res.status(200).json(record);
            }
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "project";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetProjectId = checkProjectLink.projectId || null;
            const { title, message } = msg.generateActivityCommenMessage(
              checkUserID.name,
              checkProjectLink?.title,
              "",
              "DeletedProjectLink",
            );
            const titles = title;
            const messages = message;
            const actionId = targetProjectId;
            const notiUserId = actorId;
            const notiOtherUserId = targetProjectId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }

            const record = {
              success: true,
              msg: msg.msgProjectLinkDeleteSuccess,
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in deleteProjectLink emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in deleteProjectLink emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in deleteProjectLink emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  createProjectMessage: [
    body("projectId")
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),
    body("title")
      .trim()
      .exists()
      .withMessage(msg.msgProjectMessageTitleIsReqired)
      .notEmpty()
      .withMessage(msg.msgProjectMessageTitleIsReqired),
    body("message")
      .trim()
      .exists()
      .withMessage(msg.msgProjectMessageFieldIsReqired)
      .notEmpty()
      .withMessage(msg.msgProjectMessageFieldIsReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const {
              projectId,
              title,
              message,
              projectCategoryId,
              projectSubCategoryId,
            } = data;

            const checkProjectId = await UserCommenService.checkProjectId(
              SITE_DB_NAME,
              projectId,
            );

            if (checkProjectId === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectIsNotExist,
              };
              return res.status(200).json(record);
            }
            try {
              let files = [];

              if (!req.file) {
                files = req?.files.map((file) => file?.key);
              } else if ("key" in req.file) {
                const filename = req.file.key;
                files = filename;
              } else {
                files = req.folderName + "/" + req.file.filename;
              }
              let privacyPeopleIds = data.privacyPeopleIds;
              let notifyIds = data.notifyIds;
              let tagIds = data.tagIds;
              if (typeof privacyPeopleIds === "string") {
                privacyPeopleIds = JSON.parse(privacyPeopleIds);
              }
              if (typeof notifyIds === "string") {
                notifyIds = JSON.parse(notifyIds);
              }
              if (typeof tagIds === "string") {
                tagIds = JSON.parse(tagIds);
              }
              const ProjectMessageData = {
                projectId: checkProjectId._id,
                title,
                message,
                createdBy: userId,
                projectCategoryId:
                  projectCategoryId && projectCategoryId !== ""
                    ? projectCategoryId
                    : null,

                projectSubCategoryId:
                  projectSubCategoryId && projectSubCategoryId !== ""
                    ? projectSubCategoryId
                    : null,

                privacyPeopleIds,
                notifyIds,
                files,
                tagIds,
              };

              const createProjectMessage =
                await UserCommenService.createProjectMessage(
                  SITE_DB_NAME,
                  ProjectMessageData,
                );
              if (createProjectMessage === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgProjectLinkError,
                  key: 5,
                };
                return res.status(200).json(record);
              }
              const projectMessageId = createProjectMessage?._id;
              const projectMessageDetails =
                await UserCommenService.getProjectMessage(
                  SITE_DB_NAME,
                  projectMessageId,
                );

              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const action = "project";
              const notificationOrActivity = 1;
              const actorId = userId;
              const targetProjectId = checkProjectId._id;
              const { title: activityTitle, message: activityMessage } =
                msg.generateActivityCommenMessage(
                  checkUserID.name,
                  projectMessageDetails?.title,
                  "",
                  "CreateProjectMessage",
                );

              const titles = activityTitle;
              const messages = activityMessage;
              const actionId = targetProjectId;
              const notiUserId = actorId;
              const notiOtherUserId = targetProjectId;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];

              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }
              const record = {
                success: true,
                msg: msg.msgProjectMessageSuccess,
                data: { projectMessage: projectMessageDetails },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in createProjectMessage emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in createProjectMessage emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createProjectLink emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in createProjectMessage emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  getAllProjectMessage: [
    query("projectId")
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),
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
      } else {
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        const userId = req.CURRENT_USER_ID;
        const { projectId, deleteFlag } = req.query;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          if (!userId && userId === 0) {
            const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
            return res.status(200).json(record);
          } else {
            try {
              const checkUserID = await UserCommenService.checkUser(
                SITE_DB_NAME,
                userId,
              );
              if (checkUserID === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUserNotExist,
                  key: 2,
                };
                return res.status(200).json(record);
              }
              try {
                const checkProjectId = await UserCommenService.checkProjectId(
                  SITE_DB_NAME,
                  projectId,
                );
                if (checkProjectId === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgProjectIsNotExist,
                  };
                  return res.status(200).json(record);
                }
                try {
                  const pagination = {
                    pageSize: parseInt(req.query.pageSize) || 10,
                    pageNumber: parseInt(req.query.pageNumber) || 1,
                  };
                  const search = req.query.search || "";
                  const projectMessageDetails =
                    await UserCommenService.getAllProjectMessage(
                      SITE_DB_NAME,
                      Number(deleteFlag),
                      checkProjectId?._id,
                      pagination,
                      search,
                    );
                  if (projectMessageDetails === "NA") {
                    const record = {
                      success: true,
                      msg: msg.msgDataFound,
                      data: {
                        projectMessages: [],
                      },
                    };
                    return res.status(200).json(record);
                  }
                  const record = {
                    success: true,
                    msg: msg.msgDataFound,
                    data: {
                      projectMessages: projectMessageDetails,
                    },
                  };

                  return res.status(200).json(record);
                } catch (error) {
                  logger.error("Database error in getAllProjectMessage emp 4", {
                    error,
                  });
                  const record = {
                    success: false,
                    msg: msg.msgServerError,
                    key: 4,
                  };
                  return res.status(500).json(record);
                }
              } catch (error) {
                logger.error("Database error in getAllProjectMessage emp 3", {
                  error,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 3,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              logger.error("Database error in getAllProjectMessage emp 2", {
                error,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 2,
              };
              return res.status(500).json(record);
            }
          }
        } catch (error) {
          logger.error("Database error in getAllProjectMessage emp 1", {
            error,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 1,
          };
          return res.status(500).json(record);
        }
      }
    },
  ],

  updateProjectMessage: [
    query("projectMessageId")
      .exists()
      .withMessage(msg.msgProjectMessageIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectMessageIDReqired),
    body("title")
      .trim()
      .exists()
      .withMessage(msg.msgProjectTitleIsReqired)
      .notEmpty()
      .withMessage(msg.msgProjectTitleIsReqired),
    body("message")
      .trim()
      .exists()
      .withMessage(msg.msgProjectMessageIsReqired)
      .notEmpty()
      .withMessage(msg.msgProjectMessageIsReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const data = req.body;
      const { projectMessageId } = req.query;
      try {
        const userId = req.CURRENT_USER_ID;
        const userName = req.CURRENT_USER?.name;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          const { title, message, projectCategoryId, projectSubCategoryId } =
            data;
          try {
            const checkProjectMessageId =
              await UserCommenService.checkProjectMessageId(
                SITE_DB_NAME,
                projectMessageId,
              );

            if (checkProjectMessageId === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectMessageIdNotExist,
              };
              return res.status(200).json(record);
            }
            // ---------- uploaded files ----------
            let uploadedFiles = [];
            if (Array.isArray(req.files) && req.files.length > 0) {
              uploadedFiles = req.files.map((f) => f.key).filter(Boolean);
            } else if (req.file?.key) {
              uploadedFiles = [req.file.key];
            }

            // ---------- parse existingFiles ONLY from client ----------
            let existingFilesArr = [];

            if (typeof data.existingFiles !== "undefined") {
              if (Array.isArray(data.existingFiles)) {
                existingFilesArr = data.existingFiles;
              } else if (typeof data.existingFiles === "string") {
                try {
                  existingFilesArr = JSON.parse(data.existingFiles);
                } catch (e) {
                  existingFilesArr = [data.existingFiles];
                }
              }
            }

            // ---------- FINAL FILES (NO DB MERGE EVER) ----------
            let finalFiles = [];

            if (existingFilesArr.length > 0 && uploadedFiles.length > 0) {
              finalFiles = [...existingFilesArr, ...uploadedFiles];
            } else if (existingFilesArr.length > 0) {
              finalFiles = existingFilesArr;
            } else if (uploadedFiles.length > 0) {
              finalFiles = uploadedFiles;
            } else {
              finalFiles = []; // client ne kuch nahi bheja → empty
            }

            let privacyPeopleIds = data.privacyPeopleIds;
            let notifyIds = data.notifyIds;
            let tagIds = data.tagIds;
            if (typeof privacyPeopleIds === "string") {
              privacyPeopleIds = JSON.parse(privacyPeopleIds);
            }
            if (typeof notifyIds === "string") {
              notifyIds = JSON.parse(notifyIds);
            }
            if (typeof tagIds === "string") {
              tagIds = JSON.parse(tagIds);
            }

            let safeProjectCategoryId = projectCategoryId;
            let safeProjectSubCategoryId = projectSubCategoryId;

            // "" ya undefined ho to null bana do
            if (!safeProjectCategoryId || safeProjectCategoryId === "") {
              safeProjectCategoryId = null;
            }
            if (!safeProjectSubCategoryId || safeProjectSubCategoryId === "") {
              safeProjectSubCategoryId = null;
            }

            const messageData = {
              title,
              message,
              projectCategoryId: safeProjectCategoryId,
              projectSubCategoryId: safeProjectSubCategoryId,
              privacyPeopleIds,
              notifyIds,
              tagIds,
              files: finalFiles,
            };

            const updateProjectMessage =
              await UserCommenService.updateProjectMessage(
                SITE_DB_NAME,
                checkProjectMessageId._id,
                messageData,
              );
            if (updateProjectMessage === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectMessageUpdateError,
              };
              return res.status(200).json(record);
            }

            const projectMessageDetails =
              await UserCommenService.getProjectMessage(
                SITE_DB_NAME,
                checkProjectMessageId._id,
              );
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "project";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetProjectId = checkProjectMessageId.projectId || null;
            const { title: activityTitle, message: activityMessage } =
              msg.generateActivityCommenMessage(
                userName,
                projectMessageDetails.title,
                "",
                "UpdateProjectMessage",
              );

            const titles = activityTitle;
            const messages = activityMessage;
            const actionId = targetProjectId;
            const notiUserId = actorId;
            const notiOtherUserId = targetProjectId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgProjectUpdatedMessageSuccess,
              data: { projectMessageDetails: projectMessageDetails },
            };
            return res.status(200).json(record);
          } catch (error) {
            console.log("database error key 3", error);
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = { success: false, msg: msg.msgServerError, key: 1 };
        return res.status(500).json(record);
      }
    },
  ],

  updateProjectMessageField: [
    query("projectMessageId")
      .exists()
      .withMessage(msg.msgProjectMessageIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectMessageIDReqired),

    body("fieldName")
      .trim()
      .exists()
      .withMessage(msg.msgFieldNameReqired)
      .notEmpty()
      .withMessage(msg.msgFieldNameReqired),

    body("value").exists().withMessage(msg.msgFieldValueReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(200).json({
          success: false,
          msg: errors.array()[0].msg,
        });
      }

      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const CURRENT_USER_ID = req.CURRENT_USER_ID;
      const CURRENT_USER = req.CURRENT_USER;

      if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
        return res.status(200).json({
          success: false,
          msg: msg.msgDBNotIdentified,
          key: 1,
        });
      }

      let { fieldName, value } = req.body;
      const { projectMessageId } = req.query;

      try {
        const checkProjectMessage =
          await UserCommenService.checkProjectMessageId(
            SITE_DB_NAME,
            projectMessageId,
          );

        if (checkProjectMessage === "NA") {
          return res.status(200).json({
            success: false,
            msg: msg.msgProjectMessageIdNotExist,
          });
        }

        /*  only schema allowed fields */
        const allowedFields = [
          "title",
          "message",
          "projectCategoryId",
          "projectSubCategoryId",
          "privacyPeopleIds",
          "notifyIds",
          "files",
          "tagIds",
          "activeFlag",
          "deleteFlag",
        ];

        if (!allowedFields.includes(fieldName)) {
          return res.status(200).json({
            success: false,
            msg: "Invalid field name",
          });
        }

        /*  parse array type fields */
        if (["privacyPeopleIds", "notifyIds", "tagIds"].includes(fieldName)) {
          try {
            if (typeof value === "string") value = JSON.parse(value);
          } catch (err) {
            return res.status(200).json({
              success: false,
              msg: `Invalid JSON for ${fieldName}`,
            });
          }
        }

        let projectMessageData = {};

        /*  files handling */
        if (fieldName === "files") {
          let newFiles = [];

          if (req?.files?.length > 0) {
            newFiles = req.files.map((file) => file.key);
          } else if (req.file?.key) {
            newFiles = [req.file.key];
          } else if ("folderName" in req && req.file) {
            newFiles = [req.folderName + "/" + req.file.filename];
          }

          const oldFiles = checkProjectMessage.files || [];
          projectMessageData[fieldName] = [...oldFiles, ...newFiles];
        } else {
          projectMessageData[fieldName] = value;
        }

        const updateProjectMessage =
          await UserCommenService.updateProjectMessage(
            SITE_DB_NAME,
            checkProjectMessage._id,
            projectMessageData,
          );

        if (updateProjectMessage === "NA") {
          return res.status(200).json({
            success: false,
            msg: msg.msgProjectMessageUpdateError,
            key: 2,
          });
        }

        const projectMessageDetails = await UserCommenService.getProjectMessage(
          SITE_DB_NAME,
          checkProjectMessage._id,
        );

        /*  activity + notification (same as before) */
        const APP_LOGO = process.env.APP_LOGO || "";
        const APP_SITE_URL = process.env.SITE_URL || "";
        const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";

        const action = "project";
        const notificationOrActivity = 1;
        const actorId = CURRENT_USER_ID;
        const targetProjectId = checkProjectMessage.projectId || null;

        const { title, message } = msg.generateActivityCommenMessage(
          CURRENT_USER.name,
          projectMessageDetails.title,
          "",
          "UpdateProjectMessage",
        );

        const actionJson = {
          actionId: targetProjectId,
          action: action,
          option: {
            logoUrl: APP_LOGO,
            redirectionUrl: {
              webLink: APP_SITE_URL,
              deepLink: APP_DEEP_LINK_URL,
            },
            imageUrl: "",
            soundFile: "",
          },
          appType: "customer",
        };

        let notificationArr = [];

        const notification = await oneSignalHelperUser.getNotificationArrSingle(
          SITE_DB_NAME,
          actorId,
          targetProjectId,
          action,
          targetProjectId,
          title,
          message,
          actionJson,
          notificationOrActivity,
        );

        if (notification !== "NA") notificationArr.push(notification);

        if (notificationArr.length > 0) {
          await oneSignalHelperUser.oneSignalNotificationSendCall(
            notificationArr,
          );
        }

        return res.status(200).json({
          success: true,
          msg: msg.msgProjectUpdatedMessageSuccess,
          data: { projectMessageDetails },
        });
      } catch (error) {
        logger.error("Database error in updateProjectMessageField", {
          error: error.message,
        });
        return res.status(500).json({
          success: false,
          msg: msg.msgServerError,
          key: 500,
        });
      }
    },
  ],

  deleteProjectMessage: [
    query("projectMessageId")
      .exists()
      .withMessage(msg.msgProjectMessageIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectLinkIDReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { projectMessageId } = req.query;
          const checkProjectMessageId =
            await UserCommenService.checkDeleteProjectMessageId(
              SITE_DB_NAME,
              projectMessageId,
            );
          if (checkProjectMessageId === "NA") {
            const record = {
              success: false,
              msg: msg.msgProjectMessageIdNotExist,
              key: 4,
            };
            return res.status(200).json(record);
          }
          try {
            const projectMessage = await UserCommenService.deleteProjectMessage(
              SITE_DB_NAME,
              projectMessageId,
            );

            if (projectMessage === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectMessageDeleteError,
                key: 3,
              };
              return res.status(200).json(record);
            }
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "project";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetProjectId = checkProjectMessageId.projectId || null;
            const { title, message } = msg.generateActivityCommenMessage(
              checkUserID.name,
              checkProjectMessageId?.title,
              "",
              "DeletedProjectMessage",
            );
            const titles = title;
            const messages = message;
            const actionId = targetProjectId;
            const notiUserId = actorId;
            const notiOtherUserId = targetProjectId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }

            const record = {
              success: true,
              msg: msg.msgProjectMessageDeleteSuccess,
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in deleteProjectMessage emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in deleteProjectMessage emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in deleteProjectMessage emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  createProjectFiles: [
    body("projectId")
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }

      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUserNotExist });
      }

      const data = req.body;

      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgUserNotExist, key: 1 });
        }

        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgUserNotExist, key: 2 });
        }

        const { projectId, projectCategoryId, projectSubCategoryId, message } =
          data;

        const checkProjectId = await UserCommenService.checkProjectId(
          SITE_DB_NAME,
          projectId,
        );
        if (checkProjectId === "NA") {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgProjectIsNotExist });
        }

        const uploadedFiles =
          Array.isArray(req.files) && req.files.length ? req.files : [];
        if (uploadedFiles.length === 0) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgProjectFileIsReqired });
        }

        // parse JSON string fields
        let privacyPeopleIds = data.privacyPeopleIds || [];
        let notifyIds = data.notifyIds || [];
        try {
          if (
            typeof privacyPeopleIds === "string" &&
            privacyPeopleIds.trim() !== ""
          )
            privacyPeopleIds = JSON.parse(privacyPeopleIds);
        } catch {
          privacyPeopleIds = [];
        }
        try {
          if (typeof notifyIds === "string" && notifyIds.trim() !== "")
            notifyIds = JSON.parse(notifyIds);
        } catch {
          notifyIds = [];
        }

        // --- Build documents for each file
        const docsToInsert = uploadedFiles.map((file) => {
          // File path
          let filePath =
            file.key ||
            file.location ||
            file.path ||
            (req.folderName ? req.folderName + "/" : "") + file.filename ||
            file.originalname;

          // File size & human-readable
          const readableSize = CommenFunction.formatFileSize(file.size || 0);

          // Extension
          const ext = path
            .extname(file.originalname || file.filename || "")
            .replace(".", "");

          // File type descriptive
          // const fileType = CommenFunction.getFileTypeDescription(
          //   ext,
          //   file.mimetype
          // );
          const fileTypeInfo = CommenFunction.getFileTypeDescription(
            ext,
            file.mimetype,
          );

          // Title
          const titleForFile =
            data.title && data.title.trim() !== ""
              ? data.title
              : file.originalname || file.filename || "Untitled";

          return {
            title: titleForFile,
            file: filePath,
            fileType: fileTypeInfo.type,
            fileSize: readableSize,
            projectId: checkProjectId._id,
            message,
            createdBy: userId,
            projectCategoryId: projectCategoryId || null,
            projectSubCategoryId: projectSubCategoryId || null,
            privacyPeopleIds,
            notifyIds,
          };
        });

        // Bulk insert
        const createdFiles = await UserCommenService.createProjectFilesBulk(
          SITE_DB_NAME,
          docsToInsert,
        );

        if (
          !createdFiles ||
          createdFiles === "NA" ||
          createdFiles.length === 0
        ) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgProjecFileError, key: 5 });
        }

        // Send notifications per file
        for (const createdFile of createdFiles) {
          try {
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "project";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetProjectId = checkProjectId._id;

            const { title: activityTitle, message: activityMessage } =
              msg.generateActivityCommenMessage(
                checkUserID.name,
                createdFile.title,
                "",
                "CreateProjectFile",
              );

            const actionId = targetProjectId;
            const notiUserId = actorId;
            const notiOtherUserId = targetProjectId;
            const actionJson = {
              actionId,
              action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                activityTitle,
                activityMessage,
                actionJson,
                notificationOrActivity,
              );

            if (notification && notification !== "NA") {
              await oneSignalHelperUser.oneSignalNotificationSendCall([
                notification,
              ]);
            }
          } catch (notifErr) {
            logger.error(
              "Notification error for project file: " + createdFile._id,
              { error: notifErr.message },
            );
          }
        }

        return res.status(200).json({
          success: true,
          msg: msg.msgProjectFileSuccess,
          data: { projectFiles: createdFiles },
        });
      } catch (error) {
        logger.error("Database error in createProjectFiles main catch", {
          error: error.message,
        });
        return res
          .status(500)
          .json({ success: false, msg: msg.msgServerError, key: 1 });
      }
    },
  ],

  getAllProjectFiles: [
    query("projectId")
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),
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
      } else {
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        const userId = req.CURRENT_USER_ID;
        const { projectId, deleteFlag } = req.query;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          if (!userId && userId === 0) {
            const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
            return res.status(200).json(record);
          } else {
            try {
              const checkUserID = await UserCommenService.checkUser(
                SITE_DB_NAME,
                userId,
              );
              if (checkUserID === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUserNotExist,
                  key: 2,
                };
                return res.status(200).json(record);
              }
              try {
                const checkProjectId = await UserCommenService.checkProjectId(
                  SITE_DB_NAME,
                  projectId,
                );
                if (checkProjectId === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgProjectIsNotExist,
                  };
                  return res.status(200).json(record);
                }
                try {
                  const pagination = {
                    pageSize: parseInt(req.query.pageSize) || 10,
                    pageNumber: parseInt(req.query.pageNumber) || 1,
                  };
                  const projectFileDetails =
                    await UserCommenService.getAllProjectFiles(
                      SITE_DB_NAME,
                      Number(deleteFlag),
                      checkProjectId?._id,
                      pagination,
                    );
                  if (projectFileDetails === "NA") {
                    const record = {
                      success: true,
                      msg: msg.msgDataFound,
                      data: {
                        projectFiles: [],
                      },
                    };
                    return res.status(200).json(record);
                  }
                  const record = {
                    success: true,
                    msg: msg.msgDataFound,
                    data: {
                      projectFiles: projectFileDetails,
                    },
                  };

                  return res.status(200).json(record);
                } catch (error) {
                  logger.error("Database error in getAllProjectFiles emp 4", {
                    error,
                  });
                  const record = {
                    success: false,
                    msg: msg.msgServerError,
                    key: 4,
                  };
                  return res.status(500).json(record);
                }
              } catch (error) {
                logger.error("Database error in getAllProjectFiles emp 3", {
                  error,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 3,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              logger.error("Database error in getAllProjectFiles emp 2", {
                error,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 2,
              };
              return res.status(500).json(record);
            }
          }
        } catch (error) {
          logger.error("Database error in getAllProjectMessage emp 1", {
            error,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 1,
          };
          return res.status(500).json(record);
        }
      }
    },
  ],

  updateProjectFile: [
    query("projectFileId")
      .exists()
      .withMessage(msg.msgProjectFileIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectFileIDReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const data = req.body;
      const { projectFileId } = req.query;
      try {
        const userId = req.CURRENT_USER_ID;
        const userName = req.CURRENT_USER?.name;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          try {
            const checkProjectFileId =
              await UserCommenService.checkProjectFileId(
                SITE_DB_NAME,
                projectFileId,
              );

            if (checkProjectFileId === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectFileIdNotExist,
              };
              return res.status(200).json(record);
            }

            const uploadedFile = req.file ?? null;

            // agar file hi nahi ayi, toh purani file rakho
            let filePath = checkProjectFileId.file;
            let fileType = checkProjectFileId.fileType;
            let fileSize = checkProjectFileId.fileSize;

            // agar file aayi hai tabhi update karna
            if (uploadedFile) {
              if ("key" in uploadedFile) {
                filePath = uploadedFile.key; // AWS S3 key
              } else if (uploadedFile.filename) {
                filePath = req.folderName + "/" + uploadedFile.filename;
              }
              const readableSize = CommenFunction.formatFileSize(
                uploadedFile.size || 0,
              );
              const ext = path
                .extname(
                  uploadedFile.originalname || uploadedFile.filename || "",
                )
                .replace(".", "");
              const fileTypeDesc = CommenFunction.getFileTypeDescription(
                ext,
                uploadedFile.mimetype,
              );

              fileType = fileTypeDesc.type;
              fileSize = readableSize;
            }
            const titleForFile =
              data.title && data.title.trim() !== ""
                ? data.title
                : uploadedFile?.originalname ||
                  uploadedFile?.filename ||
                  checkProjectFileId.title ||
                  "Untitled";
            const fileData = {
              title: titleForFile,
              file: filePath,
              fileType: fileType,
              fileSize: fileSize,
            };
            const updateProjectFile = await UserCommenService.updateProjectFile(
              SITE_DB_NAME,
              checkProjectFileId._id,
              fileData,
            );

            if (updateProjectFile === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectFileUpdateError,
              };
              return res.status(200).json(record);
            }

            const projectFileDetails = await UserCommenService.getProjectFile(
              SITE_DB_NAME,
              checkProjectFileId._id,
            );
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "project";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetProjectId = checkProjectFileId.projectId || null;
            const { title: activityTitle, message: activityMessage } =
              msg.generateActivityCommenMessage(
                userName,
                projectFileDetails.title,
                "",
                "UpdateProjectFile",
              );

            const titles = activityTitle;
            const messages = activityMessage;
            const actionId = targetProjectId;
            const notiUserId = actorId;
            const notiOtherUserId = targetProjectId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgProjectUpdatedFileSuccess,
              data: { projectFiles: projectFileDetails },
            };
            return res.status(200).json(record);
          } catch (error) {
            console.log("database error key 3", error);
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = { success: false, msg: msg.msgServerError, key: 1 };
        return res.status(500).json(record);
      }
    },
  ],

  updateProjectFileField: [
    query("projectFileId")
      .exists()
      .withMessage(msg.msgProjectFileIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectFileIDReqired),
    body("fieldName")
      .trim()
      .exists()
      .withMessage(msg.msgFieldNameReqired)
      .notEmpty()
      .withMessage(msg.msgFieldNameReqired),

    body("value").exists().withMessage(msg.msgFieldValueReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      let { fieldName, value } = req.body;
      const { projectFileId } = req.query;
      try {
        const userId = req.CURRENT_USER_ID;
        const currentUser = req.CURRENT_USER;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkProjectFileId = await UserCommenService.checkProjectFileId(
            SITE_DB_NAME,
            projectFileId,
          );

          if (checkProjectFileId === "NA") {
            const record = {
              success: false,
              msg: msg.msgProjectFileIdNotExist,
            };
            return res.status(200).json(record);
          }
          try {
            const projectFileData = {
              [fieldName]: value,
            };

            const updateProjectFileDetails =
              await UserCommenService.updateProjectFile(
                SITE_DB_NAME,
                checkProjectFileId?._id,
                projectFileData,
              );
            if (updateProjectFileDetails === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectFileUpdateError,
                key: 5,
              };
              return res.status(200).json(record);
            }
            const projectFileDetails =
              await UserCommenService.getProjectFileFieldDetails(
                SITE_DB_NAME,
                checkProjectFileId?._id,
                fieldName,
              );

            if (projectFileDetails === "NA") {
              return res.status(200).json({
                success: false,
                msg: msg.msgProjecFileError,
                key: 5,
              });
            }

            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "project";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetProjectId = checkProjectFileId.projectId || null;
            const { title, message } = msg.generateActivityCommenMessage(
              currentUser.name,
              checkProjectFileId.title,
              "",
              "UpdateProjectFile",
            );
            const titles = title;
            const messages = message;
            const actionId = targetProjectId;
            const notiUserId = actorId;
            const notiOtherUserId = targetProjectId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgProjectUpdatedFileSuccess,
              data: { projectFile: projectFileDetails },
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in updateProjectFileField emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in updateProjectFileField emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateProjectFileField emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateProjectFileDetails: [
    query("projectFileId")
      .exists()
      .withMessage(msg.msgProjectFileIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectFileIDReqired),
    body("title")
      .trim()
      .exists()
      .withMessage(msg.msgProjectFileTitleIsReqired)
      .notEmpty()
      .withMessage(msg.msgProjectFileTitleIsReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const data = req.body;
      const { projectFileId } = req.query;
      try {
        const userId = req.CURRENT_USER_ID;
        const userName = req.CURRENT_USER?.name;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          const { title, message, projectCategoryId, projectSubCategoryId } =
            data;
          try {
            const checkProjectFileId =
              await UserCommenService.checkProjectFileId(
                SITE_DB_NAME,
                projectFileId,
              );

            if (checkProjectFileId === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectFileIdNotExist,
              };
              return res.status(200).json(record);
            }

            const isValidObjectId = (id) =>
              id && mongoose.Types.ObjectId.isValid(id) ? id : null;

            const parseArray = (val) => {
              try {
                if (Array.isArray(val)) return val;
                if (typeof val === "string" && val.trim() !== "")
                  return JSON.parse(val);
              } catch {}
              return [];
            };

            // ✅ usage
            const safeProjectCategoryId = isValidObjectId(projectCategoryId);
            const safeProjectSubCategoryId =
              isValidObjectId(projectSubCategoryId);

            const notifyIds = parseArray(data.notifyIds);
            const privacyPeopleIds = parseArray(data.privacyPeopleIds);
            const fileData = {
              title,
              message,
              projectCategoryId: safeProjectCategoryId,
              projectSubCategoryId: safeProjectSubCategoryId,
              notifyIds,
              privacyPeopleIds,
            };

            const updateProjectFile = await UserCommenService.updateProjectFile(
              SITE_DB_NAME,
              checkProjectFileId._id,
              fileData,
            );
            if (updateProjectFile === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectFileUpdateError,
              };
              return res.status(200).json(record);
            }

            const projectFileDetails = await UserCommenService.getProjectFile(
              SITE_DB_NAME,
              checkProjectFileId._id,
            );
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "project";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetProjectId = checkProjectFileId.projectId || null;
            const { title: activityTitle, message: activityMessage } =
              msg.generateActivityCommenMessage(
                userName,
                projectFileDetails.title,
                "",
                "UpdateProjectFile",
              );

            const titles = activityTitle;
            const messages = activityMessage;
            const actionId = targetProjectId;
            const notiUserId = actorId;
            const notiOtherUserId = targetProjectId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgProjectUpdatedFileSuccess,
              data: { projectFile: projectFileDetails },
            };
            return res.status(200).json(record);
          } catch (error) {
            console.log("database error key 3", error);
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = { success: false, msg: msg.msgServerError, key: 1 };
        return res.status(500).json(record);
      }
    },
  ],

  deleteProjectFile: [
    query("projectFileId")
      .exists()
      .withMessage(msg.msgProjectFileIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectFileIDReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { projectFileId } = req.query;
          const checkProjectFileId = await UserCommenService.checkProjectFileId(
            SITE_DB_NAME,
            projectFileId,
          );

          if (checkProjectFileId === "NA") {
            const record = {
              success: false,
              msg: msg.msgProjectFileIdNotExist,
            };
            return res.status(200).json(record);
          }
          try {
            const projectFile = await UserCommenService.deleteProjectFile(
              SITE_DB_NAME,
              checkProjectFileId._id,
            );

            if (projectFile === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectFileDeleteError,
                key: 3,
              };
              return res.status(200).json(record);
            }
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "project";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetProjectId = checkProjectFileId.projectId || null;
            const { title, message } = msg.generateActivityCommenMessage(
              checkUserID.name,
              checkProjectFileId?.title,
              "",
              "DeletedProjectFile",
            );
            const titles = title;
            const messages = message;
            const actionId = targetProjectId;
            const notiUserId = actorId;
            const notiOtherUserId = targetProjectId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }

            const record = {
              success: true,
              msg: msg.msgProjectFileDeleteSuccess,
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in deleteProjectFile emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in deleteProjectFile emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in deleteProjectFile emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  createProof: [
    body("proofName")
      .exists()
      .withMessage(msg.msgProofNameIsReqired)
      .notEmpty()
      .withMessage(msg.msgProofNameIsReqired),
    body("entityType")
      .trim()
      .exists()
      .withMessage(msg.msgProofEntityTypeIsReqired)
      .notEmpty()
      .withMessage(msg.msgProofEntityTypeIsReqired),
    body("entityId")
      .trim()
      .exists()
      .withMessage(msg.msgProofEntityIdIsReqired)
      .notEmpty()
      .withMessage(msg.msgProofEntityIdIsReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const {
              proofName,
              entityType,
              entityId,
              dueDate,
              link,
              description,
            } = data;

            let checkEntity = null;
            let errorMsg = "";

            if (entityType === "Project") {
              checkEntity = await UserCommenService.checkProjectId(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgProjectIsNotExist;
            } else if (entityType === "Task") {
              checkEntity = await UserCommenService.checkTask(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgTaskIsNotExist;
            } else if (entityType === "Message") {
              checkEntity = await UserCommenService.checkProjectMessageId(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgMessageIsNotExist;
            } else if (entityType === "Company") {
              checkEntity = await UserCommenService.checkCompany(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgCompanyIsNotExist;
            } else {
              const record = {
                success: false,
                msg: msg.msgInvalidEntityType,
              };
              return res.status(200).json(record);
            }

            if (checkEntity === "NA") {
              const record = {
                success: false,
                msg: errorMsg,
              };
              return res.status(200).json(record);
            }
            try {
              if (!req.file) {
                return res.status(400).json({
                  success: false,
                  msg: msg.msgProofFileIsReqired,
                });
              }
              let file = null;

              if ("key" in req.file) {
                const filename = req.file.key;
                file = filename;
              } else {
                file = req.folderName + "/" + req.file.filename;
              }

              let { reviewers } = req.body;
              if (typeof reviewers === "string") {
                reviewers = JSON.parse(reviewers);
              }
              const proofData = {
                entityId: checkEntity._id,
                entityType,
                proofName,
                dueDate,
                file,
                link,
                description,
                reviewers,
                createdBy: userId,
              };

              const createProof = await UserCommenService.createProof(
                SITE_DB_NAME,
                proofData,
              );
              if (createProof === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgProofError,
                  key: 5,
                };
                return res.status(200).json(record);
              }
              const projectProofId = createProof?._id;
              const proofDetails = await UserCommenService.getProof(
                SITE_DB_NAME,
                projectProofId,
              );

              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const action = "proof";
              const notificationOrActivity = 1;
              const actorId = userId;
              const targetId = createProof?._id;
              const { title: activityTitle, message: activityMessage } =
                msg.generateActivityCommenMessage(
                  checkUserID.name,
                  proofDetails?.proofName,
                  "",
                  "CreateProof",
                );

              const titles = activityTitle;
              const messages = activityMessage;
              const actionId = targetId;
              const notiUserId = actorId;
              const notiOtherUserId = targetId;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];

              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }
              const record = {
                success: true,
                msg: msg.msgProofSuccess,
                data: { proof: proofDetails },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in createProof emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in createProof emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createProof emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in createProof emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateProof: [
    query("proofId")
      .exists()
      .withMessage(msg.msgProofIDReqired)
      .notEmpty()
      .withMessage(msg.msgProofIDReqired),
    body("proofName")
      .exists()
      .withMessage(msg.msgProofNameIsReqired)
      .notEmpty()
      .withMessage(msg.msgProofNameIsReqired),
    body("entityType")
      .trim()
      .exists()
      .withMessage(msg.msgProofEntityTypeIsReqired)
      .notEmpty()
      .withMessage(msg.msgProofEntityTypeIsReqired),
    body("entityId")
      .trim()
      .exists()
      .withMessage(msg.msgProofEntityIdIsReqired)
      .notEmpty()
      .withMessage(msg.msgProofEntityIdIsReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const data = req.body;
      const { proofId } = req.query;
      try {
        const userId = req.CURRENT_USER_ID;
        const userName = req.CURRENT_USER?.name;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          const {
            proofName,
            entityType,
            entityId,
            dueDate,
            link,
            description,
          } = data;
          try {
            const checkProofId = await UserCommenService.checkProofId(
              SITE_DB_NAME,
              proofId,
            );

            if (checkProofId === "NA") {
              const record = {
                success: false,
                msg: msg.msgProofIdNotExist,
              };
              return res.status(200).json(record);
            }

            let checkEntity = null;
            let errorMsg = "";

            if (entityType === "Project") {
              checkEntity = await UserCommenService.checkProjectId(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgProjectIsNotExist;
            } else if (entityType === "Task") {
              checkEntity = await UserCommenService.checkTask(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgTaskIsNotExist;
            } else if (entityType === "Message") {
              checkEntity = await UserCommenService.checkProjectMessageId(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgMessageIsNotExist;
            } else if (entityType === "Company") {
              checkEntity = await UserCommenService.checkCompany(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgCompanyIsNotExist;
            } else {
              const record = {
                success: false,
                msg: msg.msgInvalidEntityType,
              };
              return res.status(200).json(record);
            }

            if (checkEntity === "NA") {
              const record = {
                success: false,
                msg: errorMsg,
              };
              return res.status(200).json(record);
            }

            let file = null;
            if (!req.file) {
              file = checkProofId.file;
            } else if ("key" in req.file) {
              const filename = req.file.key;
              file = filename;
            } else {
              file = req.folderName + "/" + req.file.filename;
            }

            let { reviewers } = req.body;
            if (typeof reviewers === "string") {
              reviewers = JSON.parse(reviewers);
            }

            const proofData = {
              entityId: checkEntity._id,
              entityType,
              proofName,
              dueDate,
              file,
              link,
              description,
              reviewers,
            };

            const updateProof = await UserCommenService.updateProof(
              SITE_DB_NAME,
              checkProofId._id,
              proofData,
            );
            if (updateProof === "NA") {
              const record = {
                success: false,
                msg: msg.msgProofUpdateError,
              };
              return res.status(200).json(record);
            }

            const proofDetails = await UserCommenService.getProof(
              SITE_DB_NAME,
              checkProofId._id,
            );
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "proof";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetId = checkProofId._id || req.query.proofId || null;
            const { title: activityTitle, message: activityMessage } =
              msg.generateActivityCommenMessage(
                userName,
                proofDetails.proofName,
                "",
                "UpdateProof",
              );

            const titles = activityTitle;
            const messages = activityMessage;
            const actionId = targetId;
            const notiUserId = actorId;
            const notiOtherUserId = targetId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgProofUpdatedSuccess,
              data: { proof: proofDetails },
            };
            return res.status(200).json(record);
          } catch (error) {
            console.log("database error key 3", error);
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = { success: false, msg: msg.msgServerError, key: 1 };
        return res.status(500).json(record);
      }
    },
  ],

  deleteProof: [
    query("proofId")
      .exists()
      .withMessage(msg.msgProofIDReqired)
      .notEmpty()
      .withMessage(msg.msgProofIDReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { proofId } = req.query;
          const checkProofId = await UserCommenService.checkDeleteProofId(
            SITE_DB_NAME,
            proofId,
          );
          if (checkProofId === "NA") {
            const record = {
              success: false,
              msg: msg.msgProofIdNotExist,
              key: 4,
            };
            return res.status(200).json(record);
          }
          try {
            const proof = await UserCommenService.deleteProof(
              SITE_DB_NAME,
              checkProofId._id,
            );

            if (proof === "NA") {
              const record = {
                success: false,
                msg: msg.msgProofDeleteError,
                key: 3,
              };
              return res.status(200).json(record);
            }
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "proof";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetId = checkProofId._id || req.query.proofId || null;
            const { title, message } = msg.generateActivityCommenMessage(
              checkUserID.name,
              checkProofId?.proofName,
              "",
              "DeletedProof",
            );
            const titles = title;
            const messages = message;
            const actionId = targetId;
            const notiUserId = actorId;
            const notiOtherUserId = targetId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }

            const record = {
              success: true,
              msg: msg.msgProofDeleteSuccess,
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in deleteProof emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in deleteProof emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in deleteProof emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  getAllProof: [
    query("entityId")
      .exists()
      .withMessage(msg.msgProofEntityIdIsReqired)
      .notEmpty()
      .withMessage(msg.msgProofEntityIdIsReqired),
    query("entityType")
      .exists()
      .withMessage(msg.msgProofEntityTypeIsReqired)
      .notEmpty()
      .withMessage(msg.msgProofEntityTypeIsReqired),
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
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const userId = req.CURRENT_USER_ID;
      const roleName = req.CURRENT_USER?.roleName;
      const { entityId, entityType, deleteFlag } = req.query;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            if (
              roleName !== "Site-Owner" &&
              roleName !== "Admin" &&
              roleName !== "Member" &&
              roleName !== "Client"
            ) {
              const record = {
                success: false,
                msg: msg.msgPermissionDenied,
                key: 3,
              };
              return res.status(200).json(record);
            }
            let checkEntity = null;
            let errorMsg = "";

            if (entityType === "Project") {
              checkEntity = await UserCommenService.checkProjectId(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgProjectIsNotExist;
            } else if (entityType === "Task") {
              checkEntity = await UserCommenService.checkTask(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgTaskIsNotExist;
            } else if (entityType === "Message") {
              checkEntity = await UserCommenService.checkProjectMessageId(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgMessageIsNotExist;
            } else if (entityType === "Company") {
              checkEntity = await UserCommenService.checkCompany(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgCompanyIsNotExist;
            } else {
              const record = {
                success: false,
                msg: msg.msgInvalidEntityType,
              };
              return res.status(200).json(record);
            }

            if (checkEntity === "NA") {
              const record = {
                success: false,
                msg: errorMsg,
              };
              return res.status(200).json(record);
            }
            try {
              const pagination = {
                pageSize: parseInt(req.query.pageSize) || 10,
                pageNumber: parseInt(req.query.pageNumber) || 1,
              };
              const search = req.query.search || "";
              const proofDetails = await UserCommenService.getAllProof(
                SITE_DB_NAME,
                Number(deleteFlag),
                checkEntity?._id,
                entityType,
                pagination,
                search,
              );
              if (proofDetails === "NA") {
                const record = {
                  success: true,
                  msg: msg.msgDataFound,
                  data: {
                    proofs: [],
                  },
                };
                return res.status(200).json(record);
              }
              const record = {
                success: true,
                msg: msg.msgDataFound,
                data: {
                  proofs: proofDetails,
                },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in getAllProof emp 4", {
                error,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 4,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in getAllProof emp 3", {
              error,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in getAllProof emp 2", {
            error,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in getAllProof emp 1", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  createCommentReply: [
    body("commentReplayText")
      .exists()
      .withMessage(msg.msgCommentIsReqired)
      .notEmpty()
      .withMessage(msg.msgCommentIsReqired),
    body("entityType")
      .trim()
      .exists()
      .withMessage(msg.msgProofEntityTypeIsReqired)
      .notEmpty()
      .withMessage(msg.msgProofEntityTypeIsReqired),
    body("entityId")
      .trim()
      .exists()
      .withMessage(msg.msgProofEntityIdIsReqired)
      .notEmpty()
      .withMessage(msg.msgProofEntityIdIsReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        const userName = req.CURRENT_USER_NAME;
        const workspaceName = req.CURRENT_SITE_WORKSPACE?.workspaceName;

        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            let { entityType, entityId, commentReplayText, notifyIds } = data;

            let checkEntity = null;
            let errorMsg = "";

            if (entityType === "Project") {
              checkEntity = await UserCommenService.checkProjectId(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgProjectIsNotExist;
            } else if (entityType === "Task") {
              checkEntity = await UserCommenService.checkTask(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgTaskIsNotExist;
            } else if (entityType === "Message") {
              checkEntity = await UserCommenService.checkProjectMessageId(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgMessageIsNotExist;
            } else if (entityType === "Company") {
              checkEntity = await UserCommenService.checkCompany(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgCompanyIsNotExist;
            } else {
              const record = {
                success: false,
                msg: msg.msgInvalidEntityType,
              };
              return res.status(200).json(record);
            }

            if (checkEntity === "NA") {
              const record = {
                success: false,
                msg: errorMsg,
              };
              return res.status(200).json(record);
            }
            try {
              let files = [];

              if (!req.file) {
                files = req?.files.map((file) => file?.key);
              } else if ("key" in req.file) {
                const filename = req.file.key;
                files = filename;
              } else {
                files = req.folderName + "/" + req.file.filename;
              }
              if (typeof notifyIds === "string") {
                try {
                  notifyIds = JSON.parse(notifyIds);
                } catch (e) {
                  notifyIds = [];
                }
              }

              if (!Array.isArray(notifyIds)) {
                notifyIds = [];
              }
              const commentReplyData = {
                entityId: checkEntity._id,
                entityType,
                commentReplayText,
                notifyIds: notifyIds || [],
                createdBy: userId,
                files,
              };

              const createCommentReply =
                await UserCommenService.createCommentReply(
                  SITE_DB_NAME,
                  commentReplyData,
                );
              if (createCommentReply === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgCommentError,
                  key: 5,
                };
                return res.status(200).json(record);
              }
              const projectCommentReplyId = createCommentReply?._id;
              const commentReplyDetails =
                await UserCommenService.getCommentReply(
                  SITE_DB_NAME,
                  projectCommentReplyId,
                );

              /* MAIL FLOW (same as task comment) */
              let notifyUsers = [];

              if (
                commentReplyDetails.notifyIds &&
                commentReplyDetails.notifyIds.length > 0
              ) {
                const checkNotifyUser = await UserCommenService.checkNotifyUser(
                  SITE_DB_NAME,
                  commentReplyDetails.notifyIds,
                );
                if (checkNotifyUser === "NA") {
                  return res.status(200).json({
                    success: false,
                    msg: msg.msgUserNotExist,
                    key: 6,
                  });
                }
                notifyUsers = checkNotifyUser;
              }

              if (notifyUsers && notifyUsers.length > 0) {
                const siteURL =
                  `https://` + req.CURRENT_SITE_WORKSPACE?.workspaceFullDomain;

                const entityLink =
                  siteURL + "/comments/" + commentReplyDetails._id;

                const mailFromName = process.env.MAIL_FROM_NAME;
                const appName = process.env.APP_NAME;
                const appLogo = process.env.APP_LOGO;
                const borderBackground = process.env.BORDERBACKGROUND;
                const footerBackground = process.env.FOOTERBACKGROUND;

                for (const user of notifyUsers) {
                  const mailEmail = user.email;
                  const languageId = user.languageId || 0;

                  const footerGreeting = msg.mailFooterGreeting[languageId];
                  const footerDescription =
                    msg.mailFooterDescription[languageId];

                  const mailName = await CommenFunction.capitalizeFirstLetter(
                    user.name,
                  );

                  const mailSubject = msg.mailSubjectInvite(
                    userName,
                    entityType,
                    workspaceName,
                  )[languageId];

                  const mailHeading = msg.mailHeadingComment(
                    userName,
                    entityType,
                    workspaceName,
                  )[languageId];

                  const headerGreeting =
                    msg.mailHeaderGreetingInvite[languageId];

                  const bodyData = {
                    appName,
                    entityLink,
                    footerBackground,
                    userName,
                    workspaceName,
                    userDetails: {
                      name: mailName,
                      email: mailEmail,
                      commentText: commentReplyDetails.commentReplayText,
                    },
                  };

                  const mailContent =
                    msg.mailContentComment(bodyData)[languageId];

                  const mailBody = await MailFunctions.mailBodyData({
                    appName,
                    appLogo,
                    borderBackground,
                    mailHeading,
                    headerGreeting,
                    name: mailName,
                    mailContent,
                    footerGreeting,
                    footerBackground,
                    footerDescription,
                  });

                  const response = await MailFunctions.mailSend(
                    mailEmail,
                    mailFromName,
                    mailSubject,
                    mailBody,
                  );

                  if (!response) {
                    return res.status(200).json({
                      success: false,
                      msg: msg.msgMailSendError,
                    });
                  }
                }
              }

              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const action = "comment";
              const notificationOrActivity = 1;
              const actorId = userId;
              const targetId = commentReplyDetails?._id;
              const { title: activityTitle, message: activityMessage } =
                msg.generateActivityCommenMessage(
                  checkUserID.name,
                  commentReplyDetails?.entityType,
                  "",
                  "CreateComment",
                );

              const titles = activityTitle;
              const messages = activityMessage;
              const actionId = targetId;
              const notiUserId = actorId;
              const notiOtherUserId = targetId;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];

              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }
              const record = {
                success: true,
                msg: msg.msgCommentSuccess,
                data: { comment: commentReplyDetails },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in createCommentReply emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in createCommentReply emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createCommentReply emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in createCommentReply emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateCommentReply: [
    query("commentId")
      .exists()
      .withMessage(msg.msgCommentIDReqired)
      .notEmpty()
      .withMessage(msg.msgCommentIDReqired),
    body("commentReplayText")
      .exists()
      .withMessage(msg.msgCommentIsReqired)
      .notEmpty()
      .withMessage(msg.msgCommentIsReqired),
    body("entityType")
      .trim()
      .exists()
      .withMessage(msg.msgProofEntityTypeIsReqired)
      .notEmpty()
      .withMessage(msg.msgProofEntityTypeIsReqired),
    body("entityId")
      .trim()
      .exists()
      .withMessage(msg.msgProofEntityIdIsReqired)
      .notEmpty()
      .withMessage(msg.msgProofEntityIdIsReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const data = req.body;
      const { commentId } = req.query;
      try {
        const userId = req.CURRENT_USER_ID;
        const userName = req.CURRENT_USER?.name;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          let { entityType, entityId, commentReplayText, notifyIds } = data;
          try {
            const checkCommentReplyId =
              await UserCommenService.checkCommentReplyId(
                SITE_DB_NAME,
                commentId,
              );

            if (checkCommentReplyId === "NA") {
              const record = {
                success: false,
                msg: msg.msgCommentIdNotExist,
              };
              return res.status(200).json(record);
            }

            let checkEntity = null;
            let errorMsg = "";

            if (entityType === "Project") {
              checkEntity = await UserCommenService.checkProjectId(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgProjectIsNotExist;
            } else if (entityType === "Task") {
              checkEntity = await UserCommenService.checkTask(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgTaskIsNotExist;
            } else if (entityType === "Message") {
              checkEntity = await UserCommenService.checkProjectMessageId(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgMessageIsNotExist;
            } else if (entityType === "Company") {
              checkEntity = await UserCommenService.checkCompany(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgCompanyIsNotExist;
            } else {
              const record = {
                success: false,
                msg: msg.msgInvalidEntityType,
              };
              return res.status(200).json(record);
            }

            if (checkEntity === "NA") {
              const record = {
                success: false,
                msg: errorMsg,
              };
              return res.status(200).json(record);
            }

            // let files = [];

            // if (req?.files?.length > 0) {
            //   files = req.files.map((file) => file.key);
            // } else if (req.file?.key) {
            //   files = [req.file.key];
            // } else if (req.folderName && req.file?.filename) {
            //   files = [req.folderName + "/" + req.file.filename];
            // }

            // // merge with old files
            // if (files.length > 0) {
            //   const oldFiles = checkCommentReplyId.files || [];
            //   files = [...oldFiles, ...files];
            // } else {
            //   files = checkCommentReplyId.files || [];
            // }

            // ---------- uploaded files ----------
            let uploadedFiles = [];
            if (Array.isArray(req.files) && req.files.length > 0) {
              uploadedFiles = req.files.map((f) => f.key).filter(Boolean);
            } else if (req.file?.key) {
              uploadedFiles = [req.file.key];
            }

            // ---------- parse existingFiles ONLY from client ----------
            let existingFilesArr = [];

            if (typeof data.existingFiles !== "undefined") {
              if (Array.isArray(data.existingFiles)) {
                existingFilesArr = data.existingFiles;
              } else if (typeof data.existingFiles === "string") {
                try {
                  existingFilesArr = JSON.parse(data.existingFiles);
                } catch (e) {
                  existingFilesArr = [data.existingFiles];
                }
              }
            }

            // ---------- FINAL FILES (NO DB MERGE EVER) ----------
            let finalFiles = [];

            if (existingFilesArr.length > 0 && uploadedFiles.length > 0) {
              finalFiles = [...existingFilesArr, ...uploadedFiles];
            } else if (existingFilesArr.length > 0) {
              finalFiles = existingFilesArr;
            } else if (uploadedFiles.length > 0) {
              finalFiles = uploadedFiles;
            } else {
              finalFiles = []; // client ne kuch nahi bheja → empty
            }

            if (typeof notifyIds === "string") {
              try {
                notifyIds = JSON.parse(notifyIds);
              } catch (e) {
                notifyIds = [];
              }
            }

            if (!Array.isArray(notifyIds)) {
              notifyIds = [];
            }

            const commenReplyData = {
              entityId: checkEntity._id,
              entityType,
              commentReplayText,
              notifyIds: notifyIds || [],
              files: finalFiles,
            };

            const updateCommentReply =
              await UserCommenService.updateCommentReply(
                SITE_DB_NAME,
                checkCommentReplyId._id,
                commenReplyData,
              );
            if (updateCommentReply === "NA") {
              const record = {
                success: false,
                msg: msg.msgCommentUpdateError,
              };
              return res.status(200).json(record);
            }

            const commentReplyDetails = await UserCommenService.getCommentReply(
              SITE_DB_NAME,
              checkCommentReplyId._id,
            );
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "comment";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetId =
              checkCommentReplyId._id || req.query.commentReplyId || null;
            const { title: activityTitle, message: activityMessage } =
              msg.generateActivityCommenMessage(
                userName,
                commentReplyDetails.entityType,
                "",
                "UpdateComment",
              );

            const titles = activityTitle;
            const messages = activityMessage;
            const actionId = targetId;
            const notiUserId = actorId;
            const notiOtherUserId = targetId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgCommentUpdatedSuccess,
              data: { comment: commentReplyDetails },
            };
            return res.status(200).json(record);
          } catch (error) {
            console.log("database error key 3", error);
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = { success: false, msg: msg.msgServerError, key: 1 };
        return res.status(500).json(record);
      }
    },
  ],

  deleteCommentReply: [
    query("commentId")
      .exists()
      .withMessage(msg.msgCommentIDReqired)
      .notEmpty()
      .withMessage(msg.msgCommentIDReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { commentId } = req.query;
          const checkCommentReplyId =
            await UserCommenService.checkDeleteCommentReplyId(
              SITE_DB_NAME,
              commentId,
            );
          if (checkCommentReplyId === "NA") {
            const record = {
              success: false,
              msg: msg.msgCommentIdNotExist,
              key: 4,
            };
            return res.status(200).json(record);
          }
          try {
            const comment = await UserCommenService.deleteCommentReply(
              SITE_DB_NAME,
              checkCommentReplyId._id,
            );

            if (comment === "NA") {
              const record = {
                success: false,
                msg: msg.msgCommentDeleteError,
                key: 3,
              };
              return res.status(200).json(record);
            }
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "comment";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetId =
              checkCommentReplyId._id || req.query.commentId || null;
            const { title, message } = msg.generateActivityCommenMessage(
              checkUserID.name,
              checkCommentReplyId?.entityType,
              "",
              "DeletedComment",
            );
            const titles = title;
            const messages = message;
            const actionId = targetId;
            const notiUserId = actorId;
            const notiOtherUserId = targetId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }

            const record = {
              success: true,
              msg: msg.msgCommentDeleteSuccess,
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in deleteCommentReply emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in deleteCommentReply emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in deleteCommentReply emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  getAllCommentReply: [
    query("entityId")
      .exists()
      .withMessage(msg.msgProofEntityIdIsReqired)
      .notEmpty()
      .withMessage(msg.msgProofEntityIdIsReqired),
    query("entityType")
      .exists()
      .withMessage(msg.msgProofEntityTypeIsReqired)
      .notEmpty()
      .withMessage(msg.msgProofEntityTypeIsReqired),
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
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const userId = req.CURRENT_USER_ID;
      const { entityId, entityType, deleteFlag } = req.query;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            let checkEntity = null;
            let errorMsg = "";

            if (entityType === "Project") {
              checkEntity = await UserCommenService.checkProjectId(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgProjectIsNotExist;
            } else if (entityType === "Task") {
              checkEntity = await UserCommenService.checkTask(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgTaskIsNotExist;
            } else if (entityType === "Message") {
              checkEntity = await UserCommenService.checkProjectMessageId(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgMessageIsNotExist;
            } else if (entityType === "Company") {
              checkEntity = await UserCommenService.checkCompany(
                SITE_DB_NAME,
                entityId,
              );
              errorMsg = msg.msgCompanyIsNotExist;
            } else {
              const record = {
                success: false,
                msg: msg.msgInvalidEntityType,
              };
              return res.status(200).json(record);
            }

            if (checkEntity === "NA") {
              const record = {
                success: false,
                msg: errorMsg,
              };
              return res.status(200).json(record);
            }
            try {
              const pagination = {
                pageSize: parseInt(req.query.pageSize) || 10,
                pageNumber: parseInt(req.query.pageNumber) || 1,
              };
              const search = req.query.search || "";
              const commentReplyDetails =
                await UserCommenService.getAllCommentReply(
                  SITE_DB_NAME,
                  Number(deleteFlag),
                  checkEntity?._id,
                  entityType,
                  pagination,
                  search,
                );
              if (commentReplyDetails === "NA") {
                const record = {
                  success: true,
                  msg: msg.msgDataFound,
                  data: {
                    comments: [],
                  },
                };
                return res.status(200).json(record);
              }
              const record = {
                success: true,
                msg: msg.msgDataFound,
                data: {
                  comments: commentReplyDetails,
                },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in getAllCommentReply emp 4", {
                error,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 4,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in getAllCommentReply emp 3", {
              error,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in getAllCommentReply emp 2", {
            error,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in getAllCommentReply emp 1", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  getPerProjectPeople: [
    query("projectId")
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),
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
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const userId = req.CURRENT_USER_ID;
      const { projectId, deleteFlag } = req.query;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const checkProjectId = await UserCommenService.checkProjectId(
              SITE_DB_NAME,
              projectId,
            );
            if (checkProjectId === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectIsNotExist,
              };
              return res.status(200).json(record);
            }
            try {
              const pagination = {
                pageSize: parseInt(req.query.pageSize) || 10,
                pageNumber: parseInt(req.query.pageNumber) || 1,
              };
              const search = req.query.search || "";
              const perProjectPeopleDetials =
                await UserCommenService.getPerProjectPeople(
                  SITE_DB_NAME,
                  Number(deleteFlag),
                  checkProjectId?._id,
                  pagination,
                  search,
                );
              if (perProjectPeopleDetials === "NA") {
                const record = {
                  success: true,
                  msg: msg.msgDataFound,
                  data: {
                    people: [],
                  },
                };
                return res.status(200).json(record);
              }
              const record = {
                success: true,
                msg: msg.msgDataFound,
                data: {
                  people: perProjectPeopleDetials,
                },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in getPerProjectPeople emp 4", {
                error,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 4,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in getPerProjectPeople emp 3", {
              error,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in getPerProjectPeople emp 2", {
            error,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in getPerProjectPeople emp 1", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  removePeopleProject: [
    query("projectId")
      .trim()
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),

    body("peopleId")
      .trim()
      .exists()
      .withMessage(msg.msgPeopleIdReqired)
      .notEmpty()
      .withMessage(msg.msgPeopleIdReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      const { projectId } = req.query;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const { peopleId } = data;

            const checkProjectId = await UserCommenService.checkProjectId(
              SITE_DB_NAME,
              projectId,
            );
            if (checkProjectId === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectIsNotExist,
                key: 4,
              };
              return res.status(200).json(record);
            }
            const checkPeopleId = await UserCommenService.checkPeopleId(
              SITE_DB_NAME,
              peopleId,
            );
            if (checkPeopleId === "NA") {
              const record = {
                success: false,
                msg: msg.msgPeopleIsNotExist,
                key: 4,
              };
              return res.status(200).json(record);
            }
            try {
              const updateProject = await UserCommenService.removePeopleProject(
                SITE_DB_NAME,
                checkProjectId._id,
                checkPeopleId._id,
              );
              if (updateProject === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUpdateProjectError,
                  key: 5,
                };
                return res.status(200).json(record);
              }
              const updateProjectId = checkProjectId?._id;
              const projectDetails = await UserCommenService.getProject(
                SITE_DB_NAME,
                updateProjectId,
              );

              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const action = "project";
              const notificationOrActivity = 1;
              const actorId = userId;
              const targetProjectId =
                checkPeopleId._id || req.query.projectId || null;
              const { title, message } = msg.generateActivityCommenMessage(
                checkUserID.name,
                projectDetails?.name,
                "",
                "ProjectUpdated",
              );
              const titles = title;
              const messages = message;
              const actionId = targetProjectId;
              const notiUserId = actorId;
              const notiOtherUserId = targetProjectId;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];

              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }
              const record = {
                success: true,
                msg: msg.msgProjectUpdatedSuccess,
                data: {
                  project: projectDetails,
                },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in createProject emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in createProject emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createProject emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in createProject emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  createProjectUpdate: [
    query("projectId")
      .trim()
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),
    body("description")
      .trim()
      .exists()
      .withMessage(msg.descriptionIsRequired)
      .notEmpty()
      .withMessage(msg.descriptionIsRequired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      } else {
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const { projectId } = req.query;
        const data = req.body;
        try {
          const userId = req.CURRENT_USER_ID;
          const workspaceName = req.CURRENT_SITE_WORKSPACE?.workspaceName;
          const currentUserName = req.CURRENT_USER_NAME;
          if (!userId && userId === 0) {
            const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
            return res.status(200).json(record);
          }
          try {
            const checkUserID = await UserCommenService.checkUser(
              SITE_DB_NAME,
              userId,
            );
            if (checkUserID === "NA") {
              const record = {
                success: false,
                msg: msg.msgUserNotExist,
                key: 2,
              };
              return res.status(200).json(record);
            }
            const { description, peopleIds, notifyIds } = data;
            try {
              const checkProjectId = await UserCommenService.checkProjectId(
                SITE_DB_NAME,
                projectId,
              );

              if (checkProjectId === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgProjectIsNotExist,
                  key: 2,
                };
                return res.status(200).json(record);
              }
              let projectHealthLabels = data.projectHealthLabels;

              if (!projectHealthLabels && data["projectHealthLabels.text"]) {
                projectHealthLabels = {
                  text: data["projectHealthLabels.text"],
                };
              }
              try {
                const projectUpdateData = {
                  projectId: checkProjectId._id,
                  description,
                  peopleIds,
                  notifyIds,
                  projectHealthLabels,
                  createdById: userId,
                };
                const createProjectUpdate =
                  await UserCommenService.createProjectUpdate(
                    SITE_DB_NAME,
                    projectUpdateData,
                  );
                if (createProjectUpdate === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgCreateProjectUpdateError,
                    key: 3,
                  };
                  return res.status(200).json(record);
                }
                const createProjectUpdateId = createProjectUpdate?._id;

                const projectUpdateDetails =
                  await UserCommenService.getProjectUpdate(
                    SITE_DB_NAME,
                    createProjectUpdateId,
                  );

                try {
                  const siteURL =
                    `https://` +
                    req.CURRENT_SITE_WORKSPACE?.workspaceFullDomain;
                  const updateProjectLink =
                    siteURL + "/project/viewproject/" + checkProjectId._id;
                  const prjectName = projectUpdateDetails.project?.name;
                  const notifyUsers = projectUpdateDetails.notifyUsers;
                  const projectCompanyId =
                    projectUpdateDetails.project?.companyId;
                  const languageId = notifyUsers.languageId || 0;
                  const mailFromName = process.env.MAIL_FROM_NAME;
                  const appName = process.env.APP_NAME;
                  const appLogo = process.env.APP_LOGO;
                  const TASK_PNG = process.env.TASK_PNG;
                  const borderBackground = process.env.BORDERBACKGROUND;
                  const footerGreeting = msg.mailFooterGreeting[languageId];
                  const footerDescription =
                    msg.mailFooterDescription[languageId];
                  const footerBackground = process.env.FOOTERBACKGROUND;

                  const checkComapny = await UserCommenService.checkCompany(
                    SITE_DB_NAME,
                    projectCompanyId,
                  );
                  if (checkComapny === "NA") {
                    const record = {
                      success: false,
                      msg: msg.msgCompanyIsNotExist,
                      key: 4,
                    };
                    return res.status(200).json(record);
                  }

                  if (notifyUsers && notifyUsers.length > 0) {
                    for (const user of notifyUsers) {
                      const mailEmail = user.email;
                      const languageId = user.languageId || 0;
                      const mailName =
                        await CommenFunction.capitalizeFirstLetter(user.name);

                      const mailSubject = msg.mailSubjectInvite(
                        currentUserName,
                        prjectName,
                        workspaceName,
                      )[languageId];

                      const mailHeading = msg.mailHeadingComment(
                        currentUserName,
                        prjectName,
                        workspaceName,
                      )[languageId];

                      const headerGreeting =
                        msg.mailHeaderGreetingInvite[languageId];

                      const bodyData = {
                        appName,
                        updateProjectLink,
                        projectName: prjectName,
                        TASK_PNG,
                        footerBackground,
                        description: projectUpdateDetails.description || "",
                        currentUserName,
                        workspaceName,
                        userDetails: {
                          name: mailName,
                        },
                      };

                      const mailContent =
                        msg.mailContentProjectUpdate(bodyData)[languageId];

                      const mailBody = await MailFunctions.mailBodyData({
                        appName: appName,
                        appLogo: appLogo,
                        borderBackground: borderBackground,
                        mailHeading: mailHeading,
                        headerGreeting: headerGreeting,
                        name: mailName,
                        mailContent: mailContent,
                        footerGreeting: footerGreeting,
                        footerBackground: footerBackground,
                        footerDescription: footerDescription,
                      });

                      const responce = await MailFunctions.mailSend(
                        mailEmail,
                        mailFromName,
                        mailSubject,
                        mailBody,
                      );
                      if (!responce) {
                        const record = {
                          success: false,
                          msg: msg.msgProjectUpdateMailSendError,
                        };
                        return res.status(200).json(record);
                      }
                    }
                  }
                  const APP_LOGO = process.env.APP_LOGO || "";
                  const APP_SITE_URL = process.env.SITE_URL || "";
                  const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                  const action = "project";
                  const notificationOrActivity = 1;
                  const actorId = userId;
                  const targetProjectUpdateId = createProjectUpdate._id;

                  const { title, message } = msg.generateActivityCommenMessage(
                    checkUserID.name,
                    "",
                    "",
                    "ProjectUpdateCreate",
                  );
                  const titles = title;
                  const messages = message;
                  const actionId = targetProjectUpdateId;
                  const notiUserId = actorId;
                  const notiOtherUserId = targetProjectUpdateId;
                  const actionJson = {
                    actionId: actionId,
                    action: action,
                    option: {
                      logoUrl: APP_LOGO,
                      redirectionUrl: {
                        webLink: APP_SITE_URL,
                        deepLink: APP_DEEP_LINK_URL,
                      },
                      imageUrl: "",
                      soundFile: "",
                    },
                    appType: "customer",
                  };
                  let notificationArr = [];

                  const notification =
                    await oneSignalHelperUser.getNotificationArrSingle(
                      SITE_DB_NAME,
                      notiUserId,
                      notiOtherUserId,
                      action,
                      actionId,
                      titles,
                      messages,
                      actionJson,
                      notificationOrActivity,
                    );

                  if (notification !== "NA") {
                    notificationArr.push(notification);
                  }
                  if (notificationArr.length > 0) {
                    notificationArr.push(notification);
                    await oneSignalHelperUser.oneSignalNotificationSendCall(
                      notificationArr,
                    );
                  }
                  const record = {
                    success: true,
                    msg: msg.msgProjectUpdateCreatedSuccess,
                    data: {
                      projectUpdate: projectUpdateDetails,
                    },
                  };

                  return res.status(200).json(record);
                } catch (error) {
                  logger.error("mail error key 2", {
                    error: error.message,
                  });
                  const record = {
                    success: false,
                    msg: msg.msgServerError,
                    key: error,
                  };
                  return res.status(500).json(record);
                }
              } catch (error) {
                logger.error("Database error in createProjectUpdate emp 5", {
                  error: error.message,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 4,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              logger.error("Database error in createProjectUpdate emp 3", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 3,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in createProjectUpdate emp 2", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createProjectUpdate emp 1", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 1,
          };
          return res.status(500).json(record);
        }
      }
    },
  ],

  getAllProjectUpdate: [
    query("projectId")
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),
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
      } else {
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        const userId = req.CURRENT_USER_ID;
        const { projectId, deleteFlag } = req.query;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          if (!userId && userId === 0) {
            const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
            return res.status(200).json(record);
          } else {
            try {
              const checkUserID = await UserCommenService.checkUser(
                SITE_DB_NAME,
                userId,
              );
              if (checkUserID === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUserNotExist,
                  key: 2,
                };
                return res.status(200).json(record);
              }
              try {
                const checkProjectId = await UserCommenService.checkProjectId(
                  SITE_DB_NAME,
                  projectId,
                );
                if (checkProjectId === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgProjectIsNotExist,
                  };
                  return res.status(200).json(record);
                }
                try {
                  const pagination = {
                    pageSize: parseInt(req.query.pageSize) || 10,
                    pageNumber: parseInt(req.query.pageNumber) || 1,
                  };
                  const search = req.query.search || "";
                  const projectUpdateDetails =
                    await UserCommenService.getAllProjectUpdate(
                      SITE_DB_NAME,
                      Number(deleteFlag),
                      checkProjectId?._id,
                      pagination,
                      search,
                    );
                  if (projectUpdateDetails === "NA") {
                    const record = {
                      success: true,
                      msg: msg.msgDataFound,
                      data: {
                        projectUpdates: [],
                      },
                    };
                    return res.status(200).json(record);
                  }
                  const record = {
                    success: true,
                    msg: msg.msgDataFound,
                    data: {
                      projectUpdates: projectUpdateDetails,
                    },
                  };

                  return res.status(200).json(record);
                } catch (error) {
                  logger.error("Database error in getAllProjectUpdate emp 4", {
                    error,
                  });
                  const record = {
                    success: false,
                    msg: msg.msgServerError,
                    key: 4,
                  };
                  return res.status(500).json(record);
                }
              } catch (error) {
                logger.error("Database error in getAllProjectUpdate emp 3", {
                  error,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 3,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              logger.error("Database error in getAllProjectUpdate emp 2", {
                error,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 2,
              };
              return res.status(500).json(record);
            }
          }
        } catch (error) {
          logger.error("Database error in getAllProjectUpdate emp 1", {
            error,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 1,
          };
          return res.status(500).json(record);
        }
      }
    },
  ],

  updateProjectUpdate: [
    query("projectUpdateId")
      .trim()
      .exists()
      .withMessage(msg.msgProjectUpdateIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectUpdateIDReqired),
    body("description")
      .trim()
      .exists()
      .withMessage(msg.descriptionIsRequired)
      .notEmpty()
      .withMessage(msg.descriptionIsRequired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      } else {
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const { projectUpdateId } = req.query;
        const data = req.body;
        try {
          const userId = req.CURRENT_USER_ID;
          const workspaceName = req.CURRENT_SITE_WORKSPACE?.workspaceName;
          const currentUserName = req.CURRENT_USER_NAME;
          if (!userId && userId === 0) {
            const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
            return res.status(200).json(record);
          }
          try {
            const checkUserID = await UserCommenService.checkUser(
              SITE_DB_NAME,
              userId,
            );
            if (checkUserID === "NA") {
              const record = {
                success: false,
                msg: msg.msgUserNotExist,
                key: 2,
              };
              return res.status(200).json(record);
            }
            const { description, peopleIds, notifyIds } = data;
            try {
              const checkProjectUpdateId =
                await UserCommenService.checkProjectUpdateId(
                  SITE_DB_NAME,
                  projectUpdateId,
                );

              if (checkProjectUpdateId === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgProjectUpdateIsNotExist,
                  key: 2,
                };
                return res.status(200).json(record);
              }
              try {
                let projectHealthLabels = data.projectHealthLabels;

                if (!projectHealthLabels && data["projectHealthLabels.text"]) {
                  projectHealthLabels = {
                    text: data["projectHealthLabels.text"],
                  };
                }
                const projectUpdateData = {
                  description,
                  peopleIds,
                  notifyIds,
                  projectHealthLabels,
                };
                const updateProjectUpdate =
                  await UserCommenService.updateProjectUpdate(
                    SITE_DB_NAME,
                    checkProjectUpdateId._id,
                    projectUpdateData,
                  );
                if (updateProjectUpdate === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgUpdateProjectUpdateError,
                    key: 3,
                  };
                  return res.status(200).json(record);
                }

                const projectUpdateDetails =
                  await UserCommenService.getProjectUpdate(
                    SITE_DB_NAME,
                    checkProjectUpdateId._id,
                  );

                try {
                  const oldNotifyIds = (
                    checkProjectUpdateId.notifyIds || []
                  ).map((id) => id.toString());

                  const notifyUsers = (
                    projectUpdateDetails.notifyUsers || []
                  ).filter(
                    (user) => !oldNotifyIds.includes(user._id.toString()),
                  );

                  const siteURL =
                    `https://` +
                    req.CURRENT_SITE_WORKSPACE?.workspaceFullDomain;
                  const updateProjectLink =
                    siteURL +
                    "/project/viewproject/" +
                    checkProjectUpdateId.projectId;
                  const prjectName = projectUpdateDetails.project?.name;
                  // const notifyUsers = projectUpdateDetails.notifyUsers;
                  const projectCompanyId =
                    projectUpdateDetails.project?.companyId;
                  const languageId = notifyUsers.languageId || 0;
                  const mailFromName = process.env.MAIL_FROM_NAME;
                  const appName = process.env.APP_NAME;
                  const appLogo = process.env.APP_LOGO;
                  const TASK_PNG = process.env.TASK_PNG;
                  const borderBackground = process.env.BORDERBACKGROUND;
                  const footerGreeting = msg.mailFooterGreeting[languageId];
                  const footerDescription =
                    msg.mailFooterDescription[languageId];
                  const footerBackground = process.env.FOOTERBACKGROUND;

                  const checkComapny = await UserCommenService.checkCompany(
                    SITE_DB_NAME,
                    projectCompanyId,
                  );
                  if (checkComapny === "NA") {
                    const record = {
                      success: false,
                      msg: msg.msgCompanyIsNotExist,
                      key: 4,
                    };
                    return res.status(200).json(record);
                  }

                  if (notifyUsers && notifyUsers.length > 0) {
                    for (const user of notifyUsers) {
                      const mailEmail = user.email;
                      const languageId = user.languageId || 0;
                      const mailName =
                        await CommenFunction.capitalizeFirstLetter(user.name);

                      const mailSubject = msg.mailSubjectInvite(
                        currentUserName,
                        prjectName,
                        workspaceName,
                      )[languageId];

                      const mailHeading = msg.mailHeadingProjectUpdate(
                        currentUserName,
                        prjectName,
                        workspaceName,
                      )[languageId];

                      const headerGreeting =
                        msg.mailHeaderGreetingInvite[languageId];

                      const bodyData = {
                        appName,
                        updateProjectLink,
                        projectName: prjectName,
                        TASK_PNG,
                        footerBackground,
                        description: projectUpdateDetails.description || "",
                        currentUserName,
                        workspaceName,
                        userDetails: {
                          name: mailName,
                        },
                      };

                      const mailContent =
                        msg.mailContentProjectUpdate(bodyData)[languageId];

                      const mailBody = await MailFunctions.mailBodyData({
                        appName: appName,
                        appLogo: appLogo,
                        borderBackground: borderBackground,
                        mailHeading: mailHeading,
                        headerGreeting: headerGreeting,
                        name: mailName,
                        mailContent: mailContent,
                        footerGreeting: footerGreeting,
                        footerBackground: footerBackground,
                        footerDescription: footerDescription,
                      });

                      const responce = await MailFunctions.mailSend(
                        mailEmail,
                        mailFromName,
                        mailSubject,
                        mailBody,
                      );
                      if (!responce) {
                        const record = {
                          success: false,
                          msg: msg.msgProjectUpdateMailSendError,
                        };
                        return res.status(200).json(record);
                      }
                    }
                  }
                  const APP_LOGO = process.env.APP_LOGO || "";
                  const APP_SITE_URL = process.env.SITE_URL || "";
                  const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                  const action = "project";
                  const notificationOrActivity = 1;
                  const actorId = userId;
                  const targetProjectUpdateId = checkProjectUpdateId._id;

                  const { title, message } = msg.generateActivityCommenMessage(
                    checkUserID.name,
                    "",
                    "",
                    "ProjectUpdateUpdated",
                  );
                  const titles = title;
                  const messages = message;
                  const actionId = targetProjectUpdateId;
                  const notiUserId = actorId;
                  const notiOtherUserId = targetProjectUpdateId;
                  const actionJson = {
                    actionId: actionId,
                    action: action,
                    option: {
                      logoUrl: APP_LOGO,
                      redirectionUrl: {
                        webLink: APP_SITE_URL,
                        deepLink: APP_DEEP_LINK_URL,
                      },
                      imageUrl: "",
                      soundFile: "",
                    },
                    appType: "customer",
                  };
                  let notificationArr = [];

                  const notification =
                    await oneSignalHelperUser.getNotificationArrSingle(
                      SITE_DB_NAME,
                      notiUserId,
                      notiOtherUserId,
                      action,
                      actionId,
                      titles,
                      messages,
                      actionJson,
                      notificationOrActivity,
                    );

                  if (notification !== "NA") {
                    notificationArr.push(notification);
                  }
                  if (notificationArr.length > 0) {
                    notificationArr.push(notification);
                    await oneSignalHelperUser.oneSignalNotificationSendCall(
                      notificationArr,
                    );
                  }
                  const record = {
                    success: true,
                    msg: msg.msgProjectUpdateCreatedSuccess,
                    data: {
                      projectUpdate: projectUpdateDetails,
                    },
                  };

                  return res.status(200).json(record);
                } catch (error) {
                  logger.error("mail error key 2", {
                    error: error.message,
                  });
                  const record = {
                    success: false,
                    msg: msg.msgServerError,
                    key: error,
                  };
                  return res.status(500).json(record);
                }
              } catch (error) {
                logger.error("Database error in updateProjectUpdate emp 5", {
                  error: error.message,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 4,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              logger.error("Database error in updateProjectUpdate emp 3", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 3,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in updateProjectUpdate emp 2", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in updateProjectUpdate emp 1", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 1,
          };
          return res.status(500).json(record);
        }
      }
    },
  ],

  projectUpdateReaction: [
    query("projectUpdateId")
      .trim()
      .exists()
      .withMessage(msg.msgProjectUpdateIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectUpdateIDReqired),
    body("emoji")
      .trim()
      .exists()
      .withMessage(msg.msgEmojiIsRequired)
      .notEmpty()
      .withMessage(msg.msgEmojiIsRequired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      } else {
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const data = req.body;
        try {
          const userId = req.CURRENT_USER_ID;
          if (!userId && userId === 0) {
            const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
            return res.status(200).json(record);
          }
          try {
            const checkUserID = await UserCommenService.checkUser(
              SITE_DB_NAME,
              userId,
            );
            if (checkUserID === "NA") {
              const record = {
                success: false,
                msg: msg.msgUserNotExist,
                key: 2,
              };
              return res.status(200).json(record);
            }
            const { projectUpdateId } = req.query;
            const { emoji } = data;
            try {
              const checkProjectUpdateId =
                await UserCommenService.checkProjectUpdateId(
                  SITE_DB_NAME,
                  projectUpdateId,
                  emoji,
                  userId,
                );

              if (checkProjectUpdateId === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgProjectUpdateIsNotExist,
                  key: 2,
                };
                return res.status(200).json(record);
              }
              try {
                const projectUpdateData = {
                  emoji,
                  userId,
                };
                const checkProjectUpdateEmoji =
                  await UserCommenService.checkProjectUpdateEmoji(
                    SITE_DB_NAME,
                    checkProjectUpdateId._id,
                    emoji,
                    userId,
                  );

                if (checkProjectUpdateEmoji !== "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgProjectUpdateEmojiAlreadyExist,
                    key: 4,
                  };
                  return res.status(200).json(record);
                }
                const projectUpdateReaction =
                  await UserCommenService.updateProjectUpdateReaction(
                    SITE_DB_NAME,
                    checkProjectUpdateId._id,
                    projectUpdateData,
                  );
                if (projectUpdateReaction === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgUpdateProjectUpdateReactionError,
                    key: 3,
                  };
                  return res.status(200).json(record);
                }
                const projectUpdateDetails =
                  await UserCommenService.getProjectUpdate(
                    SITE_DB_NAME,
                    checkProjectUpdateId._id,
                  );

                const APP_LOGO = process.env.APP_LOGO || "";
                const APP_SITE_URL = process.env.SITE_URL || "";
                const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                const notiUserId = userId;
                const notiOtherUserId = userId;
                const action = "project";
                const notificationOrActivity = 1;
                const actionId = userId;
                const { title, message } = msg.generateActivityCommenMessage(
                  checkUserID.name,
                  "",
                  "",
                  "ProjectUpdateReaction",
                );
                const titles = title;
                const messages = message;
                const actionJson = {
                  actionId: actionId,
                  action: action,
                  option: {
                    logoUrl: APP_LOGO,
                    redirectionUrl: {
                      webLink: APP_SITE_URL,
                      deepLink: APP_DEEP_LINK_URL,
                    },
                    imageUrl: "",
                    soundFile: "",
                  },
                  appType: "customer",
                };
                let notificationArr = [];

                const notification =
                  await oneSignalHelperUser.getNotificationArrSingle(
                    SITE_DB_NAME,
                    notiUserId,
                    notiOtherUserId,
                    action,
                    actionId,
                    titles,
                    messages,
                    actionJson,
                    notificationOrActivity,
                  );

                if (notification !== "NA") {
                  notificationArr.push(notification);
                }
                if (notificationArr.length > 0) {
                  notificationArr.push(notification);
                  await oneSignalHelperUser.oneSignalNotificationSendCall(
                    notificationArr,
                  );
                }
                const record = {
                  success: true,
                  msg: msg.msgProjectUpdateCreatedSuccess,
                  data: {
                    projectUpdate: projectUpdateDetails,
                  },
                };

                return res.status(200).json(record);
              } catch (error) {
                logger.error("Database error in projectUpdateReaction emp 5", {
                  error: error.message,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 4,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              logger.error("Database error in projectUpdateReaction emp 3", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 3,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in projectUpdateReaction emp 2", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in projectUpdateReaction emp 1", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 1,
          };
          return res.status(500).json(record);
        }
      }
    },
  ],

  projectUpdateReactionRemove: [
    query("projectUpdateId")
      .trim()
      .exists()
      .withMessage(msg.msgProjectUpdateIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectUpdateIDReqired),
    body("emoji")
      .trim()
      .exists()
      .withMessage(msg.msgEmojiIsRequired)
      .notEmpty()
      .withMessage(msg.msgEmojiIsRequired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      } else {
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const data = req.body;
        try {
          const userId = req.CURRENT_USER_ID;
          if (!userId && userId === 0) {
            const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
            return res.status(200).json(record);
          }
          try {
            const checkUserID = await UserCommenService.checkUser(
              SITE_DB_NAME,
              userId,
            );
            if (checkUserID === "NA") {
              const record = {
                success: false,
                msg: msg.msgUserNotExist,
                key: 2,
              };
              return res.status(200).json(record);
            }
            const { projectUpdateId } = req.query;
            const { emoji } = data;
            try {
              const checkProjectUpdateId =
                await UserCommenService.checkProjectUpdateId(
                  SITE_DB_NAME,
                  projectUpdateId,
                  emoji,
                  userId,
                );

              if (checkProjectUpdateId === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgProjectUpdateIsNotExist,
                  key: 2,
                };
                return res.status(200).json(record);
              }
              try {
                const projectUpdateData = {
                  emoji,
                  userId,
                };
                const projectUpdateReactionRemove =
                  await UserCommenService.projectUpdateReactionRemove(
                    SITE_DB_NAME,
                    checkProjectUpdateId._id,
                    projectUpdateData,
                  );
                if (projectUpdateReactionRemove === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgProjectUpdateReactionRemoveError,
                    key: 3,
                  };
                  return res.status(200).json(record);
                }
                const projectUpdateDetails =
                  await UserCommenService.getProjectUpdate(
                    SITE_DB_NAME,
                    checkProjectUpdateId._id,
                  );

                const APP_LOGO = process.env.APP_LOGO || "";
                const APP_SITE_URL = process.env.SITE_URL || "";
                const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                const notiUserId = userId;
                const notiOtherUserId = userId;
                const action = "project";
                const notificationOrActivity = 1;
                const actionId = userId;
                const { title, message } = msg.generateActivityCommenMessage(
                  checkUserID.name,
                  "",
                  "",
                  "ProjectUpdateReactionRemove",
                );
                const titles = title;
                const messages = message;
                const actionJson = {
                  actionId: actionId,
                  action: action,
                  option: {
                    logoUrl: APP_LOGO,
                    redirectionUrl: {
                      webLink: APP_SITE_URL,
                      deepLink: APP_DEEP_LINK_URL,
                    },
                    imageUrl: "",
                    soundFile: "",
                  },
                  appType: "customer",
                };
                let notificationArr = [];

                const notification =
                  await oneSignalHelperUser.getNotificationArrSingle(
                    SITE_DB_NAME,
                    notiUserId,
                    notiOtherUserId,
                    action,
                    actionId,
                    titles,
                    messages,
                    actionJson,
                    notificationOrActivity,
                  );

                if (notification !== "NA") {
                  notificationArr.push(notification);
                }
                if (notificationArr.length > 0) {
                  notificationArr.push(notification);
                  await oneSignalHelperUser.oneSignalNotificationSendCall(
                    notificationArr,
                  );
                }
                const record = {
                  success: true,
                  msg: msg.msgProjectUpdateReactionRemovedSuccess,
                  data: {
                    projectUpdate: projectUpdateDetails,
                  },
                };

                return res.status(200).json(record);
              } catch (error) {
                logger.error("Database error in projectUpdateReaction emp 5", {
                  error: error.message,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 4,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              logger.error(
                "Database error in projectUpdateReactionRemove emp 3",
                {
                  error: error.message,
                },
              );
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 3,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error(
              "Database error in projectUpdateReactionRemove emp 2",
              {
                error: error.message,
              },
            );
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in projectUpdateReactionRemove emp 1", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 1,
          };
          return res.status(500).json(record);
        }
      }
    },
  ],

  deleteProjectUpdate: [
    query("projectUpdateId")
      .exists()
      .withMessage(msg.msgProjectUpdateIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectUpdateIDReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      } else {
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const { projectUpdateId } = req.query;
        try {
          const userId = req.CURRENT_USER_ID;
          if (!userId && userId === 0) {
            const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
            return res.status(200).json(record);
          }
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
            };
            return res.status(200).json(record);
          }
          try {
            const checkProjectUpdateId =
              await UserCommenService.checkProjectUpdateId(
                SITE_DB_NAME,
                projectUpdateId,
              );

            if (checkProjectUpdateId === "NA") {
              const record = {
                success: false,
                msg: msg.msgProjectUpdateIsNotExist,
                key: 2,
              };
              return res.status(200).json(record);
            } else {
              try {
                const deleteProjectUpdate =
                  await UserCommenService.deleteProjectUpdate(
                    SITE_DB_NAME,
                    checkProjectUpdateId._id,
                  );

                if (deleteProjectUpdate === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgProjectUpdateDeleteError,
                    key: 3,
                  };
                  return res.status(200).json(record);
                } else {
                  const APP_LOGO = process.env.APP_LOGO || "";
                  const APP_SITE_URL = process.env.SITE_URL || "";
                  const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                  const notiUserId = userId;
                  const notiOtherUserId = userId;
                  const action = "project";
                  const notificationOrActivity = 1;
                  const actionId = null;
                  const { title, message } = msg.generateActivityCommenMessage(
                    checkUserID.name,
                    "",
                    "",
                    "ProjectUpdateDelete",
                  );
                  const titles = title;
                  const messages = message;
                  const actionJson = {
                    actionId: actionId,
                    action: action,
                    option: {
                      logoUrl: APP_LOGO,
                      redirectionUrl: {
                        webLink: APP_SITE_URL,
                        deepLink: APP_DEEP_LINK_URL,
                      },
                      imageUrl: "",
                      soundFile: "",
                    },
                    appType: "customer",
                  };
                  let notificationArr = [];

                  const notification =
                    await oneSignalHelperUser.getNotificationArrSingle(
                      SITE_DB_NAME,
                      notiUserId,
                      notiOtherUserId,
                      action,
                      actionId,
                      titles,
                      messages,
                      actionJson,
                      notificationOrActivity,
                    );

                  if (notification !== "NA") {
                    notificationArr.push(notification);
                  }
                  if (notificationArr.length > 0) {
                    notificationArr.push(notification);
                    await oneSignalHelperUser.oneSignalNotificationSendCall(
                      notificationArr,
                    );
                  }

                  const record = {
                    success: true,
                    msg: msg.msgProjectUpdateDeletedSuccess,
                  };

                  return res.status(200).json(record);
                }
              } catch (error) {
                logger.error("Database error in deleteProjectUpdate emp 3", {
                  error: error.message,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 3,
                };
                return res.status(500).json(record);
              }
            }
          } catch (error) {
            logger.error("Database error in deleteProjectUpdate emp 2", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in deleteProjectUpdate emp 1", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 1,
          };
          return res.status(500).json(record);
        }
      }
    },
  ],

  //====================================== Tanant-Task-Flow ===========================
  createTaskList: [
    body("name")
      .trim()
      .exists()
      .withMessage(msg.msgTaskListNameReqired)
      .notEmpty()
      .withMessage(msg.msgTaskListNameReqired),

    body("projectId")
      .trim()
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      } else {
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const data = req.body;
        try {
          const userId = req.CURRENT_USER_ID;
          if (!userId && userId === 0) {
            const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
            return res.status(200).json(record);
          }
          try {
            const checkUserID = await UserCommenService.checkUser(
              SITE_DB_NAME,
              userId,
            );
            if (checkUserID === "NA") {
              const record = {
                success: false,
                msg: msg.msgUserNotExist,
                key: 2,
              };
              return res.status(200).json(record);
            }
            const {
              projectId,
              listIcon,
              name,
              description,
              orderIndex,
              viewBy,
            } = data;
            try {
              const checTaskListName =
                await UserCommenService.checkTaskListName(SITE_DB_NAME, name);
              if (checTaskListName !== "NA") {
                const record = {
                  success: false,
                  msg: msg.msgTaskListAlreadyExist,
                  key: 1,
                };
                return res.status(200).json(record);
              }

              const checkProjectId = await UserCommenService.checkProjectId(
                SITE_DB_NAME,
                projectId,
              );

              if (checkProjectId === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgProjectIsNotExist,
                  key: 2,
                };
                return res.status(200).json(record);
              }
              try {
                const TaskListData = {
                  projectId: checkProjectId._id,
                  listIcon,
                  name,
                  description,
                  orderIndex,
                  viewBy,
                  createdBy: userId,
                };
                const createTaskList = await UserCommenService.createTaskList(
                  SITE_DB_NAME,
                  TaskListData,
                );
                if (createTaskList === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgCreateTaskListError,
                    key: 3,
                  };
                  return res.status(200).json(record);
                }
                const createTaskListId = createTaskList?._id;
                const taskDetails = await UserCommenService.getTaskList(
                  SITE_DB_NAME,
                  createTaskListId,
                );

                const APP_LOGO = process.env.APP_LOGO || "";
                const APP_SITE_URL = process.env.SITE_URL || "";
                const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                const notiUserId = userId;
                const notiOtherUserId = userId;
                const action = userId;
                const notificationOrActivity = 1;
                const actionId = null;
                const { title, message } = msg.generateActivityCommenMessage(
                  checkUserID.name,
                  taskDetails?.name,
                  "",
                  "TaskListCreate",
                );
                const titles = title;
                const messages = message;
                const actionJson = {
                  actionId: actionId,
                  action: action,
                  option: {
                    logoUrl: APP_LOGO,
                    redirectionUrl: {
                      webLink: APP_SITE_URL,
                      deepLink: APP_DEEP_LINK_URL,
                    },
                    imageUrl: "",
                    soundFile: "",
                  },
                  appType: "customer",
                };
                let notificationArr = [];

                const notification =
                  await oneSignalHelperUser.getNotificationArrSingle(
                    SITE_DB_NAME,
                    notiUserId,
                    notiOtherUserId,
                    action,
                    actionId,
                    titles,
                    messages,
                    actionJson,
                    notificationOrActivity,
                  );

                if (notification !== "NA") {
                  notificationArr.push(notification);
                }
                if (notificationArr.length > 0) {
                  notificationArr.push(notification);
                  await oneSignalHelperUser.oneSignalNotificationSendCall(
                    notificationArr,
                  );
                }
                const record = {
                  success: true,
                  msg: msg.msgTaskListCreatedSuccess,
                  data: {
                    taskList: taskDetails,
                  },
                };

                return res.status(200).json(record);
              } catch (error) {
                logger.error("Database error in createTaskList emp 5", {
                  error: error.message,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 4,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              logger.error("Database error in createTaskList emp 3", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 3,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in createTaskList emp 2", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createTaskList emp 1", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 1,
          };
          return res.status(500).json(record);
        }
      }
    },
  ],

  getAllTaskList: [
    query("projectId")
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),
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
      } else {
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        const userId = req.CURRENT_USER_ID;
        const userRoleName = req.CURRENT_USER?.roleName;
        const { projectId, deleteFlag } = req.query;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          if (!userId && userId === 0) {
            const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
            return res.status(200).json(record);
          } else {
            try {
              const checkUserID = await UserCommenService.checkUser(
                SITE_DB_NAME,
                userId,
              );
              if (checkUserID === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUserNotExist,
                  key: 2,
                };
                return res.status(200).json(record);
              }
              const checkProjectId = await UserCommenService.checkProjectId(
                SITE_DB_NAME,
                projectId,
              );
              if (checkProjectId === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgProjectIsNotExist,
                };
                return res.status(200).json(record);
              }
              try {
                const pagination = {
                  pageSize: parseInt(req.query.pageSize) || 10,
                  pageNumber: parseInt(req.query.pageNumber) || 1,
                };
                const taskListDetails = await UserCommenService.getAllTaskList(
                  SITE_DB_NAME,
                  Number(deleteFlag),
                  checkProjectId?._id,
                  pagination,
                  checkUserID,
                  userRoleName,
                );
                if (taskListDetails === "NA") {
                  const record = {
                    success: true,
                    msg: msg.msgDataFound,
                    data: {
                      taskList: [],
                    },
                  };
                  return res.status(200).json(record);
                }
                const record = {
                  success: true,
                  msg: msg.msgDataFound,
                  data: taskListDetails,
                };

                return res.status(200).json(record);
              } catch (error) {
                logger.error("Database error in getAllTaskList emp 3", {
                  error,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 4,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              logger.error("Database error in getAllTaskList emp 2", {
                error,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 2,
              };
              return res.status(500).json(record);
            }
          }
        } catch (error) {
          logger.error("Database error in getAllTaskList emp 1", {
            error,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 1,
          };
          return res.status(500).json(record);
        }
      }
    },
  ],

  updateTaskList: [
    query("taskListId")
      .trim()
      .exists()
      .withMessage(msg.msgTaskListIDReqired)
      .notEmpty()
      .withMessage(msg.msgTaskListIDReqired),

    body("name")
      .trim()
      .exists()
      .withMessage(msg.msgTaskListNameReqired)
      .notEmpty()
      .withMessage(msg.msgTaskListNameReqired),

    body("projectId")
      .trim()
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      } else {
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const data = req.body;
        try {
          const userId = req.CURRENT_USER_ID;
          if (!userId && userId === 0) {
            const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
            return res.status(200).json(record);
          }
          try {
            const checkUserID = await UserCommenService.checkUser(
              SITE_DB_NAME,
              userId,
            );
            if (checkUserID === "NA") {
              const record = {
                success: false,
                msg: msg.msgUserNotExist,
                key: 2,
              };
              return res.status(200).json(record);
            }
            const { taskListId } = req.query;
            const {
              projectId,
              listIcon,
              name,
              description,
              orderIndex,
              viewBy,
            } = data;
            try {
              const checkProjectId = await UserCommenService.checkProjectId(
                SITE_DB_NAME,
                projectId,
              );

              if (checkProjectId === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgProjectIsNotExist,
                  key: 2,
                };
                return res.status(200).json(record);
              }

              const checkTaskListId = await UserCommenService.checkTaskListId(
                SITE_DB_NAME,
                taskListId,
              );

              if (checkTaskListId === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgTaskListIdIsNotExist,
                  key: 2,
                };
                return res.status(200).json(record);
              }

              const checkTaskListUpdateName =
                await UserCommenService.checkTaskListUpdateName(
                  SITE_DB_NAME,
                  checkTaskListId._id,
                  name,
                );

              if (checkTaskListUpdateName !== "NA") {
                const record = {
                  success: false,
                  msg: msg.msgTaskListAlreadyExist,
                  key: 4,
                };
                return res.status(200).json(record);
              }
              try {
                const TaskListData = {
                  projectId: checkProjectId._id,
                  listIcon,
                  name,
                  description,
                  orderIndex,
                  viewBy,
                  createdById: userId,
                };
                const updateTaskList = await UserCommenService.updateTaskList(
                  SITE_DB_NAME,
                  checkTaskListId._id,
                  TaskListData,
                );
                if (updateTaskList === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgUpdateTaskListError,
                    key: 3,
                  };
                  return res.status(200).json(record);
                }
                const taskDetails = await UserCommenService.getTaskList(
                  SITE_DB_NAME,
                  checkTaskListId._id,
                );

                const APP_LOGO = process.env.APP_LOGO || "";
                const APP_SITE_URL = process.env.SITE_URL || "";
                const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                const notiUserId = userId;
                const notiOtherUserId = userId;
                const action = "task";
                const notificationOrActivity = 1;
                const actionId = userId;
                const { title, message } = msg.generateActivityCommenMessage(
                  checkUserID.name,
                  checkTaskListId?.name,
                  "",
                  "TaskListUpdated",
                );
                const titles = title;
                const messages = message;
                const actionJson = {
                  actionId: actionId,
                  action: action,
                  option: {
                    logoUrl: APP_LOGO,
                    redirectionUrl: {
                      webLink: APP_SITE_URL,
                      deepLink: APP_DEEP_LINK_URL,
                    },
                    imageUrl: "",
                    soundFile: "",
                  },
                  appType: "customer",
                };
                let notificationArr = [];

                const notification =
                  await oneSignalHelperUser.getNotificationArrSingle(
                    SITE_DB_NAME,
                    notiUserId,
                    notiOtherUserId,
                    action,
                    actionId,
                    titles,
                    messages,
                    actionJson,
                    notificationOrActivity,
                  );

                if (notification !== "NA") {
                  notificationArr.push(notification);
                }
                if (notificationArr.length > 0) {
                  notificationArr.push(notification);
                  await oneSignalHelperUser.oneSignalNotificationSendCall(
                    notificationArr,
                  );
                }
                const record = {
                  success: true,
                  msg: msg.msgTaskListUpdateSuccess,
                  data: {
                    taskList: taskDetails,
                  },
                };

                return res.status(200).json(record);
              } catch (error) {
                logger.error("Database error in updateTaskList emp 5", {
                  error: error.message,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 4,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              logger.error("Database error in updateTaskList emp 3", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 3,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in updateTaskList emp 2", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in updateTaskList emp 1", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 1,
          };
          return res.status(500).json(record);
        }
      }
    },
  ],

  deleteTaskList: [
    query("taskListId")
      .exists()
      .withMessage(msg.msgTaskListIDReqired)
      .notEmpty()
      .withMessage(msg.msgTaskListIDReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      } else {
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          const userId = req.CURRENT_USER_ID;
          if (!userId && userId === 0) {
            const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
            return res.status(200).json(record);
          }
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
            };
            return res.status(200).json(record);
          }
          try {
            const { taskListId } = req.query;
            const checkTaskListId = await UserCommenService.checkTaskListId(
              SITE_DB_NAME,
              taskListId,
            );

            if (checkTaskListId === "NA") {
              const record = {
                success: false,
                msg: msg.msgTaskListIdIsNotExist,
                key: 2,
              };
              return res.status(200).json(record);
            } else {
              try {
                const taskList = await UserCommenService.deleteTaskList(
                  SITE_DB_NAME,
                  checkTaskListId._id,
                );

                if (taskList === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgTaskListDeleteError,
                    key: 3,
                  };
                  return res.status(200).json(record);
                } else {
                  const APP_LOGO = process.env.APP_LOGO || "";
                  const APP_SITE_URL = process.env.SITE_URL || "";
                  const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                  const notiUserId = userId;
                  const notiOtherUserId = userId;
                  const action = "task";
                  const notificationOrActivity = 1;
                  const actionId = null;
                  const { title, message } = msg.generateActivityCommenMessage(
                    checkUserID.name,
                    checkTaskListId?.name,
                    "",
                    "TaskListDelete",
                  );
                  const titles = title;
                  const messages = message;
                  const actionJson = {
                    actionId: actionId,
                    action: action,
                    option: {
                      logoUrl: APP_LOGO,
                      redirectionUrl: {
                        webLink: APP_SITE_URL,
                        deepLink: APP_DEEP_LINK_URL,
                      },
                      imageUrl: "",
                      soundFile: "",
                    },
                    appType: "customer",
                  };
                  let notificationArr = [];

                  const notification =
                    await oneSignalHelperUser.getNotificationArrSingle(
                      SITE_DB_NAME,
                      notiUserId,
                      notiOtherUserId,
                      action,
                      actionId,
                      titles,
                      messages,
                      actionJson,
                      notificationOrActivity,
                    );

                  if (notification !== "NA") {
                    notificationArr.push(notification);
                  }
                  if (notificationArr.length > 0) {
                    notificationArr.push(notification);
                    await oneSignalHelperUser.oneSignalNotificationSendCall(
                      notificationArr,
                    );
                  }

                  const record = {
                    success: true,
                    msg: msg.msgTaskListDeleteSuccess,
                  };

                  return res.status(200).json(record);
                }
              } catch (error) {
                logger.error("Database error in deleteTaskList emp 3", {
                  error: error.message,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 3,
                };
                return res.status(500).json(record);
              }
            }
          } catch (error) {
            logger.error("Database error in deleteTaskList emp 2", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in deleteTaskList emp 1", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 1,
          };
          return res.status(500).json(record);
        }
      }
    },
  ],

  createTask: [
    body("name")
      .trim()
      .exists()
      .withMessage(msg.msgTaskNameReqired)
      .notEmpty()
      .withMessage(msg.msgTaskNameReqired),

    body("projectId")
      .trim()
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),

    body("taskListId")
      .trim()
      .exists()
      .withMessage(msg.msgTaskListIDReqired)
      .notEmpty()
      .withMessage(msg.msgTaskListIDReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      } else {
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const data = req.body;
        try {
          const userId = req.CURRENT_USER_ID;
          const workspaceName = req.CURRENT_SITE_WORKSPACE?.workspaceName;
          const currentUserName = req.CURRENT_USER_NAME;
          if (!userId && userId === 0) {
            const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
            return res.status(200).json(record);
          }
          try {
            const checkUserID = await UserCommenService.checkUser(
              SITE_DB_NAME,
              userId,
            );
            if (checkUserID === "NA") {
              const record = {
                success: false,
                msg: msg.msgUserNotExist,
                key: 2,
              };
              return res.status(200).json(record);
            }
            const {
              projectId,
              taskListId,
              name,
              description,
              stageId,
              priority,
              taskStatus,
              startDate,
              dueDate,
              parentTaskId,
            } = data;
            try {
              const checkProjectId = await UserCommenService.checkProjectId(
                SITE_DB_NAME,
                projectId,
              );

              if (checkProjectId === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgProjectIsNotExist,
                  key: 2,
                };
                return res.status(200).json(record);
              }
              const checkTaskListId = await UserCommenService.checkTaskListId(
                SITE_DB_NAME,
                taskListId,
              );

              if (checkTaskListId === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgTaskListIdIsNotExist,
                  key: 2,
                };
                return res.status(200).json(record);
              }

              const taskNumber = parentTaskId
                ? await UserCommenService.checkSubTaskLastNumber(
                    SITE_DB_NAME,
                    parentTaskId,
                  )
                : await UserCommenService.checkTaskLastNumber(SITE_DB_NAME);
              if (taskNumber === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgTaskLastNumberIsNotFind,
                  key: 2,
                };
                return res.status(200).json(record);
              }

              const orderIndex =
                await UserCommenService.checkTaskOrderIndexLastNumber(
                  SITE_DB_NAME,
                  stageId,
                );
              if (orderIndex === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgTaskOrderIndexLastNumberIsNotFind,
                  key: 4,
                };
                return res.status(200).json(record);
              }
              const checkWorkflowStageId =
                await UserCommenService.checkWorkflowStageId(
                  SITE_DB_NAME,
                  checkProjectId.workflowId,
                  stageId,
                );
              if (checkWorkflowStageId === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgStageIsNotFind,
                  key: 2,
                };
                return res.status(200).json(record);
              }
              try {
                let files = [];

                if (!req.file) {
                  files = req?.files.map((file) => file?.key);
                } else if ("key" in req.file) {
                  const filename = req.file.key;
                  files = filename;
                } else {
                  files = req.folderName + "/" + req.file.filename;
                }

                let assignedTo = data.assignedTo;
                let estimateMinutes = data.estimateMinutes;
                let progress = data.progress;
                let followers = data.followers;
                let tags = data.tags;
                let reminders = data.reminders;

                if (typeof assignedTo === "string") {
                  assignedTo = JSON.parse(assignedTo);
                }

                if (typeof estimateMinutes === "string") {
                  estimateMinutes = JSON.parse(estimateMinutes);
                }

                if (typeof progress === "string") {
                  progress = JSON.parse(progress);
                }

                if (typeof followers === "string") {
                  followers = JSON.parse(followers);
                }

                if (typeof tags === "string") {
                  tags = JSON.parse(tags);
                }

                if (typeof reminders === "string") {
                  reminders = JSON.parse(reminders);
                }

                const TaskData = {
                  projectId: checkProjectId._id,
                  taskListId: checkTaskListId._id,
                  workflowId: checkProjectId.workflowId,
                  assignedTo,
                  taskNumber,
                  name,
                  description,
                  stageId,
                  priority,
                  taskStatus,
                  progress,
                  followers,
                  tags,
                  startDate,
                  dueDate,
                  estimateMinutes,
                  files,
                  reminders,
                  orderIndex,
                  createdById: userId,
                  parentTaskId: parentTaskId ? parentTaskId : null,
                };
                const createTask = await UserCommenService.createTask(
                  SITE_DB_NAME,
                  TaskData,
                );
                if (createTask === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgCreateTaskError,
                    key: 3,
                  };
                  return res.status(200).json(record);
                }
                const createTaskId = createTask?._id;

                let dependsOnTaskIds = data.dependsOnTaskIds;

                if (typeof dependsOnTaskIds === "string") {
                  dependsOnTaskIds = JSON.parse(dependsOnTaskIds);
                }

                if (dependsOnTaskIds && dependsOnTaskIds.length > 0) {
                  for (const depId of dependsOnTaskIds) {
                    const checkTask = await UserCommenService.checkTask(
                      SITE_DB_NAME,
                      depId,
                    );

                    if (checkTask === "NA") {
                      return res.status(200).json({
                        success: false,
                        msg: msg.msgTaskIsNotExist,
                        key: 2,
                      });
                    }

                    const dependencyData = {
                      taskId: createTaskId,
                      dependsOnTaskId: depId,
                    };

                    const taskDependency =
                      await UserCommenService.createTaskDependency(
                        SITE_DB_NAME,
                        dependencyData,
                      );

                    if (taskDependency === "NA") {
                      return res.status(200).json({
                        success: false,
                        msg: msg.msgCreateTaskDependencyError,
                        key: 3,
                      });
                    }
                  }
                }

                const taskDetails = await UserCommenService.getTask(
                  SITE_DB_NAME,
                  createTaskId,
                );

                try {
                  const siteURL =
                    `https://` +
                    req.CURRENT_SITE_WORKSPACE?.workspaceFullDomain;
                  const taskLink =
                    siteURL + "/project/viewproject/" + checkProjectId._id;
                  const taskName = taskDetails.name;
                  const assignedUsers = taskDetails.assignedUsers;
                  const projectCompanyId = taskDetails.project.companyId;
                  const languageId = assignedUsers.languageId || 0;
                  const mailFromName = process.env.MAIL_FROM_NAME;
                  const appName = process.env.APP_NAME;
                  const appLogo = process.env.APP_LOGO;
                  const TASK_PNG = process.env.TASK_PNG;
                  const borderBackground = process.env.BORDERBACKGROUND;
                  const footerGreeting = msg.mailFooterGreeting[languageId];
                  const footerDescription =
                    msg.mailFooterDescription[languageId];
                  const footerBackground = process.env.FOOTERBACKGROUND;

                  const checkComapny = await UserCommenService.checkCompany(
                    SITE_DB_NAME,
                    projectCompanyId,
                  );
                  if (checkComapny === "NA") {
                    const record = {
                      success: false,
                      msg: msg.msgCompanyIsNotExist,
                      key: 4,
                    };
                    return res.status(200).json(record);
                  }

                  if (assignedUsers && assignedUsers.length > 0) {
                    for (const user of assignedUsers) {
                      const mailEmail = user.email;
                      const languageId = user.languageId || 0;
                      const mailName =
                        await CommenFunction.capitalizeFirstLetter(user.name);

                      const mailSubject = msg.mailSubjectInvite(
                        currentUserName,
                        taskName,
                        workspaceName,
                      )[languageId];

                      const mailHeading = msg.mailHeadingTask(
                        currentUserName,
                        taskName,
                        workspaceName,
                      )[languageId];

                      const headerGreeting =
                        msg.mailHeaderGreetingInvite[languageId];

                      const bodyData = {
                        appName,
                        taskLink,
                        TASK_PNG,
                        footerBackground,
                        currentUserName,
                        workspaceName,
                        userDetails: {
                          name: mailName,
                          email: mailEmail,
                          dueDate: taskDetails.dueDate,
                          priority: taskDetails.priority,
                          taskListName: taskDetails.taskList.name || "Inbox",
                          projectName: taskDetails.project.name,
                          companyName: checkComapny.companyName || "Unknown",
                        },
                      };

                      const mailContent =
                        msg.mailContentTask(bodyData)[languageId];

                      const mailBody = await MailFunctions.mailBodyData({
                        appName: appName,
                        appLogo: appLogo,
                        borderBackground: borderBackground,
                        mailHeading: mailHeading,
                        headerGreeting: headerGreeting,
                        name: mailName,
                        mailContent: mailContent,
                        footerGreeting: footerGreeting,
                        footerBackground: footerBackground,
                        footerDescription: footerDescription,
                      });

                      const responce = await MailFunctions.mailSend(
                        mailEmail,
                        mailFromName,
                        mailSubject,
                        mailBody,
                      );
                      if (!responce) {
                        const record = {
                          success: false,
                          msg: msg.msgTaskMailSendError,
                        };
                        return res.status(200).json(record);
                      }

                      // const record = {
                      //   success: true,
                      //   msg: msg.msgTaskCreatedSuccess,
                      //   data: {
                      //     task: taskDetails,
                      //     responce: responce,
                      //   },
                      //   key: 1,
                      // };
                      // return res.status(200).json(record);
                    }
                  }
                  const APP_LOGO = process.env.APP_LOGO || "";
                  const APP_SITE_URL = process.env.SITE_URL || "";
                  const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                  const action = "task";
                  const notificationOrActivity = 1;
                  const actorId = userId;
                  const targetTaskId = createTask._id;

                  const { title, message } = msg.generateActivityCommenMessage(
                    checkUserID.name,
                    taskDetails?.name,
                    "",
                    "TaskCreate",
                  );
                  const titles = title;
                  const messages = message;
                  const actionId = targetTaskId;
                  const notiUserId = actorId;
                  const notiOtherUserId = targetTaskId;
                  const actionJson = {
                    actionId: actionId,
                    action: action,
                    option: {
                      logoUrl: APP_LOGO,
                      redirectionUrl: {
                        webLink: APP_SITE_URL,
                        deepLink: APP_DEEP_LINK_URL,
                      },
                      imageUrl: "",
                      soundFile: "",
                    },
                    appType: "customer",
                  };
                  let notificationArr = [];

                  const notification =
                    await oneSignalHelperUser.getNotificationArrSingle(
                      SITE_DB_NAME,
                      notiUserId,
                      notiOtherUserId,
                      action,
                      actionId,
                      titles,
                      messages,
                      actionJson,
                      notificationOrActivity,
                    );

                  if (notification !== "NA") {
                    notificationArr.push(notification);
                  }
                  if (notificationArr.length > 0) {
                    notificationArr.push(notification);
                    await oneSignalHelperUser.oneSignalNotificationSendCall(
                      notificationArr,
                    );
                  }
                  const record = {
                    success: true,
                    msg: msg.msgTaskCreatedSuccess,
                    data: {
                      task: taskDetails,
                    },
                  };

                  return res.status(200).json(record);
                } catch (error) {
                  logger.error("mail error key 2", {
                    error: error.message,
                  });
                  const record = {
                    success: false,
                    msg: msg.msgServerError,
                    key: error,
                  };
                  return res.status(500).json(record);
                }
              } catch (error) {
                logger.error("Database error in createTask emp 5", {
                  error: error.message,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 4,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              logger.error("Database error in createTask emp 3", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 3,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in createTask emp 2", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createTask emp 1", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 1,
          };
          return res.status(500).json(record);
        }
      }
    },
  ],

  getAllTask: [
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.msgUnitIdReqired)
      .notEmpty()
      .withMessage(msg.msgUnitIdReqired),

    query("projectId")
      .trim()
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const userId = req.CURRENT_USER_ID;
      const userRoleName = req.CURRENT_USER?.roleName;
      const { deleteFlag, projectId } = req.query;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkProjectId = await UserCommenService.checkProjectId(
            SITE_DB_NAME,
            projectId,
          );
          if (checkProjectId === "NA") {
            const record = {
              success: false,
              msg: msg.msgProjectIsNotExist,
            };
            return res.status(200).json(record);
          }
          try {
            const pagination = {
              pageSize: parseInt(req.query.pageSize) || 10,
              pageNumber: parseInt(req.query.pageNumber) || 1,
            };
            // Task pagination
            const taskPagination = {
              taskPageSize:
                parseInt(req.query.taskPageSize || req.query.pageTaskSize) ||
                10,
              taskPageNumber:
                parseInt(
                  req.query.taskPageNumber || req.query.pageTaskNumber,
                ) || 1,
            };
            const taskListId = req.query.taskListId || null;
            const taskStatus = req.query.taskStatus;
            const search = req.query.search || "";
            const byUser = req.query.userId || "";
            const taskDetails = await UserCommenService.getAllTask(
              SITE_DB_NAME,
              Number(deleteFlag),
              checkProjectId._id,
              pagination,
              search,
              taskPagination,
              taskListId,
              taskStatus,
              byUser,
              userId,
              userRoleName,
            );

            if (taskDetails === "NA") {
              const record = {
                success: true,
                msg: msg.msgDataFound,
                data: {
                  alltasklistwithtasks: [],
                },
              };
              return res.status(200).json(record);
            }
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                alltasklistwithtasks: taskDetails,
              },
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in getAllTask emp 3", {
              error,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in getAllTask emp 2", {
            error,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in getAllTask emp 1", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  getMyWork: [
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
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const userId = req.CURRENT_USER_ID;
      const userRoleName = req.CURRENT_USER?.roleName;
      const { deleteFlag } = req.query;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const pagination = {
            pageSize: parseInt(req.query.pageSize) || 10,
            pageNumber: parseInt(req.query.pageNumber) || 1,
          };
          // Task pagination
          const taskPagination = {
            taskPageSize:
              parseInt(req.query.taskPageSize || req.query.pageTaskSize) || 10,
            taskPageNumber:
              parseInt(req.query.taskPageNumber || req.query.pageTaskNumber) ||
              1,
          };
          const taskStatus = req.query.taskStatus;
          const search = req.query.search || "";
          const bucket = req.query.bucket || "";
          const projectId = req.query.projectId;
          const excludeBlocked = req.query.excludeBlocked === "true";
          const includeStartedToday = req.query.includeStartedToday === "true";
          const excludeAssignedToTeams =
            req.query.excludeAssignedToTeams === "true";
          const excludeSubTasks = req.query.excludeSubTasks === "true";
          const tags = req.query.tags
            ? String(req.query.tags)
                .split(",")
                .map((t) => t.trim())
            : null;
          const priority = req.query.priority || null; // none | low | medium | high
          const stageId = req.query.stageId || null;
          const taskDetails = await UserCommenService.getMyWork(
            SITE_DB_NAME,
            Number(deleteFlag),
            projectId,
            pagination,
            search,
            taskPagination,
            taskStatus,
            userId,
            userRoleName,
            {
              excludeBlocked,
              includeStartedToday,
              excludeAssignedToTeams,
              excludeSubTasks,
              tags,
              priority,
              stageId,
              bucket,
            },
          );

          if (taskDetails === "NA") {
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                myWork: [],
              },
            };
            return res.status(200).json(record);
          }
          const record = {
            success: true,
            msg: msg.msgDataFound,
            data: {
              myWork: taskDetails,
            },
          };

          return res.status(200).json(record);
        } catch (error) {
          logger.error("Database error in getMyWork emp 3", {
            error,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 3,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in getMyWork emp 1", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  getViewTask: [
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.msgUnitIdReqired)
      .notEmpty()
      .withMessage(msg.msgUnitIdReqired),

    query("taskId")
      .trim()
      .exists()
      .withMessage(msg.msgTaskIDReqired)
      .notEmpty()
      .withMessage(msg.msgTaskIDReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const userId = req.CURRENT_USER_ID;
      const { deleteFlag, taskId } = req.query;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          const checkTask = await UserCommenService.checkTask(
            SITE_DB_NAME,
            taskId,
          );
          if (checkTask === "NA") {
            const record = {
              success: false,
              msg: msg.msgTaskIsNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            // Task pagination
            const taskPagination = {
              taskPageSize:
                parseInt(req.query.taskPageSize || req.query.pageTaskSize) ||
                10,
              taskPageNumber:
                parseInt(
                  req.query.taskPageNumber || req.query.pageTaskNumber,
                ) || 1,
            };
            const subTaskId = req.query.subTaskId || null;
            const taskDetails = await UserCommenService.getViewTask(
              SITE_DB_NAME,
              Number(deleteFlag),
              checkTask._id,
              taskPagination,
              subTaskId,
            );

            if (taskDetails === "NA") {
              const record = {
                success: true,
                msg: msg.msgDataFound,
                data: {
                  taskDetails: [],
                },
              };
              return res.status(200).json(record);
            }
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                taskDetails: taskDetails,
              },
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in getViewTask emp 3", {
              error,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in getViewTask emp 2", {
            error,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in getViewTask emp 1", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateTaskField: [
    query("taskId")
      .trim()
      .exists()
      .withMessage(msg.msgTaskIDReqired)
      .notEmpty()
      .withMessage(msg.msgTaskIDReqired),
    body("fieldName")
      .trim()
      .exists()
      .withMessage(msg.msgFieldNameReqired)
      .notEmpty()
      .withMessage(msg.msgFieldNameReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
      const CURRENT_USER_ID = req?.CURRENT_USER_ID;
      const CURRENT_USER = req?.CURRENT_USER;
      if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
        const record = {
          success: false,
          msg: msg.msgDBNotIdentified,
          key: 4,
        };
        return res.status(200).json(record);
      }
      let { fieldName, value } = req.body;
      const { taskId } = req.query;

      const checkTask = await UserCommenService.checkTask(SITE_DB_NAME, taskId);
      if (checkTask === "NA") {
        const record = {
          success: false,
          msg: msg.msgTaskIsNotExist,
          key: 2,
        };
        return res.status(200).json(record);
      }
      try {
        const updateData = { lastUpdatedBy: CURRENT_USER_ID };
        const updateTask = await UserCommenService.updateTask(
          SITE_DB_NAME,
          checkTask._id,
          updateData,
        );
        if (updateTask === "NA") {
          const record = {
            success: false,
            msg: msg.msgUpdateTaskError,
            key: 2,
          };
          return res.status(200).json(record);
        }
        try {
          if (
            [
              "assignedTo",
              "estimateMinutes",
              "progress",
              "followers",
              "tags",
              "reminders",
            ].includes(fieldName)
          ) {
            try {
              if (typeof value === "string") value = JSON.parse(value);
            } catch (err) {
              return res.status(200).json({
                success: false,
                msg: `Invalid JSON for ${fieldName}`,
              });
            }
          }

          let taskData = {};
          let shouldUpdate = true;

          if (fieldName === "files") {
            let newFiles = [];
            if (req?.files?.length > 0) {
              newFiles = req.files.map((file) => file.key);
            } else if (req.file?.key) {
              newFiles = [req.file.key];
            } else if ("folderName" in req && req.file) {
              newFiles = [req.folderName + "/" + req.file.filename];
            }
            const oldFiles = checkTask.files || [];
            taskData[fieldName] = [...oldFiles, ...newFiles];
            // taskData[fieldName] = newFiles.length > 0 ? newFiles : oldFiles;
          } else if (fieldName === "startduedate") {
            taskData = value;
          } else if (fieldName === "stageAndOrder") {
            const stageId = req.body["value.stageId"];
            const orderIndex = Number(req.body["value.orderIndex"]);

            if (!stageId || isNaN(orderIndex)) {
              return res.status(200).json({
                success: false,
                msg: "stageId or orderIndex missing",
              });
            }

            const reorderResult = await UserCommenService.reorderTaskInStage(
              SITE_DB_NAME,
              checkTask._id,
              stageId,
              orderIndex,
              CURRENT_USER_ID,
            );

            if (reorderResult === "NA") {
              return res.status(200).json({
                success: false,
                msg: msg.msgUpdateTaskError,
                key: 3,
              });
            }

            shouldUpdate = false; // 🔥 VERY IMPORTANT
          } else {
            taskData[fieldName] = value;
          }

          if (shouldUpdate) {
            const updateTaskDetails = await UserCommenService.updateTaskField(
              SITE_DB_NAME,
              checkTask._id,
              taskData,
            );

            if (updateTaskDetails === "NA") {
              const record = {
                success: false,
                msg: msg.msgUpdateTaskError,
                key: 3,
              };
              return res.status(200).json(record);
            }
          }

          const taskDetails = await UserCommenService.getTaskFieldDetails(
            SITE_DB_NAME,
            checkTask._id,
            fieldName,
          );

          if (taskDetails === "NA") {
            const record = {
              success: true,
              msg: msg.msgDataFound,
              data: {
                task: [],
              },
            };
            return res.status(200).json(record);
          }

          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const action = "task";
          const notificationOrActivity = 1;
          const actorId = CURRENT_USER_ID;
          const targetTaskId = checkTask._id || req.query.taskId || null;
          const { title, message } = msg.generateActivityCommenMessage(
            CURRENT_USER.name,
            checkTask.name,
            "",
            "TaskUpdated",
          );
          const titles = title;
          const messages = message;
          const actionId = targetTaskId;
          const notiUserId = actorId;
          const notiOtherUserId = targetTaskId;
          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };
          let notificationArr = [];

          const notification =
            await oneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson,
              notificationOrActivity,
            );

          if (notification !== "NA") {
            notificationArr.push(notification);
          }
          if (notificationArr.length > 0) {
            notificationArr.push(notification);
            await oneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr,
            );
          }
          const record = {
            success: true,
            msg: msg.msgTaskUpdatedSuccess,
            data: { task: taskDetails },
          };

          return res.status(200).json(record);
        } catch (error) {
          logger.error("Database error in updateTaskField emp 4", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 4,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateTaskField emp 3", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 3,
        };
        return res.status(500).json(record);
      }
    },
  ],

  removeFileTask: [
    query("taskId")
      .exists()
      .withMessage(msg.msgTaskIDReqired)
      .notEmpty()
      .withMessage(msg.msgTaskIDReqired),
    body("files")
      .exists()
      .withMessage(msg.msgTaskFileReqired)
      .notEmpty()
      .withMessage(msg.msgTaskFileReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }

      const { taskId } = req.query;
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        const userName = req.CURRENT_USER?.name;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          const { files } = data;
          try {
            const checkTask = await UserCommenService.checkTask(
              SITE_DB_NAME,
              taskId,
            );
            if (checkTask === "NA") {
              const record = {
                success: false,
                msg: msg.msgTaskIsNotExist,
                key: 2,
              };
              return res.status(200).json(record);
            }
            const removeFileTaskData = files;

            const removeFileTask = await UserCommenService.removeFileTask(
              SITE_DB_NAME,
              checkTask._id,
              removeFileTaskData,
            );
            if (removeFileTask === "NA") {
              const record = {
                success: false,
                msg: msg.msgRemoveFileTaskError,
              };
              return res.status(200).json(record);
            }
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "task";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetTaskId =
              checkTask._id || req.query.targetTaskId || null;
            const { title, message } = msg.generateActivityCommenMessage(
              userName,
              checkTask.name,
              "",
              "TaskFileRomve",
            );
            const titles = title;
            const messages = message;
            const actionId = targetTaskId;
            const notiUserId = actorId;
            const notiOtherUserId = targetTaskId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgRemoveFileTaskSuccess,
            };
            return res.status(200).json(record);
          } catch (error) {
            console.log("database error key 3", error);
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = { success: false, msg: msg.msgServerError, key: 1 };
        return res.status(500).json(record);
      }
    },
  ],

  updateTask: [
    query("taskId")
      .trim()
      .exists()
      .withMessage(msg.msgTaskIDReqired)
      .notEmpty()
      .withMessage(msg.msgTaskIDReqired),
    body("name")
      .trim()
      .exists()
      .withMessage(msg.msgTaskNameReqired)
      .notEmpty()
      .withMessage(msg.msgTaskNameReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
      const CURRENT_USER_ID = req?.CURRENT_USER_ID;
      const CURRENT_USER = req?.CURRENT_USER;
      const userId = req.CURRENT_USER_ID;
      if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
        const record = {
          success: false,
          msg: msg.msgDBNotIdentified,
          key: 4,
        };
        return res.status(200).json(record);
      }
      const data = req.body;
      let {
        name,
        description,
        dueDate,
        priority,
        stageId,
        startDate,
        taskStatus,
        parentTaskId,
      } = req.body;
      const { taskId } = req.query;

      const checkTask = await UserCommenService.checkTask(SITE_DB_NAME, taskId);
      if (checkTask === "NA") {
        const record = {
          success: false,
          msg: msg.msgTaskIsNotExist,
          key: 2,
        };
        return res.status(200).json(record);
      }

      try {
        let files = [];

        if (!req.file) {
          files = req?.files.map((file) => file?.key);
        } else if ("key" in req.file) {
          const filename = req.file.key;
          files = filename;
        } else {
          files = req.folderName + "/" + req.file.filename;
        }

        let assignedTo = data.assignedTo;
        let estimateMinutes = data.estimateMinutes;
        let progress = data.progress;
        let followers = data.followers;
        let tags = data.tags;
        let reminders = data.reminders;

        if (typeof assignedTo === "string") {
          assignedTo = JSON.parse(assignedTo);
        }

        if (typeof estimateMinutes === "string") {
          estimateMinutes = JSON.parse(estimateMinutes);
        }

        if (typeof progress === "string") {
          progress = JSON.parse(progress);
        }

        if (typeof followers === "string") {
          followers = JSON.parse(followers);
        }

        if (typeof tags === "string") {
          tags = JSON.parse(tags);
        }

        if (typeof reminders === "string") {
          reminders = JSON.parse(reminders);
        }

        const TaskData = {
          assignedTo,
          name,
          description,
          stageId,
          priority,
          taskStatus,
          progress,
          followers,
          tags,
          startDate,
          dueDate,
          estimateMinutes,
          files,
          reminders,
          lastUpdatedBy: userId,
          parentTaskId: parentTaskId ? parentTaskId : null,
        };

        const updateTaskDetails = await UserCommenService.updateTask(
          SITE_DB_NAME,
          checkTask._id,
          TaskData,
        );
        if (updateTaskDetails === "NA") {
          const record = {
            success: false,
            msg: msg.msgUpdateTaskError,
            key: 3,
          };
          return res.status(200).json(record);
        }
        const taskDetails = await UserCommenService.getTask(
          SITE_DB_NAME,
          checkTask._id,
        );

        let dependsOnTaskIds = data.dependsOnTaskIds;

        if (typeof dependsOnTaskIds === "string") {
          dependsOnTaskIds = JSON.parse(dependsOnTaskIds);
        }

        if (dependsOnTaskIds && dependsOnTaskIds.length > 0) {
          for (const depId of dependsOnTaskIds) {
            const checkTask = await UserCommenService.checkTask(
              SITE_DB_NAME,
              depId,
            );

            if (checkTask === "NA") {
              return res.status(200).json({
                success: false,
                msg: msg.msgTaskIsNotExist,
                key: 2,
              });
            }

            const dependencyData = {
              taskId: createTaskId,
              dependsOnTaskId: depId,
            };

            const taskDependency = await UserCommenService.createTaskDependency(
              SITE_DB_NAME,
              dependencyData,
            );

            if (taskDependency === "NA") {
              return res.status(200).json({
                success: false,
                msg: msg.msgCreateTaskDependencyError,
                key: 3,
              });
            }
          }
        }

        if (taskDetails === "NA") {
          const record = {
            success: true,
            msg: msg.msgDataFound,
            data: {
              task: [],
            },
          };
          return res.status(200).json(record);
        }

        const APP_LOGO = process.env.APP_LOGO || "";
        const APP_SITE_URL = process.env.SITE_URL || "";
        const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
        const action = "task";
        const notificationOrActivity = 1;
        const actorId = CURRENT_USER_ID;
        const targetTaskId = checkTask._id || req.query.taskId || null;
        const { title, message } = msg.generateActivityCommenMessage(
          CURRENT_USER.name,
          checkTask.name,
          "",
          "TaskUpdated",
        );
        const titles = title;
        const messages = message;
        const actionId = targetTaskId;
        const notiUserId = actorId;
        const notiOtherUserId = targetTaskId;
        const actionJson = {
          actionId: actionId,
          action: action,
          option: {
            logoUrl: APP_LOGO,
            redirectionUrl: {
              webLink: APP_SITE_URL,
              deepLink: APP_DEEP_LINK_URL,
            },
            imageUrl: "",
            soundFile: "",
          },
          appType: "customer",
        };
        let notificationArr = [];

        const notification = await oneSignalHelperUser.getNotificationArrSingle(
          SITE_DB_NAME,
          notiUserId,
          notiOtherUserId,
          action,
          actionId,
          titles,
          messages,
          actionJson,
          notificationOrActivity,
        );

        if (notification !== "NA") {
          notificationArr.push(notification);
        }
        if (notificationArr.length > 0) {
          notificationArr.push(notification);
          await oneSignalHelperUser.oneSignalNotificationSendCall(
            notificationArr,
          );
        }
        const record = {
          success: true,
          msg: msg.msgTaskUpdatedSuccess,
          data: { task: taskDetails },
        };

        return res.status(200).json(record);
      } catch (error) {
        logger.error("Database error in updateTask emp 4", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 4,
        };
        return res.status(500).json(record);
      }
    },
  ],

  editTaskCustomField: [
    body("taskId")
      .exists()
      .withMessage(msg.msgTaskIDReqired)
      .notEmpty()
      .withMessage(msg.msgTaskIDReqired),
    body("keyName")
      .exists()
      .withMessage(msg.msgTaskKeyNameReqired)
      .notEmpty()
      .withMessage(msg.msgTaskKeyNameReqired),
    body("value")
      .exists()
      .withMessage(msg.msgTaskCustomFieldValueReqired)
      .notEmpty()
      .withMessage(msg.msgTaskCustomFieldValueReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        const userName = req.CURRENT_USER?.name;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          const { taskId, keyName, value } = data;
          try {
            const checkTask = await UserCommenService.checkTask(
              SITE_DB_NAME,
              taskId,
            );
            if (checkTask === "NA") {
              const record = {
                success: false,
                msg: msg.msgTaskIsNotExist,
                key: 2,
              };
              return res.status(200).json(record);
            }
            const updateTaskData = {
              [`customFields.${keyName}.value`]: value,
            };

            const updateTaskCompany =
              await UserCommenService.updateTaskCustomField(
                SITE_DB_NAME,
                checkTask._id,
                updateTaskData,
              );
            if (updateTaskCompany === "NA") {
              const record = {
                success: false,
                msg: msg.msgTaskCustomFieldUpdateError,
              };
              return res.status(200).json(record);
            }

            const taskDetails = await UserCommenService.getTaskCustomField(
              SITE_DB_NAME,
              checkTask._id,
            );
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "task";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetTaskId =
              checkTask._id || req.query.targetTaskId || null;
            const { title, message } = msg.generateActivityCommenMessage(
              userName,
              taskDetails.name,
              "",
              "TaskUpdatedCustomField",
            );
            const titles = title;
            const messages = message;
            const actionId = targetTaskId;
            const notiUserId = actorId;
            const notiOtherUserId = targetTaskId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgTaskCustomFieldSuccess,
              data: { task: taskDetails },
            };
            return res.status(200).json(record);
          } catch (error) {
            console.log("database error key 3", error);
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = { success: false, msg: msg.msgServerError, key: 1 };
        return res.status(500).json(record);
      }
    },
  ],

  updateTaskTags: [
    query("taskId")
      .exists()
      .withMessage(msg.msgTaskIDReqired)
      .notEmpty()
      .withMessage(msg.msgTaskIDReqired),

    body("tags")
      .trim()
      .exists()
      .withMessage(msg.msgTagIdReqired)
      .notEmpty()
      .withMessage(msg.msgTagIdReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const data = req.body;
      const { taskId } = req.query;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            let { tags } = data;

            const checkTask = await UserCommenService.checkTask(
              SITE_DB_NAME,
              taskId,
            );
            if (checkTask === "NA") {
              const record = {
                success: false,
                msg: msg.msgTaskIsNotExist,
                key: 2,
              };
              return res.status(200).json(record);
            }
            try {
              const TaskData = {
                tags,
              };
              const updateTask = await UserCommenService.updateTask(
                SITE_DB_NAME,
                checkTask._id,
                TaskData,
              );
              if (updateTask === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUpdateTaskTagsError,
                  key: 5,
                };
                return res.status(200).json(record);
              }
              const updateTaskId = checkTask?._id;
              const taskDetails = await UserCommenService.getTaskTags(
                SITE_DB_NAME,
                updateTaskId,
              );

              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const action = "task";
              const notificationOrActivity = 1;
              const actorId = userId;
              const targetTaskId = checkTask._id || req.query.taskId || null;
              const { title, message } = msg.generateActivityCommenMessage(
                checkUserID.name,
                checkTask?.name,
                "",
                "TaskTagsUpdated",
              );
              const titles = title;
              const messages = message;
              const actionId = targetTaskId;
              const notiUserId = actorId;
              const notiOtherUserId = targetTaskId;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];

              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }
              const record = {
                success: true,
                msg: msg.msgTaskTagsUpdatedSuccess,
                data: { tags: taskDetails.tags },
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in updateTaskTags emp 5", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 5,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in updateTaskTags emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in updateTaskTags emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateTaskTags emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  deleteTask: [
    query("taskId")
      .exists()
      .withMessage(msg.msgTaskIDReqired)
      .notEmpty()
      .withMessage(msg.msgTaskIDReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      } else {
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          const userId = req.CURRENT_USER_ID;
          if (!userId && userId === 0) {
            const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
            return res.status(200).json(record);
          }
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
            };
            return res.status(200).json(record);
          }
          try {
            const { taskId } = req.query;

            const checkTask = await UserCommenService.checkTask(
              SITE_DB_NAME,
              taskId,
            );
            if (checkTask === "NA") {
              const record = {
                success: false,
                msg: msg.msgTaskIsNotExist,
                key: 2,
              };
              return res.status(200).json(record);
            } else {
              try {
                const task = await UserCommenService.deleteTask(
                  SITE_DB_NAME,
                  checkTask._id,
                );

                if (task === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgTaskDeleteError,
                    key: 3,
                  };
                  return res.status(200).json(record);
                } else {
                  const APP_LOGO = process.env.APP_LOGO || "";
                  const APP_SITE_URL = process.env.SITE_URL || "";
                  const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                  const action = "task";
                  const notificationOrActivity = 1;
                  const actorId = userId;
                  const targetTaskId =
                    checkTask._id || req.query.taskId || null;
                  const { title, message } = msg.generateActivityCommenMessage(
                    checkUserID.name,
                    checkTask?.name,
                    "",
                    "TaskDelete",
                  );
                  const titles = title;
                  const messages = message;
                  const actionId = targetTaskId;
                  const notiUserId = actorId;
                  const notiOtherUserId = targetTaskId;
                  const actionJson = {
                    actionId: actionId,
                    action: action,
                    option: {
                      logoUrl: APP_LOGO,
                      redirectionUrl: {
                        webLink: APP_SITE_URL,
                        deepLink: APP_DEEP_LINK_URL,
                      },
                      imageUrl: "",
                      soundFile: "",
                    },
                    appType: "customer",
                  };
                  let notificationArr = [];

                  const notification =
                    await oneSignalHelperUser.getNotificationArrSingle(
                      SITE_DB_NAME,
                      notiUserId,
                      notiOtherUserId,
                      action,
                      actionId,
                      titles,
                      messages,
                      actionJson,
                      notificationOrActivity,
                    );

                  if (notification !== "NA") {
                    notificationArr.push(notification);
                  }
                  if (notificationArr.length > 0) {
                    notificationArr.push(notification);
                    await oneSignalHelperUser.oneSignalNotificationSendCall(
                      notificationArr,
                    );
                  }

                  const record = {
                    success: true,
                    msg: msg.msgTaskDeleteSuccess,
                  };

                  return res.status(200).json(record);
                }
              } catch (error) {
                logger.error("Database error in deleteTask emp 3", {
                  error: error.message,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 3,
                };
                return res.status(500).json(record);
              }
            }
          } catch (error) {
            logger.error("Database error in deleteTask emp 2", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in deleteTask emp 1", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 1,
          };
          return res.status(500).json(record);
        }
      }
    },
  ],

  updateTaskDependency: [
    query("taskDependencyId")
      .exists()
      .withMessage(msg.msgTaskDependencyIDReqired)
      .notEmpty()
      .withMessage(msg.msgTaskDependencyIDReqired),

    body("taskId")
      .exists()
      .withMessage(msg.msgTaskIDReqired)
      .notEmpty()
      .withMessage(msg.msgTaskIDReqired),

    body("dependsOnTaskId")
      .exists()
      .withMessage(msg.msgDependsOnTaskIdReqired)
      .notEmpty()
      .withMessage(msg.msgDependsOnTaskIdReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const { taskDependencyId } = req.query;
      const { taskId, dependsOnTaskId, type } = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkTaskDependencyId =
            await UserCommenService.checkTaskDependencyId(
              SITE_DB_NAME,
              taskDependencyId,
            );
          if (checkTaskDependencyId === "NA") {
            const record = {
              success: false,
              msg: msg.msgTaskDependencyNotExist,
              key: 1,
            };
            return res.status(200).json(record);
          }

          try {
            const checkUserID = await UserCommenService.checkUser(
              SITE_DB_NAME,
              userId,
            );
            if (checkUserID === "NA") {
              const record = {
                success: false,
                msg: msg.msgUserNotExist,
                key: 2,
              };
              return res.status(200).json(record);
            }
            try {
              const checkTask = await UserCommenService.checkTask(
                SITE_DB_NAME,
                taskId,
              );
              if (checkTask === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgTaskIsNotExist,
                  key: 3,
                };
                return res.status(200).json(record);
              }

              const checkDependencyTask = await UserCommenService.checkTask(
                SITE_DB_NAME,
                dependsOnTaskId,
              );

              if (checkDependencyTask === "NA") {
                return res.status(200).json({
                  success: false,
                  msg: msg.msgTaskDependencyIsNotExist,
                  key: 4,
                });
              }

              const dependencyData = {
                taskId: checkTask._id,
                dependsOnTaskId: checkDependencyTask._id,
                type,
              };

              const taskDependency =
                await UserCommenService.updateTaskDependency(
                  SITE_DB_NAME,
                  checkTaskDependencyId._id,
                  dependencyData,
                );

              if (taskDependency === "NA") {
                return res.status(200).json({
                  success: false,
                  msg: msg.msgUpdateTaskDependencyError,
                  key: 5,
                });
              }

              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const action = "task";
              const notificationOrActivity = 1;
              const actorId = userId;
              const targetTaskId = checkTask._id || req.body.taskId || null;
              const { title, message } = msg.generateActivityCommenMessage(
                checkUserID.name,
                checkTask?.name,
                "",
                "TaskDependencyUpdated",
              );
              const titles = title;
              const messages = message;
              const actionId = targetTaskId;
              const notiUserId = actorId;
              const notiOtherUserId = targetTaskId;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];

              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }
              const record = {
                success: true,
                msg: msg.msgTaskDependencyUpdatedSuccess,
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in updateTaskDependency emp 4", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 4,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in updateTaskDependency emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in updateTaskDependency emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateTaskDependency emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  createTaskDependency: [
    body("taskId")
      .exists()
      .withMessage(msg.msgTaskIDReqired)
      .notEmpty()
      .withMessage(msg.msgTaskIDReqired),

    body("dependsOnTaskId")
      .isArray({ min: 1 })
      .withMessage(msg.msgDependsOnTaskIdReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const { taskId, dependsOnTaskId, type } = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkUserID = await UserCommenService.checkUser(
            SITE_DB_NAME,
            userId,
          );
          if (checkUserID === "NA") {
            const record = {
              success: false,
              msg: msg.msgUserNotExist,
              key: 2,
            };
            return res.status(200).json(record);
          }
          try {
            const checkTask = await UserCommenService.checkTask(
              SITE_DB_NAME,
              taskId,
            );
            if (checkTask === "NA") {
              const record = {
                success: false,
                msg: msg.msgTaskIsNotExist,
                key: 3,
              };
              return res.status(200).json(record);
            }

            const createdDependencies = [];

            for (const depId of dependsOnTaskId) {
              const depTask = await UserCommenService.checkTask(
                SITE_DB_NAME,
                depId,
              );

              if (depTask === "NA") continue;

              const dependencyData = {
                taskId: checkTask._id,
                dependsOnTaskId: depTask._id,
                type,
                createdBy: userId,
              };

              const created = await UserCommenService.createTaskDependency(
                SITE_DB_NAME,
                dependencyData,
              );

              if (created !== "NA") {
                createdDependencies.push(created);
              }
            }

            if (createdDependencies.length === 0) {
              return res.status(200).json({
                success: false,
                msg: msg.msgTaskDependencyIsNotExist,
              });
            }

            // const dependencyData = {
            //   taskId: checkTask._id,
            //   validDependencies,
            //   type,
            // };

            // const taskDependency = await UserCommenService.createTaskDependency(
            //   SITE_DB_NAME,
            //   dependencyData
            // );

            // if (taskDependency === "NA") {
            //   return res.status(200).json({
            //     success: false,
            //     msg: msg.msgCreateTaskDependencyError,
            //     key: 4,
            //   });
            // }

            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "task";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetTaskId = checkTask._id || req.body.taskId || null;
            const { title, message } = msg.generateActivityCommenMessage(
              checkUserID.name,
              checkTask?.name,
              "",
              "TaskDependencyUpdated",
            );
            const titles = title;
            const messages = message;
            const actionId = targetTaskId;
            const notiUserId = actorId;
            const notiOtherUserId = targetTaskId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgCreateTaskDependencySuccess,
              taskDependency: createdDependencies,
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in createTaskDependency emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createTaskDependency emp 3", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 3,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in createTaskDependency emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  deleteTaskDependency: [
    query("taskDependencyId")
      .exists()
      .withMessage(msg.msgTaskDependencyIDReqired)
      .notEmpty()
      .withMessage(msg.msgTaskDependencyIDReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { taskDependencyId } = req.query;
          const checkTaskDependencyId =
            await UserCommenService.checkTaskDependencyId(
              SITE_DB_NAME,
              taskDependencyId,
            );
          if (checkTaskDependencyId === "NA") {
            const record = {
              success: false,
              msg: msg.msgTaskDependencyNotExist,
              key: 1,
            };
            return res.status(200).json(record);
          }
          try {
            const checkTask = await UserCommenService.checkTask(
              SITE_DB_NAME,
              checkTaskDependencyId.taskId,
            );
            if (checkTask === "NA") {
              const record = {
                success: false,
                msg: msg.msgTaskIsNotExist,
                key: 3,
              };
              return res.status(200).json(record);
            }
            try {
              const taskDependency =
                await UserCommenService.deleteTaskDependency(
                  SITE_DB_NAME,
                  checkTaskDependencyId._id,
                );

              if (taskDependency === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgTaskDependencyDeleteError,
                  key: 3,
                };
                return res.status(200).json(record);
              }
              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const action = "task";
              const notificationOrActivity = 1;
              const actorId = userId;
              const targetTaskId = checkTask._id || null;
              const { title, message } = msg.generateActivityCommenMessage(
                checkUserID.name,
                checkTask?.name,
                "",
                "TaskDependencyDelete",
              );
              const titles = title;
              const messages = message;
              const actionId = targetTaskId;
              const notiUserId = actorId;
              const notiOtherUserId = targetTaskId;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];

              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }

              const record = {
                success: true,
                msg: msg.msgTaskDependencyDeleteSuccess,
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in deleteTaskDependency emp 4", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 4,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in deleteTaskDependency emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in deleteTaskDependency emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in deleteTaskDependency emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  createCommentTask: [
    query("taskId")
      .exists()
      .withMessage(msg.msgTaskIDReqired)
      .notEmpty()
      .withMessage(msg.msgTaskIDReqired),

    body("message")
      .trim()
      .exists()
      .withMessage(msg.msgTaskMessageIsReqired)
      .notEmpty()
      .withMessage(msg.msgTaskMessageIsReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const { taskId } = req.query;
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        const userName = req.CURRENT_USER_NAME;
        const workspaceName = req.CURRENT_SITE_WORKSPACE?.workspaceName;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkTask = await UserCommenService.checkTask(
            SITE_DB_NAME,
            taskId,
          );
          if (checkTask === "NA") {
            const record = {
              success: false,
              msg: msg.msgTaskIsNotExist,
              key: 3,
            };
            return res.status(200).json(record);
          }
          try {
            const { message, visibilityType } = data;
            let files = [];

            if (!req.file) {
              files = req?.files.map((file) => file?.key);
            } else if ("key" in req.file) {
              const filename = req.file.key;
              files = filename;
            } else {
              files = req.folderName + "/" + req.file.filename;
            }

            let privacyPeopleIds = data.privacyPeopleIds;
            let notifyIds = data.notifyIds;

            if (typeof privacyPeopleIds === "string") {
              privacyPeopleIds = JSON.parse(privacyPeopleIds);
            }
            if (typeof notifyIds === "string") {
              notifyIds = JSON.parse(notifyIds);
            }
            const taskCommentData = {
              projectId: checkTask.projectId,
              taskId: checkTask._id,
              message,
              createdBy: userId,
              privacyPeopleIds,
              notifyIds,
              files,
              visibilityType,
            };

            const taskComment = await UserCommenService.createCommentTask(
              SITE_DB_NAME,
              taskCommentData,
            );

            if (taskComment === "NA") {
              return res.status(200).json({
                success: false,
                msg: msg.msgCreateTaskCommentError,
                key: 5,
              });
            }

            let notifyUsers = [];

            if (taskComment.notifyIds && taskComment.notifyIds.length > 0) {
              const checkUserID = await UserCommenService.checkNotifyUser(
                SITE_DB_NAME,
                notifyIds,
              );
              if (checkUserID === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUserNotExist,
                  key: 2,
                };
                return res.status(200).json(record);
              }

              notifyUsers = checkUserID;
            }

            const siteURL =
              `https://` + req.CURRENT_SITE_WORKSPACE?.workspaceFullDomain;
            const taskLink = siteURL + "/tasks/" + checkTask.taskNumber;
            const taskName = checkTask.name;
            const mailFromName = process.env.MAIL_FROM_NAME;
            const appName = process.env.APP_NAME;
            const appLogo = process.env.APP_LOGO;
            const TASK_PNG = process.env.TASK_PNG;
            const borderBackground = process.env.BORDERBACKGROUND;
            const footerBackground = process.env.FOOTERBACKGROUND;

            if (notifyUsers && notifyUsers.length > 0) {
              for (const user of notifyUsers) {
                const mailEmail = user.email;
                const languageId = user.languageId || 0;
                const footerGreeting = msg.mailFooterGreeting[languageId];
                const footerDescription = msg.mailFooterDescription[languageId];
                const mailName = await CommenFunction.capitalizeFirstLetter(
                  user.name,
                );

                const mailSubject = msg.mailSubjectInvite(
                  userName,
                  taskName,
                  workspaceName,
                )[languageId];

                const mailHeading = msg.mailHeadingTask(
                  userName,
                  taskName,
                  workspaceName,
                )[languageId];

                const headerGreeting = msg.mailHeaderGreetingInvite[languageId];

                const bodyData = {
                  appName,
                  taskLink,
                  TASK_PNG,
                  footerBackground,
                  userName,
                  workspaceName,
                  userDetails: {
                    name: mailName,
                    email: mailEmail,
                    taskName: taskName || "Inbox",
                  },
                };

                const mailContent =
                  msg.mailContentTaskComment(bodyData)[languageId];

                const mailBody = await MailFunctions.mailBodyData({
                  appName: appName,
                  appLogo: appLogo,
                  borderBackground: borderBackground,
                  mailHeading: mailHeading,
                  headerGreeting: headerGreeting,
                  name: mailName,
                  mailContent: mailContent,
                  footerGreeting: footerGreeting,
                  footerBackground: footerBackground,
                  footerDescription: footerDescription,
                });

                const responce = await MailFunctions.mailSend(
                  mailEmail,
                  mailFromName,
                  mailSubject,
                  mailBody,
                );
                if (!responce) {
                  const record = {
                    success: false,
                    msg: msg.msgTaskMailSendError,
                  };
                  return res.status(200).json(record);
                }
              }
            }

            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "task";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetTaskId = checkTask._id || req.body.taskId || null;
            const { title, message: activityMessage } =
              msg.generateActivityCommenMessage(
                userId.name,
                checkTask?.name,
                "",
                "TaskCommentAdd",
              );
            const titles = title;
            const messages = activityMessage;
            const actionId = targetTaskId;
            const notiUserId = actorId;
            const notiOtherUserId = targetTaskId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgCreateTaskCommentSuccess,
              taskCommnet: taskComment,
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in createCommentTask emp 4", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 4,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createCommentTask emp 3", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 3,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in createCommentTask emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateCommentTask: [
    query("taskCommentId")
      .exists()
      .withMessage(msg.msgTaskCommentIDReqired)
      .notEmpty()
      .withMessage(msg.msgTaskCommentIDReqired),

    body("message")
      .trim()
      .exists()
      .withMessage(msg.msgTaskMessageIsReqired)
      .notEmpty()
      .withMessage(msg.msgTaskMessageIsReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const { taskCommentId } = req.query;
      const data = req.body;
      try {
        const userId = req.CURRENT_USER_ID;
        const userName = req.CURRENT_USER_NAME;
        const workspaceName = req.CURRENT_SITE_WORKSPACE?.workspaceName;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkTaskComment = await UserCommenService.checkTaskComment(
            SITE_DB_NAME,
            taskCommentId,
          );
          if (checkTaskComment === "NA") {
            const record = {
              success: false,
              msg: msg.msgTaskCommentIsNotExist,
              key: 3,
            };
            return res.status(200).json(record);
          }
          const checkTask = await UserCommenService.checkTask(
            SITE_DB_NAME,
            checkTaskComment.taskId,
          );
          if (checkTask === "NA") {
            const record = {
              success: false,
              msg: msg.msgTaskIsNotExist,
              key: 3,
            };
            return res.status(200).json(record);
          }
          try {
            const { message, visibilityType } = data;
            let files = [];

            if (!req.file) {
              files = req?.files.map((file) => file?.key);
            } else if ("key" in req.file) {
              const filename = req.file.key;
              files = filename;
            } else {
              files = req.folderName + "/" + req.file.filename;
            }

            let privacyPeopleIds = data.privacyPeopleIds;
            let notifyIds = data.notifyIds;

            if (typeof privacyPeopleIds === "string") {
              privacyPeopleIds = JSON.parse(privacyPeopleIds);
            }
            if (typeof notifyIds === "string") {
              notifyIds = JSON.parse(notifyIds);
            }
            const taskCommentData = {
              message,
              updateBy: userId,
              privacyPeopleIds,
              notifyIds,
              files,
              visibilityType,
            };

            let sendNotifications = req.body.SendAnyNotifications;
            if (typeof sendNotifications === "string") {
              sendNotifications = JSON.parse(sendNotifications);
            }

            const taskComment = await UserCommenService.updateCommentTask(
              SITE_DB_NAME,
              checkTaskComment._id,
              taskCommentData,
            );

            if (taskComment === "NA") {
              return res.status(200).json({
                success: false,
                msg: msg.msgUpdateTaskCommentError,
                key: 5,
              });
            }

            const getTaskComment = await UserCommenService.getTaskComment(
              SITE_DB_NAME,
              checkTaskComment._id,
            );

            let notifyUsers = [];

            if (
              getTaskComment.notifyIds &&
              getTaskComment.notifyIds.length > 0
            ) {
              const checkUserID = await UserCommenService.checkNotifyUser(
                SITE_DB_NAME,
                notifyIds,
              );
              if (checkUserID === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUserNotExist,
                  key: 2,
                };
                return res.status(200).json(record);
              }

              notifyUsers = checkUserID;
            }

            const siteURL =
              `https://` + req.CURRENT_SITE_WORKSPACE?.workspaceFullDomain;
            const taskLink = siteURL + "/tasks/" + checkTask.taskNumber;
            const taskName = checkTask.name;
            const mailFromName = process.env.MAIL_FROM_NAME;
            const appName = process.env.APP_NAME;
            const appLogo = process.env.APP_LOGO;
            const TASK_PNG = process.env.TASK_PNG;
            const borderBackground = process.env.BORDERBACKGROUND;
            const footerBackground = process.env.FOOTERBACKGROUND;

            if (sendNotifications && notifyUsers && notifyUsers.length > 0) {
              for (const user of notifyUsers) {
                const mailEmail = user.email;
                const languageId = user.languageId || 0;
                const footerGreeting = msg.mailFooterGreeting[languageId];
                const footerDescription = msg.mailFooterDescription[languageId];
                const mailName = await CommenFunction.capitalizeFirstLetter(
                  user.name,
                );

                const mailSubject = msg.mailSubjectInvite(
                  userName,
                  taskName,
                  workspaceName,
                )[languageId];

                const mailHeading = msg.mailHeadingTask(
                  userName,
                  taskName,
                  workspaceName,
                )[languageId];

                const headerGreeting = msg.mailHeaderGreetingInvite[languageId];

                const bodyData = {
                  appName,
                  taskLink,
                  TASK_PNG,
                  footerBackground,
                  userName,
                  workspaceName,
                  userDetails: {
                    name: mailName,
                    email: mailEmail,
                    taskName: taskName || "Inbox",
                  },
                };

                const mailContent =
                  msg.mailContentTaskComment(bodyData)[languageId];

                const mailBody = await MailFunctions.mailBodyData({
                  appName: appName,
                  appLogo: appLogo,
                  borderBackground: borderBackground,
                  mailHeading: mailHeading,
                  headerGreeting: headerGreeting,
                  name: mailName,
                  mailContent: mailContent,
                  footerGreeting: footerGreeting,
                  footerBackground: footerBackground,
                  footerDescription: footerDescription,
                });

                const responce = await MailFunctions.mailSend(
                  mailEmail,
                  mailFromName,
                  mailSubject,
                  mailBody,
                );
                if (!responce) {
                  const record = {
                    success: false,
                    msg: msg.msgTaskMailSendError,
                  };
                  return res.status(200).json(record);
                }
              }
            }

            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "task";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetTaskId = checkTask._id || null;
            const { title, message: activityMessage } =
              msg.generateActivityCommenMessage(
                userId.name,
                checkTask?.name,
                "",
                "TaskCommentUpdated",
              );
            const titles = title;
            const messages = activityMessage;
            const actionId = targetTaskId;
            const notiUserId = actorId;
            const notiOtherUserId = targetTaskId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgUpdateTaskCommentSuccess,
              taskCommnet: getTaskComment,
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in updateCommentTask emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in updateCommentTask emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateCommentTask emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  updateTaskCommentField: [
    query("taskCommentId")
      .exists()
      .withMessage(msg.msgTaskCommentIDReqired)
      .notEmpty()
      .withMessage(msg.msgTaskCommentIDReqired),
    body("fieldName")
      .trim()
      .exists()
      .withMessage(msg.msgFieldNameReqired)
      .notEmpty()
      .withMessage(msg.msgFieldNameReqired),

    // body("value").exists().withMessage(msg.msgFieldValueReqired),
    body("value").custom((value, { req }) => {
      if (req.body.fieldName === "readBy") return true; // skip validation
      if (value === undefined || value === null || value === "") {
        throw new Error(msg.msgFieldValueReqired);
      }
      return true;
    }),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      let { fieldName, value } = req.body;
      const { taskCommentId } = req.query;
      try {
        const userId = req.CURRENT_USER_ID;
        const currentUser = req.CURRENT_USER;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkTaskComment = await UserCommenService.checkTaskComment(
            SITE_DB_NAME,
            taskCommentId,
          );
          if (checkTaskComment === "NA") {
            const record = {
              success: false,
              msg: msg.msgTaskCommentIsNotExist,
              key: 3,
            };
            return res.status(200).json(record);
          }
          const checkTask = await UserCommenService.checkTask(
            SITE_DB_NAME,
            checkTaskComment.taskId,
          );
          if (checkTask === "NA") {
            const record = {
              success: false,
              msg: msg.msgTaskIsNotExist,
              key: 3,
            };
            return res.status(200).json(record);
          }
          try {
            let updateData = {};
            if (fieldName === "reactions") {
              updateData = {
                $push: {
                  reactions: {
                    emoji: value,
                    reactedBy: userId,
                    reactedAt: new Date(),
                  },
                },
              };
            } else if (fieldName === "readBy") {
              // mark as read by current user
              updateData = {
                $addToSet: {
                  readBy: {
                    userId: userId,
                    readAt: new Date(),
                  },
                },
              };
            } else {
              updateData = { [fieldName]: value };
            }

            const updateTaskCommentFieldDetails =
              await UserCommenService.updateTaskCommentField(
                SITE_DB_NAME,
                checkTaskComment?._id,
                updateData,
              );
            if (updateTaskCommentFieldDetails === "NA") {
              const record = {
                success: false,
                msg: msg.msgUpdateTaskCommentError,
                key: 5,
              };
              return res.status(200).json(record);
            }
            const TaskComment =
              await UserCommenService.getTaskCommentFieldDetails(
                SITE_DB_NAME,
                checkTaskComment?._id,
                fieldName,
              );

            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "task";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetTaskId = checkTask._id || null;
            const { title, message } = msg.generateActivityCommenMessage(
              currentUser.name,
              checkTask.name,
              "",
              "TaskCommentUpdated",
            );
            const titles = title;
            const messages = message;
            const actionId = targetTaskId;
            const notiUserId = actorId;
            const notiOtherUserId = targetTaskId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgUpdateTaskCommentSuccess,
              data: { TaskComment: TaskComment },
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in updateTaskCommentField emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in updateTaskCommentField emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateTaskCommentField emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  deleteTaskComment: [
    query("taskCommentId")
      .exists()
      .withMessage(msg.msgTaskCommentIDReqired)
      .notEmpty()
      .withMessage(msg.msgTaskCommentIDReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      try {
        const userId = req.CURRENT_USER_ID;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        const checkUserID = await UserCommenService.checkUser(
          SITE_DB_NAME,
          userId,
        );
        if (checkUserID === "NA") {
          const record = {
            success: false,
            msg: msg.msgUserNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const { taskCommentId } = req.query;
          const checkTaskComment = await UserCommenService.checkTaskComment(
            SITE_DB_NAME,
            taskCommentId,
          );
          if (checkTaskComment === "NA") {
            const record = {
              success: false,
              msg: msg.msgTaskCommentIsNotExist,
              key: 3,
            };
            return res.status(200).json(record);
          }
          try {
            const checkTask = await UserCommenService.checkTask(
              SITE_DB_NAME,
              checkTaskComment.taskId,
            );
            if (checkTask === "NA") {
              const record = {
                success: false,
                msg: msg.msgTaskIsNotExist,
                key: 3,
              };
              return res.status(200).json(record);
            }
            try {
              const taskComment = await UserCommenService.deleteTaskCommnet(
                SITE_DB_NAME,
                checkTaskComment._id,
              );

              if (taskComment === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgTaskCommentDeleteError,
                  key: 3,
                };
                return res.status(200).json(record);
              }
              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const action = "task";
              const notificationOrActivity = 1;
              const actorId = userId;
              const targetTaskId = checkTask._id || null;
              const { title, message } = msg.generateActivityCommenMessage(
                checkUserID.name,
                checkTask?.name,
                "",
                "TaskCommentDelete",
              );
              const titles = title;
              const messages = message;
              const actionId = targetTaskId;
              const notiUserId = actorId;
              const notiOtherUserId = targetTaskId;
              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };
              let notificationArr = [];

              const notification =
                await oneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson,
                  notificationOrActivity,
                );

              if (notification !== "NA") {
                notificationArr.push(notification);
              }
              if (notificationArr.length > 0) {
                notificationArr.push(notification);
                await oneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr,
                );
              }

              const record = {
                success: true,
                msg: msg.msgTaskCommentDeleteSuccess,
              };

              return res.status(200).json(record);
            } catch (error) {
              logger.error("Database error in deleteTaskComment emp 4", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 4,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in deleteTaskComment emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in deleteTaskComment emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in deleteTaskComment emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  markAllTaskCommentsRead: [
    query("taskId")
      .exists()
      .withMessage(msg.msgTaskCommentIDReqired)
      .notEmpty()
      .withMessage(msg.msgTaskCommentIDReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      if (!SITE_DB_NAME) {
        const record = { success: false, msg: msg.msgUserNotExist };
        return res.status(200).json(record);
      }
      const { taskId } = req.query;
      try {
        const userId = req.CURRENT_USER_ID;
        const currentUser = req.CURRENT_USER;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const checkTask = await UserCommenService.checkTask(
            SITE_DB_NAME,
            taskId,
          );
          if (checkTask === "NA") {
            const record = {
              success: false,
              msg: msg.msgTaskIsNotExist,
              key: 3,
            };
            return res.status(200).json(record);
          }
          try {
            const result = await UserCommenService.markAllTaskCommentsRead(
              SITE_DB_NAME,
              userId,
              checkTask?._id,
            );
            console.log("result", result);

            if (result === "NA") {
              const record = {
                success: false,
                msg: msg.msgMarkAsALLReadTaskCommentError,
                key: 5,
              };
              return res.status(200).json(record);
            }

            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const action = "task";
            const notificationOrActivity = 1;
            const actorId = userId;
            const targetTaskId = checkTask._id || null;
            const { title, message } = msg.generateActivityCommenMessage(
              currentUser.name,
              checkTask.name,
              "",
              "markAllReadTaskCommentUpdated",
            );
            const titles = title;
            const messages = message;
            const actionId = targetTaskId;
            const notiUserId = actorId;
            const notiOtherUserId = targetTaskId;
            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };
            let notificationArr = [];

            const notification =
              await oneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson,
                notificationOrActivity,
              );

            if (notification !== "NA") {
              notificationArr.push(notification);
            }
            if (notificationArr.length > 0) {
              notificationArr.push(notification);
              await oneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr,
              );
            }
            const record = {
              success: true,
              msg: msg.msgMarkAsALLReadTaskCommentSuccess,
            };

            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in updateTaskCommentField emp 3", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 3,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in updateTaskCommentField emp 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 2,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in updateTaskCommentField emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: 1,
        };
        return res.status(500).json(record);
      }
    },
  ],

  createSubTask: [
    query("parentTaskId")
      .exists()
      .withMessage(msg.msgParentTaskIDReqired)
      .notEmpty()
      .withMessage(msg.msgParentTaskIDReqired),

    body("name")
      .trim()
      .exists()
      .withMessage(msg.msgSubTaskNameReqired)
      .notEmpty()
      .withMessage(msg.msgSubTaskNameReqired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      } else {
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const data = req.body;
        const { parentTaskId } = req.query;
        try {
          const userId = req.CURRENT_USER_ID;
          const workspaceName = req.CURRENT_SITE_WORKSPACE?.workspaceName;
          const currentUserName = req.CURRENT_USER_NAME;
          if (!userId && userId === 0) {
            const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
            return res.status(200).json(record);
          }
          try {
            const checkUserID = await UserCommenService.checkUser(
              SITE_DB_NAME,
              userId,
            );
            if (checkUserID === "NA") {
              const record = {
                success: false,
                msg: msg.msgUserNotExist,
                key: 2,
              };
              return res.status(200).json(record);
            }
            const {
              name,
              description,
              stageId,
              priority,
              taskStatus,
              startDate,
              dueDate,
            } = data;
            try {
              const checkTask = await UserCommenService.checkTask(
                SITE_DB_NAME,
                parentTaskId,
              );
              if (checkTask === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgParentTaskIdNotExist,
                  key: 2,
                };
                return res.status(200).json(record);
              }
              const checkProjectId = await UserCommenService.checkProjectId(
                SITE_DB_NAME,
                checkTask?.projectId,
              );

              if (checkProjectId === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgProjectIsNotExist,
                  key: 2,
                };
                return res.status(200).json(record);
              }
              const subTaskNumber =
                await UserCommenService.checkSubTaskLastNumber(
                  SITE_DB_NAME,
                  checkTask._id,
                );
              if (subTaskNumber === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgSubTaskLastNumberIsNotFind,
                  key: 2,
                };
                return res.status(200).json(record);
              }

              const checkWorkflowStageId =
                await UserCommenService.checkWorkflowStageId(
                  SITE_DB_NAME,
                  checkProjectId.workflowId,
                  stageId,
                );
              if (checkWorkflowStageId === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgStageIsNotFind,
                  key: 2,
                };
                return res.status(200).json(record);
              }
              try {
                let files = [];

                if (!req.file) {
                  files = req?.files.map((file) => file?.key);
                } else if ("key" in req.file) {
                  const filename = req.file.key;
                  files = filename;
                } else {
                  files = req.folderName + "/" + req.file.filename;
                }

                let assignedTo = data.assignedTo;
                let estimateMinutes = data.estimateMinutes;
                let progress = data.progress;
                let followers = data.followers;
                let tags = data.tags;
                let reminders = data.reminders;

                if (typeof assignedTo === "string") {
                  assignedTo = JSON.parse(assignedTo);
                }

                if (typeof estimateMinutes === "string") {
                  estimateMinutes = JSON.parse(estimateMinutes);
                }

                if (typeof progress === "string") {
                  progress = JSON.parse(progress);
                }

                if (typeof followers === "string") {
                  followers = JSON.parse(followers);
                }

                if (typeof tags === "string") {
                  tags = JSON.parse(tags);
                }

                if (typeof reminders === "string") {
                  reminders = JSON.parse(reminders);
                }

                const TaskData = {
                  projectId: checkTask.projectId,
                  taskListId: checkTask.taskListId,
                  parentTaskId: checkTask._id,
                  workflowId: checkProjectId.workflowId,
                  assignedTo,
                  taskNumber: subTaskNumber,
                  name,
                  description,
                  stageId,
                  priority,
                  taskStatus,
                  progress,
                  followers,
                  tags,
                  startDate,
                  dueDate,
                  estimateMinutes,
                  files,
                  reminders,
                  createdById: userId,
                };
                const createTask = await UserCommenService.createTask(
                  SITE_DB_NAME,
                  TaskData,
                );
                if (createTask === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgCreateTaskError,
                    key: 3,
                  };
                  return res.status(200).json(record);
                }
                const createTaskId = createTask?._id;

                let dependsOnTaskIds = data.dependsOnTaskIds;

                if (typeof dependsOnTaskIds === "string") {
                  dependsOnTaskIds = JSON.parse(dependsOnTaskIds);
                }

                if (dependsOnTaskIds && dependsOnTaskIds.length > 0) {
                  for (const depId of dependsOnTaskIds) {
                    const checkTask = await UserCommenService.checkTask(
                      SITE_DB_NAME,
                      depId,
                    );

                    if (checkTask === "NA") {
                      return res.status(200).json({
                        success: false,
                        msg: msg.msgTaskIsNotExist,
                        key: 2,
                      });
                    }

                    const dependencyData = {
                      taskId: createTaskId,
                      dependsOnTaskId: depId,
                    };

                    const taskDependency =
                      await UserCommenService.createTaskDependency(
                        SITE_DB_NAME,
                        dependencyData,
                      );

                    if (taskDependency === "NA") {
                      return res.status(200).json({
                        success: false,
                        msg: msg.msgCreateTaskDependencyError,
                        key: 3,
                      });
                    }
                  }
                }

                const taskDetails = await UserCommenService.getTask(
                  SITE_DB_NAME,
                  createTaskId,
                );

                try {
                  const siteURL =
                    `https://` +
                    req.CURRENT_SITE_WORKSPACE?.workspaceFullDomain;
                  const taskLink = siteURL + "/tasks/" + subTaskNumber;
                  const taskName = taskDetails.name;
                  const assignedUsers = taskDetails.assignedUsers;
                  const projectCompanyId = taskDetails.project.companyId;
                  const languageId = assignedUsers.languageId || 0;
                  const mailFromName = process.env.MAIL_FROM_NAME;
                  const appName = process.env.APP_NAME;
                  const appLogo = process.env.APP_LOGO;
                  const TASK_PNG = process.env.TASK_PNG;
                  const borderBackground = process.env.BORDERBACKGROUND;
                  const footerGreeting = msg.mailFooterGreeting[languageId];
                  const footerDescription =
                    msg.mailFooterDescription[languageId];
                  const footerBackground = process.env.FOOTERBACKGROUND;

                  const checkComapny = await UserCommenService.checkCompany(
                    SITE_DB_NAME,
                    projectCompanyId,
                  );
                  if (checkComapny === "NA") {
                    const record = {
                      success: false,
                      msg: msg.msgCompanyIsNotExist,
                      key: 4,
                    };
                    return res.status(200).json(record);
                  }

                  if (assignedUsers && assignedUsers.length > 0) {
                    for (const user of assignedUsers) {
                      const mailEmail = user.email;
                      const languageId = user.languageId || 0;
                      const mailName =
                        await CommenFunction.capitalizeFirstLetter(user.name);

                      const mailSubject = msg.mailSubjectInvite(
                        currentUserName,
                        taskName,
                        workspaceName,
                      )[languageId];

                      const mailHeading = msg.mailHeadingTask(
                        currentUserName,
                        taskName,
                        workspaceName,
                      )[languageId];

                      const headerGreeting =
                        msg.mailHeaderGreetingInvite[languageId];

                      const bodyData = {
                        appName,
                        taskLink,
                        TASK_PNG,
                        footerBackground,
                        currentUserName,
                        workspaceName,
                        userDetails: {
                          name: mailName,
                          email: mailEmail,
                          dueDate: taskDetails.dueDate,
                          priority: taskDetails.priority,
                          taskListName: taskDetails.taskList.name || "Inbox",
                          projectName: taskDetails.project.name,
                          companyName: checkComapny.companyName || "Unknown",
                        },
                      };

                      const mailContent =
                        msg.mailContentTask(bodyData)[languageId];

                      const mailBody = await MailFunctions.mailBodyData({
                        appName: appName,
                        appLogo: appLogo,
                        borderBackground: borderBackground,
                        mailHeading: mailHeading,
                        headerGreeting: headerGreeting,
                        name: mailName,
                        mailContent: mailContent,
                        footerGreeting: footerGreeting,
                        footerBackground: footerBackground,
                        footerDescription: footerDescription,
                      });

                      const responce = await MailFunctions.mailSend(
                        mailEmail,
                        mailFromName,
                        mailSubject,
                        mailBody,
                      );
                      if (!responce) {
                        const record = {
                          success: false,
                          msg: msg.msgTaskMailSendError,
                        };
                        return res.status(200).json(record);
                      }

                      // const record = {
                      //   success: true,
                      //   msg: msg.msgTaskCreatedSuccess,
                      //   data: {
                      //     task: taskDetails,
                      //     responce: responce,
                      //   },
                      //   key: 1,
                      // };
                      // return res.status(200).json(record);
                    }
                  }
                  const APP_LOGO = process.env.APP_LOGO || "";
                  const APP_SITE_URL = process.env.SITE_URL || "";
                  const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                  const action = "task";
                  const notificationOrActivity = 1;
                  const actorId = userId;
                  const targetTaskId = createTask._id;

                  const { title, message } = msg.generateActivityCommenMessage(
                    checkUserID.name,
                    taskDetails?.name,
                    "",
                    "TaskCreate",
                  );
                  const titles = title;
                  const messages = message;
                  const actionId = targetTaskId;
                  const notiUserId = actorId;
                  const notiOtherUserId = targetTaskId;
                  const actionJson = {
                    actionId: actionId,
                    action: action,
                    option: {
                      logoUrl: APP_LOGO,
                      redirectionUrl: {
                        webLink: APP_SITE_URL,
                        deepLink: APP_DEEP_LINK_URL,
                      },
                      imageUrl: "",
                      soundFile: "",
                    },
                    appType: "customer",
                  };
                  let notificationArr = [];

                  const notification =
                    await oneSignalHelperUser.getNotificationArrSingle(
                      SITE_DB_NAME,
                      notiUserId,
                      notiOtherUserId,
                      action,
                      actionId,
                      titles,
                      messages,
                      actionJson,
                      notificationOrActivity,
                    );

                  if (notification !== "NA") {
                    notificationArr.push(notification);
                  }
                  if (notificationArr.length > 0) {
                    notificationArr.push(notification);
                    await oneSignalHelperUser.oneSignalNotificationSendCall(
                      notificationArr,
                    );
                  }
                  const record = {
                    success: true,
                    msg: msg.msgTaskCreatedSuccess,
                    data: {
                      task: taskDetails,
                    },
                  };

                  return res.status(200).json(record);
                } catch (error) {
                  logger.error("mail error key 2", {
                    error: error.message,
                  });
                  const record = {
                    success: false,
                    msg: msg.msgServerError,
                    key: error,
                  };
                  return res.status(500).json(record);
                }
              } catch (error) {
                logger.error("Database error in createSubTask emp 5", {
                  error: error.message,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 4,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              logger.error("Database error in createSubTask emp 3", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 3,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in createSubTask emp 2", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createSubTask emp 1", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 1,
          };
          return res.status(500).json(record);
        }
      }
    },
  ],

  getProjectAllTaskComments: [
    query("projectId")
      .exists()
      .withMessage(msg.msgProjectIDReqired)
      .notEmpty()
      .withMessage(msg.msgProjectIDReqired),
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
      } else {
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        const userId = req.CURRENT_USER_ID;
        const { projectId, deleteFlag } = req.query;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        try {
          if (!userId && userId === 0) {
            const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
            return res.status(200).json(record);
          } else {
            try {
              const checkUserID = await UserCommenService.checkUser(
                SITE_DB_NAME,
                userId,
              );
              if (checkUserID === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgUserNotExist,
                  key: 2,
                };
                return res.status(200).json(record);
              }
              try {
                const checkProjectId = await UserCommenService.checkProjectId(
                  SITE_DB_NAME,
                  projectId,
                );
                if (checkProjectId === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgProjectIsNotExist,
                  };
                  return res.status(200).json(record);
                }
                try {
                  const pagination = {
                    pageSize: parseInt(req.query.pageSize) || 10,
                    pageNumber: parseInt(req.query.pageNumber) || 1,
                  };
                  const projectTaskCommentsDetails =
                    await UserCommenService.getProjectAllTaskComments(
                      SITE_DB_NAME,
                      Number(deleteFlag),
                      checkProjectId?._id,
                      pagination,
                    );
                  if (projectTaskCommentsDetails === "NA") {
                    const record = {
                      success: true,
                      msg: msg.msgDataFound,
                      data: {
                        projectAllTaskComments: [],
                      },
                    };
                    return res.status(200).json(record);
                  }
                  const record = {
                    success: true,
                    msg: msg.msgDataFound,
                    data: {
                      projectAllTaskComments: projectTaskCommentsDetails,
                    },
                  };

                  return res.status(200).json(record);
                } catch (error) {
                  logger.error(
                    "Database error in getProjectAllTaskComments emp 4",
                    {
                      error,
                    },
                  );
                  const record = {
                    success: false,
                    msg: msg.msgServerError,
                    key: 4,
                  };
                  return res.status(500).json(record);
                }
              } catch (error) {
                logger.error(
                  "Database error in getProjectAllTaskComments emp 3",
                  {
                    error,
                  },
                );
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 3,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              logger.error(
                "Database error in getProjectAllTaskComments emp 2",
                {
                  error,
                },
              );
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 2,
              };
              return res.status(500).json(record);
            }
          }
        } catch (error) {
          logger.error("Database error in getProjectAllTaskComments emp 1", {
            error,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 1,
          };
          return res.status(500).json(record);
        }
      }
    },
  ],

  //task log timer
  createTaskLogTimer: [
    body("taskId")
      .exists()
      .withMessage(msg.msgTaskIDReqired)
      .notEmpty()
      .withMessage(msg.msgTaskIDReqired),
    body("action")
      .exists()
      .withMessage(msg.msgActionIsRequired)
      .notEmpty()
      .withMessage(msg.msgActionIsRequired),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      } else {
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        if (!SITE_DB_NAME) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const data = req.body;
        try {
          const userId = req.CURRENT_USER_ID;
          const workspaceName = req.CURRENT_SITE_WORKSPACE?.workspaceName;
          const currentUserName = req.CURRENT_USER_NAME;
          if (!userId && userId === 0) {
            const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
            return res.status(200).json(record);
          }
          try {
            const checkUserID = await UserCommenService.checkUser(
              SITE_DB_NAME,
              userId,
            );
            if (checkUserID === "NA") {
              const record = {
                success: false,
                msg: msg.msgUserNotExist,
                key: 2,
              };
              return res.status(200).json(record);
            }
            const { taskId } = data;

            try {
              const checkTask = await UserCommenService.checkTask(
                SITE_DB_NAME,
                taskId,
              );

              console.log("checkTask", checkTask);

              if (checkTask === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgTaskIdIsNotExist,
                  key: 2,
                };
                return res.status(200).json(record);
              }

              if (!data.projectId || !data.taskListId) {
                data.projectId = checkTask.projectId;
                data.taskListId = checkTask.taskListId;
              }

              if (data.projectId) {
                const checkProjectId = await UserCommenService.checkProjectId(
                  SITE_DB_NAME,
                  data.projectId,
                );

                if (checkProjectId === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgProjectIsNotExist,
                    key: 2,
                  };
                  return res.status(200).json(record);
                }
              }

              if (data.taskListId) {
                const checkTaskListId = await UserCommenService.checkTaskListId(
                  SITE_DB_NAME,
                  data.taskListId,
                );

                if (checkTaskListId === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgTaskListIdIsNotExist,
                    key: 2,
                  };
                  return res.status(200).json(record);
                }
              }
              try {
                const taskAction = String(data.action || "").toUpperCase();

                // conditional validation (server-side, not using express-validator rulelist)
                if (taskAction === "START") {
                  if (!data.projectId || !data.taskListId || !data.taskId) {
                    return res.status(200).json({
                      success: false,
                      msg: "projectId, taskListId and taskId are required for START",
                    });
                  }
                }

                if (taskAction === "MANUAL") {
                  // allow manual to either create new or update existing via taskTimeId (optional)
                  if (!data.projectId || !data.taskListId || !data.taskId) {
                    return res.status(200).json({
                      success: false,
                      msg: "projectId, taskListId and taskId are required for MANUAL",
                    });
                  }
                  if (!data.startTime || !data.endTime) {
                    return res.status(200).json({
                      success: false,
                      msg: "startTime and endTime are required for MANUAL",
                    });
                  }
                }

                if (
                  ["PAUSE", "RESUME", "STOP", "STATUS"].includes(taskAction)
                ) {
                  // accept either taskTimeId OR (projectId + taskListId + taskId)
                  if (
                    !data.taskTimeId &&
                    !(data.projectId && data.taskListId && data.taskId)
                  ) {
                    return res.status(200).json({
                      success: false,
                      msg:
                        "taskTimeId OR (projectId + taskListId + taskId) required for " +
                        taskAction,
                    });
                  }
                }
                const taskLogTime = await UserCommenService.createTaskLogTimer(
                  SITE_DB_NAME,
                  data,
                  userId,
                );
                if (taskLogTime === "NA") {
                  const record = {
                    success: false,
                    msg: msg.msgCreateTaskLogTimeError,
                    key: 3,
                  };
                  return res.status(200).json(record);
                }

                const taskLogTimeDetails =
                  await UserCommenService.getTaskTimeLogDetails(
                    SITE_DB_NAME,
                    taskLogTime._id,
                  );

                const APP_LOGO = process.env.APP_LOGO || "";
                const APP_SITE_URL = process.env.SITE_URL || "";
                const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                const action = "task";
                const notificationOrActivity = 1;
                const actorId = userId;
                const targetTaskId = taskLogTimeDetails?.taskId;

                const { title, message } = msg.generateActivityCommenMessage(
                  checkUserID.name,
                  taskLogTimeDetails?.taskDetails?.name,
                  "",
                  "TaskLogTimeCreate",
                );
                const titles = title;
                const messages = message;
                const actionId = targetTaskId;
                const notiUserId = actorId;
                const notiOtherUserId = targetTaskId;
                const actionJson = {
                  actionId: actionId,
                  action: action,
                  option: {
                    logoUrl: APP_LOGO,
                    redirectionUrl: {
                      webLink: APP_SITE_URL,
                      deepLink: APP_DEEP_LINK_URL,
                    },
                    imageUrl: "",
                    soundFile: "",
                  },
                  appType: "customer",
                };
                let notificationArr = [];

                const notification =
                  await oneSignalHelperUser.getNotificationArrSingle(
                    SITE_DB_NAME,
                    notiUserId,
                    notiOtherUserId,
                    action,
                    actionId,
                    titles,
                    messages,
                    actionJson,
                    notificationOrActivity,
                  );

                if (notification !== "NA") {
                  notificationArr.push(notification);
                }
                if (notificationArr.length > 0) {
                  notificationArr.push(notification);
                  await oneSignalHelperUser.oneSignalNotificationSendCall(
                    notificationArr,
                  );
                }
                const record = {
                  success: true,
                  msg: msg.msgTaskLogTimeCreatedSuccess,
                  data: {
                    taskLogTime: taskLogTimeDetails,
                  },
                };
                return res.status(200).json(record);
              } catch (error) {
                logger.error("Database error in createTaskLogTimer emp 4", {
                  error: error.message,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: 4,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              logger.error("Database error in createTaskLogTimer emp 3", {
                error: error.message,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 3,
              };
              return res.status(500).json(record);
            }
          } catch (error) {
            logger.error("Database error in createTaskLogTimer emp 2", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: 2,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in createTaskLogTimer emp 1", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: 1,
          };
          return res.status(500).json(record);
        }
      }
    },
  ],
};
