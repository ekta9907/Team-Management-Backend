require("dotenv").config();
const jwt = require("jsonwebtoken");
const UserService = require("../services/hrServices/commenService");
const msg = require("../helpers/hrLanguageMessageHelper");

//**************************** Admin AUTH */
exports.auth = async (req, res, next) => {
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

    req.currentUser = getUserDetails;
    req.currentUserId = userId;
    console.log("success pass from auth middleware");

    next();
  } catch (error) {
    return res.json({ success: false, msg: msg.msgExpiredToken, tokenExpStatus: true, key: 7 });
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

exports.superAdminAuth = async (req, res, next) => {
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
    let decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userVerification = await UserService.checkUser(decode.userId);

    if (userVerification === "NA") {
      const record = { success: false, msg: msg.msgExpiredToken, key: 3 };
      return res.json(record);
    }
    const userId = userVerification._id;
    if (!userVerification) {
      const record = { success: false, msg: msg.msgExpiredToken, key: 3 };
      return res.json(record);
    }

    if (userVerification.deleteFlag === 1 || userVerification.roleName !== "Super-Admin") {
      const record = { success: false, msg: msg.msgUserNotExist, key: 4 };
      return res.json(record);
    }
    if (userVerification.activeFlag === 0) {
      const record = { success: false, msg: msg.msgDeactiveStatus, key: 4 };
      return res.json(record);
    }
    const updateLoginTime = await UserService.updateLoginTime(userId);
    if (updateLoginTime === "NA") {
      const record = { success: false, msg: msg.msgUserNotExist, key: 4 };
      return res.json(record);
    }

    const getUserDetails = await UserService.getUserDetails(userId);
    req.currentUser = getUserDetails;
    req.currentUserId = userId;
    next();
  } catch (error) {
    return res.json({ success: false, msg: msg.msgExpiredToken, tokenExpStatus: true, key: 5 });
  }
};
exports.adminAuth = async (req, res, next) => {
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
    let decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userVerification = await UserService.checkUser(decode.userId);

    if (userVerification === "NA") {
      const record = { success: false, msg: msg.msgExpiredToken, key: 3 };
      return res.json(record);
    }
    const userId = userVerification._id;
    if (!userVerification) {
      const record = { success: false, msg: msg.msgExpiredToken, key: 3 };
      return res.json(record);
    }

    if (userVerification.deleteFlag === 1 || userVerification.roleName !== "Admin") {
      const record = { success: false, msg: msg.msgUserNotExist, key: 4 };
      return res.json(record);
    }
    if (userVerification.activeFlag === 0) {
      const record = { success: false, msg: msg.msgDeactiveStatus, key: 4 };
      return res.json(record);
    }
    const updateLoginTime = await UserService.updateLoginTime(userId);
    if (updateLoginTime === "NA") {
      const record = { success: false, msg: msg.msgUserNotExist, key: 4 };
      return res.json(record);
    }

    const getUserDetails = await UserService.getUserDetails(userId);
    req.currentUser = getUserDetails;
    req.currentUserId = userId;
    next();
  } catch (error) {
    return res.json({ success: false, msg: msg.msgExpiredToken, tokenExpStatus: true, key: 5 });
  }
};
exports.employeeAuth = async (req, res, next) => {
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
    let decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const userVerification = await UserService.checkUser(decode.userId);

    if (userVerification === "NA") {
      const record = { success: false, msg: msg.msgExpiredToken, key: 3 };
      return res.json(record);
    }
    const userId = userVerification._id;
    if (!userVerification) {
      const record = { success: false, msg: msg.msgExpiredToken, key: 3 };

      return res.json(record);
    }
    if (userVerification.deleteFlag === 1 || userVerification.roleName === "Admin" || userVerification.roleName === "Super-Admin") {
      const record = { success: false, msg: msg.msgUserNotExist, key: 4 };
      return res.json(record);
    }
    if (userVerification.activeFlag === 0) {
      const record = { success: false, msg: msg.msgDeactiveStatus, key: 4 };
      return res.json(record);
    }
    const updateLoginTime = await UserService.updateLoginTime(userId);
    if (updateLoginTime === "NA") {
      const record = { success: false, msg: msg.msgUserNotExist, key: 4 };
      return res.json(record);
    }

    const getUserDetails = await UserService.getUserDetails(userId);
    req.currentUser = getUserDetails;
    req.currentUserId = userId;
    next();
  } catch (error) {
    return res.json({ success: false, msg: msg.msgExpiredToken, tokenExpStatus: true, key: 5 });
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
exports.getAppAuth2F = async (req, res, next) => {
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

    if (userVerification.deleteFlag === 1) {
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
    req.generateKey = generateKey;
    next();
  } catch (error) {
    return res.json({ success: false, msg: msg.msgExpiredToken, tokenExpStatus: true, key: 1445, error: error.message });
  }
};
