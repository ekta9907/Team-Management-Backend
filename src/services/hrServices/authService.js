const User = require("../../models/workspaceModels/userModel");
const UserForgotPassword = require("../../models/workspaceModels/userForgotPasswordModel");
const moment = require("moment");
const crypto = require("crypto");
const UserNotification = require("../../models/workspaceModels/userNotificationModel");

module.exports = {
  // ================================= check user email ====
  async checkUserUniqueId(data) {
    try {
      const { uniqueId } = data;
      const user = await User.findOne({ uniqueId: uniqueId, deleteFlag: 0 }); // 20 seconds timeout
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
  async checkUserEmail(data) {
    try {
      const { email } = data;
      const user = await User.findOne({ email: email.toLowerCase(), deleteFlag: 0 }); // 20 seconds timeout
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
  async checkOtherUserEmail(userId, email) {
    try {
      const user = await User.findOne({ _id: { $ne: userId }, email: email.toLowerCase(), deleteFlag: 0 }); // 20 seconds timeout
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
  async updateProfile(email, name, mobileNumber, userId, image) {
    try {
      const updateStatus = await User.updateOne({ _id: userId }, { $set: { email: email.toLowerCase(), mobileNumber: mobileNumber, image: image, name: name } }, { upsert: false });
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
      const updateStatus = await User.updateOne(
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
      const updateStatus = await User.updateOne(
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
  async updateUserPassword(showPassword, password, userId) {
    try {
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
  async updatePasswordLink(forgotId) {
    try {
      const updateStatus = await UserForgotPassword.updateOne({ _id: forgotId }, { $set: { activeFlag: 0 } }, { upsert: false });
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

  async forgotPassword(email, checkUser, expireTime, otp, forgotPassIdentity) {
    const userId = checkUser._id;
    const roleName = checkUser.roleName;
    const mobileNumber = checkUser.mobileNumber;
    const expireIn = expireTime;
    try {
      const createStatus = await UserForgotPassword.create({
        userId: userId,
        mobileNumber: mobileNumber,
        email: email.toLowerCase(),
        otp: otp,
        roleName: roleName,
        forgotPassIdentity: forgotPassIdentity,
        expireIn: expireIn,
      });
      if (createStatus) {
        return createStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from commen service updateUserPassword", error.message);
      throw new Error(error.message);
    }
  },
  async checkUserForgotId(forgotId) {
    try {
      const userForgot = await UserForgotPassword.findOne({ _id: forgotId, deleteFlag: 0 }); // 20 seconds timeout
      if (userForgot) {
        return userForgot;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("test", error.message);
      throw new Error(error.message);
    }
  },
};
