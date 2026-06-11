require("dotenv").config();

const mysqlcon = require("../configs/mysqlConfig");

const moment = require("moment");

function queryAsync(sql, params) {
  return new Promise((resolve, reject) => {
    mysqlcon.query(sql, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

async function checkAccountActivateDeactivate(user_id) {
  try {
    const results = await queryAsync("SELECT active_flag FROM user_master WHERE user_id = ?", [user_id]);

    if (results.length > 0) {
      const active_flag_get = results[0].active_flag;

      if (active_flag_get === "1") {
        return "1";
      } else if (active_flag_get === "2") {
        return "2";
      } else {
        return "0";
      }
    } else {
      return "0";
    }
  } catch (error) {
    throw error;
  }
}

async function DeviceTokenStore_1_Signal(user_id, device_type, player_id) {
  const inserttime = new Date().toISOString();

  try {
    await queryAsync("INSERT INTO user_notification (user_id, device_type, player_id, inserttime) VALUES (?, ?, ?, ?)", [user_id, device_type, player_id, inserttime]);

    return "yes";
  } catch (error) {
    throw error;
  }
}

async function getUserPlayerId(user_id) {
  try {
    const results = await queryAsync("SELECT player_id FROM user_notification WHERE user_id = ?", [user_id]);

    if (results.length > 0) {
      const player_id = results[0].player_id;

      return player_id !== "123456" ? player_id : "no";
    } else {
      return "no";
    }
  } catch (error) {
    throw error;
  }
}

async function getUserLanguageId(user_id) {
  try {
    const results = await queryAsync("SELECT language_id FROM user_master WHERE user_id = ?", [user_id]);

    if (results.length > 0) {
      const language_id = results[0].language_id;

      return language_id;
    } else {
      return "0";
    }
  } catch (error) {
    return "0";
  }
}

async function getNotificationStatus(user_id) {
  try {
    const results = await queryAsync("SELECT user_id FROM user_master WHERE user_id = ? AND notification_status = 1", [user_id]);

    return results.length > 0 ? "yes" : "no";
  } catch (error) {
    throw error;
  }
}

async function InsertNotification(user_id, other_user_id, action, action_id, action_json, title, message) {
  const read_status = "0";

  const delete_flag = "0";

  const updatetime = new Date().toISOString();

  const createtime = updatetime;

  try {
    await queryAsync(
      "INSERT INTO user_notification_message (user_id, other_user_id, action, action_id, action_json, title, title_2, title_3, title_4, message, message_2, message_3, message_4, read_status, delete_flag, createtime, updatetime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [user_id, other_user_id, action, action_id, action_json, title[0], title[1], title[2], title[3], message[0], message[1], message[2], message[3], read_status, delete_flag, createtime, updatetime]
    );

    return "yes";
  } catch (error) {
    throw error;
  }
}

async function getNotificationArrSingle(userId, otherUserId, action, actionId, title, message, actionJson) {
  try {
    const insertStatus = await InsertNotification(userId, otherUserId, action, actionId, JSON.stringify(actionJson), title, message);

    if (insertStatus !== "yes") {
      throw new Error("Insertion failed");
    }

    const notificationStatus = await getNotificationStatus(otherUserId);
    if (notificationStatus !== "yes") {
      return "NA";
    }

    const languageId = await getUserLanguageId(otherUserId);
    const playerId = await getUserPlayerId(otherUserId);
    const loginType = await getUserLoginType(otherUserId);

    if (playerId === "no") {
      return "NA";
    }
    const deviceType = await getUserDeviceType(playerId, otherUserId);

    return {
      playerId: playerId,
      title: title,
      message: message,
      actionJson: actionJson,
      languageId: languageId,
      loginType: loginType,
      deviceType: deviceType,
      option: actionJson.option,
      appType: actionJson.appType,
    };
  } catch (error) {
    throw error;
  }
}

async function getNotificationMsgCount(user_id) {
  try {
    const results = await queryAsync("SELECT notification_message_id FROM user_notification_message WHERE user_id = ? AND delete_flag = 0 AND read_status = 0", [user_id]);

    return results.length;
  } catch (error) {
    throw error;
  }
}

async function getNotificationMsgCountOtherUser(user_id) {
  try {
    const results = await queryAsync("SELECT notification_message_id FROM user_notification_message WHERE other_user_id = ? AND delete_flag = 0 AND read_status = 0", [user_id]);

    return results.length;
  } catch (error) {
    throw error;
  }
}

// user to driver  notification send OR user to user

async function oneSignalNotificationSendCall(notificationArr) {
  if (notificationArr !== "NA") {
    for (const notification of notificationArr) {
      const playerIdArr = [];

      if (notification.player_id !== "") {
        playerIdArr.push(notification.player_id);

        const languageId = notification.language_id;

        const title = notification.title;

        const message = notification.message;

        const actionJson = notification.action_json;

        return await oneSignalNotificationSend(title[languageId], message[languageId], actionJson, playerIdArr, languageId);
      }
    }
  }
}

// driver to driver  notification send OR driver to user

async function oneSignalNotificationSendCallDriver(notificationArr) {
  if (notificationArr !== "NA") {
    for (const notification of notificationArr) {
      const playerIdArr = [];

      if (notification.player_id !== "") {
        playerIdArr.push(notification.player_id);

        const languageId = notification.language_id;

        const title = notification.title;

        const message = notification.message;

        const actionJson = notification.action_json;

        return await oneSignalNotificationSendDriver(title[languageId], message[languageId], actionJson, playerIdArr, languageId);
      }
    }
  }
}

async function oneSignalNotificationSend(title, message, jsonData, playerIdArr, languageId) {
  const axios = require("axios");

  const oneSignalAppId = "8903856a-b219-4665-9a75-8b356bd58ce6";

  const oneSignalAuthorization = "ZTAwMTFjZTktYzk3ZS00ZjBjLWI4ZTMtMjg4NDBkMjAxNWFm";

  // Define notification fields

  let fields;

  if (languageId === 0) {
    fields = {
      app_id: oneSignalAppId,

      contents: { en: message },

      headings: { en: title },

      include_player_ids: playerIdArr,

      data: { action_json: jsonData },

      ios_badgeType: "Increase",

      ios_badgeCount: 1,

      priority: 10,
    };
  } else {
    fields = {
      app_id: oneSignalAppId,

      contents: { ar: message },

      headings: { ar: title },

      include_player_ids: playerIdArr,

      data: { action_json: jsonData },

      ios_badgeType: "Increase",

      ios_badgeCount: 1,

      priority: 10,
    };
  }

  try {
    const response = await axios.post("https://onesignal.com/api/v1/notifications", fields, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",

        Authorization: `Basic ${oneSignalAuthorization}`,
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      return response.data;
    }
  } catch (error) {
    //console.log('errors',error);

    return "errors";
  }
}

async function oneSignalNotificationSendDriver(title, message, jsonData, playerIdArr, languageId) {
  const axios = require("axios");

  const oneSignalAppId = "8903856a-b219-4665-9a75-8b356bd58ce6";

  const oneSignalAuthorization = "ZTAwMTFjZTktYzk3ZS00ZjBjLWI4ZTMtMjg4NDBkMjAxNWFm";

  // Define notification fields

  let fields;

  if (languageId === 0) {
    fields = {
      app_id: oneSignalAppId,

      contents: { en: message },

      headings: { en: title },

      include_player_ids: playerIdArr,

      data: { action_json: jsonData },

      ios_badgeType: "Increase",

      ios_badgeCount: 1,

      priority: 10,
    };
  } else {
    fields = {
      app_id: oneSignalAppId,

      contents: { ar: message },

      headings: { ar: title },

      include_player_ids: playerIdArr,

      data: { action_json: jsonData },

      ios_badgeType: "Increase",

      ios_badgeCount: 1,

      priority: 10,
    };
  }

  try {
    const response = await axios.post("https://onesignal.com/api/v1/notifications", fields, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",

        Authorization: `Basic ${oneSignalAuthorization}`,
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      return response.data;
    }
  } catch (error) {
    return "error";
  }
}

// driver to user notification OR send Driver to driver

module.exports = {
  checkAccountActivateDeactivate,

  DeviceTokenStore_1_Signal,

  getUserPlayerId,

  getNotificationStatus,

  InsertNotification,

  getNotificationArrSingle,

  getNotificationMsgCount,

  getNotificationMsgCountOtherUser,

  oneSignalNotificationSend,

  oneSignalNotificationSendCall,

  oneSignalNotificationSendDriver,

  oneSignalNotificationSendCallDriver,

  getNotificationMsgCountOtherUser,
};
