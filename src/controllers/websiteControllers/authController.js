require("dotenv").config();
const jwt = require("jsonwebtoken");
const axios = require("axios");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const { body, query, validationResult } = require("express-validator");
const msg = require("../../helpers/languageMessageHelper");
const logger = require("../../helpers/loggerHelper");
const MailFunctions = require("../../helpers/mailSendHelper");
const CommenFunction = require("../../helpers/commenHelper");

const CommenService = require("../../services/superAdminServices/commenService");
const AuthService = require("../../services/websiteServices/authService");

const UserAuthService = require("../../services/workspaceServices/authService");
const UserCommenService = require("../../services/workspaceServices/commenService");
const { default: slugify } = require("slugify");
const moment = require("moment");
const oneSignalHelperUser = require("../../helpers/oneSignalHelperTenant");

module.exports = {
  checkEmail: [
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
        const checkEmail = await AuthService.checkEmail(email);
        if (checkEmail === "NA") {
          return res.status(200).json({
            success: true,
            msg: msg.msgEmailNotExist,
            key: 1,
          });
        } else {
          if (checkEmail?.profileComplete === 0) {
            return res.status(200).json({
              success: true,
              msg: msg.msgEmailNotExist,
              key: 1,
            });
          } else {
            return res.status(200).json({
              success: false,
              msg: msg.msgEmailAlreadyExist,
              key: 1,
            });
          }
        }
      } catch (error) {
        logger.error("Database error in checkEmail application", {
          error: error.message,
        });
        return res.status(500).json({
          success: false,
          msg: msg.internalServerError,
          key: error,
        });
      }
    },
  ],

  signup: [
    body("email")
      .exists()
      .withMessage(msg.msgEmailReqired)
      .notEmpty()
      .withMessage(msg.msgEmailReqired)
      .isEmail()
      .withMessage(msg.msgEmailInvalidFormat),
    body("firstName")
      .trim()
      .exists()
      .withMessage(msg.msgFirstNameRequired)
      .notEmpty()
      .withMessage(msg.msgFirstNameRequired),
    body("lastName")
      .trim()
      .exists()
      .withMessage(msg.msgLastNameRequired)
      .notEmpty()
      .withMessage(msg.msgLastNameRequired),
    body("email")
      .trim()
      .exists()
      .withMessage(msg.msgEmailReqired)
      .notEmpty()
      .withMessage(msg.msgEmailReqired)
      .isEmail()
      .withMessage(msg.msgEmailInvalidFormat),
    body("mobileNumber")
      .trim()
      .exists()
      .withMessage(msg.msgMobileNumberRequired)
      .notEmpty()
      .withMessage(msg.msgMobileNumberRequired),
    body("deviceType")
      .trim()
      .exists()
      .withMessage(msg.msgAllFieldReqired)
      .notEmpty()
      .withMessage(msg.msgAllFieldReqired),
    body("loginType")
      .trim()
      .exists()
      .withMessage(msg.msgAllFieldReqired)
      .notEmpty()
      .withMessage(msg.msgAllFieldReqired),
    body("playerId")
      .trim()
      .exists()
      .withMessage(msg.msgAllFieldReqired)
      .notEmpty()
      .withMessage(msg.msgAllFieldReqired),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(200).json({
            success: false,
            msg: errors.array()[0].msg,
          });
        }
        const {
          firstName,
          lastName,
          email = email.toLowerCase(),
          mobileNumber,
          deviceType,
          loginType,
          playerId,
          socialId,
          dob,
          password,
          countryId,
        } = req.body;
        let showPassword,
          uniqueId,
          registeredById,
          hashPassword,
          loginTypeFirst;

        if (loginType === "google") {
          if (socialId) {
            return res.status(200).json({
              success: false,
              msg: msgSocialIdReqired,
              key: "socialId",
            });
          }
        }
        loginTypeFirst = loginType;
        registeredById = null;
        const name = firstName + " " + lastName;
        const role = await CommenService.getRoleByRoleName("Site-Owner");
        const accessLevel = role !== "NA" ? role?.accessLevel : [];
        const roleId = role !== "NA" ? role?._id : null;
        const roleName = role !== "NA" ? role?.roleName : "Site-Owner";
        showPassword = password
          ? password
          : await CommenFunction.generateRandomPassword(10);
        uniqueId = await CommenFunction.generateRandomPassword(10);
        hashPassword = await CommenFunction.hashPassword(showPassword);
        const otp = await CommenFunction.generateOtp(6);
        const otpVerify = loginType === "google" ? 1 : 0;
        const signupSteps = loginType === "google" ? 1 : 0;
        const data = {
          email,
          firstName,
          lastName,
          name,
          mobileNumber,
          deviceType,
          loginType,
          playerId,
          socialId,
          dob,
          otp,
          otpVerify,
          showPassword,
          password: hashPassword,
          uniqueId,
          empId: uniqueId,
          registeredById,
          loginType,
          loginTypeFirst,
          roleName,
          roleId,
          accessLevel,
          signupSteps,
          countryId,
        };
        const checkEmail = await AuthService.checkEmail(email);
        try {
          if (checkEmail !== "NA") {
            if (checkEmail?.profileComplete === 1) {
              return res.status(200).json({
                success: false,
                msg: msg.msgEmailAlreadyExist,
                key: 1,
              });
            } else {
              // update process
              const updateUser = await AuthService.updateUser(
                checkEmail._id,
                data,
              );
              if (updateUser !== "NA") {
                try {
                  const now = new Date();
                  const expireTime = new Date(
                    now.getTime() +
                      Number(process.env.MAIL_EXPIRE_TIME) * 60 * 1000,
                  );
                  const forgotPassIdentity =
                    await CommenFunction.generateRandomPassword(15);

                  if (!email) {
                    const record = {
                      success: false,
                      msg: msg.msgPasswordResetLinkSendError,
                    };
                    return res.status(200).json(record);
                  } else {
                    const userDetails = await CommenService.getUserDetails(
                      checkEmail._id,
                    );
                    let languageId = "0";
                    if (userDetails !== "NA") {
                      languageId = userDetails.languageId;
                    }
                    const userId = userDetails.userId;
                    const fpCode = Buffer.from(
                      userId + "-" + expireTime + "-" + forgotPassIdentity,
                    ).toString("base64");
                    //const siteURL = process.env.SITE_URL;
                    const mailEmail = email;
                    const mailName = name;
                    // const resetPassLink = siteURL + "/resetpassword?uniqcode=" + fpCode;
                    const mailSubject = msg.mailSubjectSignup[languageId];
                    const mailHeading = msg.mailHeadingSignup[languageId];
                    const headerGreeting =
                      msg.mailHeaderGreetingSignup[languageId];

                    try {
                      const mailFromName = process.env.MAIL_FROM_NAME;
                      const appName = process.env.APP_NAME;
                      const appLogo = process.env.APP_LOGO;
                      const borderBackground = process.env.BORDERBACKGROUND;
                      const footerGreeting = msg.mailFooterGreeting[languageId];
                      const footerDescription =
                        msg.mailFooterDescription[languageId];
                      const footerBackground = process.env.FOOTERBACKGROUND;
                      const mailContent =
                        msg.mailContentSignup(otp, footerBackground, appName)[
                          languageId
                        ] +
                        "Please note that this OTP will expire in " +
                        process.env.MAIL_EXPIRE_TIME +
                        " Minutes  for your security. If the OTP expires, you can initiate a new request to verify your account from the otp verfiy page.";

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
                        if (loginType === "google") {
                          const record = {
                            success: true,
                            msg: msg.msgSignupFirstStepSuccess,
                            data: { fpCode, userDetails },
                            key: 1,
                          };
                          return res.status(200).json(record);
                        } else {
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
                            msg: msg.msgOTPSuccess,
                            data: { fpCode, userDetails, responce: responce },
                            key: 1,
                          };
                          return res.status(200).json(record);
                        }
                      } catch (error) {
                        console.log("mail error key 2");
                        const record = {
                          success: false,
                          msg: msg.msgServerError,
                          key: error,
                        };
                        return res.status(500).json(record);
                      }
                    } catch (error) {
                      console.log("mail error key 1");
                      const record = {
                        success: false,
                        msg: msg.msgServerError,
                        key: error,
                      };
                      return res.status(500).json(record);
                    }
                  }
                } catch (error) {
                  console.log("database error key 2", error.message);
                  const record = {
                    success: false,
                    msg: msg.msgServerError,
                    key: error,
                  };
                  return res.status(500).json(record);
                }
              } else {
                return res.status(200).json({
                  success: false,
                  msg: msg.msgOTPError,
                  key: 0,
                });
              }
            }
          } else {
            // create process
            const addUser = await AuthService.signupUser(data);
            if (addUser !== "NA") {
              try {
                const now = new Date();
                const expireTime = new Date(
                  now.getTime() +
                    Number(process.env.MAIL_EXPIRE_TIME) * 60 * 1000,
                );
                const forgotPassIdentity =
                  await CommenFunction.generateRandomPassword(15);

                if (!email) {
                  const record = {
                    success: false,
                    msg: msg.msgPasswordResetLinkSendError,
                  };
                  return res.status(200).json(record);
                } else {
                  const userDetails = await CommenService.getUserDetails(
                    addUser._id,
                  );
                  let name = "NA";
                  let languageId = "0";
                  if (userDetails !== "NA") {
                    name = userDetails.name;
                    languageId = userDetails.languageId;
                  }
                  const userId = userDetails.userId;
                  const fpCode = Buffer.from(
                    userId + "-" + expireTime + "-" + forgotPassIdentity,
                  ).toString("base64");
                  //const siteURL = process.env.SITE_URL;
                  const mailEmail = email;
                  const mailName = name;
                  // const resetPassLink = siteURL + "/resetpassword?uniqcode=" + fpCode;
                  const mailSubject = msg.mailSubjectSignup[languageId];
                  const mailHeading = msg.mailHeadingSignup[languageId];
                  const headerGreeting =
                    msg.mailHeaderGreetingSignup[languageId];

                  try {
                    const mailFromName = process.env.MAIL_FROM_NAME;
                    const appName = process.env.APP_NAME;
                    const appLogo = process.env.APP_LOGO;
                    const borderBackground = process.env.BORDERBACKGROUND;
                    const footerGreeting = msg.mailFooterGreeting[languageId];
                    const footerDescription =
                      msg.mailFooterDescription[languageId];
                    const footerBackground = process.env.FOOTERBACKGROUND;
                    const mailContent =
                      msg.mailContentSignup(otp, footerBackground, appName)[
                        languageId
                      ] +
                      "Please note that this OTP will expire in " +
                      process.env.MAIL_EXPIRE_TIME +
                      " Minutes  for your security. If the OTP expires, you can initiate a new request to verify your account from the otp verfiy page.";
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
                      if (loginType === "google") {
                        const record = {
                          success: true,
                          msg: msg.msgSignupFirstStepSuccess,
                          data: { fpCode, userDetails },
                          key: 1,
                        };
                        return res.status(200).json(record);
                      } else {
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
                          msg: msg.msgOTPSuccess,
                          data: { fpCode, userDetails, responce: responce },
                          key: 1,
                        };
                        return res.status(200).json(record);
                      }
                    } catch (error) {
                      logger.error("mail error key 2 application", {
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
                    logger.error("mail error key 1 application", {
                      error: error.message,
                    });
                    const record = {
                      success: false,
                      msg: msg.msgServerError,
                      key: error,
                    };
                    return res.status(500).json(record);
                  }
                }
              } catch (error) {
                logger.error("database error key 2 application", {
                  error: error.message,
                });
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: error,
                };
                return res.status(500).json(record);
              }
            } else {
              return res.status(200).json({
                success: false,
                msg: msg.msgOTPError,
                key: 0,
              });
            }
          }
        } catch (error) {
          logger.error("Database error in add user and update application", {
            error: error.message,
          });
          return res.status(500).json({
            success: false,
            msg: msg.internalServerError,
            error: error.message,
            key: 1,
          });
        }
      } catch (error) {
        logger.error("Database error in checkEmail application", {
          error: error.message,
        });
        return res.status(500).json({
          success: false,
          msg: msg.internalServerError,
          error: error.message,
          key: 2,
        });
      }
    },
  ],
  otpVerify: [
    body("fpCode")
      .exists()
      .withMessage(msg.msgAllFieldReqired)
      .notEmpty()
      .withMessage(msg.msgAllFieldReqired),
    body("otp")
      .exists()
      .withMessage(msg.msgAllFieldReqired)
      .notEmpty()
      .withMessage(msg.msgAllFieldReqired),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(200).json({
            success: false,
            msg: errors.array()[0].msg,
          });
        }
        const { fpCode, otp } = req.body;
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
        const checkUserId = await AuthService.checkUserId(userId);
        if (checkUserId === "NA") {
          const record = { success: false, msg: msg.msgLinkInvalid, key: 1 };
          return res.status(200).json(record);
        }
        const now = new Date();
        const expiryTime = new Date(uniqueIdDataArr[1]).getTime();
        if (checkUserId.otpVerify === 1 || expiryTime < now.getTime()) {
          const record = { success: false, msg: msg.msgOTPExpired, key: 1 };
          return res.status(200).json(record);
        }

        const otpVerify = 1;
        const signupSteps = 1;
        const data = { otpVerify, signupSteps };
        const checkOTP = await AuthService.checkOTP(userId, otp);
        try {
          if (checkOTP === "NA") {
            return res.status(200).json({
              success: false,
              msg: msg.msgInvalidOTP,
              key: 1,
            });
          } else {
            // update process
            const updateUser = await AuthService.updateUser(checkOTP._id, data);
            if (updateUser !== "NA") {
              const userDetails = await CommenService.getUserDetails(
                checkOTP._id,
              );
              const record = {
                success: true,
                msg: msg.msgOTPVerifySuccess,
                data: { userDetails },
                key: 1,
              };
              return res.status(200).json(record);
            } else {
              return res.status(200).json({
                success: false,
                msg: msg.msgOTPError,
                key: 0,
              });
            }
          }
        } catch (error) {
          logger.error("Database error in add user and update application", {
            error: error.message,
          });
          return res.status(500).json({
            success: false,
            msg: msg.internalServerError,
            error: error.message,
            key: 1,
          });
        }
      } catch (error) {
        logger.error("Database error in checkEmail application", {
          error: error.message,
        });
        return res.status(500).json({
          success: false,
          msg: msg.internalServerError,
          error: error.message,
          key: 2,
        });
      }
    },
  ],
  otpResend: [
    body("fpCode")
      .exists()
      .withMessage(msg.msgAllFieldReqired)
      .notEmpty()
      .withMessage(msg.msgAllFieldReqired),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(200).json({
            success: false,
            msg: errors.array()[0].msg,
          });
        }
        const { fpCode } = req.body;
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
        const otp = await CommenFunction.generateOtp(6);
        const otpVerify = 0;
        const signupSteps = 0;
        const data = {
          signupSteps,
          otp,
          otpVerify,
        };

        try {
          const checkUserId = await AuthService.checkUserId(userId);
          if (checkUserId === "NA") {
            const record = { success: false, msg: msg.msgLinkInvalid, key: 1 };
            return res.status(200).json(record);
          } else {
            // update process
            const updateUser = await AuthService.updateUser(
              checkUserId._id,
              data,
            );
            if (updateUser !== "NA") {
              try {
                const now = new Date();
                const expireTime = new Date(
                  now.getTime() +
                    Number(process.env.MAIL_EXPIRE_TIME) * 60 * 1000,
                );
                const forgotPassIdentity =
                  await CommenFunction.generateRandomPassword(15);
                const email = checkUserId.email;
                if (!email) {
                  const record = {
                    success: false,
                    msg: msg.msgPasswordResetLinkSendError,
                  };
                  return res.status(200).json(record);
                } else {
                  const userDetails = await CommenService.getUserDetails(
                    checkUserId._id,
                  );
                  let languageId = "0";
                  let name = null;
                  if (userDetails !== "NA") {
                    languageId = userDetails.languageId;
                    name = userDetails.name;
                  }
                  const userId = userDetails.userId;
                  const fpCode = Buffer.from(
                    userId + "-" + expireTime + "-" + forgotPassIdentity,
                  ).toString("base64");
                  //const siteURL = process.env.SITE_URL;
                  const mailEmail = email;
                  const mailName = name;
                  // const resetPassLink = siteURL + "/resetpassword?uniqcode=" + fpCode;
                  const mailSubject = msg.mailSubjectResend[languageId];
                  const mailHeading = msg.mailHeadingResend[languageId];
                  const headerGreeting =
                    msg.mailHeaderGreetingResend[languageId];

                  try {
                    const mailFromName = process.env.MAIL_FROM_NAME;
                    const appName = process.env.APP_NAME;
                    const appLogo = process.env.APP_LOGO;
                    const borderBackground = process.env.BORDERBACKGROUND;
                    const footerGreeting = msg.mailFooterGreeting[languageId];
                    const footerDescription =
                      msg.mailFooterDescription[languageId];
                    const footerBackground = process.env.FOOTERBACKGROUND;
                    const mailContent =
                      msg.mailContentResend(otp, footerBackground, appName)[
                        languageId
                      ] +
                      "Please note that this OTP will expire in " +
                      process.env.MAIL_EXPIRE_TIME +
                      " Minutes  for your security. If the OTP expires, you can initiate a new request to verify your account from the otp verfiy page.";

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
                        msg: msg.msgOTPSuccess,
                        data: { fpCode, userDetails, responce: responce },
                        key: 1,
                      };
                      return res.status(200).json(record);
                    } catch (error) {
                      console.log("mail error key 2");
                      const record = {
                        success: false,
                        msg: msg.msgServerError,
                        key: error,
                      };
                      return res.status(500).json(record);
                    }
                  } catch (error) {
                    console.log("mail error key 1");
                    const record = {
                      success: false,
                      msg: msg.msgServerError,
                      key: error,
                    };
                    return res.status(500).json(record);
                  }
                }
              } catch (error) {
                console.log("database error key 2", error.message);
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: error,
                };
                return res.status(500).json(record);
              }
            } else {
              return res.status(200).json({
                success: false,
                msg: msg.msgOTPError,
                key: 0,
              });
            }
          }
        } catch (error) {
          logger.error("Database error in add user and update application", {
            error: error.message,
          });
          return res.status(500).json({
            success: false,
            msg: msg.internalServerError,
            error: error.message,
            key: 1,
          });
        }
      } catch (error) {
        logger.error("Database error in checkEmail application", {
          error: error.message,
        });
        return res.status(500).json({
          success: false,
          msg: msg.internalServerError,
          error: error.message,
          key: 2,
        });
      }
    },
  ],
  signupStep2: [
    body("fpCode")
      .exists()
      .withMessage(msg.msgAllFieldReqired)
      .notEmpty()
      .withMessage(msg.msgAllFieldReqired),
    body("companyName")
      .exists()
      .withMessage(msg.msgAllFieldReqired)
      .notEmpty()
      .withMessage(msg.msgAllFieldReqired),
    body("industryId")
      .exists()
      .withMessage(msg.msgAllFieldReqired)
      .notEmpty()
      .withMessage(msg.msgAllFieldReqired),
    body("employeeRange")
      .exists()
      .withMessage(msg.msgAllFieldReqired)
      .notEmpty()
      .withMessage(msg.msgAllFieldReqired),
    body("numberOfSeats")
      .exists()
      .withMessage(msg.msgAllFieldReqired)
      .notEmpty()
      .withMessage(msg.msgAllFieldReqired),
    body("designationId")
      .exists()
      .withMessage(msg.msgAllFieldReqired)
      .notEmpty()
      .withMessage(msg.msgAllFieldReqired),
    // body("seletedPlanId").exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
    body("countryId")
      .exists()
      .withMessage(msg.msgAllFieldReqired)
      .notEmpty()
      .withMessage(msg.msgAllFieldReqired),
    body("timeZone")
      .exists()
      .withMessage(msg.msgAllFieldReqired)
      .notEmpty()
      .withMessage(msg.msgAllFieldReqired),
    body("transactionId")
      .exists({ checkNull: true })
      .withMessage(msg.msgAllFieldReqired),

    body("totalPrice").isFloat({ min: 0 }).withMessage(msg.msgAllFieldReqired),

    body("subTotalPrice")
      .isFloat({ min: 0 })
      .withMessage(msg.msgAllFieldReqired),

    body("taxAmount").isFloat({ min: 0 }).withMessage(msg.msgAllFieldReqired),

    body("tax").isFloat({ min: 0 }).withMessage(msg.msgAllFieldReqired),

    body("discount").isFloat({ min: 0 }).withMessage(msg.msgAllFieldReqired),

    body("discountAmount")
      .isFloat({ min: 0 })
      .withMessage(msg.msgAllFieldReqired),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          console.log(errors);
          return res.status(200).json({
            success: false,
            msg: errors.array()[0].msg,
          });
        }

        const {
          fpCode,
          companyName,
          industryId,
          employeeRange,
          numberOfSeats,
          designationId,
          seletedPlanId,
          countryId,
          timeZone,
          password,
          totalPrice,
          subTotalPrice,
          taxAmount,
          tax,
          discount,
          discountAmount,
        } = req.body;
        const checkCountry = await AuthService.checkCountry(countryId);
        if (checkCountry === "NA") {
          return res.status(200).json({
            success: false,
            msg: msg.thisCompanyNameAlreadyExists,
            key: 1,
          });
        }
        const transactionId = req?.body?.transactionId
          ? req?.body?.transactionId
          : "Txt" + (await CommenFunction.generateRandomPassword(10));
        let showPassword = password
          ? password
          : await CommenFunction.generateRandomPassword(10);
        let hashPassword = await CommenFunction.hashPassword(showPassword);
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
        const workspaceDomainReplace = companyName
          .replace(/\s+/g, "")
          .toLowerCase();
        const checkWorkspaceDomain = await AuthService.checkWorkspaceDomain(
          workspaceDomainReplace,
        );
        if (checkWorkspaceDomain !== "NA") {
          return res.status(200).json({
            success: false,
            msg: msg.thisCompanyNameAlreadyExists,
            key: 1,
          });
        }
        const userId = uniqueIdDataArr[0];
        const profileComplete = 1;
        const signupSteps = 2;

        try {
          const checkUserId = await AuthService.checkUserId(userId);
          if (checkUserId === "NA") {
            const record = { success: false, msg: msg.msgUserNotExist, key: 1 };
            return res.status(200).json(record);
          } else {
            if (checkUserId.otpVerify === 0) {
              const record = {
                success: false,
                msg: msg.msgUserNotExist,
                key: 1,
              };
              return res.status(200).json(record);
            }
            // update process

            const data = {
              designationId,
              countryId: checkCountry?._id,
              countryCode: checkCountry?.countryCode,
              countryName: checkCountry?.countryName,
              timezone: timeZone,
              profileComplete,
              signupSteps,
              password: hashPassword,
              showPassword,
            };
            // create workspace and craete new db signup in db and with create work space

            const workspaceDomainClean = slugify(workspaceDomainReplace, {
              lower: true,
              strict: true,
              replacement: "",
            });

            const dbName = `${workspaceDomainClean}_db`;

            // Create domain
            const workapaceNumber =
              "WN-" + (await CommenFunction.generateOtp(6));
            const workspaceDomain = workspaceDomainClean;
            const workspaceFullDomain = `${workspaceDomain}.${process.env.SITE_URL.replace(
              /^https?:\/\//,
              "",
            ).replace(/\/$/, "")}`;
            const workspaceUrl = `https://${workspaceFullDomain}`;
            const workspaceName = companyName;
            const uniqueId =
              await CommenFunction.abbreviationSmart(workspaceName);
            const email = checkUserId.email;
            const companyAddress = null;
            const companyCode = null;
            const companyURL = null;
            const workspaceLogo = null;
            const SITE_DB_NAME = dbName;
            const workspaceCurrencyName = "USD";
            const workspaceCurrency = "$";
            const workspaceData = {
              workapaceNumber,
              workspaceName,
              workspaceUrl,
              workspaceDomain,
              workspaceFullDomain,
              dbName: dbName,
              dbHost: process.env.DB_HOST,
              dbPort: process.env.DB_PORT,
              dbUserName: process.env.DB_USERNAME,
              dbPassword: process.env.DB_PASSWORD,
              dbURL: `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${dbName}?authSource=admin`,
              industryId,
              workspaceEmail: email,
              employeeRange,
              numberOfSeats,
              designationId,
              workspaceCurrency,
              workspaceCurrencyName,
              workspaceLogo,
              timezone: timeZone,
              countryId: checkCountry?._id,
              workspaceCurrency: checkCountry?.currencySymbol,
              workspaceCurrencyName: checkCountry?.currency,
            };
            // 5. create createWorkspace in main db
            const createWorkspace =
              await AuthService.createWorkspace(workspaceData);
            if (createWorkspace === "NA") {
              const record = {
                success: false,
                msg: msg.msgWorkspaceCreateError,
                key: 1,
              };
              return res.status(200).json(record);
            }
            data["workspaceId"] = createWorkspace._id;
            data["uniqueId"] = uniqueId + "-001";
            // 5. get subscription from main db
            let checkSubscriptionPlan =
              await AuthService.checkSubscriptionPlan(seletedPlanId);
            if (checkSubscriptionPlan === "NA") {
              checkSubscriptionPlan = await AuthService.checkSubscriptionPlan();
              if (checkSubscriptionPlan === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgWorkspaceCreateError,
                  key: 1,
                };
                return res.status(200).json(record);
              }
            }

            const selectedPlan = await AuthService.getSubscriptionPlan(
              checkSubscriptionPlan,
            );
            if (selectedPlan === "NA") {
              const record = {
                success: false,
                msg: msg.msgWorkspaceCreateError,
                key: 1,
              };
              return res.status(200).json(record);
            }

            // const createWorkspaceUser = await UserAuthService.createWorkspaceUser(SITE_DB_NAME, workspaceData);
            // if (createWorkspaceUser === "NA") {
            //   const record = { success: false, msg: msg.msgWorkspaceCreateError, key: 2 };
            //   return res.status(200).json(record);
            // }
            const roleName = "Site-Owner";
            const getPreferenceAccessLevel =
              await AuthService.getPreferenceAccessLevel(roleName);

            const accessPreferenceLevel =
              getPreferenceAccessLevel !== "NA"
                ? getPreferenceAccessLevel.accessLevel
                : [];

            data["accessPreferenceLevel"] = accessPreferenceLevel;

            const getAccessLevel = await AuthService.getAccessLevel(roleName);
            const accessLevel =
              getAccessLevel !== "NA" ? getAccessLevel.accessLevel : [];
            data["accessLevel"] = accessLevel;

            const updateUser = await AuthService.updateUser(
              checkUserId._id,
              data,
            );
            if (updateUser !== "NA") {
              const getRoles = await AuthService.getRoles();
              const getTags = await AuthService.getTags();
              const getDesignations = await AuthService.getDesignations();

              const userDetails = await CommenService.getUserDetails(
                checkUserId._id,
              );
              let createDesignations = null;
              if (getDesignations !== "NA") {
                const designationsWithoutIds = getDesignations.map(
                  (designation) => {
                    const getDesignationsObj = designation.toObject();
                    delete getDesignationsObj._id; // Remove _id
                    getDesignationsObj["workspaceId"] = createWorkspace?._id;
                    return getDesignationsObj;
                  },
                );
                createDesignations = await UserAuthService.createDesignation(
                  SITE_DB_NAME,
                  designationsWithoutIds,
                );
              }
              const foundDesignation = getDesignations.find(
                (designation) =>
                  designation._id.toString() ===
                  userDetails.designationId.toString(),
              );
              const designationName = foundDesignation?.name
                ? foundDesignation?.name
                : "CEO";
              const designation =
                createDesignations !== "NA"
                  ? createDesignations.find(
                      (designation) => designation.name === designationName,
                    )
                  : null;
              const designationId = designation?._id || null;

              let createdRoles = null;
              if (getRoles !== "NA") {
                const rolesWithoutIds = getRoles.map((role) => {
                  const roleObj = role.toObject();
                  delete roleObj._id; // Remove _id
                  return roleObj;
                });
                createdRoles = await UserAuthService.createRole(
                  SITE_DB_NAME,
                  rolesWithoutIds,
                );
              }

              let createdTags = null;
              if (getTags !== "NA") {
                const TagsWithoutIds = getTags.map((Tag) => {
                  const TagObj = Tag.toObject();
                  delete TagObj._id; // Remove _id
                  return TagObj;
                });
                createdTags = await UserAuthService.createTag(
                  SITE_DB_NAME,
                  TagsWithoutIds,
                );
              }

              const siteOwnerRole =
                createdRoles !== "NA"
                  ? createdRoles.find((role) => role.roleName === roleName)
                  : null;
              const roleId = siteOwnerRole?._id || null;

              delete userDetails.userId;
              delete userDetails._id;
              delete userDetails.__v;
              delete userDetails?.roleId;
              delete userDetails?.roleName;
              delete userDetails?.designationId;

              const userData = {
                ...userDetails,
                roleName,
                roleId,
                designationId,
                showPassword,
                password: hashPassword,
              };
              // 6. Create user in tenant DB
              const createUser = await UserAuthService.createUser(
                SITE_DB_NAME,
                userData,
              );
              if (createUser === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgSignupError,
                  key: 2,
                };
                return res.status(200).json(record);
              }
              let companyLandmark = null;
              let companyCity = null;
              let companyState = null;
              let companyPublicProfile = null;
              let companyPrivateNotes = null;
              const companyNumber =
                await UserAuthService.checkCompanyNumber(SITE_DB_NAME);
              const industryName = await AuthService.getWorkspaceindustryName(
                createWorkspace._id,
              );

              const dataCompny = {
                companyType: true,
                createdBy: createUser._id,
                companyName,
                companyURL,
                companyEmail: email,
                companyNumber: companyNumber,
                companyAddress,
                companyCode,
                companyLandmark,
                companyCity,
                companyState,
                companyPrivateNotes,
                companyPublicProfile,
                industry: industryName,
                companycountryId: checkCountry?._id,
                companyCountryCode: checkCountry?.countryCode,
                companycountryName: checkCountry?.countryName,
              };
              const createdCompany = await UserAuthService.createCompany(
                SITE_DB_NAME,
                dataCompny,
              );
              if (createdCompany === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgSignupError,
                  key: 3,
                };
                return res.status(200).json(record);
              }
              const createWeekDay =
                await UserAuthService.createWeekDays(SITE_DB_NAME);
              if (createWeekDay === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgSignupError,
                  key: 4,
                };
                return res.status(200).json(record);
              }
              const updateUserData = {
                companyId: createdCompany?._id,
              };

              const updateUser = await UserAuthService.updateUser(
                SITE_DB_NAME,
                createUser?._id,
                updateUserData,
              );

              if (updateUser === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgSignupError,
                  key: 3,
                };
                return res.status(200).json(record);
              }
              const workflowName = "Workfloe Board";
              // const checkWorkflow = await UserCommenService.checkWorkflow(
              //   SITE_DB_NAME,
              //   workflowName,
              // );
              // if (checkWorkflow === "NA") {
              const workflowData = {
                name: workflowName,
                stages: [
                  { stageName: "Backlog", color: "#9CA3AF", order: 1 },
                  {
                    stageName: "In Progress",
                    color: "#FACC15",
                    order: 2,
                  },
                  { stageName: "Review", color: "#3B82F6", order: 3 },
                  { stageName: "Reopened", color: "#EC4899", order: 4 },
                  { stageName: "QA Testing", color: "#F97316", order: 5 },
                  { stageName: "Completed", color: "#8B5CF6", order: 6 },
                  { stageName: "Delivered", color: "#22C55E", order: 7 },
                ],
                createdBy: createUser._id,
              };
              const createWorkflow = await UserCommenService.createWorkflow(
                SITE_DB_NAME,
                workflowData,
              );
              if (createWorkflow === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgSignupError,
                  key: 4,
                };
                return res.status(200).json(record);
              }
              // }

              function calculatePlanPrice({
                users,
                price,
                planCategory = "Monthly", // Monthly, Half-Yearly, Yearly
                discountPercentage = 0,
                discountStartDate = null,
                discountEndDate = null,
                tax = 0,
              }) {
                // Duration factor
                let durationMultiplier = 1;
                if (planCategory === "Half-Yearly") durationMultiplier = 6;
                if (planCategory === "Yearly") durationMultiplier = 12;

                // Discount active check
                const today = new Date();
                const discountActive =
                  discountStartDate && discountEndDate
                    ? today >= new Date(discountStartDate) &&
                      today <= new Date(discountEndDate)
                    : false;

                // Discounted price
                const perUserPrice = discountActive
                  ? price - (price * discountPercentage) / 100
                  : price;

                // Subtotal (users × per user price × duration months)
                const subTotal = users * perUserPrice * durationMultiplier;

                // Discount amount (for info)
                const discountAmount = discountActive
                  ? (price - perUserPrice) * users * durationMultiplier
                  : 0;

                // Tax & total
                const taxAmount = (subTotal * tax) / 100;
                const totalPrice = subTotal + taxAmount;

                return {
                  perUserBasePrice: round2(price),
                  perUserPriceAfterDiscount: round2(perUserPrice),
                  planCategory,
                  durationMonths: durationMultiplier,
                  subTotalPrice: round2(subTotal),
                  discountApplied: discountActive ? discountPercentage : 0,
                  discountAmount: round2(discountAmount),
                  taxAmount: round2(taxAmount),
                  totalPrice: round2(totalPrice),
                };
              }
              const round2 = (num) => parseFloat(num?.toFixed(2) || 0);
              const plan = calculatePlanPrice({
                users: numberOfSeats,
                price: selectedPlan.price,
                planCategory: selectedPlan.planCategory,
                discountPercentage: selectedPlan.discountPercentage,
                discountStartDate: selectedPlan.discountStartDate,
                discountEndDate: selectedPlan.discountEndDate,
                tax: tax,
              });

              const startDate = new Date();
              const endDate = moment(startDate)
                .add(selectedPlan.durationInDays, "days")
                .toDate();
              const subscriptionPlanId = selectedPlan?._id;
              delete selectedPlan?._id;
              delete selectedPlan?.__v;
              const invoiceNumber =
                await UserAuthService.checkInvoiceLastNumber(SITE_DB_NAME);
              const ButySubscriptionData = {
                invoiceNumber: invoiceNumber,
                userId: createUser?._id,
                workspaceId: createWorkspace?._id,
                subscriptionPlanId,
                startDate,
                endDate,
                transactionId,
                subTotalPrice: plan?.subTotalPrice,
                discountAmount: plan?.discountAmount,
                discount,
                tax,
                taxAmount: plan?.taxAmount,
                numberOfSeats: numberOfSeats,
                totalPrice: plan?.totalPrice,
                featureIds: selectedPlan.featureIds,
                subFeatures: selectedPlan.subFeatures,
                title: selectedPlan.title,
                businessType: selectedPlan.businessType,
                planCategory: selectedPlan.planCategory,
                durationInDays: selectedPlan.durationInDays,
                description: selectedPlan.description,
                shortDescription: selectedPlan.shortDescription,
                price: selectedPlan.price,
                afterDiscountPrice: selectedPlan.price,
                discountPercentage: selectedPlan.discountPercentage || 0,
                discountStartDate: selectedPlan.discountStartDate || null,
                discountEndDate: selectedPlan.discountEndDate || null,
                currency: selectedPlan.currency,
                users: selectedPlan.users,
                projects: selectedPlan.projects,
                most_popular: selectedPlan.most_popular,
                by_index: selectedPlan.by_index,
                url: selectedPlan.url,
                showFlag: selectedPlan.showFlag,
              };

                const mainBuySubscriptionData = {
                  invoiceNumber: invoiceNumber,
                  userId: checkUserId?._id,
                  workspaceId: createWorkspace?._id,
                  subscriptionPlanId,
                  startDate,
                  endDate,
                  transactionId,
                  subTotalPrice: plan?.subTotalPrice,
                  discountAmount: plan?.discountAmount,
                  discount,
                  tax,
                  taxAmount: plan?.taxAmount,
                  numberOfSeats: numberOfSeats,
                  totalPrice: plan?.totalPrice,
                  featureIds: selectedPlan.featureIds,
                  subFeatures: selectedPlan.subFeatures,
                  title: selectedPlan.title,
                  businessType: selectedPlan.businessType,
                  planCategory: selectedPlan.planCategory,
                  durationInDays: selectedPlan.durationInDays,
                  description: selectedPlan.description,
                  shortDescription: selectedPlan.shortDescription,
                  price: selectedPlan.price,
                  afterDiscountPrice: selectedPlan.price,
                  discountPercentage: selectedPlan.discountPercentage || 0,
                  discountStartDate: selectedPlan.discountStartDate || null,
                  discountEndDate: selectedPlan.discountEndDate || null,
                  currency: selectedPlan.currency,
                  users: selectedPlan.users,
                  projects: selectedPlan.projects,
                  most_popular: selectedPlan.most_popular,
                  by_index: selectedPlan.by_index,
                  url: selectedPlan.url,
                  showFlag: selectedPlan.showFlag,
                };
              // 7. Create BuySubscriptionPlan in tenant DB
              const buySubscription = await UserAuthService.buySubscription(
                SITE_DB_NAME,
                ButySubscriptionData,
              );
              if (buySubscription === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgBuySubscriptionError,
                  key: 2,
                };
                return res.status(200).json(record);
              }
              const mainBuySubscription = await CommenService.buySubscription(
                mainBuySubscriptionData,
              );
              if (mainBuySubscription === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgMainBuySubscriptionError,
                  key: 2,
                };
                return res.status(200).json(record);
              }
              const domainResult =
                await CommenFunction.createRecord(workspaceFullDomain);
              const updateWorkspace = await AuthService.updateWorkspace(
                createWorkspace._id,
                { domainResult: domainResult },
              );

              const userDetailsMain = await UserCommenService.getUserDetails(
                SITE_DB_NAME,
                createUser._id,
              );
              const record = {
                success: true,
                msg: msg.msgSignupSuccess,
                data: {
                  userDetails: userDetailsMain,
                  workspaceDetails: createWorkspace,
                  buySubscriptionDetails: buySubscription,
                },
                key: 1,
              };
              return res.status(200).json(record);
            } else {
              return res.status(200).json({
                success: false,
                msg: msg.msgSignupError,
                key: 0,
              });
            }
          }
        } catch (error) {
          logger.error("Database error in signupStep2 and update application", {
            error: error.message,
          });
          return res.status(500).json({
            success: false,
            msg: msg.internalServerError,
            error: error.message,
            key: 1,
          });
        }
      } catch (error) {
        logger.error("Database error in signupStep2 application", {
          error: error.message,
          key: 2,
        });
        return res.status(500).json({
          success: false,
          msg: msg.internalServerError,
          error: error.message,
          key: 2,
        });
      }
    },
  ],

  login: [
    // Email validation
    body("email")
      .trim()
      .exists()
      .withMessage(msg.msgEmailReqired)
      .notEmpty()
      .withMessage(msg.msgEmailReqired)
      .isEmail()
      .withMessage(msg.msgEmailInvalidFormat),
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
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
      const data = req.body;
      const {
        playerId,
        loginType,
        deviceType,
        password,
        socialId,
        rememberMe,
      } = data;
      if (loginType === "google") {
        if (!socialId) {
          return res.status(200).json({
            success: false,
            msg: msg.msgSocialIdReqired,
            key: "socialId",
          });
        }
      } else {
        if (!password) {
          return res.status(200).json({
            success: false,
            msg: msg.msgPasswordReqired,
            key: "password",
          });
        }
      }
      {
        try {
          const email = data.email;
          const userIdCheck = await UserAuthService.checkEmail(
            SITE_DB_NAME,
            email,
          );
          if (userIdCheck === "NA") {
            const record = { success: false, msg: msg.msgEmailNotExist };
            return res.status(200).json(record);
          } else {
            try {
              if (loginType === "google") {
                const checkSocialIdStatus =
                  await UserAuthService.checkEmailAndSocialId(
                    SITE_DB_NAME,
                    email,
                    socialId,
                  );
                if (!checkSocialIdStatus) {
                  const record = {
                    success: false,
                    msg: msg.msgLoginSocialError,
                  };
                  return res.status(200).json(record);
                }
              } else {
                if (!userIdCheck.password) {
                  const record = {
                    success: false,
                    msg: msg.msgEmailPasswordNotExist,
                  };
                  return res.status(200).json(record);
                }
                const checkPasswordStatus =
                  await CommenFunction.comparePassword(
                    password,
                    userIdCheck.password,
                  );
                if (!checkPasswordStatus) {
                  const record = {
                    success: false,
                    msg: msg.msgEmailPasswordNotExist,
                  };
                  return res.status(200).json(record);
                }
              }

              try {
                const userId = userIdCheck._id;
                const userDetails = await UserCommenService.getUserDetails(
                  SITE_DB_NAME,
                  userId,
                );

                const jwtSecretKey = process.env.JWT_SECRET_KEY;
                const workspaceLogoutSettings =
                  await CommenService.getWorkspaceLogoutSettings(
                    req.CURRENT_SITE_WORKSPACE_ID,
                  );

                let expiresIn;

                if (workspaceLogoutSettings !== "NA") {
                  expiresIn = await CommenFunction.calculateTokenExpiry({
                    automaticLogOut: workspaceLogoutSettings.automaticLogOut,
                    customAutoLogout: workspaceLogoutSettings.customAutoLogout,
                    rememberMe: rememberMe,
                  });
                } else {
                  // fallback
                  expiresIn =
                    rememberMe === true || rememberMe === "true"
                      ? process.env.JWT_REMEMBER_ME_EXPIRES_IN
                      : process.env.JWT_EXPIRES_IN;
                }

                const token = jwt.sign({ userId: userId }, jwtSecretKey, {
                  expiresIn: expiresIn,
                });

                // let expiresIn;
                // if (rememberMe === true || rememberMe === "true") {
                //   expiresIn = process.env.JWT_REMEMBER_ME_EXPIRES_IN; // 30d
                // } else {
                //   expiresIn = process.env.JWT_EXPIRES_IN; // 12h
                // }
                // const token = jwt.sign({ userId: userId }, jwtSecretKey, {
                //   expiresIn: expiresIn,
                // });
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
                if (!userIdCheck.lastLoginTime) {
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
                const {
                  dbName,
                  dbHost,
                  dbUserName,
                  dbPassword,
                  ...workspaceDetails
                } = req?.CURRENT_SITE_WORKSPACE.toObject();
                const companyDetails = await UserCommenService.getCompany(
                  SITE_DB_NAME,
                  req.CURRENT_USER_ID,
                );
                const record = {
                  success: true,
                  msg: msg.msgLoginSuccess,
                  token: token,
                  data: {
                    userDetails: userDetails,
                    workspaceDetails: workspaceDetails,
                    companyDetails: companyDetails,
                  },
                };
                return res.status(200).json(record);
              } catch (error) {
                console.log("database error key 1", error.message);
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: error.message,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              console.log("database error key 2", error.message);
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: error.message,
              };
              return res.status(500).json(record);
            }
          }
        } catch (error) {
          console.log("database error key 3", error.message);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error.message,
          };
          return res.status(500).json(record);
        }
      }
    },
  ],
  checkWorkspaceDomain: [
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
        const workspaceDomain = req?.body?.companyName
          .replace(/\s+/g, "")
          .toLowerCase();
        const checkWorkspaceDomain =
          await AuthService.checkWorkspaceDomain(workspaceDomain);

        if (checkWorkspaceDomain !== "NA") {
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
        logger.error("Database error in checkWorkspaceDomain application", {
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

  //====================================== Post  Forgot password start ===========================

  forgotPassword: [
    body("email")
      .trim()
      .exists()
      .withMessage(msg.msgEmailReqired)
      .notEmpty()
      .withMessage(msg.msgEmailReqired)
      .isEmail()
      .withMessage(msg.msgEmailInvalidFormat),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      } else {
        try {
          const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
          const data = req.body;
          const email = data.email.toLowerCase();
          const checkUser = await UserAuthService.checkEmail(
            SITE_DB_NAME,
            email,
          );

          if (checkUser === "NA") {
            const record = { success: false, msg: msg.msgEmailNotExist };
            return res.status(200).json(record);
          } else {
            try {
              const now = new Date();
              const expireTime = new Date(
                now.getTime() +
                  Number(process.env.MAIL_EXPIRE_TIME) * 60 * 1000,
              );
              const otp = await CommenFunction.generateOtp(6);
              const forgotPassIdentity =
                await CommenFunction.generateRandomPassword(15);
              const data = {
                email: checkUser?.email,
                userId: checkUser?._id,
                roleName: checkUser?.roleName,
                mobileNumber: checkUser?.mobileNumber,
                otp,
                forgotPassIdentity,
                expireIn: expireTime,
              };
              const forgotId = await UserAuthService.forgotPassword(
                SITE_DB_NAME,
                data,
              );
              if (forgotId === 0) {
                const record = {
                  success: false,
                  msg: msg.msgPasswordResetLinkSendError,
                };
                return res.status(200).json(record);
              } else {
                const userDetails = await UserCommenService.getUserDetails(
                  SITE_DB_NAME,
                  checkUser._id,
                );
                let name = "NA";
                let languageId = "0";
                if (userDetails !== "NA") {
                  name = userDetails.name;
                  languageId = userDetails.languageId;
                }

                const fpCode = Buffer.from(
                  forgotId + "-" + expireTime + "-" + forgotPassIdentity,
                ).toString("base64");
                const siteURL = process.env.SITE_URL;
                const mailEmail = email;
                const mailName = name;
                const resetPassLink =
                  siteURL + "/resetpassword?uniqcode=" + fpCode;
                const mailSubject = msg.mailSubjectForgotPassword[languageId];
                const mailHeading = msg.mailHeadingForgotPassword[languageId];
                const headerGreeting =
                  msg.mailHeaderGreetingForgotPassword[languageId];

                try {
                  const mailFromName = process.env.MAIL_FROM_NAME;
                  const appName = process.env.APP_NAME;
                  const appLogo = process.env.APP_LOGO;
                  const borderBackground = process.env.BORDERBACKGROUND;
                  const footerGreeting = msg.mailFooterGreeting[languageId];
                  const footerDescription =
                    msg.mailFooterDescription[languageId];
                  const footerBackground = process.env.FOOTERBACKGROUND;
                  const mailContent =
                    msg.mailContentForgotPassword(
                      otp,
                      footerBackground,
                      appName,
                    )[languageId] +
                    "Please note that this OTP will expire in " +
                    process.env.MAIL_EXPIRE_TIME +
                    " Minutes  for your security. If the OTP expires, you can initiate a new request to verify your account from the otp verfiy page.";

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
                    const responce = await MailFunctions.mailSend(
                      mailEmail,
                      mailFromName,
                      mailSubject,
                      mailBody,
                    );
                    if (!responce) {
                      const record = {
                        success: false,
                        msg: msg.msgPasswordResetLinkSendError,
                      };
                      return res.status(200).json(record);
                    }
                    const record = {
                      success: true,
                      msg: msg.msgForgotPasswordOTPSuccess,
                      data: { fpCode, responce: responce },
                    };
                    return res.status(200).json(record);
                  } catch (error) {
                    logger.error("Database error in mail error key 2", {
                      error,
                    });
                    const record = {
                      success: false,
                      msg: msg.msgServerError,
                      key: error,
                    };
                    return res.status(500).json(record);
                  }
                } catch (error) {
                  logger.error("Database error in mail error key 1", {
                    error,
                  });
                  const record = {
                    success: false,
                    msg: msg.msgServerError,
                    key: error,
                  };
                  return res.status(500).json(record);
                }
              }
            } catch (error) {
              logger.error("Database error key 2", {
                error,
              });
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: error,
              };
              return res.status(500).json(record);
            }
          }
        } catch (error) {
          console.log(error.message);

          logger.error("Database error in  error key 3", {
            error: error.messsgae,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error.message,
          };
          return res.status(500).json(record);
        }
      }
    },
  ],
  forgotPasswordOtpVerify: [
    body("fpCode")
      .exists()
      .withMessage(msg.msgAllFieldReqired)
      .notEmpty()
      .withMessage(msg.msgAllFieldReqired),
    body("otp")
      .exists()
      .withMessage(msg.msgAllFieldReqired)
      .notEmpty()
      .withMessage(msg.msgAllFieldReqired),
    async (req, res) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(200).json({
            success: false,
            msg: errors.array()[0].msg,
          });
        }
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        const { fpCode, otp } = req.body;
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
        const forgotId = uniqueIdDataArr[0];
        const checkUserId = await UserAuthService.checkUserForgotId(
          SITE_DB_NAME,
          forgotId,
        );
        if (checkUserId === "NA") {
          const record = { success: false, msg: msg.msgOTPExpired, key: 1 };
          return res.status(200).json(record);
        }
        const now = new Date();

        const expiryTime = new Date(uniqueIdDataArr[1]).getTime();
        if (checkUserId.otpVerify === 1 || expiryTime < now.getTime()) {
          const record = { success: false, msg: msg.msgOTPExpired, key: 1 };
          return res.status(200).json(record);
        }

        const otpVerify = 1;
        const data = { otpVerify };
        const checkOTP = await UserAuthService.checkOTP(
          SITE_DB_NAME,
          forgotId,
          otp,
        );
        try {
          if (checkOTP === "NA") {
            return res.status(200).json({
              success: false,
              msg: msg.msgInvalidOTP,
              key: 1,
            });
          } else {
            // update process
            const updateForgot = await UserAuthService.updateForgotOTPVerify(
              SITE_DB_NAME,
              checkOTP._id,
              data,
            );
            if (updateForgot !== "NA") {
              const record = {
                success: true,
                msg: msg.msgOTPVerifySuccess,
                key: 1,
              };
              return res.status(200).json(record);
            } else {
              return res.status(200).json({
                success: false,
                msg: msg.msgOTPError,
                key: 0,
              });
            }
          }
        } catch (error) {
          logger.error("Database error in add user and update application", {
            error: error.message,
          });
          return res.status(500).json({
            success: false,
            msg: msg.internalServerError,
            error: error.message,
            key: 1,
          });
        }
      } catch (error) {
        logger.error("Database error in checkEmail application", {
          error: error.message,
        });
        return res.status(500).json({
          success: false,
          msg: msg.internalServerError,
          error: error.message,
          key: 2,
        });
      }
    },
  ],
  forgotPasswordOtpResend: [
    body("fpCode")
      .exists()
      .withMessage(msg.msgAllFieldReqired)
      .notEmpty()
      .withMessage(msg.msgAllFieldReqired),
    async (req, res) => {
      try {
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(200).json({
            success: false,
            msg: errors.array()[0].msg,
          });
        }

        const { fpCode } = req.body;
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
        const forgotId = uniqueIdDataArr[0];
        const otp = await CommenFunction.generateOtp(6);
        const otpVerify = 0;
        const data = {
          otp,
          otpVerify,
        };

        try {
          const checkUserForgotId = await UserAuthService.checkUserForgotId(
            SITE_DB_NAME,
            forgotId,
          );
          if (checkUserForgotId === "NA") {
            const record = { success: false, msg: msg.msgLinkInvalid, key: 1 };
            return res.status(200).json(record);
          } else {
            // update process
            const updateForgotOTPVerify =
              await UserAuthService.updateForgotOTPVerify(
                SITE_DB_NAME,
                checkUserForgotId._id,
                data,
              );
            if (updateForgotOTPVerify !== "NA") {
              try {
                const now = new Date();
                const expireTime = new Date(
                  now.getTime() +
                    Number(process.env.MAIL_EXPIRE_TIME) * 60 * 1000,
                );
                const forgotPassIdentity =
                  await CommenFunction.generateRandomPassword(15);
                const email = checkUserForgotId.email;
                if (!email) {
                  const record = {
                    success: false,
                    msg: msg.msgPasswordResetLinkSendError,
                  };
                  return res.status(200).json(record);
                } else {
                  const userDetails = await CommenService.getUserDetails(
                    checkUserForgotId.userId,
                  );
                  let languageId = "0";
                  let name = null;
                  if (userDetails !== "NA") {
                    languageId = userDetails.languageId;
                    name = userDetails.name;
                  }
                  const userId = checkUserForgotId._id;
                  const fpCode = Buffer.from(
                    userId + "-" + expireTime + "-" + forgotPassIdentity,
                  ).toString("base64");
                  //const siteURL = process.env.SITE_URL;
                  const mailEmail = email;
                  const mailName = name;
                  // const resetPassLink = siteURL + "/resetpassword?uniqcode=" + fpCode;
                  const mailSubject =
                    msg.mailSubjectResendForgotPassword[languageId];
                  const mailHeading =
                    msg.mailHeadingResendForgotPassword[languageId];
                  const headerGreeting =
                    msg.mailHeaderGreetingResendForgotPassword[languageId];

                  try {
                    const mailFromName = process.env.MAIL_FROM_NAME;
                    const appName = process.env.APP_NAME;
                    const appLogo = process.env.APP_LOGO;
                    const borderBackground = process.env.BORDERBACKGROUND;
                    const footerGreeting = msg.mailFooterGreeting[languageId];
                    const footerDescription =
                      msg.mailFooterDescription[languageId];
                    const footerBackground = process.env.FOOTERBACKGROUND;
                    const mailContent =
                      msg.mailContentResendForgotPassword(
                        otp,
                        footerBackground,
                        appName,
                      )[languageId] +
                      "Please note that this OTP will expire in " +
                      process.env.MAIL_EXPIRE_TIME +
                      " Minutes  for your security. If the OTP expires, you can initiate a new request to verify your account from the otp verfiy page.";

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
                        msg: msg.msgOTPSuccess,
                        data: { fpCode, responce: responce },
                        key: 1,
                      };
                      return res.status(200).json(record);
                    } catch (error) {
                      console.log("mail error key 2");
                      const record = {
                        success: false,
                        msg: msg.msgServerError,
                        key: error,
                      };
                      return res.status(500).json(record);
                    }
                  } catch (error) {
                    console.log("mail error key 1");
                    const record = {
                      success: false,
                      msg: msg.msgServerError,
                      key: error,
                    };
                    return res.status(500).json(record);
                  }
                }
              } catch (error) {
                console.log("database error key 2", error.message);
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: error,
                };
                return res.status(500).json(record);
              }
            } else {
              return res.status(200).json({
                success: false,
                msg: msg.msgOTPError,
                key: 0,
              });
            }
          }
        } catch (error) {
          logger.error("Database error in add user and update application", {
            error: error.message,
          });
          return res.status(500).json({
            success: false,
            msg: msg.internalServerError,
            error: error.message,
            key: 1,
          });
        }
      } catch (error) {
        logger.error("Database error in checkEmail application", {
          error: error.message,
        });
        return res.status(500).json({
          success: false,
          msg: msg.internalServerError,
          error: error.message,
          key: 2,
        });
      }
    },
  ],
  //====================================== resetPassword start ===========================

  resetPassword: [
    // password validation
    body("fpCode")
      .trim()
      .exists()
      .withMessage(msg.msgUniqueIdReqired)
      .notEmpty()
      .withMessage(msg.msgUniqueIdReqired),
    body("password")
      .trim()
      .exists()
      .withMessage(msg.msgPasswordReqired)
      .notEmpty()
      .withMessage(msg.msgPasswordReqired),
    async (req, res) => {
      try {
        const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res
            .status(200)
            .json({ success: false, msg: errors.array()[0].msg, key: 0 });
        } else {
          const { password, fpCode } = req.body;
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
          const forgotId = uniqueIdDataArr[0];
          const checkUserForgotID = await UserAuthService.checkUserForgotId(
            SITE_DB_NAME,
            forgotId,
          );
          if (checkUserForgotID === "NA") {
            const record = { success: false, msg: msg.msgLinkInvalid, key: 1 };
            return res.status(200).json(record);
          } else {
            const now = new Date();
            const expiryTime = new Date(uniqueIdDataArr[1]).getTime();
            if (
              checkUserForgotID.otpVerify === 0 ||
              expiryTime < now.getTime()
            ) {
              const record = { success: false, msg: msg.msgOTPExpired, key: 1 };
              return res.status(200).json(record);
            }
            if (
              checkUserForgotID.activeFlag === 0 ||
              expiryTime < now.getTime()
            ) {
              const record = { success: false, msg: msg.msgOTPExpired, key: 1 };
              return res.status(200).json(record);
            }
            try {
              const userId = checkUserForgotID.userId;
              const checkUserID = await UserAuthService.checkUserId(
                SITE_DB_NAME,
                userId,
              );
              if (checkUserID === "NA") {
                const record = { success: false, msg: msg.msgUserNotExist };
                return res.status(200).json(record);
              } else {
                try {
                  const data = { otpVerify: 1, activeFlag: 0 };
                  const updateForgotLink =
                    await UserAuthService.updateForgotOTPVerify(
                      SITE_DB_NAME,
                      checkUserForgotID._id,
                      data,
                    );

                  if (updateForgotLink === "NA") {
                    const record = {
                      success: false,
                      msg: msg.msgPasswordUpdateError,
                    };
                    return res.status(200).json(record);
                  }
                  const hashPassword =
                    await CommenFunction.hashPassword(password);
                  const resetUserPassword =
                    await UserAuthService.updateUserPassword(
                      SITE_DB_NAME,
                      password,
                      hashPassword,
                      userId,
                    );

                  if (resetUserPassword === "NA") {
                    const record = {
                      success: false,
                      msg: msg.msgPasswordUpdateError,
                    };

                    return res.status(200).json(record);
                  } else {
                    const record = {
                      success: true,
                      msg: msg.msgPasswordUpdateSuccess,
                    };

                    return res.status(200).json(record);
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
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: 3,
              };
              return res.status(500).json(record);
            }
          }
        }
      } catch (error) {
        console.log("database error key 4", error);
        const record = { success: false, msg: msg.msgServerError, key: 3 };
        return res.status(500).json(record);
      }
    },
  ],

  generate2FA: [
    async (req, res) => {
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

      const userId = CURRENT_USER_ID;

      try {
        // Generate secret
        const secret = speakeasy.generateSecret({
          name: `${process.env.APP_NAME} (${userId})`,
          length: 20,
        });

        // Generate QR
        const qr = await qrcode.toDataURL(secret.otpauth_url);

        // Save temporary secret (use DB)
        await UserAuthService.updateUser2FASecret(SITE_DB_NAME, userId, {
          tempSecret: secret.base32,
        });

        const record = {
          success: true,
          msg: msg.msgDataFound,
          key: 1,
          data: { qr, secret: secret.base32 },
        };

        return res.status(200).json(record);
      } catch (error) {
        console.error(error);
        const record = { success: false, msg: msg.msgServerError, key: 2 };
        return res.status(500).json(record);
      }
    },
  ],

  verify2FASetup: [
    async (req, res) => {
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
      const { token, currentPassword } = req.body;

      if (!token) {
        const record = { success: false, msg: msg.msgAllFieldReqired, key: 4 };
        return res.status(200).json(record);
      }

      const userId = CURRENT_USER_ID;

      try {
        const user = await UserAuthService.checkUser(SITE_DB_NAME, userId);
        if (user === "NA") {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        }
        const oldPasswordStatus = await CommenFunction.comparePassword(
          currentPassword,
          user.password,
        );
        if (oldPasswordStatus !== true) {
          const record = { success: false, msg: msg.msgOldPasswordWrong };
          return res.status(200).json(record);
        }
        if (!user?.twoFactorAuth?.tempSecret) {
          const record = {
            success: false,
            msg: "2FA not initialized.",
            key: 3,
          };
          return res.status(200).json(record);
        }

        const verified = speakeasy.totp.verify({
          secret: user?.twoFactorAuth?.tempSecret,
          encoding: "base32",
          token,
        });

        if (verified) {
          // Save permanent secret & remove temp
          await UserAuthService.updateUser2FASecret(SITE_DB_NAME, userId, {
            secret: user?.twoFactorAuth?.tempSecret,
            tempSecret: null,
          });

          const record = {
            success: true,
            msg: "2FA setup completed",
            key: 1,
          };
          return res.status(200).json(record);
        } else {
          const record = {
            success: false,
            msg: "Invalid 6-digit code",
            key: 5,
          };
          return res.status(200).json(record);
        }
      } catch (error) {
        console.error(error);
        const record = { success: false, msg: msg.msgServerError, key: 2 };
        return res.status(500).json(record);
      }
    },
  ],

  verify2FALogin: [
    async (req, res) => {
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
      const { token } = req.body;

      if (!token) {
        const record = { success: false, msg: msg.msgAllFieldReqired, key: 4 };
        return res.status(200).json(record);
      }

      const userId = CURRENT_USER_ID;

      try {
        const user = await UserCommenService.getUserDetails(
          SITE_DB_NAME,
          userId,
        );
        if (!user?.twoFactorAuth?.secret) {
          const record = { success: false, msg: "2FA not enabled.", key: 3 };
          return res.status(200).json(record);
        }

        const verified = speakeasy.totp.verify({
          secret: user?.twoFactorAuth?.secret,
          encoding: "base32",
          token,
          window: 1,
        });
        const now = new Date();
        const expiresIn = 15;
        const plus15Min = new Date(now.getTime() + expiresIn * 60 * 1000); // 15 minutes in ms
        verified &&
          (await UserAuthService.updateUser2FAExpiresAt(
            SITE_DB_NAME,
            userId,
            now,
          ));
        const record = {
          success: verified,
          msg: verified ? "2FA verified successfully!" : "Invalid code",
          key: verified ? 1 : 5,
          verifiedAt: verified ? plus15Min : null,
          generateKey: verified ? req?.generateKey || null : null,
        };

        return res.status(200).json(record);
      } catch (error) {
        console.error(error);
        const record = { success: false, msg: msg.msgServerError, key: 2 };
        return res.status(500).json(record);
      }
    },
  ],
  punch: [
    // Email validation
    body("uniqueId")
      .trim()
      .exists()
      .withMessage(msg.msgUniqueIdReqired)
      .notEmpty()
      .withMessage(msg.msgUniqueIdReqired),
    body("token")
      .trim()
      .exists()
      .withMessage(msg.msgTokenRequired)
      .notEmpty()
      .withMessage(msg.msgTokenRequired),
    body("punchDate")
      .trim()
      .exists()
      .withMessage(msg.msgDateReqired)
      .notEmpty()
      .withMessage(msg.msgDateReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
      const TENANT_ID = req?.CURRENT_SITE_DOMAIN;

      if (!SITE_DB_NAME) {
        const record = {
          success: false,
          msg: msg.msgDBNotIdentified,
          key: 4,
        };
        return res.status(200).json(record);
      }
      const data = req.body;
      if (data.token !== process.env.ATTN_SECRET_KEY) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgInvalidToken });
      }

      try {
        const userIdCheck = await UserAuthService.checkUserUniqueId(
          SITE_DB_NAME,
          data?.uniqueId,
        );
        if (userIdCheck === 0) {
          const record = { success: false, msg: msg.msgUniqueIdNotExist };
          return res.status(200).json(record);
        }
        const userId = userIdCheck._id;
        const jwtSecretKey = process.env.JWT_SECRET_KEY;
        const expiresIn = process.env.JWT_EXPIRES_IN;
        const TENANT_ID_KEY = process.env.TENANT_ID_KEY;
        const token = jwt.sign({ userId: userId }, jwtSecretKey, {
          expiresIn: expiresIn,
        });
        console.log("data", process.env.PUNCH_API);
        try {
          const punchResponse = await axios.post(process.env.PUNCH_API, data, {
            headers: {
              Authorization: `Bearer ${token}`, // Token pass karna
              [TENANT_ID_KEY]: TENANT_ID, // Token pass karna
            },
          });

          const record = {
            success: true,
            msg: msg.msgLoginSuccess,
            // token: token,
            data: { punchResponse: punchResponse.data },
          };
          return res.status(200).json(record);
        } catch (error) {
          console.log("database error key 0", error.message);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error.message,
            key1: 1,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error.message);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error.message,
          key1: 2,
        };
        return res.status(500).json(record);
      }
    },
  ],
};
