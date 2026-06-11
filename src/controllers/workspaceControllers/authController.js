require("dotenv").config();
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { body, query, param, validationResult } = require("express-validator");

const msg = require("../../helpers/languageMessageHelper");
const CommenFunction = require("../../helpers/commenHelper");
const MailFunctions = require("../../helpers/mailSendHelper");
const JwtGenerate = require("../../helpers/jwtGenerateHelper");

const CommenService = require("../../services/workspaceServices/commenService");
const OneSignalHelper = require("../../helpers/oneSignalHelper");
const AuthService = require("../../services/workspaceServices/authService");

module.exports = {
  //====================================== edit profile start ===========================

  // editProfile: [
  //   body("email").trim().exists().withMessage(msg.msgEmailReqired).notEmpty().withMessage(msg.msgEmailReqired).isEmail().withMessage(msg.msgEmailInvalidFormat),
  //   body("name").trim().exists().withMessage(msg.msgNameReqired).notEmpty().withMessage(msg.msgNameReqired),
  //   body("mobileNumber").trim().exists().withMessage(msg.msgMobileNumberReqired).notEmpty().withMessage(msg.msgMobileNumberReqired),
  //   async (req, res) => {
  //     const errors = validationResult(req);
  //     if (!errors.isEmpty()) {
  //       return res.status(200).json({ success: false, msg: errors.array()[0].msg });
  //     } else {
  //       const data = req.body;
  //       try {
  //         const userId = req.currentUserId;
  //         if (userId === 0) {
  //           const record = { success: false, msg: msg.msgUserNotExist };
  //           return res.status(200).json(record);
  //         } else {
  //           const { email, name, mobileNumber } = data;
  //           const checkOtherEmail = await AuthService.checkOtherUserEmail(userId, email);
  //           if (checkOtherEmail !== 0) {
  //             const record = { success: false, msg: msg.msgEmailAlreadyExist };
  //             return res.status(200).json(record);
  //           }
  //           let image;

  //           if (!req.file) {
  //             const userDetails = await CommenService.getUserDetails(userId);
  //             image = userDetails.image;
  //           } else if ("key" in req.file) {
  //             const filename = req.file.key;
  //             image = filename;
  //           } else {
  //             image = req.folderName + "/" + req.file.filename;
  //           }

  //           try {
  //             const updateUser = await AuthService.updateProfile(email, name, mobileNumber, userId, image);

  //             if (updateUser === 0) {
  //               const record = {
  //                 success: false,
  //                 msg: msg.msgProfileUpdateError,
  //               };
  //               return res.status(200).json(record);
  //             } else {
  //               const userDetails = await CommenService.getUserDetails(userId);
  //               const record = {
  //                 success: true,
  //                 msg: msg.msgProfileUpdateSuccess,
  //                 data: { userDetails: userDetails },
  //               };

  //               return res.status(200).json(record);
  //             }
  //           } catch (error) {
  //             console.log("database error key 2", error);

  //             const record = {
  //               success: false,
  //               msg: msg.msgServerError,
  //               key: error,
  //             };

  //             return res.status(500).json(record);
  //           }
  //         }
  //       } catch (error) {
  //         console.log("database error key 3", error);

  //         const record = { success: false, msg: msg.msgServerError, key: 3 };

  //         return res.status(500).json(record);
  //       }
  //     }
  //   },
  // ],
  // editUserProfile: [
  //   body("personalEmail").trim().exists().withMessage(msg.msgEmailReqired).notEmpty().withMessage(msg.msgEmailReqired).isEmail().withMessage(msg.msgEmailInvalidFormat),
  //   body("name").trim().exists().withMessage(msg.msgNameReqired).notEmpty().withMessage(msg.msgNameReqired),
  //   body("mobileNumber").trim().exists().withMessage(msg.msgMobileNumberReqired).notEmpty().withMessage(msg.msgMobileNumberReqired),
  //   async (req, res) => {
  //     const errors = validationResult(req);
  //     if (!errors.isEmpty()) {
  //       return res.status(200).json({ success: false, msg: errors.array()[0].msg });
  //     } else {
  //       const data = req.body;
  //       try {
  //         const userId = req.currentUserId;
  //         if (!userId && userId === 0) {
  //           const record = { success: false, msg: msg.msgUserNotExist };
  //           return res.status(200).json(record);
  //         } else {
  //           const {
  //             address,
  //             bloodGroup,
  //             city,
  //             dob,
  //             emergencyContactNumber,
  //             fatherName,
  //             firstName,
  //             gender,
  //             lastName,
  //             maritalStatus,
  //             mobileNumber,
  //             motherName,
  //             name,
  //             originalDob,
  //             pAddress,
  //             pCity,
  //             pPincode,
  //             pState,
  //             personalEmail,
  //             physicallyChallenged,
  //             pincode,
  //             spouseName,
  //             state,
  //             image,
  //             addressProof,
  //           } = data;

  //           try {
  //             const updateUser = await AuthService.updateUserProfile(
  //               userId,
  //               address,
  //               bloodGroup,
  //               city,
  //               dob,
  //               emergencyContactNumber,
  //               fatherName,
  //               firstName,
  //               gender,
  //               lastName,
  //               maritalStatus,
  //               mobileNumber,
  //               motherName,
  //               name,
  //               originalDob,
  //               pAddress,
  //               pCity,
  //               pPincode,
  //               pState,
  //               personalEmail,
  //               physicallyChallenged,
  //               pincode,
  //               spouseName,
  //               state,
  //               addressProof,
  //               image
  //             );

  //             if (updateUser === 0) {
  //               const record = {
  //                 success: false,
  //                 msg: msg.msgProfileUpdateError,
  //               };
  //               return res.status(200).json(record);
  //             } else {
  //               const userDetails = await CommenService.getUserDetails(userId);
  //               const record = {
  //                 success: true,
  //                 msg: msg.msgProfileUpdateSuccess,
  //                 data: { userDetails: userDetails },
  //               };

  //               return res.status(200).json(record);
  //             }
  //           } catch (error) {
  //             console.log("database error key 2", error);

  //             const record = {
  //               success: false,
  //               msg: msg.msgServerError,
  //               key: error,
  //             };

  //             return res.status(500).json(record);
  //           }
  //         }
  //       } catch (error) {
  //         console.log("database error key 3", error);

  //         const record = { success: false, msg: msg.msgServerError, key: 3 };

  //         return res.status(500).json(record);
  //       }
  //     }
  //   },
  // ],

  // updateProfileImage: [
  //   body("image").trim().exists().withMessage(msg.msgMobileNumberReqired).notEmpty().withMessage(msg.msgMobileNumberReqired),
  //   async (req, res) => {
  //     const errors = validationResult(req);
  //     if (!errors.isEmpty()) {
  //       return res.status(200).json({ success: false, msg: errors.array()[0].msg });
  //     } else {
  //       const data = req.body;
  //       try {
  //         const userId = req.currentUserId;
  //         if (!userId && userId === 0) {
  //           const record = { success: false, msg: msg.msgUserNotExist };
  //           return res.status(200).json(record);
  //         } else {
  //           const { image } = data;

  //           try {
  //             const updateUser = await AuthService.updateProfileImage(userId, image);

  //             if (updateUser === 0) {
  //               const record = {
  //                 success: false,
  //                 msg: msg.msgProfileUpdateError,
  //               };
  //               return res.status(200).json(record);
  //             } else {
  //               const userDetails = await CommenService.getUserDetails(userId);
  //               const record = {
  //                 success: true,
  //                 msg: msg.msgProfileUpdateSuccess,
  //                 data: { userDetails: userDetails },
  //               };

  //               return res.status(200).json(record);
  //             }
  //           } catch (error) {
  //             console.log("database error key 2", error);

  //             const record = {
  //               success: false,
  //               msg: msg.msgServerError,
  //               key: error,
  //             };

  //             return res.status(500).json(record);
  //           }
  //         }
  //       } catch (error) {
  //         console.log("database error key 3", error);

  //         const record = { success: false, msg: msg.msgServerError, key: 3 };

  //         return res.status(500).json(record);
  //       }
  //     }
  //   },
  // ],

  updatePlayerId: [
    body("playerId").trim().exists().withMessage(msg.msgMobileNumberReqired).notEmpty().withMessage(msg.msgMobileNumberReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(200).json({ success: false, msg: errors.array()[0].msg });
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
              const updateUser = await AuthService.updatePlayerId(userId, playerId);

              if (updateUser === 0) {
                const record = {
                  success: false,
                  msg: msg.msgProfileUpdateError,
                };
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
  ],

  //====================================== updatePassword start ===========================

  updatePassword: [
    // password validation
    body("oldPassword").trim().exists().withMessage(msg.msgOldPasswordReqired).notEmpty().withMessage(msg.msgOldPasswordReqired),
    body("password").trim().exists().withMessage(msg.msgPasswordReqired).notEmpty().withMessage(msg.msgPasswordReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(200).json({ success: false, msg: errors.array()[0].msg });
      } else {
        if (!req.currentUserId || !("currentUserId" in req) || req.currentUserId === "") {
          const record = {
            success: false,
            msg: msg.msgAllFieldReqired,
            key: 1,
          };
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
                const oldPasswordStatus = await CommenFunction.comparePassword(data.oldPassword, checkUserID.password);
                if (oldPasswordStatus !== true) {
                  const record = {
                    success: false,
                    msg: msg.msgOldPasswordWrong,
                  };
                  return res.status(200).json(record);
                } else {
                  const updateUserPassword = await AuthService.updateUserPassword(data.password, password, userId);
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
  ],

  profile: [
    async (req, res) => {
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
    },
  ],

  //====================================== Post  method end ===========================
};
