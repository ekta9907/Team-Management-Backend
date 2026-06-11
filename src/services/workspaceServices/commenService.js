const mongoose = require("mongoose");
const moment = require("moment");
const UserNotificationMessageModel = require("../../models/workspaceModels/userNotificationMessageModel");
const UserModel = require("../../models/workspaceModels/userModel");
const CompanyModel = require("../../models/workspaceModels/companyModel");
const SkillModel = require("../../models/workspaceModels/skillModel");
const UserSkillsModel = require("../../models/workspaceModels/userSkillsModel");
const TeamModel = require("../../models/workspaceModels/teamModel");
const UserTeamModel = require("../../models/workspaceModels/userTeamsModel");
const DesignationModel = require("../../models/workspaceModels/designationModel");
const RoleModel = require("../../models/workspaceModels/roleModel");
const TagsModel = require("../../models/workspaceModels/tagsModel");
const CustomFieldModel = require("../../models/workspaceModels/customFieldModel");
const BuySubscriptionModel = require("../../models/workspaceModels/buySubscriptionPlanModel");
const WorkflowModel = require("../../models/workspaceModels/workflowModel");
const ProjectCategoryModel = require("../../models/workspaceModels/projectCategory");
const ProjectModel = require("../../models/workspaceModels/projectModel");
const ProjectBudgetModel = require("../../models/workspaceModels/projectBudgetModel");
const ProjectLinkModel = require("../../models/workspaceModels/projectLinkModel");
const ProjectFileModel = require("../../models/workspaceModels/projectFileModel");
const ProjectMessageModel = require("../../models/workspaceModels/projectMessageModel");
const ProofModel = require("../../models/workspaceModels/proofModel");
const TaskListModel = require("../../models/workspaceModels/ProjectTaskListModel");
const TaskModel = require("../../models/workspaceModels/projectTaskModel");
const TaskDependencyModel = require("../../models/workspaceModels/ProjectTaskDependencyModel");
const TaskCommentModel = require("../../models/workspaceModels/projectTaskCommentModel");
const countryModel = require("../../models/superAdminModels/countryModel");
const Permission = require("../../models/superAdminModels/permissionModel");
const TaskLogTimeModel = require("../../models/workspaceModels/ProjectTaskTimeModel");
const CommentReplayModel = require("../../models/workspaceModels/commentReplyModel");
const ProjectUpdateModel = require("../../models/workspaceModels/ProjectUpdateModel");
const { WORKSPACENUMBER } = require("../../services/websiteServices/function");

const {
  getTenantStorageSize,
} = require("../../middelwares/s3StorageMiddleware");

require("moment-duration-format");

const TIME_ZONE = process.env.TIME_ZONE;
module.exports = {
  async getBuySubscriptionPlans(SITE_DB_NAME, deleteFlag) {
    try {
      const BuySubscription = await BuySubscriptionModel(SITE_DB_NAME);
      const getBuySubscriptionPlans = await BuySubscription.find({
        deleteFlag: deleteFlag,
      }).sort({ endDate: -1 });
      if (getBuySubscriptionPlans) {
        return getBuySubscriptionPlans;
      } else {
        return [];
      }
    } catch (error) {
      console.log(
        "database error from admin service getBuySubscriptionPlans",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async getCurrentBuySubscriptionPlans(
    SITE_DB_NAME,
    CURRENT_SITE_WORKSPACE_NUMBER = null,
    deleteFlag = 0,
  ) {
    try {
      const BuySubscription = await BuySubscriptionModel(SITE_DB_NAME);
      // today
      const today = moment().startOf("day");
      let latestPlan = await BuySubscription.findOne({ deleteFlag: 0 })
        .sort({ endDate: -1 })
        .lean(); // latest one
      if (latestPlan) {
        const isActive =
          moment(today).isBetween(
            latestPlan.startDate,
            latestPlan.endDate,
            null,
            "[]",
          ) && latestPlan.activeStatus === 1;
        const dataS3 = await getTenantStorageSize(
          CURRENT_SITE_WORKSPACE_NUMBER,
          latestPlan.startDate,
          latestPlan.endDate,
        );

        const parseValue = (val) => {
          if (typeof val === "string" && val.toLowerCase() === "unlimited")
            return "unlimited";
          return parseInt(val || 0);
        };
        function parseValueStorage(value) {
          if (typeof value === "string") {
            const lower = value.toLowerCase().trim();
            if (lower === "unlimited") return "unlimited";
            const mbMatch = lower.match(/^(\d+(?:\.\d+)?)\s*mb$/);
            const gbMatch = lower.match(/^(\d+(?:\.\d+)?)\s*gb$/);
            if (mbMatch) {
              return { value: parseFloat(mbMatch[1]), unit: "MB" };
            } else if (gbMatch) {
              return { value: parseFloat(gbMatch[1]), unit: "GB" };
            }
          }
          const num = parseFloat(value);
          return isNaN(num)
            ? { value: 0, unit: "GB" }
            : { value: num, unit: "GB" };
        }

        const usersMax = parseValue(latestPlan.usersMax);
        const numberOfSeats = parseValue(latestPlan.numberOfSeats);
        const projectsMax = parseValue(latestPlan.projectsMax);
        const clientsMax = parseValue(latestPlan.clientsMax);
        const tasksMax = parseValue(latestPlan.tasksMax);
        const parsedStorage = parseValueStorage(latestPlan.storage);
        let storageLimit = 0;
        if (parsedStorage === "unlimited") {
          storageLimit = "unlimited";
        } else {
          storageLimit =
            parsedStorage.unit === "MB"
              ? parsedStorage.value / 1024
              : parsedStorage.value;
        }

        const currentUsersCount = 0;
        const currentProjectsCount = 0;
        const currentClientsCount = 0;
        const currentTasksCount = 0;

        const usedStorageMB = dataS3?.sizeMB || 0;
        const usedStorageGB = usedStorageMB / 1024;

        let storageUsedPercent = 0;
        let remainingPercent = 0;
        let storageRemainingGB = 0;

        if (storageLimit === "unlimited") {
          storageUsedPercent = "unlimited";
          remainingPercent = "unlimited";
          storageRemainingGB = "unlimited";
        } else {
          storageUsedPercent = ((usedStorageGB / storageLimit) * 100).toFixed(
            2,
          );
          remainingPercent = (
            ((storageLimit - usedStorageGB) / storageLimit) *
            100
          ).toFixed(2);
          storageRemainingGB = (storageLimit - usedStorageGB).toFixed(2);
        }

        const getRemaining = (max, used) => {
          if (max === "unlimited") return "unlimited";
          return max - used;
        };

        const remainingStats = {
          planStatus: isActive ? "active" : "expired",
          users: {
            used: currentUsersCount,
            max: numberOfSeats,
            remaining: getRemaining(numberOfSeats, currentUsersCount),
            buyExceedLimit: usersMax,
          },
          projects: {
            used: currentProjectsCount,
            max: projectsMax,
            remaining: getRemaining(projectsMax, currentProjectsCount),
            buyExceedLimit: projectsMax,
          },
          clients: {
            used: currentClientsCount,
            max: clientsMax,
            remaining: getRemaining(clientsMax, currentClientsCount),
            buyExceedLimit: clientsMax,
          },
          tasks: {
            used: currentTasksCount,
            max: tasksMax,
            remaining: getRemaining(tasksMax, currentTasksCount),
            buyExceedLimit: tasksMax,
          },
          storage: {
            type: "GB",
            used: usedStorageGB.toFixed(2),
            max: storageLimit,
            remaining: storageRemainingGB,
            buyExceedLimit: storageLimit * 1000,
            usagePercent: storageUsedPercent,
            remainingPercent: remainingPercent,
          },
          planDetails: {
            name: latestPlan.planName,
            startDate: latestPlan.startDate,
            endDate: latestPlan.endDate,
          },
        };

        latestPlan.remainingStats = remainingStats;
        return latestPlan;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service getCurrentBuySubscriptionPlans",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async getAccessLevelFeatureAccordingToSubscription(
    SITE_DB_NAME,
    accessLevel,
    workspaceId,
  ) {
    try {
      const today = new Date();
      const BuySubscription = await BuySubscriptionModel(SITE_DB_NAME);

      const lastSub = await BuySubscription.findOne({
        workspaceId,
        deleteFlag: 0,
        activeFlag: 1,
      })
        .sort({ endDate: -1 })
        .lean();

      if (!lastSub) return [];

      const isExpired =
        (lastSub.startDate && today < new Date(lastSub.startDate)) ||
        (lastSub.endDate && today > new Date(lastSub.endDate));

      const subFeatures = lastSub.subFeatures || [];
      const accessLevels = accessLevel || [];
      const permissionMaster = await Permission.find(
        { deleteFlag: 0, activeFlag: 1 },
        { levelName: 1, label: 1, briefDescription: 1 },
      ).lean();
      const permissionMap = new Map(
        permissionMaster.map((item) => [item.levelName, item]),
      );

      // Process each accessLevel with async logic
      const updatedAccessLevels = await Promise.all(
        accessLevels.map(async (level) => {
          let exceedLimitData = {
            exceedLimitStatus: false,
            usedLimit: 0,
            limit: 0,
          };
          const matchedSubFeature = subFeatures.find(
            (sf) => sf.keyName === level.levelName,
          );
          if (!matchedSubFeature) return null;

          let permissions = [...(level.permissions || [])];

          // Case 1: Expired/future subscription → strip write permissions
          if (isExpired) {
            //permissions = permissions.filter((p) => !["add", "edit", "delete"].includes(p));
          }
          // Case 2: Active → check dynamic add permission
          else if (permissions.includes("add")) {
            exceedLimitData = await this.getPermissionCheckExpStatus(
              SITE_DB_NAME,
              workspaceId,
              {
                ...level,
                subFeature: matchedSubFeature,
                value: matchedSubFeature.value,
                valueType: matchedSubFeature.valueType,
                permissions,
                expStatus: isExpired,
              },
            );
          }
          const permissionData = permissionMap.get(level.levelName) || {};

          return {
            ...level,
            label:
              level?.label || level?.lable || permissionData?.label || null,
            briefDescription:
              level?.briefDescription ||
              permissionData?.briefDescription ||
              null,
            subFeature: matchedSubFeature,
            value: matchedSubFeature.value,
            valueType: matchedSubFeature.valueType,
            permissions,
            expStatus: isExpired,
            exceedLimitStatus: exceedLimitData?.exceedLimitStatus,
            usedLimit: exceedLimitData?.usedLimit,
            limit: exceedLimitData?.limit,
          };
        }),
      );
      accessLevel = updatedAccessLevels
        .filter((level) => level !== null)
        .filter(
          (level) =>
            !(
              level.subFeature.valueType === "boolean" &&
              level.subFeature.value === false
            ),
        );
      // Filter out null + disabled boolean features
      return { accessLevel, expStatus: isExpired };
    } catch (error) {
      console.error(
        "Error in getAccessLevelFeatureAccordingToSubscription:",
        error,
      );
      throw error;
    }
  },
  async getPermissionCheckExpStatus(
    SITE_DB_NAME,
    workspaceId,
    accessLevelData,
  ) {
    const { valueType, value, keyName } = accessLevelData;
    try {
      if (keyName === "storage") {
        const CURRENT_SITE_WORKSPACE_NUMBER =
          await WORKSPACENUMBER(workspaceId);
        const storageData = await getCurrentBuySubscriptionPlans(
          SITE_DB_NAME,
          (CURRENT_SITE_WORKSPACE_NUMBER = null),
          (deleteFlag = 0),
        );
        console.log(storageData);
      }
      if (valueType === "string" && value === "unlimited") {
        return {
          exceedLimitStatus: false,
          usedLimit: "unlimited",
          limit: "unlimited",
        };
      }
      // const User = await UserModel(SITE_DB_NAME);
      // const checkUser = await User.findById(userId);
      // if (checkUser) {
      //   return checkUser;
      // } else {
      return {
        exceedLimitStatus: false,
        usedLimit: "unlimited",
        limit: "unlimited",
      };
      // }
    } catch (error) {
      console.log("Database error from checkUser:", error.message);
      throw new Error(error.message);
    }
  },
  async checkUser(SITE_DB_NAME, userId) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const checkUser = await User.findById(userId);
      if (checkUser) {
        return checkUser;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("Database error from checkUser:", error.message);
      throw new Error(error.message);
    }
  },
  async getUserDetails(SITE_DB_NAME, userId) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const user = await User.aggregate([
        {
          $match: { _id: userId },
        },
        // lookup designation
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
          $addFields: {
            workspaceDetails: { $ifNull: ["$workspaceDetails", null] },
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
            }, // Set "NA" if no matching feature
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
            companyDetails: {
              $ifNull: ["$companyDetails", null],
            }, // Set "NA" if no matching feature
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
          $lookup: {
            from: "skills",
            localField: "skillId",
            foreignField: "_id",
            as: "skillDetails",
          },
        },
        {
          $unwind: {
            path: "$skillDetails",
            preserveNullAndEmptyArrays: true,
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
          $unwind: {
            path: "$reportingManagerDetails",
            preserveNullAndEmptyArrays: true,
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
          $unwind: {
            path: "$registeredByDetails",
            preserveNullAndEmptyArrays: true,
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
          $unwind: {
            path: "$approvedByDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            shiftDetails: { $ifNull: ["$shiftDetails", null] },
            teamDetails: { $ifNull: ["$teamDetails", null] },
            departmentDetails: { $ifNull: ["$departmentDetails", null] },
            skillDetails: { $ifNull: ["$skillDetails", null] },
            reportingManagerDetails: {
              $ifNull: ["$reportingManagerDetails", null],
            },
            registeredByDetails: { $ifNull: ["$registeredByDetails", null] },
            approvedByDetails: { $ifNull: ["$approvedByDetails", null] },
          },
        },
        {
          $addFields: {
            roleDetails: {
              $let: {
                vars: { role: "$roleDetails" },
                in: {
                  $cond: [
                    { $eq: ["$$role", null] },
                    null,
                    {
                      _id: "$$role._id",
                      roleName: "$$role.roleName",
                      activeFlag: "$$role.activeFlag",
                      deleteFlag: "$$role.deleteFlag",
                    },
                  ],
                },
              },
            },
            designationDetails: {
              $let: {
                vars: { designation: "$designationDetails" },
                in: {
                  $cond: [
                    { $eq: ["$$designation", null] },
                    null,
                    {
                      _id: "$$designation._id",
                      name: "$$designation.name",
                      activeFlag: "$$designation.activeFlag",
                      deleteFlag: "$$designation.deleteFlag",
                    },
                  ],
                },
              },
            },

            companyDetails: {
              $let: {
                vars: { company: "$companyDetails" },
                in: {
                  $cond: [
                    { $eq: ["$$company", null] },
                    null,
                    {
                      _id: "$$company._id",
                      companyName: "$$company.companyName",
                      companyEmail: "$$company.companyEmail",
                      companyPhone: "$$company.companyPhone",
                    },
                  ],
                },
              },
            },
            unitDetails: {
              $map: {
                input: { $ifNull: ["$unitDetails", []] },
                as: "unit",
                in: {
                  _id: "$$unit._id",
                  unitName: "$$unit.unitName",
                  unitEmail: "$$unit.unitEmail",
                  unitURL: "$$unit.unitURL",
                  unitAddress: "$$unit.unitAddress",
                  activeFlag: "$$unit.activeFlag",
                  deleteFlag: "$$unit.deleteFlag",
                },
              },
            },

            teamDetails: {
              $let: {
                vars: { team: "$teamDetails" },
                in: {
                  $cond: [
                    { $eq: ["$$team", null] },
                    null,
                    {
                      _id: "$$team._id",
                      teamName: "$$team.teamName",
                      teamLogo: "$$team.teamLogo",
                      handleBy: "$$team.handleBy",
                      description: "$$team.description",
                    },
                  ],
                },
              },
            },
            departmentDetails: {
              $let: {
                vars: { department: "$departmentDetails" },
                in: {
                  $cond: [
                    { $eq: ["$$department", null] },
                    null,
                    {
                      _id: "$$department._id",
                      departmentName: "$$department.departmentName",
                      activeFlag: "$$department.activeFlag",
                      deleteFlag: "$$department.deleteFlag",
                    },
                  ],
                },
              },
            },
            skillDetails: {
              $let: {
                vars: { skill: "$skillDetails" },
                in: {
                  $cond: [
                    { $eq: ["$$skill", null] },
                    null,
                    {
                      _id: "$$skill._id",
                      skillName: {
                        $ifNull: ["$$skill.skillName", "$$skill.name"],
                      },
                      activeFlag: "$$skill.activeFlag",
                      deleteFlag: "$$skill.deleteFlag",
                    },
                  ],
                },
              },
            },
            reportingManagerDetails: {
              $let: {
                vars: { manager: "$reportingManagerDetails" },
                in: {
                  $cond: [
                    { $eq: ["$$manager", null] },
                    null,
                    {
                      _id: "$$manager._id",
                      name: "$$manager.name",
                      email: "$$manager.email",
                      roleName: "$$manager.roleName",
                      image: "$$manager.image",
                    },
                  ],
                },
              },
            },
            registeredByDetails: {
              $let: {
                vars: { user: "$registeredByDetails" },
                in: {
                  $cond: [
                    { $eq: ["$$user", null] },
                    null,
                    {
                      _id: "$$user._id",
                      name: "$$user.name",
                      email: "$$user.email",
                      roleName: "$$user.roleName",
                      image: "$$user.image",
                    },
                  ],
                },
              },
            },
            approvedByDetails: {
              $let: {
                vars: { user: "$approvedByDetails" },
                in: {
                  $cond: [
                    { $eq: ["$$user", null] },
                    null,
                    {
                      _id: "$$user._id",
                      name: "$$user.name",
                      email: "$$user.email",
                      roleName: "$$user.roleName",
                      image: "$$user.image",
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            shiftDetails: { $ifNull: ["$shiftDetails", null] },
            paidLeaveCount: 0,
            maternityLeaveCount: 0,
            paternityLeaveCount: 0,
          },
        },
        {
          $addFields: {
            documents: {
              $cond: [
                { $isArray: "$documents" },
                {
                  $map: {
                    input: "$documents",
                    as: "d",
                    in: {
                      _id: "$$d._id",
                      documentName: { $ifNull: ["$$d.documentName", null] },
                      documentFile: { $ifNull: ["$$d.documentFile", []] },
                      organizationName: {
                        $ifNull: ["$$d.organizationName", null],
                      },
                      start: {
                        $cond: [
                          { $ifNull: ["$$d.start", false] },
                          {
                            $dateToString: {
                              date: "$$d.start",
                              format: "%Y-%m-%d",
                            },
                          },
                          null,
                        ],
                      },
                      end: {
                        $cond: [
                          { $ifNull: ["$$d.end", false] },
                          {
                            $dateToString: {
                              date: "$$d.end",
                              format: "%Y-%m-%d",
                            },
                          },
                          null,
                        ],
                      },
                      document: { $ifNull: ["$$d.document", null] },
                    },
                  },
                },
                [],
              ],
            },
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
            unitId: 1,
            otp: 1,
            otpVerify: 1,
            signupSteps: 1,
            socialId: 1,
            workspaceId: 1,
            designationId: 1,
            designationName: 1,
            roleId: 1,
            companyId: 1,
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
            landMark: 1,
            address: 1,
            city: 1,
            state: 1,
            countryName: 1,
            countryId: 1,
            countryCode: 1,
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
            designationDetails: 1,
            companyDetails: 1,
            unitDetails: 1,
            shiftDetails: 1,
            teamDetails: 1,
            departmentDetails: 1,
            skillDetails: 1,
            reportingManagerDetails: 1,
            registeredByDetails: 1,
            approvedByDetails: 1,
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
            billableRate: 1,
            billableCost: 1,
            privateNotes: 1,
            publicProfile: 1,
            twitter: 1,
            linkedin: 1,
            facebook: 1,
            website: 1,
            accessPreferenceLevel: 1,
            accessLevel: 1,
            documents: 1,
            documentStatus: 1,
            bankName: 1,
            bankAccountNumber: 1,
            IFSCCode: 1,
            accountHolderName: 1,
            bankStatus: 1,
            designationDetails: 1,
            designationName: 1,
            skillId: 1,
            skillDetails: 1,
            motherName: 1,
            spouseName: 1,
            maritalStatus: 1,
            bloodGroup: 1,
            religion: 1,
            physicallyChallenged: 1,
            pLandMark: 1,
            pAddress: 1,
            pCity: 1,
            pState: 1,
            pCountry: 1,
            pPincode: 1,
            relievingDate: 1,
            relievingStatus: 1,
            // HRMS / Payroll
            salary: 1,
            yearCTC: 1,
            CTCStatus: 1,
            pfEligibleStatus: 1,
            UAN: 1,
            pfNumber: 1,
            eSICNumber: 1,
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
            aadharNumber: 1,
            aadharImage: 1,
            PANNumber: 1,
            PANImage: 1,
            deleteReason: 1,
            manualPunch: 1,
            showBirthAny: 1,
            profileComplete: 1,
            mobileNumber: 1,
            shiftId: 1,
          },
        },
      ]);

      if (user && user.length > 0) {
        user[0].otp = null;
        const accessData =
          await this.getAccessLevelFeatureAccordingToSubscription(
            SITE_DB_NAME,
            user[0].accessLevel,
            user[0].workspaceId,
          );
        user[0].accessLevel = accessData?.accessLevel || [];
        user[0].expStatus = accessData?.expStatus || false;
        return user[0];
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from getUserDetails", error.message);
      throw new Error(error.message);
    }
  },

  async updateLoginTime(SITE_DB_NAME, userId) {
    try {
      const User = await UserModel(SITE_DB_NAME);
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
      console.log("database error from updateLoginTime", error.message);
      throw new Error(error.message);
    }
  },

  // =============================================== attendance time calculation main ======================================================

  async getNotifications(SITE_DB_NAME, userId, checkUser, limit, offset) {
    try {
      const UserNotificationMessage =
        await UserNotificationMessageModel(SITE_DB_NAME);
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
  async getNotificationCount(SITE_DB_NAME, userId) {
    try {
      const UserNotificationMessage =
        await UserNotificationMessageModel(SITE_DB_NAME);
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
  async clearNotification(SITE_DB_NAME, userId, deleteFlag) {
    try {
      const UserNotificationMessage =
        await UserNotificationMessageModel(SITE_DB_NAME);
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
  async deleteNotification(SITE_DB_NAME, notificationId, deleteFlag) {
    const UserNotificationMessage =
      await UserNotificationMessageModel(SITE_DB_NAME);
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
  async checkNotification(SITE_DB_NAME, notificationId) {
    const UserNotificationMessage =
      await UserNotificationMessageModel(SITE_DB_NAME);
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

  //====================================== Update-Profile-Tanant ===========================
  async updateTenantUserProfile(SITE_DB_NAME, userId, data) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const updateStatus = await User.updateOne(
        { _id: userId },
        { $set: data },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from commen service updateTenantUserProfile",
        error.message,
      );
      throw new Error(error.message);
    }
  },

  async updateUserPassword(SITE_DB_NAME, showPassword, password, userId) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const updateStatus = await User.updateOne(
        { _id: userId },
        { $set: { showPassword, password: password } },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from commen service updateUserPassword",
        error.message,
      );
      throw new Error(error.message);
    }
  },

  //====================================== Tanant-Company-Flow ===========================
  async checkCompanyLastNumber(SITE_DB_NAME) {
    try {
      const Company = await CompanyModel(SITE_DB_NAME);
      const lastCompany = await Company.findOne({ deleteFlag: 0 })
        .sort({ createdAt: -1 }) // latest one
        // .select("companyNumber")
        .lean();

      if (lastCompany && lastCompany.companyNumber) {
        const lastNumber = parseInt(lastCompany.companyNumber.split("-")[1]);
        const newNumber = lastNumber + 1;
        const paddedNumber = String(newNumber).padStart(3, "0");
        return `CMP-${paddedNumber}`;
      }
      if (!lastCompany || !lastCompany.companyNumber) {
        return "CMP-001"; // default start
      }
      return "NA";
    } catch (error) {
      console.error("Error in checkProjectLastNumber me :", error);
      throw new Error(error.message);
    }
  },

  async checkCompanyName(SITE_DB_NAME, companyName) {
    const Company = await CompanyModel(SITE_DB_NAME);
    try {
      const checkCompany = await Company.findOne({
        companyName,
        deleteFlag: 0,
      });

      if (checkCompany) {
        return checkCompany;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("Database error from checkCompany:", error.message);
      throw new Error(error.message);
    }
  },

  async createCompany(SITE_DB_NAME, data) {
    const Company = await CompanyModel(SITE_DB_NAME);

    try {
      const companyData = await Company.create(data);
      if (companyData) {
        return companyData;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("Database error from createCompany:", error.message);
      throw new Error(error.message);
    }
  },

  async getCompanyDetails(SITE_DB_NAME, companyId) {
    const Company = await CompanyModel(SITE_DB_NAME);
    try {
      const companyDetails = await Company.findOne({
        _id: companyId,
        deleteFlag: 0,
      });

      if (companyDetails) {
        return companyDetails;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getCompanyDetails:", error);
      throw new Error(error.message);
    }
  },

  async getCompanyTagsDetails(SITE_DB_NAME, companyId) {
    const Company = await CompanyModel(SITE_DB_NAME);
    try {
      const result = await Company.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(companyId),
            deleteFlag: 0,
          },
        },
        {
          $lookup: {
            from: "tags", // collection name in MongoDB
            localField: "tagsId",
            foreignField: "_id",
            as: "tags",
          },
        },
        {
          $project: {
            // include other fields as needed
            tags: {
              _id: 1,
              name: 1,
              color: 1,
            },
          },
        },
      ]);

      if (result.length > 0) {
        return result[0];
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getCompanyDetails:", error);
      throw new Error(error.message);
    }
  },

  async updateCompany(SITE_DB_NAME, companyId, data) {
    const Company = await CompanyModel(SITE_DB_NAME);
    try {
      const updateStatus = await Company.updateOne(
        { _id: companyId },
        { $set: data },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateCompany:", error);
      throw new Error(error.message);
    }
  },
  async updateCompanyCustomField(SITE_DB_NAME, companyId, keyName, updateData) {
    const Company = await CompanyModel(SITE_DB_NAME);
    try {
      const updateStatus = await Company.findOneAndUpdate(
        {
          _id: companyId,
        },
        {
          $set: updateData,
        },
      );

      return updateStatus || "NA";
    } catch (error) {
      console.error("Error in updateCompanyCustomField:", error);
      throw new Error(error.message);
    }
  },

  async updateCompanyField(SITE_DB_NAME, companyId, data) {
    const Company = await CompanyModel(SITE_DB_NAME);
    try {
      const updateStatus = await Company.updateOne(
        { _id: companyId },
        { $set: data },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateCompanyField:", error);
      throw new Error(error.message);
    }
  },

  async getCompanyFieldDetails(SITE_DB_NAME, companyId, fieldName) {
    const Company = await CompanyModel(SITE_DB_NAME);
    try {
      const companyDetails = await Company.findOne(
        {
          _id: companyId,
          deleteFlag: 0,
        },
        { [fieldName]: 1, _id: 0 },
      );

      if (companyDetails) {
        return companyDetails;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getCompanyFieldDetails:", error);
      throw new Error(error.message);
    }
  },

  async checkCompanyId(SITE_DB_NAME, companyId) {
    try {
      const Company = await CompanyModel(SITE_DB_NAME);
      const existing = await Company.findOne({
        _id: new mongoose.Types.ObjectId(companyId),
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkCompanyId:", error);
      throw new Error(error.message);
    }
  },

  async deleteCompany(SITE_DB_NAME, companyId) {
    const Company = await CompanyModel(SITE_DB_NAME);
    try {
      const updateStatus = await Company.updateOne(
        { _id: companyId },
        { $set: { deleteFlag: 1 } },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("Database error from deleteCompany:", error.message);
      throw new Error(error.message);
    }
  },

  async getCustomFieldList(SITE_DB_NAME, moduleType, deleteFlag) {
    const CustomField = await CustomFieldModel(SITE_DB_NAME, deleteFlag);
    let query = {
      deleteFlag: deleteFlag,
    };
    if (moduleType !== "all") {
      query = {
        moduleType: moduleType,
        deleteFlag: deleteFlag,
      };
    }
    try {
      const customFieldList = await CustomField.find(query);
      if (customFieldList.length > 0) {
        return customFieldList;
      } else {
        return [];
      }
    } catch (error) {
      console.log("Database error from getCustomFieldList:", error.message);
      throw new Error(error.message);
    }
  },

  async getCompanyDetails(SITE_DB_NAME, comapnyId) {
    try {
      const Company = await CompanyModel(SITE_DB_NAME);
      const Companies = await Company.aggregate([
        {
          $match: {
            deleteFlag: 0,
            _id: comapnyId,
          },
        },
        {
          $lookup: {
            from: "users", // if `createdBy` is a reference to the "users" collection
            localField: "createdBy",
            foreignField: "_id",
            as: "createdByDetails",
          },
        },
        {
          $unwind: {
            path: "$createdByDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            createdByName: {
              $cond: {
                if: { $ne: ["$createdByDetails", null] },
                then: "$createdByDetails.name",
                else: null,
              },
            },
            createdByImage: {
              $cond: {
                if: { $ne: ["$createdByDetails", null] },
                then: "$createdByDetails.image",
                else: null,
              },
            },
          },
        },
        {
          $lookup: {
            from: "tags",
            localField: "tagsId",
            foreignField: "_id",
            as: "tagsList",
          },
        },
        {
          $group: {
            _id: "$_id",
            doc: { $first: "$$ROOT" }, // entire document
          },
        },
        {
          $project: {
            _id: "$_id",
            companyName: "$doc.companyName",
            companyEmail: "$doc.companyEmail",
            companyURL: "$doc.companyURL",
            companyNumber: "$doc.companyNumber",
            companyLogo: "$doc.companyLogo",
            companyAddress: "$doc.companyAddress",
            companyCity: "$doc.companyCity",
            companyState: "$doc.companyState",
            companycountryName: "$doc.companycountryName",
            companyCountryCode: "$doc.companyCountryCode",
            companyPincode: "$doc.companyPincode",
            companyPrivateNotes: "$doc.companyPrivateNotes",
            companyPublicProfile: "$doc.companyPublicProfile",
            companyType: "$doc.companyType",
            social: "$doc.social",
            customFields: "$doc.customFields",
            activeFlag: "$doc.activeFlag",
            deleteFlag: "$doc.deleteFlag",
            createdAt: "$doc.createdAt",
            updatedAt: "$doc.updatedAt",
            createdBy: "$doc.createdBy",
            createdByName: "$doc.createdByDetails.name",
            createdByImage: "$doc.createdByDetails.image",
            tagsId: "$doc.tagsId",
            tagsList: "$doc.tagsList",
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
      ]);
      if (Companies.length > 0) {
        const moduleType = "Company";
        const customFieldList = await this.getCustomFieldList(
          SITE_DB_NAME,
          moduleType,
          0,
        );
        const enrichedCompanies = Companies.map((company) => {
          // Agar customFields nahi hai, toh empty object de do
          company.customFields = company.customFields || {};

          // Har expected customField check karo
          for (const field of customFieldList) {
            if (!(field.keyName in company.customFields)) {
              company.customFields[field.keyName] = field;
            } else {
              const {
                fieldName,
                keyName,
                fieldType,
                options,
                _id,
                moduleType,
                updatedAt,
                createdAt,
                activeFlag,
                deleteFlag,
              } = field;

              company.customFields[field.keyName] = {
                fieldName,
                keyName,
                fieldType,
                options,
                _id,
                moduleType,
                updatedAt,
                createdAt,
                activeFlag,
                deleteFlag,
                value: company.customFields[field.keyName].value,
              };
            }
          }
          return company;
        });
        return enrichedCompanies[0];
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("Database error from getCompanies:", error.message);
      throw new Error(error.message);
    }
  },

  async getCompanies(
    deleteFlag,
    SITE_DB_NAME,
    pagination,
    search,
    projectPagination,
  ) {
    const Company = await CompanyModel(SITE_DB_NAME);
    try {
      const { pageSize, pageNumber } = pagination;
      const skip = (pageNumber - 1) * pageSize;

      const { projectPageNumber = 1, projectPageSize = 5 } =
        projectPagination || {};
      const projectSkip = (projectPageNumber - 1) * projectPageSize;
      const projectLimit = projectPageSize;

      const pipeline = [
        {
          $match: {
            deleteFlag: deleteFlag,
          },
        },
        // Owner lookup
        // {
        //   $lookup: {
        //     from: "users",
        //     let: { ownerId: "$ownerId" },
        //     pipeline: [
        //       { $match: { $expr: { $eq: ["$_id", "$$ownerId"] } } },
        //       { $project: { name: 1, image: 1, roleName: 1 } },
        //     ],
        //     as: "ownerDetails",
        //   },
        // },
        // {
        //   $unwind: { path: "$ownerDetails", preserveNullAndEmptyArrays: true },
        // },

        // Owner lookup
        {
          $lookup: {
            from: "users",
            let: { ownerId: "$ownerId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$_id", "$$ownerId"] },
                      { $ne: ["$$ownerId", null] },
                    ],
                  },
                },
              },
              {
                $project: { name: 1, image: 1, roleName: 1 },
              },
            ],
            as: "ownerDetails",
          },
        },
        {
          $addFields: {
            ownerDetails: {
              $cond: {
                if: { $eq: [{ $size: "$ownerDetails" }, 0] },
                then: null,
                else: { $arrayElemAt: ["$ownerDetails", 0] },
              },
            },
          },
        },

        // CreatedBy lookup
        {
          $lookup: {
            from: "users",
            let: { createdById: "$createdBy" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$createdById"] } } },
              { $project: { name: 1, image: 1, roleName: 1 } },
            ],
            as: "createdByDetails",
          },
        },
        {
          $unwind: {
            path: "$createdByDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // Tags lookup
        {
          $lookup: {
            from: "tags",
            localField: "tagsId",
            foreignField: "_id",
            as: "tagsList",
          },
        },

        // Projects lookup
        {
          $lookup: {
            from: "projects",
            let: { companyId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$companyId", "$$companyId"] },
                  deleteFlag: 0,
                },
              },
              { $sort: { createdAt: -1 } },
              { $skip: projectSkip },
              { $limit: projectLimit },

              // Owner details
              {
                $lookup: {
                  from: "users",
                  let: { ownerId: "$ownerId" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$ownerId"] } } },
                    { $project: { name: 1, image: 1, roleName: 1 } },
                  ],
                  as: "ownerDetails",
                },
              },
              {
                $unwind: {
                  path: "$ownerDetails",
                  preserveNullAndEmptyArrays: true,
                },
              },

              // Workflow lookup
              {
                $lookup: {
                  from: "workflows",
                  let: { workflowId: "$workflowId" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$workflowId"] } } },
                    { $project: { name: 1 } },
                  ],
                  as: "workflowDetails",
                },
              },
              {
                $unwind: {
                  path: "$workflowDetails",
                  preserveNullAndEmptyArrays: true,
                },
              },

              // People lookup
              {
                $lookup: {
                  from: "users",
                  let: { ids: "$peopleIds" },
                  pipeline: [
                    { $match: { $expr: { $in: ["$_id", "$$ids"] } } },
                    { $project: { name: 1, image: 1, roleName: 1 } },
                  ],
                  as: "peopleDetails",
                },
              },

              // Notify users lookup
              {
                $lookup: {
                  from: "users",
                  let: { ids: "$notifyIds" },
                  pipeline: [
                    { $match: { $expr: { $in: ["$_id", "$$ids"] } } },
                    { $project: { name: 1, image: 1, roleName: 1 } },
                  ],
                  as: "notifyDetails",
                },
              },

              // CreatedBy lookup
              {
                $lookup: {
                  from: "users",
                  localField: "createdById",
                  foreignField: "_id",
                  as: "createdByDetails",
                  pipeline: [{ $project: { _id: 1, name: 1, image: 1 } }],
                },
              },
              {
                $unwind: {
                  path: "$createdByDetails",
                  preserveNullAndEmptyArrays: true,
                },
              },

              // Tags lookup
              {
                $lookup: {
                  from: "tags",
                  localField: "tagsId",
                  foreignField: "_id",
                  as: "tagsList",
                },
              },

              // Project Category lookup
              {
                $lookup: {
                  from: "projectcategories",
                  let: { id: "$projectCategoryId" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
                    { $project: { name: 1 } },
                  ],
                  as: "projectCategoryDetails",
                },
              },
              {
                $unwind: {
                  path: "$projectCategoryDetails",
                  preserveNullAndEmptyArrays: true,
                },
              },

              // Project Subcategory lookup
              {
                $lookup: {
                  from: "projectsubcategories",
                  let: { id: "$projectSubCategoryId" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
                    { $project: { name: 1 } },
                  ],
                  as: "projectSubCategoryDetails",
                },
              },
              {
                $unwind: {
                  path: "$projectSubCategoryDetails",
                  preserveNullAndEmptyArrays: true,
                },
              },

              // Budget lookup
              {
                $lookup: {
                  from: "projectbudgets",
                  let: { projectId: "$_id" },
                  pipeline: [
                    {
                      $match: {
                        $expr: { $eq: ["$projectId", "$$projectId"] },
                      },
                    },
                    {
                      $project: {
                        budgetName: 1,
                        budgetType: 1,
                        budgetAmountType: 1,
                        budgetAmount: 1,
                        budgetRepeats: 1,
                        budgetStartDate: 1,
                        budgetEndDate: 1,
                        budgetBasedOn: 1,
                        retainerOption: 1,
                        financialTarget: 1,
                      },
                    },
                  ],
                  as: "projectBudget",
                },
              },
              {
                $unwind: {
                  path: "$projectBudget",
                  preserveNullAndEmptyArrays: true,
                },
              },
            ],
            as: "projects",
          },
        },

        // ✅ Tasks lookup for totalTask and taskCompletion
        {
          $lookup: {
            from: "projecttasks",
            let: { projectIds: "$projects._id" },
            pipeline: [
              {
                $match: {
                  $expr: { $in: ["$projectId", "$$projectIds"] },
                  deleteFlag: 0,
                },
              },
            ],
            as: "tasks",
          },
        },

        // ✅ Users lookup for totalAdmin, totalClient, totalMember
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "companyId",
            as: "allUsers",
          },
        },

        // ✅ Fields calculation
        {
          $addFields: {
            totalProject: { $size: "$projects" },
            totalTask: { $size: "$tasks" },
            completedTasks: {
              $size: {
                $filter: {
                  input: "$tasks",
                  as: "task",
                  cond: { $eq: ["$$task.taskStatus", "completed"] },
                },
              },
            },
            totalAdmin: {
              $size: {
                $filter: {
                  input: "$allUsers",
                  as: "user",
                  cond: { $eq: ["$$user.roleName", "Admin"] },
                },
              },
            },
            totalClient: {
              $size: {
                $filter: {
                  input: "$allUsers",
                  as: "user",
                  cond: { $eq: ["$$user.roleName", "Client"] },
                },
              },
            },
            totalMember: {
              $size: {
                $filter: {
                  input: "$allUsers",
                  as: "user",
                  cond: { $eq: ["$$user.roleName", "Member"] },
                },
              },
            },
          },
        },
        {
          $addFields: {
            "taskCompletion.completionPercentage": {
              $cond: [
                { $eq: ["$totalTask", 0] },
                0,
                {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ["$completedTasks", "$totalTask"] },
                        100,
                      ],
                    },
                    0,
                  ],
                },
              ],
            },
            "taskCompletion.remainingTasks": {
              $subtract: ["$totalTask", "$completedTasks"],
            },
          },
        },

        // Cleanup unnecessary fields
        {
          $project: {
            allUsers: 0,
            tasks: 0,
            workspaces: 0,
            completedTasks: 0,
          },
        },
      ];

      if (search && search.trim() !== "") {
        pipeline.push({
          $match: {
            $or: [{ companyName: { $regex: search, $options: "i" } }],
          },
        });
      }

      pipeline.push(
        { $sort: { companyType: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
      );

      // const Companies = await Company.aggregate(pipeline);

      // if (Companies.length > 0) {
      //   const moduleType = "Company";
      //   const customFieldList = await this.getCustomFieldList(
      //     SITE_DB_NAME,
      //     moduleType,
      //     0
      //   );

      //   const enrichedCompanies = Companies.map((company) => {
      //     company.customFields = company.customFields || {};
      //     for (const field of customFieldList) {
      //       if (!(field.keyName in company.customFields)) {
      //         company.customFields[field.keyName] = field;
      //       } else {
      //         const {
      //           fieldName,
      //           keyName,
      //           fieldType,
      //           options,
      //           _id,
      //           moduleType,
      //           updatedAt,
      //           createdAt,
      //           activeFlag,
      //           deleteFlag,
      //         } = field;

      //         company.customFields[field.keyName] = {
      //           fieldName,
      //           keyName,
      //           fieldType,
      //           options,
      //           _id,
      //           moduleType,
      //           updatedAt,
      //           createdAt,
      //           activeFlag,
      //           deleteFlag,
      //           value: company.customFields[field.keyName].value,
      //         };
      //       }
      //     }
      //     return company;
      //   });

      //   return enrichedCompanies;
      // } else {
      //   return "NA";
      // }

      const Companies = await Company.aggregate(pipeline);

      if (Companies.length > 0) {
        const companyModuleType = "Company";
        const companyCustomFieldList = await this.getCustomFieldList(
          SITE_DB_NAME,
          companyModuleType,
          0,
        );

        const projectModuleType = "Project";
        const projectCustomFieldList = await this.getCustomFieldList(
          SITE_DB_NAME,
          projectModuleType,
          0,
        );

        const enrichedCompanies = Companies.map((company) => {
          // Enrich company custom fields
          company.customFields = company.customFields || {};
          for (const field of companyCustomFieldList) {
            if (!(field.keyName in company.customFields)) {
              company.customFields[field.keyName] = field;
            } else {
              const {
                fieldName,
                keyName,
                fieldType,
                options,
                _id,
                moduleType,
                updatedAt,
                createdAt,
                activeFlag,
                deleteFlag,
              } = field;

              company.customFields[field.keyName] = {
                fieldName,
                keyName,
                fieldType,
                options,
                _id,
                moduleType,
                updatedAt,
                createdAt,
                activeFlag,
                deleteFlag,
                value: company.customFields[field.keyName].value,
              };
            }
          }

          // ✅ Enrich each project's custom fields
          company.projects = company.projects.map((project) => {
            project.customFields = project.customFields || {};
            const newCustomFields = {};
            for (const field of projectCustomFieldList) {
              const key = field.keyName;
              const valueFromProject = project.customFields[key];
              const finalValue =
                valueFromProject &&
                valueFromProject.hasOwnProperty("value") &&
                valueFromProject.value != null
                  ? valueFromProject.value
                  : null;

              newCustomFields[key] = {
                fieldName: field.fieldName,
                keyName: field.keyName,
                fieldType: field.fieldType,
                options: field.options,
                _id: field._id,
                moduleType: field.moduleType,
                updatedAt: field.updatedAt,
                createdAt: field.createdAt,
                activeFlag: field.activeFlag,
                deleteFlag: field.deleteFlag,
                value: finalValue,
              };
            }
            project.customFields = newCustomFields;
            return project;
          });

          return company;
        });

        return enrichedCompanies;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("Database error from getCompanies:", error.message);
      throw new Error(error.message);
    }
  },

  // async getCompanies(
  //   deleteFlag,
  //   SITE_DB_NAME,
  //   pagination,
  //   search,
  //   projectPagination
  // ) {
  //   const Company = await CompanyModel(SITE_DB_NAME);
  //   try {
  //     const { pageSize, pageNumber } = pagination;
  //     const skip = (pageNumber - 1) * pageSize;

  //     const { projectPageNumber = 1, projectPageSize = 5 } =
  //       projectPagination || {};
  //     const projectSkip = (projectPageNumber - 1) * projectPageSize;
  //     const projectLimit = projectPageSize;

  //     const pipeline = [
  //       {
  //         $match: {
  //           deleteFlag: deleteFlag,
  //         },
  //       },
  //       // Join owner details
  //       {
  //         $lookup: {
  //           from: "users",
  //           let: { ownerId: "$ownerId" },
  //           pipeline: [
  //             { $match: { $expr: { $eq: ["$_id", "$$ownerId"] } } },
  //             { $project: { name: 1, image: 1, roleName: 1 } },
  //           ],
  //           as: "ownerDetails",
  //         },
  //       },
  //       {
  //         $unwind: { path: "$ownerDetails", preserveNullAndEmptyArrays: true },
  //       },
  //       {
  //         $lookup: {
  //           from: "users",
  //           let: { createdById: "$createdBy" }, // yaha alias 'createdById'
  //           pipeline: [
  //             {
  //               $match: {
  //                 $expr: { $eq: ["$_id", "$$createdById"] }, // yahi alias use karo
  //               },
  //             },
  //             {
  //               $project: {
  //                 name: 1,
  //                 image: 1,
  //                 roleName: 1,
  //               },
  //             },
  //           ],
  //           as: "createdByDetails",
  //         },
  //       },

  //       {
  //         $unwind: {
  //           path: "$createdByDetails",
  //           preserveNullAndEmptyArrays: true,
  //         },
  //       },
  //       {
  //         $lookup: {
  //           from: "tags",
  //           localField: "tagsId",
  //           foreignField: "_id",
  //           as: "tagsList",
  //         },
  //       },

  //       // ✅ Projects full lookup
  //       {
  //         $lookup: {
  //           from: "projects",
  //           let: { companyId: "$_id" },
  //           pipeline: [
  //             {
  //               $match: {
  //                 $expr: { $eq: ["$companyId", "$$companyId"] },
  //                 deleteFlag: 0,
  //               },
  //             },
  //             { $sort: { createdAt: -1 } },
  //             { $skip: projectSkip }, //
  //             { $limit: projectLimit },

  //             // Owner
  //             {
  //               $lookup: {
  //                 from: "users",
  //                 let: { ownerId: "$ownerId" },
  //                 pipeline: [
  //                   { $match: { $expr: { $eq: ["$_id", "$$ownerId"] } } },
  //                   { $project: { name: 1, image: 1, roleName: 1 } },
  //                 ],
  //                 as: "ownerDetails",
  //               },
  //             },
  //             {
  //               $unwind: {
  //                 path: "$ownerDetails",
  //                 preserveNullAndEmptyArrays: true,
  //               },
  //             },

  //             // Workflow
  //             {
  //               $lookup: {
  //                 from: "workflows",
  //                 let: { workflowId: "$workflowId" },
  //                 pipeline: [
  //                   { $match: { $expr: { $eq: ["$_id", "$$workflowId"] } } },
  //                   { $project: { name: 1 } },
  //                 ],
  //                 as: "workflowDetails",
  //               },
  //             },
  //             {
  //               $unwind: {
  //                 path: "$workflowDetails",
  //                 preserveNullAndEmptyArrays: true,
  //               },
  //             },

  //             // People
  //             {
  //               $lookup: {
  //                 from: "users",
  //                 let: { ids: "$peopleIds" },
  //                 pipeline: [
  //                   { $match: { $expr: { $in: ["$_id", "$$ids"] } } },
  //                   { $project: { name: 1, image: 1, roleName: 1 } },
  //                 ],
  //                 as: "peopleDetails",
  //               },
  //             },

  //             // Notify users
  //             {
  //               $lookup: {
  //                 from: "users",
  //                 let: { ids: "$notifyIds" },
  //                 pipeline: [
  //                   { $match: { $expr: { $in: ["$_id", "$$ids"] } } },
  //                   { $project: { name: 1, image: 1, roleName: 1 } },
  //                 ],
  //                 as: "notifyDetails",
  //               },
  //             },

  //             // CreatedBy
  //             {
  //               $lookup: {
  //                 from: "users",
  //                 localField: "createdById",
  //                 foreignField: "_id",
  //                 as: "createdByDetails",
  //                 pipeline: [
  //                   {
  //                     $project: {
  //                       _id: 1,
  //                       name: 1,
  //                       image: 1,
  //                     },
  //                   },
  //                 ],
  //               },
  //             },

  //             {
  //               $unwind: {
  //                 path: "$createdByDetails",
  //                 preserveNullAndEmptyArrays: true, // agar kabhi user missing ho toh null rehne do
  //               },
  //             },

  //             // Tags
  //             {
  //               $lookup: {
  //                 from: "tags",
  //                 localField: "tagsId",
  //                 foreignField: "_id",
  //                 as: "tagsList",
  //               },
  //             },

  //             // Project category
  //             {
  //               $lookup: {
  //                 from: "projectcategories",
  //                 let: { id: "$projectCategoryId" },
  //                 pipeline: [
  //                   { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
  //                   { $project: { name: 1 } },
  //                 ],
  //                 as: "projectCategoryDetails",
  //               },
  //             },
  //             {
  //               $unwind: {
  //                 path: "$projectCategoryDetails",
  //                 preserveNullAndEmptyArrays: true,
  //               },
  //             },

  //             // Project subcategory
  //             {
  //               $lookup: {
  //                 from: "projectsubcategories",
  //                 let: { id: "$projectSubCategoryId" },
  //                 pipeline: [
  //                   { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
  //                   { $project: { name: 1 } },
  //                 ],
  //                 as: "projectSubCategoryDetails",
  //               },
  //             },
  //             {
  //               $unwind: {
  //                 path: "$projectSubCategoryDetails",
  //                 preserveNullAndEmptyArrays: true,
  //               },
  //             },

  //             // Budget
  //             {
  //               $lookup: {
  //                 from: "projectbudgets",
  //                 let: { projectId: "$_id" },
  //                 pipeline: [
  //                   {
  //                     $match: { $expr: { $eq: ["$projectId", "$$projectId"] } },
  //                   },
  //                   {
  //                     $project: {
  //                       budgetName: 1,
  //                       budgetType: 1,
  //                       budgetAmountType: 1,
  //                       budgetAmount: 1,
  //                       budgetRepeats: 1,
  //                       budgetStartDate: 1,
  //                       budgetEndDate: 1,
  //                       budgetBasedOn: 1,
  //                       retainerOption: 1,
  //                       financialTarget: 1,
  //                     },
  //                   },
  //                 ],
  //                 as: "projectBudget",
  //               },
  //             },
  //             {
  //               $unwind: {
  //                 path: "$projectBudget",
  //                 preserveNullAndEmptyArrays: true,
  //               },
  //             },
  //           ],
  //           as: "projects",
  //         },
  //       },
  //       {
  //         $addFields: {
  //           budgets: "",
  //           financialBudgets: "",
  //           taskCompletion: {
  //             completionPercentage: 0,
  //             remainingTasks: 0,
  //           },
  //           totalProject: 0,
  //           totalTask: 0,
  //         },
  //       },
  //       {
  //         $group: {
  //           _id: "$_id",
  //           doc: { $first: "$$ROOT" }, // entire document
  //         },
  //       },
  //       {
  //         $project: {
  //           _id: "$_id",
  //           companyName: "$doc.companyName",
  //           companyEmail: "$doc.companyEmail",
  //           companyURL: "$doc.companyURL",
  //           companyNumber: "$doc.companyNumber",
  //           companyPhone: "$doc.companyPhone",
  //           companyLogo: "$doc.companyLogo",
  //           companyAddress: "$doc.companyAddress",
  //           companyCity: "$doc.companyCity",
  //           companyState: "$doc.companyState",
  //           industry: "$doc.industry",
  //           companycountryName: "$doc.companycountryName",
  //           companyCountryCode: "$doc.companyCountryCode",
  //           companyPincode: "$doc.companyPincode",
  //           companyPrivateNotes: "$doc.companyPrivateNotes",
  //           companyPublicProfile: "$doc.companyPublicProfile",
  //           companyType: "$doc.companyType",
  //           companyHealthLabels: "$doc.companyHealthLabels",
  //           customFields: "$doc.customFields",
  //           activeFlag: "$doc.activeFlag",
  //           deleteFlag: "$doc.deleteFlag",
  //           createdAt: "$doc.createdAt",
  //           updatedAt: "$doc.updatedAt",
  //           createdBy: "$doc.createdBy",
  //           tagsId: "$doc.tagsId",
  //           tagsList: "$doc.tagsList",
  //           projects: "$doc.projects",
  //           owner: "$doc.ownerDetails",
  //           ownerId: "$doc.ownerId",
  //           budgets: "$doc.budgets",
  //           financialBudgets: "$doc.financialBudgets",
  //           taskCompletion: "$doc.taskCompletion",
  //           totalProject: "$doc.totalProject",
  //           totalTask: "$doc.totalTask",
  //           projectbudgets: "$doc.projectbudgets",
  //           createdByDetails: "$doc.createdByDetails",
  //         },
  //       },
  //     ];

  //     if (search && search.trim() !== "") {
  //       pipeline.push({
  //         $match: {
  //           $or: [{ companyName: { $regex: search, $options: "i" } }],
  //         },
  //       });
  //     }

  //     pipeline.push(
  //       { $sort: { companyType: -1, createdAt: -1 } },
  //       { $skip: skip },
  //       { $limit: pageSize }
  //     );

  //     const Companies = await Company.aggregate(pipeline);
  //     if (Companies.length > 0) {
  //       const moduleType = "Company";
  //       const customFieldList = await this.getCustomFieldList(
  //         SITE_DB_NAME,
  //         moduleType,
  //         0
  //       );
  //       const enrichedCompanies = Companies.map((company) => {
  //         // Agar customFields nahi hai, toh empty object de do
  //         company.customFields = company.customFields || {};

  //         // Har expected customField check karo
  //         for (const field of customFieldList) {
  //           if (!(field.keyName in company.customFields)) {
  //             company.customFields[field.keyName] = field;
  //           } else {
  //             const {
  //               fieldName,
  //               keyName,
  //               fieldType,
  //               options,
  //               _id,
  //               moduleType,
  //               updatedAt,
  //               createdAt,
  //               activeFlag,
  //               deleteFlag,
  //             } = field;

  //             company.customFields[field.keyName] = {
  //               fieldName,
  //               keyName,
  //               fieldType,
  //               options,
  //               _id,
  //               moduleType,
  //               updatedAt,
  //               createdAt,
  //               activeFlag,
  //               deleteFlag,
  //               value: company.customFields[field.keyName].value,
  //             };
  //           }
  //         }
  //         return company;
  //       });
  //       return enrichedCompanies;
  //     } else {
  //       return "NA";
  //     }
  //   } catch (error) {
  //     console.log("Database error from getCompanies:", error.message);
  //     throw new Error(error.message);
  //   }
  // },

  async getCompany(SITE_DB_NAME, userId) {
    const Company = await CompanyModel(SITE_DB_NAME);
    try {
      const checkCompany = await Company.findOne({
        createdBy: userId,
        companyType: true,
      });

      if (checkCompany) {
        return checkCompany;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("Database error from getCompany:", error.message);
      throw new Error(error.message);
    }
  },
  //====================================== Update-Company-Tanant ===========================
  async updateUserCompany(SITE_DB_NAME, userId, data) {
    const Company = await CompanyModel(SITE_DB_NAME);
    try {
      const CompanyStatus = await Company.updateOne(
        { createdBy: userId },
        { $set: data },
        { upsert: false },
      );
      if (CompanyStatus) {
        return CompanyStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("Database error from updateUserCompany:", error.message);
      throw new Error(error.message);
    }
  },

  //====================================== Tanant-Peopel-Flow ===========================
  async checkEmail(SITE_DB_NAME, email) {
    try {
      const User = await UserModel(SITE_DB_NAME);
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
      console.error("Error in checkEmail:", error);
      throw new Error(error.message);
    }
  },

  async checkCountry(countryId) {
    try {
      const existing = await countryModel.findOne({
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

  async checkUserId(SITE_DB_NAME, userId) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const checkUser = await User.findById(userId);
      if (checkUser) {
        return checkUser;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkUserId:", error);
      throw new Error(error.message);
    }
  },

  async checkPeopleId(SITE_DB_NAME, peopleId) {
    try {
      const User = await UserModel(SITE_DB_NAME);
      const existing = await User.findOne({
        _id: new mongoose.Types.ObjectId(peopleId),
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkPeopleId:", error);
      throw new Error(error.message);
    }
  },

  async createPeople(SITE_DB_NAME, data) {
    const User = await UserModel(SITE_DB_NAME);

    try {
      const createPeopleData = await User.create(data);
      if (createPeopleData) {
        return createPeopleData;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createPeople:", error);
      throw new Error(error.message);
    }
  },

  async checkPeopleLastNumber(SITE_DB_NAME, uniqueId) {
    try {
      const User = await UserModel(SITE_DB_NAME);

      // Escape special regex characters in uniqueId
      const escapedUniqueId = uniqueId.replace(
        /[-\/\\^$*+?.()|[\]{}]/g,
        "\\$&",
      );

      const lastPeople = await User.findOne({
        deleteFlag: 0,
        uniqueId: { $regex: `^${escapedUniqueId}-\\d+$` },
      })
        .sort({ createdAt: -1 })
        .lean();

      if (lastPeople && lastPeople.uniqueId) {
        const lastNumber = parseInt(lastPeople.uniqueId.split("-").pop(), 10);
        const paddedNumber = String(lastNumber + 1).padStart(3, "0");
        return `${uniqueId}-${paddedNumber}`;
      }

      // First entry
      return `${uniqueId}-001`;
    } catch (error) {
      console.error("Error in checkPeopleLastNumber:", error);
      throw new Error(error.message);
    }
  },

  async getPeopleDetails(SITE_DB_NAME, createdUserId) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const createdPeople = await User.findOne({
        _id: createdUserId,
        deleteFlag: 0,
      });

      if (createdPeople) {
        return createdPeople;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getPeopleDetails:", error);
      throw new Error(error.message);
    }
  },

  async getPeople(
    SITE_DB_NAME,
    deleteFlag,
    pagination,
    search,
    byCompany,
    byRoleId,
    byRole,
    byProject,
  ) {
    const User = await UserModel(SITE_DB_NAME);
    const Project = await ProjectModel(SITE_DB_NAME);
    try {
      const { pageSize, pageNumber } = pagination;
      const skip = Math.max(0, pageNumber - 1) * pageSize;

      const matchQuery = { deleteFlag: deleteFlag };

      if (search && String(search).trim() !== "") {
        matchQuery.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      if (byCompany && mongoose.Types.ObjectId.isValid(byCompany)) {
        matchQuery.companyId = new mongoose.Types.ObjectId(byCompany);
      }

      if (byRoleId && mongoose.Types.ObjectId.isValid(byRoleId)) {
        matchQuery.roleId = new mongoose.Types.ObjectId(byRoleId);
      }

      if (byRole && String(byRole).trim() !== "") {
        matchQuery.roleName = byRole;
      }

      //  PROJECT FILTER (Project → peopleIds)
      if (byProject && mongoose.Types.ObjectId.isValid(byProject)) {
        const project = await Project.findOne(
          { _id: new mongoose.Types.ObjectId(byProject), deleteFlag: 0 },
          { peopleIds: 1 },
        );

        if (!project || !project.peopleIds || project.peopleIds.length === 0) {
          return "NA";
        }

        matchQuery._id = { $in: project.peopleIds };
      }
      const pipeline = [
        { $match: matchQuery },

        // lookup designation
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

        // lookup skill
        {
          $lookup: {
            from: "skills",
            localField: "skillId",
            foreignField: "_id",
            as: "skillDetails",
          },
        },
        {
          $unwind: {
            path: "$skillDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // lookup role
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

        // lookup team
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

        // lookup department
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

        // lookup units
        {
          $lookup: {
            from: "units",
            localField: "unitId",
            foreignField: "_id",
            as: "unitDetails",
          },
        },

        // lookup shift
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

        // reporting manager
        {
          $lookup: {
            from: "users",
            localField: "reportingManagerId",
            foreignField: "_id",
            as: "reportingManagerDetails",
          },
        },
        {
          $unwind: {
            path: "$reportingManagerDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // registeredBy user
        {
          $lookup: {
            from: "users",
            localField: "registeredById",
            foreignField: "_id",
            as: "registeredByDetails",
          },
        },
        {
          $unwind: {
            path: "$registeredByDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // approvedBy user
        {
          $lookup: {
            from: "users",
            localField: "approvedById",
            foreignField: "_id",
            as: "approvedByDetails",
          },
        },
        {
          $unwind: {
            path: "$approvedByDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // company
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

        // enrich reference details
        {
          $addFields: {
            designationDetails: {
              $let: {
                vars: { designation: "$designationDetails" },
                in: {
                  $cond: [
                    { $eq: ["$$designation", null] },
                    null,
                    {
                      _id: "$$designation._id",
                      name: "$$designation.name",
                      activeFlag: "$$designation.activeFlag",
                      deleteFlag: "$$designation.deleteFlag",
                    },
                  ],
                },
              },
            },
            skillDetails: {
              $let: {
                vars: { skill: "$skillDetails" },
                in: {
                  $cond: [
                    { $eq: ["$$skill", null] },
                    null,
                    {
                      _id: "$$skill._id",
                      skillName: {
                        $ifNull: ["$$skill.skillName", "$$skill.name"],
                      },
                      activeFlag: "$$skill.activeFlag",
                      deleteFlag: "$$skill.deleteFlag",
                    },
                  ],
                },
              },
            },
            roleDetails: {
              $let: {
                vars: { role: "$roleDetails" },
                in: {
                  $cond: [
                    { $eq: ["$$role", null] },
                    null,
                    {
                      _id: "$$role._id",
                      roleName: "$$role.roleName",
                      activeFlag: "$$role.activeFlag",
                      deleteFlag: "$$role.deleteFlag",
                    },
                  ],
                },
              },
            },
            teamDetails: {
              $let: {
                vars: { team: "$teamDetails" },
                in: {
                  $cond: [
                    { $eq: ["$$team", null] },
                    null,
                    {
                      _id: "$$team._id",
                      teamName: "$$team.teamName",
                      teamLogo: "$$team.teamLogo",
                      handleBy: "$$team.handleBy",
                      description: "$$team.description",
                    },
                  ],
                },
              },
            },
            departmentDetails: {
              $let: {
                vars: { department: "$departmentDetails" },
                in: {
                  $cond: [
                    { $eq: ["$$department", null] },
                    null,
                    {
                      _id: "$$department._id",
                      departmentName: "$$department.departmentName",
                      activeFlag: "$$department.activeFlag",
                      deleteFlag: "$$department.deleteFlag",
                    },
                  ],
                },
              },
            },
            unitDetails: {
              $map: {
                input: { $ifNull: ["$unitDetails", []] },
                as: "unit",
                in: {
                  _id: "$$unit._id",
                  unitName: "$$unit.unitName",
                  unitEmail: "$$unit.unitEmail",
                  unitURL: "$$unit.unitURL",
                  unitAddress: "$$unit.unitAddress",
                  activeFlag: "$$unit.activeFlag",
                  deleteFlag: "$$unit.deleteFlag",
                },
              },
            },
            shiftDetails: {
              $let: {
                vars: { shift: "$shiftDetails" },
                in: {
                  $cond: [
                    { $eq: ["$$shift", null] },
                    null,
                    {
                      _id: "$$shift._id",
                      shiftName: "$$shift.shiftName",
                      startTime: "$$shift.startTime",
                      endTime: "$$shift.endTime",
                      weekWorkingDays: "$$shift.weekWorkingDays",
                      totalWorkingDurationInDay:
                        "$$shift.totalWorkingDurationInDay",
                      breakDuration: "$$shift.breakDuration",
                    },
                  ],
                },
              },
            },
            companyDetails: {
              $let: {
                vars: { company: "$companyDetails" },
                in: {
                  $cond: [
                    { $eq: ["$$company", null] },
                    null,
                    {
                      _id: "$$company._id",
                      companyName: "$$company.companyName",
                      companyEmail: "$$company.companyEmail",
                      companyPhone: "$$company.companyPhone",
                    },
                  ],
                },
              },
            },
            reportingManagerDetails: {
              $let: {
                vars: { manager: "$reportingManagerDetails" },
                in: {
                  $cond: [
                    { $eq: ["$$manager", null] },
                    null,
                    {
                      _id: "$$manager._id",
                      name: "$$manager.name",
                      email: "$$manager.email",
                      roleName: "$$manager.roleName",
                      image: "$$manager.image",
                    },
                  ],
                },
              },
            },
            registeredByDetails: {
              $let: {
                vars: { user: "$registeredByDetails" },
                in: {
                  $cond: [
                    { $eq: ["$$user", null] },
                    null,
                    {
                      _id: "$$user._id",
                      name: "$$user.name",
                      email: "$$user.email",
                      roleName: "$$user.roleName",
                      image: "$$user.image",
                    },
                  ],
                },
              },
            },
            approvedByDetails: {
              $let: {
                vars: { user: "$approvedByDetails" },
                in: {
                  $cond: [
                    { $eq: ["$$user", null] },
                    null,
                    {
                      _id: "$$user._id",
                      name: "$$user.name",
                      email: "$$user.email",
                      roleName: "$$user.roleName",
                      image: "$$user.image",
                    },
                  ],
                },
              },
            },
            designationName: "$designationDetails.name",
            skillName: {
              $ifNull: ["$skillDetails.skillName", "$skillDetails.name"],
            },
            companyName: "$companyDetails.companyName",
            registeredBy: {
              $let: {
                vars: { user: "$registeredByDetails" },
                in: {
                  $cond: [
                    { $eq: ["$$user", null] },
                    null,
                    {
                      _id: "$$user._id",
                      name: "$$user.name",
                      image: "$$user.image",
                      email: "$$user.email",
                    },
                  ],
                },
              },
            },
            approvedBy: {
              $let: {
                vars: { user: "$approvedByDetails" },
                in: {
                  $cond: [
                    { $eq: ["$$user", null] },
                    null,
                    {
                      _id: "$$user._id",
                      name: "$$user.name",
                      image: "$$user.image",
                      email: "$$user.email",
                    },
                  ],
                },
              },
            },
          },
        },

        {
          $addFields: {
            rolePriority: {
              $cond: [{ $eq: ["$roleName", "Site-Owner"] }, 1, 0],
            },
          },
        },

        // format documents' start/end to YYYY-MM-DD and ensure documentFile present
        {
          $addFields: {
            documents: {
              $cond: [
                { $isArray: "$documents" },
                {
                  $map: {
                    input: "$documents",
                    as: "d",
                    in: {
                      _id: "$$d._id",
                      documentName: { $ifNull: ["$$d.documentName", null] },
                      documentFile: { $ifNull: ["$$d.documentFile", []] },
                      organizationName: {
                        $ifNull: ["$$d.organizationName", null],
                      },
                      start: {
                        $cond: [
                          { $ifNull: ["$$d.start", false] },
                          {
                            $dateToString: {
                              date: "$$d.start",
                              format: "%Y-%m-%d",
                            },
                          },
                          null,
                        ],
                      },
                      end: {
                        $cond: [
                          { $ifNull: ["$$d.end", false] },
                          {
                            $dateToString: {
                              date: "$$d.end",
                              format: "%Y-%m-%d",
                            },
                          },
                          null,
                        ],
                      },
                      document: { $ifNull: ["$$d.document", null] },
                    },
                  },
                },
                [],
              ],
            },
          },
        },
        {
          $addFields: {
            rolePriority: {
              $cond: [{ $eq: ["$roleName", "Site-Owner"] }, 1, 0],
            },
          },
        },

        // remove the intermediate lookup fields (optional, keeps response clean)
        {
          $project: {
            rolePriority: 1,
            designationDetails: 1,
            designationName: 1,
            skillDetails: 1,
            skillName: 1,
            roleDetails: 1,
            teamDetails: 1,
            departmentDetails: 1,
            unitDetails: 1,
            shiftDetails: 1,
            reportingManagerDetails: 1,
            registeredByDetails: 1,
            approvedByDetails: 1,
            companyDetails: 1,
            companyName: 1,
            documents: 1,
            documentStatus: 1,
            // bring core user fields explicitly (so nothing important is accidentally removed)
            _id: 1,
            name: 1,
            firstName: 1,
            lastName: 1,
            uniqueId: 1,
            empId: 1,
            email: 1,
            mobileNumber: 1,
            roleId: 1,
            roleName: 1,
            teamId: 1,
            departmentId: 1,
            designationId: 1,
            companyId: 1,
            workspaceId: 1,
            image: 1,
            activeFlag: 1,
            approveFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            privateNotes: 1,
            publicProfile: 1,
            bankName: 1,
            bankAccountNumber: 1,
            IFSCCode: 1,
            accountHolderName: 1,
            bankStatus: 1,
            skillId: 1,
            personalEmail: 1,
            phoneCode: 1,
            dob: 1,
            gender: 1,
            fatherName: 1,
            originalDob: 1,
            joiningDate: 1,
            motherName: 1,
            spouseName: 1,
            maritalStatus: 1,
            bloodGroup: 1,
            religion: 1,
            physicallyChallenged: 1,
            addressProof: 1,
            landMark: 1,
            address: 1,
            city: 1,
            state: 1,
            countryName: 1,
            countryId: 1,
            countryCode: 1,
            pincode: 1,
            pLandMark: 1,
            pAddress: 1,
            pCity: 1,
            pState: 1,
            pCountry: 1,
            pPincode: 1,
            relievingDate: 1,
            relievingStatus: 1,
            jobTitle: 1,
            officialNumber: 1,
            emergencyContactNumber: 1,
            // HRMS / Payroll
            salary: 1,
            yearCTC: 1,
            CTCStatus: 1,
            pfEligibleStatus: 1,
            UAN: 1,
            pfNumber: 1,
            eSICNumber: 1,
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
            aadharNumber: 1,
            aadharImage: 1,
            PANNumber: 1,
            PANImage: 1,
            deleteReason: 1,
            manualPunch: 1,
            showBirthAny: 1,
            profileComplete: 1,
            playerId: 1,
            languageId: 1,
            timeFormat: 1,
            dateFormat: 1,
            timeZone: 1,
            calendarStart: 1,
            workingHours: 1,
            social: 1,
            billableRate: 1,
            billableCost: 1,
            mobileNumber: 1,
            reportingManagerId: 1,
            unitId: 1,
            shiftId: 1,
            officePhone: 1,
          },
        },

        // sort & pagination
        { $sort: { rolePriority: -1, createdAt: -1 } },

        // { $skip: skip },
        // { $limit: pageSize },
      ];
      if (pagination.pageSize) {
        pipeline.push({ $skip: skip }, { $limit: pageSize });
      }

      const people = await User.aggregate(pipeline);

      // filter out site-owner
      // const filteredPeople = people.filter(
      //   (item) => item.roleName !== "Site-Owner"
      // );

      return people.length > 0 ? people : "NA";
    } catch (error) {
      console.error("Error in getPeople:", error);
      throw new Error(error?.message || "getPeople failed");
    }
  },

  // async getPeople(SITE_DB_NAME, deleteFlag, pagination, search) {
  //   const User = await UserModel(SITE_DB_NAME);
  //   try {
  //     let query = { deleteFlag: deleteFlag };
  //     const { pageSize, pageNumber } = pagination;
  //     const skip = (pageNumber - 1) * pageSize;

  //     if (search && search.trim() !== "") {
  //       query.$or = [
  //         { name: { $regex: search, $options: "i" } },
  //         { email: { $regex: search, $options: "i" } },
  //       ];
  //     }

  //     const checkPeople = await User.find(query)
  //       .skip(skip)
  //       .limit(pageSize)
  //       .sort({
  //         createdAt: -1,
  //       });
  //     const filteredPeople = checkPeople.filter(
  //       (item) => item.roleName !== "Site-Owner"
  //     );
  //     if (filteredPeople.length > 0) {
  //       return filteredPeople;
  //     } else {
  //       return "NA";
  //     }
  //   } catch (error) {
  //     console.error("Error in getPeople:", error);
  //     throw new Error(error.message);
  //   }
  // },

  async checkUpdateEmail(SITE_DB_NAME, targetUserId, email) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const existing = await User.findOne({
        _id: { $ne: new mongoose.Types.ObjectId(targetUserId) },
        email,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkUpdateEmail:", error);
      throw new Error(error.message);
    }
  },

  // ✅ Service Layer
  async checkMultiPeopleId(SITE_DB_NAME, peopleId) {
    try {
      const User = await UserModel(SITE_DB_NAME);

      // Convert all to ObjectId
      const objectIds = peopleId.map((id) => new mongoose.Types.ObjectId(id));

      // Find users whose _id is in the list
      const existingUsers = await User.find({
        deleteFlag: 0,
        _id: { $in: objectIds },
      }).select("_id");

      // Check how many valid users were found
      const foundIds = existingUsers.map((user) => user._id.toString());

      // Find invalid IDs (not present in DB)
      const invalidIds = peopleId.filter((id) => !foundIds.includes(id));

      if (invalidIds.length > 0) {
        return invalidIds; // return the invalid ones
      } else {
        return "NA"; // all IDs are valid
      }
    } catch (error) {
      console.error("Error in checkMultiPeopleId:", error);
      throw new Error(error.message);
    }
  },

  async updateMultiPeople(SITE_DB_NAME, peopleIds, designationId) {
    const User = await UserModel(SITE_DB_NAME);
    const objectIds = peopleIds.map((id) => new mongoose.Types.ObjectId(id));
    try {
      const updateStatus = await User.updateMany(
        { _id: { $in: objectIds } },
        { $set: { designationId } },
      );
      if (updateStatus.modifiedCount > 0) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateMultiPeople:", error);
      throw new Error(error.message);
    }
  },

  async updateMultiPeopleAndRemove(SITE_DB_NAME, peopleIds, id) {
    const User = await UserModel(SITE_DB_NAME);

    const objectIds = peopleIds.map((id) => new mongoose.Types.ObjectId(id));
    try {
      let query = {};
      if (objectIds.length > 0) {
        let updatedAssigned = await User.updateMany(
          { _id: { $in: objectIds } },
          {
            $set: { designationId: id },
          },
        );
      }
      // Step 1: Assign role to selected users
      // Step 2: Remove role from users not in the new list
      const removeQuery = {
        designationId: id,
        ...(objectIds.length > 0 && { _id: { $nin: objectIds } }), // not in the list
      };

      const updatedRemoved = await User.updateMany(removeQuery, {
        $set: { designationId: null },
      });

      return updatedRemoved;
    } catch (error) {
      console.error("Error in updateMultiPeopleAndRemove:", error);
      throw new Error(error.message);
    }
  },

  async deletePeople(SITE_DB_NAME, peopleId) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const updateStatus = await User.updateOne(
        { _id: peopleId },
        { $set: { deleteFlag: 1 } },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("Database error from deletePeople:", error.message);
      throw new Error(error.message);
    }
  },

  async activeDeactivePeople(SITE_DB_NAME, peopleId, activeStatus) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const newStatus = activeStatus === 1 ? 0 : 1;
      const updateStatus = await User.updateOne(
        { _id: peopleId },
        { $set: { activeFlag: newStatus } },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("Database error from activeDeactivePeople:", error.message);
      throw new Error(error.message);
    }
  },

  async getMultiPeopleDesignation(SITE_DB_NAME, designationId) {
    const Designation = await DesignationModel(SITE_DB_NAME);
    try {
      const roleDetails = await Designation.aggregate([
        {
          $match: {
            deleteFlag: 0,
            _id: new mongoose.Types.ObjectId(designationId), // ensure ObjectId
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id", // designation._id
            foreignField: "designationId", // user.designationId
            as: "assignedUsers",
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            workspaceId: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            assignedUsers: {
              $map: {
                input: "$assignedUsers",
                as: "user",
                in: {
                  _id: "$$user._id",
                  name: "$$user.name",
                  image: "$$user.image",
                },
              },
            },
          },
        },
      ]);

      if (roleDetails.length > 0) {
        return roleDetails[0]; // return full document with users
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getMultiPeopleDesignation:", error);
      throw new Error(error.message);
    }
  },

  async getMultiPeopleDesignations(
    SITE_DB_NAME,
    deleteFlag,
    pagination,
    search,
  ) {
    const Designation = await DesignationModel(SITE_DB_NAME);
    try {
      const { pageSize, pageNumber } = pagination;
      const skip = (pageNumber - 1) * pageSize;

      const pipeline = [
        {
          $match: {
            deleteFlag: deleteFlag,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id", // designation._id
            foreignField: "designationId", // user.designationId
            as: "assignedUsers",
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            workspaceId: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            assignedUsers: {
              $map: {
                input: "$assignedUsers",
                as: "user",
                in: {
                  _id: "$$user._id",
                  name: "$$user.name",
                  image: "$$user.image",
                },
              },
            },
          },
        },
      ];

      if (search && search.trim() !== "") {
        pipeline.push({
          $match: {
            $or: [
              { name: { $regex: search, $options: "i" } },
              {
                "assignedUsers.name": {
                  $regex: search,
                  $options: "i",
                },
              },
            ],
          },
        });
      }

      pipeline.push(
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
      );

      const roleDetails = await Designation.aggregate(pipeline);

      if (roleDetails.length > 0) {
        return roleDetails; // ✅ Return full list
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getMultiPeopleDesignations:", error);
      throw new Error(error.message);
    }
  },
  async updatePeople(SITE_DB_NAME, userId, data) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const updateStatus = await User.updateOne(
        { _id: userId },
        { $set: data },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updatePeople:", error);
      throw new Error(error.message);
    }
  },

  async checkSkill(SITE_DB_NAME, skillName) {
    try {
      const Skill = await SkillModel(SITE_DB_NAME);
      const existing = await Skill.findOne({
        skillName,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkSkill:", error);
      throw new Error(error.message);
    }
  },

  async createSkill(SITE_DB_NAME, data) {
    const Skill = await SkillModel(SITE_DB_NAME);

    try {
      const createSkillData = await Skill.create(data);
      if (createSkillData) {
        return createSkillData;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createSkill:", error);
      throw new Error(error.message);
    }
  },

  async updateMultiPeopleAndRemoveInSkills(SITE_DB_NAME, peopleIds, id) {
    const User = await UserModel(SITE_DB_NAME);

    const objectIds = peopleIds.map((id) => new mongoose.Types.ObjectId(id));
    const skillId = new mongoose.Types.ObjectId(id);
    try {
      let query = {};
      if (objectIds.length > 0) {
        let updatedAssigned = await User.updateMany(
          { _id: { $in: objectIds } },
          {
            $set: { skillId },
          },
        );
      }
      // Step 1: Assign role to selected users
      // Step 2: Remove role from users not in the new list
      const removeQuery = {
        skillId: skillId,
        ...(objectIds.length > 0 && { _id: { $nin: objectIds } }), // not in the list
      };

      const updatedRemoved = await User.updateMany(removeQuery, {
        $set: { skillId: null },
      });

      return updatedRemoved;
    } catch (error) {
      console.error("Error in updateMultiPeopleAndRemoveInSkills:", error);
      throw new Error(error.message);
    }
  },

  // async getSkillDetails(SITE_DB_NAME, createdSkillId) {
  //   const Skill = await SkillModel(SITE_DB_NAME);
  //   try {
  //     const createdSkill = await Skill.findOne({
  //       _id: createdSkillId,
  //       deleteFlag: 0,
  //     });

  //     if (createdSkill) {
  //       return createdSkill;
  //     } else {
  //       return "NA";
  //     }
  //   } catch (error) {
  //     console.error("Error in getSkillDetails:", error);
  //     throw new Error(error.message);
  //   }
  // },

  async getSkillDetails(SITE_DB_NAME, createdSkillId) {
    const Skill = await SkillModel(SITE_DB_NAME);
    try {
      const roleDetails = await Skill.aggregate([
        {
          $match: {
            deleteFlag: 0,
            _id: new mongoose.Types.ObjectId(createdSkillId), // ensure ObjectId
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "skillId",
            as: "assignedUsers",
          },
        },
        {
          $project: {
            _id: 1,
            skillName: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            assignedUsers: {
              $map: {
                input: "$assignedUsers",
                as: "user",
                in: {
                  _id: "$$user._id",
                  name: "$$user.name",
                  image: "$$user.image",
                },
              },
            },
          },
        },
      ]);

      if (roleDetails.length > 0) {
        return roleDetails[0]; // return full document with users
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getSkillDetails:", error);
      throw new Error(error.message);
    }
  },

  async getSkills(SITE_DB_NAME, deleteFlag, pagination, search) {
    const Skill = await SkillModel(SITE_DB_NAME);
    try {
      const { pageSize, pageNumber } = pagination;
      const skip = (pageNumber - 1) * pageSize;

      const pipeline = [
        {
          $match: { deleteFlag: deleteFlag },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id", // designation._id
            foreignField: "skillId", // user.designationId
            as: "assignedUsers",
          },
        },
        {
          $project: {
            _id: 1,
            skillName: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            assignedUsers: {
              $map: {
                input: "$assignedUsers",
                as: "user",
                in: {
                  _id: "$$user._id",
                  name: "$$user.name",
                  image: "$$user.image",
                },
              },
            },
          },
        },
      ];

      // Agar search diya hai to $match add karo
      if (search && search.trim() !== "") {
        pipeline.push({
          $match: {
            $or: [
              { skillName: { $regex: search, $options: "i" } },
              { "assignedUsers.name": { $regex: search, $options: "i" } },
            ],
          },
        });
      }

      pipeline.push(
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
      );

      const skillDetails = await Skill.aggregate(pipeline);

      if (skillDetails.length > 0) {
        return skillDetails;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getSkills:", error);
      throw new Error(error.message);
    }
  },

  async findSkillIdToUserIds(SITE_DB_NAME, skillId) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const users = await User.find({ skillId: skillId, deleteFlag: 0 })
        .select("_id")
        .lean();
      if (!users || users.length === 0) {
        return [];
      }
      return users.map((u) => u._id);
    } catch (error) {
      console.log("Database error in findSkillIdToUserIds:", error.message);
      throw new Error(error.message);
    }
  },

  async deleteUserSkill(SITE_DB_NAME, skillId) {
    const Skill = await SkillModel(SITE_DB_NAME);
    const User = await UserModel(SITE_DB_NAME);

    try {
      const deleteStatus = await Skill.deleteOne({
        _id: skillId,
      });
      const updateUsers = await User.updateMany(
        { skillId: skillId },
        { $set: { skillId: null } },
      );

      return {
        deleted: deleteStatus.deletedCount,
        updatedUsers: updateUsers.modifiedCount,
      };
    } catch (error) {
      console.log(
        "Database error from admin service deleteUserSkill:",
        error.message,
      );
      throw new Error(error.message);
    }
  },

  async getRoles(SITE_DB_NAME, deleteFlag) {
    const Roles = await RoleModel(SITE_DB_NAME);
    try {
      const checkRoles = await Roles.find({
        deleteFlag: deleteFlag,
      }).sort({
        createdAt: -1,
      });
      if (checkRoles) {
        return checkRoles;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getRoles:", error);
      throw new Error(error.message);
    }
  },

  async checkSkillId(SITE_DB_NAME, skillId) {
    const Skill = await SkillModel(SITE_DB_NAME);
    try {
      const existing = await Skill.findOne({
        deleteFlag: 0,
        _id: new mongoose.Types.ObjectId(skillId),
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkSkillId:", error);
      throw new Error(error.message);
    }
  },

  async checkSkillName(SITE_DB_NAME, skillId, skillName) {
    const Skill = await SkillModel(SITE_DB_NAME);
    try {
      const existing = await Skill.findOne({
        _id: new mongoose.Types.ObjectId(skillId), // exclude current id
        skillName: skillName,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkSkillName:", error);
      throw new Error(error.message);
    }
  },

  async checkUpdateSkillName(SITE_DB_NAME, skillId, skillName) {
    const Skill = await SkillModel(SITE_DB_NAME);
    try {
      const existing = await Skill.findOne({
        _id: { $ne: skillId },
        skillName: skillName,
        deleteFlag: 0,
      }); // 20 seconds timeout
      if (existing) {
        return existing._id;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("checkUpdateSkillName find db error", error.message);
      throw new Error(error.message);
    }
  },

  async checkUpdateSkill(SITE_DB_NAME, skillName, targetUserId) {
    try {
      const Skill = await SkillModel(SITE_DB_NAME);
      // Check if same name exists in other documents (excluding the current one)
      const existing = await Skill.findOne({
        _id: new mongoose.Types.ObjectId(targetUserId), // exclude current id
        name: skillName,
        deleteFlag: 0,
      });

      if (existing) {
        // Duplicate name found in another workflow
        return "DUPLICATE_NAME";
      }

      // Check if the workflow with this ID exists (used for final verification)
      const SkillExists = await Skill.findOne({
        _id: new mongoose.Types.ObjectId(targetUserId),
        deleteFlag: 0,
      });

      if (!SkillExists) {
        return "INVALID_ID";
      }

      // All good
      return "OK";
    } catch (error) {
      console.error("Error in checkUpdatedDesignation:", error);
      throw new Error(error.message);
    }
  },

  async updateSkill(SITE_DB_NAME, userId, data) {
    const Skill = await SkillModel(SITE_DB_NAME);
    try {
      const updateStatus = await Skill.updateOne(
        { _id: userId },
        { $set: data },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateSkill:", error);
      throw new Error(error.message);
    }
  },

  async checkUserSkill(SITE_DB_NAME, userId, skillId) {
    try {
      const UserSkill = await UserSkillsModel(SITE_DB_NAME);
      const existing = await UserSkill.findOne({
        userId,
        skillId,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkUserSkill:", error);
      throw new Error(error.message);
    }
  },

  async createUserSkill(SITE_DB_NAME, data) {
    const UserSkill = await UserSkillsModel(SITE_DB_NAME);

    try {
      const createSkillData = await UserSkill.create(data);
      if (createSkillData) {
        return createSkillData;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createUserSkill:", error);
      throw new Error(error.message);
    }
  },

  async getUserSkillDetails(SITE_DB_NAME, createdSkillId) {
    const UserSkill = await UserSkillsModel(SITE_DB_NAME);
    try {
      const createdSkill = await UserSkill.findOne({
        _id: createdSkillId,
        deleteFlag: 0,
      });

      if (createdSkill) {
        return createdSkill;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getUserSkillDetails:", error);
      throw new Error(error.message);
    }
  },

  async getUsersGroupedBySkills(SITE_DB_NAME, deleteFlag) {
    const UserSkills = await UserSkillsModel(SITE_DB_NAME);
    try {
      const result = await UserSkills.aggregate([
        {
          $match: {
            deleteFlag: deleteFlag,
            activeFlag: 1,
          },
        },
        {
          $lookup: {
            from: "users", // collection name for User
            localField: "userId",
            foreignField: "_id",
            as: "userData",
          },
        },
        {
          $unwind: "$userData",
        },
        {
          $lookup: {
            from: "skills", // collection name for Skill
            localField: "skillId",
            foreignField: "_id",
            as: "skillData",
          },
        },
        {
          $unwind: "$skillData",
        },
        {
          $group: {
            _id: "$skillId",
            skillName: { $first: "$skillData.skillName" },
            users: {
              $push: {
                _id: "$userData._id",
                name: "$userData.name",
                image: "$userData.image",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            skillId: "$_id",
            skillName: 1,
            users: 1,
          },
        },
      ]);
      if (result && result.length > 0) {
        return result;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from commen service getUsersGroupedBySkills details",
        error.message,
      );
      throw new Error(error.message);
    }
  },

  async checkUpdateUserSkill(SITE_DB_NAME, targetSkillId, userId, skillId) {
    try {
      const UserSkills = await UserSkillsModel(SITE_DB_NAME);
      const existing = await UserSkills.findOne({
        userId,
        skillId,
        deleteFlag: 0,
        _id: new mongoose.Types.ObjectId(targetSkillId),
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkUpdateUserSkill:", error);
      throw new Error(error.message);
    }
  },

  async updateUserSkill(SITE_DB_NAME, userId, data) {
    const UserSkills = await UserSkillsModel(SITE_DB_NAME);
    try {
      const updateStatus = await UserSkills.updateOne(
        { _id: userId },
        { $set: data },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateUserSkill:", error);
      throw new Error(error.message);
    }
  },

  async checkTeam(SITE_DB_NAME, teamId) {
    try {
      const Team = await TeamModel(SITE_DB_NAME);
      const existing = await Team.findOne({
        _id: teamId,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkTeam:", error);
      throw new Error(error.message);
    }
  },

  async checkTeamName(SITE_DB_NAME, teamName) {
    try {
      const Team = await TeamModel(SITE_DB_NAME);
      const existing = await Team.findOne({
        teamName,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      checkTeamName;
      console.error("Error in checkTeamName:", error);
      throw new Error(error.message);
    }
  },

  async createTeam(SITE_DB_NAME, data) {
    const Team = await TeamModel(SITE_DB_NAME);
    try {
      const createTeamData = await Team.create(data);
      if (createTeamData) {
        return createTeamData;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createTeam:", error);
      throw new Error(error.message);
    }
  },

  async checkTeamNameWithId(SITE_DB_NAME, targetTeamId, teamName) {
    const Team = await TeamModel(SITE_DB_NAME);
    try {
      const existing = await Team.findOne({
        _id: { $ne: targetTeamId },
        teamName: teamName,
        deleteFlag: 0,
      }); // 20 seconds timeout
      if (existing) {
        return existing._id;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("checkTeamNameWithId find db error", error.message);
      throw new Error(error.message);
    }
  },

  async getTeamDetails(SITE_DB_NAME, createdTeamId) {
    const Team = await TeamModel(SITE_DB_NAME);
    try {
      const createdTeam = await Team.findOne({
        _id: createdTeamId,
        deleteFlag: 0,
      });

      if (createdTeam) {
        return createdTeam;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getTeamDetails:", error);
      throw new Error(error.message);
    }
  },

  async checkUserTeam(SITE_DB_NAME, userTeamData) {
    try {
      const UserTeam = await UserTeamModel(SITE_DB_NAME);
      const existing = await UserTeam.findOne({
        userId: userTeamData.userId,
        teamId: userTeamData.teamId,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkUserSkill:", error);
      throw new Error(error.message);
    }
  },

  async createUserTeam(SITE_DB_NAME, data) {
    const UserTeam = await UserTeamModel(SITE_DB_NAME);
    try {
      const createTeamData = await UserTeam.create(data);
      if (createTeamData) {
        return createTeamData;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createUserTeam:", error);
      throw new Error(error.message);
    }
  },

  async getUserTeamDetails(SITE_DB_NAME, createdTeamId) {
    const UserTeam = await UserTeamModel(SITE_DB_NAME);
    try {
      const createdUserTeam = await UserTeam.find({
        teamId: createdTeamId,
        deleteFlag: 0,
      });

      if (createdUserTeam) {
        return createdUserTeam;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getUserTeamDetails:", error);
      throw new Error(error.message);
    }
  },

  async getUsersGroupedByTeams(
    SITE_DB_NAME,
    deleteFlag,
    pagination,
    search,
    byUser,
  ) {
    const UserTeam = await UserTeamModel(SITE_DB_NAME);
    try {
      const { pageSize, pageNumber } = pagination;
      const skip = (pageNumber - 1) * pageSize;

      const matchConditions = { deleteFlag: deleteFlag, activeFlag: 1 };

      if (byUser) {
        matchConditions.userId = new mongoose.Types.ObjectId(byUser);
      }

      const pipeline = [
        {
          $match: matchConditions,
        },
        {
          $lookup: {
            from: "users", // collection name for User
            localField: "userId",
            foreignField: "_id",
            as: "userData",
          },
        },
        {
          $unwind: "$userData",
        },
        {
          $lookup: {
            from: "teams", // collection name for Skill
            localField: "teamId",
            foreignField: "_id",
            as: "teamData",
          },
        },
        {
          $unwind: "$teamData",
        },
        {
          $lookup: {
            from: "companies",
            localField: "teamData.companyId",
            foreignField: "_id",
            as: "companyData",
          },
        },
        {
          $unwind: {
            path: "$companyData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$teamId",
            teamName: { $first: "$teamData.teamName" },
            teamLogo: { $first: "$teamData.teamLogo" },
            handleBy: { $first: "$teamData.handleBy" },
            description: { $first: "$teamData.description" },
            company: { $first: "$companyData.companyName" },
            companyId: { $first: "$companyData._id" },
            users: {
              $push: {
                _id: "$userData._id",
                name: "$userData.name",
                image: "$userData.image",
                roleName: "$userData.roleName",
                companyName: "$userData.companyName",
              },
            },

            activeFlag: { $first: "$teamData.activeFlag" },
            deleteFlag: { $first: "$teamData.deleteFlag" },
            createdAt: { $first: "$teamData.createdAt" },
            updatedAt: { $first: "$teamData.updatedAt" },
          },
        },
        {
          $project: {
            _id: 1,
            teamId: "$_id",
            teamName: 1,
            teamLogo: 1,
            description: 1,
            company: 1,
            companyId: 1,
            handleBy: 1,
            users: 1,
            deleteFlag: 1,
            activeFlag: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ];

      if (search && search.trim() !== "") {
        pipeline.push({
          $match: {
            $or: [
              { teamName: { $regex: search, $options: "i" } },
              { company: { $regex: search, $options: "i" } },
              { "users.name": { $regex: search, $options: "i" } },
            ],
          },
        });
      }

      pipeline.push(
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
      );

      const result = await UserTeam.aggregate(pipeline);
      if (result && result.length > 0) {
        return result;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from commen service getUsersGroupedByTeams details",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async getUsersGroupedByTeamsSingle(SITE_DB_NAME, teamId) {
    const Team = await TeamModel(SITE_DB_NAME);
    try {
      const result = await Team.aggregate([
        {
          $match: {
            _id: teamId,
            deleteFlag: 0,
            activeFlag: 1,
          },
        },
        // Lookup handleBy (user name)
        {
          $lookup: {
            from: "users",
            localField: "handleBy",
            foreignField: "_id",
            as: "handleByUser",
          },
        },
        {
          $unwind: {
            path: "$handleByUser",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Lookup company
        {
          $lookup: {
            from: "companies",
            localField: "companyId",
            foreignField: "_id",
            as: "companyData",
          },
        },
        {
          $unwind: {
            path: "$companyData",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Lookup UserTeams for this team
        {
          $lookup: {
            from: "userteams",
            localField: "_id",
            foreignField: "teamId",
            as: "userTeams",
          },
        },
        {
          $unwind: {
            path: "$userTeams",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Lookup user for each UserTeam.userId
        {
          $lookup: {
            from: "users",
            localField: "userTeams.userId",
            foreignField: "_id",
            as: "userData",
          },
        },
        {
          $unwind: {
            path: "$userData",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Group team + users
        {
          $group: {
            _id: "$_id",
            teamName: { $first: "$teamName" },
            teamLogo: { $first: "$teamLogo" },
            description: { $first: "$description" },
            company: { $first: "$companyData.companyName" },
            handleBy: { $first: "$handleByUser.name" },
            users: {
              $push: {
                _id: "$userData._id",
                name: "$userData.name",
                image: "$userData.image",
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            teamId: "$_id",
            teamName: 1,
            teamLogo: 1,
            description: 1,
            company: 1,
            handleBy: 1,
            users: {
              $filter: {
                input: "$users",
                as: "user",
                cond: { $ifNull: ["$$user._id", false] },
              },
            },
          },
        },
      ]);

      return result?.[0] || "NA";
    } catch (error) {
      console.log(
        "Database error from getUsersGroupedByTeamsSingle:",
        error.message,
      );
      throw new Error(error.message);
    }
  },
  async updateTeam(SITE_DB_NAME, targetTeamId, data) {
    try {
      const Team = await TeamModel(SITE_DB_NAME);
      const updateStatus = await Team.updateOne(
        { _id: targetTeamId },
        { $set: data },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("Database error from updateTeam:", error.message);
      throw new Error(error.message);
    }
  },

  async checkTeamId(SITE_DB_NAME, teamId) {
    try {
      const Team = await TeamModel(SITE_DB_NAME);
      const existing = await Team.findOne({
        deleteFlag: 0,
        _id: new mongoose.Types.ObjectId(teamId),
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkTeamId:", error);
      throw new Error(error.message);
    }
  },

  async deleteUserTeamID(SITE_DB_NAME, teamId) {
    const Team = await TeamModel(SITE_DB_NAME);
    try {
      const deleteResult = await Team.deleteOne({
        _id: teamId,
      });
      if (deleteResult) {
        return true;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in deleteUserTeam:", error);
      throw new Error(error.message);
    }
  },

  async findTeamIdToUserIds(SITE_DB_NAME, teamId) {
    const UserTeam = await UserTeamModel(SITE_DB_NAME);
    try {
      const users = await UserTeam.find({ teamId: teamId, deleteFlag: 0 })
        .select("userId")
        .lean();
      if (!users || users.length === 0) {
        return [];
      }
      return users.map((u) => u.userId);
    } catch (error) {
      console.log("Database error in findTeamIdToUserIds:", error.message);
      throw new Error(error.message);
    }
  },

  async deleteUserTeam(SITE_DB_NAME, data) {
    try {
      const UserTeam = await UserTeamModel(SITE_DB_NAME);

      const deleteUserTeam = await UserTeam.deleteMany(data);
      if (deleteUserTeam) {
        return deleteUserTeam;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("Database error from deleteUserTeam:", error.message);
      throw new Error(error.message);
    }
  },

  async checkDesignation(SITE_DB_NAME, name) {
    const roleDesination = await DesignationModel(SITE_DB_NAME);
    try {
      const checkDesignation = await roleDesination.findOne({
        name,
        deleteFlag: 0,
      });

      if (checkDesignation) {
        return checkDesignation;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("Database error from checkDesignation:", error.message);
      throw new Error(error.message);
    }
  },

  async createDesignation(SITE_DB_NAME, data) {
    const roleDesination = await DesignationModel(SITE_DB_NAME);
    try {
      const createRoleDesinationData = await roleDesination.create(data);
      if (createRoleDesinationData) {
        return createRoleDesinationData;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createDesignation:", error);
      throw new Error(error.message);
    }
  },
  async getDesignation(SITE_DB_NAME, deleteFlag, pagination, search) {
    const roleDesination = await DesignationModel(SITE_DB_NAME);
    try {
      const { pageSize, pageNumber } = pagination;
      const skip = (pageNumber - 1) * pageSize;

      // Build query
      const query = {
        deleteFlag: deleteFlag,
      };

      if (search && search.trim() !== "") {
        query.name = { $regex: search.trim(), $options: "i" };
      }

      const roleDesinations = await roleDesination
        .find(query, "_id name")
        .skip(skip)
        .limit(pageSize)
        .sort({ createdAt: -1 });
      if (roleDesinations) {
        return roleDesinations;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getRoleDesinationService:", error);
      throw new Error(error.message);
    }
  },
  async getDesignationById(SITE_DB_NAME, designationId) {
    const roleDesination = await DesignationModel(SITE_DB_NAME);
    try {
      const roleDesinations = await roleDesination.findOne({
        deleteFlag: 0,
        _id: designationId,
      });
      if (roleDesinations) {
        return roleDesinations;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getDesignationById:", error);
      throw new Error(error.message);
    }
  },

  async checkDesignationId(SITE_DB_NAME, designationId) {
    const roleDesination = await DesignationModel(SITE_DB_NAME);
    try {
      const existing = await roleDesination.findOne({
        deleteFlag: 0,
        _id: new mongoose.Types.ObjectId(designationId),
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkDesignationId:", error);
      throw new Error(error.message);
    }
  },

  // async checkUpdatedDesignationId(SITE_DB_NAME, designationId, name) {
  //   const roleDesination = await DesignationModel(SITE_DB_NAME);
  //   try {
  //     const existing = await roleDesination.findOne({
  //       _id: { $ne: new mongoose.Types.ObjectId(designationId) }, // exclude current id
  //       name: name,
  //       deleteFlag: 0,
  //     });
  //     if (existing) {
  //       return existing;
  //     } else {
  //       return "NA";
  //     }
  //   } catch (error) {
  //     console.error("Error in checkUpdatedDesignationId:", error);
  //     throw new Error(error.message);
  //   }
  // },

  async checkUpdatedDesignationId(SITE_DB_NAME, designationId, name) {
    const roleDesination = await DesignationModel(SITE_DB_NAME);
    try {
      const existing = await roleDesination.findOne({
        _id: { $ne: designationId },
        name: name,
        deleteFlag: 0,
      }); // 20 seconds timeout
      if (existing) {
        return existing._id;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "holidcheckUpdatedDesignationIdayTemp find db error",
        error.message,
      );
      throw new Error(error.message);
    }
  },

  async checkDesignationName(SITE_DB_NAME, designationId, name) {
    const roleDesination = await DesignationModel(SITE_DB_NAME);
    try {
      const existing = await roleDesination.findOne({
        _id: new mongoose.Types.ObjectId(designationId), // exclude current id
        name: name,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkDesignationName:", error);
      throw new Error(error.message);
    }
  },

  // async checkUpdatedDesignation(
  //   SITE_DB_NAME,
  //   targetDesignationId,
  //   name
  // ) {
  //   try {
  //     const roleDesination = await DesignationModel(SITE_DB_NAME);

  //     // Check if same name exists in other documents (excluding the current one)
  //     const existing = await roleDesination.findOne({
  //       _id: { $ne: new mongoose.Types.ObjectId(targetDesignationId) }, // exclude current id
  //       name: name,
  //       deleteFlag: 0,
  //     });

  //     if (existing) {
  //       // Duplicate name found in another workflow
  //       return "DUPLICATE_NAME";
  //     }

  //     // Check if the workflow with this ID exists (used for final verification)
  //     const DesignationExists = await roleDesination.findOne({
  //       _id: new mongoose.Types.ObjectId(targetDesignationId),
  //       deleteFlag: 0,
  //     });

  //     if (!DesignationExists) {
  //       return "INVALID_ID";
  //     }

  //     // All good
  //     return "OK";
  //   } catch (error) {
  //     console.error("Error in checkUpdatedDesignation:", error);
  //     throw new Error(error.message);
  //   }
  // },

  // async checkUpdatedDesignation(SITE_DB_NAME, targetDesignationId) {
  //   try {
  //     const roleDesination = await DesignationModel(SITE_DB_NAME);
  //     const existing = await roleDesination.findOne({
  //       deleteFlag: 0,
  //       _id: { $ne: new mongoose.Types.ObjectId(targetDesignationId) },
  //     });
  //     if (existing) {
  //       return existing;
  //     } else {
  //       return "NA";
  //     }
  //   } catch (error) {
  //     console.error("Error in checkUpdatedDesignation:", error);
  //     throw new Error(error.message);
  //   }
  // },

  async updateDesignation(SITE_DB_NAME, targetDesignationId, data) {
    const roleDesination = await DesignationModel(SITE_DB_NAME);
    try {
      const updateStatus = await roleDesination.updateOne(
        { _id: targetDesignationId },
        { $set: data },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateDesignation:", error);
      throw new Error(error.message);
    }
  },

  async findDesignationIdToUserIds(SITE_DB_NAME, designationId) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const users = await User.find({
        designationId: designationId,
        deleteFlag: 0,
      })
        .select("_id")
        .lean();
      if (!users || users.length === 0) {
        return [];
      }
      return users.map((u) => u._id);
    } catch (error) {
      console.log(
        "Database error in findDesignationIdToUserIds:",
        error.message,
      );
      throw new Error(error.message);
    }
  },

  async deleteDesignation(SITE_DB_NAME, designationId) {
    const roleDesination = await DesignationModel(SITE_DB_NAME);
    const User = await UserModel(SITE_DB_NAME);

    try {
      // Step 1: Designation को delete करना
      const deleteStatus = await roleDesination.deleteOne({
        _id: designationId,
      });

      // Step 2: User documents में designationId null करना
      const updateUsers = await User.updateMany(
        { designationId: designationId },
        { $set: { designationId: null } },
      );

      return {
        deleted: deleteStatus.deletedCount,
        updatedUsers: updateUsers.modifiedCount,
      };
    } catch (error) {
      console.log(
        "Database error from admin service deleteDesignation:",
        error.message,
      );
      throw new Error(error.message);
    }
  },

  async getCompanyById(SITE_DB_NAME, companyId) {
    const Company = await CompanyModel(SITE_DB_NAME);
    try {
      const existing = await Company.findOne({
        deleteFlag: 0,
        _id: companyId,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getcompanyById:", error);
      throw new Error(error.message);
    }
  },

  async checkCompany(SITE_DB_NAME, companyId) {
    const Company = await CompanyModel(SITE_DB_NAME);
    try {
      const existing = await Company.findOne({
        deleteFlag: 0,
        _id: companyId,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkCompany:", error);
      throw new Error(error.message);
    }
  },

  async checkCopmanyUpdateName(SITE_DB_NAME, companyId, companyName) {
    const Company = await CompanyModel(SITE_DB_NAME);
    try {
      const existing = await Company.findOne({
        _id: { $ne: new mongoose.Types.ObjectId(companyId) }, // exclude current id
        companyName: companyName,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkCopmanyUpdateName:", error);
      throw new Error(error.message);
    }
  },

  async getRoleById(SITE_DB_NAME, roleId) {
    const Role = await RoleModel(SITE_DB_NAME);
    try {
      const existing = await Role.findOne({ deleteFlag: 0, _id: roleId });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getRoleById:", error);
      throw new Error(error.message);
    }
  },

  //====================================== Tanant-Activity-And-History-Flow ===========================
  async getActivity(SITE_DB_NAME, queryData, currentUserId, pagination) {
    const Activity = await UserNotificationMessageModel(SITE_DB_NAME);
    const User = await UserModel(SITE_DB_NAME);

    try {
      const { pageSize, pageNumber } = pagination;
      const skip = (pageNumber - 1) * pageSize;

      // base filter
      const filter = {
        deleteFlag: Number(queryData.deleteFlag),
        notificationOrActivity: Number(queryData.notificationOrActivity),
      };

      // module filter (action)
      if (queryData.module && queryData.module !== "all") {
        filter.action = queryData.module; // e.g. "people"
      }

      // actor filter
      if (queryData.actorId) {
        if (mongoose.Types.ObjectId.isValid(queryData.actorId)) {
          filter.userId = new mongoose.Types.ObjectId(queryData.actorId);
        } else {
          filter.userId = queryData.actorId;
        }
      }

      // moduleId filter (exact match in actionId, otherUserId, actionJson.actionId)
      if (queryData.moduleId) {
        const id = queryData.moduleId;
        let objId = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
          objId = new mongoose.Types.ObjectId(id);
        }

        filter.$or = [
          { actionId: objId || id },
          { otherUserId: objId || id },
          { "actionJson.actionId": objId || id },
        ];
      }

      // fetch total count and page data
      const [totalCount, activities] = await Promise.all([
        Activity.countDocuments(filter),
        Activity.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(pageSize)
          .lean(),
      ]);

      if (!activities || activities.length === 0) return "NA";

      // fetch actor info
      const actorIds = [
        ...new Set(
          activities
            .map((a) => (a.userId ? String(a.userId) : null))
            .filter(Boolean),
        ),
      ];

      let actorMap = {};
      if (actorIds.length > 0) {
        const actors = await User.find({ _id: { $in: actorIds } })
          .select("firstName lastName image email")
          .lean();
        actorMap = actors.reduce((m, u) => {
          m[String(u._id)] = u;
          return m;
        }, {});
      }

      // format response
      const formatted = activities.map((item) => {
        const actor = actorMap[String(item.userId)];
        const actorName = actor
          ? `${actor.firstName || ""} ${actor.lastName || ""}`.trim()
          : null;
        const userImage = actor ? actor.image : null;

        return {
          _id: item._id,
          module: item.action,
          actionId: item.actionId || item.actionJson?.actionId || null,
          title: item.title1 || item.title2 || item.title3 || item.title4 || "",
          message:
            item.message1 ||
            item.message2 ||
            item.message3 ||
            item.message4 ||
            "",
          createdAt: item.createdAt,
          actorId: item.userId || null,
          actorName,
          userImage,
          raw: item,
        };
      });

      return {
        items: formatted,
        total: totalCount,
        pageSize,
        pageNumber,
      };
    } catch (error) {
      console.error("Error in getActivity:", error);
      throw new Error(error.message || error);
    }
  },

  // async getActivity(SITE_DB_NAME, queryData, currentUserId, pagination) {
  //   const Activity = await UserNotificationMessageModel(SITE_DB_NAME);
  //   const User = await UserModel(SITE_DB_NAME);

  //   try {
  //     const { pageSize, pageNumber } = pagination;
  //     const skip = (pageNumber - 1) * pageSize;

  //     // base filter
  //     let filter = {
  //       deleteFlag: Number(queryData.deleteFlag),
  //       notificationOrActivity: Number(queryData.notificationOrActivity),
  //     };

  //     // 👇 yaha module ko action ke against map karo
  //     if (queryData.module && queryData.module !== "all") {
  //       filter.action = queryData.module; // module = "setting" -> action: "setting"
  //     }

  //     const activities = await Activity.find(filter)
  //       .skip(skip)
  //       .limit(pageSize)
  //       .sort({ createdAt: -1 });

  //     if (!activities || activities.length === 0) {
  //       return "NA";
  //     }

  //     const filteredList = activities.filter((item) => {
  //       if (item.action === "profile") {
  //         return String(item.userId) === String(currentUserId);
  //       }
  //       return true;
  //     });

  //     const currentUser = await User.findById(currentUserId).lean();
  //     const userImage = currentUser?.image || null;

  //     const formatted = filteredList.map((item) => ({
  //       _id: item._id,
  //       module: item.action, // 👈 yaha action ko module naam se bhej rahe ho
  //       title: item.title1,
  //       message: item.message1,
  //       createdAt: item.createdAt,
  //       userImage: userImage,
  //     }));

  //     return formatted.length > 0 ? formatted : "NA";
  //   } catch (error) {
  //     console.error("Error in getActivity:", error);
  //     throw new Error(error.message);
  //   }
  // },
  //====================================== Tanant-Setting-Flow ===========================
  // async getGeneralDetails(SITE_DB_NAME, deleteFlag) {
  //   const generalDetails = await WorkspaceModel(SITE_DB_NAME);
  //   try {
  //     const checkGeneralDetails = await generalDetails.find(
  //       {
  //         deleteFlag: deleteFlag,
  //       },
  //       {
  //         workspaceName: 1,
  //         workspaceUrl: 1,
  //         workspaceCurrency: 1,
  //         siteNameOnLoginPage: 1,
  //         clientsView: 1,
  //         dashboardMessage: 1,
  //         dashboardProjectList: 1,
  //         canShareFiles: 1,
  //         canUploadFiles: 1,
  //         allowReactions: 1,
  //         allowTags: 1,
  //         lockEditingOfTags: 1,
  //         cleanPastedHTML: 1,
  //         newlineMode: 1,
  //         projectHealthLabels: 1,
  //         automaticLogOut: 1,
  //         allowTeamworkBrand: 1,
  //       }
  //     );
  //     if (checkGeneralDetails) {
  //       return checkGeneralDetails;
  //     } else {
  //       return "NA";
  //     }
  //   } catch (error) {
  //     console.log("Database error from getGeneralDetails:", error.message);
  //     throw new Error(error.message);
  //   }
  // },

  // async checkWorkspace(SITE_DB_NAME, workspaceId) {
  //   const generalDetails = await WorkspaceModel(SITE_DB_NAME);
  //   try {
  //     const existing = await generalDetails.findOne({
  //       deleteFlag: 0,
  //       _id: { $ne: new mongoose.Types.ObjectId(workspaceId) },
  //     });
  //     if (existing) {
  //       return existing;
  //     } else {
  //       return "NA";
  //     }
  //   } catch (error) {
  //     console.error("Error in checkWorkspace:", error);
  //     throw new Error(error.message);
  //   }
  // },

  // async updateGeneralDetails(SITE_DB_NAME, workspaceId, data) {
  //   const generalDetails = await WorkspaceModel(SITE_DB_NAME);
  //   try {
  //     const updateStatus = await generalDetails.updateOne({ _id: workspaceId }, { $set: data }, { upsert: false });
  //     if (updateStatus) {
  //       return updateStatus;
  //     } else {
  //       return "NA";
  //     }
  //   } catch (error) {
  //     console.error("Error in updateDesignation:", error);
  //     throw new Error(error.message);
  //   }
  // },

  //====================================== Tanant-Tages-Flow ===========================
  async checkTag(SITE_DB_NAME, name) {
    try {
      const Tags = await TagsModel(SITE_DB_NAME);
      const existing = await Tags.findOne({
        name,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkTag:", error);
      throw new Error(error.message);
    }
  },

  async createTag(SITE_DB_NAME, data) {
    const Tags = await TagsModel(SITE_DB_NAME);
    try {
      const createTagData = await Tags.create(data);
      if (createTagData) {
        return createTagData;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createTag:", error);
      throw new Error(error.message);
    }
  },

  async getTagDetails(SITE_DB_NAME, tagId) {
    const Tags = await TagsModel(SITE_DB_NAME);
    try {
      const tagsDetails = await Tags.findOne({
        _id: tagId,
        deleteFlag: 0,
      });

      if (tagsDetails) {
        return tagsDetails;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getTagDetails:", error);
      throw new Error(error.message);
    }
  },

  async getTags(SITE_DB_NAME, deleteFlag, pagination, search) {
    const Tags = await TagsModel(SITE_DB_NAME);
    try {
      const { pageSize, pageNumber } = pagination;
      const skip = (pageNumber - 1) * pageSize;

      // Build query
      const query = {
        deleteFlag: deleteFlag,
      };

      if (search && search.trim() !== "") {
        query.name = { $regex: search.trim(), $options: "i" }; // case-insensitive search
      }

      const tagsDetails = await Tags.find(query)
        .skip(skip)
        .limit(pageSize)
        .sort({
          createdAt: -1,
        });
      if (tagsDetails.length > 0) {
        return tagsDetails;
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error in getTags:", error);
      throw new Error(error.message);
    }
  },

  async checkUpdateTag(SITE_DB_NAME, tagId) {
    const Tags = await TagsModel(SITE_DB_NAME);
    try {
      const existing = await Tags.findOne({
        deleteFlag: 0,
        // _id: tagId,
        _id: new mongoose.Types.ObjectId(tagId),
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkUpdateTag:", error);
      throw new Error(error.message);
    }
  },

  async updateTag(SITE_DB_NAME, tagId, data) {
    const Tags = await TagsModel(SITE_DB_NAME);
    try {
      const updateStatus = await Tags.updateOne(
        { _id: tagId },
        { $set: data },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateTag:", error);
      throw new Error(error.message);
    }
  },

  async deleteTag(SITE_DB_NAME, tagId) {
    const Tags = await TagsModel(SITE_DB_NAME);
    try {
      const deleteResult = await Tags.deleteOne({
        _id: tagId,
      });
      if (deleteResult) {
        return true;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in deleteTag:", error);
      throw new Error(error.message);
    }
  },

  async removeTagIdCompany(SITE_DB_NAME, tagsId) {
    const Company = await CompanyModel(SITE_DB_NAME);
    try {
      const updateStatus = await Company.updateMany(
        { tagsId: tagsId }, // jaha tag present hai
        { $pull: { tagsId: tagsId } }, // us tag ko remove kar do
        { multi: true }, // multiple docs update
      );
      if (updateStatus.matchedCount === 0) {
        return { acknowledged: true, modifiedCount: 0 };
      }

      // if (updateStatus.modifiedCount === 0) {
      //   return updateStatus;
      // } else {
      //   return "NA";
      // }
    } catch (error) {
      console.error("Error in removeTagIdCompany:", error);
      throw new Error(error.message);
    }
  },

  async removeTagIdProject(SITE_DB_NAME, data) {
    const Project = await ProjectModel(SITE_DB_NAME);
    try {
      const updateStatus = await Project.updateMany(
        { tagIds: data.tagIds },
        { $pull: { tagIds: data.tagIds } },
        { multi: true },
      );

      if (updateStatus.matchedCount === 0) {
        return { acknowledged: true, modifiedCount: 0 };
      }

      // if (updateStatus.modifiedCount > 0) {
      //   return updateStatus;
      // } else {
      //   return "NA";
      // }
    } catch (error) {
      console.error("Error in removeTagIdProject:", error);
      throw new Error(error.message);
    }
  },

  async removeTagIdTask(SITE_DB_NAME, tags) {
    const Task = await TaskModel(SITE_DB_NAME);
    try {
      const updateStatus = await Task.updateMany(
        { tags: tags },
        { $pull: { tags: tags } },
        { multi: true },
      );

      if (updateStatus.matchedCount === 0) {
        return { acknowledged: true, modifiedCount: 0 };
      }

      // if (updateStatus.modifiedCount > 0) {
      //   return updateStatus;
      // } else {
      //   return "NA";
      // }
    } catch (error) {
      console.error("Error in removeTagIdTask:", error);
      throw new Error(error.message);
    }
  },

  async removeWorkflowIdProject(SITE_DB_NAME, workflowId) {
    const Project = await ProjectModel(SITE_DB_NAME);
    try {
      const updateStatus = await Project.updateMany(
        { workflowId: workflowId },
        { $set: { workflowId: null } }, // $pull hatao, $set lagao
      );

      return updateStatus;
    } catch (error) {
      console.error("Error in removeWorkflowIdProject:", error);
      throw new Error(error.message);
    }
  },

  async removeWorkflowIdTask(SITE_DB_NAME, workflowId) {
    const Task = await TaskModel(SITE_DB_NAME);
    try {
      const updateStatus = await Task.updateMany(
        { workflowId: workflowId },
        { $set: { workflowId: null, stageId: null } }, // dono ko null karo
      );

      return updateStatus;
    } catch (error) {
      console.error("Error in removeWorkflowIdTask:", error);
      throw new Error(error.message);
    }
  },

  //====================================== Tanant-company-Custom-Fields-Flow ===========================
  async checkCustomField(SITE_DB_NAME, moduleType, fieldName) {
    try {
      const CustomField = await CustomFieldModel(SITE_DB_NAME);
      const existing = await CustomField.findOne({
        moduleType,
        fieldName,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkCustomField:", error);
      throw new Error(error.message);
    }
  },

  async createCustomField(SITE_DB_NAME, customFieldData) {
    const CustomField = await CustomFieldModel(SITE_DB_NAME);
    try {
      const createCustomFieldData = await CustomField.create(customFieldData);
      if (createCustomFieldData) {
        return createCustomFieldData;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createCustomField:", error);
      throw new Error(error.message);
    }
  },

  async getCustomFieldDetails(SITE_DB_NAME, customFieldId) {
    const CustomField = await CustomFieldModel(SITE_DB_NAME);
    try {
      const CustomFieldDetails = await CustomField.findOne({
        _id: customFieldId,
        deleteFlag: 0,
      });

      if (CustomFieldDetails) {
        return CustomFieldDetails;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getCustomFieldDetails:", error);
      throw new Error(error.message);
    }
  },
  async getCustomField(SITE_DB_NAME, deleteFlag, moduleType) {
    const CustomField = await CustomFieldModel(SITE_DB_NAME);
    try {
      // base filter
      let filter = {
        deleteFlag: Number(deleteFlag),
      };

      // agar moduleType bheja gaya hai aur empty nahi hai
      if (moduleType && moduleType.trim() !== "") {
        filter.moduleType = moduleType;
      }
      const CustomFieldDetails = await CustomField.find(filter);

      if (CustomFieldDetails.length > 0) {
        return CustomFieldDetails;
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error in getCustomField:", error);
      throw new Error(error.message);
    }
  },

  async checkCustomFieldId(SITE_DB_NAME, customFieldId) {
    const CustomField = await CustomFieldModel(SITE_DB_NAME);
    try {
      const existing = await CustomField.findOne({
        deleteFlag: 0,
        _id: new mongoose.Types.ObjectId(customFieldId),
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkCustomFieldId:", error);
      throw new Error(error.message);
    }
  },

  async checkCustomFieldName(SITE_DB_NAME, customFieldId, fieldName) {
    const CustomField = await CustomFieldModel(SITE_DB_NAME);
    try {
      const existing = await CustomField.findOne({
        _id: { $ne: new mongoose.Types.ObjectId(customFieldId) }, // exclude current id
        fieldName: fieldName,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkCustomFieldName:", error);
      throw new Error(error.message);
    }
  },

  async updateCustomField(SITE_DB_NAME, customFieldId, data) {
    const CustomField = await CustomFieldModel(SITE_DB_NAME);
    try {
      const updateStatus = await CustomField.updateOne(
        { _id: customFieldId },
        { $set: data },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateCustomField:", error);
      throw new Error(error.message);
    }
  },

  async checkCustomFieldId(SITE_DB_NAME, checkCustomFieldId) {
    try {
      const CustomField = await CustomFieldModel(SITE_DB_NAME);
      const existing = await CustomField.findOne({
        _id: new mongoose.Types.ObjectId(checkCustomFieldId),
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkCustomFieldId:", error);
      throw new Error(error.message);
    }
  },

  async deleteCustomField(SITE_DB_NAME, customFieldId) {
    const CustomField = await CustomFieldModel(SITE_DB_NAME);
    try {
      const deleteResult = await CustomField.deleteOne({ _id: customFieldId });
      if (deleteResult) {
        return true;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in deleteCustomField:", error);
      throw new Error(error.message);
    }
  },

  //====================================== Tanant-Workflow-Flow ===========================
  async checkWorkflow(SITE_DB_NAME, name) {
    try {
      const Workflow = await WorkflowModel(SITE_DB_NAME);
      const existing = await Workflow.findOne({
        name,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkWorkflow:", error);
      throw new Error(error.message);
    }
  },

  async createWorkflow(SITE_DB_NAME, data) {
    const Workflow = await WorkflowModel(SITE_DB_NAME);
    try {
      const createWorkflowData = await Workflow.create(data);
      if (createWorkflowData) {
        return createWorkflowData;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createFlow:", error);
      throw new Error(error.message);
    }
  },

  // async getWorkflowDetails(SITE_DB_NAME, workflowId) {
  //   const Workflow = await WorkflowModel(SITE_DB_NAME);
  //   try {
  //     const workflowDetails = await Workflow.findOne({
  //       _id: workflowId,
  //       deleteFlag: 0,
  //     });

  //     if (workflowDetails) {
  //       return workflowDetails;
  //     } else {
  //       return "NA";
  //     }
  //   } catch (error) {
  //     console.error("Error in getWorkflowDetails:", error);
  //     throw new Error(error.message);
  //   }
  // },

  async getWorkflowDetails(SITE_DB_NAME, workflowId) {
    const Workflow = await WorkflowModel(SITE_DB_NAME);

    try {
      // ensure workflowId is an ObjectId for aggregation match
      const objId =
        typeof workflowId === "string"
          ? new mongoose.Types.ObjectId(workflowId)
          : workflowId;

      const workflowArr = await Workflow.aggregate([
        { $match: { _id: objId, deleteFlag: 0 } },

        // lookup projects that use this workflow
        {
          $lookup: {
            from: "projects",
            localField: "_id",
            foreignField: "workflowId",
            as: "projectDetails",
          },
        },

        // lookup company details for each project
        {
          $lookup: {
            from: "companies",
            localField: "projectDetails.companyId",
            foreignField: "_id",
            as: "companyDetails",
          },
        },

        // lookup createdBy user (project owner)
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            pipeline: [{ $project: { _id: 1, name: 1, image: 1 } }],
            as: "createdByDetails",
          },
        },

        // build usedIn array from projects + companyNames
        {
          $addFields: {
            usedIn: {
              $map: {
                input: "$projectDetails",
                as: "proj",
                in: {
                  _id: "$$proj._id",
                  name: "$$proj.name",
                  companyName: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$companyDetails",
                              as: "comp",
                              cond: { $eq: ["$$comp._id", "$$proj.companyId"] },
                            },
                          },
                          as: "matchedComp",
                          in: "$$matchedComp.companyName",
                        },
                      },
                      0,
                    ],
                  },
                },
              },
            },
          },
        },

        // set createdBy to populated user object if found, otherwise keep original ObjectId
        {
          $addFields: {
            createdBy: {
              $ifNull: [
                { $arrayElemAt: ["$createdByDetails", 0] },
                "$createdBy",
              ],
            },
          },
        },

        // final projection
        {
          $project: {
            _id: 1,
            name: 1,
            stages: 1,
            createdBy: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            usedIn: 1,
          },
        },
      ]);

      if (workflowArr && workflowArr.length > 0) {
        return workflowArr[0];
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getWorkflowDetails:", error);
      throw new Error(error.message);
    }
  },

  async getWorkflow(SITE_DB_NAME, deleteFlag, pagination, search) {
    const Workflow = await WorkflowModel(SITE_DB_NAME);

    try {
      const { pageSize, pageNumber } = pagination;
      const skip = (pageNumber - 1) * pageSize;

      const matchStage = { deleteFlag };

      if (search && search.trim() !== "") {
        matchStage.name = { $regex: search.trim(), $options: "i" };
      }

      const workflowDetails = await Workflow.aggregate([
        { $match: matchStage },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },

        // lookup projects that use this workflow
        {
          $lookup: {
            from: "projects",
            localField: "_id",
            foreignField: "workflowId",
            as: "projectDetails",
          },
        },

        // lookup company details for each project
        {
          $lookup: {
            from: "companies",
            localField: "projectDetails.companyId",
            foreignField: "_id",
            as: "companyDetails",
          },
        },

        // lookup createdBy user (keep as array)
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            pipeline: [{ $project: { _id: 1, name: 1, image: 1 } }],
            as: "createdByDetails",
          },
        },

        // build usedIn from projectDetails + companyNames
        {
          $addFields: {
            usedIn: {
              $map: {
                input: "$projectDetails",
                as: "proj",
                in: {
                  _id: "$$proj._id",
                  name: "$$proj.name",
                  companyName: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$companyDetails",
                              as: "comp",
                              cond: { $eq: ["$$comp._id", "$$proj.companyId"] },
                            },
                          },
                          as: "matchedComp",
                          in: "$$matchedComp.companyName",
                        },
                      },
                      0,
                    ],
                  },
                },
              },
            },
          },
        },

        // set createdBy to the user object if found, otherwise keep original ObjectId
        {
          $addFields: {
            createdBy: {
              $ifNull: [
                { $arrayElemAt: ["$createdByDetails", 0] },
                "$createdBy",
              ],
            },
          },
        },

        // final projection
        {
          $project: {
            _id: 1,
            name: 1,
            stages: 1,
            createdBy: 1, // now this can be either { _id, name, image } or ObjectId fallback
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            usedIn: 1,
          },
        },
      ]);

      return workflowDetails;
    } catch (error) {
      console.error("Error in getWorkflow:", error);
      throw new Error(error.message);
    }
  },
  // async getWorkflow(SITE_DB_NAME, deleteFlag, pagination, search) {
  //   const Workflow = await WorkflowModel(SITE_DB_NAME);
  //   try {
  //     const { pageSize, pageNumber } = pagination;
  //     const skip = (pageNumber - 1) * pageSize;

  //     // Build query
  //     const query = {
  //       deleteFlag: deleteFlag,
  //     };

  //     if (search && search.trim() !== "") {
  //       query.name = { $regex: search.trim(), $options: "i" }; // case-insensitive search
  //     }

  //     const workflowDetails = await Workflow.find(query)
  //       .skip(skip)
  //       .limit(pageSize)
  //       .sort({
  //         createdAt: -1,
  //       });
  //     if (workflowDetails.length > 0) {
  //       return workflowDetails;
  //     } else {
  //       return [];
  //     }
  //   } catch (error) {
  //     console.error("Error in getWorkflow:", error);
  //     throw new Error(error.message);
  //   }
  // },

  async checkWorkflowId(SITE_DB_NAME, workflowId) {
    const Workflow = await WorkflowModel(SITE_DB_NAME);
    try {
      const existing = await Workflow.findOne({
        deleteFlag: 0,
        _id: new mongoose.Types.ObjectId(workflowId),
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkWorkflowId:", error);
      throw new Error(error.message);
    }
  },

  async checkWorkflowName(SITE_DB_NAME, workflowId, name) {
    const Workflow = await WorkflowModel(SITE_DB_NAME);
    try {
      const existing = await Workflow.findOne({
        _id: { $ne: new mongoose.Types.ObjectId(workflowId) },
        name: name,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkWorkflowName:", error);
      throw new Error(error.message);
    }
  },

  async updateWorkflowAddProject(
    SITE_DB_NAME,
    projectIds,
    newWorkflowId,
    firstStageId,
  ) {
    const Project = await ProjectModel(SITE_DB_NAME);
    const Task = await TaskModel(SITE_DB_NAME);
    const Workflow = await WorkflowModel(SITE_DB_NAME);

    try {
      // ✅ Convert workflowId to ObjectId correctly
      const workflowObjectId = new mongoose.Types.ObjectId(newWorkflowId);

      // Convert all projectIds to ObjectId
      const projectObjectIds = projectIds.map(
        (id) => new mongoose.Types.ObjectId(id),
      );

      // Convert firstStageId if provided
      const stageObjectId = firstStageId
        ? new mongoose.Types.ObjectId(firstStageId)
        : null;

      // Fetch all relevant projects
      const projects = await Project.find({ _id: { $in: projectObjectIds } });
      if (!projects.length) return "NA";

      const updatedProjects = [];
      const skippedProjects = [];

      for (const project of projects) {
        const currentWorkflowId = project.workflowId;

        // Skip if workflow is already assigned
        if (currentWorkflowId && currentWorkflowId.equals(workflowObjectId)) {
          skippedProjects.push(project._id.toString());
          continue;
        }

        // Update project workflow
        const updateStatus = await Project.updateOne(
          { _id: project._id },
          { $set: { workflowId: workflowObjectId } },
        );

        // Update all tasks inside this project
        await Task.updateMany(
          { projectId: project._id },
          { $set: { workflowId: workflowObjectId, stageId: stageObjectId } },
        );

        if (updateStatus.modifiedCount > 0) {
          updatedProjects.push(project._id.toString());
        } else {
          skippedProjects.push(project._id.toString());
        }
      }

      // Update workflow's usedIn only for updated projects
      if (updatedProjects.length > 0) {
        await Workflow.updateOne(
          { _id: workflowObjectId },
          { $addToSet: { usedIn: { $each: updatedProjects } } },
        );
      }

      return {
        updatedCount: updatedProjects.length,
        skippedCount: skippedProjects.length,
        updatedProjects,
        skippedProjects,
      };
    } catch (error) {
      console.error("Error in updateWorkflowAddProject:", error);
      throw new Error(error.message);
    }
  },
  // async updateWorkflowAddProject(
  //   SITE_DB_NAME,
  //   projectIds,
  //   newWorkflowId,
  //   firstStageId
  // ) {
  //   const Project = await ProjectModel(SITE_DB_NAME);
  //   const Task = await TaskModel(SITE_DB_NAME);
  //   const Workflow = await WorkflowModel(SITE_DB_NAME);
  //   try {
  //     // Fetch all relevant projects
  //     const projects = await Project.find({ _id: { $in: projectIds } });
  //     if (!projects.length) return "NA";

  //     const updatedProjects = [];
  //     const skippedProjects = [];

  //     // Loop each project
  //     for (const project of projects) {
  //       const currentWorkflowId = project.workflowId?.toString() || null;

  //       // If same workflow already assigned → skip
  //       if (currentWorkflowId === newWorkflowId) {
  //         skippedProjects.push(project._id);
  //         continue;
  //       }

  //       // ✅ Update this project
  //       const updateStatus = await Project.updateOne(
  //         { _id: project._id },
  //         { $set: { workflowId: newWorkflowId } }
  //       );

  //       // ✅ Update all tasks inside this project
  //       await Task.updateMany(
  //         { projectId: project._id },
  //         { $set: { workflowId: newWorkflowId, stageId: firstStageId } }
  //       );

  //       if (updateStatus.modifiedCount > 0) {
  //         updatedProjects.push(project._id);
  //       } else {
  //         skippedProjects.push(project._id);
  //       }
  //     }

  //     // Optional: mark workflow "usedIn" for tracking
  //     if (updatedProjects.length > 0) {
  //       await Workflow.updateOne(
  //         { _id: newWorkflowId },
  //         { $addToSet: { usedIn: { $each: updatedProjects } } }
  //       );
  //     }

  //     // ✅ Final structured result
  //     const result = {
  //       updatedCount: updatedProjects.length,
  //       skippedCount: skippedProjects.length,
  //       updatedProjects,
  //       skippedProjects,
  //     };
  //     if (updatedProjects.length > 0) {
  //       return result;
  //     } else {
  //       return "NA";
  //     }
  //   } catch (error) {
  //     console.error("Error in updateWorkflowAddProject:", error);
  //     throw new Error(error.message);
  //   }
  // },

  async updateWorkflow(SITE_DB_NAME, workflowId, data) {
    const Workflow = await WorkflowModel(SITE_DB_NAME);
    try {
      const updateStatus = await Workflow.updateOne(
        { _id: workflowId },
        { $set: data },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateWorkflow:", error);
      throw new Error(error.message);
    }
  },

  async checkDeleteWorkflow(SITE_DB_NAME, workflowId) {
    try {
      const Workflow = await WorkflowModel(SITE_DB_NAME);
      const existing = await Workflow.findOne({
        deleteFlag: 0,
        _id: new mongoose.Types.ObjectId(workflowId),
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkUpdateWorkflow:", error);
      throw new Error(error.message);
    }
  },

  async deleteWorkflow(SITE_DB_NAME, workflowId) {
    const Workflow = await WorkflowModel(SITE_DB_NAME);
    try {
      const deleteResult = await Workflow.deleteOne({ _id: workflowId });
      if (deleteResult) {
        return true;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in deleteWorksapce:", error);
      throw new Error(error.message);
    }
  },

  //====================================== Tanant-Project-Flow ===========================
  async checkProjectCategory(SITE_DB_NAME, name) {
    try {
      const ProjectCategory = await ProjectCategoryModel(SITE_DB_NAME);
      const existing = await ProjectCategory.findOne({
        name,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkProjectCategory:", error);
      throw new Error(error.message);
    }
  },

  async createProjectCategory(SITE_DB_NAME, data) {
    const ProjectCategory = await ProjectCategoryModel(SITE_DB_NAME);
    try {
      const createProjectCategoryData = await ProjectCategory.create(data);
      if (createProjectCategoryData) {
        return createProjectCategoryData;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createProjectCategory:", error);
      throw new Error(error.message);
    }
  },

  async getProjectCategory(SITE_DB_NAME, projectCategoryId) {
    const ProjectCategory = await ProjectCategoryModel(SITE_DB_NAME);
    try {
      const projectCategoryDetails = await ProjectCategory.findOne({
        _id: projectCategoryId,
        deleteFlag: 0,
      });

      if (projectCategoryDetails) {
        return projectCategoryDetails;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getProjectCategory:", error);
      throw new Error(error.message);
    }
  },

  async getProjectCategories(SITE_DB_NAME, deleteFlag) {
    const ProjectCategory = await ProjectCategoryModel(SITE_DB_NAME);
    try {
      const projectCategoryDetails = await ProjectCategory.find({
        deleteFlag: deleteFlag,
      }).sort({
        createdAt: -1,
      });
      if (projectCategoryDetails.length > 0) {
        return projectCategoryDetails;
      } else {
        return [];
      }
    } catch (error) {
      console.error("Error in projectCategoryDetails:", error);
      throw new Error(error.message);
    }
  },

  async checkProject(SITE_DB_NAME, name) {
    try {
      const Project = await ProjectModel(SITE_DB_NAME);
      const existing = await Project.findOne({
        name,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkProject:", error);
      throw new Error(error.message);
    }
  },

  async checkProjectId(SITE_DB_NAME, projectId) {
    const Project = await ProjectModel(SITE_DB_NAME);
    try {
      const existing = await Project.findOne({
        deleteFlag: 0,
        _id: new mongoose.Types.ObjectId(projectId),
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkProjectId:", error);
      throw new Error(error.message);
    }
  },

  async checkProjectUpdateId(SITE_DB_NAME, projectUpdateId) {
    const ProjectUpdate = await ProjectUpdateModel(SITE_DB_NAME);
    try {
      const existing = await ProjectUpdate.findOne({
        deleteFlag: 0,
        _id: new mongoose.Types.ObjectId(projectUpdateId),
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkProjectUpdateId:", error);
      throw new Error(error.message);
    }
  },

  async checkProjectUpdateEmoji(SITE_DB_NAME, projectUpdateId, emoji, userId) {
    const ProjectUpdate = await ProjectUpdateModel(SITE_DB_NAME);

    try {
      const existing = await ProjectUpdate.findOne({
        _id: projectUpdateId,
        deleteFlag: 0,
        reactions: {
          $elemMatch: {
            emoji: emoji,
            "users.userId": userId,
          },
        },
      });

      if (existing) {
        return emoji;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkProjectUpdateEmoji:", error);
      throw new Error(error.message);
    }
  },

  async checkProjectRestoreId(SITE_DB_NAME, projectId) {
    const Project = await ProjectModel(SITE_DB_NAME);
    try {
      const existing = await Project.findOne({
        deleteFlag: 1,
        _id: new mongoose.Types.ObjectId(projectId),
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkProjectRestoreId:", error);
      throw new Error(error.message);
    }
  },

  async checkBudgetId(SITE_DB_NAME, budgetId) {
    const ProjectBudget = await ProjectBudgetModel(SITE_DB_NAME);
    try {
      const existing = await ProjectBudget.findOne({
        deleteFlag: 0,
        _id: new mongoose.Types.ObjectId(budgetId),
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkBudgetId:", error);
      throw new Error(error.message);
    }
  },

  async checkBudgetProjectId(SITE_DB_NAME, projectId) {
    const ProjectBudget = await ProjectBudgetModel(SITE_DB_NAME);
    try {
      const existing = await ProjectBudget.findOne({
        deleteFlag: 0,
        projectId: new mongoose.Types.ObjectId(projectId),
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkBudgetProjectId:", error);
      throw new Error(error.message);
    }
  },

  async checkProjectUpdateName(SITE_DB_NAME, projectId, name) {
    const Project = await ProjectModel(SITE_DB_NAME);
    try {
      const existing = await Project.findOne({
        _id: { $ne: new mongoose.Types.ObjectId(projectId) }, // exclude current id
        name: name,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkProjectUpdateName:", error);
      throw new Error(error.message);
    }
  },

  async checkProjectLastNumber(SITE_DB_NAME) {
    try {
      const Project = await ProjectModel(SITE_DB_NAME);
      const lastProject = await Project.findOne()
        .sort({ createdAt: -1 }) // latest one
        // .select("projectNumber")
        .lean();

      if (lastProject && lastProject.projectNumber) {
        const lastNumber = parseInt(lastProject.projectNumber.split("-")[1]);
        const newNumber = lastNumber + 1;
        const paddedNumber = String(newNumber).padStart(3, "0");
        return `PRJ-${paddedNumber}`;
      }
      if (!lastProject || !lastProject.projectNumber) {
        return "PRJ-001"; // default start
      }
      return "NA";
    } catch (error) {
      console.error("Error in checkProjectLastNumber me :", error);
      throw new Error(error.message);
    }
  },

  async createProject(SITE_DB_NAME, data) {
    const Project = await ProjectModel(SITE_DB_NAME);
    try {
      const createProjectData = await Project.create(data);
      if (createProjectData) {
        return createProjectData;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createProject:", error);
      throw new Error(error.message);
    }
  },

  async createProjectBudget(SITE_DB_NAME, data) {
    const ProjectBudget = await ProjectBudgetModel(SITE_DB_NAME);
    try {
      const createProjectBudgetData = await ProjectBudget.create(data);
      if (createProjectBudgetData) {
        return createProjectBudgetData;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createProjectBudget:", error);
      throw new Error(error.message);
    }
  },

  async updateProjectMultiCustomField(SITE_DB_NAME, projectId, updateData) {
    const Project = await ProjectModel(SITE_DB_NAME);
    try {
      const updateStatus = await Project.findOneAndUpdate(
        { _id: projectId },
        { $set: updateData },
      );

      return updateStatus || "NA";
    } catch (error) {
      console.error("Error in updateProjectMultiCustomField:", error);
      throw new Error(error.message);
    }
  },

  async getProject(SITE_DB_NAME, projectId) {
    const Project = await ProjectModel(SITE_DB_NAME);
    try {
      const projectDetails = await Project.aggregate([
        {
          $match: {
            deleteFlag: 0,
            _id: projectId,
          },
        },
        // Join owner details
        {
          $lookup: {
            from: "users",
            let: { ownerId: "$ownerId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$ownerId"] } } },
              { $project: { name: 1, image: 1, roleName: 1 } },
            ],
            as: "ownerDetails",
          },
        },
        {
          $unwind: { path: "$ownerDetails", preserveNullAndEmptyArrays: true },
        },
        // Join company
        {
          $lookup: {
            from: "companies",
            let: { companyId: "$companyId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$companyId"] } } },
              {
                $project: {
                  companyName: 1,
                  companyLogo: 1,
                  companyType: 1,
                  companyLandmark: 1,
                  companyAddress: 1,
                  companyCity: 1,
                  companyState: 1,
                  companycountryName: 1,
                  companyCountryCode: 1,
                },
              },
            ],
            as: "companyDetails",
          },
        },
        {
          $unwind: {
            path: "$companyDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Join workflow
        {
          $lookup: {
            from: "workflows",
            let: { workflowId: "$workflowId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$workflowId"] },
                },
              },
              {
                $project: {
                  name: 1,
                  stages: 1, // 👈 stages add kar diya
                },
              },
            ],
            as: "workflowDetails",
          },
        },
        {
          $unwind: {
            path: "$workflowDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Join people
        {
          $lookup: {
            from: "users",
            let: { ids: "$peopleIds" },
            pipeline: [
              { $match: { $expr: { $in: ["$_id", "$$ids"] } } },
              { $project: { name: 1, image: 1, roleName: 1 } },
            ],
            as: "peopleDetails",
          },
        },
        // Join notify users
        {
          $lookup: {
            from: "users",
            let: { ids: "$notifyIds" },
            pipeline: [
              { $match: { $expr: { $in: ["$_id", "$$ids"] } } },
              { $project: { name: 1, image: 1, roleName: 1 } },
            ],
            as: "notifyDetails",
          },
        },
        // createdById
        {
          $lookup: {
            from: "users",
            localField: "createdById",
            foreignField: "_id",
            as: "createdByDetails",
          },
        },
        {
          $addFields: {
            createdByName: "$doc.createdByName",
            createdByImage: "$doc.createdByImage",
          },
        },
        // Join tags
        {
          $lookup: {
            from: "tags",
            localField: "tagIds",
            foreignField: "_id",
            as: "tagsList",
          },
        },
        // Join project category
        {
          $lookup: {
            from: "projectcategories",
            let: { id: "$projectCategoryId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
              { $project: { name: 1 } },
            ],
            as: "projectCategoryDetails",
          },
        },
        {
          $unwind: {
            path: "$projectCategoryDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Join project subcategory
        {
          $lookup: {
            from: "projectsubcategories",
            let: { id: "$projectSubCategoryId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
              { $project: { name: 1 } },
            ],
            as: "projectSubCategoryDetails",
          },
        },
        {
          $unwind: {
            path: "$projectSubCategoryDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        // Join project budget
        {
          $lookup: {
            from: "projectbudgets",
            let: { projectId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$projectId", "$$projectId"] } } },
              {
                $project: {
                  budgetName: 1,
                  budgetType: 1,
                  budgetAmountType: 1,
                  budgetAmount: 1,
                  budgetRepeats: 1,
                  budgetStartDate: 1,
                  budgetEndDate: 1,
                  budgetBasedOn: 1,
                  retainerOption: 1,
                  financialTarget: 1,
                },
              },
            ],
            as: "projectBudget",
          },
        },
        {
          $unwind: { path: "$projectBudget", preserveNullAndEmptyArrays: true },
        },

        {
          $group: {
            _id: "$_id",
            doc: { $first: "$$ROOT" }, // entire document
          },
        },
        {
          $project: {
            _id: "$_id",
            projectNumber: "$doc.projectNumber",
            name: "$doc.name",
            description: "$doc.description",
            ownerId: "$doc.ownerId",
            ownerDetails: "$doc.ownerDetails",
            createdById: "$doc.createdById",
            createdByName: "$doc.createdByDetails.name",
            createdByImage: "$doc.createdByDetails.image",
            companyId: "$doc.companyId",
            companyDetails: "$doc.companyDetails",
            workflowId: "$doc.workflowId",
            workflowDetails: "$doc.workflowDetails",
            peopleIds: "$doc.peopleIds",
            peopleDetails: "$doc.peopleDetails",
            notifyIds: "$doc.notifyIds",
            notifyDetails: "$doc.notifyDetails",
            projectCategoryId: "$doc.projectCategoryId",
            projectCategoryDetails: "$doc.projectCategoryDetails",
            projectSubCategoryId: "$doc.projectSubCategoryId",
            projectSubCategoryDetails: "$doc.projectSubCategoryDetails",
            isBillable: "$doc.isBillable",
            customFields: "$doc.customFields",
            projectHealthLabels: "$doc.projectHealthLabels",
            tagIds: "$doc.tagIds",
            tagsList: "$doc.tagsList",
            projectBudget: "$doc.projectBudget",
            projectStartDate: "$doc.projectStartDate",
            projectEndDate: "$doc.projectEndDate",
            projectEndDate: "$doc.projectEndDate",
            activeFlag: "$doc.activeFlag",
            deleteFlag: "$doc.deleteFlag",
            createdAt: "$doc.createdAt",
            favorite: "$doc.favorite",
            departmentDetails: "$doc.departmentDetails",
            departmentId: "$doc.departmentId",
            designationId: "$doc.designationId",
          },
        },
        {
          $sort: {
            createdAt: -1,
          },
        },
      ]);
      if (projectDetails.length > 0) {
        const moduleType = "Project";
        const customFieldList = await this.getCustomFieldList(
          SITE_DB_NAME,
          moduleType,
          0,
        );

        const enrichedProjects = projectDetails.map((project) => {
          project.customFields = project.customFields || {};

          const newCustomFields = {};

          for (const field of customFieldList) {
            const key = field.keyName;
            const valueFromProject = project.customFields[key];
            const finalValue =
              valueFromProject &&
              valueFromProject.hasOwnProperty("value") &&
              valueFromProject.value != null
                ? valueFromProject.value
                : null;

            newCustomFields[key] = {
              fieldName: field.fieldName,
              keyName: field.keyName,
              fieldType: field.fieldType,
              options: field.options,
              _id: field._id,
              moduleType: field.moduleType,
              updatedAt: field.updatedAt,
              createdAt: field.createdAt,
              activeFlag: field.activeFlag,
              deleteFlag: field.deleteFlag,
              value: finalValue,
            };
          }

          project.customFields = newCustomFields;
          return project;
        });

        return enrichedProjects[0];
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getProjectCategory:", error);
      throw new Error(error.message);
    }
  },

  async checkUpdateProject(SITE_DB_NAME, projectId, name) {
    try {
      const Project = await ProjectModel(SITE_DB_NAME);

      // Check if same name exists in other documents (excluding the current one)
      const existing = await Project.findOne({
        _id: new mongoose.Types.ObjectId(projectId), // exclude current id
        name: name,
        deleteFlag: 0,
      });

      if (existing) {
        // Duplicate name found in another workflow
        return "DUPLICATE_NAME";
      }

      // Check if the workflow with this ID exists (used for final verification)
      const projectExists = await Project.findOne({
        _id: new mongoose.Types.ObjectId(projectId),
        deleteFlag: 0,
      });

      if (!projectExists) {
        return "INVALID_ID";
      }

      // All good
      return "OK";
    } catch (error) {
      console.error("Error in checkUpdateProject:", error);
      throw new Error(error.message);
    }
  },

  async updateProjectCustomField(SITE_DB_NAME, projectId, updateData) {
    const Project = await ProjectModel(SITE_DB_NAME);
    try {
      const updateStatus = await Project.findOneAndUpdate(
        {
          _id: projectId,
        },
        {
          $set: updateData,
        },
      );

      return updateStatus || "NA";
    } catch (error) {
      console.error("Error in updateProjectCustomField:", error);
      throw new Error(error.message);
    }
  },

  async updateProject(SITE_DB_NAME, projectId, data) {
    const Project = await ProjectModel(SITE_DB_NAME);
    try {
      const updateStatus = await Project.updateOne(
        { _id: projectId },
        { $set: data },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateProject:", error);
      throw new Error(error.message);
    }
  },

  // --- SOFT DELETE (if you already have, keep it)
  async softDeleteProject(SITE_DB_NAME, projectId) {
    const Project = await ProjectModel(SITE_DB_NAME);
    const Task = await TaskModel(SITE_DB_NAME);
    const TaskList = await TaskListModel(SITE_DB_NAME);
    const ProjectBudget = await ProjectBudgetModel(SITE_DB_NAME);
    const ProjectFile = await ProjectFileModel(SITE_DB_NAME);
    const ProjectLink = await ProjectLinkModel(SITE_DB_NAME);
    const ProjectMessage = await ProjectMessageModel(SITE_DB_NAME);
    const TaskComment = await TaskCommentModel(SITE_DB_NAME);
    const TaskLogTime = await TaskLogTimeModel(SITE_DB_NAME);
    const TaskDependency = await TaskDependencyModel(SITE_DB_NAME);
    const Proof = await ProofModel(SITE_DB_NAME);

    try {
      const now = new Date();
      const tasks = await Task.find({ projectId }, { _id: 1 });
      const taskIds = tasks.map((t) => t._id);
      const update = { deleteFlag: 1, deletedAt: now };

      await Project.updateOne({ _id: projectId }, { $set: update });
      await Task.updateMany({ projectId }, { $set: update });
      await TaskList.updateMany({ projectId }, { $set: update });
      await ProjectBudget.updateMany({ projectId }, { $set: update });
      await ProjectFile.updateMany({ projectId }, { $set: update });
      await ProjectLink.updateMany({ projectId }, { $set: update });
      await ProjectMessage.updateMany({ projectId }, { $set: update });

      if (taskIds.length > 0) {
        await TaskComment.updateMany(
          { taskId: { $in: taskIds } },
          { $set: update },
        );
        await TaskLogTime.updateMany(
          { taskId: { $in: taskIds } },
          { $set: update },
        );
        await TaskDependency.updateMany(
          { taskId: { $in: taskIds } },
          { $set: update },
        );
      }

      await Proof.updateMany(
        { entityType: "Project", entityId: projectId },
        { $set: update },
      );

      const checkProject = await Project.findOne({ _id: projectId });
      if (checkProject && checkProject.deleteFlag === 1) {
        return true;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in softDeleteProject:", error);
      return "NA";
    }
  },

  // --- Find expired (DB) — returns array or "NA"
  async getExpiredSoftDeletedProjects(SITE_DB_NAME, beforeDate) {
    try {
      const Project = await ProjectModel(SITE_DB_NAME);
      const projects = await Project.find(
        { deleteFlag: 1, deletedAt: { $lte: beforeDate } },
        { _id: 1 },
      );
      if (!projects || projects.length === 0) return "NA";
      return projects;
    } catch (error) {
      console.error("Error in getExpiredSoftDeletedProjects:", error);
      throw new Error(error.message);
    }
  },

  // --- PERMANENT DELETE (re-using your existing deleteProject logic)
  // Keep the same safety checks you used earlier (safeDelete etc.)
  async permanentDeleteProject(SITE_DB_NAME, projectId) {
    const Project = await ProjectModel(SITE_DB_NAME);
    const ProjectBudget = await ProjectBudgetModel(SITE_DB_NAME);
    const ProjectLink = await ProjectLinkModel(SITE_DB_NAME);
    const ProjectFile = await ProjectFileModel(SITE_DB_NAME);
    const ProjectMessage = await ProjectMessageModel(SITE_DB_NAME);
    const TaskList = await TaskListModel(SITE_DB_NAME);
    const Task = await TaskModel(SITE_DB_NAME);
    const TaskComment = await TaskCommentModel(SITE_DB_NAME);
    const TaskLogTime = await TaskLogTimeModel(SITE_DB_NAME);
    const TaskDependency = await TaskDependencyModel(SITE_DB_NAME);
    const Proof = await ProofModel(SITE_DB_NAME);

    try {
      const tasks = await Task.find({ projectId }, { _id: 1 });
      const taskIds = tasks.map((t) => t._id);

      const safeDelete = async (Model, filter) => {
        const count = await Model.countDocuments(filter);
        if (count > 0) {
          await Model.deleteMany(filter);
        }
      };

      await safeDelete(ProjectBudget, { projectId });
      await safeDelete(ProjectLink, { projectId });
      await safeDelete(ProjectFile, { projectId });
      await safeDelete(ProjectMessage, { projectId });
      await safeDelete(TaskList, { projectId });
      await safeDelete(TaskComment, { taskId: { $in: taskIds } });
      await safeDelete(TaskLogTime, { taskId: { $in: taskIds } });
      await safeDelete(TaskDependency, { taskId: { $in: taskIds } });
      await safeDelete(Proof, { entityType: "Project", entityId: projectId });
      await safeDelete(Task, { projectId });

      const deleteResult = await Project.deleteOne({ _id: projectId });
      if (deleteResult.deletedCount > 0) return true;
      return "NA";
    } catch (error) {
      console.error("Error in permanentDeleteProject:", error);
      throw new Error(error.message);
    }
  },

  async restoreProject(SITE_DB_NAME, projectId) {
    const Project = await ProjectModel(SITE_DB_NAME);
    const Task = await TaskModel(SITE_DB_NAME);
    const TaskList = await TaskListModel(SITE_DB_NAME);
    const ProjectFile = await ProjectFileModel(SITE_DB_NAME);
    const ProjectLink = await ProjectLinkModel(SITE_DB_NAME);
    const ProjectMessage = await ProjectMessageModel(SITE_DB_NAME);
    const TaskComment = await TaskCommentModel(SITE_DB_NAME);
    const TaskLogTime = await TaskLogTimeModel(SITE_DB_NAME);
    const TaskDependency = await TaskDependencyModel(SITE_DB_NAME);
    const Proof = await ProofModel(SITE_DB_NAME);

    try {
      const project = await Project.findOne({ _id: projectId });

      if (!project || project.deleteFlag !== 1) {
        return "NA"; // project not soft-deleted
      }

      const tasks = await Task.find({ projectId }, { _id: 1 });
      const taskIds = tasks.map((t) => t._id);

      const update = { deleteFlag: 0, deletedAt: null };

      await Project.updateOne({ _id: projectId }, { $set: update });
      await Task.updateMany({ projectId }, { $set: update });
      await TaskList.updateMany({ projectId }, { $set: update });
      await ProjectFile.updateMany({ projectId }, { $set: update });
      await ProjectLink.updateMany({ projectId }, { $set: update });
      await ProjectMessage.updateMany({ projectId }, { $set: update });

      if (taskIds.length > 0) {
        await TaskComment.updateMany(
          { taskId: { $in: taskIds } },
          { $set: update },
        );
        await TaskLogTime.updateMany(
          { taskId: { $in: taskIds } },
          { $set: update },
        );
        await TaskDependency.updateMany(
          { taskId: { $in: taskIds } },
          { $set: update },
        );
      }

      await Proof.updateMany(
        { entityType: "Project", entityId: projectId },
        { $set: update },
      );

      const check = await Project.findOne({ _id: projectId });

      if (check && check.deleteFlag === 0) return true;
      return "NA";
    } catch (error) {
      console.error("Error in restoreProject:", error.message);
      return "NA";
    }
  },

  async deleteProject(SITE_DB_NAME, projectId) {
    const Project = await ProjectModel(SITE_DB_NAME);
    const ProjectBudget = await ProjectBudgetModel(SITE_DB_NAME);
    const ProjectLink = await ProjectLinkModel(SITE_DB_NAME);
    const ProjectFile = await ProjectFileModel(SITE_DB_NAME);
    const ProjectMessage = await ProjectMessageModel(SITE_DB_NAME);
    const TaskList = await TaskListModel(SITE_DB_NAME);
    const Task = await TaskModel(SITE_DB_NAME);
    const TaskComment = await TaskCommentModel(SITE_DB_NAME);
    const TaskLogTime = await TaskLogTimeModel(SITE_DB_NAME);
    const TaskDependency = await TaskDependencyModel(SITE_DB_NAME);
    const Proof = await ProofModel(SITE_DB_NAME);

    try {
      // find all tasks of this project
      const tasks = await Task.find({ projectId }, { _id: 1 });
      const taskIds = tasks.map((t) => t._id);

      // helper function: check then delete
      const safeDelete = async (Model, filter) => {
        const count = await Model.countDocuments(filter);
        if (count > 0) {
          await Model.deleteMany(filter);
        }
      };

      // delete related data (only if exists)
      await safeDelete(ProjectBudget, { projectId });
      await safeDelete(ProjectLink, { projectId });
      await safeDelete(ProjectFile, { projectId });
      await safeDelete(ProjectMessage, { projectId });
      await safeDelete(TaskList, { projectId });
      await safeDelete(TaskComment, { projectId });
      await safeDelete(TaskLogTime, { projectId });

      // TaskDependency depends on taskId
      if (taskIds.length > 0) {
        await safeDelete(TaskDependency, { taskId: { $in: taskIds } });
      }

      // Proof where entityType = Project
      await safeDelete(Proof, {
        entityType: "Project",
        entityId: projectId,
      });

      // Delete Tasks (only if exists)
      await safeDelete(Task, { projectId });

      // Finally delete Project
      const deleteResult = await Project.deleteOne({ _id: projectId });

      if (deleteResult.deletedCount > 0) {
        return true;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in deleteProject:", error);
      throw new Error(error.message);
    }
  },

  // async deleteProject(SITE_DB_NAME, projectId) {
  //   const Project = await ProjectModel(SITE_DB_NAME);
  //   const ProjectBudget = await ProjectBudgetModel(SITE_DB_NAME);
  //   const ProjectLink = await ProjectLinkModel(SITE_DB_NAME);
  //   const ProjectFile = await ProjectFileModel(SITE_DB_NAME);
  //   const ProjectMessage = await ProjectMessageModel(SITE_DB_NAME);
  //   const TaskList = await TaskListModel(SITE_DB_NAME);
  //   const Task = await TaskModel(SITE_DB_NAME);
  //   const TaskComment = await TaskCommentModel(SITE_DB_NAME);
  //   const TaskLogTime = await TaskLogTimeModel(SITE_DB_NAME);
  //   const TaskDependency = await TaskDependencyModel(SITE_DB_NAME);
  //   const Proof = await ProofModel(SITE_DB_NAME);

  //   try {
  //     //  find all tasks of this project
  //     const tasks = await Task.find({ projectId: projectId }, { _id: 1 });
  //     const taskIds = tasks.map((t) => t._id);

  //     //  delete all related data
  //     await ProjectBudget.deleteMany({ projectId });
  //     await ProjectLink.deleteMany({ projectId });
  //     await ProjectFile.deleteMany({ projectId });
  //     await ProjectMessage.deleteMany({ projectId });
  //     await TaskList.deleteMany({ projectId });
  //     await TaskComment.deleteMany({ projectId });
  //     await TaskLogTime.deleteMany({ projectId });

  //     // TaskDependency depends on taskId
  //     if (taskIds.length > 0) {
  //       await TaskDependency.deleteMany({ taskId: { $in: taskIds } });
  //     }

  //     // Proof where entityType = Project
  //     await Proof.deleteMany({
  //       entityType: "Project",
  //       entityId: projectId,
  //     });

  //     // Delete Tasks
  //     await Task.deleteMany({ projectId });

  //     // Finally delete Project
  //     const deleteResult = await Project.deleteOne({ _id: projectId });

  //     if (deleteResult.deletedCount > 0) {
  //       return true;
  //     } else {
  //       return "NA";
  //     }
  //   } catch (error) {
  //     console.error("Error in deleteProject:", error);
  //     throw new Error(error.message);
  //   }
  // },

  // async deleteProject(SITE_DB_NAME, projectId) {
  //   const Project = await ProjectModel(SITE_DB_NAME);
  //   try {
  //     const deleteResult = await Project.deleteOne({ _id: projectId });
  //     if (deleteResult) {
  //       return true;
  //     } else {
  //       return "NA";
  //     }
  //   } catch (error) {
  //     console.error("Error in deleteProject:", error);
  //     throw new Error(error.message);
  //   }
  // },

  async updateForTagProject(SITE_DB_NAME, projectId, data) {
    const Project = await ProjectModel(SITE_DB_NAME);
    try {
      const updateStatus = await Project.updateOne({ _id: projectId }, data, {
        upsert: false,
      });
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateProject:", error);
      throw new Error(error.message);
    }
  },

  async getProjectTags(SITE_DB_NAME, projectId) {
    const Project = await ProjectModel(SITE_DB_NAME);
    try {
      const result = await Project.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(projectId),
            deleteFlag: 0,
          },
        },
        {
          $lookup: {
            from: "tags", // ya "Tags" agar collection name uppercase hai
            localField: "tagIds",
            foreignField: "_id",
            as: "tags",
          },
        },
        {
          $project: {
            tags: {
              $map: {
                input: "$tags",
                as: "tag",
                in: {
                  _id: "$$tag._id",
                  name: "$$tag.name",
                  color: "$$tag.color",
                },
              },
            },
          },
        },
      ]);

      if (result.length > 0) {
        return result[0];
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getProjectTags:", error);
      throw new Error(error.message);
    }
  },

  async getAllProject(
    SITE_DB_NAME,
    deleteFlag,
    pagination,
    search,
    status,
    byCompany,
    byUser,
    byProjectId,
    currentUser,
    userRoleName,
  ) {
    const Project = await ProjectModel(SITE_DB_NAME);
    try {
      const { pageSize, pageNumber } = pagination;
      const skip = (pageNumber - 1) * pageSize;

      const matchConditions = { deleteFlag: deleteFlag };

      // ---------------------------
      // RBAC: restrict projects for non-owners/non-admins
      // ---------------------------
      const privilegedRoles = ["Site-Owner", "Admin"];
      const isPrivileged =
        userRoleName && privilegedRoles.includes(userRoleName);
      const currentUserId = currentUser;

      // Add status filter if provided
      if (status && status !== "All") {
        matchConditions.status = status;
      }

      if (byCompany) {
        matchConditions.companyId = new mongoose.Types.ObjectId(byCompany);
      }

      if (byUser && isPrivileged) {
        matchConditions.peopleIds = {
          $in: [new mongoose.Types.ObjectId(byUser)],
        };
      }

      if (byProjectId) {
        matchConditions._id = new mongoose.Types.ObjectId(byProjectId);
      }

      if (byUser && isPrivileged) {
        matchConditions.peopleIds = {
          $in: [new mongoose.Types.ObjectId(byUser)],
        };
      }

      // ---------------------------
      // RBAC: restrict projects for non-owners/non-admins
      // ---------------------------

      if (!isPrivileged) {
        if (!currentUserId) {
          return "NA";
        }

        // Build an $or condition
        const userOid = new mongoose.Types.ObjectId(currentUserId);
        matchConditions.$or = [
          { peopleIds: { $in: [userOid] } },
          { notifyIds: { $in: [userOid] } },
          { ownerId: userOid },
          { createdById: userOid },
        ];

        // IMPORTANT: if caller ALSO passed byUser (explicit filter) and it's different from current user,
        // we should NOT allow normal user to fetch other user's projects.
        // So if byUser is present and not equal current user, return NA early.
        if (
          byUser &&
          new mongoose.Types.ObjectId(byUser).toString() !== userOid.toString()
        ) {
          return "NA";
        }
      }
      // ---------------------------
      const pipeline = [
        {
          $match: matchConditions,
        },
        // Join owner details
        {
          $lookup: {
            from: "users",
            let: { ownerId: "$ownerId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$ownerId"] } } },
              { $project: { name: 1, image: 1, roleName: 1 } },
            ],
            as: "ownerDetails",
          },
        },
        {
          $unwind: { path: "$ownerDetails", preserveNullAndEmptyArrays: true },
        },

        // Join company
        // Join company details (FIXED)
        {
          $lookup: {
            from: "companies", // ✅ Correct collection
            let: { companyId: "$companyId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$companyId"] },
                },
              },
              {
                $project: {
                  _id: 1,
                  companyName: 1,
                  companyLogo: 1,
                  companyType: 1,
                },
              },
            ],
            as: "companyDetails",
          },
        },
        {
          $unwind: {
            path: "$companyDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // Join workflow
        {
          $lookup: {
            from: "workflows",
            let: { workflowId: "$workflowId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$workflowId"] },
                },
              },
              {
                $project: {
                  name: 1,
                  stages: 1,
                },
              },
            ],
            as: "workflowDetails",
          },
        },
        {
          $unwind: {
            path: "$workflowDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // Join people
        {
          $lookup: {
            from: "users",
            let: { ids: "$peopleIds" },
            pipeline: [
              { $match: { $expr: { $in: ["$_id", "$$ids"] } } },
              { $project: { name: 1, image: 1, roleName: 1 } },
            ],
            as: "peopleDetails",
          },
        },

        // Join notify users
        {
          $lookup: {
            from: "users",
            let: { ids: "$notifyIds" },
            pipeline: [
              { $match: { $expr: { $in: ["$_id", "$$ids"] } } },
              { $project: { name: 1, image: 1, roleName: 1 } },
            ],
            as: "notifyDetails",
          },
        },

        // createdBy user
        {
          $lookup: {
            from: "users",
            let: { createdById: "$createdById" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$createdById"] },
                },
              },
              {
                $project: {
                  name: 1,
                  image: 1,
                  roleName: 1,
                },
              },
            ],
            as: "createdByDetails",
          },
        },
        {
          $unwind: {
            path: "$createdByDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // Join tags
        {
          $lookup: {
            from: "tags",
            localField: "tagIds",
            foreignField: "_id",
            as: "tagsList",
          },
        },

        // Join project category
        {
          $lookup: {
            from: "projectcategories",
            let: { id: "$projectCategoryId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
              { $project: { name: 1 } },
            ],
            as: "projectCategoryDetails",
          },
        },
        {
          $unwind: {
            path: "$projectCategoryDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // Join project subcategory
        {
          $lookup: {
            from: "projectsubcategories",
            let: { id: "$projectSubCategoryId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
              { $project: { name: 1 } },
            ],
            as: "projectSubCategoryDetails",
          },
        },
        {
          $unwind: {
            path: "$projectSubCategoryDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // Join project budget
        {
          $lookup: {
            from: "projectbudgets",
            let: { projectId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$projectId", "$$projectId"] } } },
              {
                $project: {
                  budgetName: 1,
                  budgetType: 1,
                  budgetAmountType: 1,
                  budgetAmount: 1,
                  budgetRepeats: 1,
                  budgetStartDate: 1,
                  budgetEndDate: 1,
                  budgetBasedOn: 1,
                  retainerOption: 1,
                  financialTarget: 1,
                },
              },
            ],
            as: "projectBudget",
          },
        },
        {
          $unwind: { path: "$projectBudget", preserveNullAndEmptyArrays: true },
        },

        // Sort & pagination
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
      ];

      // Search filter
      if (search && search.trim() !== "") {
        pipeline.push({
          $match: {
            $or: [
              { name: { $regex: search, $options: "i" } },
              {
                "companyDetails.companyName": { $regex: search, $options: "i" },
              },
              { "ownerDetails.name": { $regex: search, $options: "i" } },
            ],
          },
        });
      }

      const projects = await Project.aggregate(pipeline);

      if (projects.length > 0) {
        const moduleType = "Project";
        const customFieldList = await this.getCustomFieldList(
          SITE_DB_NAME,
          moduleType,
          0,
        );

        const enrichedProjects = projects.map((project) => {
          project.customFields = project.customFields || {};

          const newCustomFields = {};

          for (const field of customFieldList) {
            const key = field.keyName;

            newCustomFields[key] = {
              fieldName: field.fieldName,
              keyName: field.keyName,
              fieldType: field.fieldType,
              options: field.options,
              _id: field._id,
              moduleType: field.moduleType,
              updatedAt: field.updatedAt,
              createdAt: field.createdAt,
              activeFlag: field.activeFlag,
              deleteFlag: field.deleteFlag,
              value: project.customFields[key]
                ? project.customFields[key].value
                : null,
            };
          }

          project.customFields = newCustomFields;
          return project;
        });
        return enrichedProjects;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("Database error from getAllProject:", error.message);
      throw new Error(error.message);
    }
  },

  async editProjectBudget(SITE_DB_NAME, budgetId, budgetData) {
    const ProjectBudget = await ProjectBudgetModel(SITE_DB_NAME);
    try {
      const updateStatus = await ProjectBudget.updateOne(
        { _id: budgetId },
        { $set: budgetData },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in editProjectBudget:", error);
      throw new Error(error.message);
    }
  },

  async createProjectLink(SITE_DB_NAME, data) {
    const ProjectLink = await ProjectLinkModel(SITE_DB_NAME);
    try {
      const createLinkData = await ProjectLink.create(data);
      if (createLinkData) {
        return createLinkData;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createProjectLink:", error);
      throw new Error(error.message);
    }
  },

  async getProjectLink(SITE_DB_NAME, projectLinkId) {
    const ProjectLink = await ProjectLinkModel(SITE_DB_NAME);
    try {
      const linkDetails = await ProjectLink.findOne({
        _id: projectLinkId,
        deleteFlag: 0,
      });

      if (linkDetails) {
        return linkDetails;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getProjectLink:", error);
      throw new Error(error.message);
    }
  },

  async checkProjectLinkId(SITE_DB_NAME, projectLinkId) {
    const ProjectLink = await ProjectLinkModel(SITE_DB_NAME);
    try {
      const existing = await ProjectLink.findOne({
        deleteFlag: 0,
        _id: new mongoose.Types.ObjectId(projectLinkId),
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkProjectLinkId:", error);
      throw new Error(error.message);
    }
  },

  async updateProjectLink(SITE_DB_NAME, prjectLinkId, projectLinkData) {
    const ProjectLink = await ProjectLinkModel(SITE_DB_NAME);
    try {
      const updateStatus = await ProjectLink.updateOne(
        { _id: prjectLinkId },
        { $set: projectLinkData },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateProjectLink:", error);
      throw new Error(error.message);
    }
  },

  async getAllProjectLink(SITE_DB_NAME, deleteFlag, projectId, pagination) {
    const ProjectLink = await ProjectLinkModel(SITE_DB_NAME);

    try {
      const pageSize =
        Number(pagination?.pageSize) > 0 ? Number(pagination.pageSize) : 10;
      const pageNumber =
        Number(pagination?.pageNumber) > 0 ? Number(pagination.pageNumber) : 1;

      const skip = (pageNumber - 1) * pageSize;

      const pipeline = [
        {
          $match: {
            deleteFlag: deleteFlag,
            projectId: projectId,
          },
        },

        // createdBy user details
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdByDetails",
          },
        },
        {
          $unwind: {
            path: "$createdByDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // privacyPeopleIds
        {
          $lookup: {
            from: "users",
            localField: "privacyPeopleIds",
            foreignField: "_id",
            as: "privacyPeopleDetails",
          },
        },

        // notify users
        {
          $lookup: {
            from: "users",
            localField: "notifyIds",
            foreignField: "_id",
            as: "notifyDetails",
          },
        },

        // tags
        {
          $lookup: {
            from: "tags",
            localField: "tagIds",
            foreignField: "_id",
            as: "tagsList",
          },
        },

        // project category
        {
          $lookup: {
            from: "projectcategories",
            localField: "projectCategoryId",
            foreignField: "_id",
            as: "projectCategoryDetails",
          },
        },
        {
          $unwind: {
            path: "$projectCategoryDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // project subcategory
        {
          $lookup: {
            from: "projectsubcategories",
            localField: "projectSubCategoryId",
            foreignField: "_id",
            as: "projectSubCategoryDetails",
          },
        },
        {
          $unwind: {
            path: "$projectSubCategoryDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // comment replies join
        {
          $lookup: {
            from: "commentreplays",
            let: { linkId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$entityId", "$$linkId"] },
                      { $eq: ["$entityType", "Link"] },
                      { $eq: ["$deleteFlag", 0] },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "createdBy",
                  foreignField: "_id",
                  as: "createdByUser",
                },
              },
              {
                $unwind: {
                  path: "$createdByUser",
                  preserveNullAndEmptyArrays: true,
                },
              },

              {
                $lookup: {
                  from: "users",
                  localField: "notifyIds",
                  foreignField: "_id",
                  as: "notifyUsers",
                },
              },

              {
                $project: {
                  _id: 1,
                  commentReplayText: 1,
                  files: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  createdBy: {
                    _id: "$createdByUser._id",
                    name: "$createdByUser.name",
                    image: "$createdByUser.image",
                  },
                  notifyUsers: {
                    $map: {
                      input: "$notifyUsers",
                      as: "n",
                      in: {
                        _id: "$$n._id",
                        name: "$$n.name",
                        image: "$$n.image",
                      },
                    },
                  },
                },
              },
            ],
            as: "commentReplies",
          },
        },

        // final projection
        {
          $project: {
            _id: 1,
            projectId: 1,
            title: 1,
            message: 1,
            link: 1,
            createdAt: 1,
            updatedAt: 1,

            createdBy: "$createdByDetails._id",
            createdByName: "$createdByDetails.name",
            createdByImage: "$createdByDetails.image",

            privacyPeople: {
              $map: {
                input: "$privacyPeopleDetails",
                as: "p",
                in: { _id: "$$p._id", name: "$$p.name", image: "$$p.image" },
              },
            },

            notifyUsers: {
              $map: {
                input: "$notifyDetails",
                as: "n",
                in: { _id: "$$n._id", name: "$$n.name", image: "$$n.image" },
              },
            },

            tagsList: {
              $map: {
                input: "$tagsList",
                as: "t",
                in: { _id: "$$t._id", tagName: "$$t.tagName" },
              },
            },

            projectCategory: {
              _id: "$projectCategoryDetails._id",
              name: "$projectCategoryDetails.categoryName",
            },
            projectSubCategory: {
              _id: "$projectSubCategoryDetails._id",
              name: "$projectSubCategoryDetails.subCategoryName",
            },

            commentReplies: 1,
          },
        },

        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
      ];

      const result = await ProjectLink.aggregate(pipeline);
      return result?.length > 0 ? result : [];
    } catch (error) {
      console.log("Database error from getAllProjectLink:", error.message);
      throw new Error(error.message);
    }
  },

  async checkDeleteProjectLink(SITE_DB_NAME, projectLinkId) {
    try {
      const ProjectLink = await ProjectLinkModel(SITE_DB_NAME);
      const existing = await ProjectLink.findOne({
        deleteFlag: 0,
        _id: new mongoose.Types.ObjectId(projectLinkId),
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkDeleteProjectLink:", error);
      throw new Error(error.message);
    }
  },

  async deleteProjectLink(SITE_DB_NAME, projectLinkId) {
    const ProjectLink = await ProjectLinkModel(SITE_DB_NAME);
    try {
      const deleteResult = await ProjectLink.deleteOne({ _id: projectLinkId });
      if (deleteResult) {
        return true;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in deleteProjectLink:", error);
      throw new Error(error.message);
    }
  },

  async createProjectMessage(SITE_DB_NAME, data) {
    const ProjectMessage = await ProjectMessageModel(SITE_DB_NAME);
    try {
      const createLinkData = await ProjectMessage.create(data);
      if (createLinkData) {
        return createLinkData;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createProjectMessage:", error);
      throw new Error(error.message);
    }
  },

  async getProjectMessage(SITE_DB_NAME, projectMessageId) {
    const ProjectMessage = await ProjectMessageModel(SITE_DB_NAME);
    try {
      const linkDetails = await ProjectMessage.findOne({
        _id: projectMessageId,
        deleteFlag: 0,
      });

      if (linkDetails) {
        return linkDetails;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getProjectMessage:", error);
      throw new Error(error.message);
    }
  },

  async getAllProjectMessage(
    SITE_DB_NAME,
    deleteFlag,
    projectId,
    pagination,
    search,
  ) {
    const ProjectMessage = await ProjectMessageModel(SITE_DB_NAME);

    try {
      const pageSize =
        Number(pagination?.pageSize) > 0 ? Number(pagination.pageSize) : 10;
      const pageNumber =
        Number(pagination?.pageNumber) > 0 ? Number(pagination.pageNumber) : 1;

      const skip = (pageNumber - 1) * pageSize;

      const matchStage = {
        deleteFlag: deleteFlag,
        projectId: projectId,
      };

      if (search && search.trim() !== "") {
        matchStage.title = { $regex: search, $options: "i" };
      }

      const pipeline = [
        {
          $match: matchStage,
        },

        // Project join (for project name + company)
        {
          $lookup: {
            from: "projects",
            localField: "projectId",
            foreignField: "_id",
            as: "projectDetails",
          },
        },
        {
          $unwind: {
            path: "$projectDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // Company join
        {
          $lookup: {
            from: "companies",
            localField: "projectDetails.companyId",
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

        // createdBy user details
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdByDetails",
          },
        },
        {
          $unwind: {
            path: "$createdByDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // privacyPeopleIds
        {
          $lookup: {
            from: "users",
            localField: "privacyPeopleIds",
            foreignField: "_id",
            as: "privacyPeopleDetails",
          },
        },

        // notify users
        {
          $lookup: {
            from: "users",
            localField: "notifyIds",
            foreignField: "_id",
            as: "notifyDetails",
          },
        },

        // tags join (id + name + color)
        {
          $lookup: {
            from: "tags",
            localField: "tagIds",
            foreignField: "_id",
            as: "tagsList",
          },
        },

        // project category
        {
          $lookup: {
            from: "projectcategories",
            localField: "projectCategoryId",
            foreignField: "_id",
            as: "projectCategoryDetails",
          },
        },
        {
          $unwind: {
            path: "$projectCategoryDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // project subcategory
        {
          $lookup: {
            from: "projectsubcategories",
            localField: "projectSubCategoryId",
            foreignField: "_id",
            as: "projectSubCategoryDetails",
          },
        },
        {
          $unwind: {
            path: "$projectSubCategoryDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // comment replies join
        {
          $lookup: {
            from: "commentreplays",
            let: { messageId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$entityId", "$$messageId"] },
                      { $eq: ["$entityType", "Message"] },
                      { $eq: ["$deleteFlag", 0] },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "createdBy",
                  foreignField: "_id",
                  as: "createdByUser",
                },
              },
              {
                $unwind: {
                  path: "$createdByUser",
                  preserveNullAndEmptyArrays: true,
                },
              },

              {
                $lookup: {
                  from: "users",
                  localField: "notifyIds",
                  foreignField: "_id",
                  as: "notifyUsers",
                },
              },

              {
                $project: {
                  _id: 1,
                  commentReplayText: 1,
                  files: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  createdBy: {
                    _id: "$createdByUser._id",
                    name: "$createdByUser.name",
                    image: "$createdByUser.image",
                  },
                  notifyUsers: {
                    $map: {
                      input: "$notifyUsers",
                      as: "n",
                      in: {
                        _id: "$$n._id",
                        name: "$$n.name",
                        image: "$$n.image",
                      },
                    },
                  },
                },
              },
            ],
            as: "commentReplies",
          },
        },

        // final projection
        {
          $project: {
            _id: 1,
            projectId: 1,
            project: {
              _id: "$projectDetails._id",
              name: "$projectDetails.name",
            },
            company: {
              _id: "$companyDetails._id",
              name: "$companyDetails.companyName",
            },
            title: 1,
            message: 1,
            files: 1,
            createdAt: 1,
            updatedAt: 1,

            createdBy: {
              _id: "$createdByDetails._id",
              name: "$createdByDetails.name",
              image: "$createdByDetails.image",
            },

            privacyPeople: {
              $map: {
                input: "$privacyPeopleDetails",
                as: "p",
                in: { _id: "$$p._id", name: "$$p.name", image: "$$p.image" },
              },
            },

            notifyUsers: {
              $map: {
                input: "$notifyDetails",
                as: "n",
                in: { _id: "$$n._id", name: "$$n.name", image: "$$n.image" },
              },
            },

            tagsList: {
              $map: {
                input: "$tagsList",
                as: "t",
                in: {
                  _id: "$$t._id",
                  name: "$$t.name",
                  color: "$$t.color",
                },
              },
            },

            projectCategory: {
              _id: "$projectCategoryDetails._id",
              name: "$projectCategoryDetails.name",
            },
            projectSubCategory: {
              _id: "$projectSubCategoryDetails._id",
              name: "$projectSubCategoryDetails.name",
            },

            commentReplies: 1,
          },
        },

        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
      ];

      const result = await ProjectMessage.aggregate(pipeline);
      return result?.length > 0 ? result : [];
    } catch (error) {
      console.log("Database error from getAllProjectMessage:", error.message);
      throw new Error(error.message);
    }
  },

  async checkProjectMessageId(SITE_DB_NAME, projectMessageId) {
    const ProjectMessage = await ProjectMessageModel(SITE_DB_NAME);
    try {
      const existing = await ProjectMessage.findOne({
        deleteFlag: 0,
        _id: new mongoose.Types.ObjectId(projectMessageId),
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkProjectMessageId:", error);
      throw new Error(error.message);
    }
  },

  async checkDeleteProjectMessageId(SITE_DB_NAME, projectMessageId) {
    try {
      const ProjectMessage = await ProjectMessageModel(SITE_DB_NAME);
      const existing = await ProjectMessage.findOne({
        deleteFlag: 0,
        _id: new mongoose.Types.ObjectId(projectMessageId),
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkDeleteProjectMessageId:", error);
      throw new Error(error.message);
    }
  },

  async createProjectUpdate(SITE_DB_NAME, data) {
    const ProjectUpdate = await ProjectUpdateModel(SITE_DB_NAME);
    try {
      const createData = await ProjectUpdate.create(data);
      if (createData) {
        return createData;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createProjectUpdate:", error);
      throw new Error(error.message);
    }
  },

  async getAllProjectUpdate(
    SITE_DB_NAME,
    deleteFlag,
    projectId,
    pagination,
    search,
  ) {
    const ProjectUpdate = await ProjectUpdateModel(SITE_DB_NAME);

    try {
      const pageSize =
        Number(pagination?.pageSize) > 0 ? Number(pagination.pageSize) : 10;
      const pageNumber =
        Number(pagination?.pageNumber) > 0 ? Number(pagination.pageNumber) : 1;

      const skip = (pageNumber - 1) * pageSize;

      const matchStage = {
        deleteFlag: deleteFlag,
        projectId: new mongoose.Types.ObjectId(projectId),
      };

      const pipeline = [
        { $match: matchStage },

        /* ---------------- PROJECT ---------------- */
        {
          $lookup: {
            from: "projects",
            localField: "projectId",
            foreignField: "_id",
            as: "project",
            pipeline: [{ $project: { _id: 1, name: 1, companyId: 1 } }],
          },
        },
        { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },

        /* ---------------- CREATED BY ---------------- */
        {
          $lookup: {
            from: "users",
            localField: "createdById",
            foreignField: "_id",
            as: "createdBy",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  roleName: 1,
                  designationName: 1,
                  image: 1,
                  email: 1,
                },
              },
            ],
          },
        },
        { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },

        /* ---------------- PEOPLE ---------------- */
        {
          $lookup: {
            from: "users",
            localField: "peopleIds",
            foreignField: "_id",
            as: "people",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  roleName: 1,
                  designationName: 1,
                  image: 1,
                  email: 1,
                },
              },
            ],
          },
        },

        /* ---------------- NOTIFY USERS ---------------- */
        {
          $lookup: {
            from: "users",
            localField: "notifyIds",
            foreignField: "_id",
            as: "notifyUsers",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  roleName: 1,
                  designationName: 1,
                  image: 1,
                  email: 1,
                },
              },
            ],
          },
        },

        /* ---------------- REACTION USERS ---------------- */
        {
          $lookup: {
            from: "users",
            localField: "reactions.users.userId",
            foreignField: "_id",
            as: "reactionUsers",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  roleName: 1,
                  designationName: 1,
                  image: 1,
                  email: 1,
                },
              },
            ],
          },
        },

        /* ---------------- MAP REACTIONS ---------------- */
        {
          $addFields: {
            reactions: {
              $map: {
                input: "$reactions",
                as: "r",
                in: {
                  emoji: "$$r.emoji",
                  count: "$$r.count",
                  users: {
                    $map: {
                      input: "$$r.users",
                      as: "u",
                      in: {
                        user: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$reactionUsers",
                                as: "ru",
                                cond: { $eq: ["$$ru._id", "$$u.userId"] },
                              },
                            },
                            0,
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },

        /* ---------------- SEARCH ---------------- */
        ...(search && search.trim() !== ""
          ? [
              {
                $match: {
                  $or: [
                    // { description: { $regex: search, $options: "i" } },
                    { "people.name": { $regex: search, $options: "i" } },
                    // { "createdBy.name": { $regex: search, $options: "i" } },
                  ],
                },
              },
            ]
          : []),

        /* ---------------- FINAL PROJECT ---------------- */
        {
          $project: {
            projectId: 0,
            createdById: 0,
            peopleIds: 0,
            notifyIds: 0,
            "reactions.users.userId": 0,
            reactionUsers: 0,
          },
        },

        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
      ];

      const result = await ProjectUpdate.aggregate(pipeline);
      return result?.length > 0 ? result : [];
    } catch (error) {
      console.log("Database error from getAllProjectUpdate:", error.message);
      throw new Error(error.message);
    }
  },

  async updateProjectUpdate(SITE_DB_NAME, projectUpdateId, data) {
    const ProjectUpdate = await ProjectUpdateModel(SITE_DB_NAME);
    try {
      const updateStatus = await ProjectUpdate.updateOne(
        { _id: projectUpdateId },
        { $set: data },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateProjectUpdate:", error);
      throw new Error(error.message);
    }
  },

  async updateProjectUpdateReaction(SITE_DB_NAME, projectUpdateId, data) {
    const ProjectUpdate = await ProjectUpdateModel(SITE_DB_NAME);

    try {
      const { emoji, userId } = data;
      const projectUpdate = await ProjectUpdate.findById(projectUpdateId);

      if (!projectUpdate) {
        return "NA";
      }

      let reactions = projectUpdate.reactions || [];

      let userOldReactionIndex = -1;
      let oldEmojiIndex = -1;

      reactions.forEach((reaction, rIndex) => {
        const userIndex = reaction.users.findIndex(
          (u) => u.userId.toString() === userId.toString(),
        );
        if (userIndex !== -1) {
          userOldReactionIndex = userIndex;
          oldEmojiIndex = rIndex;
        }
      });

      // agar pehle se reaction hai
      if (oldEmojiIndex !== -1) {
        const oldEmoji = reactions[oldEmojiIndex].emoji;

        // same emoji → kuch change nahi
        if (oldEmoji === emoji) {
          return projectUpdate;
        }

        reactions[oldEmojiIndex].users.splice(userOldReactionIndex, 1);
        reactions[oldEmojiIndex].count -= 1;

        if (reactions[oldEmojiIndex].count <= 0) {
          reactions.splice(oldEmojiIndex, 1);
        }
      }

      // naya emoji add karo
      let newEmojiIndex = reactions.findIndex((r) => r.emoji === emoji);

      if (newEmojiIndex === -1) {
        reactions.push({
          emoji: emoji,
          count: 1,
          users: [{ userId }],
        });
      } else {
        reactions[newEmojiIndex].users.push({ userId });
        reactions[newEmojiIndex].count += 1;
      }

      projectUpdate.reactions = reactions;

      const updateStatus = await projectUpdate.save();

      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateProjectUpdateReaction:", error);
      throw new Error(error.message);
    }
  },

  async projectUpdateReactionRemove(SITE_DB_NAME, projectUpdateId, data) {
    const ProjectUpdate = await ProjectUpdateModel(SITE_DB_NAME);

    try {
      const { emoji, userId } = data;
      const projectUpdate = await ProjectUpdate.findById(projectUpdateId);

      if (!projectUpdate) {
        return "NA";
      }

      let reactions = projectUpdate.reactions || [];

      // find emoji index
      const emojiIndex = reactions.findIndex((r) => r.emoji === emoji);
      if (emojiIndex === -1) {
        // emoji not present at all
        return "NA";
      }

      // find user inside that emoji users array
      const userIndex = reactions[emojiIndex].users.findIndex(
        (u) => u.userId && u.userId.toString() === userId.toString(),
      );

      if (userIndex === -1) {
        // user had not reacted with this emoji
        return "NA";
      }

      // remove the user
      reactions[emojiIndex].users.splice(userIndex, 1);
      reactions[emojiIndex].count = Math.max(
        0,
        (reactions[emojiIndex].count || 1) - 1,
      );

      // if count 0 -> remove the whole emoji entry
      if (reactions[emojiIndex].count <= 0) {
        reactions.splice(emojiIndex, 1);
      }

      projectUpdate.reactions = reactions;

      const updateStatus = await projectUpdate.save();

      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in projectUpdateReactionRemove:", error);
      throw new Error(error.message);
    }
  },

  async getProjectUpdate(SITE_DB_NAME, projectUpdateId) {
    const ProjectUpdate = await ProjectUpdateModel(SITE_DB_NAME);
    try {
      const details = await ProjectUpdate.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(projectUpdateId),
            deleteFlag: 0,
          },
        },

        /* ---------------- PROJECT LOOKUP ---------------- */
        {
          $lookup: {
            from: "projects",
            localField: "projectId",
            foreignField: "_id",
            as: "project",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  companyId: 1,
                },
              },
            ],
          },
        },
        { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },

        /* ---------------- CREATED BY USER ---------------- */
        {
          $lookup: {
            from: "users",
            localField: "createdById",
            foreignField: "_id",
            as: "createdBy",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  roleName: 1,
                  designationName: 1,
                  image: 1,
                  email: 1,
                },
              },
            ],
          },
        },
        { $unwind: { path: "$createdBy", preserveNullAndEmptyArrays: true } },

        /* ---------------- PEOPLE IDS ---------------- */
        {
          $lookup: {
            from: "users",
            localField: "peopleIds",
            foreignField: "_id",
            as: "people",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  roleName: 1,
                  designationName: 1,
                  image: 1,
                  email: 1,
                },
              },
            ],
          },
        },

        /* ---------------- NOTIFY IDS ---------------- */
        {
          $lookup: {
            from: "users",
            localField: "notifyIds",
            foreignField: "_id",
            as: "notifyUsers",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  roleName: 1,
                  designationName: 1,
                  image: 1,
                  email: 1,
                },
              },
            ],
          },
        },

        /* ---------------- REACTION USERS ---------------- */
        {
          $lookup: {
            from: "users",
            localField: "reactions.users.userId",
            foreignField: "_id",
            as: "reactionUsers",
            pipeline: [
              {
                $project: {
                  _id: 1,
                  name: 1,
                  roleName: 1,
                  designationName: 1,
                  image: 1,
                  email: 1,
                },
              },
            ],
          },
        },

        /* ---------------- MAP REACTION USERS ---------------- */
        {
          $addFields: {
            reactions: {
              $map: {
                input: "$reactions",
                as: "r",
                in: {
                  emoji: "$$r.emoji",
                  count: "$$r.count",
                  users: {
                    $map: {
                      input: "$$r.users",
                      as: "u",
                      in: {
                        user: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$reactionUsers",
                                as: "ru",
                                cond: { $eq: ["$$ru._id", "$$u.userId"] },
                              },
                            },
                            0,
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },

        /* ---------------- FINAL PROJECT ---------------- */
        {
          $project: {
            projectId: 0,
            createdById: 0,
            peopleIds: 0,
            notifyIds: 0,
            "reactions.users.userId": 0,
            reactionUsers: 0,
          },
        },
      ]);

      if (details.length > 0) {
        return details[0];
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getProjectUpdate:", error);
      throw new Error(error.message);
    }
  },

  async deleteProjectUpdate(SITE_DB_NAME, projectUpdateId) {
    const ProjectUpdate = await ProjectUpdateModel(SITE_DB_NAME);
    try {
      const deleteResult = await ProjectUpdate.deleteOne({
        _id: projectUpdateId,
      });
      if (deleteResult) {
        return true;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in deleteProjectUpdate:", error);
      throw new Error(error.message);
    }
  },
  // async createProjectFiles(SITE_DB_NAME, data) {
  //   const ProjectFile = await ProjectFileModel(SITE_DB_NAME);
  //   try {
  //     const createFileData = await ProjectFile.create(data);
  //     if (createFileData) {
  //       return createFileData;
  //     } else {
  //       return "NA";
  //     }
  //   } catch (error) {
  //     console.error("Error in createProjectFiles:", error);
  //     throw new Error(error.message);
  //   }
  // },

  async createProjectFilesBulk(SITE_DB_NAME, dataArray) {
    const ProjectFile = await ProjectFileModel(SITE_DB_NAME);
    try {
      if (!Array.isArray(dataArray) || dataArray.length === 0) {
        return "NA";
      }
      // insertMany is faster for multiple docs
      const created = await ProjectFile.insertMany(dataArray);
      if (created && created.length > 0) {
        return created;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createProjectFilesBulk:", error);
      throw new Error(error.message);
    }
  },

  async getAllProjectFiles(SITE_DB_NAME, deleteFlag, projectId, pagination) {
    const ProjectFile = await ProjectFileModel(SITE_DB_NAME);

    try {
      const pageSize =
        Number(pagination?.pageSize) > 0 ? Number(pagination.pageSize) : 10;
      const pageNumber =
        Number(pagination?.pageNumber) > 0 ? Number(pagination.pageNumber) : 1;

      const skip = (pageNumber - 1) * pageSize;

      const pipeline = [
        {
          $match: {
            deleteFlag: deleteFlag,
            projectId: projectId,
          },
        },

        // createdBy user details
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "createdByDetails",
          },
        },
        {
          $unwind: {
            path: "$createdByDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // privacyPeopleIds
        {
          $lookup: {
            from: "users",
            localField: "privacyPeopleIds",
            foreignField: "_id",
            as: "privacyPeopleDetails",
          },
        },

        // notify users
        {
          $lookup: {
            from: "users",
            localField: "notifyIds",
            foreignField: "_id",
            as: "notifyDetails",
          },
        },

        // tags
        {
          $lookup: {
            from: "tags",
            localField: "tagIds",
            foreignField: "_id",
            as: "tagsList",
          },
        },

        // project category
        {
          $lookup: {
            from: "projectcategories",
            localField: "projectCategoryId",
            foreignField: "_id",
            as: "projectCategoryDetails",
          },
        },
        {
          $unwind: {
            path: "$projectCategoryDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // project subcategory
        {
          $lookup: {
            from: "projectsubcategories",
            localField: "projectSubCategoryId",
            foreignField: "_id",
            as: "projectSubCategoryDetails",
          },
        },
        {
          $unwind: {
            path: "$projectSubCategoryDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // comment replies join
        {
          $lookup: {
            from: "commentreplays",
            let: { messageId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$entityId", "$$messageId"] },
                      { $eq: ["$entityType", "Message"] },
                      { $eq: ["$deleteFlag", 0] },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "createdBy",
                  foreignField: "_id",
                  as: "createdByUser",
                },
              },
              {
                $unwind: {
                  path: "$createdByUser",
                  preserveNullAndEmptyArrays: true,
                },
              },

              {
                $lookup: {
                  from: "users",
                  localField: "notifyIds",
                  foreignField: "_id",
                  as: "notifyUsers",
                },
              },

              {
                $project: {
                  _id: 1,
                  commentReplayText: 1,
                  files: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  createdBy: {
                    _id: "$createdByUser._id",
                    name: "$createdByUser.name",
                    image: "$createdByUser.image",
                  },
                  notifyUsers: {
                    $map: {
                      input: "$notifyUsers",
                      as: "n",
                      in: {
                        _id: "$$n._id",
                        name: "$$n.name",
                        image: "$$n.image",
                      },
                    },
                  },
                },
              },
            ],
            as: "commentReplies",
          },
        },

        // final projection
        {
          $project: {
            _id: 1,
            projectId: 1,
            title: 1,
            message: 1,
            file: 1,
            fileType: 1,
            fileSize: 1,
            createdAt: 1,
            updatedAt: 1,

            createdBy: "$createdByDetails._id",
            createdByName: "$createdByDetails.name",
            createdByImage: "$createdByDetails.image",

            privacyPeople: {
              $map: {
                input: "$privacyPeopleDetails",
                as: "p",
                in: { _id: "$$p._id", name: "$$p.name", image: "$$p.image" },
              },
            },

            notifyUsers: {
              $map: {
                input: "$notifyDetails",
                as: "n",
                in: { _id: "$$n._id", name: "$$n.name", image: "$$n.image" },
              },
            },

            tagsList: {
              $map: {
                input: "$tagsList",
                as: "t",
                in: { _id: "$$t._id", tagName: "$$t.tagName" },
              },
            },

            projectCategory: {
              _id: "$projectCategoryDetails._id",
              name: "$projectCategoryDetails.categoryName",
            },
            projectSubCategory: {
              _id: "$projectSubCategoryDetails._id",
              name: "$projectSubCategoryDetails.subCategoryName",
            },

            commentReplies: 1,
          },
        },

        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
      ];

      const result = await ProjectFile.aggregate(pipeline);
      return result?.length > 0 ? result : [];
    } catch (error) {
      console.log("Database error from getAllProjectFiles:", error.message);
      throw new Error(error.message);
    }
  },

  async getProjectFile(SITE_DB_NAME, projectFileId) {
    const ProjectFile = await ProjectFileModel(SITE_DB_NAME);
    try {
      const fileDetails = await ProjectFile.findOne({
        _id: projectFileId,
        deleteFlag: 0,
      });

      if (fileDetails) {
        return fileDetails;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getProjectFile:", error);
      throw new Error(error.message);
    }
  },

  async checkProjectFileId(SITE_DB_NAME, projectFileId) {
    const ProjectFile = await ProjectFileModel(SITE_DB_NAME);
    try {
      const existing = await ProjectFile.findOne({
        deleteFlag: 0,
        _id: new mongoose.Types.ObjectId(projectFileId),
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkProjectFileId:", error);
      throw new Error(error.message);
    }
  },

  async updateProjectFile(SITE_DB_NAME, prjectFileId, projectFileData) {
    const ProjectFile = await ProjectFileModel(SITE_DB_NAME);
    try {
      const updateStatus = await ProjectFile.updateOne(
        { _id: prjectFileId },
        { $set: projectFileData },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateProjectFile:", error);
      throw new Error(error.message);
    }
  },

  async getProjectFileFieldDetails(SITE_DB_NAME, projectFileId, fieldName) {
    const ProjectFile = await ProjectFileModel(SITE_DB_NAME);
    try {
      const projectDetails = await ProjectFile.findOne(
        {
          _id: projectFileId,
          deleteFlag: 0,
        },
        { [fieldName]: 1, _id: 0 },
      );

      if (projectDetails) {
        return projectDetails;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getProjectFileFieldDetails:", error);
      throw new Error(error.message);
    }
  },

  async deleteProjectFile(SITE_DB_NAME, projectFileId) {
    const ProjectFile = await ProjectFileModel(SITE_DB_NAME);
    try {
      const deleteResult = await ProjectFile.deleteOne({
        _id: projectFileId,
      });
      if (deleteResult) {
        return true;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in deleteProjectFile:", error);
      throw new Error(error.message);
    }
  },

  // async updateProjectField(SITE_DB_NAME, projectId, data) {
  //   const Project = await ProjectModel(SITE_DB_NAME);
  //   try {
  //     const updateStatus = await Project.updateOne(
  //       { _id: projectId },
  //       { $set: data },
  //       { upsert: false },
  //     );
  //     if (updateStatus) {
  //       return updateStatus;
  //     } else {
  //       return "NA";
  //     }
  //   } catch (error) {
  //     console.error("Error in updateProjectField:", error);
  //     throw new Error(error.message);
  //   }
  // },

  async updateProjectField(SITE_DB_NAME, projectId, data) {
    const Project = await ProjectModel(SITE_DB_NAME);

    try {
      // 🟢 NORMAL CASE (agar peopleIds nahi hai)
      if (!data.peopleIds) {
        const updateStatus = await Project.updateOne(
          { _id: projectId },
          { $set: data },
          { upsert: false },
        );

        return updateStatus || "NA";
      }

      // 🔴 SPECIAL CASE (sirf jab fieldName = peopleIds)
      const TaskList = await TaskListModel(SITE_DB_NAME);
      const Task = await TaskModel(SITE_DB_NAME);

      // old project peopleIds
      const oldProject = await Project.findById(projectId, { peopleIds: 1 });
      if (!oldProject) return "NA";

      const oldPeople = (oldProject.peopleIds || []).map((id) => String(id));
      const newPeople = (data.peopleIds || []).map((id) => String(id));

      // jo remove hue
      const removedUsers = oldPeople.filter((id) => !newPeople.includes(id));

      // update project
      const updateStatus = await Project.updateOne(
        { _id: projectId },
        { $set: data },
        { upsert: false },
      );

      if (removedUsers.length > 0) {
        const removedObjectIds = removedUsers.map(
          (id) => new mongoose.Types.ObjectId(id),
        );

        // 1️⃣ taskList.viewBy se hatao
        await TaskList.updateMany(
          { projectId: new mongoose.Types.ObjectId(projectId) },
          { $pull: { viewBy: { $in: removedObjectIds } } },
        );

        // 2️⃣ tasks & subtasks assignedTo se hatao
        await Task.updateMany(
          { projectId: new mongoose.Types.ObjectId(projectId) },
          { $pull: { assignedTo: { $in: removedObjectIds } } },
        );
      }

      return updateStatus || "NA";
    } catch (error) {
      console.error("Error in updateProjectField:", error);
      throw new Error(error.message);
    }
  },

  async getProjectFieldDetails(SITE_DB_NAME, projectId, fieldName) {
    const Project = await ProjectModel(SITE_DB_NAME);
    try {
      const projectDetails = await Project.findOne(
        {
          _id: projectId,
          deleteFlag: 0,
        },
        { [fieldName]: 1, _id: 0 },
      );

      if (projectDetails) {
        return projectDetails;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getProjectFieldDetails:", error);
      throw new Error(error.message);
    }
  },
  async updateProjectMessage(
    SITE_DB_NAME,
    projectMessageId,
    projectMessageData,
  ) {
    const ProjectMessage = await ProjectMessageModel(SITE_DB_NAME);
    try {
      const updateStatus = await ProjectMessage.updateOne(
        { _id: projectMessageId },
        { $set: projectMessageData },
        { upsert: false },
      );

      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateProjectMessage:", error);
      throw new Error(error.message);
    }
  },

  async deleteProjectMessage(SITE_DB_NAME, projectMessageId) {
    const ProjectMessage = await ProjectMessageModel(SITE_DB_NAME);
    try {
      const deleteResult = await ProjectMessage.deleteOne({
        _id: projectMessageId,
      });
      if (deleteResult) {
        return true;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in deleteProjectMessage:", error);
      throw new Error(error.message);
    }
  },

  async createProof(SITE_DB_NAME, data) {
    const Proof = await ProofModel(SITE_DB_NAME);
    try {
      const createLinkData = await Proof.create(data);
      if (createLinkData) {
        return createLinkData;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createProof:", error);
      throw new Error(error.message);
    }
  },

  async getProof(SITE_DB_NAME, projectProofId) {
    const Proof = await ProofModel(SITE_DB_NAME);
    try {
      const linkDetails = await Proof.findOne({
        _id: projectProofId,
        deleteFlag: 0,
      });

      if (linkDetails) {
        return linkDetails;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getProof:", error);
      throw new Error(error.message);
    }
  },

  async getAllProof(
    DB_NAME,
    deleteFlag,
    entityId,
    entityType,
    pagination,
    search,
  ) {
    try {
      const Proof = await ProofModel(DB_NAME);

      const matchStage = {
        deleteFlag: deleteFlag,
        entityId: new mongoose.Types.ObjectId(entityId),
        entityType: entityType,
      };

      if (search) {
        matchStage.proofName = { $regex: search, $options: "i" };
      }

      const skip = (pagination.pageNumber - 1) * pagination.pageSize;

      const data = await Proof.aggregate([
        { $match: matchStage },

        // 🔹 createdBy user (LIMITED FIELDS)
        {
          $lookup: {
            from: "users",
            let: { userId: "$createdBy" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$userId"] },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  image: 1,
                  roleName: 1,
                },
              },
            ],
            as: "createdByUser",
          },
        },
        {
          $unwind: {
            path: "$createdByUser",
            preserveNullAndEmptyArrays: true,
          },
        },

        // 🔹 reviewers user (LIMITED FIELDS)
        {
          $lookup: {
            from: "users",
            let: { reviewerIds: "$reviewers.user" },
            pipeline: [
              {
                $match: {
                  $expr: { $in: ["$_id", "$$reviewerIds"] },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  image: 1,
                  roleName: 1,
                },
              },
            ],
            as: "reviewerUsers",
          },
        },

        // 🔹 merge reviewers with user data
        {
          $addFields: {
            reviewers: {
              $map: {
                input: "$reviewers",
                as: "rev",
                in: {
                  role: "$$rev.role",
                  user: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$reviewerUsers",
                          as: "u",
                          cond: {
                            $eq: ["$$u._id", "$$rev.user"],
                          },
                        },
                      },
                      0,
                    ],
                  },
                },
              },
            },
          },
        },

        // 🔹 clean response
        {
          $project: {
            reviewerUsers: 0,
          },
        },

        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pagination.pageSize },
      ]);

      if (!data.length) return "NA";
      return data;
    } catch (error) {
      throw error;
    }
  },

  async checkProofId(SITE_DB_NAME, proofId) {
    const Proof = await ProofModel(SITE_DB_NAME);
    try {
      const existing = await Proof.findOne({
        deleteFlag: 0,
        _id: new mongoose.Types.ObjectId(proofId),
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkProjectMessageId:", error);
      throw new Error(error.message);
    }
  },

  async updateProof(SITE_DB_NAME, proofId, proofData) {
    const Proof = await ProofModel(SITE_DB_NAME);
    try {
      const updateStatus = await Proof.updateOne(
        { _id: proofId },
        { $set: proofData },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateProof:", error);
      throw new Error(error.message);
    }
  },

  async checkDeleteProofId(SITE_DB_NAME, proofId) {
    try {
      const Proof = await ProofModel(SITE_DB_NAME);
      const existing = await Proof.findOne({
        deleteFlag: 0,
        _id: new mongoose.Types.ObjectId(proofId),
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkDeleteProofId:", error);
      throw new Error(error.message);
    }
  },

  async deleteProof(SITE_DB_NAME, proofId) {
    const Proof = await ProofModel(SITE_DB_NAME);
    try {
      const deleteResult = await Proof.deleteOne({
        _id: proofId,
      });
      if (deleteResult) {
        return true;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in deleteProof:", error);
      throw new Error(error.message);
    }
  },

  //

  async createCommentReply(SITE_DB_NAME, data) {
    const CommentReplay = await CommentReplayModel(SITE_DB_NAME);
    try {
      const createData = await CommentReplay.create(data);
      if (createData) {
        return createData;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createCommentReply:", error);
      throw new Error(error.message);
    }
  },

  async getCommentReply(SITE_DB_NAME, projectCommentReplyId) {
    const CommentReplay = await CommentReplayModel(SITE_DB_NAME);
    try {
      const commnetDetails = await CommentReplay.findOne({
        _id: projectCommentReplyId,
        deleteFlag: 0,
      });

      if (commnetDetails) {
        return commnetDetails;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getCommentReply:", error);
      throw new Error(error.message);
    }
  },

  async getAllCommentReply(
    SITE_DB_NAME,
    deleteFlag,
    entityId,
    entityType,
    pagination,
    search,
  ) {
    try {
      const CommentReplay = await CommentReplayModel(SITE_DB_NAME);

      const matchStage = {
        deleteFlag: deleteFlag,
        entityId: new mongoose.Types.ObjectId(entityId),
        entityType: entityType,
      };

      if (search) {
        matchStage.commentReplayText = { $regex: search, $options: "i" };
      }

      const skip = (pagination.pageNumber - 1) * pagination.pageSize;

      const data = await CommentReplay.aggregate([
        { $match: matchStage },

        //  createdBy user (LIMITED FIELDS)
        {
          $lookup: {
            from: "users",
            let: { userId: "$createdBy" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$userId"] },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  image: 1,
                  roleName: 1,
                  designationName: 1,
                },
              },
            ],
            as: "createdByUser",
          },
        },
        {
          $unwind: {
            path: "$createdByUser",
            preserveNullAndEmptyArrays: true,
          },
        },

        //  notifyIds users (LIMITED FIELDS)
        {
          $lookup: {
            from: "users",
            let: { notifyIds: "$notifyIds" },
            pipeline: [
              {
                $match: {
                  $expr: { $in: ["$_id", "$$notifyIds"] },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  image: 1,
                  roleName: 1,
                  designationName: 1,
                },
              },
            ],
            as: "notifyUsers",
          },
        },

        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pagination.pageSize },

        //  clean response
        {
          $project: {
            "createdByUser.password": 0,
            "createdByUser.email": 0,
            notifyIds: 0, // raw ids hide
          },
        },
      ]);

      if (!data.length) return "NA";
      return data;
    } catch (error) {
      console.error("Error in getAllCommentReply:", error);
      throw new Error(error.message);
    }
  },

  async checkCommentReplyId(SITE_DB_NAME, commentId) {
    const CommentReplay = await CommentReplayModel(SITE_DB_NAME);
    try {
      const existing = await CommentReplay.findOne({
        deleteFlag: 0,
        _id: new mongoose.Types.ObjectId(commentId),
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkCommentReplyId:", error);
      throw new Error(error.message);
    }
  },

  async updateCommentReply(SITE_DB_NAME, commentId, commentReplyData) {
    const CommentReplay = await CommentReplayModel(SITE_DB_NAME);
    try {
      const updateStatus = await CommentReplay.updateOne(
        { _id: commentId },
        { $set: commentReplyData },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateCommentReply:", error);
      throw new Error(error.message);
    }
  },

  async checkDeleteCommentReplyId(SITE_DB_NAME, commentId) {
    try {
      const CommentReplay = await CommentReplayModel(SITE_DB_NAME);
      const existing = await CommentReplay.findOne({
        deleteFlag: 0,
        _id: new mongoose.Types.ObjectId(commentId),
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkDeleteCommentReplyId:", error);
      throw new Error(error.message);
    }
  },

  async deleteCommentReply(SITE_DB_NAME, commentId) {
    const CommentReplay = await CommentReplayModel(SITE_DB_NAME);
    try {
      const deleteResult = await CommentReplay.deleteOne({
        _id: commentId,
      });
      if (deleteResult) {
        return true;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in deleteCommentReply:", error);
      throw new Error(error.message);
    }
  },
  //

  async getPerProjectPeople(
    SITE_DB_NAME,
    deleteFlag,
    projectId,
    pagination,
    search,
  ) {
    const Project = await ProjectModel(SITE_DB_NAME);
    try {
      const { pageSize, pageNumber } = pagination;
      const skip = (pageNumber - 1) * pageSize;

      const pipeline = [
        {
          $match: {
            _id: projectId,
            deleteFlag: deleteFlag,
          },
        },

        { $unwind: "$peopleIds" },

        {
          $lookup: {
            from: "users",
            let: { userId: "$peopleIds" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
              {
                $project: {
                  name: 1,
                  image: 1,
                  email: 1,
                  jobTitle: 1,
                  officePhone: 1,
                  mobileNumber: 1,
                  roleId: 1,
                  roleName: 1,
                  designationId: 1,
                  companyId: 1,
                  type: 1,
                  billableTarget: 1,
                  createdAt: 1,
                },
              },
            ],
            as: "userData",
          },
        },
        { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: "designations",
            let: { desigId: "$userData.designationId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$desigId"] } } },
              { $project: { name: 1 } },
            ],
            as: "designationData",
          },
        },
        {
          $unwind: {
            path: "$designationData",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: "companies",
            let: { cId: { $ifNull: ["$userData.companyId", "$companyId"] } },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$cId"] } } },
              { $project: { companyName: 1 } },
            ],
            as: "companyData",
          },
        },
        { $unwind: { path: "$companyData", preserveNullAndEmptyArrays: true } },

        {
          $lookup: {
            from: "teams",
            let: { companyId: "$companyData._id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$companyId", "$$companyId"] },
                },
              },
              {
                $project: { teamName: 1 },
              },
            ],
            as: "userTeams",
          },
        },

        {
          $project: {
            userId: "$userData._id",
            name: "$userData.name",
            email: "$userData.email",
            image: "$userData.image",
            jobTitle: "$userData.jobTitle",
            officePhone: "$userData.officePhone",
            mobileNumber: "$userData.mobileNumber",
            roleId: "$userData.roleId",
            roleName: "$userData.roleName",
            designationId: "$userData.designationId",
            designationName: "$designationData.name",
            company: "$companyData.companyName",
            billableTarget: "$userData.billableTarget",
            teams: "$userTeams.teamName",
            teamCount: { $size: "$userTeams" },
            type: "$userData.type",
            createdAt: "$userData.createdAt",
            addedAt: "$createdAt",
          },
        },

        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
      ];

      if (search && search.trim() !== "") {
        pipeline.splice(pipeline.length - 3, 0, {
          $match: {
            "userData.name": { $regex: search, $options: "i" },
          },
        });
      }

      const result = await Project.aggregate(pipeline);

      return result?.length > 0 ? result : [];
    } catch (error) {
      console.log("Database error from getPerProjectPeople:", error.message);
      throw new Error(error.message);
    }
  },

  // async updateMultiPeopleAndRemove(SITE_DB_NAME, proofId, proofData) {
  //   const Proof = await ProofModel(SITE_DB_NAME);
  //   try {
  //     const updateStatus = await Proof.updateOne(
  //       { _id: proofId },
  //       { $set: proofData },
  //       { upsert: false }
  //     );
  //     if (updateStatus) {
  //       return updateStatus;
  //     } else {
  //       return "NA";
  //     }
  //   } catch (error) {
  //     console.error("Error in updateProof:", error);
  //     throw new Error(error.message);
  //   }
  // },

  //====================================== Tanant-Task-Flow ===========================
  async checkTaskListName(SITE_DB_NAME, name) {
    try {
      const TaskList = await TaskListModel(SITE_DB_NAME);
      const existing = await TaskList.findOne({
        name,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkTaskListName:", error);
      throw new Error(error.message);
    }
  },

  async createTaskList(SITE_DB_NAME, data) {
    const TaskList = await TaskListModel(SITE_DB_NAME);
    try {
      const TaskListDetails = await TaskList.create(data);
      if (TaskListDetails) {
        return TaskListDetails;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createProof:", error);
      throw new Error(error.message);
    }
  },

  async getTaskList(SITE_DB_NAME, createTaskListId) {
    const TaskList = await TaskListModel(SITE_DB_NAME);
    try {
      const TaskListDetails = await TaskList.findOne({
        _id: createTaskListId,
        deleteFlag: 0,
      });

      if (TaskListDetails) {
        return TaskListDetails;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getTaskList:", error);
      throw new Error(error.message);
    }
  },

  async getAllTaskList(
    SITE_DB_NAME,
    deleteFlag,
    projectId,
    pagination,
    currentUser,
    userRoleName,
  ) {
    const TaskList = await TaskListModel(SITE_DB_NAME);
    const Task = await TaskModel(SITE_DB_NAME);
    const Project = await ProjectModel(SITE_DB_NAME);
    const { pageSize, pageNumber } = pagination;
    const skip = (pageNumber - 1) * pageSize;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return { taskList: [], completeTaskList: [] };
    }

    if (!currentUser) {
      return { taskList: [], completeTaskList: [] };
    }

    // fetch project to check owner
    let projectDoc = null;
    try {
      projectDoc = await Project.findById(projectId).lean();
    } catch (e) {
      // ignore
    }

    const taskCollection = Task.collection.name;
    const userObjId = new mongoose.Types.ObjectId(currentUser._id);

    const pipeline = [
      {
        $match: {
          deleteFlag: Number(deleteFlag),
          projectId: new mongoose.Types.ObjectId(projectId),
        },
      },

      // lookup createdBy of tasklist (meta)
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdByDetails",
        },
      },
      {
        $unwind: {
          path: "$createdByDetails",
          preserveNullAndEmptyArrays: true,
        },
      },

      // viewBy user details (tasklist visibility)
      {
        $lookup: {
          from: "users",
          localField: "viewBy",
          foreignField: "_id",
          as: "viewByDetails",
        },
      },

      // lookup tasks (ignore rejected)
      {
        $lookup: {
          from: taskCollection,
          let: { listId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$taskListId", "$$listId"] },
                    { $eq: ["$deleteFlag", 0] },
                    { $ne: ["$taskStatus", "rejected"] },
                  ],
                },
              },
            },
          ],
          as: "tasks",
        },
      },

      // global counts
      {
        $addFields: {
          totalValidTasks: { $size: "$tasks" },
          completedTasks: {
            $size: {
              $filter: {
                input: "$tasks",
                as: "t",
                cond: { $eq: ["$$t.taskStatus", "completed"] },
              },
            },
          },
          pendingTasks: {
            $size: {
              $filter: {
                input: "$tasks",
                as: "t",
                cond: {
                  $in: ["$$t.taskStatus", ["not started", "incompleted"]],
                },
              },
            },
          },
        },
      },

      // user relevant counts (robust checks for createdBy / createdById / assignedTo / followers)
      {
        $addFields: {
          userRelevantTasks: {
            $size: {
              $filter: {
                input: "$tasks",
                as: "t",
                cond: {
                  $or: [
                    // createdBy could be ObjectId, or createdById, or subdoc with _id
                    { $eq: ["$$t.createdBy", userObjId] },
                    { $eq: ["$$t.createdById", userObjId] },
                    { $eq: ["$$t.createdBy._id", userObjId] },

                    // assignedTo might be array of ObjectId OR array of objects { _id: ... }
                    {
                      $in: [userObjId, { $ifNull: ["$$t.assignedTo", []] }],
                    },
                    {
                      $in: [
                        userObjId,
                        {
                          $map: {
                            input: { $ifNull: ["$$t.assignedTo", []] },
                            as: "a",
                            in: {
                              $cond: [
                                { $ifNull: ["$$a._id", false] },
                                "$$a._id",
                                "$$a",
                              ],
                            },
                          },
                        },
                      ],
                    },

                    // followers may be array of ids or array of objects
                    {
                      $in: [userObjId, { $ifNull: ["$$t.followers", []] }],
                    },
                    {
                      $in: [
                        userObjId,
                        {
                          $map: {
                            input: { $ifNull: ["$$t.followers", []] },
                            as: "f",
                            in: {
                              $cond: [
                                { $ifNull: ["$$f._id", false] },
                                "$$f._id",
                                "$$f",
                              ],
                            },
                          },
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },

          userRelevantCompletedTasks: {
            $size: {
              $filter: {
                input: "$tasks",
                as: "t",
                cond: {
                  $and: [
                    { $eq: ["$$t.taskStatus", "completed"] },
                    {
                      $or: [
                        { $eq: ["$$t.createdBy", userObjId] },
                        { $eq: ["$$t.createdById", userObjId] },
                        { $eq: ["$$t.createdBy._id", userObjId] },

                        {
                          $in: [userObjId, { $ifNull: ["$$t.assignedTo", []] }],
                        },
                        {
                          $in: [
                            userObjId,
                            {
                              $map: {
                                input: { $ifNull: ["$$t.assignedTo", []] },
                                as: "a",
                                in: {
                                  $cond: [
                                    { $ifNull: ["$$a._id", false] },
                                    "$$a._id",
                                    "$$a",
                                  ],
                                },
                              },
                            },
                          ],
                        },

                        {
                          $in: [userObjId, { $ifNull: ["$$t.followers", []] }],
                        },
                        {
                          $in: [
                            userObjId,
                            {
                              $map: {
                                input: { $ifNull: ["$$t.followers", []] },
                                as: "f",
                                in: {
                                  $cond: [
                                    { $ifNull: ["$$f._id", false] },
                                    "$$f._id",
                                    "$$f",
                                  ],
                                },
                              },
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
      },

      // remove tasks array to reduce payload
      { $unset: "tasks" },

      // final projection (include userRelevant fields)
      {
        $project: {
          _id: 1,
          projectId: 1,
          listIcon: 1,
          name: 1,
          description: 1,
          orderIndex: 1,
          activeFlag: 1,
          deleteFlag: 1,
          createdAt: 1,
          updatedAt: 1,
          totalValidTasks: 1,
          completedTasks: 1,
          pendingTasks: 1,
          userRelevantTasks: 1,
          userRelevantCompletedTasks: 1,
          createdBy: {
            _id: "$createdByDetails._id",
            name: "$createdByDetails.name",
            image: "$createdByDetails.image",
          },
          viewBy: {
            $map: {
              input: "$viewByDetails",
              as: "v",
              in: {
                _id: "$$v._id",
                name: "$$v.name",
                image: "$$v.image",
              },
            },
          },
        },
      },
    ];

    const lists = await TaskList.aggregate(pipeline);

    // ROLE / OWNER CHECK
    const privilegedRoles = ["Site-Owner", "Admin"];
    const isPrivilegedRole = privilegedRoles.includes(userRoleName);

    const isProjectOwner =
      projectDoc?.ownerId && currentUser?._id
        ? String(projectDoc.ownerId) === String(currentUser._id)
        : false;

    const isPrivileged = isPrivilegedRole || isProjectOwner;

    const currentUserId = currentUser._id.toString();

    // visibility: privileged users see all lists; otherwise respect viewBy (empty => visible to all)
    const visibleLists = lists.filter((l) => {
      if (isPrivileged) return true;
      if (!l.viewBy || l.viewBy.length === 0) return true;
      return l.viewBy.some((v) => v._id && v._id.toString() === currentUserId);
    });

    // pagination AFTER RBAC
    // const paginatedLists = visibleLists.slice(skip, skip + pageSize);
    const paginatedLists = visibleLists.slice(
      (pageNumber - 1) * pageSize,
      pageNumber * pageSize,
    );

    // build response: privileged => global counts, non-privileged => userRelevant counts
    const taskList = [];
    const completeTaskList = [];

    for (const l of paginatedLists) {
      if (isPrivileged) {
        // privileged: full counts
        if (l.totalValidTasks > 0 && l.completedTasks === l.totalValidTasks) {
          completeTaskList.push({
            _id: l._id,
            projectId: l.projectId,
            listIcon: l.listIcon,
            name: l.name,
            description: l.description,
            orderIndex: l.orderIndex,
            activeFlag: l.activeFlag,
            deleteFlag: l.deleteFlag,
            createdAt: l.createdAt,
            updatedAt: l.updatedAt,
            completeTaskCount: l.completedTasks,
            createdBy: l.createdBy,
            viewBy: l.viewBy,
          });
        } else {
          taskList.push({
            _id: l._id,
            projectId: l.projectId,
            listIcon: l.listIcon,
            name: l.name,
            description: l.description,
            orderIndex: l.orderIndex,
            activeFlag: l.activeFlag,
            deleteFlag: l.deleteFlag,
            createdAt: l.createdAt,
            updatedAt: l.updatedAt,
            taskCount: Math.max(
              0,
              (l.totalValidTasks || 0) - (l.completedTasks || 0),
            ),
            createdBy: l.createdBy,
            viewBy: l.viewBy,
          });
        }
      } else {
        // non-privileged: counts only for tasks where user is involved
        const userTotal = l.userRelevantTasks || 0;
        const userCompleted = l.userRelevantCompletedTasks || 0;

        if (userTotal > 0 && userCompleted === userTotal) {
          completeTaskList.push({
            _id: l._id,
            projectId: l.projectId,
            listIcon: l.listIcon,
            name: l.name,
            description: l.description,
            orderIndex: l.orderIndex,
            activeFlag: l.activeFlag,
            deleteFlag: l.deleteFlag,
            createdAt: l.createdAt,
            updatedAt: l.updatedAt,
            completeTaskCount: userCompleted,
            createdBy: l.createdBy,
            viewBy: l.viewBy,
          });
        } else {
          taskList.push({
            _id: l._id,
            projectId: l.projectId,
            listIcon: l.listIcon,
            name: l.name,
            description: l.description,
            orderIndex: l.orderIndex,
            activeFlag: l.activeFlag,
            deleteFlag: l.deleteFlag,
            createdAt: l.createdAt,
            updatedAt: l.updatedAt,
            taskCount: Math.max(0, userTotal - userCompleted),
            createdBy: l.createdBy,
            viewBy: l.viewBy,
          });
        }
      }
    }

    return {
      taskList,
      completeTaskList,
    };
  },

  async checkTaskListId(SITE_DB_NAME, taskListId) {
    const TaskList = await TaskListModel(SITE_DB_NAME);
    try {
      const existing = await TaskList.findOne({
        deleteFlag: 0,
        _id: taskListId,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkTaskListId:", error);
      throw new Error(error.message);
    }
  },

  // async checkTaskListId(SITE_DB_NAME, taskListId) {
  //   const TaskList = await TaskListModel(SITE_DB_NAME);
  //   try {
  //     const existing = await TaskList.findOne({
  //       deleteFlag: 0,
  //       _id: new mongoose.Types.ObjectId(taskListId),
  //     });
  //     if (existing) {
  //       return existing;
  //     } else {
  //       return "NA";
  //     }
  //   } catch (error) {
  //     console.error("Error in checkTaskListId:", error);
  //     throw new Error(error.message);
  //   }
  // },

  async checkTaskListUpdateName(SITE_DB_NAME, taskListId, name) {
    const TaskList = await TaskListModel(SITE_DB_NAME);
    try {
      const existing = await TaskList.findOne({
        _id: { $ne: new mongoose.Types.ObjectId(taskListId) }, // exclude current id
        name: name,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkTaskListUpdateName:", error);
      throw new Error(error.message);
    }
  },

  async updateTaskList(SITE_DB_NAME, taskListId, data) {
    const TaskList = await TaskListModel(SITE_DB_NAME);
    try {
      const updateStatus = await TaskList.updateOne(
        { _id: taskListId },
        { $set: data },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateTaskList:", error);
      throw new Error(error.message);
    }
  },

  // async deleteTaskList(SITE_DB_NAME, taskListId) {
  //   const TaskList = await TaskListModel(SITE_DB_NAME);
  //   try {
  //     const deleteResult = await TaskList.deleteOne({
  //       _id: taskListId,
  //     });
  //     if (deleteResult) {
  //       return true;
  //     } else {
  //       return "NA";
  //     }
  //   } catch (error) {
  //     console.error("Error in deleteTaskList:", error);
  //     throw new Error(error.message);
  //   }
  // },

  async deleteTaskList(SITE_DB_NAME, taskListId) {
    const TaskList = await TaskListModel(SITE_DB_NAME);
    const Task = await TaskModel(SITE_DB_NAME);
    const TaskDependency = await TaskDependencyModel(SITE_DB_NAME);
    const TaskComment = await TaskCommentModel(SITE_DB_NAME);

    try {
      // 1️⃣ Find all tasks linked to this list
      const tasks = await Task.find({ taskListId: taskListId }, { _id: 1 });
      const taskIds = tasks.map((t) => t._id);

      // 2️⃣ Delete all task dependencies related to these tasks
      if (taskIds.length > 0) {
        await TaskDependency.deleteMany({
          $or: [
            { taskId: { $in: taskIds } },
            { dependsOnTaskId: { $in: taskIds } },
          ],
        });

        // 3️⃣ Delete all task comments linked to these tasks
        await TaskComment.deleteMany({
          taskId: { $in: taskIds },
        });

        // 4️⃣ Delete all tasks from this task list
        await Task.deleteMany({
          _id: { $in: taskIds },
        });
      }

      // 5️⃣ Finally, delete the task list itself
      const deleteResult = await TaskList.deleteOne({ _id: taskListId });

      if (deleteResult.deletedCount > 0) {
        return true;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in deleteTaskList:", error);
      throw new Error(error.message);
    }
  },

  async checkTaskLastNumber(SITE_DB_NAME) {
    try {
      const Task = await TaskModel(SITE_DB_NAME);

      // सिर्फ उन documents को consider करो जिनका taskNumber "TASK-###" pattern match करे
      const lastTask = await Task.findOne({
        deleteFlag: 0,
        taskNumber: { $regex: /^TASK-\d{3,}$/ }, // या /^TASK-\d+$/ भी कर सकते हो
      })
        .sort({ createdAt: -1 }) // latest among TASK-* (createdAt based)
        .lean();

      if (lastTask && lastTask.taskNumber) {
        const parts = lastTask.taskNumber.split("-");
        const lastNumber = parseInt(parts[1], 10) || 0;
        const newNumber = lastNumber + 1;
        const paddedNumber = String(newNumber).padStart(3, "0");
        return `TASK-${paddedNumber}`;
      }

      // अगर कोई TASK-* नहीं मिला
      return "TASK-001";
    } catch (error) {
      console.error("Error in checkTaskLastNumber :", error);
      throw new Error(error.message);
    }
  },

  async checkTaskOrderIndexLastNumber(SITE_DB_NAME, stageId) {
    try {
      const Task = await TaskModel(SITE_DB_NAME);

      const lastTask = await Task.findOne({
        deleteFlag: 0,
        stageId: stageId,
      })
        .sort({ orderIndex: -1 }) // 🔥 IMPORTANT
        .select({ orderIndex: 1 })
        .lean();

      // agar stage me koi task nahi hai
      if (!lastTask || !lastTask.orderIndex) {
        return 1;
      }

      // agar hai toh +1
      return lastTask.orderIndex + 1;
    } catch (error) {
      console.error("Error in checkTaskOrderIndexLastNumber:", error);
      throw new Error(error.message);
    }
  },
  // async checkTaskLastNumber(SITE_DB_NAME) {
  //   try {
  //     const Task = await TaskModel(SITE_DB_NAME);
  //     const lastTask = await Task.findOne({ deleteFlag: 0 })
  //       .sort({ createdAt: -1 }) // latest one
  //       // .select("taskNumber")
  //       .lean();

  //     if (lastTask && lastTask.taskNumber) {
  //       const lastNumber = parseInt(lastTask.taskNumber.split("-")[1]);
  //       const newNumber = lastNumber + 1;
  //       const paddedNumber = String(newNumber).padStart(3, "0");
  //       return `TASK-${paddedNumber}`;
  //     }
  //     if (!lastTask || !lastTask.taskNumber) {
  //       return "TASK-001"; // default start
  //     }
  //     return "NA";
  //   } catch (error) {
  //     console.error("Error in checkTaskLastNumber me :", error);
  //     throw new Error(error.message);
  //   }
  // },

  async createTask(SITE_DB_NAME, data) {
    const Task = await TaskModel(SITE_DB_NAME);
    try {
      const TaskDetails = await Task.create(data);
      if (TaskDetails) {
        return TaskDetails;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createTask:", error);
      throw new Error(error.message);
    }
  },

  async getTask(SITE_DB_NAME, taskId) {
    const Task = await TaskModel(SITE_DB_NAME);
    try {
      const result = await Task.aggregate([
        {
          $match: {
            deleteFlag: 0,
            _id: taskId,
          },
        },

        // Project details
        {
          $lookup: {
            from: "projects",
            localField: "projectId",
            foreignField: "_id",
            as: "project",
          },
        },
        { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            project: {
              _id: "$project._id",
              projectNumber: "$project.projectNumber",
              name: "$project.name",
            },
          },
        },

        // Task List
        {
          $lookup: {
            from: "projecttasklists",
            localField: "taskListId",
            foreignField: "_id",
            as: "taskList",
          },
        },
        { $unwind: { path: "$taskList", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            taskList: {
              _id: "$taskList._id",
              name: "$taskList.name",
              listIcon: "$taskList.listIcon",
            },
          },
        },

        // Workflow details
        {
          $lookup: {
            from: "workflows",
            localField: "workflowId",
            foreignField: "_id",
            as: "workflow",
          },
        },
        { $unwind: { path: "$workflow", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            workflow: {
              _id: "$workflow._id",
              name: "$workflow.name",
              stages: "$workflow.stages",
            },
          },
        },

        // Assigned Users
        {
          $lookup: {
            from: "users",
            localField: "assignedTo",
            foreignField: "_id",
            as: "assignedUsers",
          },
        },
        {
          $addFields: {
            assignedUsers: {
              $map: {
                input: "$assignedUsers",
                as: "user",
                in: {
                  _id: "$$user._id",
                  name: "$$user.name",
                  image: "$$user.image",
                  email: "$$user.email",
                },
              },
            },
          },
        },

        // Created User
        {
          $lookup: {
            from: "users",
            localField: "createdById",
            foreignField: "_id",
            as: "createdUser",
          },
        },
        { $unwind: { path: "$createdUser", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            createdUser: {
              _id: "$createdUser._id",
              name: "$createdUser.name",
              image: "$createdUser.image",
            },
          },
        },

        // Last Updated User
        {
          $lookup: {
            from: "users",
            localField: "lastUpdatedBy",
            foreignField: "_id",
            as: "lastUpdatedUser",
          },
        },
        {
          $unwind: {
            path: "$lastUpdatedUser",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            lastUpdatedUser: {
              _id: "$lastUpdatedUser._id",
              name: "$lastUpdatedUser.name",
              image: "$lastUpdatedUser.image",
            },
          },
        },

        // Followers
        {
          $lookup: {
            from: "users",
            localField: "followers",
            foreignField: "_id",
            as: "followerUsers",
          },
        },
        {
          $addFields: {
            followers: {
              $map: {
                input: "$followerUsers",
                as: "user",
                in: {
                  _id: "$$user._id",
                  name: "$$user.name",
                  image: "$$user.image",
                },
              },
            },
          },
        },

        // Tags
        {
          $lookup: {
            from: "tags",
            localField: "tags",
            foreignField: "_id",
            as: "tags",
          },
        },
        {
          $addFields: {
            tags: {
              $map: {
                input: "$tags",
                as: "tag",
                in: {
                  _id: "$$tag._id",
                  name: "$$tag.name",
                  color: "$$tag.color",
                },
              },
            },
          },
        },

        // Reminders
        {
          $lookup: {
            from: "users",
            localField: "reminders.userIds",
            foreignField: "_id",
            as: "allReminderUsers",
          },
        },
        {
          $addFields: {
            reminders: {
              $map: {
                input: { $ifNull: ["$reminders", []] },
                as: "reminder",
                in: {
                  date: "$$reminder.date",
                  description: "$$reminder.description",
                  type: "$$reminder.type",
                  userIds: "$$reminder.userIds",
                  reminderUsers: {
                    $map: {
                      input: {
                        $filter: {
                          input: "$allReminderUsers",
                          as: "user",
                          cond: { $in: ["$$user._id", "$$reminder.userIds"] },
                        },
                      },
                      as: "user",
                      in: {
                        _id: "$$user._id",
                        name: "$$user.name",
                        image: "$$user.image",
                      },
                    },
                  },
                },
              },
            },
          },
        },

        // Stage field from workflow
        {
          $addFields: {
            stage: {
              $filter: {
                input: "$workflow.stages",
                as: "stageItem",
                cond: { $eq: ["$$stageItem._id", "$stageId"] },
              },
            },
          },
        },

        // Project final structure
        {
          $project: {
            project: 1,
            taskList: 1,
            workflow: 1,
            assignedUsers: 1,
            parentTaskId: 1,
            createdByDetails: 1,
            lastUpdatedUser: 1,
            followers: 1,
            tags: 1,
            reminders: 1,
            stage: 1,
            name: 1,
            description: 1,
            priority: 1,
            taskStatus: 1,
            progress: 1,
            startDate: 1,
            dueDate: 1,
            completedAt: 1,
            estimateMinutes: 1,
            isBillable: 1,
            invoiced: 1,
            files: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            stageId: 1,
          },
        },
      ]);

      if (result.length > 0) {
        return result[0];
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getTask:", error);
      throw new Error(error.message);
    }
  },

  async checkWorkflowStageId(SITE_DB_NAME, workflowId, stageId) {
    const Workflow = await WorkflowModel(SITE_DB_NAME);
    try {
      const existing = await Workflow.findOne({
        _id: workflowId,
        deleteFlag: 0,
        "stages._id": new mongoose.Types.ObjectId(stageId), // check if stage exists inside stages array
      });

      if (existing) {
        return existing; // found, return workflow document
      } else {
        return "NA"; // not found
      }
    } catch (error) {
      console.error("Error in checkWorkflowStageId:", error);
      throw new Error(error.message);
    }
  },

  async getAllTask(
    SITE_DB_NAME,
    deleteFlag = 0,
    projectId,
    pagination = {},
    search,
    taskPagination = {},
    taskListId,
    taskStatus,
    byUser,
    currentUser,
    userRoleName,
  ) {
    try {
      const TaskList = await TaskListModel(SITE_DB_NAME);
      const Project = await ProjectModel(SITE_DB_NAME);

      /* ---------------- PAGINATION ---------------- */
      const { pageSize = 10, pageNumber = 1 } = pagination;
      const { taskPageSize = 10, taskPageNumber = 1 } = taskPagination;

      const listSkip = (pageNumber - 1) * pageSize;
      const taskSkip = (taskPageNumber - 1) * taskPageSize;

      const projectObjectId = new mongoose.Types.ObjectId(projectId);

      /* --------------- ROLE CHECK ------------------ */
      const privilegedRoles = ["Site-Owner", "Admin"];

      // fetch project to check its ownerId
      let isProjectOwner = false;
      try {
        const projectDoc = await Project.findById(projectObjectId, {
          ownerId: 1,
        }).lean();
        if (projectDoc?.ownerId && currentUser) {
          isProjectOwner = String(projectDoc.ownerId) === String(currentUser);
        }
      } catch (err) {
        // swallow — if project lookup fails, we won't treat user as owner (existing error handling will catch elsewhere)
        console.warn("Could not fetch project owner for role check:", err);
      }

      const isSiteOwner = privilegedRoles.includes(userRoleName);

      const isPrivileged = isSiteOwner || isProjectOwner;

      // effective user id for filtering (if not privileged, force to current user)
      let effectiveUserId = null;
      if (!isPrivileged) {
        if (!currentUser) {
          // no valid user -> no access
          return "NA";
        }
        effectiveUserId = new mongoose.Types.ObjectId(currentUser);
      } else {
        // privileged: if byUser provided, we may use it to filter tasks else null (no restriction)
        effectiveUserId = null;
      }

      /* ---------------- LIST MATCH ---------------- */
      const listMatch = { projectId: projectObjectId, deleteFlag };
      if (!isPrivileged && effectiveUserId) {
        listMatch.$or = [
          { viewBy: { $exists: false } }, // field hi na ho
          { viewBy: { $size: 0 } }, // empty array
          { viewBy: effectiveUserId }, // current user present
        ];
      }
      if (taskListId) listMatch._id = new mongoose.Types.ObjectId(taskListId);
      // if (search) listMatch.name = { $regex: search, $options: "i" };

      /* ---------------- COMMON LOOKUPS ---------------- */
      const userProject = [
        {
          $project: {
            _id: 1,
            name: 1,
            image: 1,
            roleId: 1,
            designationId: 1,
            companyId: 1,
          },
        },
      ];
      const tagProject = [{ $project: { _id: 1, name: 1, color: 1 } }];

      const workflowStageProject = {
        $project: { _id: 1, stageName: 1, color: 1, order: 1 },
      };

      const baseTaskLookups = [
        // createdBy
        {
          $lookup: {
            from: "users",
            localField: "createdById",
            foreignField: "_id",
            pipeline: userProject,
            as: "createdByDetails",
          },
        },
        {
          $unwind: {
            path: "$createdByDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: "users",
            localField: "assignedTo",
            foreignField: "_id",
            pipeline: userProject,
            as: "assignedToDetails",
          },
        },

        {
          $lookup: {
            from: "users",
            localField: "lastUpdatedBy",
            foreignField: "_id",
            pipeline: userProject,
            as: "lastUpdatedByDetails",
          },
        },
        {
          $unwind: {
            path: "$lastUpdatedByDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: "users",
            localField: "followers",
            foreignField: "_id",
            pipeline: userProject,
            as: "followersDetails",
          },
        },

        {
          $lookup: {
            from: "workflows",
            let: {
              wId: "$workflowId",
              sId: "$stageId",
            },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$wId"] },
                },
              },
              {
                $addFields: {
                  matchedStage: {
                    $filter: {
                      input: "$stages",
                      as: "st",
                      cond: {
                        $eq: ["$$st._id", { $toObjectId: "$$sId" }],
                      },
                    },
                  },
                },
              },
              {
                $project: {
                  workflowName: "$name",
                  stageDetails: {
                    $cond: [
                      { $gt: [{ $size: "$matchedStage" }, 0] },
                      { $arrayElemAt: ["$matchedStage", 0] },
                      null,
                    ],
                  },
                },
              },
            ],
            as: "workflowTemp",
          },
        },
        {
          $unwind: {
            path: "$workflowTemp",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            workflowName: "$workflowTemp.workflowName",
            stageDetails: "$workflowTemp.stageDetails",
          },
        },
        {
          $project: {
            workflowTemp: 0,
          },
        },
        {
          $lookup: {
            from: "tags",
            localField: "tags",
            foreignField: "_id",
            pipeline: tagProject,
            as: "tagsDetails",
          },
        },

        {
          $lookup: {
            from: "users",
            localField: "reminders.userIds",
            foreignField: "_id",
            pipeline: userProject,
            as: "reminderUsers",
          },
        },

        /* ---------------- DEPENDENCIES ---------------- */
        {
          $lookup: {
            from: "projecttaskdependencies",
            localField: "_id",
            foreignField: "taskId",
            as: "dependenciesRaw",
          },
        },
        {
          $lookup: {
            from: "projecttasks",
            localField: "dependenciesRaw.dependsOnTaskId",
            foreignField: "_id",
            as: "dependencyTaskDetails",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "dependencyTaskDetails.assignedTo",
            foreignField: "_id",
            pipeline: userProject,
            as: "dependencyAssignedTo",
          },
        },
        {
          $addFields: {
            dependencyDetails: {
              $map: {
                input: "$dependenciesRaw",
                as: "dep",
                in: {
                  _id: "$$dep._id",
                  dependsOnTaskId: "$$dep.dependsOnTaskId",
                  type: "$$dep.type",
                  taskName: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$dependencyTaskDetails",
                              cond: {
                                $eq: ["$$this._id", "$$dep.dependsOnTaskId"],
                              },
                            },
                          },
                          as: "dt",
                          in: "$$dt.name",
                        },
                      },
                      0,
                    ],
                  },
                  taskStatus: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$dependencyTaskDetails",
                              cond: {
                                $eq: ["$$this._id", "$$dep.dependsOnTaskId"],
                              },
                            },
                          },
                          as: "dt",
                          in: "$$dt.taskStatus",
                        },
                      },
                      0,
                    ],
                  },
                  assignedTo: {
                    $filter: {
                      input: "$dependencyAssignedTo",
                      as: "user",
                      cond: {
                        $in: [
                          "$$user._id",
                          {
                            $ifNull: [
                              {
                                $cond: [
                                  {
                                    $isArray: {
                                      $arrayElemAt: [
                                        {
                                          $map: {
                                            input: {
                                              $filter: {
                                                input: "$dependencyTaskDetails",
                                                cond: {
                                                  $eq: [
                                                    "$$this._id",
                                                    "$$dep.dependsOnTaskId",
                                                  ],
                                                },
                                              },
                                            },
                                            as: "dt",
                                            in: "$$dt.assignedTo",
                                          },
                                        },
                                        0,
                                      ],
                                    },
                                  },
                                  {
                                    $arrayElemAt: [
                                      {
                                        $map: {
                                          input: {
                                            $filter: {
                                              input: "$dependencyTaskDetails",
                                              cond: {
                                                $eq: [
                                                  "$$this._id",
                                                  "$$dep.dependsOnTaskId",
                                                ],
                                              },
                                            },
                                          },
                                          as: "dt",
                                          in: "$$dt.assignedTo",
                                        },
                                      },
                                      0,
                                    ],
                                  },
                                  [],
                                ],
                              },
                              [],
                            ],
                          },
                        ],
                      },
                    },
                  },
                  startDate: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$dependencyTaskDetails",
                              cond: {
                                $eq: ["$$this._id", "$$dep.dependsOnTaskId"],
                              },
                            },
                          },
                          as: "dt",
                          in: "$$dt.startDate",
                        },
                      },
                      0,
                    ],
                  },
                  dueDate: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$dependencyTaskDetails",
                              cond: {
                                $eq: ["$$this._id", "$$dep.dependsOnTaskId"],
                              },
                            },
                          },
                          as: "dt",
                          in: "$$dt.dueDate",
                        },
                      },
                      0,
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            dependenciesRaw: 0,
            dependencyTaskDetails: 0,
            dependencyAssignedTo: 0,
          },
        },

        /* ---------------- COMMENTS ---------------- */
        {
          $lookup: {
            from: "projecttaskcomments",
            let: { tId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$taskId", "$$tId"] } } },
              {
                $sort: { createdAt: -1 },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "createdBy",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "createdByDetails",
                },
              },
              {
                $unwind: {
                  path: "$createdByDetails",
                  preserveNullAndEmptyArrays: true,
                },
              },

              {
                $lookup: {
                  from: "users",
                  localField: "updateBy",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "updateByDetails",
                },
              },
              {
                $unwind: {
                  path: "$updateByDetails",
                  preserveNullAndEmptyArrays: true,
                },
              },

              {
                $lookup: {
                  from: "users",
                  localField: "notifyIds",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "notifyUsers",
                },
              },

              {
                $lookup: {
                  from: "users",
                  localField: "reactions.reactedBy",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "reactionUsers",
                },
              },

              {
                $lookup: {
                  from: "users",
                  localField: "readBy.userId",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "readByUsers",
                },
              },

              {
                $project: {
                  message: 1,
                  files: 1,
                  createdAt: 1,
                  visibilityType: 1,
                  createdBy: "$createdByDetails",
                  updateBy: "$updateByDetails",
                  notifyUsers: 1,
                  reactions: {
                    $map: {
                      input: "$reactions",
                      as: "r",
                      in: {
                        emoji: "$$r.emoji",
                        reactedAt: "$$r.reactedAt",
                        reactedBy: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$reactionUsers",
                                cond: { $eq: ["$$this._id", "$$r.reactedBy"] },
                              },
                            },
                            0,
                          ],
                        },
                      },
                    },
                  },
                  readBy: {
                    $map: {
                      input: "$readBy",
                      as: "rb",
                      in: {
                        readAt: "$$rb.readAt",
                        user: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$readByUsers",
                                cond: { $eq: ["$$this._id", "$$rb.userId"] },
                              },
                            },
                            0,
                          ],
                        },
                      },
                    },
                  },
                },
              },
            ],
            as: "comments",
          },
        },
      ];

      /* ---------------- AGGREGATION ---------------- */

      // Build RBAC expression (comprehensive) to insert into task match when user is NOT privileged
      const userObjId = !isPrivileged
        ? new mongoose.Types.ObjectId(currentUser)
        : null;

      // create the RBAC $expr filter only if not privileged
      const rbacExprForTasks = !isPrivileged
        ? {
            $or: [
              { $eq: ["$createdById", userObjId] },
              { $eq: ["$createdBy", userObjId] },

              // assignedTo: direct id in array
              {
                $in: [userObjId, { $ifNull: ["$assignedTo", []] }],
              },
              // assignedTo: array of subdocs with _id
              {
                $in: [
                  userObjId,
                  {
                    $map: {
                      input: { $ifNull: ["$assignedTo", []] },
                      as: "a",
                      in: {
                        $cond: [
                          { $ifNull: ["$$a._id", false] },
                          "$$a._id",
                          "$$a",
                        ],
                      },
                    },
                  },
                ],
              },

              // followers: direct id in array
              {
                $in: [userObjId, { $ifNull: ["$followers", []] }],
              },
              // followers: array of subdocs with _id
              {
                $in: [
                  userObjId,
                  {
                    $map: {
                      input: { $ifNull: ["$followers", []] },
                      as: "f",
                      in: {
                        $cond: [
                          { $ifNull: ["$$f._id", false] },
                          "$$f._id",
                          "$$f",
                        ],
                      },
                    },
                  },
                ],
              },
            ],
          }
        : null;

      const lists = await TaskList.aggregate([
        { $match: listMatch },
        { $sort: { orderIndex: 1 } },
        { $skip: listSkip },
        { $limit: pageSize },

        // ===== VIEWBY USER DETAILS =====
        {
          $lookup: {
            from: "users",
            localField: "viewBy",
            foreignField: "_id",
            as: "viewByDetails",
          },
        },
        {
          $addFields: {
            viewBy: {
              $map: {
                input: "$viewByDetails",
                as: "v",
                in: {
                  _id: "$$v._id",
                  name: "$$v.name",
                  image: "$$v.image",
                },
              },
            },
          },
        },
        { $project: { viewByDetails: 0 } },

        {
          $lookup: {
            from: "projecttasks",
            let: { listId: "$_id" },
            pipeline: [
              {
                $lookup: {
                  from: "users",
                  localField: "assignedTo",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "assignedUsersTemp",
                },
              },
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$taskListId", "$$listId"] },
                      { $eq: ["$projectId", projectObjectId] },
                      { $eq: ["$deleteFlag", deleteFlag] },
                      { $eq: ["$parentTaskId", null] },
                      ...(taskStatus
                        ? [{ $eq: ["$taskStatus", taskStatus] }]
                        : []),

                      // Inject RBAC: only for non-privileged users
                      ...(rbacExprForTasks ? [rbacExprForTasks] : []),

                      ...(search
                        ? [
                            {
                              $or: [
                                {
                                  $regexMatch: {
                                    input: "$name",
                                    regex: search,
                                    options: "i",
                                  },
                                },
                                {
                                  $regexMatch: {
                                    input: {
                                      $reduce: {
                                        input: "$assignedUsersTemp.name",
                                        initialValue: "",
                                        in: {
                                          $concat: ["$$value", " ", "$$this"],
                                        },
                                      },
                                    },
                                    regex: search,
                                    options: "i",
                                  },
                                },
                              ],
                            },
                          ]
                        : []),
                    ],
                  },
                },
              },

              ...(byUser && isPrivileged
                ? [
                    {
                      $match: {
                        $expr: {
                          $or: [
                            {
                              $eq: [
                                "$createdById",
                                new mongoose.Types.ObjectId(byUser),
                              ],
                            },
                            {
                              $eq: [
                                "$createdBy",
                                new mongoose.Types.ObjectId(byUser),
                              ],
                            },

                            // assignedTo (array of ids OR objects)
                            {
                              $in: [
                                new mongoose.Types.ObjectId(byUser),
                                {
                                  $map: {
                                    input: { $ifNull: ["$assignedTo", []] },
                                    as: "a",
                                    in: {
                                      $cond: [
                                        { $ifNull: ["$$a._id", false] },
                                        "$$a._id",
                                        "$$a",
                                      ],
                                    },
                                  },
                                },
                              ],
                            },

                            // followers (array of ids OR objects)
                            {
                              $in: [
                                new mongoose.Types.ObjectId(byUser),
                                {
                                  $map: {
                                    input: { $ifNull: ["$followers", []] },
                                    as: "f",
                                    in: {
                                      $cond: [
                                        { $ifNull: ["$$f._id", false] },
                                        "$$f._id",
                                        "$$f",
                                      ],
                                    },
                                  },
                                },
                              ],
                            },
                          ],
                        },
                      },
                    },
                  ]
                : []),

              { $sort: { createdAt: -1 } },
              { $skip: taskSkip },
              { $limit: taskPageSize },

              ...baseTaskLookups,

              /* -------- SUB TASK IDS -------- */
              {
                $graphLookup: {
                  from: "projecttasks",
                  startWith: "$_id",
                  connectFromField: "_id",
                  connectToField: "parentTaskId",
                  as: "allSubTasks",
                  restrictSearchWithMatch: {
                    deleteFlag,
                    projectId: projectObjectId,
                  },
                },
              },

              /* -------- ENRICH SUB TASKS -------- */
              {
                $lookup: {
                  from: "projecttasks",
                  let: { subIds: "$allSubTasks._id" },
                  pipeline: [
                    { $match: { $expr: { $in: ["$_id", "$$subIds"] } } },

                    //  SUBTASK RBAC (assigned OR creator)
                    ...(!isPrivileged
                      ? [
                          {
                            $match: {
                              $expr: {
                                $or: [
                                  { $eq: ["$createdById", userObjId] },
                                  { $eq: ["$createdBy", userObjId] },

                                  {
                                    $in: [
                                      userObjId,
                                      { $ifNull: ["$assignedTo", []] },
                                    ],
                                  },
                                  {
                                    $in: [
                                      userObjId,
                                      {
                                        $map: {
                                          input: {
                                            $ifNull: ["$assignedTo", []],
                                          },
                                          as: "a",
                                          in: {
                                            $cond: [
                                              { $ifNull: ["$$a._id", false] },
                                              "$$a._id",
                                              "$$a",
                                            ],
                                          },
                                        },
                                      },
                                    ],
                                  },

                                  {
                                    $in: [
                                      userObjId,
                                      { $ifNull: ["$followers", []] },
                                    ],
                                  },
                                  {
                                    $in: [
                                      userObjId,
                                      {
                                        $map: {
                                          input: {
                                            $ifNull: ["$followers", []],
                                          },
                                          as: "f",
                                          in: {
                                            $cond: [
                                              { $ifNull: ["$$f._id", false] },
                                              "$$f._id",
                                              "$$f",
                                            ],
                                          },
                                        },
                                      },
                                    ],
                                  },
                                ],
                              },
                            },
                          },
                        ]
                      : []),

                    ...baseTaskLookups,
                  ],
                  as: "enrichedSubTasks",
                },
              },
            ],
            as: "tasks",
          },
        },
      ]);
      let customFieldList = [];
      const moduleType = "Task";
      customFieldList = await this.getCustomFieldList(
        SITE_DB_NAME,
        moduleType,
        0,
      );
      /* ---------------- BUILD TREE ---------------- */
      const buildTree = (tasks, parentId = null) =>
        tasks
          .filter((t) =>
            parentId === null
              ? t.parentTaskId === null
              : String(t.parentTaskId) === String(parentId),
          )
          .map((t) => ({
            ...t,
            subTasks: buildTree(tasks, t._id),
          }));

      /* ---------------- CUSTOM FIELD ENRICH ---------------- */
      const enrichCustomFields = (entity) => {
        entity.customFields = entity.customFields || {};
        const newCustomFields = {};

        for (const field of customFieldList) {
          const key = field.keyName;
          newCustomFields[key] = {
            fieldName: field.fieldName,
            keyName: field.keyName,
            fieldType: field.fieldType,
            options: field.options,
            _id: field._id,
            moduleType: field.moduleType,
            updatedAt: field.updatedAt,
            createdAt: field.createdAt,
            activeFlag: field.activeFlag,
            deleteFlag: field.deleteFlag,
            value: entity.customFields[key]
              ? entity.customFields[key].value
              : null,
          };
        }

        entity.customFields = newCustomFields;
        return entity;
      };

      const enrichTasksRecursive = (tasks) =>
        tasks.map((task) => {
          enrichCustomFields(task);
          if (task.subTasks?.length) {
            task.subTasks = enrichTasksRecursive(task.subTasks);
          }
          return task;
        });

      /* ---------------- FINAL TRANSFORM ---------------- */
      lists.forEach((list) => {
        list.tasks = list.tasks.map((task) => {
          const flat = [
            { ...task, parentTaskId: null },
            ...(task.enrichedSubTasks || []),
          ];
          const tree = buildTree(flat);
          task.subTasks = tree[0]?.subTasks || [];
          delete task.allSubTasks;
          delete task.enrichedSubTasks;
          return task;
        });

        list.tasks = enrichTasksRecursive(list.tasks);
      });

      return lists;
    } catch (error) {
      console.error("Error in getAllTask :", error);
      throw error;
    }
  },

  // Final getMyWork - with projectDetails, taskListDetails and parent comments included
  async getMyWork(
    SITE_DB_NAME,
    deleteFlag = 0,
    projectId = null,
    pagination = {},
    search = "",
    taskPagination = {},
    taskStatus,
    currentUser,
    userRoleName,
    options = {},
  ) {
    try {
      const TaskList = await TaskListModel(SITE_DB_NAME);
      const Project = await ProjectModel(SITE_DB_NAME);
      const ProjectTask = await TaskModel(SITE_DB_NAME);

      const mongoose = require("mongoose");
      const moment = require("moment");

      const { pageSize = 10, pageNumber = 1 } = pagination;
      const { taskPageSize = 50, taskPageNumber = 1 } = taskPagination;
      const listSkip = (pageNumber - 1) * pageSize;
      const taskSkip = (taskPageNumber - 1) * taskPageSize;

      const {
        excludeBlocked = false,
        includeStartedToday = false,
        excludeAssignedToTeams = false,
        excludeSubTasks = false,
        tags = null,
        priority = null,
        stageId = null,
        bucket = null,
      } = options || {};

      /* ---------------- ROLE CHECK ---------------- */
      const privilegedRoles = ["Site-Owner", "Admin"];
      const isSiteOwner = privilegedRoles.includes(userRoleName);

      let isProjectOwner = false;
      if (projectId) {
        try {
          const projectDoc = await Project.findById(projectId, {
            ownerId: 1,
          }).lean();
          if (projectDoc?.ownerId && currentUser) {
            isProjectOwner = String(projectDoc.ownerId) === String(currentUser);
          }
        } catch (err) {
          console.warn("Could not fetch project owner for role check:", err);
        }
      }

      const isPrivileged = isSiteOwner || isProjectOwner;

      // For getMyWork we require currentUser and always filter by assignedTo containing currentUser.
      if (!currentUser) return "NA";
      const userObjId = new mongoose.Types.ObjectId(currentUser);

      /* ---------------- COMMON LOOKUPS ---------------- */
      const userProject = [
        {
          $project: {
            _id: 1,
            name: 1,
            image: 1,
            roleId: 1,
            designationId: 1,
            companyId: 1,
          },
        },
      ];
      const tagProject = [{ $project: { _id: 1, name: 1, color: 1 } }];

      // baseTaskLookups now includes:
      // - assignedToDetails, createdByDetails, lastUpdatedByDetails, followersDetails
      // - workflow/stage (workflowTemp -> workflowName/stageDetails)
      // - tagsDetails
      // - projectDetails (minimal), taskListDetails (minimal)
      // - comments (for parent & subtask) - minimal createdBy details
      const baseTaskLookups = [
        // assignedTo details
        {
          $lookup: {
            from: "users",
            localField: "assignedTo",
            foreignField: "_id",
            pipeline: userProject,
            as: "assignedToDetails",
          },
        },

        // createdBy details
        {
          $lookup: {
            from: "users",
            localField: "createdById",
            foreignField: "_id",
            pipeline: userProject,
            as: "createdByDetails",
          },
        },
        {
          $unwind: {
            path: "$createdByDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // lastUpdatedBy
        {
          $lookup: {
            from: "users",
            localField: "lastUpdatedBy",
            foreignField: "_id",
            pipeline: userProject,
            as: "lastUpdatedByDetails",
          },
        },
        {
          $unwind: {
            path: "$lastUpdatedByDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // followers
        {
          $lookup: {
            from: "users",
            localField: "followers",
            foreignField: "_id",
            pipeline: userProject,
            as: "followersDetails",
          },
        },

        // workflow + matched stage
        {
          $lookup: {
            from: "workflows",
            let: { wId: "$workflowId", sId: "$stageId" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$wId"] } } },
              {
                $addFields: {
                  matchedStage: {
                    $filter: {
                      input: "$stages",
                      as: "st",
                      cond: { $eq: ["$$st._id", { $toObjectId: "$$sId" }] },
                    },
                  },
                },
              },
              {
                $project: {
                  workflowName: "$name",
                  stageDetails: {
                    $cond: [
                      { $gt: [{ $size: "$matchedStage" }, 0] },
                      { $arrayElemAt: ["$matchedStage", 0] },
                      null,
                    ],
                  },
                },
              },
            ],
            as: "workflowTemp",
          },
        },
        {
          $unwind: { path: "$workflowTemp", preserveNullAndEmptyArrays: true },
        },
        {
          $addFields: {
            workflowName: "$workflowTemp.workflowName",
            stageDetails: "$workflowTemp.stageDetails",
          },
        },
        { $project: { workflowTemp: 0 } },

        // tags
        {
          $lookup: {
            from: "tags",
            localField: "tags",
            foreignField: "_id",
            pipeline: tagProject,
            as: "tagsDetails",
          },
        },

        // projectDetails (minimal: _id, name)
        {
          $lookup: {
            from: "projects",
            localField: "projectId",
            foreignField: "_id",
            pipeline: [{ $project: { _id: 1, name: 1 } }],
            as: "projectDetails",
          },
        },
        {
          $unwind: {
            path: "$projectDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // taskListDetails (minimal: _id, name, listIcon)
        {
          $lookup: {
            from: "projecttasklists",
            localField: "taskListId",
            foreignField: "_id",
            pipeline: [{ $project: { _id: 1, name: 1, listIcon: 1 } }],
            as: "taskListDetails",
          },
        },
        {
          $unwind: {
            path: "$taskListDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // parent comments (minimal) - included in base so parent also gets comments
        {
          $lookup: {
            from: "projecttaskcomments",
            let: { tId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$taskId", "$$tId"] } } },
              { $sort: { createdAt: -1 } },
              {
                $lookup: {
                  from: "users",
                  localField: "createdBy",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "createdByDetails",
                },
              },
              {
                $unwind: {
                  path: "$createdByDetails",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $project: {
                  message: 1,
                  files: 1,
                  createdAt: 1,
                  visibilityType: 1,
                  createdBy: "$createdByDetails",
                },
              },
            ],
            as: "comments",
          },
        },

        // reminder users
        {
          $lookup: {
            from: "users",
            localField: "reminders.userIds",
            foreignField: "_id",
            pipeline: userProject,
            as: "reminderUsers",
          },
        },

        /* dependencies */
        {
          $lookup: {
            from: "projecttaskdependencies",
            localField: "_id",
            foreignField: "taskId",
            as: "dependenciesRaw",
          },
        },
        {
          $lookup: {
            from: "projecttasks",
            localField: "dependenciesRaw.dependsOnTaskId",
            foreignField: "_id",
            as: "dependencyTaskDetails",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "dependencyTaskDetails.assignedTo",
            foreignField: "_id",
            pipeline: userProject,
            as: "dependencyAssignedTo",
          },
        },
        {
          $addFields: {
            dependencyDetails: {
              $map: {
                input: "$dependenciesRaw",
                as: "dep",
                in: {
                  _id: "$$dep._id",
                  dependsOnTaskId: "$$dep.dependsOnTaskId",
                  type: "$$dep.type",
                  taskName: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$dependencyTaskDetails",
                              cond: {
                                $eq: ["$$this._id", "$$dep.dependsOnTaskId"],
                              },
                            },
                          },
                          as: "dt",
                          in: "$$dt.name",
                        },
                      },
                      0,
                    ],
                  },
                  taskStatus: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$dependencyTaskDetails",
                              cond: {
                                $eq: ["$$this._id", "$$dep.dependsOnTaskId"],
                              },
                            },
                          },
                          as: "dt",
                          in: "$$dt.taskStatus",
                        },
                      },
                      0,
                    ],
                  },
                  assignedTo: {
                    $filter: {
                      input: "$dependencyAssignedTo",
                      as: "user",
                      cond: {
                        $in: [
                          "$$user._id",
                          {
                            $ifNull: [
                              {
                                $cond: [
                                  {
                                    $isArray: {
                                      $arrayElemAt: [
                                        {
                                          $map: {
                                            input: {
                                              $filter: {
                                                input: "$dependencyTaskDetails",
                                                cond: {
                                                  $eq: [
                                                    "$$this._id",
                                                    "$$dep.dependsOnTaskId",
                                                  ],
                                                },
                                              },
                                            },
                                            as: "dt",
                                            in: "$$dt.assignedTo",
                                          },
                                        },
                                        0,
                                      ],
                                    },
                                  },
                                  {
                                    $arrayElemAt: [
                                      {
                                        $map: {
                                          input: {
                                            $filter: {
                                              input: "$dependencyTaskDetails",
                                              cond: {
                                                $eq: [
                                                  "$$this._id",
                                                  "$$dep.dependsOnTaskId",
                                                ],
                                              },
                                            },
                                          },
                                          as: "dt",
                                          in: "$$dt.assignedTo",
                                        },
                                      },
                                      0,
                                    ],
                                  },
                                  [],
                                ],
                              },
                              [],
                            ],
                          },
                        ],
                      },
                    },
                  },
                  startDate: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$dependencyTaskDetails",
                              cond: {
                                $eq: ["$$this._id", "$$dep.dependsOnTaskId"],
                              },
                            },
                          },
                          as: "dt",
                          in: "$$dt.startDate",
                        },
                      },
                      0,
                    ],
                  },
                  dueDate: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$dependencyTaskDetails",
                              cond: {
                                $eq: ["$$this._id", "$$dep.dependsOnTaskId"],
                              },
                            },
                          },
                          as: "dt",
                          in: "$$dt.dueDate",
                        },
                      },
                      0,
                    ],
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            dependenciesRaw: 0,
            dependencyTaskDetails: 0,
            dependencyAssignedTo: 0,
          },
        },
      ];

      /* ---------------- LIST MATCH ---------------- */
      const listMatch = { deleteFlag: deleteFlag };
      if (projectId) {
        try {
          listMatch.projectId = new mongoose.Types.ObjectId(projectId);
        } catch (e) {}
      }
      if (!isPrivileged && userObjId) {
        // keep viewBy restrictions as-is
        listMatch.$or = [
          { viewBy: { $exists: false } },
          { viewBy: { $size: 0 } },
          { viewBy: userObjId },
        ];
      }

      /* ---------------- AGGREGATION - fetch lists with parent tasks + enriched subtasks ---------------- */
      const lists = await TaskList.aggregate([
        { $match: listMatch },
        { $sort: { orderIndex: 1 } },
        { $skip: listSkip },
        { $limit: pageSize },

        // viewBy details
        {
          $lookup: {
            from: "users",
            localField: "viewBy",
            foreignField: "_id",
            as: "viewByDetails",
          },
        },
        {
          $addFields: {
            viewBy: {
              $map: {
                input: "$viewByDetails",
                as: "v",
                in: { _id: "$$v._id", name: "$$v.name", image: "$$v.image" },
              },
            },
          },
        },
        { $project: { viewByDetails: 0 } },

        // tasks per list
        {
          $lookup: {
            from: "projecttasks",
            let: { listId: "$_id" },
            pipeline: [
              // assignedUsersTemp for search helper
              {
                $lookup: {
                  from: "users",
                  localField: "assignedTo",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "assignedUsersTemp",
                },
              },

              // MATCH parent tasks + strict assignedTo check (MANDATORY)
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$taskListId", "$$listId"] },
                      ...(projectId
                        ? [
                            {
                              $eq: [
                                "$projectId",
                                new mongoose.Types.ObjectId(projectId),
                              ],
                            },
                          ]
                        : []),
                      { $eq: ["$deleteFlag", deleteFlag] },
                      { $eq: ["$parentTaskId", null] },

                      // exclude completed/done/closed
                      {
                        $not: [
                          {
                            $in: [
                              { $toLower: { $ifNull: ["$taskStatus", ""] } },
                              ["completed", "done", "closed"],
                            ],
                          },
                        ],
                      },

                      // STRICT assignedTo check ALWAYS (for getMyWork)
                      {
                        $anyElementTrue: {
                          $map: {
                            input: { $ifNull: ["$assignedTo", []] },
                            as: "a",
                            in: {
                              $eq: [
                                userObjId,
                                {
                                  $cond: [
                                    { $ifNull: ["$$a._id", false] },
                                    "$$a._id",
                                    "$$a",
                                  ],
                                },
                              ],
                            },
                          },
                        },
                      },

                      // optional taskStatus filter (if explicitly passed)
                      ...(taskStatus
                        ? [{ $eq: ["$taskStatus", taskStatus] }]
                        : []),

                      // optional search filter
                      ...(search
                        ? [
                            {
                              $or: [
                                {
                                  $regexMatch: {
                                    input: "$name",
                                    regex: search,
                                    options: "i",
                                  },
                                },
                                {
                                  $regexMatch: {
                                    input: {
                                      $reduce: {
                                        input: "$assignedUsersTemp.name",
                                        initialValue: "",
                                        in: {
                                          $concat: ["$$value", " ", "$$this"],
                                        },
                                      },
                                    },
                                    regex: search,
                                    options: "i",
                                  },
                                },
                              ],
                            },
                          ]
                        : []),
                    ],
                  },
                },
              },

              { $sort: { createdAt: -1 } },
              { $skip: taskSkip },
              { $limit: taskPageSize },

              // apply base lookups (this includes projectDetails, taskListDetails, comments etc.)
              ...baseTaskLookups,

              // graphLookup for all subtask ids
              {
                $graphLookup: {
                  from: "projecttasks",
                  startWith: "$_id",
                  connectFromField: "_id",
                  connectToField: "parentTaskId",
                  as: "allSubTasks",
                  restrictSearchWithMatch: {
                    deleteFlag,
                    ...(projectId
                      ? { projectId: new mongoose.Types.ObjectId(projectId) }
                      : {}),
                  },
                },
              },

              // enrichSubTasks (kept even if subtask assignedTo doesn't include user)
              {
                $lookup: {
                  from: "projecttasks",
                  let: { subIds: "$allSubTasks._id" },
                  pipeline: [
                    { $match: { $expr: { $in: ["$_id", "$$subIds"] } } },

                    // apply base lookups for subtasks too (so they get projectDetails/taskListDetails/comments/tagsDetails etc.)
                    ...baseTaskLookups,

                    // comments for subtask already handled in baseTaskLookups; keep a small comments projection if you want heavier detail remove duplication
                    {
                      $project: {
                        name: 1,
                        _id: 1,
                        projectId: 1,
                        taskListId: 1,
                        parentTaskId: 1,
                        assignedTo: 1,
                        assignedToDetails: 1,
                        createdById: 1,
                        createdByDetails: 1,
                        followersDetails: 1,
                        startDate: 1,
                        dueDate: 1,
                        taskStatus: 1,
                        priority: 1,
                        stageId: 1,
                        stageDetails: 1,
                        workflowId: 1,
                        workflowName: 1,
                        tags: 1,
                        tagsDetails: 1,
                        comments: 1,
                        reminders: 1,
                        customFields: 1,
                        files: 1,
                        orderIndex: 1,
                        estimateMinutes: 1,
                        progress: 1,
                        followers: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        lastUpdatedByDetails: 1,
                        taskNumber: 1,
                        projectDetails: 1,
                        taskListDetails: 1,
                      },
                    },
                  ],
                  as: "enrichedSubTasks",
                },
              },

              // parent final projection
              {
                $project: {
                  name: 1,
                  _id: 1,
                  projectId: 1,
                  projectDetails: 1,
                  taskListId: 1,
                  taskListDetails: 1,
                  parentTaskId: 1,
                  startDate: 1,
                  dueDate: 1,
                  taskStatus: 1,
                  assignedTo: 1,
                  assignedToDetails: 1,
                  createdByDetails: 1,
                  followersDetails: 1,
                  tagsDetails: 1,
                  description: 1,
                  priority: 1,
                  stageId: 1,
                  stageDetails: 1,
                  workflowName: 1,
                  comments: 1,
                  enrichedSubTasks: 1,
                  allSubTasks: 1,
                  customFields: 1,
                  blocked: 1,
                  taskNumber: 1,
                  reminders: 1,
                  reminderUsers: 1,
                  dependencyDetails: 1,
                  files: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  orderIndex: 1,
                  estimateMinutes: 1,
                  progress: 1,
                  followers: 1,
                  lastUpdatedByDetails: 1,
                },
              },
            ],
            as: "tasks",
          },
        },
      ]).allowDiskUse(true);

      /* ---------------- CUSTOM FIELDS & BUILD TREE ---------------- */
      const customFieldList = await this.getCustomFieldList(
        SITE_DB_NAME,
        "Task",
        0,
      );

      const buildTree = (tasks, parentId = null) =>
        tasks
          .filter((t) =>
            parentId === null
              ? t.parentTaskId === null
              : String(t.parentTaskId) === String(parentId),
          )
          .map((t) => ({ ...t, subTasks: buildTree(tasks, t._id) }));

      const enrichCustomFields = (entity) => {
        entity.customFields = entity.customFields || {};
        const newCustomFields = {};
        for (const field of customFieldList) {
          const key = field.keyName;
          newCustomFields[key] = {
            fieldName: field.fieldName,
            keyName: field.keyName,
            fieldType: field.fieldType,
            options: field.options,
            _id: field._id,
            moduleType: field.moduleType,
            updatedAt: field.updatedAt,
            createdAt: field.createdAt,
            activeFlag: field.activeFlag,
            deleteFlag: field.deleteFlag,
            value:
              entity.customFields && entity.customFields[key]
                ? entity.customFields[key].value
                : null,
          };
        }
        entity.customFields = newCustomFields;
        return entity;
      };

      const enrichTasksRecursive = (tasks) =>
        tasks.map((task) => {
          enrichCustomFields(task);
          if (task.subTasks?.length)
            task.subTasks = enrichTasksRecursive(task.subTasks);
          task.tagsDetails = task.tagsDetails || [];
          // ensure project/taskList minimal placeholders
          task.projectDetails = task.projectDetails || null;
          task.taskListDetails = task.taskListDetails || null;
          return task;
        });

      /* ---------------- TRANSFORM each list: build nested subTasks ---------------- */
      lists.forEach((list) => {
        list.tasks = list.tasks.map((task) => {
          const flat = [
            { ...task, parentTaskId: null },
            ...(task.enrichedSubTasks || []),
          ];
          const tree = buildTree(flat);
          task.subTasks = tree[0]?.subTasks || [];
          delete task.allSubTasks;
          delete task.enrichedSubTasks;
          return task;
        });
        list.tasks = enrichTasksRecursive(list.tasks);
      });

      /* ---------------- FLATTEN ALL PARENT TASKS across lists ---------------- */
      const allTasks = (lists || []).flatMap((l) => l.tasks || []);

      /* ---------------- BUCKET LOGIC ---------------- */
      const toMoment = (d) => (d ? moment(d) : null);
      const todayStart = moment().startOf("day");
      const todayEnd = moment().endOf("day");

      const decideBucketFor = (task) => {
        const dd = toMoment(task.dueDate);
        const sd = toMoment(task.startDate);
        if (
          !dd &&
          includeStartedToday &&
          sd &&
          sd.isBetween(todayStart, todayEnd, null, "[]")
        )
          return "Today";
        if (!dd && !sd) return "No due date";
        const ref = dd || sd;
        if (!ref) return "No due date";
        if (dd && ref.isBefore(todayStart, "second")) return "Late";
        if (ref.isBetween(todayStart, todayEnd, null, "[]")) return "Today";
        if (
          ref.isBetween(
            moment().subtract(1, "day").startOf("day"),
            moment().subtract(1, "day").endOf("day"),
            null,
            "[]",
          )
        )
          return "Yesterday";
        if (
          ref.isBetween(
            moment().add(1, "day").startOf("day"),
            moment().add(1, "day").endOf("day"),
            null,
            "[]",
          )
        )
          return "Tomorrow";
        const daysDiff = ref.diff(todayStart, "days");
        if (daysDiff > 0 && daysDiff <= 7) return "Next 7 days";
        if (daysDiff > 7 && daysDiff <= 14) return "Next 14 days";
        if (daysDiff > 14 && daysDiff <= 30) return "Next 30 days";
        if (
          ref.isBetween(
            moment().startOf("isoWeek"),
            moment().endOf("isoWeek"),
            null,
            "[]",
          )
        )
          return "This week";
        if (
          ref.isBetween(
            moment().subtract(1, "week").startOf("isoWeek"),
            moment().subtract(1, "week").endOf("isoWeek"),
            null,
            "[]",
          )
        )
          return "Last week";
        if (
          ref.isBetween(
            moment().add(1, "week").startOf("isoWeek"),
            moment().add(1, "week").endOf("isoWeek"),
            null,
            "[]",
          )
        )
          return "Next week";
        if (
          ref.isBetween(
            moment().startOf("month"),
            moment().endOf("month"),
            null,
            "[]",
          )
        )
          return "This month";
        if (
          ref.isBetween(
            moment().subtract(1, "month").startOf("month"),
            moment().subtract(1, "month").endOf("month"),
            null,
            "[]",
          )
        )
          return "Last month";
        if (
          ref.isBetween(
            moment().add(1, "month").startOf("month"),
            moment().add(1, "month").endOf("month"),
            null,
            "[]",
          )
        )
          return "Next month";
        if (ref.isSame(moment(), "year")) return "This year";
        if (ref.isSame(moment().subtract(1, "year"), "year"))
          return "Last year";
        if (ref.isSame(moment().add(1, "year"), "year")) return "Next year";
        return "No due date";
      };

      const buckets = {
        Late: [],
        Today: [],
        Yesterday: [],
        Tomorrow: [],
        "No due date": [],
        "Next 7 days": [],
        "Next 14 days": [],
        "Next 30 days": [],
        "This week": [],
        "Last week": [],
        "Next week": [],
        "This month": [],
        "Last month": [],
        "Next month": [],
        "This year": [],
        "Last year": [],
        "Next year": [],
      };

      for (const t of allTasks) {
        if (excludeBlocked && (t.blocked === true || t.isBlocked === true))
          continue;

        if (excludeAssignedToTeams) {
          const arr = t.assignedTo || [];
          let isTeam = false;
          for (const a of arr) {
            if (!a) continue;
            if (
              typeof a === "object" &&
              !a._id &&
              (a.teamId || a.team || a.isTeam)
            ) {
              isTeam = true;
              break;
            }
          }
          if (isTeam) continue;
        }

        if (
          priority &&
          t.priority &&
          t.priority.toLowerCase() !== priority.toLowerCase()
        )
          continue;
        if (stageId && t.stageId && String(t.stageId) !== String(stageId))
          continue;

        if (tags && Array.isArray(tags) && tags.length > 0) {
          const tIds = (t.tagsDetails || []).map((x) => String(x._id));
          const intersects = tags.some((tag) => tIds.includes(String(tag)));
          if (!intersects) continue;
        }

        const b = decideBucketFor(t);
        if (buckets[b]) buckets[b].push(t);
      }

      let finalBuckets = buckets;
      if (bucket && Object.prototype.hasOwnProperty.call(buckets, bucket))
        finalBuckets = { [bucket]: buckets[bucket] };

      const result = {};
      for (const [k, arr] of Object.entries(finalBuckets))
        result[k] = { label: k, count: arr.length, tasks: arr };
      result.total = Object.values(finalBuckets).reduce(
        (s, a) => s + a.length,
        0,
      );

      return result;
    } catch (error) {
      console.error("Error in getMyWork :", error);
      throw error;
    }
  },

  async getAllTask1(
    SITE_DB_NAME,
    deleteFlag,
    projectId,
    pagination,
    search,
    taskPagination,
    taskListId = null,
    taskStatus,
    byUser,
    subTaskPagination,
    subTaskId,
  ) {
    try {
      const mongoose = require("mongoose");
      const TaskList = await TaskListModel(SITE_DB_NAME);
      const Task = await TaskModel(SITE_DB_NAME);

      const { pageSize = 10, pageNumber = 1 } = pagination || {};
      const skipLists = Math.max(0, pageNumber - 1) * pageSize;
      const limitLists = pageSize;

      const { taskPageNumber = 1, taskPageSize = 10 } = taskPagination || {};
      const taskSkip = Math.max(0, taskPageNumber - 1) * taskPageSize;
      const taskLimit = taskPageSize;

      const { subTaskPageNumber = 1, subTaskPageSize = 10 } =
        subTaskPagination || {};
      const subTaskSkip = Math.max(0, subTaskPageNumber - 1) * subTaskPageSize;
      const subTaskLimit = Math.max(1, subTaskPageSize);

      // prepare subTaskObjectId if provided and valid
      let subTaskObjectId = null;
      if (subTaskId && mongoose.Types.ObjectId.isValid(subTaskId)) {
        subTaskObjectId = new mongoose.Types.ObjectId(subTaskId);
      }

      // If search is present and may match task names, first find matching listIds from tasks
      let listIdsFromTaskSearch = [];
      if (search && search.trim() !== "") {
        const regex = new RegExp(search.trim(), "i");
        listIdsFromTaskSearch = await Task.distinct("taskListId", {
          projectId: new mongoose.Types.ObjectId(projectId),
          deleteFlag: deleteFlag,
          name: { $regex: regex },
        });
      }

      // Build list match
      const listMatch = {
        projectId: new mongoose.Types.ObjectId(projectId),
        deleteFlag: deleteFlag,
      };
      if (taskListId) {
        listMatch._id = new mongoose.Types.ObjectId(taskListId);
      } else if (search && search.trim() !== "") {
        const regex = new RegExp(search.trim(), "i");
        listMatch.$or = [
          { name: { $regex: regex } },
          ...(listIdsFromTaskSearch.length
            ? [{ _id: { $in: listIdsFromTaskSearch } }]
            : []),
        ];
      }

      // user projection helper used in many lookups
      const userProject = [{ $project: { _id: 1, name: 1, image: 1 } }];

      // Main pipeline: lists -> tasks (parent tasks) -> subTasks (inside each task)
      const pipeline = [
        { $match: listMatch },
        { $sort: { orderIndex: 1, createdAt: 1 } },
        { $skip: skipLists },
        { $limit: limitLists },

        // createdBy
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            pipeline: userProject,
            as: "createdByDetails",
          },
        },
        {
          $unwind: {
            path: "$createdByDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // viewBy
        {
          $lookup: {
            from: "users",
            localField: "viewBy",
            foreignField: "_id",
            pipeline: userProject,
            as: "viewByDetails",
          },
        },

        // nested lookup: parent tasks belonging to this list (with per-list task pagination)
        {
          $lookup: {
            from: "projecttasks",
            let: { listId: "$_id", projId: "$projectId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$taskListId", "$$listId"] },
                      { $eq: ["$projectId", "$$projId"] },
                      { $eq: ["$deleteFlag", deleteFlag] },
                      { $eq: ["$parentTaskId", null] },
                      ...(taskStatus && typeof taskStatus === "string"
                        ? [{ $eq: ["$taskStatus", taskStatus] }]
                        : []),
                    ].filter(Boolean),
                  },
                },
              },
              ...(byUser && mongoose.Types.ObjectId.isValid(byUser)
                ? [
                    {
                      $match: {
                        assignedTo: {
                          $in: [new mongoose.Types.ObjectId(byUser)],
                        },
                      },
                    },
                  ]
                : []),
              { $sort: { createdAt: -1 } },
              { $skip: taskSkip },
              { $limit: taskLimit },

              // assignedTo
              {
                $lookup: {
                  from: "users",
                  localField: "assignedTo",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "assignedToDetails",
                },
              },

              // createdBy (createdById -> user object) — keeping same field as your original code
              {
                $lookup: {
                  from: "users",
                  localField: "createdById",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "createdByDetails",
                },
              },
              {
                $unwind: {
                  path: "$createdByDetails",
                  preserveNullAndEmptyArrays: true,
                },
              },

              // lastUpdatedBy
              {
                $lookup: {
                  from: "users",
                  localField: "lastUpdatedBy",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "lastUpdatedByDetails",
                },
              },
              {
                $unwind: {
                  path: "$lastUpdatedByDetails",
                  preserveNullAndEmptyArrays: true,
                },
              },

              // followers
              {
                $lookup: {
                  from: "users",
                  localField: "followers",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "followersDetails",
                },
              },

              // tags
              {
                $lookup: {
                  from: "tags",
                  localField: "tags",
                  foreignField: "_id",
                  pipeline: [{ $project: { _id: 1, name: 1, color: 1 } }],
                  as: "tagsDetails",
                },
              },

              // reminders -> reminderUsers
              {
                $lookup: {
                  from: "users",
                  localField: "reminders.userIds",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "reminderUsers",
                },
              },

              // comments (simplified like your tasks pipeline)
              {
                $lookup: {
                  from: "projecttaskcomments",
                  let: { tId: "$_id" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$taskId", "$$tId"] } } },

                    // createdBy
                    {
                      $lookup: {
                        from: "users",
                        localField: "createdBy",
                        foreignField: "_id",
                        pipeline: userProject,
                        as: "createdByDetails",
                      },
                    },
                    {
                      $unwind: {
                        path: "$createdByDetails",
                        preserveNullAndEmptyArrays: true,
                      },
                    },

                    // updateBy
                    {
                      $lookup: {
                        from: "users",
                        localField: "updateBy",
                        foreignField: "_id",
                        pipeline: userProject,
                        as: "updateByDetails",
                      },
                    },
                    {
                      $unwind: {
                        path: "$updateByDetails",
                        preserveNullAndEmptyArrays: true,
                      },
                    },

                    // privacyPeopleIds
                    {
                      $lookup: {
                        from: "users",
                        localField: "privacyPeopleIds",
                        foreignField: "_id",
                        pipeline: userProject,
                        as: "privacyPeopleDetails",
                      },
                    },

                    // notifyIds
                    {
                      $lookup: {
                        from: "users",
                        localField: "notifyIds",
                        foreignField: "_id",
                        pipeline: userProject,
                        as: "notifyUserDetails",
                      },
                    },

                    // reactions.reactedBy
                    {
                      $lookup: {
                        from: "users",
                        localField: "reactions.reactedBy",
                        foreignField: "_id",
                        pipeline: userProject,
                        as: "reactionUserDetails",
                      },
                    },

                    // readBy.userId
                    {
                      $lookup: {
                        from: "users",
                        localField: "readBy.userId",
                        foreignField: "_id",
                        pipeline: userProject,
                        as: "readByUserDetails",
                      },
                    },

                    {
                      $project: {
                        _id: 1,
                        message: 1,
                        files: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        visibilityType: 1,
                        activeFlag: 1,
                        deleteFlag: 1,
                        createdBy: "$createdByDetails",
                        updateBy: "$updateByDetails",
                        privacyPeople: "$privacyPeopleDetails",
                        notifyUsers: "$notifyUserDetail",
                        notifyUsers: "$notifyUserDetails",
                        reactions: {
                          $map: {
                            input: "$reactions",
                            as: "r",
                            in: {
                              emoji: "$$r.emoji",
                              reactedBy: {
                                $arrayElemAt: [
                                  {
                                    $filter: {
                                      input: "$reactionUserDetails",
                                      as: "u",
                                      cond: {
                                        $eq: ["$$u._id", "$$r.reactedBy"],
                                      },
                                    },
                                  },
                                  0,
                                ],
                              },
                              reactedAt: "$$r.reactedAt",
                            },
                          },
                        },
                        readBy: {
                          $map: {
                            input: "$readBy",
                            as: "rb",
                            in: {
                              user: {
                                $arrayElemAt: [
                                  {
                                    $filter: {
                                      input: "$readByUserDetails",
                                      as: "u",
                                      cond: { $eq: ["$$u._id", "$$rb.userId"] },
                                    },
                                  },
                                  0,
                                ],
                              },
                              readAt: "$$rb.readAt",
                            },
                          },
                        },
                      },
                    },
                  ],
                  as: "comments",
                },
              },

              // dependencies
              {
                $lookup: {
                  from: "projecttaskdependencies",
                  localField: "_id",
                  foreignField: "taskId",
                  as: "dependenciesRaw",
                },
              },
              {
                $lookup: {
                  from: "projecttasks",
                  localField: "dependenciesRaw.dependsOnTaskId",
                  foreignField: "_id",
                  as: "dependencyTaskDetails",
                },
              },
              {
                $lookup: {
                  from: "users",
                  localField: "dependencyTaskDetails.assignedTo",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "dependencyAssignedTo",
                },
              },
              {
                $addFields: {
                  dependencyDetails: {
                    $map: {
                      input: "$dependenciesRaw",
                      as: "dep",
                      in: {
                        _id: "$$dep._id",
                        dependsOnTaskId: "$$dep.dependsOnTaskId",
                        type: "$$dep.type",
                        taskName: {
                          $arrayElemAt: [
                            {
                              $map: {
                                input: {
                                  $filter: {
                                    input: "$dependencyTaskDetails",
                                    cond: {
                                      $eq: [
                                        "$$this._id",
                                        "$$dep.dependsOnTaskId",
                                      ],
                                    },
                                  },
                                },
                                as: "dt",
                                in: "$$dt.name",
                              },
                            },
                            0,
                          ],
                        },
                        assignedTo: {
                          $filter: {
                            input: "$dependencyAssignedTo",
                            as: "user",
                            cond: {
                              $in: [
                                "$$user._id",
                                {
                                  $arrayElemAt: [
                                    {
                                      $map: {
                                        input: {
                                          $filter: {
                                            input: "$dependencyTaskDetails",
                                            cond: {
                                              $eq: [
                                                "$$this._id",
                                                "$$dep.dependsOnTaskId",
                                              ],
                                            },
                                          },
                                        },
                                        as: "dt",
                                        in: "$$dt.assignedTo",
                                      },
                                    },
                                    0,
                                  ],
                                },
                              ],
                            },
                          },
                        },
                        startDate: "$$dep.startDate",
                        dueDate: "$$dep.dueDate",
                      },
                    },
                  },
                },
              },

              // --- NEW: subTasks lookup inside each parent task ---
              {
                $lookup: {
                  from: "projecttasks",
                  let: { parentId: "$_id", parentProjId: "$projectId" },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ["$parentTaskId", "$$parentId"] },
                            { $eq: ["$projectId", "$$parentProjId"] },
                            { $eq: ["$deleteFlag", deleteFlag] },
                            // if subTaskObjectId provided, match only that subtask
                            ...(subTaskObjectId
                              ? [{ $eq: ["$_id", subTaskObjectId] }]
                              : []),
                          ].filter(Boolean),
                        },
                      },
                    },
                    { $sort: { createdAt: -1 } },
                    { $skip: subTaskSkip },
                    { $limit: subTaskLimit },

                    // For each subtask include same lookups as parent tasks
                    {
                      $lookup: {
                        from: "users",
                        localField: "assignedTo",
                        foreignField: "_id",
                        pipeline: userProject,
                        as: "assignedToDetails",
                      },
                    },
                    {
                      $lookup: {
                        from: "users",
                        localField: "createdById",
                        foreignField: "_id",
                        pipeline: userProject,
                        as: "createdByDetails",
                      },
                    },
                    {
                      $unwind: {
                        path: "$createdByDetails",
                        preserveNullAndEmptyArrays: true,
                      },
                    },
                    {
                      $lookup: {
                        from: "users",
                        localField: "lastUpdatedBy",
                        foreignField: "_id",
                        pipeline: userProject,
                        as: "lastUpdatedByDetails",
                      },
                    },
                    {
                      $unwind: {
                        path: "$lastUpdatedByDetails",
                        preserveNullAndEmptyArrays: true,
                      },
                    },
                    {
                      $lookup: {
                        from: "users",
                        localField: "followers",
                        foreignField: "_id",
                        pipeline: userProject,
                        as: "followersDetails",
                      },
                    },
                    {
                      $lookup: {
                        from: "tags",
                        localField: "tags",
                        foreignField: "_id",
                        pipeline: [{ $project: { _id: 1, name: 1, color: 1 } }],
                        as: "tagsDetails",
                      },
                    },
                    {
                      $lookup: {
                        from: "users",
                        localField: "reminders.userIds",
                        foreignField: "_id",
                        pipeline: userProject,
                        as: "reminderUsers",
                      },
                    },
                    // comments for subtask
                    {
                      $lookup: {
                        from: "projecttaskcomments",
                        let: { tId: "$_id" },
                        pipeline: [
                          { $match: { $expr: { $eq: ["$taskId", "$$tId"] } } },
                          {
                            $lookup: {
                              from: "users",
                              localField: "createdBy",
                              foreignField: "_id",
                              pipeline: userProject,
                              as: "createdByDetails",
                            },
                          },
                          {
                            $unwind: {
                              path: "$createdByDetails",
                              preserveNullAndEmptyArrays: true,
                            },
                          },
                          {
                            $lookup: {
                              from: "users",
                              localField: "updateBy",
                              foreignField: "_id",
                              pipeline: userProject,
                              as: "updateByDetails",
                            },
                          },
                          {
                            $unwind: {
                              path: "$updateByDetails",
                              preserveNullAndEmptyArrays: true,
                            },
                          },
                          {
                            $lookup: {
                              from: "users",
                              localField: "privacyPeopleIds",
                              foreignField: "_id",
                              pipeline: userProject,
                              as: "privacyPeopleDetails",
                            },
                          },
                          {
                            $lookup: {
                              from: "users",
                              localField: "notifyIds",
                              foreignField: "_id",
                              pipeline: userProject,
                              as: "notifyUserDetails",
                            },
                          },
                          {
                            $lookup: {
                              from: "users",
                              localField: "reactions.reactedBy",
                              foreignField: "_id",
                              pipeline: userProject,
                              as: "reactionUserDetails",
                            },
                          },
                          {
                            $lookup: {
                              from: "users",
                              localField: "readBy.userId",
                              foreignField: "_id",
                              pipeline: userProject,
                              as: "readByUserDetails",
                            },
                          },
                          {
                            $project: {
                              _id: 1,
                              message: 1,
                              files: 1,
                              createdAt: 1,
                              updatedAt: 1,
                              visibilityType: 1,
                              activeFlag: 1,
                              deleteFlag: 1,
                              createdBy: "$createdByDetails",
                              updateBy: "$updateByDetails",
                              privacyPeople: "$privacyPeopleDetails",
                              notifyUsers: "$notifyUserDetails",
                              reactions: {
                                $map: {
                                  input: "$reactions",
                                  as: "r",
                                  in: {
                                    emoji: "$$r.emoji",
                                    reactedBy: {
                                      $arrayElemAt: [
                                        {
                                          $filter: {
                                            input: "$reactionUserDetails",
                                            as: "u",
                                            cond: {
                                              $eq: ["$$u._id", "$$r.reactedBy"],
                                            },
                                          },
                                        },
                                        0,
                                      ],
                                    },
                                    reactedAt: "$$r.reactedAt",
                                  },
                                },
                              },
                              readBy: {
                                $map: {
                                  input: "$readBy",
                                  as: "rb",
                                  in: {
                                    user: {
                                      $arrayElemAt: [
                                        {
                                          $filter: {
                                            input: "$readByUserDetails",
                                            as: "u",
                                            cond: {
                                              $eq: ["$$u._id", "$$rb.userId"],
                                            },
                                          },
                                        },
                                        0,
                                      ],
                                    },
                                    readAt: "$$rb.readAt",
                                  },
                                },
                              },
                            },
                          },
                        ],
                        as: "comments",
                      },
                    },

                    // dependencies for subtask
                    {
                      $lookup: {
                        from: "projecttaskdependencies",
                        localField: "_id",
                        foreignField: "taskId",
                        as: "dependenciesRaw",
                      },
                    },
                    {
                      $lookup: {
                        from: "projecttasks",
                        localField: "dependenciesRaw.dependsOnTaskId",
                        foreignField: "_id",
                        as: "dependencyTaskDetails",
                      },
                    },
                    {
                      $lookup: {
                        from: "users",
                        localField: "dependencyTaskDetails.assignedTo",
                        foreignField: "_id",
                        pipeline: userProject,
                        as: "dependencyAssignedTo",
                      },
                    },
                    {
                      $addFields: {
                        dependencyDetails: {
                          $map: {
                            input: "$dependenciesRaw",
                            as: "dep",
                            in: {
                              _id: "$$dep._id",
                              dependsOnTaskId: "$$dep.dependsOnTaskId",
                              type: "$$dep.type",
                              taskName: {
                                $arrayElemAt: [
                                  {
                                    $map: {
                                      input: {
                                        $filter: {
                                          input: "$dependencyTaskDetails",
                                          cond: {
                                            $eq: [
                                              "$$this._id",
                                              "$$dep.dependsOnTaskId",
                                            ],
                                          },
                                        },
                                      },
                                      as: "dt",
                                      in: "$$dt.name",
                                    },
                                  },
                                  0,
                                ],
                              },
                              assignedTo: {
                                $filter: {
                                  input: "$dependencyAssignedTo",
                                  as: "user",
                                  cond: {
                                    $in: [
                                      "$$user._id",
                                      {
                                        $arrayElemAt: [
                                          {
                                            $map: {
                                              input: {
                                                $filter: {
                                                  input:
                                                    "$dependencyTaskDetails",
                                                  cond: {
                                                    $eq: [
                                                      "$$this._id",
                                                      "$$dep.dependsOnTaskId",
                                                    ],
                                                  },
                                                },
                                              },
                                              as: "dt",
                                              in: "$$dt.assignedTo",
                                            },
                                          },
                                          0,
                                        ],
                                      },
                                    ],
                                  },
                                },
                              },
                              startDate: "$$dep.startDate",
                              dueDate: "$$dep.dueDate",
                            },
                          },
                        },
                      },
                    },

                    // final projection for subtask
                    {
                      $project: {
                        _id: 1,
                        projectId: 1,
                        taskListId: 1,
                        assignedToDetails: 1,
                        createdByDetails: 1,
                        lastUpdatedByDetails: 1,
                        parentTaskId: 1,
                        taskNumber: 1,
                        name: 1,
                        description: 1,
                        workflowId: 1,
                        stageId: 1,
                        priority: 1,
                        taskStatus: 1,
                        progress: 1,
                        followersDetails: 1,
                        tagsDetails: 1,
                        startDate: 1,
                        dueDate: 1,
                        completedAt: 1,
                        estimateMinutes: 1,
                        isBillable: 1,
                        invoiced: 1,
                        files: 1,
                        activeFlag: 1,
                        deleteFlag: 1,
                        reminders: 1,
                        reminderUsers: 1,
                        comments: 1,
                        dependencyDetails: 1,
                        customFields: 1,
                        createdAt: 1,
                        updatedAt: 1,
                      },
                    },
                  ],
                  as: "subTasks",
                },
              },

              // final projection for parent task
              {
                $project: {
                  _id: 1,
                  projectId: 1,
                  taskListId: 1,
                  assignedToDetails: 1,
                  createdByDetails: 1,
                  lastUpdatedByDetails: 1,
                  parentTaskId: 1,
                  taskNumber: 1,
                  name: 1,
                  description: 1,
                  workflowId: 1,
                  stageId: 1,
                  priority: 1,
                  taskStatus: 1,
                  progress: 1,
                  followersDetails: 1,
                  tagsDetails: 1,
                  startDate: 1,
                  dueDate: 1,
                  completedAt: 1,
                  estimateMinutes: 1,
                  isBillable: 1,
                  invoiced: 1,
                  files: 1,
                  activeFlag: 1,
                  deleteFlag: 1,
                  reminders: 1,
                  reminderUsers: 1,
                  comments: 1,
                  dependencyDetails: 1,
                  customFields: 1,
                  subTasks: 1, // include nested subtasks
                  createdAt: 1,
                  updatedAt: 1,
                },
              },
            ],
            as: "tasks",
          },
        },

        // final projection for list-level fields
        {
          $project: {
            _id: 1,
            projectId: 1,
            listIcon: 1,
            name: 1,
            description: 1,
            orderIndex: 1,
            createdByDetails: 1,
            viewByDetails: 1,
            tasks: 1,
          },
        },
      ];

      // Execute aggregation
      const lists = await TaskList.aggregate(pipeline);

      if (!lists || lists.length === 0) {
        return "NA";
      }

      // get custom fields for tasks (same as your previous logic)
      const moduleType = "Task";
      const customFieldList = await this.getCustomFieldList(
        SITE_DB_NAME,
        moduleType,
        0,
      );

      // helper to map user object
      function mapUser(u) {
        if (!u) return null;
        return {
          _id: u._id ? u._id.toString() : null,
          name: u.name || null,
          image: u.image || null,
        };
      }

      // helper to normalize comments (reuse your earlier normalize logic)
      function normalizeComments(comments = []) {
        return (comments || []).map((c) => {
          return {
            _id: c._id ? c._id.toString() : null,
            message: c.message || null,
            files: Array.isArray(c.files) ? c.files : [],
            visibilityType: c.visibilityType || null,
            activeFlag: typeof c.activeFlag === "number" ? c.activeFlag : 1,
            deleteFlag: typeof c.deleteFlag === "number" ? c.deleteFlag : 0,
            createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : null,
            updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : null,
            createdBy: c.createdBy ? mapUser(c.createdBy) : null,
            updateBy: c.updateBy ? mapUser(c.updateBy) : null,
            privacyPeople: Array.isArray(c.privacyPeople)
              ? c.privacyPeople.map(mapUser)
              : [],
            notifyUsers: Array.isArray(c.notifyUsers)
              ? c.notifyUsers.map(mapUser)
              : [],
            reactions: Array.isArray(c.reactions)
              ? c.reactions.map((r) => ({
                  emoji: r.emoji || null,
                  reactedBy: r.reactedBy ? mapUser(r.reactedBy) : null,
                  reactedAt: r.reactedAt || null,
                }))
              : [],
            readBy: Array.isArray(c.readBy)
              ? c.readBy.map((rb) => ({
                  user: rb.user ? mapUser(rb.user) : null,
                  readAt: rb.readAt || null,
                }))
              : [],
          };
        });
      }

      // map a single task (parent or subtask) to response shape
      function mapTaskToResponse(t) {
        // custom fields mapping
        const taskCustomFields = t.customFields || {};
        const newCustomFields = {};
        for (const field of customFieldList) {
          const key = field.keyName;
          newCustomFields[key] = {
            fieldName: field.fieldName,
            keyName: field.keyName,
            fieldType: field.fieldType,
            options: field.options,
            _id: field._id,
            moduleType: field.moduleType,
            updatedAt: field.updatedAt,
            createdAt: field.createdAt,
            activeFlag: field.activeFlag,
            deleteFlag: field.deleteFlag,
            value: taskCustomFields[key] ? taskCustomFields[key].value : null,
          };
        }

        // reminders
        const reminderUsers = t.reminderUsers || [];
        const reminders = (t.reminders || []).map((r) => {
          const usersMapped = (r.userIds || []).map((uid) => {
            const found = reminderUsers.find(
              (ru) => ru._id && ru._id.toString() === uid.toString(),
            );
            if (found) {
              return {
                _id: found._id.toString(),
                name: found.name || null,
                image: found.image || null,
              };
            }
            // fallback
            return { _id: uid.toString(), name: null, image: null };
          });

          return {
            date: r.date ? new Date(r.date).toISOString() : null,
            users: usersMapped,
            description: r.description === "" ? null : r.description,
            type: r.type || "email",
          };
        });

        const tags = (t.tagsDetails || []).map((tag) => ({
          _id: tag._id ? tag._id.toString() : null,
          name: tag.name || null,
          color: tag.color || null,
        }));

        const mapped = {
          _id: t._id ? t._id.toString() : null,
          projectId: t.projectId ? t.projectId.toString() : null,
          taskListId: t.taskListId ? t.taskListId.toString() : null,
          assignedTo: (t.assignedToDetails || []).map((a) => ({
            _id: a._id.toString(),
            name: a.name || null,
            image: a.image || null,
          })),
          createdBy: t.createdByDetails
            ? {
                _id: t.createdByDetails._id.toString(),
                name: t.createdByDetails.name || null,
                image: t.createdByDetails.image || null,
                date: t.createdAt ? new Date(t.createdAt).toISOString() : null,
              }
            : null,
          lastUpdatedBy: t.lastUpdatedByDetails
            ? {
                _id: t.lastUpdatedByDetails._id.toString(),
                name: t.lastUpdatedByDetails.name || null,
                image: t.lastUpdatedByDetails.image || null,
                date: t.updatedAt ? new Date(t.updatedAt).toISOString() : null,
              }
            : null,
          taskNumber: t.taskNumber || null,
          name: t.name || null,
          description: t.description === "" ? null : t.description,
          parentTaskId: t.parentTaskId ? t.parentTaskId.toString() : null,
          workflowId: t.workflowId ? t.workflowId.toString() : null,
          stageId: t.stageId ? t.stageId.toString() : null,
          priority: t.priority || "none",
          taskStatus: t.taskStatus || "not started",
          progress: typeof t.progress === "number" ? t.progress : 0,
          followersDetails: (t.followersDetails || []).map((f) => ({
            _id: f._id.toString(),
            name: f.name || null,
            image: f.image || null,
          })),
          tags: tags,
          startDate: t.startDate ? new Date(t.startDate).toISOString() : null,
          dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
          completedAt: t.completedAt
            ? new Date(t.completedAt).toISOString()
            : null,
          estimateMinutes:
            typeof t.estimateMinutes === "number" ? t.estimateMinutes : 0,
          isBillable: typeof t.isBillable === "boolean" ? t.isBillable : true,
          invoiced: typeof t.invoiced === "boolean" ? t.invoiced : false,
          files: Array.isArray(t.files) ? t.files : [],
          activeFlag: typeof t.activeFlag === "number" ? t.activeFlag : 1,
          deleteFlag: typeof t.deleteFlag === "number" ? t.deleteFlag : 0,
          reminders: reminders,
          createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : null,
          updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : null,
          comments: normalizeComments(t.comments || []),
          dependencies: (t.dependencyDetails || []).map((d) => ({
            _id: d._id || null,
            dependsOnTaskId: d.dependsOnTaskId || null,
            type: d.type || null,
            taskName: d.taskName || null,
            assignedTo: (d.assignedTo || []).map((a) => ({
              _id: a._id || null,
              name: a.name || null,
              image: a.image || null,
            })),
            startDate: d.startDate || null,
            dueDate: d.dueDate || null,
          })),
          customFields: newCustomFields,
        };

        // if this task has nested subtasks (from aggregation), map them too
        if (Array.isArray(t.subTasks)) {
          mapped.subTasks = t.subTasks.map((st) => mapTaskToResponse(st));
        } else {
          mapped.subTasks = [];
        }

        return mapped;
      }

      // post-process lists & tasks to shape exactly as your sample
      const finalLists = lists.map((listDoc) => {
        const list = {
          _id: listDoc._id ? listDoc._id.toString() : null,
          projectId: listDoc.projectId ? listDoc.projectId.toString() : null,
          listIcon: listDoc.listIcon || null,
          name: listDoc.name || null,
          description: listDoc.description === "" ? null : listDoc.description,
          orderIndex:
            typeof listDoc.orderIndex === "number" ? listDoc.orderIndex : 0,
          createdBy: listDoc.createdByDetails
            ? {
                _id: listDoc.createdByDetails._id.toString(),
                name: listDoc.createdByDetails.name || null,
                image: listDoc.createdByDetails.image || null,
              }
            : null,
          viewBy: Array.isArray(listDoc.viewByDetails)
            ? listDoc.viewByDetails.map((u) => ({
                _id: u._id.toString(),
                name: u.name || null,
                image: u.image || null,
              }))
            : [],
          tasks: (listDoc.tasks || []).map((t) => mapTaskToResponse(t)),
        };
        return list;
      });

      return finalLists;
    } catch (error) {
      console.log("Database error from getAllTask:", error.message || error);
      throw new Error(error.message || "Server error");
    }
  },
  async getViewTask(
    SITE_DB_NAME,
    deleteFlag,
    taskId,
    taskPagination,
    subTaskId = null,
  ) {
    try {
      const Task = await TaskModel(SITE_DB_NAME);

      // sub-task pagination params (use these for subTasks array)
      const { taskPageNumber = 1, taskPageSize = 10 } = taskPagination || {};
      const taskSkip = Math.max(0, taskPageNumber - 1) * taskPageSize;
      const taskLimit = Math.max(1, taskPageSize);

      // Validate taskId
      if (!taskId) return "NA";
      const mongoose = require("mongoose");
      if (!mongoose.Types.ObjectId.isValid(taskId)) return "NA";
      const taskObjectId = new mongoose.Types.ObjectId(taskId);

      // 1) Find the requested task (could be parent or subtask)
      const requestedTask = await Task.findOne({ _id: taskObjectId }).lean();
      if (!requestedTask) return "NA";

      // 2) Determine rootTaskId: if requested is subtask, use its parentTaskId; else use itself
      const rootTaskId = requestedTask.parentTaskId
        ? requestedTask.parentTaskId.toString()
        : requestedTask._id.toString();
      const rootObjectId = new mongoose.Types.ObjectId(rootTaskId);

      // Helper projections for lookups
      const userProject = [{ $project: { _id: 1, name: 1, image: 1 } }];

      // 3) Fetch root task with needed lookups (comments, dependencies, assignedTo, tags, reminders)
      const rootPipeline = [
        { $match: { _id: rootObjectId, deleteFlag: Number(deleteFlag) } },

        // assignedTo -> users
        {
          $lookup: {
            from: "users",
            localField: "assignedTo",
            foreignField: "_id",
            pipeline: userProject,
            as: "assignedToDetails",
          },
        },

        // createdBy -> users
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            pipeline: userProject,
            as: "createdByDetails",
          },
        },
        {
          $unwind: {
            path: "$createdByDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // lastUpdatedBy
        {
          $lookup: {
            from: "users",
            localField: "lastUpdatedBy",
            foreignField: "_id",
            pipeline: userProject,
            as: "lastUpdatedByDetails",
          },
        },
        {
          $unwind: {
            path: "$lastUpdatedByDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // tags
        {
          $lookup: {
            from: "tags",
            localField: "tags",
            foreignField: "_id",
            pipeline: [{ $project: { _id: 1, name: 1, color: 1 } }],
            as: "tagsDetails",
          },
        },

        // reminders -> reminderUsers (users referenced inside reminders.userIds)
        {
          $lookup: {
            from: "users",
            localField: "reminders.userIds",
            foreignField: "_id",
            pipeline: userProject,
            as: "reminderUsers",
          },
        },

        // comments (with createdBy, updateBy, privacyPeople, notifyUsers, reactions -> reactedBy, readBy.userId)
        {
          $lookup: {
            from: "projecttaskcomments",
            let: { tId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$taskId", "$$tId"] } } },

              // createdBy
              {
                $lookup: {
                  from: "users",
                  localField: "createdBy",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "createdByDetails",
                },
              },
              {
                $unwind: {
                  path: "$createdByDetails",
                  preserveNullAndEmptyArrays: true,
                },
              },

              // updateBy
              {
                $lookup: {
                  from: "users",
                  localField: "updateBy",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "updateByDetails",
                },
              },
              {
                $unwind: {
                  path: "$updateByDetails",
                  preserveNullAndEmptyArrays: true,
                },
              },

              // privacyPeopleIds
              {
                $lookup: {
                  from: "users",
                  localField: "privacyPeopleIds",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "privacyPeopleDetails",
                },
              },

              // notifyIds
              {
                $lookup: {
                  from: "users",
                  localField: "notifyIds",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "notifyUserDetails",
                },
              },

              // reactions.reactedBy -> bring user details for all reactedBy
              {
                $lookup: {
                  from: "users",
                  localField: "reactions.reactedBy",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "reactionUserDetails",
                },
              },

              // readBy.userId -> bring user details
              {
                $lookup: {
                  from: "users",
                  localField: "readBy.userId",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "readByUserDetails",
                },
              },

              // project required projection (shape comments as you want)
              {
                $project: {
                  _id: 1,
                  message: 1,
                  files: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  visibilityType: 1,
                  activeFlag: 1,
                  deleteFlag: 1,
                  createdBy: "$createdByDetails",
                  updateBy: "$updateByDetails",
                  privacyPeople: "$privacyPeopleDetails",
                  notifyUsers: "$notifyUserDetail", // keep original name in case mapping uses it; we'll map later using notifyUserDetails below
                  notifyUsers: "$notifyUserDetail", // will be corrected during normalization if needed
                  notifyUsers: "$notifyUserDetails",
                  reactions: {
                    $map: {
                      input: "$reactions",
                      as: "r",
                      in: {
                        emoji: "$$r.emoji",
                        reactedBy: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$reactionUserDetails",
                                as: "u",
                                cond: { $eq: ["$$u._id", "$$r.reactedBy"] },
                              },
                            },
                            0,
                          ],
                        },
                        reactedAt: "$$r.reactedAt",
                      },
                    },
                  },
                  readBy: {
                    $map: {
                      input: "$readBy",
                      as: "rb",
                      in: {
                        user: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$readByUserDetails",
                                as: "u",
                                cond: { $eq: ["$$u._id", "$$rb.userId"] },
                              },
                            },
                            0,
                          ],
                        },
                        readAt: "$$rb.readAt",
                      },
                    },
                  },
                },
              },
            ],
            as: "comments",
          },
        },

        // dependencies: join dependencies collection then task details & assigned users
        {
          $lookup: {
            from: "projecttaskdependencies",
            localField: "_id",
            foreignField: "taskId",
            as: "dependenciesRaw",
          },
        },
        {
          $lookup: {
            from: "projecttasks",
            localField: "dependenciesRaw.dependsOnTaskId",
            foreignField: "_id",
            as: "dependencyTaskDetails",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "dependencyTaskDetails.assignedTo",
            foreignField: "_id",
            pipeline: userProject,
            as: "dependencyAssignedTo",
          },
        },
        {
          $addFields: {
            dependencyDetails: {
              $map: {
                input: "$dependenciesRaw",
                as: "dep",
                in: {
                  _id: "$$dep._id",
                  dependsOnTaskId: "$$dep.dependsOnTaskId",
                  type: "$$dep.type",
                  taskName: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$dependencyTaskDetails",
                              cond: {
                                $eq: ["$$this._id", "$$dep.dependsOnTaskId"],
                              },
                            },
                          },
                          as: "dt",
                          in: "$$dt.name",
                        },
                      },
                      0,
                    ],
                  },
                  assignedTo: {
                    $filter: {
                      input: "$dependencyAssignedTo",
                      as: "user",
                      cond: {
                        $in: [
                          "$$user._id",
                          {
                            $arrayElemAt: [
                              {
                                $map: {
                                  input: {
                                    $filter: {
                                      input: "$dependencyTaskDetails",
                                      cond: {
                                        $eq: [
                                          "$$this._id",
                                          "$$dep.dependsOnTaskId",
                                        ],
                                      },
                                    },
                                  },
                                  as: "dt",
                                  in: "$$dt.assignedTo",
                                },
                              },
                              0,
                            ],
                          },
                        ],
                      },
                    },
                  },
                  startDate: "$$dep.startDate",
                  dueDate: "$$dep.dueDate",
                },
              },
            },
          },
        },

        // final project for root task
        {
          $project: {
            _id: 1,
            projectId: 1,
            taskListId: 1,
            assignedToDetails: 1,
            createdByDetails: 1,
            lastUpdatedByDetails: 1,
            parentTaskId: 1,
            taskNumber: 1,
            name: 1,
            description: 1,
            workflowId: 1,
            stageId: 1,
            priority: 1,
            taskStatus: 1,
            progress: 1,
            followersDetails: 1,
            tagsDetails: 1,
            startDate: 1,
            dueDate: 1,
            completedAt: 1,
            estimateMinutes: 1,
            isBillable: 1,
            invoiced: 1,
            files: 1,
            activeFlag: 1,
            deleteFlag: 1,
            reminders: 1,
            reminderUsers: 1,
            comments: 1,
            dependencyDetails: 1,
            customFields: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ];

      const rootResults = await Task.aggregate(rootPipeline);
      if (!rootResults || rootResults.length === 0) return "NA";
      const rootRaw = rootResults[0];

      // 4) Fetch subtasks (children) of rootTaskId with pagination
      const subMatch = {
        parentTaskId: rootObjectId,
        deleteFlag: Number(deleteFlag),
      };
      if (subTaskId && mongoose.Types.ObjectId.isValid(subTaskId)) {
        subMatch._id = new mongoose.Types.ObjectId(subTaskId);
      }

      const subPipeline = [
        { $match: subMatch },
        { $sort: { createdAt: -1 } },
        { $skip: taskSkip },
        { $limit: taskLimit },

        // assignedTo
        {
          $lookup: {
            from: "users",
            localField: "assignedTo",
            foreignField: "_id",
            pipeline: userProject,
            as: "assignedToDetails",
          },
        },

        // createdBy
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            pipeline: userProject,
            as: "createdByDetails",
          },
        },
        {
          $unwind: {
            path: "$createdByDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // lastUpdatedBy
        {
          $lookup: {
            from: "users",
            localField: "lastUpdatedBy",
            foreignField: "_id",
            pipeline: userProject,
            as: "lastUpdatedByDetails",
          },
        },
        {
          $unwind: {
            path: "$lastUpdatedByDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // followers
        {
          $lookup: {
            from: "users",
            localField: "followers",
            foreignField: "_id",
            pipeline: userProject,
            as: "followersDetails",
          },
        },

        // tags
        {
          $lookup: {
            from: "tags",
            localField: "tags",
            foreignField: "_id",
            pipeline: [{ $project: { _id: 1, name: 1, color: 1 } }],
            as: "tagsDetails",
          },
        },

        // reminders -> reminderUsers
        {
          $lookup: {
            from: "users",
            localField: "reminders.userIds",
            foreignField: "_id",
            pipeline: userProject,
            as: "reminderUsers",
          },
        },

        // comments (as in root)
        {
          $lookup: {
            from: "projecttaskcomments",
            let: { tId: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$taskId", "$$tId"] } } },

              // createdBy
              {
                $lookup: {
                  from: "users",
                  localField: "createdBy",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "createdByDetails",
                },
              },
              {
                $unwind: {
                  path: "$createdByDetails",
                  preserveNullAndEmptyArrays: true,
                },
              },

              // updateBy
              {
                $lookup: {
                  from: "users",
                  localField: "updateBy",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "updateByDetails",
                },
              },
              {
                $unwind: {
                  path: "$updateByDetails",
                  preserveNullAndEmptyArrays: true,
                },
              },

              // privacyPeople
              {
                $lookup: {
                  from: "users",
                  localField: "privacyPeopleIds",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "privacyPeopleDetails",
                },
              },

              // notifyIds
              {
                $lookup: {
                  from: "users",
                  localField: "notifyIds",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "notifyUserDetails",
                },
              },

              // reactions.reactedBy
              {
                $lookup: {
                  from: "users",
                  localField: "reactions.reactedBy",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "reactionUserDetails",
                },
              },

              // readBy.userId
              {
                $lookup: {
                  from: "users",
                  localField: "readBy.userId",
                  foreignField: "_id",
                  pipeline: userProject,
                  as: "readByUserDetails",
                },
              },

              {
                $project: {
                  _id: 1,
                  message: 1,
                  files: 1,
                  createdAt: 1,
                  updatedAt: 1,
                  visibilityType: 1,
                  activeFlag: 1,
                  deleteFlag: 1,
                  createdBy: "$createdByDetails",
                  updateBy: "$updateByDetails",
                  privacyPeople: "$privacyPeopleDetails",
                  notifyUsers: "$notifyUserDetail",
                  notifyUsers: "$notifyUserDetails",
                  reactions: {
                    $map: {
                      input: "$reactions",
                      as: "r",
                      in: {
                        emoji: "$$r.emoji",
                        reactedBy: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$reactionUserDetails",
                                as: "u",
                                cond: { $eq: ["$$u._id", "$$r.reactedBy"] },
                              },
                            },
                            0,
                          ],
                        },
                        reactedAt: "$$r.reactedAt",
                      },
                    },
                  },
                  readBy: {
                    $map: {
                      input: "$readBy",
                      as: "rb",
                      in: {
                        user: {
                          $arrayElemAt: [
                            {
                              $filter: {
                                input: "$readByUserDetails",
                                as: "u",
                                cond: { $eq: ["$$u._id", "$$rb.userId"] },
                              },
                            },
                            0,
                          ],
                        },
                        readAt: "$$rb.readAt",
                      },
                    },
                  },
                },
              },
            ],
            as: "comments",
          },
        },

        // dependencies for subtask
        {
          $lookup: {
            from: "projecttaskdependencies",
            localField: "_id",
            foreignField: "taskId",
            as: "dependenciesRaw",
          },
        },
        {
          $lookup: {
            from: "projecttasks",
            localField: "dependenciesRaw.dependsOnTaskId",
            foreignField: "_id",
            as: "dependencyTaskDetails",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "dependencyTaskDetails.assignedTo",
            foreignField: "_id",
            pipeline: userProject,
            as: "dependencyAssignedTo",
          },
        },
        {
          $addFields: {
            dependencyDetails: {
              $map: {
                input: "$dependenciesRaw",
                as: "dep",
                in: {
                  _id: "$$dep._id",
                  dependsOnTaskId: "$$dep.dependsOnTaskId",
                  type: "$$dep.type",
                  taskName: {
                    $arrayElemAt: [
                      {
                        $map: {
                          input: {
                            $filter: {
                              input: "$dependencyTaskDetails",
                              cond: {
                                $eq: ["$$this._id", "$$dep.dependsOnTaskId"],
                              },
                            },
                          },
                          as: "dt",
                          in: "$$dt.name",
                        },
                      },
                      0,
                    ],
                  },
                  assignedTo: {
                    $filter: {
                      input: "$dependencyAssignedTo",
                      as: "user",
                      cond: {
                        $in: [
                          "$$user._id",
                          {
                            $arrayElemAt: [
                              {
                                $map: {
                                  input: {
                                    $filter: {
                                      input: "$dependencyTaskDetails",
                                      cond: {
                                        $eq: [
                                          "$$this._id",
                                          "$$dep.dependsOnTaskId",
                                        ],
                                      },
                                    },
                                  },
                                  as: "dt",
                                  in: "$$dt.assignedTo",
                                },
                              },
                              0,
                            ],
                          },
                        ],
                      },
                    },
                  },
                  startDate: "$$dep.startDate",
                  dueDate: "$$dep.dueDate",
                },
              },
            },
          },
        },

        // project fields for subtask
        {
          $project: {
            _id: 1,
            projectId: 1,
            taskListId: 1,
            assignedToDetails: 1,
            createdByDetails: 1,
            lastUpdatedByDetails: 1,
            parentTaskId: 1,
            taskNumber: 1,
            name: 1,
            description: 1,
            workflowId: 1,
            stageId: 1,
            priority: 1,
            taskStatus: 1,
            progress: 1,
            followersDetails: 1,
            tagsDetails: 1,
            startDate: 1,
            dueDate: 1,
            completedAt: 1,
            estimateMinutes: 1,
            isBillable: 1,
            invoiced: 1,
            files: 1,
            activeFlag: 1,
            deleteFlag: 1,
            reminders: 1,
            reminderUsers: 1,
            comments: 1,
            dependencyDetails: 1,
            customFields: 1,
            createdAt: 1,
            updatedAt: 1,
          },
        },
      ];

      const subResults = await Task.aggregate(subPipeline);

      // 5) Map & normalize fields (convert ObjectId to strings and shape nested user objects)
      function mapUser(u) {
        if (!u) return null;
        return {
          _id: u._id ? u._id.toString() : null,
          name: u.name || null,
          image: u.image || null,
        };
      }

      function normalizeComments(comments = []) {
        return (comments || []).map((c) => {
          const cc = {
            _id: c._id ? c._id.toString() : null,
            message: c.message || null,
            files: Array.isArray(c.files) ? c.files : [],
            visibilityType: c.visibilityType || null,
            activeFlag: typeof c.activeFlag === "number" ? c.activeFlag : 1,
            deleteFlag: typeof c.deleteFlag === "number" ? c.deleteFlag : 0,
            createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : null,
            updatedAt: c.updatedAt ? new Date(c.updatedAt).toISOString() : null,
            createdBy: c.createdBy ? mapUser(c.createdBy) : null,
            updateBy: c.updateBy ? mapUser(c.updateBy) : null,
            privacyPeople: Array.isArray(c.privacyPeople)
              ? c.privacyPeople.map(mapUser)
              : [],
            notifyUsers: Array.isArray(c.notifyUsers)
              ? c.notifyUsers.map(mapUser)
              : [],
            reactions: Array.isArray(c.reactions)
              ? c.reactions.map((r) => ({
                  emoji: r.emoji || null,
                  reactedBy: r.reactedBy ? mapUser(r.reactedBy) : null,
                  reactedAt: r.reactedAt || null,
                }))
              : [],
            readBy: Array.isArray(c.readBy)
              ? c.readBy.map((rb) => ({
                  user: rb.user ? mapUser(rb.user) : null,
                  readAt: rb.readAt || null,
                }))
              : [],
          };
          return cc;
        });
      }

      function normalizeTaskRaw(t) {
        if (!t) return t;
        // build custom fields mapping using existing helper if present
        // obtain customFieldList for module Task
        return {
          _id: t._id ? t._id.toString() : null,
          projectId: t.projectId
            ? t.projectId.toString
              ? t.projectId.toString()
              : t.projectId
            : null,
          taskListId: t.taskListId
            ? t.taskListId.toString
              ? t.taskListId.toString()
              : t.taskListId
            : null,
          assignedTo: Array.isArray(t.assignedToDetails)
            ? t.assignedToDetails.map(mapUser)
            : [],
          createdBy: t.createdByDetails
            ? {
                ...mapUser(t.createdByDetails),
                date: t.createdAt ? new Date(t.createdAt).toISOString() : null,
              }
            : null,
          lastUpdatedBy: t.lastUpdatedByDetails
            ? {
                ...mapUser(t.lastUpdatedByDetails),
                date: t.updatedAt ? new Date(t.updatedAt).toISOString() : null,
              }
            : null,
          taskNumber: t.taskNumber || null,
          name: t.name || null,
          description: t.description === "" ? null : t.description,
          parentTaskId: t.parentTaskId ? t.parentTaskId.toString() : null,
          workflowId: t.workflowId
            ? t.workflowId.toString
              ? t.workflowId.toString()
              : t.workflowId
            : null,
          stageId: t.stageId
            ? t.stageId.toString
              ? t.stageId.toString()
              : t.stageId
            : null,
          priority: t.priority || "none",
          taskStatus: t.taskStatus || "not started",
          progress: typeof t.progress === "number" ? t.progress : 0,
          followersDetails: Array.isArray(t.followersDetails)
            ? t.followersDetails.map(mapUser)
            : [],
          tags: Array.isArray(t.tagsDetails)
            ? t.tagsDetails.map((tag) => ({
                _id: tag._id ? tag._id.toString() : null,
                name: tag.name || null,
                color: tag.color || null,
              }))
            : [],
          startDate: t.startDate ? new Date(t.startDate).toISOString() : null,
          dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
          completedAt: t.completedAt
            ? new Date(t.completedAt).toISOString()
            : null,
          estimateMinutes:
            typeof t.estimateMinutes === "number" ? t.estimateMinutes : 0,
          isBillable: typeof t.isBillable === "boolean" ? t.isBillable : true,
          invoiced: typeof t.invoiced === "boolean" ? t.invoiced : false,
          files: Array.isArray(t.files) ? t.files : [],
          activeFlag: typeof t.activeFlag === "number" ? t.activeFlag : 1,
          deleteFlag: typeof t.deleteFlag === "number" ? t.deleteFlag : 0,
          reminders: Array.isArray(t.reminders)
            ? t.reminders.map((r) => {
                const usersMapped = (r.userIds || []).map((uid) => {
                  const found = (t.reminderUsers || []).find(
                    (ru) => ru._id && ru._id.toString() === uid.toString(),
                  );
                  if (found) return mapUser(found);
                  return {
                    _id: uid ? uid.toString() : null,
                    name: null,
                    image: null,
                  };
                });
                return {
                  date: r.date ? new Date(r.date).toISOString() : null,
                  users: usersMapped,
                  description: r.description === "" ? null : r.description,
                  type: r.type || "email",
                };
              })
            : [],
          createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : null,
          updatedAt: t.updatedAt ? new Date(t.updatedAt).toISOString() : null,
          comments: normalizeComments(t.comments || []),
          dependencies: Array.isArray(t.dependencyDetails)
            ? t.dependencyDetails.map((d) => ({
                _id: d._id || null,
                dependsOnTaskId: d.dependsOnTaskId || null,
                type: d.type || null,
                taskName: d.taskName || null,
                assignedTo: Array.isArray(d.assignedTo)
                  ? d.assignedTo.map(mapUser)
                  : [],
                startDate: d.startDate || null,
                dueDate: d.dueDate || null,
              }))
            : [],
          customFields: t.customFields || {},
        };
      }

      // Map root and subtasks
      const mappedRoot = normalizeTaskRaw(rootRaw);
      const mappedSubTasks = (subResults || []).map(normalizeTaskRaw);

      // 6) Attach subtasks into root object (as in your sample)
      mappedRoot.subTasks = mappedSubTasks;

      return mappedRoot;
    } catch (error) {
      console.log("Database error from getViewTask:", error.message || error);
      throw new Error(error.message || "Server error");
    }
  },

  // async getViewTask(
  //   SITE_DB_NAME,
  //   deleteFlag,
  //   taskId,
  //   pagination,
  //   taskPagination,
  //   subTaskId = null
  // ) {
  //   try {
  //     const Task = await TaskModel(SITE_DB_NAME);

  //     const { pageSize = 10, pageNumber = 1 } = pagination || {};
  //     const skipLists = Math.max(0, pageNumber - 1) * pageSize;
  //     const limitLists = pageSize;

  //     const { taskPageNumber = 1, taskPageSize = 10 } = taskPagination || {};
  //     const taskSkip = Math.max(0, taskPageNumber - 1) * taskPageSize;
  //     const taskLimit = taskPageSize;

  //     // If search is present and may match task names, first find matching listIds from tasks
  //     let listIdsFromTaskSearch = [];
  //     if (search && search.trim() !== "") {
  //       const regex = new RegExp(search.trim(), "i");
  //       listIdsFromTaskSearch = await Task.distinct("taskListId", {
  //         projectId: new mongoose.Types.ObjectId(projectId),
  //         deleteFlag: deleteFlag,
  //         name: { $regex: regex },
  //       });
  //     }

  //     // Build list match
  //     const listMatch = {
  //       projectId: new mongoose.Types.ObjectId(projectId),
  //       deleteFlag: deleteFlag,
  //     };
  //     if (taskListId) {
  //       listMatch._id = new mongoose.Types.ObjectId(taskListId);
  //     } else if (search && search.trim() !== "") {
  //       // include lists whose name matches OR lists that have tasks matching search
  //       const regex = new RegExp(search.trim(), "i");
  //       listMatch.$or = [
  //         { name: { $regex: regex } },
  //         ...(listIdsFromTaskSearch.length
  //           ? [{ _id: { $in: listIdsFromTaskSearch } }]
  //           : []),
  //       ];
  //     }

  //     // Aggregation on task lists, then nested lookup for tasks (with per-list task pagination)
  //     const pipeline = [
  //       { $match: listMatch },
  //       { $sort: { orderIndex: 1, createdAt: 1 } },
  //       { $skip: skipLists },
  //       { $limit: limitLists },

  //       // createdBy
  //       {
  //         $lookup: {
  //           from: "users",
  //           localField: "createdBy",
  //           foreignField: "_id",
  //           pipeline: [{ $project: { _id: 1, name: 1, image: 1 } }],
  //           as: "createdByDetails",
  //         },
  //       },
  //       {
  //         $unwind: {
  //           path: "$createdByDetails",
  //           preserveNullAndEmptyArrays: true,
  //         },
  //       },

  //       // viewBy
  //       {
  //         $lookup: {
  //           from: "users",
  //           localField: "viewBy",
  //           foreignField: "_id",
  //           pipeline: [{ $project: { _id: 1, name: 1, image: 1 } }],
  //           as: "viewByDetails",
  //         },
  //       },

  //       // nested lookup: tasks belonging to this list (with per-list pagination)
  //       {
  //         $lookup: {
  //           from: "projecttasks",
  //           let: { listId: "$_id", projId: "$projectId" },
  //           pipeline: [
  //             {
  //               $match: {
  //                 $expr: {
  //                   $and: [
  //                     { $eq: ["$taskListId", "$$listId"] },
  //                     { $eq: ["$projectId", "$$projId"] },
  //                     { $eq: ["$deleteFlag", deleteFlag] },
  //                     { $eq: ["$parentTaskId", null] },
  //                   ].filter(Boolean),
  //                 },
  //               },
  //             },
  //             { $sort: { createdAt: -1 } },
  //             { $skip: taskSkip },
  //             { $limit: taskLimit },

  //             // assignedTo
  //             {
  //               $lookup: {
  //                 from: "users",
  //                 localField: "assignedTo",
  //                 foreignField: "_id",
  //                 pipeline: [{ $project: { _id: 1, name: 1, image: 1 } }],
  //                 as: "assignedToDetails",
  //               },
  //             },

  //             // createdBy (createdById -> user object)
  //             {
  //               $lookup: {
  //                 from: "users",
  //                 localField: "createdById",
  //                 foreignField: "_id",
  //                 pipeline: [{ $project: { _id: 1, name: 1, image: 1 } }],
  //                 as: "createdByDetails",
  //               },
  //             },
  //             {
  //               $unwind: {
  //                 path: "$createdByDetails",
  //                 preserveNullAndEmptyArrays: true,
  //               },
  //             },

  //             // lastUpdatedBy
  //             {
  //               $lookup: {
  //                 from: "users",
  //                 localField: "lastUpdatedBy",
  //                 foreignField: "_id",
  //                 pipeline: [{ $project: { _id: 1, name: 1, image: 1 } }],
  //                 as: "lastUpdatedByDetails",
  //               },
  //             },
  //             {
  //               $unwind: {
  //                 path: "$lastUpdatedByDetails",
  //                 preserveNullAndEmptyArrays: true,
  //               },
  //             },

  //             // followers
  //             {
  //               $lookup: {
  //                 from: "users",
  //                 localField: "followers",
  //                 foreignField: "_id",
  //                 pipeline: [{ $project: { _id: 1, name: 1, image: 1 } }],
  //                 as: "followersDetails",
  //               },
  //             },

  //             // tags -> include name & color
  //             {
  //               $lookup: {
  //                 from: "tags",
  //                 localField: "tags",
  //                 foreignField: "_id",
  //                 pipeline: [{ $project: { _id: 1, name: 1, color: 1 } }],
  //                 as: "tagsDetails",
  //               },
  //             },

  //             // reminders: bring reminderUsers list (all users referenced inside reminders.userIds)
  //             {
  //               $lookup: {
  //                 from: "users",
  //                 localField: "reminders.userIds",
  //                 foreignField: "_id",
  //                 pipeline: [{ $project: { _id: 1, name: 1, image: 1 } }],
  //                 as: "reminderUsers",
  //               },
  //             },

  //             // comments (with comment.createdBy populated)
  //             {
  //               $lookup: {
  //                 from: "projecttaskcomments",
  //                 let: { tId: "$_id" },
  //                 pipeline: [
  //                   { $match: { $expr: { $eq: ["$taskId", "$$tId"] } } },

  //                   // 🔹 createdBy (User)
  //                   {
  //                     $lookup: {
  //                       from: "users",
  //                       localField: "createdBy",
  //                       foreignField: "_id",
  //                       pipeline: [{ $project: { _id: 1, name: 1, image: 1 } }],
  //                       as: "createdByDetails",
  //                     },
  //                   },
  //                   {
  //                     $unwind: {
  //                       path: "$createdByDetails",
  //                       preserveNullAndEmptyArrays: true,
  //                     },
  //                   },

  //                   // 🔹 updateBy (User)
  //                   {
  //                     $lookup: {
  //                       from: "users",
  //                       localField: "updateBy",
  //                       foreignField: "_id",
  //                       pipeline: [{ $project: { _id: 1, name: 1, image: 1 } }],
  //                       as: "updateByDetails",
  //                     },
  //                   },
  //                   {
  //                     $unwind: {
  //                       path: "$updateByDetails",
  //                       preserveNullAndEmptyArrays: true,
  //                     },
  //                   },

  //                   // 🔹 privacyPeopleIds (array of Users)
  //                   {
  //                     $lookup: {
  //                       from: "users",
  //                       localField: "privacyPeopleIds",
  //                       foreignField: "_id",
  //                       pipeline: [{ $project: { _id: 1, name: 1, image: 1 } }],
  //                       as: "privacyPeopleDetails",
  //                     },
  //                   },

  //                   // 🔹 notifyIds (array of Users)
  //                   {
  //                     $lookup: {
  //                       from: "users",
  //                       localField: "notifyIds",
  //                       foreignField: "_id",
  //                       pipeline: [{ $project: { _id: 1, name: 1, image: 1 } }],
  //                       as: "notifyUserDetails",
  //                     },
  //                   },

  //                   // 🔹 reactions.reactedBy (nested user)
  //                   {
  //                     $lookup: {
  //                       from: "users",
  //                       localField: "reactions.reactedBy",
  //                       foreignField: "_id",
  //                       pipeline: [{ $project: { _id: 1, name: 1, image: 1 } }],
  //                       as: "reactionUserDetails",
  //                     },
  //                   },

  //                   // 🔹 readBy.userId (nested user)
  //                   {
  //                     $lookup: {
  //                       from: "users",
  //                       localField: "readBy.userId",
  //                       foreignField: "_id",
  //                       pipeline: [{ $project: { _id: 1, name: 1, image: 1 } }],
  //                       as: "readByUserDetails",
  //                     },
  //                   },

  //                   // 🔹 Final fields you want in response
  //                   {
  //                     $project: {
  //                       _id: 1,
  //                       message: 1,
  //                       files: 1,
  //                       createdAt: 1,
  //                       updatedAt: 1,
  //                       visibilityType: 1,
  //                       activeFlag: 1,
  //                       deleteFlag: 1,
  //                       createdBy: "$createdByDetails",
  //                       updateBy: "$updateByDetails",
  //                       privacyPeople: "$privacyPeopleDetails",
  //                       notifyUsers: "$notifyUserDetails",
  //                       reactions: {
  //                         $map: {
  //                           input: "$reactions",
  //                           as: "r",
  //                           in: {
  //                             emoji: "$$r.emoji",
  //                             reactedBy: {
  //                               $arrayElemAt: [
  //                                 {
  //                                   $filter: {
  //                                     input: "$reactionUserDetails",
  //                                     as: "u",
  //                                     cond: {
  //                                       $eq: ["$$u._id", "$$r.reactedBy"],
  //                                     },
  //                                   },
  //                                 },
  //                                 0,
  //                               ],
  //                             },
  //                             reactedAt: "$$r.reactedAt",
  //                           },
  //                         },
  //                       },
  //                       readBy: {
  //                         $map: {
  //                           input: "$readBy",
  //                           as: "rb",
  //                           in: {
  //                             user: {
  //                               $arrayElemAt: [
  //                                 {
  //                                   $filter: {
  //                                     input: "$readByUserDetails",
  //                                     as: "u",
  //                                     cond: { $eq: ["$$u._id", "$$rb.userId"] },
  //                                   },
  //                                 },
  //                                 0,
  //                               ],
  //                             },
  //                             readAt: "$$rb.readAt",
  //                           },
  //                         },
  //                       },
  //                     },
  //                   },
  //                 ],
  //                 as: "comments",
  //               },
  //             },
  //             // dependencies
  //             {
  //               $lookup: {
  //                 from: "projecttaskdependencies",
  //                 localField: "_id",
  //                 foreignField: "taskId",
  //                 as: "dependenciesRaw",
  //               },
  //             },
  //             {
  //               $lookup: {
  //                 from: "projecttasks",
  //                 localField: "dependenciesRaw.dependsOnTaskId",
  //                 foreignField: "_id",
  //                 as: "dependencyTaskDetails",
  //               },
  //             },
  //             {
  //               $lookup: {
  //                 from: "users",
  //                 localField: "dependencyTaskDetails.assignedTo",
  //                 foreignField: "_id",
  //                 pipeline: [{ $project: { _id: 1, name: 1, image: 1 } }],
  //                 as: "dependencyAssignedTo",
  //               },
  //             },
  //             {
  //               $addFields: {
  //                 dependencyDetails: {
  //                   $map: {
  //                     input: "$dependenciesRaw",
  //                     as: "dep",
  //                     in: {
  //                       _id: "$$dep._id",
  //                       dependsOnTaskId: "$$dep.dependsOnTaskId",
  //                       type: "$$dep.type",
  //                       taskName: {
  //                         $arrayElemAt: [
  //                           {
  //                             $map: {
  //                               input: {
  //                                 $filter: {
  //                                   input: "$dependencyTaskDetails",
  //                                   cond: {
  //                                     $eq: [
  //                                       "$$this._id",
  //                                       "$$dep.dependsOnTaskId",
  //                                     ],
  //                                   },
  //                                 },
  //                               },
  //                               as: "dt",
  //                               in: "$$dt.name",
  //                             },
  //                           },
  //                           0,
  //                         ],
  //                       },
  //                       assignedTo: {
  //                         $filter: {
  //                           input: "$dependencyAssignedTo",
  //                           as: "user",
  //                           cond: {
  //                             $in: [
  //                               "$$user._id",
  //                               {
  //                                 $arrayElemAt: [
  //                                   {
  //                                     $map: {
  //                                       input: {
  //                                         $filter: {
  //                                           input: "$dependencyTaskDetails",
  //                                           cond: {
  //                                             $eq: [
  //                                               "$$this._id",
  //                                               "$$dep.dependsOnTaskId",
  //                                             ],
  //                                           },
  //                                         },
  //                                       },
  //                                       as: "dt",
  //                                       in: "$$dt.assignedTo",
  //                                     },
  //                                   },
  //                                   0,
  //                                 ],
  //                               },
  //                             ],
  //                           },
  //                         },
  //                       },
  //                       startDate: "$$dep.startDate",
  //                       dueDate: "$$dep.dueDate",
  //                     },
  //                   },
  //                 },
  //               },
  //             },

  //             // Project required task fields
  //             {
  //               $project: {
  //                 _id: 1,
  //                 projectId: 1,
  //                 taskListId: 1,
  //                 assignedToDetails: 1,
  //                 createdByDetails: 1,
  //                 lastUpdatedByDetails: 1,
  //                 parentTaskId: 1,
  //                 taskNumber: 1,
  //                 name: 1,
  //                 description: 1,
  //                 workflowId: 1,
  //                 stageId: 1,
  //                 priority: 1,
  //                 taskStatus: 1,
  //                 progress: 1,
  //                 followersDetails: 1,
  //                 tagsDetails: 1,
  //                 startDate: 1,
  //                 dueDate: 1,
  //                 completedAt: 1,
  //                 estimateMinutes: 1,
  //                 isBillable: 1,
  //                 invoiced: 1,
  //                 files: 1,
  //                 activeFlag: 1,
  //                 deleteFlag: 1,
  //                 reminders: 1,
  //                 reminderUsers: 1,
  //                 comments: 1,
  //                 dependencyDetails: 1,
  //                 customFields: 1,
  //                 createdAt: 1,
  //                 updatedAt: 1,
  //               },
  //             },
  //           ],
  //           as: "tasks",
  //         },
  //       },

  //       // final projection for list-level fields
  //       {
  //         $project: {
  //           _id: 1,
  //           projectId: 1,
  //           listIcon: 1,
  //           name: 1,
  //           description: 1,
  //           orderIndex: 1,
  //           createdByDetails: 1,
  //           viewByDetails: 1,
  //           tasks: 1,
  //         },
  //       },
  //     ];

  //     // Execute aggregation
  //     const lists = await TaskList.aggregate(pipeline);

  //     if (!lists || lists.length === 0) {
  //       return "NA";
  //     }

  //     // get custom fields for tasks (same as your previous logic)
  //     const moduleType = "Task";
  //     const customFieldList = await this.getCustomFieldList(
  //       SITE_DB_NAME,
  //       moduleType,
  //       0
  //     );

  //     // post-process lists & tasks to shape exactly as your sample
  //     const finalLists = lists.map((listDoc) => {
  //       const list = {
  //         _id: listDoc._id ? listDoc._id.toString() : null,
  //         projectId: listDoc.projectId ? listDoc.projectId.toString() : null,
  //         listIcon: listDoc.listIcon || null,
  //         name: listDoc.name || null,
  //         description: listDoc.description === "" ? null : listDoc.description,
  //         orderIndex:
  //           typeof listDoc.orderIndex === "number" ? listDoc.orderIndex : 0,
  //         createdBy: listDoc.createdByDetails
  //           ? {
  //               _id: listDoc.createdByDetails._id.toString(),
  //               name: listDoc.createdByDetails.name || null,
  //               image: listDoc.createdByDetails.image || null,
  //             }
  //           : null,
  //         viewBy: Array.isArray(listDoc.viewByDetails)
  //           ? listDoc.viewByDetails.map((u) => ({
  //               _id: u._id.toString(),
  //               name: u.name || null,
  //               image: u.image || null,
  //             }))
  //           : [],
  //         tasks: (listDoc.tasks || []).map((t) => {
  //           // custom fields mapping (reuse your logic)
  //           const taskCustomFields = t.customFields || {};
  //           const newCustomFields = {};
  //           for (const field of customFieldList) {
  //             const key = field.keyName;
  //             newCustomFields[key] = {
  //               fieldName: field.fieldName,
  //               keyName: field.keyName,
  //               fieldType: field.fieldType,
  //               options: field.options,
  //               _id: field._id,
  //               moduleType: field.moduleType,
  //               updatedAt: field.updatedAt,
  //               createdAt: field.createdAt,
  //               activeFlag: field.activeFlag,
  //               deleteFlag: field.deleteFlag,
  //               value: taskCustomFields[key]
  //                 ? taskCustomFields[key].value
  //                 : null,
  //             };
  //           }

  //           // reminders -> map users from reminderUsers
  //           const reminderUsers = t.reminderUsers || [];
  //           const reminders = (t.reminders || []).map((r) => {
  //             const usersMapped = (r.userIds || []).map((uid) => {
  //               const found = reminderUsers.find(
  //                 (ru) => ru._id.toString() === uid.toString()
  //               );
  //               if (found) {
  //                 return {
  //                   _id: found._id.toString(),
  //                   name: found.name || null,
  //                   image: found.image || null,
  //                 };
  //               }
  //               // fallback: return minimal id object
  //               return { _id: uid.toString(), name: null, image: null };
  //             });

  //             return {
  //               date: r.date ? new Date(r.date).toISOString() : null,
  //               users: usersMapped,
  //               description: r.description === "" ? null : r.description,
  //               type: r.type || "email",
  //             };
  //           });

  //           // tags
  //           const tags = (t.tagsDetails || []).map((tag) => ({
  //             _id: tag._id ? tag._id.toString() : null,
  //             name: tag.name || null,
  //             color: tag.color || null,
  //           }));

  //           return {
  //             _id: t._id ? t._id.toString() : null,
  //             projectId: t.projectId ? t.projectId.toString() : null,
  //             taskListId: t.taskListId ? t.taskListId.toString() : null,
  //             assignedTo: (t.assignedToDetails || []).map((a) => ({
  //               _id: a._id.toString(),
  //               name: a.name || null,
  //               image: a.image || null,
  //             })),
  //             createdBy: t.createdByDetails
  //               ? {
  //                   _id: t.createdByDetails._id.toString(),
  //                   name: t.createdByDetails.name || null,
  //                   image: t.createdByDetails.image || null,
  //                   date: t.createdAt
  //                     ? new Date(t.createdAt).toISOString()
  //                     : null,
  //                 }
  //               : null,
  //             lastUpdatedBy: t.lastUpdatedByDetails
  //               ? {
  //                   _id: t.lastUpdatedByDetails._id.toString(),
  //                   name: t.lastUpdatedByDetails.name || null,
  //                   image: t.lastUpdatedByDetails.image || null,
  //                   date: t.updatedAt
  //                     ? new Date(t.updatedAt).toISOString()
  //                     : null,
  //                 }
  //               : null,
  //             taskNumber: t.taskNumber || null,
  //             name: t.name || null,
  //             description: t.description === "" ? null : t.description,
  //             parentTaskId: t.parentTaskId ? t.parentTaskId.toString() : null,
  //             workflowId: t.workflowId ? t.workflowId.toString() : null,
  //             stageId: t.stageId ? t.stageId.toString() : null,
  //             priority: t.priority || "none",
  //             taskStatus: t.taskStatus || "not started",
  //             progress: typeof t.progress === "number" ? t.progress : 0,
  //             followersDetails: (t.followersDetails || []).map((f) => ({
  //               _id: f._id.toString(),
  //               name: f.name || null,
  //               image: f.image || null,
  //             })),
  //             tags: tags,
  //             startDate: t.startDate
  //               ? new Date(t.startDate).toISOString()
  //               : null,
  //             dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
  //             completedAt: t.completedAt
  //               ? new Date(t.completedAt).toISOString()
  //               : null,
  //             estimateMinutes:
  //               typeof t.estimateMinutes === "number" ? t.estimateMinutes : 0,
  //             isBillable:
  //               typeof t.isBillable === "boolean" ? t.isBillable : true,
  //             invoiced: typeof t.invoiced === "boolean" ? t.invoiced : false,
  //             files: Array.isArray(t.files) ? t.files : [],
  //             activeFlag: typeof t.activeFlag === "number" ? t.activeFlag : 1,
  //             deleteFlag: typeof t.deleteFlag === "number" ? t.deleteFlag : 0,
  //             reminders: reminders,
  //             createdAt: t.createdAt
  //               ? new Date(t.createdAt).toISOString()
  //               : null,
  //             updatedAt: t.updatedAt
  //               ? new Date(t.updatedAt).toISOString()
  //               : null,
  //             comments: t.comments || [],
  //             dependencies: (t.dependencyDetails || []).map((d) => ({
  //               _id: d._id || null,
  //               dependsOnTaskId: d.dependsOnTaskId || null,
  //               type: d.type || null,
  //               taskName: d.taskName || null,
  //               assignedTo: (d.assignedTo || []).map((a) => ({
  //                 _id: a._id || null,
  //                 name: a.name || null,
  //                 image: a.image || null,
  //               })),
  //               startDate: d.startDate || null,
  //               dueDate: d.dueDate || null,
  //             })),
  //             customFields: newCustomFields,
  //           };
  //         }),
  //       };
  //       return list;
  //     });

  //     return finalLists;
  //   } catch (error) {
  //     console.log("Database error from getAllTask:", error.message);
  //     throw new Error(error.message);
  //   }
  // },

  async checkTask(SITE_DB_NAME, taskId) {
    const Task = await TaskModel(SITE_DB_NAME);
    try {
      const existing = await Task.findOne({
        deleteFlag: 0,
        _id: taskId,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkTask:", error);
      throw new Error(error.message);
    }
  },

  // UserCommenService.js
  async reorderTaskInStage(
    SITE_DB_NAME,
    taskId,
    stageId,
    newOrderIndex,
    userId,
  ) {
    const Task = await TaskModel(SITE_DB_NAME);

    try {
      // 1️⃣ Current task
      const currentTask = await Task.findById(taskId).lean();
      if (!currentTask) {
        return "NA";
      }

      // 2️⃣ Same stage ke baki tasks (excluding current)
      const stageTasks = await Task.find({
        stageId: stageId,
        deleteFlag: 0,
        _id: { $ne: taskId },
      })
        .sort({ orderIndex: 1 })
        .lean();

      // 3️⃣ Reorder logic
      const reorderedTasks = [];
      let inserted = false;

      stageTasks.forEach((t, idx) => {
        if (idx + 1 === newOrderIndex) {
          reorderedTasks.push(currentTask);
          inserted = true;
        }
        reorderedTasks.push(t);
      });

      if (!inserted) {
        reorderedTasks.push(currentTask);
      }

      // 4️⃣ Bulk update
      const bulkOps = reorderedTasks.map((t, idx) => ({
        updateOne: {
          filter: { _id: t._id },
          update: {
            $set: {
              stageId: stageId,
              orderIndex: idx + 1,
              lastUpdatedBy: userId,
            },
          },
        },
      }));

      const bulkResult = await Task.bulkWrite(bulkOps);

      // 5️⃣ Same pattern as updateTaskField
      if (bulkResult && bulkResult.modifiedCount >= 0) {
        return bulkResult;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in reorderTaskInStage:", error);
      throw new Error(error.message);
    }
  },

  async updateTaskField(SITE_DB_NAME, taskId, data) {
    const Task = await TaskModel(SITE_DB_NAME);
    try {
      const updateStatus = await Task.updateOne(
        { _id: taskId },
        { $set: data },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateTaskField:", error);
      throw new Error(error.message);
    }
  },

  async updateTask(SITE_DB_NAME, taskId, data) {
    const Task = await TaskModel(SITE_DB_NAME);
    try {
      const updateStatus = await Task.updateOne(
        { _id: taskId },
        { $set: data },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateTask:", error);
      throw new Error(error.message);
    }
  },

  async getTaskFieldDetails(SITE_DB_NAME, taskId, fieldName) {
    const Task = await TaskModel(SITE_DB_NAME);
    try {
      const taskDetails = await Task.findOne(
        {
          _id: taskId,
          deleteFlag: 0,
        },
        { _id: 0 },
      );

      if (taskDetails) {
        return taskDetails;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getTaskFieldDetails:", error);
      throw new Error(error.message);
    }
  },

  async updateTaskCustomField(SITE_DB_NAME, taskId, updateData) {
    const Task = await TaskModel(SITE_DB_NAME);
    try {
      const updateStatus = await Task.findOneAndUpdate(
        { _id: taskId },
        { $set: updateData },
        { new: true },
      );

      return updateStatus || "NA";
    } catch (error) {
      console.error("Error in updateTaskCustomField:", error);
      throw new Error(error.message);
    }
  },

  async removeFileTask(SITE_DB_NAME, taskId, filePath) {
    const Task = await TaskModel(SITE_DB_NAME);
    try {
      const updateStatus = await Task.findOneAndUpdate(
        { _id: taskId },
        {
          $pull: {
            files: filePath, // array se exact match remove
          },
        },
        { new: true },
      );

      return updateStatus || "NA";
    } catch (error) {
      console.error("Error in removeFileTask:", error);
      throw new Error(error.message);
    }
  },

  async getTaskCustomField(SITE_DB_NAME, taskId) {
    const Task = await TaskModel(SITE_DB_NAME);
    try {
      const result = await Task.aggregate([
        {
          $match: {
            deleteFlag: 0,
            _id: taskId,
          },
        },
        {
          $project: {
            name: 1,
            customFields: 1,
          },
        },
      ]);

      if (result.length > 0) {
        const moduleType = "Task";
        const customFieldList = await this.getCustomFieldList(
          SITE_DB_NAME,
          moduleType,
          0,
        );

        const enrichedTasks = result.map((task) => {
          // Agar DB me customFields stored hai to use karo
          task.customFields = task.customFields || {};

          const newCustomFields = {};

          for (const field of customFieldList) {
            const key = field.keyName;
            const valueFromTask = task.customFields[key];

            // Agar DB me value hai to wahi return karo warna null
            const finalValue = valueFromTask?.value ?? null;

            newCustomFields[key] = {
              fieldName: field.fieldName,
              keyName: field.keyName,
              fieldType: field.fieldType,
              options: field.options,
              _id: field._id,
              moduleType: field.moduleType,
              updatedAt: field.updatedAt,
              createdAt: field.createdAt,
              activeFlag: field.activeFlag,
              deleteFlag: field.deleteFlag,
              value: finalValue, // 👈 ab properly update hoga
            };
          }

          task.customFields = newCustomFields;
          return task;
        });

        return enrichedTasks[0];
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getTaskCustomField:", error);
      throw new Error(error.message);
    }
  },

  async getTaskTags(SITE_DB_NAME, taskId) {
    const Task = await TaskModel(SITE_DB_NAME);
    try {
      const result = await Task.aggregate([
        {
          $match: {
            _id: taskId,
            deleteFlag: 0,
          },
        },
        {
          $lookup: {
            from: "tags", // ya "Tags" agar collection name uppercase hai
            localField: "tags",
            foreignField: "_id",
            as: "tags",
          },
        },
        {
          $project: {
            tags: {
              $map: {
                input: "$tags",
                as: "tag",
                in: {
                  _id: "$$tag._id",
                  name: "$$tag.name",
                  color: "$$tag.color",
                },
              },
            },
          },
        },
      ]);

      if (result.length > 0) {
        return result[0];
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getTaskTags:", error);
      throw new Error(error.message);
    }
  },

  async deleteTask(SITE_DB_NAME, taskId) {
    const Task = await TaskModel(SITE_DB_NAME);
    try {
      const deleteResult = await Task.deleteOne({
        _id: taskId,
      });
      if (deleteResult) {
        return true;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in deleteTask:", error);
      throw new Error(error.message);
    }
  },

  async createTaskDependency(SITE_DB_NAME, data) {
    const TaskDependency = await TaskDependencyModel(SITE_DB_NAME);
    try {
      const TaskDetails = await TaskDependency.create(data);
      if (TaskDetails) {
        return TaskDetails;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createTaskDependency:", error);
      throw new Error(error.message);
    }
  },

  async checkTaskDependencyId(SITE_DB_NAME, taskDependencyId) {
    const TaskDependency = await TaskDependencyModel(SITE_DB_NAME);
    try {
      const existing = await TaskDependency.findOne({
        deleteFlag: 0,
        _id: new mongoose.Types.ObjectId(taskDependencyId),
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkTaskDependencyId:", error);
      throw new Error(error.message);
    }
  },

  async updateTaskDependency(SITE_DB_NAME, taskDependencyId, data) {
    const TaskDependency = await TaskDependencyModel(SITE_DB_NAME);
    try {
      const updateStatus = await TaskDependency.updateOne(
        { _id: taskDependencyId },
        { $set: data },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateTaskDependency:", error);
      throw new Error(error.message);
    }
  },

  async deleteTaskDependency(SITE_DB_NAME, taskDependencyId) {
    const TaskDependency = await TaskDependencyModel(SITE_DB_NAME);
    try {
      const deleteResult = await TaskDependency.deleteOne({
        _id: taskDependencyId,
      });
      if (deleteResult) {
        return true;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in deleteTaskDependency:", error);
      throw new Error(error.message);
    }
  },

  async createCommentTask(SITE_DB_NAME, data) {
    const TaskComment = await TaskCommentModel(SITE_DB_NAME);
    try {
      const createTaskCommentData = await TaskComment.create(data);
      if (createTaskCommentData) {
        return createTaskCommentData;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in createCommentTask:", error);
      throw new Error(error.message);
    }
  },

  async checkNotifyUser(SITE_DB_NAME, userId) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const checkUser = await User.find({ _id: { $in: userId } });
      if (checkUser) {
        return checkUser;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("Database error from checkNotifyUser:", error.message);
      throw new Error(error.message);
    }
  },

  async checkTaskComment(SITE_DB_NAME, taskCommentId) {
    const TaskComment = await TaskCommentModel(SITE_DB_NAME);
    try {
      const existing = await TaskComment.findOne({
        deleteFlag: 0,
        _id: taskCommentId,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkTaskComment:", error);
      throw new Error(error.message);
    }
  },

  async updateCommentTask(SITE_DB_NAME, taskCommetId, data) {
    const TaskComment = await TaskCommentModel(SITE_DB_NAME);
    try {
      const updateStatus = await TaskComment.updateOne(
        { _id: taskCommetId },
        { $set: data },
        { upsert: false },
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateCommentTask:", error);
      throw new Error(error.message);
    }
  },

  async getTaskComment(SITE_DB_NAME, taskCommentId) {
    const TaskComment = await TaskCommentModel(SITE_DB_NAME);
    try {
      const TaskCommentDetails = await TaskComment.findOne({
        _id: taskCommentId,
        deleteFlag: 0,
      });

      if (TaskCommentDetails) {
        return TaskCommentDetails;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getTaskComment:", error);
      throw new Error(error.message);
    }
  },

  async getTaskCommentFieldDetails(SITE_DB_NAME, taskCommentId, fieldName) {
    const TaskComment = await TaskCommentModel(SITE_DB_NAME);
    try {
      const taskCommentDetails = await TaskComment.findOne(
        {
          _id: taskCommentId,
          deleteFlag: 0,
        },
        { [fieldName]: 1, _id: 0 },
      );

      if (taskCommentDetails) {
        return taskCommentDetails;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getTaskCommentFieldDetails:", error);
      throw new Error(error.message);
    }
  },

  async updateTaskCommentField(SITE_DB_NAME, taskCommetId, data) {
    const TaskComment = await TaskCommentModel(SITE_DB_NAME);
    try {
      // **Check if $push is used (reactions)**
      let updateStatus;
      if (data.$push || data.$addToSet) {
        if (Object.keys(data).length > 0) {
          // ensure data empty nahi hai
          updateStatus = await TaskComment.updateOne(
            { _id: taskCommetId },
            data,
          );
        } else {
          updateStatus = { modifiedCount: 0 }; // nothing to update
        }
      } else {
        updateStatus = await TaskComment.updateOne(
          { _id: taskCommetId },
          { $set: data },
          { upsert: false },
        );
      }

      if (updateStatus.modifiedCount > 0) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in updateTaskCommentField:", error);
      throw new Error(error.message);
    }
  },

  async deleteTaskCommnet(SITE_DB_NAME, taskCommentId) {
    const TaskComment = await TaskCommentModel(SITE_DB_NAME);
    try {
      const deleteResult = await TaskComment.deleteOne({
        _id: taskCommentId,
      });
      if (deleteResult) {
        return true;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in deleteTaskCommnet:", error);
      throw new Error(error.message);
    }
  },

  async markAllTaskCommentsRead(SITE_DB_NAME, userId, taskId) {
    const TaskComment = await TaskCommentModel(SITE_DB_NAME);
    try {
      const taskCommentDetails = await TaskComment.updateMany(
        {
          taskId,
          deleteFlag: 0,
          "readBy.userId": { $ne: userId },
          createdBy: { $ne: userId },
        },
        {
          $addToSet: {
            readBy: { userId, readAt: new Date() },
          },
        },
      );

      if (taskCommentDetails.modifiedCount > 0) {
        return taskCommentDetails;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in markAllTaskCommentsRead:", error);
      throw new Error(error.message);
    }
  },

  async checkSubTaskLastNumber(SITE_DB_NAME, parentTaskId) {
    try {
      const Task = await TaskModel(SITE_DB_NAME);

      const parentTask = await Task.findById(parentTaskId).lean();
      if (!parentTask || !parentTask.taskNumber) return "NA";

      const parentTaskNumber = parentTask.taskNumber;

      // sirf last subtask lao
      const lastSubTask = await Task.findOne({
        parentTaskId,
        taskNumber: { $regex: `${parentTaskNumber}-SUBTASK-\\d+$` },
      })
        .sort({ createdAt: -1 })
        .lean();

      if (!lastSubTask) {
        return `${parentTaskNumber}-SUBTASK-001`;
      }

      const match = lastSubTask.taskNumber.match(/SUBTASK-(\d+)$/);
      const lastNum = match ? parseInt(match[1], 10) : 0;

      const nextNum = String(lastNum + 1).padStart(3, "0");

      return `${parentTaskNumber}-SUBTASK-${nextNum}`;
    } catch (error) {
      console.error("Error in checkSubTaskLastNumber :", error);
      return "NA";
    }
  },
  async getProjectAllTaskComments(
    SITE_DB_NAME,
    deleteFlag,
    projectId,
    pagination,
  ) {
    const TaskComment = await TaskCommentModel(SITE_DB_NAME);

    try {
      const pageSize =
        Number(pagination?.pageSize) > 0 ? Number(pagination.pageSize) : 10;
      const pageNumber =
        Number(pagination?.pageNumber) > 0 ? Number(pagination.pageNumber) : 1;

      const skip = (pageNumber - 1) * pageSize;

      const pipeline = [
        // match comments for project & deleteFlag
        {
          $match: {
            projectId: projectId,
            deleteFlag: deleteFlag,
          },
        },

        // Attach task details (so we can return task name)
        {
          $lookup: {
            from: "projecttasks", // tasks collection
            localField: "taskId",
            foreignField: "_id",
            as: "task",
          },
        },
        {
          $unwind: {
            path: "$task",
            preserveNullAndEmptyArrays: true,
          },
        },

        // createdBy details
        {
          $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            pipeline: [{ $project: { _id: 1, name: 1, image: 1 } }],
            as: "createdByDetails",
          },
        },
        {
          $unwind: {
            path: "$createdByDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // updateBy details
        {
          $lookup: {
            from: "users",
            localField: "updateBy",
            foreignField: "_id",
            pipeline: [{ $project: { _id: 1, name: 1, image: 1 } }],
            as: "updateByDetails",
          },
        },
        {
          $unwind: {
            path: "$updateByDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        // privacyPeopleIds -> users
        {
          $lookup: {
            from: "users",
            localField: "privacyPeopleIds",
            foreignField: "_id",
            pipeline: [{ $project: { _id: 1, name: 1, image: 1 } }],
            as: "privacyPeopleDetails",
          },
        },

        // notifyIds -> users
        {
          $lookup: {
            from: "users",
            localField: "notifyIds",
            foreignField: "_id",
            pipeline: [{ $project: { _id: 1, name: 1, image: 1 } }],
            as: "notifyUserDetails",
          },
        },

        // reactions.reactedBy -> users (flatten lookup to map later)
        {
          $lookup: {
            from: "users",
            localField: "reactions.reactedBy",
            foreignField: "_id",
            pipeline: [{ $project: { _id: 1, name: 1, image: 1 } }],
            as: "reactionUserDetails",
          },
        },

        // readBy.userId -> users
        {
          $lookup: {
            from: "users",
            localField: "readBy.userId",
            foreignField: "_id",
            pipeline: [{ $project: { _id: 1, name: 1, image: 1 } }],
            as: "readByUserDetails",
          },
        },

        // final projection: map fields and map reactions/readBy to include user details
        {
          $project: {
            _id: 1,
            message: 1,
            files: 1,
            createdAt: 1,
            updatedAt: 1,
            visibilityType: 1,
            activeFlag: 1,
            deleteFlag: 1,

            // task info (so frontend can show which task this comment belongs to)
            task: {
              _id: "$task._id",
              name: "$task.name",
            },

            // createdBy/updateBy simplified objects
            createdBy: "$createdByDetails",
            updateBy: "$updateByDetails",
            privacyPeople: "$privacyPeopleDetails",
            notifyUsers: "$notifyUserDetails",

            // reactions: attach reactedBy user object (if matched)
            reactions: {
              $map: {
                input: { $ifNull: ["$reactions", []] },
                as: "r",
                in: {
                  emoji: "$$r.emoji",
                  reactedBy: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$reactionUserDetails",
                          as: "u",
                          cond: { $eq: ["$$u._id", "$$r.reactedBy"] },
                        },
                      },
                      0,
                    ],
                  },
                  reactedAt: "$$r.reactedAt",
                },
              },
            },

            // readBy: attach user object
            readBy: {
              $map: {
                input: { $ifNull: ["$readBy", []] },
                as: "rb",
                in: {
                  user: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$readByUserDetails",
                          as: "u",
                          cond: { $eq: ["$$u._id", "$$rb.userId"] },
                        },
                      },
                      0,
                    ],
                  },
                  readAt: "$$rb.readAt",
                },
              },
            },
          },
        },

        // sort & paginate
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
      ];

      const result = await TaskComment.aggregate(pipeline);
      return result?.length > 0 ? result : [];
    } catch (error) {
      console.log(
        "Database error from getProjectAllTaskComments:",
        error.message,
      );
      throw new Error(error.message);
    }
  },

  //task log timer
  async createTaskLogTimer(SITE_DB_NAME, payload, performedBy) {
    function recalcTotal(intervals) {
      let total = 0;
      (intervals || []).forEach((it) => {
        if (typeof it.duration === "number" && it.duration > 0)
          total += it.duration;
        else if (it.from && it.to)
          total += Math.max(
            0,
            Math.floor((new Date(it.to) - new Date(it.from)) / 1000),
          );
      });
      return total;
    }

    function snapshotForAction(doc) {
      if (!doc) return null;
      return {
        intervals: (doc.intervals || []).map((i) => ({
          from: i.from ? i.from.toISOString() : null,
          to: i.to ? i.to.toISOString() : null,
          duration: i.duration,
        })),
        totalDuration: doc.totalDuration || 0,
        billable: !!doc.billable,
        hourlyRate: doc.hourlyRate || 0,
        status: doc.status || null,
        running: !!doc.running,
      };
    }

    const TaskLogTime = await TaskLogTimeModel(SITE_DB_NAME);
    const User = await UserModel(SITE_DB_NAME);

    try {
      const now = payload.punchDate
        ? moment(payload.punchDate, "YYYY-MM-DD HH:mm:ss").isValid()
          ? moment(payload.punchDate, "YYYY-MM-DD HH:mm:ss").toDate()
          : new Date()
        : new Date();

      const action = payload.action
        ? String(payload.action).toUpperCase()
        : null;

      const user = await User.findById(performedBy).select("billableRate");
      const hourlyRate = user?.billableRate || 0;

      /* ================= MANUAL ================= */
      if (action === "MANUAL") {
        const s = moment(payload.startTime, "YYYY-MM-DD HH:mm:ss");
        const e = moment(payload.endTime, "YYYY-MM-DD HH:mm:ss");
        if (!s.isValid() || !e.isValid() || e.isBefore(s)) return "NA";

        const from = s.toDate();
        const to = e.toDate();
        const duration = Math.max(0, Math.floor((to - from) / 1000));

        if (payload.taskTimeId) {
          const doc = await TaskLogTime.findOne({
            _id: payload.taskTimeId,
            deleteFlag: 0,
          });
          if (!doc) return "NA";

          const oldSnap = snapshotForAction(doc);
          doc.intervals = doc.intervals || [];
          doc.intervals.push({ from, to, duration });
          doc.totalDuration = recalcTotal(doc.intervals);
          if (typeof doc.hourlyRate !== "number") {
            doc.hourlyRate = hourlyRate;
          }
          doc.status = "EDITED";
          doc.actions = doc.actions || [];
          doc.actions.push({
            status: "EDITED",
            oldValue: oldSnap,
            newValue: snapshotForAction(doc),
            by: performedBy,
            reason: "Manual interval added",
          });
          await doc.save();
          return doc;
        } else {
          const docPayload = {
            projectId: payload.projectId,
            taskListId: payload.taskListId,
            taskId: payload.taskId,
            userId: performedBy,
            startedAt: from,
            stoppedAt: to,
            lastStartedAt: null,
            running: false,
            intervals: [{ from, to, duration }],
            totalDuration: duration,
            description: payload.description || "",
            source: "MANUAL",
            billable: !!payload.billable,
            hourlyRate,
            tags: Array.isArray(payload.tags) ? payload.tags : [],
            attachments: Array.isArray(payload.attachments)
              ? payload.attachments
              : [],
            status: "CREATED",
            actions: [
              {
                status: "CREATED",
                oldValue: null,
                newValue: null,
                by: performedBy,
                reason: "Manual log created",
              },
            ],
            activeFlag: 1,
            deleteFlag: 0,
          };
          const created = await TaskLogTime.create(docPayload);
          return created;
        }
      }

      /* ================= START ================= */
      if (action === "START") {
        const runningTimer = await TaskLogTime.findOne({
          userId: performedBy,
          running: true,
          deleteFlag: 0,
        });
        if (runningTimer) {
          const oldSnap = snapshotForAction(runningTimer);
          const lastIdx = runningTimer.intervals.length - 1;
          if (lastIdx >= 0 && !runningTimer.intervals[lastIdx].to) {
            runningTimer.intervals[lastIdx].to = now;
            runningTimer.intervals[lastIdx].duration = Math.max(
              0,
              Math.floor((now - runningTimer.intervals[lastIdx].from) / 1000),
            );
          }
          runningTimer.totalDuration = recalcTotal(runningTimer.intervals);
          runningTimer.running = false;
          runningTimer.lastStartedAt = null;
          runningTimer.stoppedAt = now;
          runningTimer.editedCount = (runningTimer.editedCount || 0) + 1;
          runningTimer.actions = runningTimer.actions || [];
          runningTimer.actions.push({
            status: "EDITED",
            oldValue: oldSnap,
            newValue: snapshotForAction(runningTimer),
            by: performedBy,
            reason: "Auto-stopped previous running timer",
          });
          await runningTimer.save();
        }

        const docPayload = {
          projectId: payload.projectId,
          taskListId: payload.taskListId,
          taskId: payload.taskId,
          userId: performedBy,
          startedAt: now,
          lastStartedAt: now,
          stoppedAt: null,
          running: true,
          intervals: [{ from: now, to: null, duration: 0 }],
          totalDuration: 0,
          description: payload.description || "",
          source: "TIMER",
          billable:
            typeof payload.billable !== "undefined"
              ? !!payload.billable
              : false,
          hourlyRate,
          tags: Array.isArray(payload.tags) ? payload.tags : [],
          attachments: Array.isArray(payload.attachments)
            ? payload.attachments
            : [],
          status: "CREATED",
          actions: [
            {
              status: "CREATED",
              oldValue: null,
              newValue: null,
              by: performedBy,
              reason: "Timer started",
            },
          ],
          activeFlag: 1,
          deleteFlag: 0,
        };
        const created = await TaskLogTime.create(docPayload);
        return created;
      }

      /* ================= FIND DOC ================= */
      let doc = null;
      if (payload.taskTimeId) {
        doc = await TaskLogTime.findOne({
          _id: payload.taskTimeId,
          deleteFlag: 0,
        });
      } else if (payload.projectId && payload.taskId && payload.taskListId) {
        doc = await TaskLogTime.findOne({
          projectId: payload.projectId,
          taskId: payload.taskId,
          taskListId: payload.taskListId,
          userId: performedBy,
          deleteFlag: 0,
        }).sort({ createdAt: -1 });
      } else {
        doc = await TaskLogTime.findOne({
          userId: performedBy,
          deleteFlag: 0,
        }).sort({ createdAt: -1 });
      }

      if (!doc) return "NA";

      const oldSnap = snapshotForAction(doc);

      /* ================= PAUSE ================= */
      if (action === "PAUSE") {
        const lastIdx = doc.intervals.length - 1;
        if (lastIdx >= 0 && !doc.intervals[lastIdx].to) {
          doc.intervals[lastIdx].to = now;
          doc.intervals[lastIdx].duration = Math.max(
            0,
            Math.floor((now - doc.intervals[lastIdx].from) / 1000),
          );
        }
        doc.totalDuration = recalcTotal(doc.intervals);
        doc.running = false;
        doc.lastStartedAt = null;
        doc.stoppedAt = now;
        doc.editedCount = (doc.editedCount || 0) + 1;
        doc.status = "EDITED";
        doc.actions = doc.actions || [];
        doc.actions.push({
          status: "EDITED",
          oldValue: oldSnap,
          newValue: snapshotForAction(doc),
          by: performedBy,
          reason: "Paused timer",
        });
        await doc.save();
        return doc;
      }

      /* ================= RESUME ================= */
      if (action === "RESUME") {
        const hasOpen = (doc.intervals || []).some((i) => !i.to);
        if (!hasOpen) {
          doc.intervals.push({ from: now, to: null, duration: 0 });
        }
        doc.running = true;
        doc.lastStartedAt = now;
        doc.editedCount = (doc.editedCount || 0) + 1;
        doc.status = "EDITED";
        doc.actions = doc.actions || [];
        doc.actions.push({
          status: "EDITED",
          oldValue: oldSnap,
          newValue: snapshotForAction(doc),
          by: performedBy,
          reason: "Resumed timer",
        });
        await doc.save();
        return doc;
      }

      /* ================= STOP ================= */
      if (action === "STOP") {
        const parsePayloadIntervals = (inputIntervals) => {
          if (!Array.isArray(inputIntervals)) return null;
          const parsed = inputIntervals
            .map((it) => {
              const from =
                it?.from && moment(it.from).isValid()
                  ? moment(it.from).toDate()
                  : null;
              const to =
                it?.to && moment(it.to).isValid()
                  ? moment(it.to).toDate()
                  : null;
              const duration =
                typeof it.duration === "number"
                  ? it.duration
                  : from && to
                    ? Math.max(0, Math.floor((to - from) / 1000))
                    : 0;
              return from ? { from, to, duration } : null;
            })
            .filter(Boolean);
          return parsed.length ? parsed : null;
        };

        const payloadIntervals = parsePayloadIntervals(payload.intervals);

        if (payloadIntervals) {
          doc.intervals = payloadIntervals;

          if (payload.startedAt && moment(payload.startedAt).isValid()) {
            doc.startedAt = moment(payload.startedAt).toDate();
          } else if (doc.intervals[0]?.from) {
            doc.startedAt = doc.intervals[0].from;
          }

          if (payload.stoppedAt && moment(payload.stoppedAt).isValid()) {
            doc.stoppedAt = moment(payload.stoppedAt).toDate();
          } else {
            const lastClosed = doc.intervals
              .slice()
              .reverse()
              .find((i) => i.to);
            doc.stoppedAt = lastClosed ? lastClosed.to : null;
          }

          const open = doc.intervals.some((i) => !i.to);
          doc.running = !!open;

          const openInterval = doc.intervals
            .slice()
            .reverse()
            .find((i) => !i.to);
          doc.lastStartedAt = openInterval ? openInterval.from : null;

          if (payload.projectId) doc.projectId = payload.projectId;
          if (payload.taskListId) doc.taskListId = payload.taskListId;
          if (payload.taskId) doc.taskId = payload.taskId;
          if (typeof payload.billable !== "undefined")
            doc.billable = !!payload.billable;
          if (typeof payload.hourlyRate !== "undefined")
            doc.hourlyRate = payload.hourlyRate;
          if (Array.isArray(payload.tags)) doc.tags = payload.tags;
          if (typeof payload.description !== "undefined")
            doc.description = payload.description;

          doc.totalDuration = recalcTotal(doc.intervals);
          doc.editedCount = (doc.editedCount || 0) + 1;
          doc.status = "EDITED";
        } else {
          const lastIdx = doc.intervals.length - 1;
          if (lastIdx >= 0 && !doc.intervals[lastIdx].to) {
            doc.intervals[lastIdx].to = now;
            doc.intervals[lastIdx].duration = Math.max(
              0,
              Math.floor((now - doc.intervals[lastIdx].from) / 1000),
            );
          }
          doc.totalDuration = recalcTotal(doc.intervals);
          doc.running = false;
          doc.lastStartedAt = null;
          doc.stoppedAt = now;
          doc.editedCount = (doc.editedCount || 0) + 1;
          doc.status = "EDITED";
        }

        doc.actions = doc.actions || [];
        doc.actions.push({
          status: "EDITED",
          oldValue: oldSnap,
          newValue: snapshotForAction(doc),
          by: performedBy,
          reason: "Stopped timer",
        });
        await doc.save();
        return doc;
      }

      /* ================= STATUS ================= */
      if (action === "STATUS") {
        const newStatus = payload.status
          ? String(payload.status).toUpperCase()
          : null;
        if (!newStatus) return "NA";

        doc.actions = doc.actions || [];
        doc.actions.push({
          status: newStatus,
          oldValue: oldSnap,
          newValue: { status: newStatus },
          by: performedBy,
          reason: payload.reason || "",
        });
        doc.status = newStatus;
        if (newStatus === "APPROVED") {
          doc.approvedBy = performedBy;
          doc.approvedAt = new Date();
        }
        await doc.save();
        return doc;
      }

      return "NA";
    } catch (error) {
      console.error("Service createTaskLogTimer error:", error);
      throw new Error(error.message);
    }
  },
  // async createTaskLogTimer(SITE_DB_NAME, payload, performedBy) {
  //   function recalcTotal(intervals) {
  //     let total = 0;
  //     (intervals || []).forEach((it) => {
  //       if (typeof it.duration === "number" && it.duration > 0)
  //         total += it.duration;
  //       else if (it.from && it.to)
  //         total += Math.max(
  //           0,
  //           Math.floor((new Date(it.to) - new Date(it.from)) / 1000)
  //         );
  //     });
  //     return total;
  //   }

  //   function snapshotForAction(doc) {
  //     if (!doc) return null;
  //     return {
  //       intervals: (doc.intervals || []).map((i) => ({
  //         from: i.from ? i.from.toISOString() : null,
  //         to: i.to ? i.to.toISOString() : null,
  //         duration: i.duration,
  //       })),
  //       totalDuration: doc.totalDuration || 0,
  //       billable: !!doc.billable,
  //       hourlyRate: doc.hourlyRate || 0,
  //       status: doc.status || null,
  //       running: !!doc.running,
  //     };
  //   }
  //   const TaskLogTime = await TaskLogTimeModel(SITE_DB_NAME);
  //   try {
  //     const now = payload.punchDate
  //       ? moment(payload.punchDate, "YYYY-MM-DD HH:mm:ss").isValid()
  //         ? moment(payload.punchDate, "YYYY-MM-DD HH:mm:ss").toDate()
  //         : new Date()
  //       : new Date();

  //     const recalcTotal = (intervals) => {
  //       let total = 0;
  //       (intervals || []).forEach((it) => {
  //         if (typeof it.duration === "number" && it.duration > 0)
  //           total += it.duration;
  //         else if (it.from && it.to)
  //           total += Math.max(
  //             0,
  //             Math.floor((new Date(it.to) - new Date(it.from)) / 1000)
  //           );
  //       });
  //       return total;
  //     };

  //     const snapshot = (doc) => {
  //       if (!doc) return null;
  //       return {
  //         intervals: (doc.intervals || []).map((i) => ({
  //           from: i.from ? i.from.toISOString() : null,
  //           to: i.to ? i.to.toISOString() : null,
  //           duration: i.duration,
  //         })),
  //         totalDuration: doc.totalDuration || 0,
  //         billable: !!doc.billable,
  //         hourlyRate: doc.hourlyRate || 0,
  //         status: doc.status || null,
  //         running: !!doc.running,
  //       };
  //     };

  //     const explicitAction = payload.action
  //       ? String(payload.action).toUpperCase()
  //       : null;
  //     const isManualLog =
  //       explicitAction === "LOG" || (payload.startTime && payload.endTime);

  //     // MANUAL LOG
  //     if (isManualLog) {
  //       const s = moment(
  //         payload.startTime || payload.punchDate,
  //         "YYYY-MM-DD HH:mm:ss"
  //       );
  //       const e = moment(payload.endTime, "YYYY-MM-DD HH:mm:ss");
  //       if (!s.isValid() || !e.isValid() || e.isBefore(s)) return "NA";

  //       const from = s.toDate();
  //       const to = e.toDate();
  //       const duration = Math.max(0, Math.floor((to - from) / 1000));

  //       const doc = new TaskLogTime({
  //         projectId: payload.projectId,
  //         taskListId: payload.taskListId,
  //         taskId: payload.taskId,
  //         userId: performedBy,
  //         startedAt: from,
  //         stoppedAt: to,
  //         lastStartedAt: null,
  //         running: false,
  //         intervals: [{ from, to, duration }],
  //         totalDuration: duration,
  //         description: payload.description || "",
  //         billable:
  //           typeof payload.billable !== "undefined"
  //             ? !!payload.billable
  //             : false,
  //         hourlyRate:
  //           typeof payload.hourlyRate !== "undefined" ? payload.hourlyRate : 0,
  //         tags: Array.isArray(payload.tags) ? payload.tags : [],
  //         attachments: Array.isArray(payload.attachments)
  //           ? payload.attachments
  //           : [],
  //         status: "CREATED",
  //         actions: [
  //           {
  //             status: "CREATED",
  //             oldValue: null,
  //             newValue: null,
  //             by: performedBy,
  //             reason: "Manual log created",
  //           },
  //         ],
  //         activeFlag: 1,
  //         deleteFlag: 0,
  //       });

  //       await doc.save();
  //       return doc;
  //     }

  //     // STOP any running timer for this user
  //     const runningTimer = await TaskLogTime.findOne({
  //       userId: performedBy,
  //       running: true,
  //       deleteFlag: 0,
  //     });

  //     if (runningTimer) {
  //       const oldSnap = snapshot(runningTimer);
  //       const lastIdx = runningTimer.intervals.length - 1;
  //       if (lastIdx >= 0 && !runningTimer.intervals[lastIdx].to) {
  //         runningTimer.intervals[lastIdx].to = now;
  //         runningTimer.intervals[lastIdx].duration = Math.max(
  //           0,
  //           Math.floor((now - runningTimer.intervals[lastIdx].from) / 1000)
  //         );
  //       }
  //       runningTimer.totalDuration = recalcTotal(runningTimer.intervals);
  //       runningTimer.running = false;
  //       runningTimer.lastStartedAt = null;
  //       runningTimer.stoppedAt = now;
  //       runningTimer.editedCount = (runningTimer.editedCount || 0) + 1;
  //       runningTimer.actions = runningTimer.actions || [];
  //       runningTimer.actions.push({
  //         status: "EDITED",
  //         oldValue: oldSnap,
  //         newValue: snapshot(runningTimer),
  //         by: performedBy,
  //         reason: "Auto-stopped previous running timer",
  //       });
  //       await runningTimer.save();
  //     }

  //     // If caller wanted to explicitly stop, return stopped timer
  //     if (explicitAction === "OUT" || explicitAction === "POSOUT") {
  //       return runningTimer || "NA";
  //     }

  //     // START new timer (IN or POSIN or default)
  //     const docPayload = {
  //       projectId: payload.projectId,
  //       taskListId: payload.taskListId,
  //       taskId: payload.taskId,
  //       userId: performedBy,
  //       startedAt: now,
  //       lastStartedAt: now,
  //       stoppedAt: null,
  //       running: true,
  //       intervals: [{ from: now, to: null, duration: 0 }],
  //       totalDuration: 0,
  //       description: payload.description || "",
  //       billable:
  //         typeof payload.billable !== "undefined" ? !!payload.billable : false,
  //       hourlyRate:
  //         typeof payload.hourlyRate !== "undefined" ? payload.hourlyRate : 0,
  //       tags: Array.isArray(payload.tags) ? payload.tags : [],
  //       attachments: Array.isArray(payload.attachments)
  //         ? payload.attachments
  //         : [],
  //       status: "CREATED",
  //       actions: [
  //         {
  //           status: "CREATED",
  //           oldValue: null,
  //           newValue: null,
  //           by: performedBy,
  //           reason:
  //             explicitAction === "POSIN" ? "Resume (POSIN)" : "Timer started",
  //         },
  //       ],
  //       activeFlag: 1,
  //       deleteFlag: 0,
  //     };

  //     const TaskLogTimeDetails = await TaskLogTime.create(docPayload);
  //     if (TaskLogTimeDetails) {
  //       return TaskLogTimeDetails;
  //     } else {
  //       return "NA";
  //     }
  //   } catch (error) {
  //     console.error("Error in createTaskLogTimer:", error);
  //     throw new Error(error.message);
  //   }
  // },

  async getTaskTimeLogDetails(SITE_DB_NAME, taskTimeLogId) {
    const TaskLogTime = await TaskLogTimeModel(SITE_DB_NAME);
    try {
      const agg = await TaskLogTime.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(taskTimeLogId),
            deleteFlag: 0,
          },
        },

        // user
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

        // project
        {
          $lookup: {
            from: "projects",
            localField: "projectId",
            foreignField: "_id",
            as: "project",
          },
        },
        { $unwind: { path: "$project", preserveNullAndEmptyArrays: true } },

        // task
        {
          $lookup: {
            from: "projecttasks",
            localField: "taskId",
            foreignField: "_id",
            as: "task",
          },
        },
        { $unwind: { path: "$task", preserveNullAndEmptyArrays: true } },

        // task list
        {
          $lookup: {
            from: "projecttasklists",
            localField: "taskListId",
            foreignField: "_id",
            as: "taskList",
          },
        },
        { $unwind: { path: "$taskList", preserveNullAndEmptyArrays: true } },

        // tags lookup
        {
          $lookup: {
            from: "tags",
            localField: "tags",
            foreignField: "_id",
            as: "tags",
          },
        },

        // final shape
        {
          $project: {
            _id: 1,
            projectId: 1,
            taskListId: 1,
            taskId: 1,
            userId: 1,

            description: 1,
            intervals: 1,
            totalDuration: 1,
            startedAt: 1,
            stoppedAt: 1,
            lastStartedAt: 1,
            running: 1,

            billable: 1,
            hourlyRate: 1,
            status: 1,
            invoiced: 1,
            locked: 1,
            createdAt: 1,

            user: {
              _id: "$user._id",
              name: "$user.name",
              image: "$user.image",
              roleName: "$user.roleName",
              designation: "$user.designation",
              companyName: "$user.companyName",
            },

            project: {
              _id: "$project._id",
              name: "$project.name",
              logo: "$project.logo",
            },

            task: {
              _id: "$task._id",
              name: "$task.name",
              taskNumber: "$task.taskNumber",
            },

            taskList: {
              _id: "$taskList._id",
              name: "$taskList.name",
            },

            // pass the tags array coming from $lookup
            tags: "$tags",
          },
        },
      ]);

      if (!agg || agg.length === 0) return "NA";
      // return single object (not array)
      return agg[0];
    } catch (error) {
      console.error("Error in getTaskTimeLogDetails:", error);
      throw new Error(error.message);
    }
  },

  //================================================Notification get all user ============================================================

  // async getNotificationUsersAll(roleNameCurrent, unitIdsCurrent, roleIds, unitIds, deleteFlag) {
  //   let matchStage = null;
  //   let role = null;

  //   if (roleNameCurrent == "Super-Admin") {
  //     matchStage = roleIds.includes("all")
  //       ? { deleteFlag: deleteFlag || 0, roleName: { $nin: ["Super-Admin"] } }
  //       : { deleteFlag: deleteFlag || 0, roleName: { $nin: ["Super-Admin"] }, roleId: { $in: roleIds.map((id) => new mongoose.Types.ObjectId(id)) } };
  //     unitIds.includes("all") ? null : (matchStage.unitId = { $in: unitIds.map((id) => new mongoose.Types.ObjectId(id)) });
  //   } else if (roleNameCurrent == "Admin") {
  //     matchStage = roleIds.includes("all")
  //       ? { deleteFlag: deleteFlag || 0, roleName: { $nin: ["Super-Admin", "Admin"] } }
  //       : {
  //           deleteFlag: deleteFlag || 0,
  //           roleName: { $nin: ["Super-Admin", "Admin", "HR-Manager", "Manager"] },
  //           roleId: { $in: roleIds.map((id) => new mongoose.Types.ObjectId(id)) },
  //         };
  //     unitIds.includes("all") ? (matchStage.unitId = { $in: unitIdsCurrent }) : (matchStage.unitId = { $in: unitIds.map((id) => new mongoose.Types.ObjectId(id)) });
  //   } else if (roleNameCurrent == "HR-Manager") {
  //     matchStage = roleIds.includes("all")
  //       ? { deleteFlag: deleteFlag || 0, roleName: { $nin: ["Super-Admin", "Admin", "HR-Manager"] } }
  //       : {
  //           deleteFlag: deleteFlag || 0,
  //           roleName: { $nin: ["Super-Admin", "Admin", "HR-Manager", "Manager"] },
  //           roleId: { $in: roleIds.map((id) => new mongoose.Types.ObjectId(id)) },
  //         };
  //     unitIds.includes("all") ? (matchStage.unitId = { $in: unitIdsCurrent }) : (matchStage.unitId = { $in: unitIds.map((id) => new mongoose.Types.ObjectId(id)) });
  //   } else if (roleNameCurrent == "Manager") {
  //     matchStage = roleIds.includes("all")
  //       ? { deleteFlag: deleteFlag || 0, roleName: { $nin: ["Super-Admin", "Admin", "HR-Manager", "Manager"] } }
  //       : {
  //           deleteFlag: deleteFlag || 0,
  //           roleName: { $nin: ["Super-Admin", "Admin", "HR-Manager", "Manager"] },
  //           roleId: { $in: roleIds.map((id) => new mongoose.Types.ObjectId(id)) },
  //         };
  //     unitIds.includes("all") ? (matchStage.unitId = { $in: unitIdsCurrent }) : (matchStage.unitId = { $in: unitIds.map((id) => new mongoose.Types.ObjectId(id)) });
  //   } else {
  //     matchStage = roleIds.includes("all")
  //       ? { deleteFlag: deleteFlag || 0, roleName: { $nin: ["Super-Admin", "Admin", "HR-Manager", "Manager"] } }
  //       : {
  //           deleteFlag: deleteFlag || 0,
  //           roleName: { $nin: ["Super-Admin", "Admin", "HR-Manager", "Manager"] },
  //           roleId: { $in: roleIds.map((id) => new mongoose.Types.ObjectId(id)) },
  //         };
  //     unitIds.includes("all") ? (matchStage.unitId = { $in: unitIdsCurrent }) : (matchStage.unitId = { $in: unitIds.map((id) => new mongoose.Types.ObjectId(id)) });
  //   }
  //   try {
  //     const user = await User.aggregate([
  //       {
  //         $match: matchStage,
  //       },

  //       {
  //         $addFields: {
  //           userId: "$_id",
  //           paidLeaveCount: 0,
  //           maternityLeaveCount: 0,
  //           paternityLeaveCount: 0,
  //           formattedCreatedAt: {
  //             $dateToString: {
  //               format: "%d-%m-%Y %H:%M",
  //               date: "$createdAt",
  //               timezone: TIME_ZONE,
  //             },
  //           },
  //           formattedlastLoginTime: {
  //             $dateToString: {
  //               format: "%d-%m-%Y %H:%M",
  //               date: "$lastLoginTime",
  //               timezone: TIME_ZONE,
  //             },
  //           },
  //           formattedJoiningDate: {
  //             $cond: {
  //               if: { $eq: [{ $type: "$joiningDate" }, "date"] },
  //               then: {
  //                 $dateToString: {
  //                   format: "%d-%m-%Y",
  //                   date: "$joiningDate",
  //                   timezone: TIME_ZONE,
  //                 },
  //               },
  //               else: "$joiningDate",
  //             },
  //           },
  //           formattedDob: {
  //             $cond: {
  //               if: { $eq: [{ $type: "$dob" }, "date"] },
  //               then: {
  //                 $dateToString: {
  //                   format: "%d-%m-%Y",
  //                   date: "$dob",
  //                   timezone: TIME_ZONE,
  //                 },
  //               },
  //               else: "$dob",
  //             },
  //           },
  //           formattedOriginalDob: {
  //             $cond: {
  //               if: { $eq: [{ $type: "$originalDob" }, "date"] },
  //               then: {
  //                 $dateToString: {
  //                   format: "%d-%m-%Y",
  //                   date: "$originalDob",
  //                   timezone: TIME_ZONE,
  //                 },
  //               },
  //               else: "$originalDob",
  //             },
  //           },
  //         },
  //       },

  //       { $sort: { createdAt: -1 } },
  //       {
  //         $project: {
  //           _id: 1,
  //           userId: 1,
  //           companyId: 1,
  //           unitId: 1,
  //           roleId: 1,
  //           departmentId: 1,
  //           designationName: 1,
  //           reportingManagerId: 1,
  //           registeredById: 1,
  //           approvedById: 1,
  //           teamId: 1,
  //           shiftId: 1,
  //           roleName: 1,

  //           name: 1,
  //           uniqueId: 1,
  //           empId: 1,
  //           email: 1,

  //           joiningDate: 1,

  //           languageId: 1,
  //           profileComplete: 1,
  //           relievingDate: 1,
  //           relievingStatus: 1,
  //           approveFlag: 1,
  //           activeFlag: 1,
  //           deleteFlag: 1,
  //           deleteReason: 1,
  //           loginType: 1,
  //           loginTypeFirst: 1,
  //           notificationStatus: 1,
  //           createdAt: 1,
  //           updatedAt: 1,
  //           lastLoginTime: 1,
  //           formattedlastLoginTime: 1,
  //           formattedCreatedAt: 1,
  //           formattedDob: 1,
  //           formattedOriginalDob: 1,
  //           formattedJoiningDate: 1,
  //           paidLeaveCount: 1,
  //           maternityLeaveCount: 1,
  //           paternityLeaveCount: 1,
  //         },
  //       },
  //     ]);

  //     if (user && user.length > 0) {
  //       return user;
  //     } else {
  //       return "NA";
  //     }
  //   } catch (error) {
  //     console.log("database error from commen service user details", error.message);
  //     throw new Error(error.message);
  //   }
  // },
};
