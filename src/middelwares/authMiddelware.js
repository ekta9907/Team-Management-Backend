require("dotenv").config();
const jwt = require("jsonwebtoken");
const CommenService = require("../services/superAdminServices/commenService");
const AuthService = require("../services/websiteServices/authService");
const SiteCommenService = require("../services/workspaceServices/commenService");
const msg = require("../helpers/languageMessageHelper");
const { getTenantStorageSize } = require("./s3StorageMiddleware");
// const CommenFunction = require("../helpers/commenHelper");//
//**************************** Super Admin AUTH */
exports.auth = async (req, res, next) => {
  try {
    const origin = req.headers.origin || req.get("origin");
    let subdomain = null;
    if (origin) {
      const hostname = new URL(origin).hostname;
      const parts = hostname.split(".");
      subdomain = parts.length > 2 ? parts[0] : null;
    }

    if (!req.headers.authorization) {
      const record = { success: false, msg: msg.msgExpiredToken, key: 1 };
      return res.json(record);
    }
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      const record = { success: false, msg: msg.msgExpiredToken, key: 2 };

      return res.json(record);
    }
    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userVerification = await CommenService.checkUser(decode.userId);

    if (userVerification === "NA") {
      const record = { success: false, msg: msg.msgExpiredToken, key: 3 };
      return res.json(record);
    }
    const userId = userVerification._id;

    if (userVerification.deleteFlag === 1) {
      const record = { success: false, msg: msg.msgUserNotExist, key: 4 };
      return res.json(record);
    }
    if (userVerification.activeFlag === 0) {
      const record = { success: false, msg: msg.msgDeactiveStatus, key: 4 };
      return res.json(record);
    }
    const updateLoginTime = await CommenService.updateLoginTime(userId);
    if (updateLoginTime === "NA") {
      const record = { success: false, msg: msg.msgUserNotExist, key: 5 };
      return res.json(record);
    }

    const getUserDetails = await CommenService.getUserDetails(userId);
    if (getUserDetails === "NA") {
      const record = {
        success: false,
        msg: msg.msgUserNotExist,
        key: 6,
        getUserDetails,
      };
      return res.json(record);
    }

    req.currentUser = getUserDetails;
    req.currentUserId = userId;
    req.CURRENT_SITE_DOMAIN = subdomain;
    req.CURRENT_SITE_DB_NAME = "NA";
    req.CURRENT_SITE_WORKSPACE = "NA";
    req.CURRENT_SITE_WORKSPACE_ID = "NA";
    req.CURRENT_USER = getUserDetails;
    req.CURRENT_USER_ID = userId;
    console.log("success pass from auth middleware");
    next();
  } catch (error) {
    console.log("error", error.message);
    return res.json({
      success: false,
      msg: msg.msgExpiredToken,
      tokenExpStatus: true,
      key: 7,
    });
  }
};

