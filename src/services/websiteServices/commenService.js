const mongoose = require("mongoose");
const categoryModel = require("../../models/superAdminModels/categoryModel");
const industryModel = require("../../models/superAdminModels/industryModel");
const roleDesinationModel = require("../../models/superAdminModels/designationModel");
const countryModel = require("../../models/superAdminModels/countryModel");
const featureModel = require("../../models/superAdminModels/featureModel");
const subFeatureModel = require("../../models/superAdminModels/subFeatureModel");
const SubscriptionPlanModel = require("../../models/superAdminModels/subscriptionPlanModel");
const employeeRangeModel = require("../../models/superAdminModels/employeeRangeModel");
const contentModel = require("../../models/superAdminModels/contentModel");
const faqModel = require("../../models/superAdminModels/faqModel");
const userModel = require("../../models/superAdminModels/userModel");
const workspaceModel = require("../../models/superAdminModels/workspaceModel");
const AccessPermission = require("../../models/superAdminModels/accessPermissionModel");
const AccessPreference = require("../../models/superAdminModels/accessPreferenceModel");

module.exports = {
  //===========================workspace
  async getWorkspaceDetails(workspaceId) {
    try {
      const existing = await workspaceModel
        .findOne({
          _id: workspaceId,
          deleteFlag: 0,
        })
        .populate("countryId");
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getWorkspaceDetails:", error);
      throw error;
    }
  },

  async getInDashWorkspaceDetails(workspaceId) {
    try {
      const existing = await workspaceModel
        .findOne({
          _id: workspaceId,
          deleteFlag: 0,
        })
        .populate("countryId")
        .select("-dbName -dbUserName -dbPassword -dbHost");
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getInDashWorkspaceDetails:", error);
      throw error;
    }
  },

  async checkWorkspace(workspaceId) {
    try {
      const existing = await workspaceModel
        .findOne({
          _id: new mongoose.Types.ObjectId(workspaceId),
          deleteFlag: 0,
        }).populate("countryId");
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkWorkspace:", error);
      throw error;
    }
  },
  // =========category-industry-services===========
  async getCategoryIndustryService(deleteFlag) {
    try {
      const categoryIndustry = categoryModel.find(
        { deleteFlag: deleteFlag },
        "_id name"
      );
      if (categoryIndustry) {
        return categoryIndustry;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getCategoryIndustryService:", error);
      throw error;
    }
  },

  // =========industry-services===========
  async getIndustryService(deleteFlag) {
    try {
      const categories = await categoryModel.find({ deleteFlag: 0 });
      const industries = await industryModel
        .find({ deleteFlag: deleteFlag })
        .select("_id industryName categoryId");

      const grouped = categories.map((category) => {
        const related = industries
          .filter((i) => i.categoryId.toString() === category._id.toString())
          .map((i) => ({ _id: i._id, name: i.industryName }));

        return {
          categoryName: category.name,
          industries: related,
        };
      });
      if (grouped) {
        return grouped;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getIndustryService:", error);
      throw error;
    }
  },

  // =========role-desination-services===========
  async getRoleDesinationService(deleteFlag) {
    try {
      const roleDesination = await roleDesinationModel.find(
        { deleteFlag: deleteFlag },
        "_id name"
      );
      if (roleDesination) {
        return roleDesination;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getRoleDesinationService:", error);
      throw error;
    }
  },

  // =========feature-services===========
  async getFeatureService(deleteFlag) {
    try {
      const features = await featureModel.find({ deleteFlag: deleteFlag });

      if (features) {
        return features;
      } else {
        return [];
      }
    } catch (error) {
      console.log(
        "database error from admin service getFeatureService",
        error.message
      );
      throw new Error(error.message);
    }
  },

  // =========sub-feature-services===========
  async getSubFeatureService(deleteFlag) {
    try {
      const subFeature = await subFeatureModel.find(
        { deleteFlag: deleteFlag },
        "_id name keyName valueType activeFlag deleteFlag"
      );
      if (subFeature) {
        return subFeature;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getSubFeatureService:", error);
      throw error;
    }
  },

  // =========subscription-plan-services===========\
  async getSubscriptionPlanService() {
    try {
      const plans = await SubscriptionPlanModel.find({
        deleteFlag: 0,
        activeFlag: 1,
        showFlag: 1,
      })
        .populate("featureIds", "name keyName")
        .populate("subFeatures.subFeatureId", "name keyName valueType")
        .sort({ by_index: 1 })
        .lean({ virtuals: true });

      const formatted = plans.map((plan) => ({
        _id: plan._id,
        title: plan.title,
        url: plan.url,
        planCategory: plan.planCategory,
        businessType: plan.businessType,
        durationInDays: plan.durationInDays,
        description: plan.description,
        shortDescription: plan.shortDescription,
        price: plan.price,
        currency: plan.currency,
        showFlag: plan.showFlag,
        by_index: plan.by_index,
        most_popular: plan.most_popular,
        discountPercentage: plan.discountPercentage,
        discountStartDate: plan.discountStartDate,
        discountEndDate: plan.discountEndDate,
        afterDiscountPrice: plan.afterDiscountPrice,
        users: plan.users,
        projects: plan.projects,
        features: plan.featureIds.map((f) => ({
          _id: f._id,
          name: f.name,
          keyName: f.keyName,
        })),
        subFeatures: plan.subFeatures.map((sf) => ({
          _id: sf.subFeatureId?._id,
          name: sf.subFeatureId?.name,
          keyName: sf.subFeatureId?.keyName,
          valueType: sf.subFeatureId?.valueType,
          value: sf.value,
        })),
      }));

      if (formatted) {
        return formatted;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in getRoleDesinationService:", error);
      throw error;
    }
  },

  async getSubscriptionPlanByPlanCategoryService(planCategory) {
    try {
      const plans = await SubscriptionPlanModel.find({
        deleteFlag: 0,
        activeFlag: 1,
        showFlag: 1,
        planCategory: planCategory,
      })
        .populate("featureIds", "name keyName")
        .populate("subFeatures.subFeatureId", "name keyName valueType");

      if (plans) {
        return plans;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error(
        "Error in getSubscriptionPlanByPlanCategoryService:",
        error
      );
      throw error;
    }
  },

  async getPlanFeatureSubFeatureListService(deleteFlag, planCategory) {
    try {
      // Step 1: Get filtered plans based on planCategory
      const plans = await SubscriptionPlanModel.find({
        deleteFlag: Number(deleteFlag),
        planCategory: planCategory, // ✅ Use planCategory filter here
      })
        .populate("subFeatures.subFeatureId")
        .lean();
      if (!plans?.length) return "NA";

      // Step 2: Get all features and sub-features
      const allFeatures = await featureModel.find({ deleteFlag: 0 }).lean();
      const allSubFeatures = await subFeatureModel
        .find({ deleteFlag: 0 })
        .lean();

      const featureMap = [];
      for (const feature of allFeatures) {
        const subFeatures = allSubFeatures.filter(
          (sf) => String(sf.featureId) === String(feature._id)
        );
        const groupedSubFeatures = subFeatures.map((subFeature) => {
          const planValue = plans.map((plan) => {
            const found = plan.subFeatures.find(
              (sf) =>
                sf.subFeatureId &&
                String(sf.subFeatureId._id || sf.subFeatureId) ===
                  String(subFeature._id)
            );
            return found ? found.value : null;
          });
          return {
            subFeatureId: subFeature._id,
            subFeatureName: subFeature.name,
            valueType: subFeature.valueType,
            planValue,
          };
        });
        featureMap.push({
          featureId: feature._id,
          featureName: feature.name,
          subFeatures: groupedSubFeatures,
        });
      }
      return featureMap;
    } catch (error) {
      console.error("Service error:", error);
      throw error;
    }
  },

  // =========employee-range-services===========
  async getEmployeeRangeService(deleteFlag) {
    try {
      const employeeRange = await employeeRangeModel.find({ deleteFlag });

      if (employeeRange?.length) {
        const formatted = employeeRange.map((range) => ({
          _id: range._id,
          employeeRange: `${range.start} - ${range.end}`,
          activeFlag: range.activeFlag,
          deleteFlag: range.deleteFlag,
          createdAt: range.createdAt,
          updatedAt: range.updatedAt,
          __v: range.__v,
        }));
        return formatted;
      } else {
        return [];
      }
    } catch (error) {
      console.log("Error in getEmployeeRangeService", error.message);
      throw new Error(error.message);
    }
  },

  // =========faq-services===========
  async getFaqService(deleteFlag) {
    try {
      const faq = await faqModel.find({ deleteFlag: deleteFlag });

      if (faq) {
        return faq;
      } else {
        return [];
      }
    } catch (error) {
      console.log(
        "database error from admin service getFaqService",
        error.message
      );
      throw new Error(error.message);
    }
  },

  // =========content-services===========
  async getContentService(deleteFlag) {
    try {
      const content = await contentModel.find({ deleteFlag: deleteFlag });

      if (content) {
        return content;
      } else {
        return [];
      }
    } catch (error) {
      console.log(
        "database error from admin service getContentService",
        error.message
      );
      throw new Error(error.message);
    }
  },

  // =========check-email-company-services===========
  async checkEmailService(email) {
    try {
      const existing = await userModel.findOne({
        email,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkEmailService:", error);
      throw error;
    }
  },

  async checkCompanyService(companyName) {
    try {
      const existing = await workspaceModel.findOne({
        companyName,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkCompanyService:", error);
      throw error;
    }
  },

  async updateUserProfile(userId, data) {
    const updateStatus = await userModel.updateOne(
      { _id: userId },
      { $set: data },
      { upsert: false }
    );
    if (updateStatus) {
      return updateStatus;
    } else {
      return "NA";
    }
  },

  // =========roles-accesspermissions-services===========
  async getRolesAccesspermissionsService(deleteFlag) {
    try {
      const rolesAccesspermissions = await AccessPermission.find({
        deleteFlag: deleteFlag,
        roleName: { $nin: ["Site-Owner", "Super-Admin"] },
      });
      if (rolesAccesspermissions) {
        return rolesAccesspermissions;
      } else {
        return [];
      }
    } catch (error) {
      console.log(
        "database error from admin service getRolesAccesspermissionsService",
        error.message
      );
      throw new Error(error.message);
    }
  },

  // =========roles-accesspreferences-services===========
  async getRolesAccesspreferencesService(deleteFlag) {
    try {
      const rolesAccesspreferences = await AccessPreference.find({
        deleteFlag: deleteFlag,
      });
      const filteredpreferences = rolesAccesspreferences.filter(
        (item) => item.roleName !== "Site-Owner"
      );
      if (filteredpreferences) {
        return filteredpreferences;
      } else {
        return [];
      }
    } catch (error) {
      console.log(
        "database error from admin service getRolesAccesspreferencesService",
        error.message
      );
      throw new Error(error.message);
    }
  },

  // =========country-services===========
  async getCountries(deleteFlag) {
    try {
      const getCountries = await countryModel
        .find({
          deleteFlag: deleteFlag,
        })
        .sort({
          createdAt: -1,
        });
      if (getCountries) {
        return getCountries;
      } else {
        return [];
      }
    } catch (error) {
      console.log(
        "database error from admin service getCountries",
        error.message
      );
      throw new Error(error.message);
    }
  },

  async updateGeneralDetails(workspaceId, workspaceData) {
    const updateStatus = await workspaceModel.updateOne(
      { _id: workspaceId },
      { $set: workspaceData },
      { upsert: false }
    );
    if (updateStatus) {
      return updateStatus;
    } else {
      return "NA";
    }
  },

  // async updateGeneralField(workspaceId, workspaceData) {
  //   try {
  //     const updateStatus = await workspaceModel.updateOne(
  //       { _id: workspaceId },
  //       { $set: workspaceData },
  //       { upsert: false }
  //     );
  //     if (updateStatus) {
  //       return updateStatus;
  //     } else {
  //       return "NA";
  //     }
  //   } catch (error) {
  //     console.error("Error in updateCompanyField:", error);
  //     throw new Error(error.message);
  //   }
  // },

  async checkUpdatedWorkspaceDomain(workspaceId, workspaceDomain) {
    try {
      const existing = await workspaceModel.findOne({
        _id: { $ne: new mongoose.Types.ObjectId(workspaceId) },
        workspaceDomain,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkUpdatedWorkspaceDomain:", error);
      throw error;
    }
  },

  async checkWorkspaceService(workspaceDomain) {
    try {
      const existing = await workspaceModel.findOne({
        workspaceDomain: workspaceDomain,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in checkWorkspaceService:", error);
      throw error;
    }
  },

  async getWorkspaceInfoService(workspaceId) {
    try {
      const workspaceDetails = await workspaceModel.findOne(
        {
          _id: workspaceId,
          deleteFlag: 0,
        },
        {
          workspaceName: 1,
          workspaceLogo: 1,
          workspaceFavIcon: 1,
          checkName: 1,
          workspaceFullDomain: 1,
          workspaceUrl: 1,
        }
      );
      if (workspaceDetails) {
        return workspaceDetails;
      } else {
        return [];
      }
    } catch (error) {
      console.log(
        "database error from admin service getWorkspaceInfoService",
        error.message
      );
      throw new Error(error.message);
    }
  },
};
