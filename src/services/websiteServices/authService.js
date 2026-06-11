const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const User = require("../../models/superAdminModels/userModel");
const Role = require("../../models/superAdminModels/roleModel");
const Tag = require("../../models/superAdminModels/tagsModel");
const Designation = require("../../models/superAdminModels/designationModel");
const Workspace = require("../../models/superAdminModels/workspaceModel");
const SubscriptionPlan = require("../../models/superAdminModels/subscriptionPlanModel");
const AccessPermission = require("../../models/superAdminModels/accessPermissionModel");
const AccessPreference = require("../../models/superAdminModels/accessPreferenceModel");
const Countries = require("../../models/superAdminModels/countryModel");

module.exports = {
  //==============================================================================================
  async checkUniqueId(workapaceNumber) {
    try {
      const existing = await Workspace.findOne({
        workapaceNumber,
        deleteFlag: 0,
      }).populate("countryId");
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      logger.error("Error in checkUniqueId", { error: error.message });
      throw error;
    }
  },
  async checkWorkspaceDomain(workspaceDomain) {
    try {
      const existing = await Workspace.findOne({
        workspaceDomain,
        deleteFlag: 0,
      }).populate("countryId");
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkWorkspaceDomain:", error);
      throw error;
    }
  },

  //============================================================================================== for signup steps
  async getRoles() {
    try {
      const existing = await Role.find({
        deleteFlag: 0,
        roleName: { $ne: "Super-Admin" },
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getRoles:", error);
      throw error;
    }
  },
  async getTags() {
    try {
      const existing = await Tag.find({
        deleteFlag: 0,
        name: { $ne: "Super-Admin" },
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getTags:", error);
      throw error;
    }
  },
  async getAccessLevel(roleName) {
    try {
      const existing = await AccessPermission.findOne({
        deleteFlag: 0,
        roleName: roleName,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getAccessLevel:", error);
      throw error;
    }
  },
  async getPreferenceAccessLevel(roleName) {
    try {
      const existing = await AccessPreference.findOne({
        deleteFlag: 0,
        roleName: roleName,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getPreferenceAccessLevel:", error);
      throw error;
    }
  },
  async getDesignations() {
    try {
      const existing = await Designation.find({
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getDesignations:", error);
      throw error;
    }
  },
  async checkEmail(email) {
    try {
      const existing = await User.findOne({
        email,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkWorkspaceEmail:", error);
      throw error;
    }
  },
  async checkWorkspaceEmail(workspaceEmail) {
    try {
      const existing = await Workspace.findOne({
        workspaceEmail,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkWorkspaceEmail:", error);
      throw error;
    }
  },

  async signupUser(data) {
    try {
      const addStatus = await User.create(data);
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in signupUser:", error);
      throw error;
    }
  },
  async updateUser(userId, data) {
    try {
      const addStatus = await User.updateOne({ _id: userId }, { $set: data });
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateUser:", error);
      throw error;
    }
  },
  async checkUserId(userId) {
    try {
      const checkUser = await User.findById(userId);
      if (checkUser) {
        return checkUser;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkUser:", error);
      throw error;
    }
  },
  async checkOTP(userId, otp) {
    try {
      const checkUser = await User.findOne({ _id: userId, otp });
      if (checkUser) {
        return checkUser;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkOTP:", error);
      throw error;
    }
  },
  //==========================super admin work space
  async createWorkspace(data) {
    try {
      const addStatus = await Workspace.create(data);
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createWorkspace:", error);
      throw error;
    }
  },
  async updateWorkspace(id, data) {
    try {
      const addStatus = await Workspace.updateOne({ _id: id }, { $set: data });
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createWorkspace:", error);
      throw error;
    }
  },
  async checkSubscriptionPlan(seletedPlanId) {
    let query = { deleteFlag: 0, activeFlag: 1 };
    if (seletedPlanId) {
      query = { deleteFlag: 0, activeFlag: 1, url: seletedPlanId };
    } else {
      query = {
        deleteFlag: 0,
        activeFlag: 1,
        title: "Free",
        planCategory: "Monthly",
      };
    }
    try {
      const checkSubscriptionPlan = await SubscriptionPlan.find(query).sort({
        by_index: -1,
      });
      if (checkSubscriptionPlan.length > 0) {
        return checkSubscriptionPlan[0]._id;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service checkSubscriptionPlan",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getSubscriptionPlan(subscriptionPlanId) {
    try {
      const getSubscriptionPlans = await SubscriptionPlan.find({
        _id: subscriptionPlanId,
        deleteFlag: 0,
        activeFlag: 1,
      }).sort({ by_index: -1 });
      if (getSubscriptionPlans.length > 0) {
        return getSubscriptionPlans[0];
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service getSubscriptionPlans",
        error.message
      );
      throw new Error(error.message);
    }
  },

  async getWorkspaceindustryName(workspaceId) {
    try {
      const result = await Workspace.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(workspaceId),
            deleteFlag: 0,
            activeFlag: 1,
          },
        },
        {
          $lookup: {
            from: "industries", // Industry collection name
            localField: "industryId",
            foreignField: "_id",
            as: "industryData",
          },
        },
        {
          $unwind: {
            path: "$industryData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            industryName: "$industryData.industryName", // Correct field here
          },
        },
      ]);

      if (result.length > 0 && result[0].industryName) {
        return result[0].industryName;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "Database error from getWorkspaceindustryName:",
        error.message
      );
      throw new Error(error.message);
    }
  },

  async checkCountry(countryId) {
    try {
      const existing = await Countries.findOne({
        _id: countryId,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkCountry:", error);
      throw error;
    }
  },
};