//**************************** Super Admin AUTH */
exports.originAuth = async (req, res, next) => {
  try {
    let uniqueId = req.headers["x-unique-id"];
    if (uniqueId) {
      // const pattern1 = /^[A-Z]{2}-[A-Z]{2}-\d{4}-\d{4}$/;
      //         const pattern2 = /^[A-Z]{2}-[A-Z]{2}-\d{4}$/;

      //         if (!pattern1.test(uniqueId)) {
      //           return res.status(200).json({
      //             success: false,
      //             msg: msg.msgUniqueIdNotExist,
      //           });
      //         }
      //         uniqueId = uniqueId.slice(0, -5);
      //         if (!pattern2.test(uniqueId)) {
      //           return res.status(200).json({
      //             success: false,
      //             msg: msg.msgUniqueIdNotExist,
      //           });
      //         }
      const uniqueIdParts = uniqueId?.split("-") || [];
      const uniqueIdLastPart = uniqueIdParts.length > 0 ? uniqueIdParts[uniqueIdParts.length - 1] : null;
      const uniqueIdRemainingPart = uniqueIdParts.length > 1 ? uniqueIdParts.slice(0, -1).join("-") : null;
      const checkUniqueId = await AuthService.checkUniqueId(uniqueIdRemainingPart);
      if (checkUniqueId === "NA") {
        return res.status(200).json({
          success: false,
          msg: msg.msgUniqueIdNotExist,
          key: 1,
        });
      }

      req.headers["x-tenant-id"] = checkUniqueId?.workspaceDomain;
      if (uniqueIdLastPart) {
        req.body.uniqueId = uniqueIdLastPart;
      }
    }
    let subdomain = req.headers["x-tenant-id"];

    if (!subdomain) {
      const origin = req.headers.origin || req.headers.host;
      if (origin) {
        const hostname = origin.replace(/^https?:\/\//, "").split(":")[0];
        const parts = hostname.split("."); // abc from abc.domain.com
        subdomain = parts.length > 2 ? parts[0] : null;
      }
    }
    if (!subdomain) {
      return res.json({
        success: false,
        msg: msg.msgSiteNotExist,
        wrongSite: true,
        key: "tenant",
      });
    }

    const checkWorkspaceDomain = await AuthService.checkWorkspaceDomain(subdomain);
    if (checkWorkspaceDomain === "NA") {
      const record = {
        success: false,
        msg: msg.msgWrongSiteError,
        wrongSite: true,
        key: 5,
      };
      return res.json(record);
    }
    if (checkWorkspaceDomain.activeFlag === 0) {
      const record = {
        success: false,
        msg: msg.msgDeactivetedSiteSuccess,
        wrongSite: true,
        key: 6,
      };
      return res.json(record);
    }
    req.CURRENT_SITE_DB_NAME = checkWorkspaceDomain?.dbName;
    req.CURRENT_SITE_DOMAIN = checkWorkspaceDomain?.workspaceDomain;
    req.CURRENT_SITE_WORKSPACE = checkWorkspaceDomain;
    req.CURRENT_SITE_WORKSPACE_ID = checkWorkspaceDomain?._id;
    req.CURRENT_SITE_WORKSPACE_NUMBER = checkWorkspaceDomain?.workapaceNumber || null;
    // const data = await getTenantStorageSize(req?.CURRENT_SITE_WORKSPACE_NUMBER, null, null);
    // console.log(data);
    console.log("success pass from origin auth middleware");
    next();
  } catch (error) {
    return res.json({
      success: false,
      msg: msg.msgServerError,
      key: 7,
      error: error.message,
    });
  }
};

exports.siteAuth = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      const record = { success: false, msg: msg.msgExpiredToken, key: 1 };
      return res.json(record);
    }
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      const record = { success: false, msg: msg.msgExpiredToken, key: 2 };

      return res.json(record);
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!req.CURRENT_SITE_DB_NAME) {
      const record = { success: false, msg: msg.msgExpiredToken, key: 3 };
      return res.json(record);
    }
    const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;

    const userVerification = await SiteCommenService.checkUser(SITE_DB_NAME, decode.userId);

    if (userVerification === "NA") {
      const record = { success: false, msg: msg.msgExpiredToken, key: 3, error: userVerification };
      return res.json(record);
    }
    const userId = userVerification?._id;
    const userName = userVerification?.name;
    const userRoleName = userVerification?.roleName;

    if (userVerification.deleteFlag === 1) {
      const record = { success: false, msg: msg.msgUserNotExist, key: 4 };
      return res.json(record);
    }
    if (userVerification.activeFlag === 0) {
      const record = { success: false, msg: msg.msgDeactiveStatus, key: 4 };
      return res.json(record);
    }
    const updateLoginTime = await SiteCommenService.updateLoginTime(SITE_DB_NAME, userId);
    if (updateLoginTime === "NA") {
      const record = { success: false, msg: msg.msgUserNotExist, key: 5 };
      return res.json(record);
    }

    const getUserDetails = await SiteCommenService.getUserDetails(SITE_DB_NAME, userId);
    if (getUserDetails === "NA") {
      const record = {
        success: false,
        msg: msg.msgUserNotExist,
        key: 6,
      };
      return res.json(record);
    }
    const endpointName = (req?.path || "").toString().split("/").filter(Boolean).pop() || "";
    if (endpointName === "attendance-punch-app") {
      if (getUserDetails?.manualPunch !== 1) {
        const record = {
          success: false,
          msg: msg.msgUserNotExist,
          key: "self punch",
        };
        return res.json(record);
      }
    }
    req.CURRENT_USER = getUserDetails;
    req.CURRENT_USER_ID = userId;
    req.CURRENT_USER_NAME = userName;
    console.log("success pass from site auth middleware");
    next();
  } catch (error) {
    console.log("error", error.message);
    return res.json({
      success: false,
      msg: msg.msgExpiredToken,
      tokenExpStatus: true,
      key: 7,
      error: error.message,
    });
  }
};
exports.getAppSiteAuth2F = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      const record = { success: false, msg: msg.msgExpiredToken, key: 1 };
      return res.json(record);
    }
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      const record = { success: false, msg: msg.msgExpiredToken, key: 2 };

      return res.json(record);
    }

    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!req.CURRENT_SITE_DB_NAME) {
      const record = { success: false, msg: msg.msgExpiredToken, key: 3 };
      return res.json(record);
    }
    const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;

    const userVerification = await SiteCommenService.checkUser(SITE_DB_NAME, decode.userId);

    if (userVerification === "NA") {
      const record = { success: false, msg: msg.msgExpiredToken, key: 3, error: userVerification };
      return res.json(record);
    }
    const userId = userVerification._id;
    const userName = userVerification.name;
    const userRoleName = userVerification.roleName;

    if (userVerification.deleteFlag === 1) {
      const record = { success: false, msg: msg.msgUserNotExist, key: 4 };
      return res.json(record);
    }
    if (userVerification.activeFlag === 0) {
      const record = { success: false, msg: msg.msgDeactiveStatus, key: 4 };
      return res.json(record);
    }
    const updateLoginTime = await SiteCommenService.updateLoginTime(SITE_DB_NAME, userId);
    if (updateLoginTime === "NA") {
      const record = { success: false, msg: msg.msgUserNotExist, key: 5 };
      return res.json(record);
    }

    const getUserDetails = await SiteCommenService.getUserDetails(SITE_DB_NAME, userId);
    if (getUserDetails === "NA") {
      const record = {
        success: false,
        msg: msg.msgUserNotExist,
        key: 6,
        getUserDetails,
      };
      return res.json(record);
    }

    req.CURRENT_USER = getUserDetails;
    req.CURRENT_USER_ID = userId;
    req.CURRENT_USER_NAME = userName;

    const jwtSecretKey = process.env.JWT_SECRET_KEY;
    const expiresIn = "30m";
    const generateKey = jwt.sign({ userId: userId }, jwtSecretKey, {
      expiresIn: expiresIn,
    });
    req.generateKey = generateKey;
    next();
  } catch (error) {
    return res.json({ success: false, msg: msg.msgExpiredToken, tokenExpStatus: true, key: 1445, error: error.message });
  }
};
exports.workFromHome = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      const record = { success: false, msg: msg.msgExpiredToken, key: 1 };
      return res.json(record);
    }
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      const record = { success: false, msg: msg.msgExpiredToken, key: 2 };

      return res.json(record);
    }
    const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userVerification = await UserService.checkUser(decode.userId);

    if (userVerification === "NA") {
      const record = { success: false, msg: msg.msgExpiredToken, key: 3 };
      return res.json(record);
    }
    const userId = userVerification._id;

    if (userVerification.deleteFlag === 1) {
      const record = { success: false, msg: msg.msgUserNotExist, key: 4 };
      return res.json(record);
    }
    if (userVerification.activeFlag === 0) {
      const record = { success: false, msg: msg.msgDeactiveStatus, key: 4 };
      return res.json(record);
    }
    const updateLoginTime = await UserService.updateLoginTime(userId);
    if (updateLoginTime === "NA") {
      const record = { success: false, msg: msg.msgUserNotExist, key: 5 };
      return res.json(record);
    }

    const getUserDetails = await UserService.getUserDetails(userId);
    if (getUserDetails === "NA") {
      const record = { success: false, msg: msg.msgUserNotExist, key: 6, getUserDetails };
      return res.json(record);
    }
    if (getUserDetails?.manualPunch !== 1) {
      const record = { success: false, msg: msg.msgUserNotExist, key: 6, getUserDetails };
      return res.json(record);
    }

    req.currentUser = getUserDetails;
    req.currentUserId = userId;
    console.log("success pass from auth middleware");

    next();
  } catch (error) {
    return res.json({ success: false, msg: msg.msgExpiredToken, tokenExpStatus: true, key: 7 });
  }
};
exports.appAuth = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      const record = { success: false, msg: msg.msgExpiredToken, key: 2441 };

      return res.json(record);
    }
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      const record = { success: false, msg: msg.msgExpiredToken, key: 2442 };

      return res.json(record);
    }
    let decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userVerification = await UserService.checkUser(decode.userId);

    if (userVerification === "NA") {
      const record = { success: false, msg: msg.msgExpiredToken, key: 2443 };
      return res.json(record);
    }
    const userId = userVerification._id;
    if (!userVerification) {
      const record = { success: false, msg: msg.msgExpiredToken, key: 2443 };
      return res.json(record);
    }

    if (userVerification.deleteFlag === 1 || (userVerification.roleName !== "Super-Admin" && userVerification.roleName !== "Admin")) {
      const record = { success: false, msg: msg.msgUserNotExist, key: 2444 };
      return res.json(record);
    }
    if (userVerification.activeFlag === 0) {
      const record = { success: false, msg: msg.msgDeactiveStatus, key: 2444 };
      return res.json(record);
    }
    const updateLoginTime = await UserService.updateLoginTime(userId);
    if (updateLoginTime === "NA") {
      const record = { success: false, msg: msg.msgUserNotExist, key: 2444 };
      return res.json(record);
    }

    const getUserDetails = await UserService.getUserDetails(userId);
    req.currentUser = getUserDetails;
    req.currentUserId = userId;
    if (!req.headers["x-app-auth"]) {
      const record = { success: false, msg: msg.msgExpiredToken, key: 2444 };
      return res.json(record);
    }
    try {
      const xappauth = req.headers["x-app-auth"];
      if (!xappauth) {
        const record = { success: false, msg: msg.msgExpiredToken, key: 2445 };
        return res.json(record);
      }
      let xappauthdecode = jwt.verify(xappauth, process.env.JWT_SECRET_KEY);
      next();
    } catch (error) {
      return res.json({ success: false, msg: msg.msgExpiredToken, xappauth: true, key: 2446 });
    }
  } catch (error) {
    return res.json({ success: false, msg: msg.msgExpiredToken, tokenExpStatus: true, key: 2446 });
  }
};
exports.getAppAuth = async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      const record = { success: false, msg: msg.msgExpiredToken, key: 1441 };

      return res.json(record);
    }
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      const record = { success: false, msg: msg.msgExpiredToken, key: 1442 };

      return res.json(record);
    }
    let decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userVerification = await UserService.checkUser(decode.userId);

    if (userVerification === "NA") {
      const record = { success: false, msg: msg.msgExpiredToken, key: 1443 };
      return res.json(record);
    }
    const userId = userVerification._id;
    if (!userVerification) {
      const record = { success: false, msg: msg.msgExpiredToken, key: 1443 };
      return res.json(record);
    }

    if (userVerification.deleteFlag === 1 || (userVerification.roleName !== "Super-Admin" && userVerification.roleName !== "Admin")) {
      const record = { success: false, msg: msg.msgUserNotExist, key: 1444 };
      return res.json(record);
    }
    if (userVerification.activeFlag === 0) {
      const record = { success: false, msg: msg.msgDeactiveStatus, key: 1444 };
      return res.json(record);
    }
    const updateLoginTime = await UserService.updateLoginTime(userId);
    if (updateLoginTime === "NA") {
      const record = { success: false, msg: msg.msgUserNotExist, key: 1444 };
      return res.json(record);
    }

    const getUserDetails = await UserService.getUserDetails(userId);
    req.currentUser = getUserDetails;
    req.currentUserId = userId;
    const jwtSecretKey = process.env.JWT_SECRET_KEY;
    const expiresIn = "30m";
    const generateKey = jwt.sign({ userId: userId }, jwtSecretKey, {
      expiresIn: expiresIn,
    });
    const now = new Date();
    const verifiedAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes in ms
    const record = { success: true, msg: ["custom"], generateKey, verifiedAt };
    return res.json(record);
  } catch (error) {
    return res.json({ success: false, msg: msg.msgExpiredToken, tokenExpStatus: true, key: 1445 });
  }
};

//==================================
//  const listDns = await CommenFunction.listDns();

//           if (listDns.success && Array.isArray(listDns.result)) {
//             await Promise.all(
//               listDns.result.map(async (record) => {
//                 try {
//                   await CommenFunction.deleteDns(record.id);
//                   console.log(`Deleted DNS record: ${record.name}`);
//                 } catch (err) {
//                   console.error(
//                     `Failed to delete DNS record ${record.name}:`,
//                     err.message
//                   );
//                 }
//               })
//             );
//           } else {
//             console.log("No DNS records found or listDns failed.");
//           }
