const mongoose = require("mongoose");
const User = require("../../models/superAdminModels/userModel");
const UserNotificationMessage = require("../../models/superAdminModels/userNotificationMessageModel");
const SubscriptionPlan = require("../../models/superAdminModels/subscriptionPlanModel");
const Workspace = require("../../models/superAdminModels/workspaceModel");
const Role = require("../../models/superAdminModels/roleModel");
const Feature = require("../../models/superAdminModels/featureModel");
const SubFeature = require("../../models/superAdminModels/subFeatureModel");
const Permission = require("../../models/superAdminModels/permissionModel");
const AccessPermission = require("../../models/superAdminModels/accessPermissionModel");
const BuySubscriptionPlan = require("../../models/superAdminModels/buySubscriptionPlanModel");

const moment = require("moment");
require("moment-duration-format");

const TIME_ZONE = process.env.TIME_ZONE;
module.exports = {
  //====================================== commen function for add,edit,delete,update,check

  async create(ModelName, data) {
    try {
      const result = await ModelName.create(data);
      return result ? result : "NA";
    } catch (error) {
      console.error(`Error creating document in ${ModelName}:`, error.message);
      throw error;
    }
  },
  async findOne(ModelName, filter = {}, projection = {}) {
    try {
      const result = await ModelName.findOne(filter, projection);
      return result ? result : "NA";
    } catch (error) {
      console.error(`Error finding document in ${ModelName}:`, error.message);
      throw error;
    }
  },

  async findById(ModelName, id, projection = {}) {
    try {
      const result = await ModelName.findById(id, projection);
      return result ? result : "NA";
    } catch (error) {
      console.error(`Error finding by ID in ${ModelName}:`, error.message);
      throw error;
    }
  },
  async findMany(ModelName, filter, projection = {}) {
    try {
      const result = await ModelName.find(filter, projection);
      return result ? result : [];
    } catch (error) {
      console.error(`Error finding document in ${ModelName}:`, error.message);
      throw error;
    }
  },
  async update(ModelName, filter, updateData, options = {}) {
    try {
      const result = await ModelName.updateOne(
        filter,
        { $set: updateData },
        options,
      );
      return result ? result : "NA";
    } catch (error) {
      console.error(`Error updating documents in ${ModelName}:`, error.message);
      throw error;
    }
  },

  async updateById(ModelName, id, updateData, options = {}) {
    try {
      const result = await ModelName.findByIdAndUpdate(
        id,
        { $set: updateData },
        options,
      );
      return result ? result : "NA";
    } catch (error) {
      console.error(`Error updating documents in ${ModelName}:`, error.message);
      throw error;
    }
  },

  async updateMany(ModelName, filter, updateData, options = {}) {
    try {
      const result = await ModelName.updateMany(
        filter,
        { $set: updateData },
        options,
      );
      return result.modifiedCount > 0 ? result : "NA";
    } catch (error) {
      console.error(`Error updating documents in ${ModelName}:`, error.message);
      throw error;
    }
  },

  async deleteWithUpdateData(ModelName, filter, updateData, options) {
    try {
      const result = await ModelName.updateOne(
        filter,
        { $set: updateData },
        options,
      );
      return result.modifiedCount > 0 ? result : "NA";
    } catch (error) {
      console.error(`Error deleting documents in ${ModelName}:`, error.message);
      throw error;
    }
  },
  async deleteByIdWithUpdateData(ModelName, id, updateData, options) {
    try {
      const result = await ModelName.findByIdAndUpdate(
        id,
        { $set: updateData },
        options,
      );
      return result ? result : "NA";
    } catch (error) {
      console.error(`Error deleting documents in ${ModelName}:`, error.message);
      throw error;
    }
  },
  async deleteManyWithUpdateData(ModelName, filter, updateData, options) {
    try {
      const result = await ModelName.updateMany(
        filter,
        { $set: updateData },
        options,
      );
      return result.modifiedCount > 0 ? result : "NA";
    } catch (error) {
      console.error(`Error deleting documents in ${ModelName}:`, error.message);
      throw error;
    }
  },

  async delete(ModelName, filter) {
    try {
      const result = await ModelName.deleteOne(filter);
      return result.modifiedCount > 0 ? result : "NA";
    } catch (error) {
      console.error(`Error deleting documents in ${ModelName}:`, error.message);
      throw error;
    }
  },
  async deleteById(ModelName, id) {
    try {
      const result = await ModelName.findByIdAndDelete(
        id,
        { $set: updateData },
        options,
      );
      return result ? result : "NA";
    } catch (error) {
      console.error(`Error deleting documents in ${ModelName}:`, error.message);
      throw error;
    }
  },
  async deleteMany(ModelName, filter) {
    try {
      const result = await ModelName.deleteMany(filter);
      return result.modifiedCount > 0 ? result : "NA";
    } catch (error) {
      console.error(`Error deleting documents in ${ModelName}:`, error.message);
      throw error;
    }
  },
  async getSuperAdminId() {
    try {
      const superAdmin = await User.findOne(
        { roleName: "Super-Admin" },
        { _id: 1 },
      );
      if (!superAdmin) {
        return 0;
      }
      return superAdmin._id;
    } catch (error) {
      console.error("Error fetching Super-Admin ID:", error);
      throw error;
    }
  },
  async getSubscriptionPlanCount(deleteFlag) {
    try {
      const getCountDocuments = await SubscriptionPlan.countDocuments({
        deleteFlag: deleteFlag,
        activeFlag: 1,
      });
      if (getCountDocuments) {
        return getCountDocuments;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service getCountDocuments",
        error.message,
      );
      throw error;
    }
  },
  async getWorkspaceOwnerCount(deleteFlag) {
    try {
      const getCountDocuments = await Workspace.countDocuments({
        deleteFlag: deleteFlag,
        activeFlag: 1,
      });
      if (getCountDocuments) {
        return getCountDocuments;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service getCountDocuments",
        error.message,
      );
      throw error;
    }
  },

  async checkWorkspace(subdomain) {
    try {
      const checkWorkspace = await Workspace.findOne({
        subdomain: subdomain,
        deleteFlag: 0,
        activeFlag: 1,
      });
      if (checkWorkspace) {
        return checkWorkspace;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("checkWorkspace find db error", error.message);
      throw new Error(error.message);
    }
  },

  async getWorkspaceLogoutSettings(workspaceId) {
    try {
      const existing = await Workspace.findOne(
        { _id: workspaceId, deleteFlag: 0 },
        { automaticLogOut: 1, customAutoLogout: 1 },
      );

      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getWorkspaceLogoutSettings:", error);
      throw error;
    }
  },

  async getRoleByRoleName(roleName) {
    try {
      const getRoleByRoleName = await Role.findOne({
        roleName: roleName,
        deleteFlag: 0,
        activeFlag: 1,
      });
      if (getRoleByRoleName) {
        return getRoleByRoleName;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("getRoleByRoleName find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkAccessPermission(permissionId) {
    try {
      const permissionStatus = await AccessPermission.findOne({
        _id: permissionId,
      }); // 20 seconds timeout

      if (permissionStatus) {
        return permissionStatus;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("permission find db error", error.message);
      throw new Error(error.message);
    }
  },
  async getAccessPermissions(deleteFlag) {
    try {
      const Permissions = await AccessPermission.aggregate([
        {
          $match: {
            deleteFlag: deleteFlag,
            // roleName: { $ne: "Super-Admin" }, surendra 20-01-2026
          },
        },
        {
          $addFields: {
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
              },
            },
          },
        },
        { $sort: { orderBy: 1 } },
        {
          $project: {
            _id: 1,
            roleId: 1,
            roleName: 1,
            accessLevel: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            formattedCreatedAt: 1,
          },
        },
      ]);
      if (Permissions && Permissions.length > 0) {
        return Permissions;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service Permissions details",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async getPermissionIntitals(deleteFlag) {
    try {
      const Permissions = await Permission.find({
        deleteFlag: deleteFlag,
      }).sort({ orderBy: -1 });
      if (Permissions && Permissions.length > 0) {
        return Permissions;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service Permissions details",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async getAccessPermissionOne(permissionId) {
    try {
      const Permissions = await AccessPermission.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(permissionId),
          },
        },
        {
          $limit: 1,
        },
        {
          $addFields: {
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
              },
            },
          },
        },
        { $sort: { date: 1 } },
        {
          $project: {
            _id: 1,
            roleId: 1,
            roleName: 1,
            accessLevel: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            formattedCreatedAt: 1,
          },
        },
      ]);

      if (Permissions && Permissions.length > 0) {
        return Permissions[0];
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service Permissions details",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async editAccessPermission(permissionId, accessLevel) {
    try {
      const updateStatus = await AccessPermission.updateOne(
        { _id: permissionId },
        { $set: { accessLevel: accessLevel } },
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service editPermission",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async editPermissionAll(roleName, accessLevel) {
    try {
      const updateStatus = await User.updateMany(
        { roleName: roleName },
        { $set: { accessLevel: accessLevel } },
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service editPermission",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async getUserDetails(userId) {
    try {
      const user = await User.aggregate([
        {
          $match: { _id: userId },
        },
        {
          $lookup: {
            from: "roles",
            localField: "roleId",
            foreignField: "_id",
            as: "roleDetails",
          },
        },

        {
          $unwind: {
            path: "$roleDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            roleDetails: { $ifNull: ["$roleDetails", null] },
          },
        },
        {
          $lookup: {
            from: "workspaces",
            localField: "workspaceId",
            foreignField: "_id",
            as: "workspaceDetails",
          },
        },

        {
          $unwind: {
            path: "$workspaceDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "designations",
            localField: "designationId",
            foreignField: "_id",
            as: "designationDetails",
          },
        },

        {
          $unwind: {
            path: "$designationDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            designationDetails: {
              $ifNull: ["$designationDetails", null],
            }, // Set "NA" if no matching
          },
        },
        {
          $addFields: {
            userId: "$_id",
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M:%S",
                date: "$createdAt",
                timezone: "$timezone",
              },
            },
            formattedlastLoginTime: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M:%S",
                date: "$lastLoginTime",
                timezone: "$timezone",
              },
            },
            formattedJoiningDate: {
              $cond: {
                if: { $eq: [{ $type: "$joiningDate" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$joiningDate",
                    timezone: "$timezone",
                  },
                },
                else: "$joiningDate",
              },
            },
            formattedDob: {
              $cond: {
                if: { $eq: [{ $type: "$dob" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$dob",
                    timezone: "$timezone",
                  },
                },
                else: "$dob",
              },
            },
            formattedOriginalDob: {
              $cond: {
                if: { $eq: [{ $type: "$originalDob" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$originalDob",
                    timezone: "$timezone",
                  },
                },
                else: "$originalDob",
              },
            },
          },
        },
        {
          $group: {
            _id: "$_id",
            userData: { $first: "$$ROOT" },
          },
        },

        {
          $replaceRoot: { newRoot: "$userData" },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            otp: 1,
            otpVerify: 1,
            signupSteps: 1,
            socialId: 1,
            workspaceId: 1,
            designationId: 1,
            designationName: 1,
            roleId: 1,
            roleName: 1,
            reportingManagerId: 1,
            registeredById: 1,
            approvedById: 1,
            firstName: 1,
            lastName: 1,
            name: 1,
            uniqueId: 1,
            empId: 1,
            email: 1,
            personalEmail: 1,
            fatherName: 1,
            originalDob: 1,
            joiningDate: 1,
            mobileNumber: 1,
            phoneCode: 1,
            dob: 1,
            gender: 1,
            image: 1,
            addressProof: 1,
            address: 1,
            city: 1,
            state: 1,
            country: 1,
            pincode: 1,
            officialNumber: 1,
            emergencyContactNumber: 1,
            languageId: 1,
            profileComplete: 1,
            approveFlag: 1,
            activeFlag: 1,
            deleteFlag: 1,
            deleteReason: 1,
            loginType: 1,
            loginTypeFirst: 1,
            notificationStatus: 1,
            playerId: 1,
            createdAt: 1,
            updatedAt: 1,
            lastLoginTime: 1,
            formattedlastLoginTime: 1,
            formattedCreatedAt: 1,
            formattedDob: 1,
            formattedOriginalDob: 1,
            formattedJoiningDate: 1,
            roleDetails: 1,
            accessLevel: 1,
            accessPreferenceLevel: 1,
            jobTitle: 1,
            officePhone: 1,
            workingHours: 1,
            deviceType: 1,
            timeFormat: 1,
            dateFormat: 1,
            timeZone: 1,
            calendarStart: 1,
            profile: 1,
            notes: 1,
            social: 1,
          },
        },
      ]);

      if (user && user.length > 0) {
        user[0].otp = null;
        return user[0];
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from commen service user details",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async updateLoginTime(userId) {
    try {
      const lastLoginTime = moment().format("YYYY-MM-DD HH:mm:ss");
      const updateStatus = await User.updateOne(
        { _id: userId },
        { $set: { lastLoginTime: lastLoginTime } },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from commen service user details",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  // =============================================== notification main ======================================================

  async getNotifications(userId, checkUser, limit, offset) {
    try {
      const notifications = await UserNotificationMessage.aggregate([
        {
          $match: {
            deleteFlag: 0,
            otherUserId: userId,
          },
        },
        {
          $sort: { readStatus: 1, createdAt: -1 },
        },

        {
          $skip: parseInt(offset),
        },
        {
          $limit: parseInt(limit),
        },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            name: {
              $cond: [
                { $eq: ["$action", "welcome"] },
                "Task Source",
                {
                  $cond: [
                    { $eq: ["$userDetails", null] },
                    null,
                    "$userDetails.name",
                  ],
                },
              ],
            },
            image: {
              $cond: [
                { $eq: ["$action", "welcome"] },
                "logos/logo.png",
                {
                  $cond: [
                    { $eq: ["$userDetails", null] },
                    null,
                    "$userDetails.image",
                  ],
                },
              ],
            },

            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
                timezone: "$userDetails.timezone" || "UTC",
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            otherUserId: 1,
            action: 1,
            actionId: 1,
            actionJson: 1,
            title1: 1,
            title2: 1,
            title3: 1,
            title4: 1,
            message1: 1,
            message2: 1,
            message3: 1,
            message4: 1,
            readStatus: 1,
            createdAt: 1,
            formattedCreatedAt: 1,
            image: 1,
            name: 1,
            appType: 1,
            option: 1,
          },
        },
      ]);
      if (notifications.length > 0) {
        const unreadIds = notifications
          .filter((item) => item.readStatus === 0)
          .map((item) => item._id);
        if (unreadIds.length > 0) {
          await UserNotificationMessage.updateMany(
            { _id: { $in: unreadIds } },
            { $set: { readStatus: 1, updatedAt: new Date() } },
          );
        }
      }
      return notifications;
    } catch (error) {
      console.log(
        "database error from commen getNotifications ",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async getNotificationCount(userId) {
    try {
      const count = await UserNotificationMessage.countDocuments({
        otherUserId: userId,
        readStatus: 0,
        deleteFlag: 0,
      });
      return count;
    } catch (error) {
      console.log(
        "database error from commen getNotifications ",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async clearNotification(userId, deleteFlag) {
    try {
      const updateStatus = await UserNotificationMessage.updateMany(
        { otherUserId: userId },
        { $set: { deleteFlag: deleteFlag } },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service clearNotification",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async deleteNotification(notificationId, deleteFlag) {
    try {
      const updateStatus = await UserNotificationMessage.updateOne(
        { _id: notificationId },
        { $set: { deleteFlag: deleteFlag } },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service deleteNotification",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async checkNotification(notificationId) {
    try {
      const notificationStatus = await UserNotificationMessage.findOne({
        _id: notificationId,
        deleteFlag: 0,
      }); // 20 seconds timeout

      if (notificationStatus) {
        return notificationStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("notification find db error", error.message);
      throw new Error(error.message);
    }
  },

  //========================================Feature ===================================
  async checkFeatureName(name, keyName) {
    try {
      const checkStatus = await Feature.findOne({
        $or: [{ name: name }, { keyName: keyName }],
        deleteFlag: 0,
      });

      if (checkStatus) {
        return checkStatus._id;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("feature find db error", error.message);
      throw new Error(error.message);
    }
  },
  async addFeature(data) {
    try {
      const addStatus = await Feature.create(data);
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service addFeature",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async checkFeature(featureId) {
    try {
      const checkStatus = await Feature.findOne({
        _id: featureId,
        deleteFlag: 0,
      }); // 20 seconds timeout

      if (checkStatus) {
        return checkStatus._id;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("Feature find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkFeatureView(featureId) {
    try {
      const checkStatus = await Feature.findOne({ _id: featureId }); // 20 seconds timeout

      if (checkStatus) {
        return checkStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("Feature find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkFeatureWithName(featureId, name) {
    try {
      const checkFeature = await Feature.findOne({
        _id: { $ne: featureId },
        name: name,
        deleteFlag: 0,
      }); // 20 seconds timeout
      if (checkFeature) {
        return checkFeature._id;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("feature find db error", error.message);
      throw new Error(error.message);
    }
  },

  async editFeature(featureId, data) {
    try {
      const updateStatus = await Feature.findByIdAndUpdate(
        featureId,
        { $set: data },
        { upsert: false, new: true },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service ediTfeature",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async activeDeactiveFeature(featureId, activeFlag) {
    try {
      const updateStatus = await Feature.updateOne(
        { _id: featureId },
        { $set: { activeFlag: activeFlag } },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service activeDeactivefeature",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async deleteFeature(featureId, deleteFlag) {
    try {
      const updateStatus = await Feature.updateOne(
        { _id: featureId },
        { $set: { deleteFlag: deleteFlag } },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service deleteFeature",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async getFeatures(deleteFlag) {
    try {
      const getFeatures = await Feature.find({ deleteFlag: deleteFlag }).sort({
        createdAt: -1,
      });
      if (getFeatures) {
        return getFeatures;
      } else {
        return [];
      }
    } catch (error) {
      console.log(
        "database error from admin service deleteFeature",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  //========================================getSubFeatures ===================================
  async checkSubFeatureName(featureId, name, keyName) {
    try {
      const checkStatus = await SubFeature.findOne({
        $or: [{ name: name }, { keyName: keyName }],
        featureId: featureId,
        deleteFlag: 0,
      });

      if (checkStatus) {
        return checkStatus._id;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("feature find db error", error.message);
      throw new Error(error.message);
    }
  },
  async addSubFeature(data) {
    try {
      const addStatus = await SubFeature.create(data);
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service addSubFeature",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async checkSubFeature(subFeatureId) {
    try {
      const checkStatus = await SubFeature.findOne({
        _id: subFeatureId,
        deleteFlag: 0,
      }); // 20 seconds timeout

      if (checkStatus) {
        return checkStatus._id;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("SubFeature find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkSubFeatureView(subFeatureId) {
    try {
      const checkStatus = await SubFeature.findOne({ _id: subFeatureId }); // 20 seconds timeout

      if (checkStatus) {
        return checkStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("SubFeature find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkSubFeatureWithName(subFeatureId, featureId, name) {
    try {
      const checkSubFeature = await SubFeature.findOne({
        _id: { $ne: subFeatureId },
        featureId: { $ne: featureId },
        name: name,
        deleteFlag: 0,
      }); // 20 seconds timeout
      if (checkSubFeature) {
        return checkSubFeature._id;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("feature find db error", error.message);
      throw new Error(error.message);
    }
  },

  async editSubFeature(subFeatureId, data) {
    try {
      const updateStatus = await SubFeature.findByIdAndUpdate(
        subFeatureId,
        { $set: data },
        { upsert: false, new: true },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service ediTfeature",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async activeDeactiveSubFeature(subFeatureId, activeFlag) {
    try {
      const updateStatus = await SubFeature.updateOne(
        { _id: subFeatureId },
        { $set: { activeFlag: activeFlag } },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service activeDeactivefeature",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async deleteSubFeature(subFeatureId, deleteFlag) {
    try {
      const updateStatus = await SubFeature.updateOne(
        { _id: subFeatureId },
        { $set: { deleteFlag: deleteFlag } },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service deleteSubFeature",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async getSubFeatures(featureId, deleteFlag) {
    try {
      const getSubFeatures = await SubFeature.find({
        featureId: featureId,
        deleteFlag: deleteFlag,
      }).sort({ createdAt: -1 });
      if (getSubFeatures) {
        return getSubFeatures;
      } else {
        return [];
      }
    } catch (error) {
      console.log(
        "database error from admin service getSubFeatures",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async getAllSubFeatures(deleteFlag) {
    try {
      const features = await Feature.aggregate([
        {
          $match: { deleteFlag: deleteFlag },
        },
        {
          $lookup: {
            from: "subfeatures", // collection name in MongoDB (lowercase plural of model)
            localField: "_id",
            foreignField: "featureId",
            as: "subFeatures",
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            keyName: 1,
            subFeatures: {
              $filter: {
                input: "$subFeatures",
                as: "sf",
                cond: {
                  $and: [
                    { $eq: ["$$sf.deleteFlag", 0] },
                    { $eq: ["$$sf.activeFlag", 1] },
                  ],
                },
              },
            },
          },
        },
      ]);

      if (features.length > 0) {
        return features;
      } else {
        return [];
      }
    } catch (error) {
      console.log(
        "database error from admin service getSubFeatures",
        error.message,
      );
      throw new Error(error.message);
    }
  },

  //========================================getSubscriptionPlans ===================================
  async checkSubscriptionPlanName(title, planCategory, price, durationInDays) {
    try {
      const checkStatus = await SubscriptionPlan.findOne({
        title,
        planCategory,
        price,
        durationInDays,
        deleteFlag: 0,
      });

      if (checkStatus) {
        return checkStatus._id;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("feature find db error", error.message);
      throw new Error(error.message);
    }
  },
  async addSubscriptionPlan(data) {
    try {
      const addStatus = await SubscriptionPlan.create(data);
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service addSubscriptionPlan",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async checkSubscriptionPlan(subscriptionPlanId) {
    try {
      const checkStatus = await SubscriptionPlan.findOne({
        _id: subscriptionPlanId,
        deleteFlag: 0,
      }); // 20 seconds timeout

      if (checkStatus) {
        return checkStatus._id;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("SubscriptionPlan find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkSubscriptionPlanView(subscriptionPlanId) {
    try {
      const checkStatus = await SubscriptionPlan.findOne({
        _id: subscriptionPlanId,
      }); // 20 seconds timeout

      if (checkStatus) {
        return checkStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("SubscriptionPlan find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkSubscriptionPlanWithName(
    subscriptionPlanId,
    title,
    planCategory,
    price,
    durationInDays,
  ) {
    try {
      const checkSubscriptionPlan = await SubscriptionPlan.findOne({
        _id: { $ne: subscriptionPlanId },
        title,
        planCategory,
        price,
        durationInDays,
        deleteFlag: 0,
      }); // 20 seconds timeout
      if (checkSubscriptionPlan) {
        return checkSubscriptionPlan._id;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("feature find db error", error.message);
      throw new Error(error.message);
    }
  },

  async editSubscriptionPlan(subscriptionPlanId, data) {
    try {
      const updateStatus = await SubscriptionPlan.findByIdAndUpdate(
        subscriptionPlanId,
        { $set: data },
        { upsert: false, new: true },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service ediTfeature",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async activeDeactiveSubscriptionPlan(subscriptionPlanId, activeFlag) {
    try {
      const updateStatus = await SubscriptionPlan.updateOne(
        { _id: subscriptionPlanId },
        { $set: { activeFlag: activeFlag } },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service activeDeactivefeature",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async showFlagSubscriptionPlan(subscriptionPlanId, showFlag) {
    try {
      const updateStatus = await SubscriptionPlan.updateOne(
        { _id: subscriptionPlanId },
        { $set: { showFlag: showFlag } },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service activeDeactivefeature",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async deleteSubscriptionPlan(subscriptionPlanId, deleteFlag) {
    try {
      const updateStatus = await SubscriptionPlan.updateOne(
        { _id: subscriptionPlanId },
        { $set: { deleteFlag: deleteFlag } },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service deleteSubscriptionPlan",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async getSubscriptionPlans(deleteFlag) {
    try {
      const getSubscriptionPlans = await SubscriptionPlan.find({
        deleteFlag: deleteFlag,
      }).sort({ by_index: -1 });
      if (getSubscriptionPlans) {
        return getSubscriptionPlans;
      } else {
        return [];
      }
    } catch (error) {
      console.log(
        "database error from admin service getSubscriptionPlans",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async getSubscriptionPlan(subscriptionPlanId, deleteFlag) {
    try {
      const getSubscriptionPlans = await SubscriptionPlan.find({
        _id: subscriptionPlanId,
        deleteFlag: deleteFlag,
      }).sort({ by_index: -1 });
      if (getSubscriptionPlans.length > 0) {
        return getSubscriptionPlans[0];
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service getSubscriptionPlans",
        error.message,
      );
      throw new Error(error.message);
    }
  },

  //========================================Permission ===================================
  async checkPermissionName(label, levelName) {
    try {
      const checkStatus = await Permission.findOne({
        $or: [{ label: label }, { levelName: levelName }],
        deleteFlag: 0,
      });

      if (checkStatus) {
        return checkStatus._id;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("Permission find db error", error.message);
      throw new Error(error.message);
    }
  },
  async addPermission(data) {
    try {
      const addStatus = await Permission.create(data);
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service addPermission",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async checkPermission(permissionId) {
    try {
      const checkStatus = await Permission.findOne({
        _id: permissionId,
        deleteFlag: 0,
      }); // 20 seconds timeout

      if (checkStatus) {
        return checkStatus._id;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("Permission find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkPermissionView(permissionId) {
    try {
      const checkStatus = await Permission.findOne({ _id: permissionId }); // 20 seconds timeout

      if (checkStatus) {
        return checkStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("Permission find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkPermissionWithName(permissionId, levelName, label) {
    try {
      const checkPermission = await Permission.findOne({
        _id: { $ne: permissionId },
        label: label,
        levelName: levelName,
        deleteFlag: 0,
      }); // 20 seconds timeout
      if (checkPermission) {
        return checkPermission._id;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("Permission find db error", error.message);
      throw new Error(error.message);
    }
  },

  async editPermission(permissionId, data) {
    try {
      const updateStatus = await Permission.findByIdAndUpdate(
        permissionId,
        { $set: data },
        { upsert: false, new: true },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service ediTPermission",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async editAccessPermissionByKeyName(permissionId, permission) {
    try {
      const updateStatus = await AccessPermission.updateMany(
        { "accessLevel.levelName": permission.levelName },
        {
          $set: {
            "accessLevel.$[elem].label": permission.label,
            "accessLevel.$[elem].description": permission.description,
            "accessLevel.$[elem].briefDescription": permission.briefDescription,
            "accessLevel.$[elem].orderBy": permission.orderBy,
            "accessLevel.$[elem].permissions": permission.permissions,
          },
        },
        {
          arrayFilters: [{ "elem.levelName": permission.levelName }],
        },
      );

      if (updateStatus) {
        return updateStatus;
      } else {
        return [];
      }
    } catch (error) {
      console.log(
        "database error from admin service editAccessPermissionByKeyName",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async activeDeactivePermission(permissionId, activeFlag) {
    try {
      const updateStatus = await Permission.updateOne(
        { _id: permissionId },
        { $set: { activeFlag: activeFlag } },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service activeDeactivePermission",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async deletePermission(permissionId, deleteFlag) {
    try {
      const updateStatus = await Permission.updateOne(
        { _id: permissionId },
        { $set: { deleteFlag: deleteFlag } },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service deletePermission",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async getPermissions(deleteFlag) {
    try {
      const getPermissions = await Permission.find({
        deleteFlag: deleteFlag,
      }).sort({
        orderBy: -1,
      });
      if (getPermissions) {
        return getPermissions;
      } else {
        return [];
      }
    } catch (error) {
      console.log(
        "database error from admin service deletePermission",
        error.message,
      );
      throw new Error(error.message);
    }
  },

  async getUsersAll(data) {
    try {
      const user = await User.aggregate([
        {
          $match: data,
        },
        {
          $lookup: {
            from: "roles",
            localField: "roleId",
            foreignField: "_id",
            as: "roleDetails",
          },
        },

        {
          $unwind: {
            path: "$roleDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            roleDetails: { $ifNull: ["$roleDetails", null] },
          },
        },
        {
          $lookup: {
            from: "workspaces",
            localField: "workspaceId",
            foreignField: "_id",
            as: "workspaceDetails",
          },
        },

        {
          $unwind: {
            path: "$workspaceDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "designations",
            localField: "designationId",
            foreignField: "_id",
            as: "designationDetails",
          },
        },

        {
          $unwind: {
            path: "$designationDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            designationDetails: {
              $ifNull: ["$designationDetails", null],
            }, // Set "NA" if no matching
          },
        },
        {
          $addFields: {
            userId: "$_id",
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M:%S",
                date: "$createdAt",
                timezone: "$timezone",
              },
            },
            formattedlastLoginTime: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M:%S",
                date: "$lastLoginTime",
                timezone: "$timezone",
              },
            },
            formattedJoiningDate: {
              $cond: {
                if: { $eq: [{ $type: "$joiningDate" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$joiningDate",
                    timezone: "$timezone",
                  },
                },
                else: "$joiningDate",
              },
            },
            formattedDob: {
              $cond: {
                if: { $eq: [{ $type: "$dob" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$dob",
                    timezone: "$timezone",
                  },
                },
                else: "$dob",
              },
            },
            formattedOriginalDob: {
              $cond: {
                if: { $eq: [{ $type: "$originalDob" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$originalDob",
                    timezone: "$timezone",
                  },
                },
                else: "$originalDob",
              },
            },
          },
        },
        {
          $group: {
            _id: "$_id",
            userData: { $first: "$$ROOT" },
          },
        },

        {
          $replaceRoot: { newRoot: "$userData" },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            otp: 1,
            otpVerify: 1,
            signupSteps: 1,
            socialId: 1,
            workspaceId: 1,
            designationId: 1,
            designationName: 1,
            roleId: 1,
            roleName: 1,
            reportingManagerId: 1,
            registeredById: 1,
            approvedById: 1,
            firstName: 1,
            lastName: 1,
            name: 1,
            uniqueId: 1,
            empId: 1,
            email: 1,
            personalEmail: 1,
            fatherName: 1,
            originalDob: 1,
            joiningDate: 1,
            mobileNumber: 1,
            phoneCode: 1,
            dob: 1,
            gender: 1,
            image: 1,
            addressProof: 1,
            address: 1,
            city: 1,
            state: 1,
            country: 1,
            pincode: 1,
            officialNumber: 1,
            emergencyContactNumber: 1,
            languageId: 1,
            profileComplete: 1,
            approveFlag: 1,
            activeFlag: 1,
            deleteFlag: 1,
            deleteReason: 1,
            loginType: 1,
            loginTypeFirst: 1,
            notificationStatus: 1,
            playerId: 1,
            createdAt: 1,
            updatedAt: 1,
            lastLoginTime: 1,
            formattedlastLoginTime: 1,
            formattedCreatedAt: 1,
            formattedDob: 1,
            formattedOriginalDob: 1,
            formattedJoiningDate: 1,
            roleDetails: 1,
            accessLevel: 1,
            jobTitle: 1,
            officePhone: 1,
            workingHours: 1,
            deviceType: 1,
            timeFormat: 1,
            dateFormat: 1,
            timeZone: 1,
            calendarStart: 1,
            profile: 1,
            notes: 1,
            social: 1,
          },
        },
      ]);

      if (user && user.length > 0) {
        return user;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from commen service user details",
        error.message,
      );
      throw new Error(error.message);
    }
  },

  async buySubscription(subscriptionData) {
    try {
      const buySubscription =
        await BuySubscriptionPlan.create(subscriptionData);
      if (buySubscription) {
        return buySubscription;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("buySubscription", error.message);
      throw new Error(error.message);
    }
  },

  async getBuySubscriptionPlans(deleteFlag) {
    try {
      const result = await BuySubscriptionPlan.aggregate([
        { $match: { deleteFlag: deleteFlag } },

        /* ---------- FEATURES ---------- */
        {
          $lookup: {
            from: "features",
            localField: "featureIds",
            foreignField: "_id",
            as: "features",
          },
        },

        /* ---------- USER ---------- */
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

        /* ---------- WORKSPACE ---------- */
        {
          $lookup: {
            from: "workspaces",
            localField: "workspaceId",
            foreignField: "_id",
            as: "workspace",
          },
        },
        { $unwind: { path: "$workspace", preserveNullAndEmptyArrays: true } },

        /* ---------- EMPLOYEE RANGE ---------- */
        {
          $lookup: {
            from: "employeeranges",
            localField: "workspace.employeeRangeId",
            foreignField: "_id",
            as: "employeeRange",
          },
        },
        {
          $unwind: { path: "$employeeRange", preserveNullAndEmptyArrays: true },
        },

        /* ---------- SUBSCRIPTION PLAN ---------- */
        {
          $lookup: {
            from: "subscriptionplans", 
            localField: "subscriptionPlanId",
            foreignField: "_id",
            as: "subscriptionPlan",
          },
        },
        {
          $unwind: {
            path: "$subscriptionPlan",
            preserveNullAndEmptyArrays: true,
          },
        },

        /* ---------- PROJECT (SELECTIVE FIELDS ONLY) ---------- */
        {
          $project: {
            // full BuySubscriptionPlan
            invoiceNumber: 1,
            featureIds: 1,
            subFeatures: 1,
            userId: 1,
            workspaceId: 1,
            subscriptionPlanId: 1,
            subscriptionPlanIdType: 1,
            startDate: 1,
            endDate: 1,
            transactionId: 1,
            title: 1,
            businessType: 1,
            planCategory: 1,
            durationInDays: 1,
            description: 1,
            shortDescription: 1,
            price: 1,
            subTotalPrice: 1,
            tax: 1,
            taxAmount: 1,
            discount: 1,
            discountAmount: 1,
            totalPrice: 1,
            afterDiscountPrice: 1,
            discountPercentage: 1,
            discountStartDate: 1,
            discountEndDate: 1,
            currency: 1,
            currencySymbol: 1,
            url: 1,
            users: 1,
            usersMax: 1,
            projects: 1,
            projectsMax: 1,
            clientsMax: 1,
            tasksMax: 1,
            numberOfSeats: 1,
            storage: 1,
            most_popular: 1,
            by_index: 1,
            activeFlag: 1,
            deleteFlag: 1,
            activeStatus: 1,
            createdAt: 1,
            updatedAt: 1,

            // USER (only required fields)
            "user.name": 1,
            "user.email": 1,
            "user.image": 1,
            "user.roleName": 1,
            "user.designationName": 1,

            // WORKSPACE (only required fields)
            "workspace.workspaceNumber": 1,
            "workspace.workspaceName": 1,
            "workspace.workspaceUrl": 1,
            "workspace.workspaceFullDomain": 1,
            "workspace.workspaceEmail": 1,
            "workspace.workingDays": 1,
            "workspace.workspaceCurrency": 1,
            "workspace.workspaceFavIcon": 1,
            "workspace.workspaceLogo": 1,

            // EMPLOYEE RANGE
            "employeeRange.start": 1,
            "employeeRange.end": 1,

            // FEATURE DETAILS
            "features._id": 1,
            "features.name": 1,

            // subscription (only required fields)
            "subscriptionPlan.title": 1,
            "subscriptionPlan.businessType": 1,
            "subscriptionPlan.durationInDays": 1,
            "subscriptionPlan.description": 1,
            "subscriptionPlan.shortDescription": 1,
            "subscriptionPlan.price": 1,
            "subscriptionPlan.discountPercentage": 1,
            "subscriptionPlan.discountStartDate": 1,
            "subscriptionPlan.discountEndDate": 1,
            "subscriptionPlan.users": 1,
            "subscriptionPlan.projects": 1,
            "subscriptionPlan.most_popular": 1,
          },
        },

        { $sort: { by_index: -1 } },
      ]);

      return result.length ? result : [];
    } catch (error) {
      console.log("getBuySubscriptionPlans error", error.message);
      throw new Error(error.message);
    }
  },
  //========================================old===================================
  async getUserCount(unitIds, deleteFlag) {
    try {
      const getCountDocuments = await User.countDocuments({
        unitId: { $in: unitIds },
        deleteFlag: deleteFlag,
        roleName: { $ne: "Super-Admin" },
      });
      if (getCountDocuments) {
        return getCountDocuments;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service getCountDocuments",
        error.message,
      );
      throw error;
    }
  },
  async getEmployeeCounts(unitIds, deleteFlag) {
    try {
      const getCountDocuments = await User.countDocuments({
        unitId: { $in: unitIds },
        deleteFlag: deleteFlag,
        roleName: { $nin: ["Super-Admin", "Admin"] },
      });
      if (getCountDocuments) {
        return getCountDocuments;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service getCountDocuments",
        error.message,
      );
      throw error;
    }
  },
  async getAdminCount(unitIds, deleteFlag) {
    try {
      const getCountDocuments = await User.countDocuments({
        unitId: { $in: unitIds },
        deleteFlag: deleteFlag,
        roleName: { $eq: "Admin" },
      });
      if (getCountDocuments) {
        return getCountDocuments;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service getCountDocuments",
        error.message,
      );
      throw error;
    }
  },
  async getEmployeeCount(unitIds, relievingStatus, deleteFlag) {
    try {
      const getCountDocuments = await User.countDocuments({
        unitId: { $in: unitIds },
        deleteFlag: deleteFlag,
        relievingStatus: relievingStatus,
        roleName: { $ne: "Super-Admin" },
      });
      if (getCountDocuments) {
        return getCountDocuments;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service getCountDocuments",
        error.message,
      );
      throw error;
    }
  },
  async checkUser(userId) {
    try {
      const checkUser = await User.findById(userId);
      if (checkUser) {
        return checkUser;
      } else {
        return "NA";
      }
    } catch (error) {
      throw new Error(error.message);
    }
  },
  async checkUserEmail(email) {
    try {
      const checkUser = await User.findOne({ email: email, deleteFlag: 0 });
      if (checkUser) {
        return checkUser;
      } else {
        return 0;
      }
    } catch (error) {
      throw new Error(error.message);
    }
  },
  async checkUserUniqueId(uniqueId) {
    try {
      const checkUser = await User.findOne({
        uniqueId: uniqueId,
        deleteFlag: 0,
      });
      if (checkUser) {
        return checkUser;
      } else {
        return 0;
      }
    } catch (error) {
      throw new Error(error.message);
    }
  },
  async checkUserEmailWithId(employeeId, email) {
    try {
      const checkUser = await User.findOne({
        _id: { $ne: employeeId },
        email: email,
        deleteFlag: 0,
      });
      if (checkUser) {
        return checkUser;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("checkUserEmailWithId find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkUserUniqueIdWithId(employeeId, uniqueId) {
    try {
      const checkUser = await User.findOne({
        _id: { $ne: employeeId },
        uniqueId: uniqueId,
        deleteFlag: 0,
      });
      if (checkUser) {
        return checkUser;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("checkUserEmailWithId find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkEmployeeOne(employeeId) {
    try {
      const employeeStatus = await User.findOne({ _id: employeeId }); // 20 seconds timeout

      if (employeeStatus) {
        return employeeStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(" employee find db error", error.message);
      throw new Error(error.message);
    }
  },
  async viewEmployee(userId) {
    try {
      const user = await User.aggregate([
        {
          $match: { _id: userId, roleName: { $ne: "Super-Admin" } },
        },
        {
          $limit: 1,
        },
        {
          $lookup: {
            from: "roles",
            localField: "roleId",
            foreignField: "_id",
            as: "roleDetails",
          },
        },

        {
          $unwind: {
            path: "$roleDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            roleDetails: { $ifNull: ["$roleDetails", "NA"] },
          },
        },
        {
          $lookup: {
            from: "companies",
            localField: "companyId",
            foreignField: "_id",
            as: "companyDetails",
          },
        },

        {
          $unwind: {
            path: "$companyDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            companyDetails: { $ifNull: ["$companyDetails", "NA"] }, // Set "NA" if no matching feature
          },
        },

        {
          $lookup: {
            from: "teams",
            localField: "teamId",
            foreignField: "_id",
            as: "teamDetails",
          },
        },
        {
          $unwind: {
            path: "$teamDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            teamDetails: { $ifNull: ["$teamDetails", "NA"] },
          },
        },
        {
          $lookup: {
            from: "departments",
            localField: "departmentId",
            foreignField: "_id",
            as: "departmentDetails",
          },
        },
        {
          $unwind: {
            path: "$departmentDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            departmentDetails: { $ifNull: ["$departmentDetails", "NA"] },
          },
        },

        {
          $lookup: {
            from: "units",
            localField: "unitId",
            foreignField: "_id",
            as: "unitDetails",
          },
        },
        {
          $unwind: {
            path: "$unitDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            unitDetails: [{ $ifNull: ["$unitDetails", "NA"] }],
          },
        },

        {
          $lookup: {
            from: "shifts",
            localField: "shiftId",
            foreignField: "_id",
            as: "shiftDetails",
          },
        },
        {
          $unwind: {
            path: "$shiftDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            shiftDetails: { $ifNull: ["$shiftDetails", "NA"] },
          },
        },
        {
          $addFields: {
            userId: "$_id",
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
                timezone: TIME_ZONE,
              },
            },
            formattedlastLoginTime: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$lastLoginTime",
                timezone: TIME_ZONE,
              },
            },
            formattedJoiningDate: {
              $cond: {
                if: { $eq: [{ $type: "$joiningDate" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$joiningDate",
                    timezone: TIME_ZONE,
                  },
                },
                else: "$joiningDate",
              },
            },
            formattedDob: {
              $cond: {
                if: { $eq: [{ $type: "$dob" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$dob",
                    timezone: TIME_ZONE,
                  },
                },
                else: "$dob",
              },
            },
            formattedOriginalDob: {
              $cond: {
                if: { $eq: [{ $type: "$originalDob" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$originalDob",
                    timezone: TIME_ZONE,
                  },
                },
                else: "$originalDob",
              },
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "reportingManagerId",
            foreignField: "_id",
            as: "reportingManagerDetails",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "registeredById",
            foreignField: "_id",
            as: "registeredByDetails",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "approvedById",
            foreignField: "_id",
            as: "approvedByDetails",
          },
        },
        {
          $group: {
            _id: "$_id",
            userData: { $first: "$$ROOT" },
            allUnits: { $addToSet: "$unitDetails" },
          },
        },
        {
          $addFields: {
            "userData.unitDetails": {
              $reduce: {
                input: "$allUnits",
                initialValue: [],
                in: { $setUnion: ["$$value", "$$this"] },
              },
            },
          },
        },
        {
          $replaceRoot: { newRoot: "$userData" },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            companyId: 1,
            unitId: 1,
            roleId: 1,
            departmentId: 1,
            designationName: 1,
            reportingManagerId: 1,
            registeredById: 1,
            approvedById: 1,
            reportingManager: {
              $ifNull: [
                { $arrayElemAt: ["$reportingManagerDetails.name", 0] },
                "NA",
              ],
            },
            registeredBy: { $arrayElemAt: ["$registeredByDetails.name", 0] },
            approvedBy: { $arrayElemAt: ["$approvedByDetails.name", 0] },
            teamId: 1,
            shiftId: 1,
            roleName: 1,
            roleDetails: 1,
            companyDetails: 1,
            unitDetails: 1,
            shiftDetails: 1,
            teamDetails: 1,
            departmentDetails: 1,
            accessLevel: 1,
            firstName: 1,
            lastName: 1,
            name: 1,
            uniqueId: 1,
            empId: 1,
            email: 1,
            personalEmail: 1,
            fatherName: 1,
            originalDob: 1,
            joiningDate: 1,
            mobileNumber: 1,
            phoneCode: 1,
            dob: 1,
            gender: 1,
            image: 1,
            aadharImage: 1,
            aadharNumber: 1,
            PANImage: 1,
            PANNumber: 1,
            addressProof: 1,
            address: 1,
            city: 1,
            state: 1,
            country: 1,
            pincode: 1,
            pAddress: 1,
            pCity: 1,
            pState: 1,
            pCountry: 1,

            pPincode: {
              $ifNull: ["$pPincode", "NA"],
            },
            pfEligibleStatus: 1,
            UAN: 1,
            pfNumber: 1,
            pFJoiningDate: 1,
            pFExitDate: 1,
            epsEligibleStatus: 1,
            ePSJoiningDate: 1,
            ePSExitDate: 1,
            ptStatus: 1,
            lwfEligibleStatus: 1,
            hPSEligibleStatus: 1,
            UPI: 1,
            aadhaarEnrollmentNumber: 1,
            bankName: {
              $ifNull: ["$bankName", "NA"],
            },
            bankAccountNumber: {
              $ifNull: ["$bankAccountNumber", "NA"],
            },
            accountHolderName: {
              $ifNull: ["$accountHolderName", "NA"],
            },
            IFSCCode: {
              $ifNull: ["$IFSCCode", "NA"],
            },
            bankStatus: 1,
            officialNumber: 1,
            documents: 1,
            documentStatus: 1,

            salary: 1,
            yearCTC: 1,
            CTCStatus: 1,
            religiousBreak: 1,
            physicallyChallenged: 1,
            spouseName: {
              $ifNull: ["$spouseName", "NA"],
            },
            motherName: {
              $ifNull: ["$motherName", "NA"],
            },
            religion: {
              $ifNull: ["$religion", "NA"],
            },

            maritalStatus: 1,
            bloodGroup: 1,
            emergencyContactNumber: 1,
            languageId: 1,
            profileComplete: 1,
            approveFlag: 1,
            activeFlag: 1,
            deleteFlag: 1,
            deleteReason: 1,
            loginType: 1,
            loginTypeFirst: 1,
            notificationStatus: 1,
            createdAt: 1,
            updatedAt: 1,
            lastLoginTime: 1,
            formattedlastLoginTime: 1,
            formattedCreatedAt: 1,
            formattedDob: 1,
            formattedOriginalDob: 1,
            formattedJoiningDate: 1,
            manualPunch: 1,
          },
        },
      ]);

      if (user && user.length > 0) {
        return user[0];
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from commen service user details",
        error.message,
      );
      throw new Error(error.message);
    }
  },

  async getBirthData(roleName, unitIds, day, month, year) {
    try {
      let query = { deleteFlag: 0, relievingStatus: 0 };
      const currentYear = moment().year();
      if (roleName === "Super-Admin") {
        query.$or = [
          { roleName: "Super Admin" },
          { deleteFlag: 0, relievingStatus: 0, activeFlag: 1 },
        ];
      } else {
        query.$or = [
          { roleName: "Super Admin" },
          {
            $expr: {
              $gt: [
                {
                  $size: {
                    $setIntersection: [
                      { $ifNull: ["$unitId", []] }, // Fallback to empty array
                      unitIds,
                    ],
                  },
                },
                0, // Check if intersection size > 0
              ],
            },
            deleteFlag: 0,
            relievingStatus: 0,
            activeFlag: 1,
          },
        ];
      }

      const todayDay = moment().startOf("day").toDate();
      query.$expr = {
        $gte: [
          {
            $dateFromParts: {
              year: currentYear,
              month: { $month: "$originalDob" },
              day: { $dayOfMonth: "$originalDob" },
            },
          },
          todayDay,
        ],
      };
      const users = await User.aggregate([
        {
          $match: query, // Apply the query conditions
        },
        {
          $project: {
            _id: 1,
            name: 1,
            roleName: 1,
            designationName: 1,
            dob: 1,
            originalDob: 1,
            image: 1,
            originalMonth: { $month: "$originalDob" },
            originalDay: { $dayOfMonth: "$originalDob" },
          },
        },
        {
          $sort: { originalMonth: 1, originalDay: 1 },
        },
        // {
        //   $limit: 20,
        // },
      ]);

      const today = moment().format("YYYY-MM-DD");
      const tomorrow = moment().add(1, "day").format("YYYY-MM-DD");

      const birthdayData = { Today: [], Tomorrow: [], Other: [] };

      users.forEach((user) => {
        if (!user?.originalDob || user.originalDob.length < 10) return; // Skip invalid DOB
        const dobMoment = moment(user.originalDob); // Convert to moment date
        const formattedDob = `${currentYear}-${dobMoment.format("MM-DD")}`;

        const formattedDate = moment(formattedDob, "YYYY-MM-DD", true).isValid()
          ? moment(formattedDob).format("DD MMM")
          : "Unknown";

        const userData = {
          _id: user._id,
          date: formattedDate,
          name: user.name,
          month: dobMoment.month() + 1, // Extract month (0-11)
          day: dobMoment.date(), // Extract day (1-31)
          designationName: user.designationName,
          dob: user.dob,
          originalDob: user.originalDob,
          roleName: user.roleName,
          image: user.image || null,
        };

        if (formattedDob === today) {
          birthdayData.Today.push(userData);
        } else if (formattedDob === tomorrow) {
          birthdayData.Tomorrow.push(userData);
        } else {
          birthdayData.Other.push(userData);
        }
      });
      const todayFormat = moment().format("DD MMM");
      const tomorrowFormate = moment().add(1, "day").format("DD MMM");
      let result = [];
      if (birthdayData.Today.length)
        result.push({ date: todayFormat, users: birthdayData.Today });
      if (birthdayData.Tomorrow.length)
        result.push({ date: tomorrowFormate, users: birthdayData.Tomorrow });
      birthdayData.Other.sort((a, b) => a.month - b.month || a.day - b.day);
      birthdayData.Other.forEach(({ date, ...user }) => {
        result.push({ date, users: [user] });
      });

      return result;
    } catch (error) {
      console.log(error.message);

      throw new Error(`Error fetching birthdays: ${error.message}`);
    }
  },
  async getJoiningData(roleName, unitIds, day, month, year) {
    try {
      let query = { deleteFlag: 0, relievingStatus: 0 };
      const currentYear = moment().year();
      if (roleName === "Super-Admin") {
        query.$or = [
          { roleName: "Super Admin" },
          { deleteFlag: 0, relievingStatus: 0, activeFlag: 1 },
        ];
      } else {
        query.$or = [
          { roleName: "Super Admin" },
          {
            $expr: {
              $gt: [
                {
                  $size: {
                    $setIntersection: [
                      { $ifNull: ["$unitId", []] }, // Fallback to empty array
                      unitIds,
                    ],
                  },
                },
                0, // Check if intersection size > 0
              ],
            },
            deleteFlag: 0,
            relievingStatus: 0,
            activeFlag: 1,
          },
        ];
      }

      const todayDay = moment().startOf("day").toDate();
      query.$expr = {
        $gte: [
          {
            $dateFromParts: {
              year: currentYear,
              month: { $month: "$joiningDate" },
              day: { $dayOfMonth: "$joiningDate" },
            },
          },
          todayDay,
        ],
      };
      const users = await User.aggregate([
        {
          $match: query, // Apply the query conditions
        },
        {
          $project: {
            _id: 1,
            name: 1,
            roleName: 1,
            designationName: 1,
            dob: 1,
            joiningDate: 1,
            image: 1,
            joiningMonth: { $month: "$joiningDate" }, // Extract the month from joiningDate
            joiningDay: { $dayOfMonth: "$joiningDate" }, // Extract the day from joiningDate
          },
        },
        {
          $sort: { joiningMonth: 1, joiningDay: 1 }, // Sort by month and day
        },
      ]);
      const today = moment().format("YYYY-MM-DD");
      const tomorrow = moment().add(1, "day").format("YYYY-MM-DD");
      const birthdayData = { Today: [], Tomorrow: [], Other: [] };

      users.forEach((user) => {
        if (!user?.joiningDate || user.joiningDate.length < 10) return; // Skip invalid DOB
        const dobMoment = moment(user.joiningDate); // Convert to moment date
        const formattedDob = `${currentYear}-${dobMoment.format("MM-DD")}`;

        const formattedDate = moment(formattedDob, "YYYY-MM-DD", true).isValid()
          ? moment(formattedDob).format("DD MMM")
          : "Unknown";
        const joining = new Date(user.joiningDate);
        const current = new Date();

        const joiningYear = joining.getFullYear();
        const currentYearNumber = current.getFullYear();
        const diffYears = currentYearNumber - joiningYear;
        const getSuffix = (num) => {
          if (num === 1) return "1st ";
          if (num === 2) return "2nd ";
          if (num === 3) return "3rd ";
          return `${num}th `;
        };
        const joiningDateLable =
          getSuffix(diffYears) === "0th "
            ? "Recently Joined"
            : getSuffix(diffYears) + "Anniversary";
        const userData = {
          _id: user._id,
          date: formattedDate,
          name: user.name,
          month: dobMoment.month() + 1, // Extract month (0-11)
          day: dobMoment.date(), // Extract day (1-31)
          designationName: user.designationName,
          dob: user.dob,
          joiningDate: user.joiningDate,
          joiningDateLable: joiningDateLable,
          roleName: user.roleName,
          image: user.image || null,
        };

        if (formattedDob === today) {
          birthdayData.Today.push(userData);
        } else if (formattedDob === tomorrow) {
          birthdayData.Tomorrow.push(userData);
        } else {
          birthdayData.Other.push(userData);
        }
      });
      const todayFormat = moment().format("DD MMM");
      const tomorrowFormate = moment().add(1, "day").format("DD MMM");
      let result = [];
      if (birthdayData.Today.length)
        result.push({ date: todayFormat, users: birthdayData.Today });
      if (birthdayData.Tomorrow.length)
        result.push({ date: tomorrowFormate, users: birthdayData.Tomorrow });
      birthdayData.Other.sort((a, b) => a.month - b.month || a.day - b.day);
      birthdayData.Other.forEach(({ date, ...user }) => {
        result.push({ date, users: [user] });
      });

      return result;
    } catch (error) {
      console.log(error.message);

      throw new Error(`Error fetching birthdays: ${error.message}`);
    }
  },

  async getUser(userIdCurrent, roleNameCurrent, unitIdsCurrent) {
    let con = null;
    const deleteFlag = 0;
    if (roleNameCurrent == "Super-Admin") {
      con = { deleteFlag: deleteFlag, roleName: { $nin: ["Super-Admin"] } };
    } else if (roleNameCurrent == "Admin") {
      con = {
        unitId: { $in: unitIdsCurrent },
        deleteFlag: deleteFlag,
        roleName: { $nin: ["Super-Admin", "Admin"] },
      };
    } else if (roleNameCurrent == "HR-Manager") {
      con = {
        unitId: { $in: unitIdsCurrent },
        deleteFlag: deleteFlag,
        roleName: { $nin: ["Super-Admin", "Admin", "HR-Manager"] },
      };
    } else if (roleNameCurrent == "Manager") {
      con = {
        unitId: { $in: unitIdsCurrent },
        deleteFlag: deleteFlag,
        roleName: { $nin: ["Super-Admin", "Admin", "HR-Manager", "Manager"] },
      };
    } else {
      con = {
        _id: userIdCurrent,
        unitId: { $in: unitIdsCurrent },
        deleteFlag: deleteFlag,
        roleName: { $nin: ["Super-Admin", "Admin", "HR-Manager", "Manager"] },
      };
    }
    try {
      const user = await User.aggregate([
        {
          $match: con,
        },
        {
          $lookup: {
            from: "roles",
            localField: "roleId",
            foreignField: "_id",
            as: "roleDetails",
          },
        },

        {
          $unwind: {
            path: "$roleDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            roleDetails: { $ifNull: ["$roleDetails", "NA"] },
          },
        },
        {
          $lookup: {
            from: "companies",
            localField: "companyId",
            foreignField: "_id",
            as: "companyDetails",
          },
        },

        {
          $unwind: {
            path: "$companyDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            companyDetails: { $ifNull: ["$companyDetails", "NA"] }, // Set "NA" if no matching feature
          },
        },

        {
          $lookup: {
            from: "teams",
            localField: "teamId",
            foreignField: "_id",
            as: "teamDetails",
          },
        },
        {
          $unwind: {
            path: "$teamDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            teamDetails: { $ifNull: ["$teamDetails", "NA"] },
          },
        },
        {
          $lookup: {
            from: "departments",
            localField: "departmentId",
            foreignField: "_id",
            as: "departmentDetails",
          },
        },
        {
          $unwind: {
            path: "$departmentDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            departmentDetails: { $ifNull: ["$departmentDetails", "NA"] },
          },
        },

        {
          $lookup: {
            from: "units",
            localField: "unitId",
            foreignField: "_id",
            as: "unitDetails",
          },
        },
        {
          $unwind: {
            path: "$unitDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            unitDetails: [{ $ifNull: ["$unitDetails", "NA"] }],
          },
        },

        {
          $lookup: {
            from: "shifts",
            localField: "shiftId",
            foreignField: "_id",
            as: "shiftDetails",
          },
        },
        {
          $unwind: {
            path: "$shiftDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            shiftDetails: { $ifNull: ["$shiftDetails", "NA"] },
            employeeNumber: "$uniqueId",
            shiftName: { $ifNull: ["$shiftDetails.shiftName", "NA"] },
            departmentName: {
              $ifNull: ["$departmentDetails.departmentName", "NA"],
            },
            teamName: { $ifNull: ["$teamDetails.teamName", "NA"] },
            physicallyChallenged: {
              $cond: {
                if: { $eq: ["$physicallyChallenged", 0] },
                then: "No",
                else: "Yes",
              },
            },
            religiousBreak: {
              $cond: {
                if: { $eq: ["$religiousBreak", 0] },
                then: "No",
                else: "Yes",
              },
            },
          },
        },
        {
          $addFields: {
            userId: "$_id",
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
                timezone: TIME_ZONE,
              },
            },
            formattedlastLoginTime: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$lastLoginTime",
                timezone: TIME_ZONE,
              },
            },
            formattedJoiningDate: {
              $cond: {
                if: { $eq: [{ $type: "$joiningDate" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$joiningDate",
                    timezone: TIME_ZONE,
                  },
                },
                else: "$joiningDate",
              },
            },
            formattedDob: {
              $cond: {
                if: { $eq: [{ $type: "$dob" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$dob",
                    timezone: TIME_ZONE,
                  },
                },
                else: "$dob",
              },
            },
            formattedOriginalDob: {
              $cond: {
                if: { $eq: [{ $type: "$originalDob" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$originalDob",
                    timezone: TIME_ZONE,
                  },
                },
                else: "$originalDob",
              },
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "reportingManagerId",
            foreignField: "_id",
            as: "reportingManagerDetails",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "registeredById",
            foreignField: "_id",
            as: "registeredByDetails",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "approvedById",
            foreignField: "_id",
            as: "approvedByDetails",
          },
        },
        {
          $group: {
            _id: "$_id",
            userData: { $first: "$$ROOT" },
            allUnits: { $addToSet: "$unitDetails" }, // Collect all units in an array
          },
        },

        // Flatten the units array of arrays
        {
          $addFields: {
            "userData.unitDetails": {
              $reduce: {
                input: "$allUnits",
                initialValue: [],
                in: { $setUnion: ["$$value", "$$this"] }, // Ensure unique units
              },
            },
          },
        },

        // Replace root with updated user data
        {
          $replaceRoot: { newRoot: "$userData" },
        },
        { $sort: { createdAt: -1 } },
        {
          $project: {
            _id: 1,
            userId: 1,
            companyId: 1,
            unitId: 1,
            roleId: 1,
            departmentId: 1,
            designationName: 1,
            reportingManagerId: 1,
            registeredById: 1,
            approvedById: 1,
            reportingManager: {
              $ifNull: [
                { $arrayElemAt: ["$reportingManagerDetails.name", 0] },
                "NA",
              ],
            },
            reportingManagerName: {
              $ifNull: [
                { $arrayElemAt: ["$reportingManagerDetails.name", 0] },
                "NA",
              ],
            },
            registeredBy: { $arrayElemAt: ["$registeredByDetails.name", 0] },
            approvedBy: { $arrayElemAt: ["$approvedByDetails.name", 0] },
            teamId: 1,
            shiftId: 1,
            roleName: 1,
            roleDetails: 1,
            companyDetails: 1,
            unitDetails: 1,
            shiftDetails: 1,
            teamDetails: 1,
            departmentDetails: 1,
            accessLevel: 1,
            firstName: 1,
            lastName: 1,
            name: 1,
            uniqueId: 1,
            empId: 1,
            email: 1,
            personalEmail: 1,
            fatherName: 1,
            originalDob: 1,
            joiningDate: 1,
            mobileNumber: 1,
            phoneCode: 1,
            dob: 1,
            gender: 1,
            image: 1,
            aadharImage: 1,
            aadharNumber: 1,
            PANImage: 1,
            PANNumber: 1,
            addressProof: 1,
            address: 1,
            city: 1,
            state: 1,
            country: 1,
            pincode: 1,
            pAddress: 1,
            pCity: 1,
            pState: 1,
            pCountry: 1,

            pPincode: {
              $ifNull: ["$pPincode", "NA"],
            },
            pfEligibleStatus: 1,
            UAN: 1,
            pfNumber: 1,
            pFJoiningDate: 1,
            pFExitDate: 1,
            epsEligibleStatus: 1,
            ePSJoiningDate: 1,
            ePSExitDate: 1,
            ptStatus: 1,
            lwfEligibleStatus: 1,
            hPSEligibleStatus: 1,
            UPI: 1,
            aadhaarEnrollmentNumber: 1,
            bankName: {
              $ifNull: ["$bankName", "NA"],
            },
            bankAccountNumber: {
              $ifNull: ["$bankAccountNumber", "NA"],
            },
            accountHolderName: {
              $ifNull: ["$accountHolderName", "NA"],
            },
            IFSCCode: {
              $ifNull: ["$IFSCCode", "NA"],
            },
            bankStatus: 1,
            officialNumber: 1,
            documents: 1,
            documentStatus: 1,

            salary: 1,
            yearCTC: 1,
            CTCStatus: 1,
            religiousBreak: 1,
            physicallyChallenged: 1,
            spouseName: {
              $ifNull: ["$spouseName", "NA"],
            },
            motherName: {
              $ifNull: ["$motherName", "NA"],
            },
            religion: {
              $ifNull: ["$religion", "NA"],
            },

            maritalStatus: 1,
            bloodGroup: 1,
            emergencyContactNumber: 1,
            languageId: 1,
            profileComplete: 1,
            approveFlag: 1,
            activeFlag: 1,
            deleteFlag: 1,
            deleteReason: 1,
            loginType: 1,
            loginTypeFirst: 1,
            notificationStatus: 1,
            createdAt: 1,
            updatedAt: 1,
            lastLoginTime: 1,
            formattedlastLoginTime: 1,
            formattedCreatedAt: 1,
            formattedDob: 1,
            formattedOriginalDob: 1,
            formattedJoiningDate: 1,
            shiftName: 1,
            departmentName: 1,
            teamName: 1,
            employeeNumber: 1,
            manualPunch: 1,
          },
        },
      ]);

      if (user && user.length > 0) {
        return user;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from commen service user details",
        error.message,
      );
      throw new Error(error.message);
    }
  },

  async getUserForExportAttendance(
    userIdCurrent,
    roleNameCurrent,
    unitIdsCurrent,
  ) {
    let con = null;
    const deleteFlag = 0;
    if (roleNameCurrent == "Super-Admin") {
      con = {
        deleteFlag: deleteFlag,
        roleName: { $nin: ["Super-Admin", "Admin"] },
        unitId: { $in: unitIdsCurrent },
      };
    } else if (roleNameCurrent == "Admin") {
      con = {
        unitId: { $in: unitIdsCurrent },
        deleteFlag: deleteFlag,
        roleName: { $nin: ["Super-Admin", "Admin"] },
      };
    } else if (roleNameCurrent == "HR-Manager") {
      con = {
        unitId: { $in: unitIdsCurrent },
        deleteFlag: deleteFlag,
        roleName: { $nin: ["Super-Admin", "Admin", "HR-Manager"] },
      };
    } else if (roleNameCurrent == "Manager") {
      con = {
        unitId: { $in: unitIdsCurrent },
        deleteFlag: deleteFlag,
        roleName: { $nin: ["Super-Admin", "Admin", "HR-Manager", "Manager"] },
      };
    } else {
      con = {
        _id: userIdCurrent,
        unitId: { $in: unitIdsCurrent },
        deleteFlag: deleteFlag,
        roleName: { $nin: ["Super-Admin", "Admin", "HR-Manager", "Manager"] },
      };
    }
    try {
      const user = await User.aggregate([
        {
          $match: con,
        },
        {
          $lookup: {
            from: "roles",
            localField: "roleId",
            foreignField: "_id",
            as: "roleDetails",
          },
        },

        {
          $unwind: {
            path: "$roleDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            roleDetails: { $ifNull: ["$roleDetails", "NA"] },
          },
        },
        {
          $lookup: {
            from: "companies",
            localField: "companyId",
            foreignField: "_id",
            as: "companyDetails",
          },
        },

        {
          $unwind: {
            path: "$companyDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            companyDetails: { $ifNull: ["$companyDetails", "NA"] }, // Set "NA" if no matching feature
          },
        },

        {
          $lookup: {
            from: "teams",
            localField: "teamId",
            foreignField: "_id",
            as: "teamDetails",
          },
        },
        {
          $unwind: {
            path: "$teamDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            teamDetails: { $ifNull: ["$teamDetails", "NA"] },
          },
        },
        {
          $lookup: {
            from: "departments",
            localField: "departmentId",
            foreignField: "_id",
            as: "departmentDetails",
          },
        },
        {
          $unwind: {
            path: "$departmentDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            departmentDetails: { $ifNull: ["$departmentDetails", "NA"] },
          },
        },

        {
          $lookup: {
            from: "units",
            localField: "unitId",
            foreignField: "_id",
            as: "unitDetails",
          },
        },
        {
          $unwind: {
            path: "$unitDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            unitDetails: [{ $ifNull: ["$unitDetails", "NA"] }],
          },
        },

        {
          $lookup: {
            from: "shifts",
            localField: "shiftId",
            foreignField: "_id",
            as: "shiftDetails",
          },
        },
        {
          $unwind: {
            path: "$shiftDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            shiftDetails: { $ifNull: ["$shiftDetails", "NA"] },
            employeeNumber: "$uniqueId",
            shiftName: { $ifNull: ["$shiftDetails.shiftName", "NA"] },
            departmentName: {
              $ifNull: ["$departmentDetails.departmentName", "NA"],
            },
            teamName: { $ifNull: ["$teamDetails.teamName", "NA"] },
            physicallyChallenged: {
              $cond: {
                if: { $eq: ["$physicallyChallenged", 0] },
                then: "No",
                else: "Yes",
              },
            },
            religiousBreak: {
              $cond: {
                if: { $eq: ["$religiousBreak", 0] },
                then: "No",
                else: "Yes",
              },
            },
          },
        },
        {
          $addFields: {
            userId: "$_id",
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
                timezone: TIME_ZONE,
              },
            },
            formattedlastLoginTime: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$lastLoginTime",
                timezone: TIME_ZONE,
              },
            },
            formattedJoiningDate: {
              $cond: {
                if: { $eq: [{ $type: "$joiningDate" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$joiningDate",
                    timezone: TIME_ZONE,
                  },
                },
                else: "$joiningDate",
              },
            },
            formattedDob: {
              $cond: {
                if: { $eq: [{ $type: "$dob" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$dob",
                    timezone: TIME_ZONE,
                  },
                },
                else: "$dob",
              },
            },
            formattedOriginalDob: {
              $cond: {
                if: { $eq: [{ $type: "$originalDob" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$originalDob",
                    timezone: TIME_ZONE,
                  },
                },
                else: "$originalDob",
              },
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "reportingManagerId",
            foreignField: "_id",
            as: "reportingManagerDetails",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "registeredById",
            foreignField: "_id",
            as: "registeredByDetails",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "approvedById",
            foreignField: "_id",
            as: "approvedByDetails",
          },
        },
        {
          $group: {
            _id: "$_id",
            userData: { $first: "$$ROOT" },
            allUnits: { $addToSet: "$unitDetails" }, // Collect all units in an array
          },
        },

        // Flatten the units array of arrays
        {
          $addFields: {
            "userData.unitDetails": {
              $reduce: {
                input: "$allUnits",
                initialValue: [],
                in: { $setUnion: ["$$value", "$$this"] }, // Ensure unique units
              },
            },
          },
        },

        // Replace root with updated user data
        {
          $replaceRoot: { newRoot: "$userData" },
        },
        { $sort: { createdAt: -1 } },
        {
          $project: {
            _id: 1,
            userId: 1,
            companyId: 1,
            unitId: 1,
            roleId: 1,
            departmentId: 1,
            designationName: 1,
            reportingManagerId: 1,
            registeredById: 1,
            approvedById: 1,
            reportingManager: {
              $ifNull: [
                { $arrayElemAt: ["$reportingManagerDetails.name", 0] },
                "NA",
              ],
            },
            reportingManagerName: {
              $ifNull: [
                { $arrayElemAt: ["$reportingManagerDetails.name", 0] },
                "NA",
              ],
            },
            registeredBy: { $arrayElemAt: ["$registeredByDetails.name", 0] },
            approvedBy: { $arrayElemAt: ["$approvedByDetails.name", 0] },
            teamId: 1,
            shiftId: 1,
            roleName: 1,
            roleDetails: 1,
            companyDetails: 1,
            unitDetails: 1,
            shiftDetails: 1,
            teamDetails: 1,
            departmentDetails: 1,
            accessLevel: 1,
            firstName: 1,
            lastName: 1,
            name: 1,
            uniqueId: 1,
            empId: 1,
            email: 1,
            personalEmail: 1,
            fatherName: 1,
            originalDob: 1,
            joiningDate: 1,
            mobileNumber: 1,
            phoneCode: 1,
            dob: 1,
            gender: 1,
            image: 1,
            aadharImage: 1,
            aadharNumber: 1,
            PANImage: 1,
            PANNumber: 1,
            addressProof: 1,
            address: 1,
            city: 1,
            state: 1,
            country: 1,
            pincode: 1,
            pAddress: 1,
            pCity: 1,
            pState: 1,
            pCountry: 1,

            pPincode: {
              $ifNull: ["$pPincode", "NA"],
            },
            pfEligibleStatus: 1,
            UAN: 1,
            pfNumber: 1,
            pFJoiningDate: 1,
            pFExitDate: 1,
            epsEligibleStatus: 1,
            ePSJoiningDate: 1,
            ePSExitDate: 1,
            ptStatus: 1,
            lwfEligibleStatus: 1,
            hPSEligibleStatus: 1,
            UPI: 1,
            aadhaarEnrollmentNumber: 1,
            bankName: {
              $ifNull: ["$bankName", "NA"],
            },
            bankAccountNumber: {
              $ifNull: ["$bankAccountNumber", "NA"],
            },
            accountHolderName: {
              $ifNull: ["$accountHolderName", "NA"],
            },
            IFSCCode: {
              $ifNull: ["$IFSCCode", "NA"],
            },
            bankStatus: 1,
            officialNumber: 1,
            documents: 1,
            documentStatus: 1,

            salary: 1,
            yearCTC: 1,
            CTCStatus: 1,
            religiousBreak: 1,
            physicallyChallenged: 1,
            spouseName: {
              $ifNull: ["$spouseName", "NA"],
            },
            motherName: {
              $ifNull: ["$motherName", "NA"],
            },
            religion: {
              $ifNull: ["$religion", "NA"],
            },

            maritalStatus: 1,
            bloodGroup: 1,
            emergencyContactNumber: 1,
            languageId: 1,
            profileComplete: 1,
            approveFlag: 1,
            activeFlag: 1,
            deleteFlag: 1,
            deleteReason: 1,
            loginType: 1,
            loginTypeFirst: 1,
            notificationStatus: 1,
            createdAt: 1,
            updatedAt: 1,
            lastLoginTime: 1,
            formattedlastLoginTime: 1,
            formattedCreatedAt: 1,
            formattedDob: 1,
            formattedOriginalDob: 1,
            formattedJoiningDate: 1,
            shiftName: 1,
            departmentName: 1,
            teamName: 1,
            employeeNumber: 1,
            manualPunch: 1,
          },
        },
      ]);

      if (user && user.length > 0) {
        return user;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from commen service user details",
        error.message,
      );
      throw new Error(error.message);
    }
  },

  //================================================Leave============================================================

  async getNotificationUsersAll(
    roleNameCurrent,
    unitIdsCurrent,
    roleIds,
    unitIds,
    deleteFlag,
  ) {
    let matchStage = null;
    let role = null;

    if (roleNameCurrent == "Super-Admin") {
      matchStage = roleIds.includes("all")
        ? { deleteFlag: deleteFlag || 0, roleName: { $nin: ["Super-Admin"] } }
        : {
            deleteFlag: deleteFlag || 0,
            roleName: { $nin: ["Super-Admin"] },
            roleId: {
              $in: roleIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
          };
      unitIds.includes("all")
        ? null
        : (matchStage.unitId = {
            $in: unitIds.map((id) => new mongoose.Types.ObjectId(id)),
          });
    } else if (roleNameCurrent == "Admin") {
      matchStage = roleIds.includes("all")
        ? {
            deleteFlag: deleteFlag || 0,
            roleName: { $nin: ["Super-Admin", "Admin"] },
          }
        : {
            deleteFlag: deleteFlag || 0,
            roleName: {
              $nin: ["Super-Admin", "Admin", "HR-Manager", "Manager"],
            },
            roleId: {
              $in: roleIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
          };
      unitIds.includes("all")
        ? (matchStage.unitId = { $in: unitIdsCurrent })
        : (matchStage.unitId = {
            $in: unitIds.map((id) => new mongoose.Types.ObjectId(id)),
          });
    } else if (roleNameCurrent == "HR-Manager") {
      matchStage = roleIds.includes("all")
        ? {
            deleteFlag: deleteFlag || 0,
            roleName: { $nin: ["Super-Admin", "Admin", "HR-Manager"] },
          }
        : {
            deleteFlag: deleteFlag || 0,
            roleName: {
              $nin: ["Super-Admin", "Admin", "HR-Manager", "Manager"],
            },
            roleId: {
              $in: roleIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
          };
      unitIds.includes("all")
        ? (matchStage.unitId = { $in: unitIdsCurrent })
        : (matchStage.unitId = {
            $in: unitIds.map((id) => new mongoose.Types.ObjectId(id)),
          });
    } else if (roleNameCurrent == "Manager") {
      matchStage = roleIds.includes("all")
        ? {
            deleteFlag: deleteFlag || 0,
            roleName: {
              $nin: ["Super-Admin", "Admin", "HR-Manager", "Manager"],
            },
          }
        : {
            deleteFlag: deleteFlag || 0,
            roleName: {
              $nin: ["Super-Admin", "Admin", "HR-Manager", "Manager"],
            },
            roleId: {
              $in: roleIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
          };
      unitIds.includes("all")
        ? (matchStage.unitId = { $in: unitIdsCurrent })
        : (matchStage.unitId = {
            $in: unitIds.map((id) => new mongoose.Types.ObjectId(id)),
          });
    } else {
      matchStage = roleIds.includes("all")
        ? {
            deleteFlag: deleteFlag || 0,
            roleName: {
              $nin: ["Super-Admin", "Admin", "HR-Manager", "Manager"],
            },
          }
        : {
            deleteFlag: deleteFlag || 0,
            roleName: {
              $nin: ["Super-Admin", "Admin", "HR-Manager", "Manager"],
            },
            roleId: {
              $in: roleIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
          };
      unitIds.includes("all")
        ? (matchStage.unitId = { $in: unitIdsCurrent })
        : (matchStage.unitId = {
            $in: unitIds.map((id) => new mongoose.Types.ObjectId(id)),
          });
    }
    try {
      const user = await User.aggregate([
        {
          $match: matchStage,
        },

        {
          $addFields: {
            userId: "$_id",
            paidLeaveCount: 0,
            maternityLeaveCount: 0,
            paternityLeaveCount: 0,
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
                timezone: TIME_ZONE,
              },
            },
            formattedlastLoginTime: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$lastLoginTime",
                timezone: TIME_ZONE,
              },
            },
            formattedJoiningDate: {
              $cond: {
                if: { $eq: [{ $type: "$joiningDate" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$joiningDate",
                    timezone: TIME_ZONE,
                  },
                },
                else: "$joiningDate",
              },
            },
            formattedDob: {
              $cond: {
                if: { $eq: [{ $type: "$dob" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$dob",
                    timezone: TIME_ZONE,
                  },
                },
                else: "$dob",
              },
            },
            formattedOriginalDob: {
              $cond: {
                if: { $eq: [{ $type: "$originalDob" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$originalDob",
                    timezone: TIME_ZONE,
                  },
                },
                else: "$originalDob",
              },
            },
          },
        },

        { $sort: { createdAt: -1 } },
        {
          $project: {
            _id: 1,
            userId: 1,
            companyId: 1,
            unitId: 1,
            roleId: 1,
            departmentId: 1,
            designationName: 1,
            reportingManagerId: 1,
            registeredById: 1,
            approvedById: 1,
            teamId: 1,
            shiftId: 1,
            roleName: 1,

            name: 1,
            uniqueId: 1,
            empId: 1,
            email: 1,

            joiningDate: 1,

            languageId: 1,
            profileComplete: 1,
            relievingDate: 1,
            relievingStatus: 1,
            approveFlag: 1,
            activeFlag: 1,
            deleteFlag: 1,
            deleteReason: 1,
            loginType: 1,
            loginTypeFirst: 1,
            notificationStatus: 1,
            createdAt: 1,
            updatedAt: 1,
            lastLoginTime: 1,
            formattedlastLoginTime: 1,
            formattedCreatedAt: 1,
            formattedDob: 1,
            formattedOriginalDob: 1,
            formattedJoiningDate: 1,
            paidLeaveCount: 1,
            maternityLeaveCount: 1,
            paternityLeaveCount: 1,
          },
        },
      ]);

      if (user && user.length > 0) {
        return user;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from commen service user details",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async getUsersByUnitIdsAndRoleAndUserId(
    unitIdsSend,
    roleIdsSend,
    employeeIdsSend,
    roleName,
    unitIds,
  ) {
    let matchStage = { deleteFlag: 0, activeFlag: 1, relievingStatus: 0 }; // base condition

    if (
      unitIdsSend.includes("all") &&
      roleIdsSend.includes("all") &&
      employeeIdsSend.includes("all")
    ) {
      if (roleName === "Super-Admin") {
        matchStage.roleName = { $nin: ["Super-Admin"] };
      } else {
        matchStage.unitId = { $in: unitIds };
      }
      // Send to all users, no extra filters
    } else if (
      !unitIdsSend.includes("all") &&
      roleIdsSend.includes("all") &&
      employeeIdsSend.includes("all")
    ) {
      // Send to all users of a specific unit
      matchStage.unitId = {
        $in: unitIdsSend.map((id) => new mongoose.Types.ObjectId(id)),
      };
    } else if (
      !unitIdsSend.includes("all") &&
      !roleIdsSend.includes("all") &&
      employeeIdsSend.includes("all")
    ) {
      // Send to all users in a unit and with certain roles
      matchStage.unitId = {
        $in: unitIdsSend.map((id) => new mongoose.Types.ObjectId(id)),
      };
      matchStage.roleId = {
        $in: roleIdsSend.map((id) => new mongoose.Types.ObjectId(id)),
      };
    } else if (!employeeIdsSend.includes("all")) {
      // Send only to selected employees
      matchStage._id = {
        $in: employeeIdsSend.map((id) => new mongoose.Types.ObjectId(id)),
      };
    }
    try {
      const user = await User.aggregate([
        {
          $match: matchStage,
        },

        {
          $addFields: {
            userId: "$_id",
            paidLeaveCount: 0,
            maternityLeaveCount: 0,
            paternityLeaveCount: 0,
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
                timezone: TIME_ZONE,
              },
            },
            formattedlastLoginTime: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$lastLoginTime",
                timezone: TIME_ZONE,
              },
            },
            formattedJoiningDate: {
              $cond: {
                if: { $eq: [{ $type: "$joiningDate" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$joiningDate",
                    timezone: TIME_ZONE,
                  },
                },
                else: "$joiningDate",
              },
            },
            formattedDob: {
              $cond: {
                if: { $eq: [{ $type: "$dob" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$dob",
                    timezone: TIME_ZONE,
                  },
                },
                else: "$dob",
              },
            },
            formattedOriginalDob: {
              $cond: {
                if: { $eq: [{ $type: "$originalDob" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$originalDob",
                    timezone: TIME_ZONE,
                  },
                },
                else: "$originalDob",
              },
            },
          },
        },

        { $sort: { createdAt: -1 } },
        {
          $project: {
            _id: 1,
            userId: 1,
            companyId: 1,
            unitId: 1,
            roleId: 1,
            departmentId: 1,
            designationName: 1,
            reportingManagerId: 1,
            registeredById: 1,
            approvedById: 1,
            teamId: 1,
            shiftId: 1,
            roleName: 1,

            name: 1,
            uniqueId: 1,
            empId: 1,
            email: 1,

            joiningDate: 1,

            languageId: 1,
            profileComplete: 1,
            relievingDate: 1,
            relievingStatus: 1,
            approveFlag: 1,
            activeFlag: 1,
            deleteFlag: 1,
            deleteReason: 1,
            loginType: 1,
            loginTypeFirst: 1,
            notificationStatus: 1,
            createdAt: 1,
            updatedAt: 1,
            lastLoginTime: 1,
            formattedlastLoginTime: 1,
            formattedCreatedAt: 1,
            formattedDob: 1,
            formattedOriginalDob: 1,
            formattedJoiningDate: 1,
            paidLeaveCount: 1,
            maternityLeaveCount: 1,
            paternityLeaveCount: 1,
          },
        },
      ]);

      if (user && user.length > 0) {
        return user;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from commen service user details",
        error.message,
      );
      throw new Error(error.message);
    }
  },

  async getUsersByUnitIdsAndRole(userUnitIds, userRole) {
    try {
      const roleHierarchy = {
        Employee: ["Manager", "HR-Manager", "Admin", "Super-Admin"],
        Manager: ["HR-Manager", "Admin", "Super-Admin"],
        "HR-Manager": ["Admin", "Super-Admin"],
        Admin: ["Super-Admin"],
      };

      const users = await User.find({
        $or: [
          { roleName: "Super-Admin" },
          {
            $expr: {
              $gt: [
                {
                  $size: {
                    $setIntersection: [
                      { $ifNull: ["$unitId", []] },
                      userUnitIds,
                    ],
                  },
                },
                0,
              ],
            },
            activeFlag: 1,
            relievingStatus: 0,
            roleName: { $in: roleHierarchy[userRole] || [] },
          },
        ],
      }).select("_id name designationName image email roleName unitId");

      return users;
    } catch (error) {
      console.log(
        "database error from commen service user details",
        error.message,
      );
      throw new Error(error.message);
    }
  },
};
