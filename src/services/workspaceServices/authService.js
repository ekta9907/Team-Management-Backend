const UserModel = require("../../models/workspaceModels/userModel");
const BuySubscriptionModel = require("../../models/workspaceModels/buySubscriptionPlanModel");
const DesignationModel = require("../../models/workspaceModels/designationModel");
const RoleModel = require("../../models/workspaceModels/roleModel");
const TagsModel = require("../../models/workspaceModels/tagsModel");
const CompanyModel = require("../../models/workspaceModels/companyModel");
const WeekDayModel = require("../../models/workspaceModels/weekDayModel");
const UserForgotPasswordModel = require("../../models/workspaceModels/userForgotPasswordModel");
const UserNotification = require("../../models/workspaceModels/userNotificationModel");

module.exports = {
  // ================================= check user email ====
  async checkCompanyNumber(SITE_DB_NAME) {
    try {
      const Company = await CompanyModel(SITE_DB_NAME);
      const lastCompany = await Company.findOne({
        deleteFlag: 0,
      })
        .sort({ createdAt: -1 })
        .lean();
      if (lastCompany && lastCompany.companyNumber) {
        const lastNumber = parseInt(lastCompany.companyNumber.split("-")[1]);
        const newNumber = lastNumber + 1;
        const paddedNumber = String(newNumber).padStart(3, "0");
        return `CMP-${paddedNumber}`;
      }
      return "CMP-001";
    } catch (error) {
      console.error("Error in checkCompanyNumber me :", error);
      throw new Error(error.message);
    }
  },
  async checkInvoiceLastNumber(SITE_DB_NAME) {
    try {
      const BuySubscription = await BuySubscriptionModel(SITE_DB_NAME);
      const lastBuySubscription = await BuySubscription.findOne({
        deleteFlag: 0,
      })
        .sort({ createdAt: -1 })
        .lean();
      if (lastBuySubscription && lastBuySubscription.invoiceNumber) {
        const lastNumber = parseInt(lastBuySubscription.invoiceNumber.split("-")[1]);
        const newNumber = lastNumber + 1;
        const paddedNumber = String(newNumber).padStart(3, "0");
        return `INV-${paddedNumber}`;
      }
      return "INV-001";
    } catch (error) {
      console.error("Error in checkInvoiceLastNumber me :", error);
      throw new Error(error.message);
    }
  },
  async createUser(SITE_DB_NAME, userData) {
    try {
      const User = await UserModel(SITE_DB_NAME);
      const createUser = await User.create(userData);
      if (createUser) {
        return createUser;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("createUser", error.message);
      throw new Error(error.message);
    }
  },
  async buySubscription(SITE_DB_NAME, subscriptionData) {
    try {
      const BuySubscription = await BuySubscriptionModel(SITE_DB_NAME);
      const buySubscription = await BuySubscription.create(subscriptionData);
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
  async createDesignation(SITE_DB_NAME, data) {
    try {
      const Designation = await DesignationModel(SITE_DB_NAME);
      const createDesignation = await Designation.create(data);
      if (createDesignation) {
        return createDesignation;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("createDesignation", error.message);
      throw new Error(error.message);
    }
  },
  async createRole(SITE_DB_NAME, data) {
    try {
      const Role = await RoleModel(SITE_DB_NAME);
      const createRole = await Role.create(data);
      if (createRole) {
        return createRole;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("createRole", error.message);
      throw new Error(error.message);
    }
  },

  async createTag(SITE_DB_NAME, data) {
    try {
      const Tag = await TagsModel(SITE_DB_NAME);
      const createTag = await Tag.create(data);
      if (createTag) {
        return createTag;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("createTag", error.message);
      throw new Error(error.message);
    }
  },
  async createCompany(SITE_DB_NAME, data) {
    const Company = await CompanyModel(SITE_DB_NAME);
    const companyData = await Company.create(data);
    if (companyData) {
      return companyData;
    } else {
      return "NA";
    }
  },
  async createWeekDays(SITE_DB_NAME) {
    try {
      const WeekDay = await WeekDayModel(SITE_DB_NAME);
      const weekDays = [
        { weekDayName: "Monday", deleteFlag: 0, activeFlag: 1 },
        { weekDayName: "Tuesday", deleteFlag: 0, activeFlag: 1 },
        { weekDayName: "Wednesday", deleteFlag: 0, activeFlag: 1 },
        { weekDayName: "Thursday", deleteFlag: 0, activeFlag: 1 },
        { weekDayName: "Friday", deleteFlag: 0, activeFlag: 1 },
        { weekDayName: "Saturday", deleteFlag: 0, activeFlag: 1 },
        { weekDayName: "Sunday", deleteFlag: 0, activeFlag: 1 },
      ];

      const inserted = await WeekDay.insertMany(weekDays);
      return inserted;
    } catch (error) {
      console.error("❌ Error inserting weekdays:", error.message);
      throw new Error("Weekday insertion failed!" + error.message);
    }
  },

  async checkEmail(SITE_DB_NAME, email) {
    try {
      const User = await UserModel(SITE_DB_NAME);
      const check = await User.findOne({
        email: email.toLowerCase(),
        deleteFlag: 0,
        profileComplete: 1,
      });
      if (check) {
        return check;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("checkEmail", error.message);
      throw new Error(error.message);
    }
  },
  async checkEmailAndSocialId(SITE_DB_NAME, email, socialId) {
    try {
      const User = await UserModel(SITE_DB_NAME);
      const check = await User.findOne({
        email: email.toLowerCase(),
        socialId: socialId,
        deleteFlag: 0,
        profileComplete: 1,
      });
      if (check) {
        return check;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("checkEmail", error.message);
      throw new Error(error.message);
    }
  },

  async checkOtherUserEmail(userId, email) {
    try {
      const User = await UserModel(SITE_DB_NAME);
      const user = await User.findOne({
        _id: { $ne: userId },
        email: email.toLowerCase(),
        deleteFlag: 0,
      }); // 20 seconds timeout
      if (user) {
        return user;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("test", error.message);
      throw new Error(error.message);
    }
  },
  // ====================================== forgot ====================================
  async forgotPassword(SITE_DB_NAME, data) {
    try {
      const UserForgotPassword = await UserForgotPasswordModel(SITE_DB_NAME);
      const createStatus = await UserForgotPassword.create(data);
      if (createStatus) {
        return createStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from commen service forgotPassword", error.message);
      throw new Error(error.message);
    }
  },
  async updateUser(SITE_DB_NAME, userId, updateUserData) {
    try {
      const User = await UserModel(SITE_DB_NAME);
      const updateStatus = await User.updateOne(
        { _id: userId },
        {
          $set: updateUserData,
        },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from commen service user updateUser", error.message);
      throw new Error(error.message);
    }
  },
  async updateProfile(email, name, mobileNumber, userId, image) {
    try {
      const updateStatus = await User(SITE_DB_NAME).updateOne(
        { _id: userId },
        {
          $set: {
            email: email.toLowerCase(),
            mobileNumber: mobileNumber,
            image: image,
            name: name,
          },
        },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from commen service user updateUserProfile", error.message);
      throw new Error(error.message);
    }
  },
  async updateUserProfile(
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
  ) {
    try {
      const updateStatus = await User(SITE_DB_NAME).updateOne(
        { _id: userId },
        {
          $set: {
            personalEmail: personalEmail.toLowerCase(),
            address: address,
            bloodGroup: bloodGroup,
            city: city,
            dob: dob,
            emergencyContactNumber: emergencyContactNumber,
            fatherName: fatherName,
            firstName: firstName,
            gender: gender,
            lastName: lastName,
            maritalStatus: maritalStatus,
            mobileNumber: mobileNumber,
            motherName: motherName,
            name: name,
            originalDob: originalDob,
            pAddress: pAddress,
            pCity: pCity,
            pPincode: pPincode,
            pState: pState,
            physicallyChallenged: physicallyChallenged,
            pincode: pincode,
            spouseName: spouseName,
            state: state,
            addressProof: addressProof,
            image: image,
          },
        },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from commen service user updateUserProfile", error.message);
      throw new Error(error.message);
    }
  },
  async updateProfileImage(userId, image) {
    try {
      const updateStatus = await User(SITE_DB_NAME).updateOne(
        { _id: userId },
        {
          $set: {
            image: image,
          },
        },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from commen service user updateProfileimage", error.message);
      throw new Error(error.message);
    }
  },
  async updatePlayerId(userId, playerId) {
    try {
      const updateStatus = await UserNotification.updateOne(
        { userId: userId },
        {
          $set: {
            playerId: playerId,
          },
        },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from commen service user updatePlayerId", error.message);
      throw new Error(error.message);
    }
  },

  async checkUserForgotId(SITE_DB_NAME, forgotId) {
    try {
      const UserForgotPassword = await UserForgotPasswordModel(SITE_DB_NAME);
      const userForgot = await UserForgotPassword.findOne({
        _id: forgotId,
        deleteFlag: 0,
      }); // 20 seconds timeout
      if (userForgot) {
        return userForgot;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("test", error.message);
      throw new Error(error.message);
    }
  },
  async checkOTP(SITE_DB_NAME, forgotId, otp) {
    try {
      const UserForgotPassword = await UserForgotPasswordModel(SITE_DB_NAME);
      const userForgot = await UserForgotPassword.findOne({
        _id: forgotId,
        otp: otp,
        otpVerify: 0,
        deleteFlag: 0,
      }); // 20 seconds timeout
      if (userForgot) {
        return userForgot;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("test", error.message);
      throw new Error(error.message);
    }
  },
  async updateForgotOTPVerify(SITE_DB_NAME, forgotId, data) {
    try {
      const UserForgotPassword = await UserForgotPasswordModel(SITE_DB_NAME);
      const updateStatus = await UserForgotPassword.updateOne({ _id: forgotId }, { $set: data });
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from commen service updateForgotOTPVerify", error.message);
      throw new Error(error.message);
    }
  },
  async updateUserPassword(SITE_DB_NAME, showPassword, password, userId) {
    try {
      const User = await UserModel(SITE_DB_NAME);
      const updateStatus = await User.updateOne({ _id: userId }, { $set: { showPassword, password: password } }, { upsert: false });
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from commen service updateUserPassword", error.message);
      throw new Error(error.message);
    }
  },
  async checkUserId(SITE_DB_NAME, userId) {
    try {
      const User = await UserModel(SITE_DB_NAME);
      const user = await User.findOne({
        _id: userId,
        deleteFlag: 0,
      });
      if (user) {
        return user;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("checkUserId", error.message);
      throw new Error(error.message);
    }
  },
  async checkUserUniqueId(SITE_DB_NAME, uniqueId) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const checkUser = await User.findOne({
        uniqueId: uniqueId,
        deleteFlag: 0,
      });
      if (checkUser) {
        return checkUser;
      } else {
        return "NA";
      }
    } catch (error) {
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
      throw new Error(error.message);
    }
  },
  async updateUser2FASecret(SITE_DB_NAME, userId, data) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      // Build update object dynamically
      const update = {};
      if (data.secret !== undefined) update["twoFactorAuth.secret"] = data.secret;
      if (data.tempSecret !== undefined) update["twoFactorAuth.tempSecret"] = data.tempSecret;
      const updateData = await User.findByIdAndUpdate(userId, { $set: update }, { new: true });
      return true;
    } catch (error) {
      console.error("Error updating 2FA secret:", error);
      throw error;
    }
  },
  async updateUser2FAExpiresAt(SITE_DB_NAME, userId, tempSecretExpiresAt) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      // Build update object dynamically
      const update = {};
      update["twoFactorAuth.tempSecretExpiresAt"] = tempSecretExpiresAt;
      const updateData = await User.findByIdAndUpdate(userId, { $set: update }, { new: true });
      return true;
    } catch (error) {
      console.error("Error updating 2FA tempSecretExpiresAt:", error);
      throw error;
    }
  },
  //================auth-service===============
};
