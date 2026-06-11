require("dotenv").config();
const jwt = require("jsonwebtoken");
const axios = require("axios");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const { body, query, param, validationResult } = require("express-validator");

const msg = require("../../helpers/hrLanguageMessageHelper");
const CommenFunction = require("../../helpers/commenHelper");
const MailFunctions = require("../../helpers/mailSendHelper");
const JwtGenerate = require("../../helpers/jwtGenerateHelper");

const AuthService = require("../../services/hrServices/authService");
const CommenService = require("../../services/hrServices/commenService");
const OneSignalHelper = require("../../helpers/oneSignalHelper");
//==
/**
 * Generate 2FA Secret & QR
 */
const generate2FA = async (req, res) => {
  if (!req.currentUserId) {
    const record = { success: false, msg: msg.msgAllFieldReqired, key: 4 };
    return res.status(200).json(record);
  }

  const userId = req.currentUserId;

  try {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `${process.env.APP_NAME} (${userId})`,
      length: 20,
    });

    // Generate QR
    const qr = await qrcode.toDataURL(secret.otpauth_url);

    // Save temporary secret (use DB)
    await CommenService.updateUser2FASecret(userId, {
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
};

/**
 * Verify & Enable 2FA
 */
const verify2FASetup = async (req, res) => {
  const { token, currentPassword } = req.body;

  if (!req.currentUserId || !token) {
    const record = { success: false, msg: msg.msgAllFieldReqired, key: 4 };
    return res.status(200).json(record);
  }

  const userId = req.currentUserId;

  try {
    const user = await CommenService.checkUser(userId);
    if (user === "NA") {
      const record = { success: false, msg: msg.msgUserNotExist };
      return res.status(200).json(record);
    }
    const oldPasswordStatus = await CommenFunction.comparePassword(
      currentPassword,
      user.password
    );
    if (oldPasswordStatus !== true) {
      const record = { success: false, msg: msg.msgOldPasswordWrong };
      return res.status(200).json(record);
    }
    if (!user?.twoFactorAuth?.tempSecret) {
      const record = { success: false, msg: "2FA not initialized.", key: 3 };
      return res.status(200).json(record);
    }

    const verified = speakeasy.totp.verify({
      secret: user?.twoFactorAuth?.tempSecret,
      encoding: "base32",
      token,
    });

    if (verified) {
      // Save permanent secret & remove temp
      await CommenService.updateUser2FASecret(userId, {
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
      const record = { success: false, msg: "Invalid 6-digit code", key: 5 };
      return res.status(200).json(record);
    }
  } catch (error) {
    console.error(error);
    const record = { success: false, msg: msg.msgServerError, key: 2 };
    return res.status(500).json(record);
  }
};

/**
 * Verify Login 2FA Token
 */
const verify2FALogin = async (req, res) => {
  const { token } = req.body;

  if (!req.currentUserId || !token) {
    const record = { success: false, msg: msg.msgAllFieldReqired, key: 4 };
    return res.status(200).json(record);
  }

  const userId = req.currentUserId;

  try {
    const user = await CommenService.getUserDetails(userId);
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
    verified && (await CommenService.updateUser2FAExpiresAt(userId, now));
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
};
//====================================== Post method start ===========================

const signIn = [
  // Email validation
  body("email")
    .trim()
    .exists()
    .withMessage(msg.msgEmailReqired)
    .notEmpty()
    .withMessage(msg.msgEmailReqired)
    .isEmail()
    .withMessage(msg.msgEmailInvalidFormat),
  body("password")
    .trim()
    .exists()
    .withMessage(msg.msgPasswordReqired)
    .notEmpty()
    .withMessage(msg.msgPasswordReqired),
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
    const data = req.body;

    const { playerId, loginType, deviceType } = data;
    {
      try {
        const userIdCheck = await AuthService.checkUserEmail(data);

        if (userIdCheck === 0) {
          const record = { success: false, msg: msg.msgEmailNotExist };
          return res.status(200).json(record);
        } else {
          try {
            const email = data.email;
            const password = data.password;

            const checkPasswordStatus = await CommenFunction.comparePassword(
              password,
              userIdCheck.password
            );
            if (!checkPasswordStatus) {
              const record = {
                success: false,
                msg: msg.msgEmailPasswordNotExist,
              };
              return res.status(200).json(record);
            } else {
              try {
                const userId = userIdCheck._id;
                const userDetails = await CommenService.getUserDetails(userId);
                if (userDetails.activeFlag === 0) {
                  const record = { success: false, msg: msg.msgDeactiveStatus };
                  return res.status(200).json(record);
                }
                if (userDetails.approveFlag === 0) {
                  const record = { success: false, msg: msg.msgApproveStatusError };
                  return res.status(200).json(record);
                }
                const jwtSecretKey = process.env.JWT_SECRET_KEY;
                const expiresIn = process.env.JWT_EXPIRES_IN;
                const token = jwt.sign({ userId: userId }, jwtSecretKey, {
                  expiresIn: expiresIn,
                });
                const deviceStatus =
                  await OneSignalHelper.DeviceTokenStore_1_Signal(
                    userId,
                    deviceType,
                    loginType,
                    playerId
                  );
                if (deviceStatus === "no") {
                  await OneSignalHelper.DeviceTokenStore_1_Signal(
                    userId,
                    deviceType,
                    loginType,
                    playerId
                  );
                }
                if (!userIdCheck.lastLoginTime) {
                  const APP_LOGO = process.env.APP_LOGO || "";
                  const APP_SITE_URL = process.env.SITE_URL || "";
                  const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                  const notiUserId = await CommenService.getSuperAdminId();
                  const notiOtherUserId = userId;
                  const action = "welcome";
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
                    await OneSignalHelper.getNotificationArrSingle(
                      notiUserId,
                      notiOtherUserId,
                      action,
                      actionId,
                      titles,
                      messages,
                      actionJson
                    );

                  if (notification !== "NA") {
                    notificationArr.push(notification);
                  }
                  if (notificationArr.length > 0) {
                    notificationArr.push(notification);
                    await OneSignalHelper.oneSignalNotificationSendCall(
                      notificationArr
                    );
                  }
                }

                const record = {
                  success: true,
                  msg: msg.msgLoginSuccess,
                  token: token,
                  data: { userDetails: userDetails },
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
];

//=========================== Verify Token

const verifyToken = async (req, res) => {
  const userDetails = req.currentUser;
  const record = {
    success: true,
    msg: msg.msgValidToken,
    data: { userDetails: userDetails },
  };
  return res.status(200).json(record);
};

//====================================== get profile start ===========================

const getProfile = async (req, res) => {
  if (req === "") {
    const record = { success: false, msg: msg.msgAllFieldReqired, key: 4 };
    return res.status(200).json(record);
  }

  if (req.currentUserId === "" || !("currentUser" in req)) {
    const record = { success: false, msg: msg.msgAllFieldReqired, key: 4 };
    return res.status(200).json(record);
  } else {
    const userId = req.currentUserId;
    try {
      const userDetails = await CommenService.getUserDetails(userId);

      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { userDetails: userDetails },
      };

      return res.status(200).json(record);
    } catch (error) {
      const record = { success: false, msg: msg.msgServerError, key: 2 };

      return res.status(500).json(record);
    }
  }
};

//====================================== Get method end ===========================
//====================================== edit profile start ===========================

const editProfile = [
  body("email")
    .trim()
    .exists()
    .withMessage(msg.msgEmailReqired)
    .notEmpty()
    .withMessage(msg.msgEmailReqired)
    .isEmail()
    .withMessage(msg.msgEmailInvalidFormat),
  body("name")
    .trim()
    .exists()
    .withMessage(msg.msgNameReqired)
    .notEmpty()
    .withMessage(msg.msgNameReqired),
  body("mobileNumber")
    .trim()
    .exists()
    .withMessage(msg.msgMobileNumberReqired)
    .notEmpty()
    .withMessage(msg.msgMobileNumberReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    } else {
      const data = req.body;
      try {
        const userId = req.currentUserId;
        if (userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        } else {
          const { email, name, mobileNumber } = data;
          const checkOtherEmail = await AuthService.checkOtherUserEmail(
            userId,
            email
          );
          if (checkOtherEmail !== 0) {
            const record = { success: false, msg: msg.msgEmailAlreadyExist };
            return res.status(200).json(record);
          }
          let image;

          if (!req.file) {
            const userDetails = await CommenService.getUserDetails(userId);
            image = userDetails.image;
          } else if ("key" in req.file) {
            const filename = req.file.key;
            image = filename;
          } else {
            image = req.folderName + "/" + req.file.filename;
          }

          try {
            const updateUser = await AuthService.updateProfile(
              email,
              name,
              mobileNumber,
              userId,
              image
            );

            if (updateUser === 0) {
              const record = { success: false, msg: msg.msgProfileUpdateError };
              return res.status(200).json(record);
            } else {
              const userDetails = await CommenService.getUserDetails(userId);
              const record = {
                success: true,
                msg: msg.msgProfileUpdateSuccess,
                data: { userDetails: userDetails },
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

        const record = { success: false, msg: msg.msgServerError, key: 3 };

        return res.status(500).json(record);
      }
    }
  },
];
const editUserProfile = [
  body("personalEmail")
    .trim()
    .exists()
    .withMessage(msg.msgEmailReqired)
    .notEmpty()
    .withMessage(msg.msgEmailReqired)
    .isEmail()
    .withMessage(msg.msgEmailInvalidFormat),
  body("name")
    .trim()
    .exists()
    .withMessage(msg.msgNameReqired)
    .notEmpty()
    .withMessage(msg.msgNameReqired),
  body("mobileNumber")
    .trim()
    .exists()
    .withMessage(msg.msgMobileNumberReqired)
    .notEmpty()
    .withMessage(msg.msgMobileNumberReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    } else {
      const data = req.body;
      try {
        const userId = req.currentUserId;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        } else {
          const {
            address,
            bloodGroup,
            city,
            dob,
            emergencyContactNumber,
            fatherName,
            firstName,
            gender,
            lastName,
            maritalStatus,
            mobileNumber,
            motherName,
            name,
            originalDob,
            pAddress,
            pCity,
            pPincode,
            pState,
            personalEmail,
            physicallyChallenged,
            pincode,
            spouseName,
            state,
            image,
            addressProof,
          } = data;

          try {
            const updateUser = await AuthService.updateUserProfile(
              userId,
              address,
              bloodGroup,
              city,
              dob,
              emergencyContactNumber,
              fatherName,
              firstName,
              gender,
              lastName,
              maritalStatus,
              mobileNumber,
              motherName,
              name,
              originalDob,
              pAddress,
              pCity,
              pPincode,
              pState,
              personalEmail,
              physicallyChallenged,
              pincode,
              spouseName,
              state,
              addressProof,
              image
            );

            if (updateUser === 0) {
              const record = { success: false, msg: msg.msgProfileUpdateError };
              return res.status(200).json(record);
            } else {
              const userDetails = await CommenService.getUserDetails(userId);
              const record = {
                success: true,
                msg: msg.msgProfileUpdateSuccess,
                data: { userDetails: userDetails },
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

        const record = { success: false, msg: msg.msgServerError, key: 3 };

        return res.status(500).json(record);
      }
    }
  },
];
const updateProfileImage = [
  body("image")
    .trim()
    .exists()
    .withMessage(msg.msgMobileNumberReqired)
    .notEmpty()
    .withMessage(msg.msgMobileNumberReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    } else {
      const data = req.body;
      try {
        const userId = req.currentUserId;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        } else {
          const { image } = data;

          try {
            const updateUser = await AuthService.updateProfileImage(
              userId,
              image
            );

            if (updateUser === 0) {
              const record = { success: false, msg: msg.msgProfileUpdateError };
              return res.status(200).json(record);
            } else {
              const userDetails = await CommenService.getUserDetails(userId);
              const record = {
                success: true,
                msg: msg.msgProfileUpdateSuccess,
                data: { userDetails: userDetails },
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

        const record = { success: false, msg: msg.msgServerError, key: 3 };

        return res.status(500).json(record);
      }
    }
  },
];
const updatePlayerId = [
  body("playerId")
    .trim()
    .exists()
    .withMessage(msg.msgMobileNumberReqired)
    .notEmpty()
    .withMessage(msg.msgMobileNumberReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    } else {
      const data = req.body;
      try {
        const userId = req.currentUserId;
        if (!userId && userId === 0) {
          const record = { success: false, msg: msg.msgUserNotExist };
          return res.status(200).json(record);
        } else {
          const { playerId } = data;

          try {
            const updateUser = await AuthService.updatePlayerId(
              userId,
              playerId
            );

            if (updateUser === 0) {
              const record = { success: false, msg: msg.msgProfileUpdateError };
              return res.status(200).json(record);
            } else {
              const userDetails = await CommenService.getUserDetails(userId);
              const record = {
                success: true,
                msg: msg.msgProfileUpdateSuccess,
                data: { userDetails: userDetails },
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

        const record = { success: false, msg: msg.msgServerError, key: 3 };

        return res.status(500).json(record);
      }
    }
  },
];

//====================================== updatePassword start ===========================

const updatePassword = [
  // password validation
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
        !req.currentUserId ||
        !("currentUserId" in req) ||
        req.currentUserId === ""
      ) {
        const record = { success: false, msg: msg.msgAllFieldReqired, key: 1 };
        return res.status(200).json(record);
      } else {
        try {
          const data = req.body;
          const userId = req.currentUserId;
          const checkUserID = await CommenService.checkUser(userId);
          if (checkUserID === "NA") {
            const record = { success: false, msg: msg.msgUserNotExist };
            return res.status(200).json(record);
          } else {
            try {
              const password = await CommenFunction.hashPassword(data.password);
              const oldPasswordStatus = await CommenFunction.comparePassword(
                data.oldPassword,
                checkUserID.password
              );
              if (oldPasswordStatus !== true) {
                const record = { success: false, msg: msg.msgOldPasswordWrong };
                return res.status(200).json(record);
              } else {
                const updateUserPassword = await AuthService.updateUserPassword(
                  data.password,
                  password,
                  userId
                );
                if (updateUserPassword === 0) {
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
];
//====================================== Post  Forgot password start ===========================

const forgotPassword = [
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
        const data = req.body;
        const checkUser = await AuthService.checkUserEmail(data);

        if (checkUser === 0) {
          const record = { success: false, msg: msg.msgEmailNotExist };
          return res.status(200).json(record);
        } else {
          try {
            const email = data.email.toLowerCase();
            const now = new Date();
            const expireTime = now.setMinutes(
              now.getMinutes() + process.env.MAIL_EXPIRE_TIME
            );
            const otp = await CommenFunction.generateOtp(4);
            const forgotPassIdentity =
              await CommenFunction.generateRandomPassword(15);
            const forgotId = await AuthService.forgotPassword(
              email,
              checkUser,
              expireTime,
              otp,
              forgotPassIdentity
            );

            if (forgotId === 0) {
              const record = {
                success: false,
                msg: msg.msgPasswordResetLinkSendError,
              };
              return res.status(200).json(record);
            } else {
              const userDetails = await CommenService.getUserDetails(
                checkUser._id
              );
              let name = "NA";
              let languageId = "0";
              if (userDetails !== "NA") {
                name = userDetails.name;
                languageId = userDetails.languageId;
              }

              const fpCode = Buffer.from(
                forgotId + "-" + expireTime + "-" + forgotPassIdentity
              ).toString("base64");
              const siteURL = process.env.SITE_URL;
              const APP_URL = process.env.APP_URL;
              const mailEmail = email;
              const mailName = name;
              // const resetPassLink =
              //   siteURL + "/resetpassword?uniqcode=" + fpCode;
                
              const resetPassLink =`${APP_URL}/commen/redirect/${fpCode}?type=forgot`;
              const mailSubject = msg.mailSubjectForgotPassword[languageId];
              const mailHeading = msg.mailHeadingForgotPassword[languageId];
              const headerGreeting =
                msg.mailHeaderGreetingForgotPassword[languageId];
              const mailContent =
                msg.mailContentForgotPassword[languageId] +
                '<a href="' +
                resetPassLink +
                '" style="float: unset; width: 25%; display: block; margin: 26px auto 0; background:' +
                process.env.FOOTERBACKGROUND +
                '; text-align: center; vertical-align: middle; user-select: none; border: 1px solid transparent; padding: .375rem .75rem; font-size: .875rem; line-height: 1.5; border-radius: .25rem; transition: color .15s ease-in-out,background-color .15s ease-in-out,border-color .15s ease-in-out,box-shadow .15s ease-in-out; color: #fff;text-decoration: unset;">' +
                msg.mailResetButtonForgotPassword[languageId] +
                "</a><br/><br/>Please note that this link will expire in " +
                process.env.MAIL_EXPIRE_TIME +
                " Minutes  for your security. If the link expires, you can initiate a new request to reset your password from the HRMS login page.";

              try {
                const mailFromName = process.env.MAIL_FROM_NAME;
                const appName = process.env.APP_NAME;
                const appLogo = process.env.APP_LOGO;
                const borderBackground = process.env.BORDERBACKGROUND;
                const footerGreeting = msg.mailFooterGreeting[languageId];
                const footerDescription = msg.mailFooterDescription[languageId];
                const footerBackground = process.env.FOOTERBACKGROUND;

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
                    mailBody
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
                    msg: msg.msgPasswordResetLinkSendSuccess,
                    data: { responce: responce },
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
            console.log("database error key 2");
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: error,
            };
            return res.status(500).json(record);
          }
        }
      } catch (error) {
        console.log("database error key 3");
        const record = { success: false, msg: msg.msgServerError, key: error };
        return res.status(500).json(record);
      }
    }
  },
];

//====================================== resetPassword start ===========================

const resetPassword = [
  // password validation
  body("uniqueId")
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    } else {
      const { password, uniqueId } = req.body;
      const uniqueIdDataDecode = Buffer.from(uniqueId, "base64").toString();
      const uniqueIdDataArr = uniqueIdDataDecode.split("-");
      if (uniqueIdDataArr.length === 0) {
        const record = { success: false, msg: msg.msgAllFieldReqired, key: 1 };
        return res.status(200).json(record);
      }
      const forgotId = uniqueIdDataArr[0];
      const checkUserForgotID = await AuthService.checkUserForgotId(forgotId);
      if (checkUserForgotID === 0) {
        const record = { success: false, msg: msg.msgLinkInvalid, key: 1 };
        return res.status(200).json(record);
      } else {
        const now = new Date();
        if (
          checkUserForgotID.activeFlag === 0 ||
          checkUserForgotID.expireIn < now
        ) {
          const record = { success: false, msg: msg.msgLinkExpired, key: 1 };
          return res.status(200).json(record);
        }
        try {
          const userId = checkUserForgotID.userId;
          const checkUserID = await CommenService.checkUser(userId);
          if (checkUserID === "NA") {
            const record = { success: false, msg: msg.msgUserNotExist };
            return res.status(200).json(record);
          } else {
            try {
              const updateForgotLink = await AuthService.updatePasswordLink(
                forgotId
              );

              if (updateForgotLink === 0) {
                const record = {
                  success: false,
                  msg: msg.msgPasswordUpdateError,
                };
                return res.status(200).json(record);
              }
              const hashPassword = await CommenFunction.hashPassword(password);
              const resetUserPassword = await AuthService.updateUserPassword(
                password,
                hashPassword,
                userId
              );

              if (resetUserPassword === 0) {
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
          const record = { success: false, msg: msg.msgServerError, key: 3 };
          return res.status(500).json(record);
        }
      }
    }
  },
];
const profile = async (req, res) => {
  if (!req.currentUserId) {
    return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
  } else {
    try {
      const employeeId = req.currentUserId;
      const checkEmployee = await CommenService.checkEmployeeOne(employeeId);
      if (checkEmployee === 0) {
        const record = {
          success: false,
          msg: msg.msgEmployeeNotExist,
        };
        return res.status(200).json(record);
      }
      try {
        const employee = await CommenService.viewEmployee(checkEmployee);
        if (employee === "NA") {
          const record = {
            success: true,
            msg: msg.msgDataNotFound,
            data: { employee: "NA" },
          };
          return res.status(200).json(record);
        }
        const record = {
          success: true,
          msg: msg.msgDataFound,
          data: { employee: employee },
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
};
const punch = [
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
    } else {
      try {
        const data = req.body;
        if (data.token !== process.env.ATTN_SECRET_KEY) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgInvalidToken });
        } else {
          try {
            const userIdCheck = await AuthService.checkUserUniqueId(data);

            if (userIdCheck === 0) {
              const record = { success: false, msg: msg.msgUniqueIdNotExist };
              return res.status(200).json(record);
            }

            try {
              const userId = userIdCheck._id;
              const userDetails = await CommenService.getUserDetails(userId);

              const jwtSecretKey = process.env.JWT_SECRET_KEY;
              const expiresIn = process.env.JWT_EXPIRES_IN;
              const token = jwt.sign({ userId: userId }, jwtSecretKey, {
                expiresIn: expiresIn,
              });

              try {
                const punchResponse = await axios.post(
                  process.env.PUNCH_API,
                  data,
                  {
                    headers: {
                      Authorization: `Bearer ${token}`, // Token pass karna
                    },
                  }
                );

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
                };
                return res.status(500).json(record);
              }
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
];
//====================================== Post  method end ===========================

module.exports = {
  punch,
  generate2FA,
  verify2FASetup,
  verify2FALogin,
  signIn,
  verifyToken,
  getProfile,
  profile,
  editProfile,
  editUserProfile,
  updateProfileImage,
  updatePlayerId,
  updatePassword,
  forgotPassword,
  resetPassword,
  
};
