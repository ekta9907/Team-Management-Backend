const mongoose = require("mongoose");
const axios = require("axios");

const UserNotification = require("../models/superAdminModels/userNotificationModel");
const User = require("../models/superAdminModels/userModel");
const UserNotificationMessage = require("../models/superAdminModels/userNotificationMessageModel");
const logger = require("./loggerHelper");

const oneSignalAppId = "f7df0708-8dd8-406f-813c-be6d1dc4618b";
const oneSignalAuthorization = "os_v2_app_67pqocen3bag7aj4xzwr3rdbroygqyy52qxurs45peoqoujxgcvc6r6kpjtsmjzwxaswxjijpq33elxtzwr7nbnn2f7jypkyiar2fti";
const driverOneSignalAppId = "8903856a-b219-4665-9a75-8b356bd58ce6";
const driverOneSignalAuthorization = "ZTAwMTFjZTktYzk3ZS00ZjBjLWI4ZTMtMjg4NDBkMjAxNWFm";

module.exports = {
  async DeviceTokenStore_1_Signal(userId, deviceType, loginType, playerId) {
    try {
      const playerRecord = await UserNotification.findOne({ playerId });

      if (playerRecord) {
        const deletedResult = await UserNotification.deleteMany({
          $or: [{ playerId }, { userId }],
        });

        if (deletedResult.deletedCount <= 0) {
          const secondDeleteResult = await UserNotification.deleteMany({
            $or: [{ playerId }, { userId }],
          });

          if (secondDeleteResult.deletedCount <= 0) {
            return "no";
          }
        }
      } else {
        const userRecord = await UserNotification.findOne({ userId });

        if (userRecord) {
          const deletedResult = await UserNotification.deleteMany({ userId });
          if (deletedResult.deletedCount <= 0) {
            const secondDeleteResult = await UserNotification.deleteMany({
              userId,
            });

            if (secondDeleteResult.deletedCount <= 0) {
              return "no";
            }
          }
        }
      }

      const newNotification = new UserNotification({
        userId,
        deviceType,
        playerId,
        loginType,
      });

      const savedNotification = await newNotification.save();
      if (savedNotification) {
        return "yes";
      } else {
        return "no";
      }
    } catch (error) {
      console.error("Error in DeviceTokenStore_1_Signal:", error.message);
      return "no";
    }
  },

  async checkUserActiveDeactive(userId) {
    try {
      const result = await User.findOne(
        { deleteFlag: 0, _id: userId },
        "activeFlag"
      );
      if (result) {
        return result.activeFlag;
      } else {
        return 0;
      }
    } catch (error) {
      console.error("Error in checkUserActiveDeactive:", error.message);
      throw new Error(error.message);
    }
  },
  async getUserPlayerId(userId) {
    try {
      const result = await UserNotification.findOne({ userId }).select(
        "playerId"
      );
      if (result) {
        const playerId = result.playerId;
        return playerId !== "123456" ? playerId : "no";
      } else {
        return "no";
      }
    } catch (error) {
      throw error;
    }
  },
  async getUserDeviceType(userId, playerId) {
    try {
      const result = await UserNotification.findOne({
        userId,
        playerId,
      }).select("deviceType");
      if (result) {
        const deviceType = result.deviceType;
        return deviceType ? deviceType : "windows";
      } else {
        return "windows";
      }
    } catch (error) {
      throw error;
    }
  },
  async getUserLanguageId(userId) {
    try {
      const result = await User.findOne({ _id: userId }).select("languageId");
      if (result) {
        return result.languageId;
      } else {
        return "0";
      }
    } catch (error) {
      return "0";
    }
  },
  async getUserLoginType(userId, playerId) {
    try {
      const result = await UserNotification.findOne({
        userId,
        playerId,
      }).select("loginType");
      if (result) {
        return result.loginType;
      } else {
        return "web";
      }
    } catch (error) {
      return "web";
    }
  },
  async getNotificationStatus(userId) {
    try {
      const result = await User.findOne({
        _id: userId,
        notificationStatus: 1,
      }).select("_id");
      return result ? "yes" : "no";
    } catch (error) {
      throw error;
    }
  },
  async InsertNotification(
    userId,
    otherUserId,
    action,
    actionId,
    actionJson,
    title,
    message,
    option,
    appType,
    notificationOrActivity
  ) {
    const readStatus = 0;
    const deleteFlag = 0;

    try {
      const newNotification = new UserNotificationMessage({
        userId,
        otherUserId,
        action,
        actionId,
        actionJson,
        title1: title[0],
        title2: title[1],
        title3: title[2],
        title4: title[3],
        message1: message[0],
        message2: message[1],
        message3: message[2],
        message4: message[3],
        option,
        appType,
        readStatus,
        deleteFlag,
        notificationOrActivity,
      });

      await newNotification.save();
      return "yes";
    } catch (error) {
      throw error;
    }
  },

  async getNotificationArrSingle(
    userId,
    otherUserId,
    action,
    actionId,
    title,
    message,
    actionJson,
    notificationOrActivity = 0
  ) {
    try {
      const insertStatus = await this.InsertNotification(
        userId,
        otherUserId,
        action,
        actionId,
        actionJson,
        title,
        message,
        actionJson.option,
        actionJson.appType,
        notificationOrActivity
      );

      if (insertStatus !== "yes") {
        throw new Error("Insertion failed");
      }

      const notificationStatus = await this.getNotificationStatus(otherUserId);
      if (notificationStatus !== "yes") {
        return "NA";
      }

      const [languageId, playerId] = await Promise.all([
        this.getUserLanguageId(otherUserId),
        this.getUserPlayerId(otherUserId),
      ]);
      if (!playerId || playerId === "no") {
        return "NA";
      }
      const loginType = await this.getUserLoginType(otherUserId, playerId);
      const deviceType = await this.getUserDeviceType(otherUserId, playerId);

      return {
        otherUserId,
        playerId,
        title,
        message,
        actionJson,
        languageId,
        loginType,
        deviceType,
        options: actionJson.option,
        appType: actionJson.appType,
      };
    } catch (error) {
      console.error("Error in getNotificationArrSingle:", error);
      throw error;
    }
  },
  async getNotificationMsgCountOtherUser(userId) {
    try {
      const results = await UserNotificationMessage.countDocuments({
        userId,
        deleteFlag: 0,
        readStatus: 0,
      });
      return results;
    } catch (error) {
      throw error;
    }
  },
  async getNotificationMsgCount(userId) {
    try {
      const results = await UserNotificationMessage.countDocuments({
        otherUserId: userId,
        deleteFlag: 0,
        readStatus: 0,
      });
      return results;
    } catch (error) {
      throw error;
    }
  },
  async oneSignalNotificationSendCall1(notificationArr) {
    if (notificationArr !== "NA") {
      for (const notification of notificationArr) {
        const playerIdArr = [];
        if (notification.playerId !== "") {
          playerIdArr.push(notification.playerId);
          const languageId = notification.languageId;
          const title = notification.title;
          const message = notification.message;
          const actionJson = notification.action_json;

          const options = notification.options;
          const appType = notification.appType;
          const deviceType = notification.deviceType;
          const loginType = notification.loginType;
          return await this.sendOneSignalNotification(
            title,
            message,
            actionJson,
            playerIdArr,
            languageId,
            deviceType,
            loginType,
            options,
            appType
          );
        }
      }
    }
  },
  async oneSignalNotificationSendCall(notificationArr) {
    if (!Array.isArray(notificationArr) || notificationArr.length === 0) return;

    const groupedMap = {};

    for (const notification of notificationArr) {
      if (!notification.playerId) continue;

      // Grouping key: title + message
      const key = `${notification.title}||${notification.message}`;

      if (!groupedMap[key]) {
        groupedMap[key] = {
          title: notification.title,
          message: notification.message,
          action_json: notification.action_json,
          languageId: notification.languageId,
          options: notification.options,
          appType: notification.appType,
          deviceType: notification.deviceType,
          loginType: notification.loginType,
          playerIds: new Set(),
        };
      }

      groupedMap[key].playerIds.add(notification.playerId);
    }

    // Send one notification per group
    for (const key in groupedMap) {
      const group = groupedMap[key];
      const playerIdArr = Array.from(group.playerIds); // convert Set to Array

      await this.sendOneSignalNotification(
        group.title,
        group.message,
        group.action_json,
        playerIdArr,
        group.languageId,
        group.deviceType,
        group.loginType,
        group.options,
        group.appType
      );
    }
  },
  //   async oneSignalNotificationSendCallDriver(notificationArr) {
  //     if (notificationArr !== "NA") {
  //       for (const notification of notificationArr) {
  //         const playerIdArr = [];
  //         if (notification.player_id !== "") {
  //           playerIdArr.push(notification.player_id);
  //           const languageId = notification.languageId;
  //           const title = notification.title;
  //           const message = notification.message;
  //           const actionJson = notification.action_json;
  //           const options = notification.options;
  //           const appType = notification.appType;
  //           const deviceType = notification.deviceType;
  //           const loginType = notification.loginType;
  //           return await this.sendOneSignalNotification(title, message, actionJson, playerIdArr, languageId, deviceType, loginType, options, appType);
  //         }
  //       }
  //     }
  //   },

  async sendOneSignalNotification(
    title,
    message,
    jsonData,
    playerIdArr,
    languageId = 0,
    deviceType = "windows",
    loginType = "web",
    options = {
      logoUrl:
        "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg",
      redirectionUrl: {
        webLink:
          "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg",
        deepLink:
          "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg",
      },
      imageUrl: "https://lipsum.app/600x300",
      soundFile: "https://www.soundjay.com/button/beep-07.wav",
    },
    appType = "customer"
  ) {
    const appId = appType === "driver" ? driverOneSignalAppId : oneSignalAppId;
    const authKey =
      appType === "driver"
        ? driverOneSignalAuthorization
        : oneSignalAuthorization;

    const contents =
      languageId === 0
        ? { en: message[languageId] }
        : { ar: message[languageId] };
    const headings =
      languageId === 0 ? { en: title[languageId] } : { ar: title[languageId] };

    const fields = {
      app_id: appId,
      contents,
      headings,
      include_player_ids: playerIdArr,
      data: { action_json: jsonData },
      ios_badgeType: "Increase",
      ios_badgeCount: 1,
      priority: 10,
    };

    const { logoUrl, redirectionUrl, imageUrl, soundFile } = options;

    if (logoUrl) {
      fields.small_icon = logoUrl;
      fields.large_icon = logoUrl;
      fields.chrome_web_icon = logoUrl;
      fields.ios_attachments = { image: logoUrl };
    }

    if (redirectionUrl) {
      if (loginType !== "android" || loginType !== "ios") {
        fields.url = redirectionUrl["webLink"];
      } else {
        fields.url = redirectionUrl["deepLink"] || redirectionUrl["webLink"];
        fields.ios_launch_url =
          redirectionUrl["deepLink"] || redirectionUrl["webLink"];
      }
    }

    if (imageUrl) {
      fields.big_picture = imageUrl;
      fields.chrome_web_image = imageUrl;
      fields.ios_attachments = { image: imageUrl };
    }

    if (soundFile) {
      fields.sound = soundFile.replace(".mp3", "");
      fields.android_sound = soundFile.split("/").pop().split(".")[0];
      fields.ios_sound = soundFile.split("/").pop().split(".")[0];
    }

    const fields1 = {
      app_id: appId, // Replace with your actual app ID
      include_player_ids: playerIdArr, // Replace with a real player ID
      contents,
      headings,
      data: { action_json: jsonData },
      ios_badgeType: "Increase",
      ios_badgeCount: 1,
      priority: 10,
    };
    try {
      const response = await axios.post(
        "https://onesignal.com/api/v1/notifications",
        fields,
        {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: `Basic ${authKey}`,
          },
        }
      );

      return response.status === 200 ? response.data : "error";
    } catch (error) {
      logger.error("one signal notification send error " + error.message, {
        error,
      });
      return "error";
    }
  },
};
