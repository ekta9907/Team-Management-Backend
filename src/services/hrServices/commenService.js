const mongoose = require("mongoose");
const WeekDayModel = require("../../models/workspaceModels/weekDayModel");
const RoleModel = require("../../models/workspaceModels/roleModel");
const CompanyModel = require("../../models/workspaceModels/companyModel");
const CTCSPModel = require("../../models/workspaceModels/cTCStructurePercentageModel");
const UnitModel = require("../../models/workspaceModels/unitModel");
const ShiftModel = require("../../models/workspaceModels/shiftModel");
const DepartmentModel = require("../../models/workspaceModels/departmentModel");
const UserModel = require("../../models/workspaceModels/userModel");
const AttendanceModel = require("../../models/workspaceModels/attendanceModel");
const PermissionModel = require("../../models/superAdminModels/accessPermissionModel");
const LeaveModel = require("../../models/workspaceModels/leaveModel");
const RegularizationModel = require("../../models/workspaceModels/regularizationModel");
const ReimbursementModel = require("../../models/workspaceModels/reimbursementModel");
const CompoffModel = require("../../models/workspaceModels/compoffModel");
const PunchRecordModel = require("../../models/workspaceModels/punchRecordModel");
const HolidayModel = require("../../models/workspaceModels/holidayModel");
const HolidayTempModel = require("../../models/workspaceModels/holidayTempModel");
const EmployeeModel = require("../../models/workspaceModels/employeeModel");
const UserNotificationMessageModel = require("../../models/workspaceModels/userNotificationMessageModel");
const IncentivePolicyModel = require("../../models/workspaceModels/incentivePolicyModel");
const ShiftIncentivePolicyModel = require("../../models/workspaceModels/shiftIncentivePolicyModel");
const IncentiveModel = require("../../models/workspaceModels/incentiveModel");
const TeamModel = require("../../models/workspaceModels/teamModel");
const DeviceModel = require("../../models/workspaceModels/esslDeviceModel");
const ProccessModel = require("../../models/workspaceModels/proccessModel");
const MonthlyProccessModel = require("../../models/workspaceModels/monthlyProccessModel");
const UserShiftPaidLeavePolicyModel = require("../../models/workspaceModels/userShiftPolicyEveryMonthModel");
const CreditPaidLeaveModel = require("../../models/workspaceModels/creditPaidLeaveModel");

const moment = require("moment");
const { decryptData } = require("../../helpers/commenHelper");
require("moment-duration-format");

const shiftCache = {};

module.exports = {
  async getRoles(SITE_DB_NAME) {
    const Role = await RoleModel(SITE_DB_NAME);
    try {
      const getRoles = await Role.find({ deleteFlag: 0 });
      if (getRoles) {
        return getRoles;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin service getRoles", error.message);
      return error.message;
    }
  },

  async getCTCSPByState(SITE_DB_NAME, stateName = "madhya pradesh") {
    const CTCSP = await CTCSPModel(SITE_DB_NAME);
    const result = await CTCSP.findOne({
      "ptDeduction.stateName": stateName.toLowerCase(),
    });
    return result;
  },

  async getCTCSP(SITE_DB_NAME) {
    const CTCSP = await CTCSPModel(SITE_DB_NAME);
    try {
      const result = await CTCSP.findOne({
        deleteFlag: 0,
      });
      return result;
    } catch (error) {
      console.error("❌ Error storing punch records:", error);
      throw error;
    }
  },
  async getUnits(
    SITE_DB_NAME,
    roleName,
    unitIds,
    deleteFlag,
    pagination,
    search,
    companyId
  ) {
    let query = { _id: { $in: unitIds }, deleteFlag: deleteFlag };

    try {
      const Unit = await UnitModel(SITE_DB_NAME);

      const { pageSize, pageNumber } = pagination;
      const skip = (pageNumber - 1) * pageSize;

      if (search && search.trim() !== "") {
        const regex = new RegExp(search.trim(), "i"); // case-insensitive
        query.$or = [{ unitName: regex }];
      }

      if (companyId) {
        query.companyId = new mongoose.Types.ObjectId(companyId);
      }
      const units = await Unit.aggregate([
        {
          $match: query,
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
            companyDetails: { $ifNull: ["$companyDetails", "NA"] },
            companyName: {
              $cond: {
                if: { $ne: ["$companyDetails", "NA"] },
                then: "$companyDetails.companyName",
                else: "NA",
              },
            },
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
              },
            },
          },
        },
        // ...(search && search.trim() !== ""
        //   ? [
        //       {
        //         $match: {
        //           $or: [
        //             { unitName: { $regex: search, $options: "i" } },
        //             { unitEmail: { $regex: search, $options: "i" } },
        //             { unitAddress: { $regex: search, $options: "i" } },
        //             {
        //               "companyDetails.companyName": {
        //                 $regex: search,
        //                 $options: "i",
        //               },
        //             },
        //           ],
        //         },
        //       },
        //     ]
        //   : []),
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
        {
          $project: {
            _id: 1,
            unitName: 1,
            unitEmail: 1,
            companyId: 1,
            unitURL: 1,
            unitAddress: 1,
            latitude: 1,
            companyName: 1,
            longitude: 1,
            companyDetails: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            formattedCreatedAt: 1,
          },
        },
      ]);

      if (units && units.length > 0) {
        return units;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service units details",
        error.message
      );
      throw new Error(error.message);
    }
  },
  //================================== admin servicess
  //================================================Companies============================================================
  async getCompanies(SITE_DB_NAME) {
    const Company = await CompanyModel(SITE_DB_NAME);
    try {
      const getCompanies = await Company.find({ deleteFlag: 0 });
      if (getCompanies) {
        return getCompanies;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service getCompanies",
        error.message
      );
      return error.message;
    }
  },

  //================================================WeekDays============================================================
  async getWeekDays(SITE_DB_NAME) {
    const WeekDay = await WeekDayModel(SITE_DB_NAME);
    try {
      const getWeekDays = await WeekDay.find({ deleteFlag: 0 });
      if (getWeekDays) {
        return getWeekDays;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service getWeekDays",
        error.message
      );
      return error.message;
    }
  },
  //================================================units============================================================

  async addUnit(SITE_DB_NAME, data) {
    const Unit = await UnitModel(SITE_DB_NAME);
    try {
      const addStatus = await Unit.create(data);
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in addUnit:", error);
      throw new Error(error.message);
    }
  },
  async addUnitInUser(SITE_DB_NAME, unitId, creatorUserId, creatorRole) {
    try {
      const User = await UserModel(SITE_DB_NAME);

      let query = { deleteFlag: 0 };

      // 🟢 CASE 1: Site-Owner created the unit → only that Site-Owner gets the unit
      if (creatorRole === "Site-Owner") {
        query = {
          _id: new mongoose.Types.ObjectId(creatorUserId),
          deleteFlag: 0,
        };
      }

      // 🔵 CASE 2: Admin created the unit → Admin user + all Site-Owner users
      else if (creatorRole === "Admin") {
        query = {
          deleteFlag: 0,
          $or: [
            { _id: new mongoose.Types.ObjectId(creatorUserId) }, // Admin user
            { roleName: "Site-Owner" }, // All Site Owners
          ],
        };
      }

      const result = await User.updateMany(
        query,
        { $addToSet: { unitId: unitId } } // Prevent duplicate entries
      );

      return result;
    } catch (error) {
      console.error("❌ addUnitInUser error:", error.message);
      throw new Error(error.message);
    }
  },
  async checkUnit(SITE_DB_NAME, unitId) {
    try {
      const Unit = await UnitModel(SITE_DB_NAME);
      const unitStatus = await Unit.findOne({ _id: unitId, deleteFlag: 0 }); // 20 seconds timeout

      if (unitStatus) {
        return unitStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("unit find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkUnitView(SITE_DB_NAME, unitId) {
    try {
      const Unit = await UnitModel(SITE_DB_NAME);
      const unitStatus = await Unit.findOne({ _id: unitId }); // 20 seconds timeout

      if (unitStatus) {
        return unitStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("unit find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkUnitWithName(SITE_DB_NAME, unitId, unitName) {
    try {
      const Unit = await UnitModel(SITE_DB_NAME);
      const unitStatus = await Unit.findOne({
        _id: { $ne: unitId },
        unitName: unitName,
        deleteFlag: 0,
      }); // 20 seconds timeout
      if (unitStatus) {
        return unitStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("unit find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkUnitName(SITE_DB_NAME, unitName) {
    try {
      const Unit = await UnitModel(SITE_DB_NAME);
      const unitStatus = await Unit.findOne({
        unitName: unitName,
        deleteFlag: 0,
      }); // 20 seconds timeout

      if (unitStatus) {
        return unitStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("unit find db error", error.message);
      throw new Error(error.message);
    }
  },
  async editUnit(SITE_DB_NAME, unitId, data) {
    try {
      const Unit = await UnitModel(SITE_DB_NAME);
      const updateStatus = await Unit.updateOne(
        { _id: unitId },
        { $set: data },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin service editUnit", error.message);
      throw new Error(error.message);
    }
  },
  async activeDeactiveUnit(SITE_DB_NAME, unitId, activeFlag) {
    try {
      const Unit = await UnitModel(SITE_DB_NAME);
      const updateStatus = await Unit.updateOne(
        { _id: unitId },
        { $set: { activeFlag: activeFlag } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service activeDeactiveUnit",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async deleteUnit(SITE_DB_NAME, unitId) {
    try {
      const Unit = await UnitModel(SITE_DB_NAME);
      const updateStatus = await Unit.updateOne(
        { _id: unitId },
        { $set: { deleteFlag: 1 } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service deleteUnit",
        error.message
      );
      throw new Error(error.message);
    }
  },

  async getUnitOne(SITE_DB_NAME, unitId) {
    try {
      const Unit = await UnitModel(SITE_DB_NAME);
      const units = await Unit.aggregate([
        {
          $match: {
            _id: unitId,
          },
        },
        {
          $limit: 1,
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
            companyDetails: { $ifNull: ["$companyDetails", "NA"] },
            companyName: {
              $cond: {
                if: { $ne: ["$companyDetails", "NA"] },
                then: "$companyDetails.companyName",
                else: "NA",
              },
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
            unitName: 1,
            companyId: 1,
            companyName: 1,
            companyDetails: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            formattedCreatedAt: 1,
          },
        },
      ]);

      if (units && units.length > 0) {
        return units[0];
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin getUnitOne", error.message);
      throw new Error(error.message);
    }
  },

  //================================================department============================================================
  async getUnitDepartments(SITE_DB_NAME, deleteFlag) {
    try {
      const Department = await DepartmentModel(SITE_DB_NAME);
      const getDepartments = await Department.find({ deleteFlag: deleteFlag });

      if (getDepartments) {
        return getDepartments;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service getDepartments",
        error.message
      );
      return error.message;
    }
  },

  //================================================Shifts============================================================

  async addShift(
    SITE_DB_NAME,
    unitId,
    shiftName,
    startTime,
    endTime,
    totalWorkingDurationInDay,
    breakStartTime,
    breakEndTime,
    breakDuration,
    firstHalfDayStartTime,
    firstHalfDayEndTime,
    firstHalfDuration,
    secHalfDayStartTime,
    secHalfDayEndTime,
    secHalfDuration,
    halfDayShortLoginMin,
    religiousBreakMin,
    monthlyExtraFreeMin,
    weekWorkingDays,
    weekEnds,
    monthlyExtraWorkingDays,
    pfDeduction,
    esicDeduction,
    ptDeduction,
    otherAndTdsDeduction,
    shortLoginDeductions,
    joiningDatePaidLeaveDeductions,
    unPlannedLeaveExtraDeduction,
    plannedLeaveApplyBeforeDays,
    totalAnnualPaidLeave,
    eachMonthPaidLeave,
    paidLeaveDay,
    skipPaidLeaveMonth,
    afterTwoYearExtraPaidLeave,
    maternityLeave,
    paternityLeave,
    checkboxGroup,
    sickLeavePaidUnpaidStatus,
    leaveAmountCalMonthDaysStatus,
    carryForwordPaidLeaveStatus,
    initialThreeMonthPaidLeaveStatus,
    weekOnceLeaveUnplanned,
    shiftIsFixed
  ) {
    try {
      const Shift = await ShiftModel(SITE_DB_NAME);
      const addStatus = await Shift.create({
        unitId,
        shiftName,
        startTime,
        endTime,
        totalWorkingDurationInDay,
        breakStartTime,
        breakEndTime,
        breakDuration,
        firstHalfDayStartTime,
        firstHalfDayEndTime,
        firstHalfDuration,
        secHalfDayStartTime,
        secHalfDayEndTime,
        secHalfDuration,
        halfDayShortLoginMin,
        religiousBreakMin,
        monthlyExtraFreeMin,
        weekWorkingDays,
        weekEnds,
        monthlyExtraWorkingDays,
        pfDeduction,
        esicDeduction,
        ptDeduction,
        otherAndTdsDeduction,
        shortLoginDeductions,
        joiningDatePaidLeaveDeductions,
        unPlannedLeaveExtraDeduction,
        plannedLeaveApplyBeforeDays,
        totalAnnualPaidLeave,
        eachMonthPaidLeave,
        paidLeaveDay,
        skipPaidLeaveMonth,
        afterTwoYearExtraPaidLeave,
        maternityLeave,
        paternityLeave,
        checkboxGroup,
        sickLeavePaidUnpaidStatus,
        leaveAmountCalMonthDaysStatus,
        carryForwordPaidLeaveStatus,
        initialThreeMonthPaidLeaveStatus,
        weekOnceLeaveUnplanned,
        shiftIsFixed,
      });
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin service addUnit", error.message);
      throw new Error(error.message);
    }
  },
  async checkShift(SITE_DB_NAME, shiftId) {
    try {
      const Shift = await ShiftModel(SITE_DB_NAME);
      const shiftStatus = await Shift.findOne({ _id: shiftId, deleteFlag: 0 }); // 20 seconds timeout

      if (shiftStatus) {
        return shiftStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("unit find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkShiftOne(SITE_DB_NAME, shiftId) {
    try {
      const Shift = await ShiftModel(SITE_DB_NAME);
      const shiftStatus = await Shift.findOne({ _id: shiftId }); // 20 seconds timeout

      if (shiftStatus) {
        return shiftStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("unit find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkShiftWithName(SITE_DB_NAME, shiftId, shiftName) {
    try {
      const Shift = await ShiftModel(SITE_DB_NAME);
      const shiftStatus = await Shift.findOne({
        _id: { $ne: shiftId },
        shiftName: shiftName,
        deleteFlag: 0,
      }); // 20 seconds timeout
      if (shiftStatus) {
        return shiftStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("unit find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkShiftName(SITE_DB_NAME, shiftName) {
    try {
      const Shift = await ShiftModel(SITE_DB_NAME);
      const shiftStatus = await Shift.findOne({
        shiftName: shiftName,
        deleteFlag: 0,
      }); // 20 seconds timeout

      if (shiftStatus) {
        return shiftStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("unit find db error", error.message);
      throw new Error(error.message);
    }
  },
  async editShift(
    SITE_DB_NAME,
    shiftId,
    unitId,
    shiftName,
    startTime,
    endTime,
    totalWorkingDurationInDay,
    breakStartTime,
    breakEndTime,
    breakDuration,
    firstHalfDayStartTime,
    firstHalfDayEndTime,
    firstHalfDuration,
    secHalfDayStartTime,
    secHalfDayEndTime,
    secHalfDuration,
    halfDayShortLoginMin,
    religiousBreakMin,
    monthlyExtraFreeMin,
    weekWorkingDays,
    weekEnds,
    monthlyExtraWorkingDays,
    pfDeduction,
    esicDeduction,
    ptDeduction,
    otherAndTdsDeduction,
    shortLoginDeductions,
    joiningDatePaidLeaveDeductions,
    unPlannedLeaveExtraDeduction,
    plannedLeaveApplyBeforeDays,
    totalAnnualPaidLeave,
    eachMonthPaidLeave,
    paidLeaveDay,
    skipPaidLeaveMonth,
    afterTwoYearExtraPaidLeave,
    maternityLeave,
    paternityLeave,
    checkboxGroup,
    sickLeavePaidUnpaidStatus,
    leaveAmountCalMonthDaysStatus,
    carryForwordPaidLeaveStatus,
    initialThreeMonthPaidLeaveStatus,
    weekOnceLeaveUnplanned,
    shiftIsFixed
  ) {
    try {
      const Shift = await ShiftModel(SITE_DB_NAME);
      const updateStatus = await Shift.updateOne(
        { _id: shiftId },
        {
          $set: {
            unitId,
            shiftName,
            startTime,
            endTime,
            totalWorkingDurationInDay,
            breakStartTime,
            breakEndTime,
            breakDuration,
            firstHalfDayStartTime,
            firstHalfDayEndTime,
            firstHalfDuration,
            secHalfDayStartTime,
            secHalfDayEndTime,
            secHalfDuration,
            halfDayShortLoginMin,
            religiousBreakMin,
            monthlyExtraFreeMin,
            weekWorkingDays,
            weekEnds,
            monthlyExtraWorkingDays,
            pfDeduction,
            esicDeduction,
            ptDeduction,
            otherAndTdsDeduction,
            shortLoginDeductions,
            joiningDatePaidLeaveDeductions,
            unPlannedLeaveExtraDeduction,
            plannedLeaveApplyBeforeDays,
            totalAnnualPaidLeave,
            eachMonthPaidLeave,
            paidLeaveDay,
            skipPaidLeaveMonth,
            afterTwoYearExtraPaidLeave,
            maternityLeave,
            paternityLeave,
            checkboxGroup,
            sickLeavePaidUnpaidStatus,
            leaveAmountCalMonthDaysStatus,
            carryForwordPaidLeaveStatus,
            initialThreeMonthPaidLeaveStatus,
            weekOnceLeaveUnplanned,
            shiftIsFixed,
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
      console.log("database error from admin service editShift", error.message);
      throw new Error(error.message);
    }
  },
  async activeDeactiveShift(SITE_DB_NAME, shiftId, activeFlag) {
    try {
      const Shift = await ShiftModel(SITE_DB_NAME);
      const updateStatus = await Shift.updateOne(
        { _id: shiftId },
        { $set: { activeFlag: activeFlag } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service activeDeactiveShift",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async deleteShift(SITE_DB_NAME, shiftId) {
    const Shift = await ShiftModel(SITE_DB_NAME);
    try {
      const updateStatus = await Shift.updateOne(
        { _id: shiftId },
        { $set: { deleteFlag: 1 } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service deleteShift",
        error.message
      );
      throw new Error(error.message);
    }
  },

  async getShifts(SITE_DB_NAME, unitIds, deleteFlag, pagination, search) {
    try {
      const Shift = await ShiftModel(SITE_DB_NAME);
      const { pageSize, pageNumber } = pagination;
      const skip = (pageNumber - 1) * pageSize;

      let query = {
        unitId: { $in: unitIds },
        deleteFlag: deleteFlag,
      };

      if (search && search.trim() !== "") {
        const regex = new RegExp(search.trim(), "i"); // case-insensitive regex
        query.$or = [{ shiftName: regex }];
      }
      const shift = await Shift.aggregate([
        { $match: query },
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
            from: "holidays",
            localField: "holidayIds",
            foreignField: "_id",
            as: "holidayDetails",
          },
        },

        {
          $unwind: {
            path: "$holidayDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            unitName: { $ifNull: ["$unitDetails.unitName", "NA"] },
            holidayDetails: { $ifNull: ["$holidayDetails", "NA"] },
            shiftTime: {
              $concat: [
                { $ifNull: ["$startTime", ""] },
                " TO ",
                { $ifNull: ["$endTime", ""] },
              ],
            },
            breakTime: {
              $concat: [
                { $ifNull: ["$breakStartTime", ""] },
                " TO ",
                { $ifNull: ["$breakEndTime", ""] },
              ],
            },
            firstHalfTime: {
              $concat: [
                { $ifNull: ["$firstHalfDayStartTime", ""] },
                " TO ",
                { $ifNull: ["$firstHalfDayEndTime", ""] },
              ],
            },
            secHalfTime: {
              $concat: [
                { $ifNull: ["$secHalfDayStartTime", ""] },
                " TO ",
                { $ifNull: ["$secHalfDayEndTime", ""] },
              ],
            },
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M", // Format for date
                date: "$createdAt",
                // Optional: Set timezone if required
              },
            },
          },
        },
        {
          $addFields: {
            durationFormat: {
              $concat: [
                {
                  $toString: {
                    $floor: { $divide: ["$totalWorkingDurationInDay", 60] },
                  },
                },
                ":",
                {
                  $cond: {
                    if: {
                      $gte: [{ $mod: ["$totalWorkingDurationInDay", 60] }, 10],
                    },
                    then: {
                      $toString: { $mod: ["$totalWorkingDurationInDay", 60] },
                    },
                    else: {
                      $concat: [
                        "0",
                        {
                          $toString: {
                            $mod: ["$totalWorkingDurationInDay", 60],
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $addFields: {
            breakDurationFormat: {
              $concat: [
                {
                  $toString: {
                    $floor: { $divide: ["$breakDuration", 60] },
                  },
                },
                ":",
                {
                  $cond: {
                    if: { $gte: [{ $mod: ["$breakDuration", 60] }, 10] },
                    then: { $toString: { $mod: ["$breakDuration", 60] } },
                    else: {
                      $concat: [
                        "0",
                        { $toString: { $mod: ["$breakDuration", 60] } },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $addFields: {
            firstDurationFormat: {
              $concat: [
                {
                  $toString: {
                    $floor: { $divide: ["$firstHalfDuration", 60] },
                  },
                },
                ":",
                {
                  $cond: {
                    if: { $gte: [{ $mod: ["$firstHalfDuration", 60] }, 10] },
                    then: { $toString: { $mod: ["$firstHalfDuration", 60] } },
                    else: {
                      $concat: [
                        "0",
                        { $toString: { $mod: ["$firstHalfDuration", 60] } },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $addFields: {
            secDurationFormat: {
              $concat: [
                {
                  $toString: {
                    $floor: { $divide: ["$secHalfDuration", 60] },
                  },
                },
                ":",
                {
                  $cond: {
                    if: { $gte: [{ $mod: ["$secHalfDuration", 60] }, 10] },
                    then: { $toString: { $mod: ["$secHalfDuration", 60] } },
                    else: {
                      $concat: [
                        "0",
                        { $toString: { $mod: ["$secHalfDuration", 60] } },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },

        {
          $group: {
            _id: "$_id",
            unitId: { $first: "$unitId" },
            shiftName: { $first: "$shiftName" },
            shiftTime: { $first: "$shiftTime" },
            weekWorkingDays: { $first: "$weekWorkingDays" },
            totalWorkingDurationInDay: { $first: "$totalWorkingDurationInDay" },
            durationFormat: { $first: "$durationFormat" },
            startTime: { $first: "$startTime" },
            endTime: { $first: "$endTime" },
            breakDuration: { $first: "$breakDuration" },
            breakDurationFormat: { $first: "$breakDurationFormat" },
            breakTime: { $first: "$breakTime" },

            breakStartTime: { $first: "$breakStartTime" },
            breakEndTime: { $first: "$breakEndTime" },
            weekEnds: { $first: "$weekEnds" },
            monthlyExtraWorkingDays: { $first: "$monthlyExtraWorkingDays" },
            halfDayStatus: { $first: "$halfDayStatus" },
            firstHalfDayStartTime: { $first: "$firstHalfDayStartTime" },
            firstHalfDayEndTime: { $first: "$firstHalfDayEndTime" },
            firstHalfTime: { $first: "$firstHalfTime" },
            firstHalfDuration: { $first: "$firstHalfDuration" },
            firstDurationFormat: { $first: "$firstDurationFormat" },

            secHalfDayStartTime: { $first: "$secHalfDayStartTime" },
            secHalfDayEndTime: { $first: "$secHalfDayEndTime" },
            secHalfTime: { $first: "$secHalfTime" },
            secHalfDuration: { $first: "$secHalfDuration" },
            secDurationFormat: { $first: "$secDurationFormat" },
            halfDayShortLoginExceedStatus: {
              $first: "$halfDayShortLoginExceedStatus",
            },
            halfDayShortLoginMin: { $first: "$halfDayShortLoginMin" },
            religiousBreakMin: { $first: "$religiousBreakMin" },
            monthlyExtraFreeMin: { $first: "$monthlyExtraFreeMin" },
            holidayDetails: { $push: "$holidayDetails" },
            shortLoginDeductions: { $first: "$shortLoginDeductions" },
            unPlannedLeaveExtraDeduction: {
              $first: "$unPlannedLeaveExtraDeduction",
            },
            plannedLeaveApplyBeforeDays: {
              $first: "$plannedLeaveApplyBeforeDays",
            },
            sickLeavePaidUnpaidStatus: { $first: "$sickLeavePaidUnpaidStatus" },
            sickLeaveDocumentDay: { $first: "$sickLeaveDocumentDay" },
            leaveAmountCalMonthDaysStatus: {
              $first: "$leaveAmountCalMonthDaysStatus",
            },
            totalAnnualPaidLeave: { $first: "$totalAnnualPaidLeave" },
            eachMonthPaidLeave: { $first: "$eachMonthPaidLeave" },
            paidLeaveDay: { $first: "$paidLeaveDay" },
            skipPaidLeaveMonth: { $first: "$skipPaidLeaveMonth" },
            carryForwordPaidLeaveStatus: {
              $first: "$carryForwordPaidLeaveStatus",
            },
            joiningDatePaidLeaveDeductions: {
              $first: "$joiningDatePaidLeaveDeductions",
            },
            afterTwoYearExtraPaidLeave: {
              $first: "$afterTwoYearExtraPaidLeave",
            },
            initialThreeMonthPaidLeaveStatus: {
              $first: "$initialThreeMonthPaidLeaveStatus",
            },
            maternityLeave: { $first: "$maternityLeave" },
            paternityLeave: { $first: "$paternityLeave" },
            weekOnceLeaveUnplanned: { $first: "$weekOnceLeaveUnplanned" },
            pfDeduction: { $first: "$pfDeduction" },
            esicDeduction: { $first: "$esicDeduction" },
            ptDeduction: { $first: "$ptDeduction" },
            otherAndTdsDeduction: { $first: "$otherAndTdsDeduction" },
            formattedCreatedAt: { $first: "$formattedCreatedAt" },
            activeFlag: { $first: "$activeFlag" },
            deleteFlag: { $first: "$deleteFlag" },
            createdAt: { $first: "$createdAt" },
            updatedAt: { $first: "$updatedAt" },
            unitDetails: { $first: "$unitDetails" },
            unitName: { $first: "$unitName" },
            timeZone: { $first: "$timeZone" },
            shiftIsFixed: { $first: "$shiftIsFixed" },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
      ]);

      if (shift && shift.length > 0) {
        return shift;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin getShifts", error.message);
      throw new Error(error.message);
    }
  },

  async getOneShift(SITE_DB_NAME, shiftId) {
    try {
      const Shift = await ShiftModel(SITE_DB_NAME);
      const shift = await Shift.aggregate([
        {
          $match: {
            _id: shiftId,
            // deleteFlag: 0,
          },
        },
        {
          $limit: 1,
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
            from: "holidays",
            localField: "holidayIds",
            foreignField: "_id",
            as: "holidayDetails",
          },
        },

        {
          $unwind: {
            path: "$holidayDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            unitName: { $ifNull: ["$unitDetails.unitName", "NA"] },
            holidayDetails: { $ifNull: ["$holidayDetails", "NA"] },
            shiftTime: {
              $concat: [
                { $ifNull: ["$startTime", ""] },
                " TO ",
                { $ifNull: ["$endTime", ""] },
              ],
            },
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M", // Format for date
                date: "$createdAt",
                // Optional: Set timezone if required vv
              },
            },
          },
        },

        {
          $group: {
            _id: "$_id",
            unitId: { $first: "$unitId" },
            shiftName: { $first: "$shiftName" },
            shiftTime: { $first: "$shiftTime" },
            weekWorkingDays: { $first: "$weekWorkingDays" },
            totalWorkingDurationInDay: { $first: "$totalWorkingDurationInDay" },
            startTime: { $first: "$startTime" },
            endTime: { $first: "$endTime" },
            breakDuration: { $first: "$breakDuration" },
            breakStartTime: { $first: "$breakStartTime" },
            breakEndTime: { $first: "$breakEndTime" },
            weekEnds: { $first: "$weekEnds" },
            monthlyExtraWorkingDays: { $first: "$monthlyExtraWorkingDays" },
            halfDayStatus: { $first: "$halfDayStatus" },
            firstHalfDayStartTime: { $first: "$firstHalfDayStartTime" },
            firstHalfDayEndTime: { $first: "$firstHalfDayEndTime" },
            firstHalfDuration: { $first: "$firstHalfDuration" },
            secHalfDayStartTime: { $first: "$secHalfDayStartTime" },
            secHalfDayEndTime: { $first: "$secHalfDayEndTime" },
            secHalfDuration: { $first: "$secHalfDuration" },
            halfDayShortLoginExceedStatus: {
              $first: "$halfDayShortLoginExceedStatus",
            },
            halfDayShortLoginMin: { $first: "$halfDayShortLoginMin" },
            religiousBreakMin: { $first: "$religiousBreakMin" },
            monthlyExtraFreeMin: { $first: "$monthlyExtraFreeMin" },
            holidayDetails: { $push: "$holidayDetails" },
            shortLoginDeductions: { $first: "$shortLoginDeductions" },

            unPlannedLeaveExtraDeduction: {
              $first: "$unPlannedLeaveExtraDeduction",
            },
            plannedLeaveApplyBeforeDays: {
              $first: "$plannedLeaveApplyBeforeDays",
            },
            sickLeavePaidUnpaidStatus: { $first: "$sickLeavePaidUnpaidStatus" },
            sickLeaveDocumentDay: { $first: "$sickLeaveDocumentDay" },
            leaveAmountCalMonthDaysStatus: {
              $first: "$leaveAmountCalMonthDaysStatus",
            },
            totalAnnualPaidLeave: { $first: "$totalAnnualPaidLeave" },
            eachMonthPaidLeave: { $first: "$eachMonthPaidLeave" },
            paidLeaveDay: { $first: "$paidLeaveDay" },
            skipPaidLeaveMonth: { $first: "$skipPaidLeaveMonth" },
            carryForwordPaidLeaveStatus: {
              $first: "$carryForwordPaidLeaveStatus",
            },
            joiningDatePaidLeaveDeductions: {
              $first: "$joiningDatePaidLeaveDeductions",
            },
            afterTwoYearExtraPaidLeave: {
              $first: "$afterTwoYearExtraPaidLeave",
            },
            initialThreeMonthPaidLeaveStatus: {
              $first: "$initialThreeMonthPaidLeaveStatus",
            },
            maternityLeave: { $first: "$maternityLeave" },
            paternityLeave: { $first: "$paternityLeave" },
            weekOnceLeaveUnplanned: { $first: "$weekOnceLeaveUnplanned" },
            pfDeduction: { $first: "$pfDeduction" },
            esicDeduction: { $first: "$esicDeduction" },
            ptDeduction: { $first: "$ptDeduction" },
            otherAndTdsDeduction: { $first: "$otherAndTdsDeduction" },
            formattedCreatedAt: { $first: "$formattedCreatedAt" },
            activeFlag: { $first: "$activeFlag" },
            deleteFlag: { $first: "$deleteFlag" },
            createdAt: { $first: "$createdAt" },
            updatedAt: { $first: "$updatedAt" },
            unitDetails: { $first: "$unitDetails" },
            unitName: { $first: "$unitName" },
            timeZone: { $first: "$timeZone" },
            shiftIsFixed: { $first: "$shiftIsFixed" },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      if (shift && shift.length > 0) {
        return shift[0];
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service getOneShift",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getUnitShifts(SITE_DB_NAME, unitId, deleteFlag) {
    try {
      const Shift = await ShiftModel(SITE_DB_NAME);
      const objectIdUnitIds = await unitId.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
      const shift = await Shift.aggregate([
        {
          $match: {
            unitId: { $in: objectIdUnitIds },
            deleteFlag: deleteFlag,
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
            from: "holidays",
            localField: "holidayIds",
            foreignField: "_id",
            as: "holidayDetails",
          },
        },

        {
          $unwind: {
            path: "$holidayDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            unitName: { $ifNull: ["$unitDetails.unitName", "NA"] },
            holidayDetails: { $ifNull: ["$holidayDetails", "NA"] },
            shiftTime: {
              $concat: [
                { $ifNull: ["$startTime", ""] },
                " TO ",
                { $ifNull: ["$endTime", ""] },
              ],
            },
            breakTime: {
              $concat: [
                { $ifNull: ["$breakStartTime", ""] },
                " TO ",
                { $ifNull: ["$breakEndTime", ""] },
              ],
            },
            firstHalfTime: {
              $concat: [
                { $ifNull: ["$firstHalfDayStartTime", ""] },
                " TO ",
                { $ifNull: ["$firstHalfDayEndTime", ""] },
              ],
            },
            secHalfTime: {
              $concat: [
                { $ifNull: ["$secHalfDayStartTime", ""] },
                " TO ",
                { $ifNull: ["$secHalfDayEndTime", ""] },
              ],
            },
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M", // Format for date
                date: "$createdAt",
                // Optional: Set timezone if required
              },
            },
          },
        },
        {
          $addFields: {
            durationFormat: {
              $concat: [
                {
                  $toString: {
                    $floor: { $divide: ["$totalWorkingDurationInDay", 60] },
                  },
                },
                ":",
                {
                  $cond: {
                    if: {
                      $gte: [{ $mod: ["$totalWorkingDurationInDay", 60] }, 10],
                    },
                    then: {
                      $toString: { $mod: ["$totalWorkingDurationInDay", 60] },
                    },
                    else: {
                      $concat: [
                        "0",
                        {
                          $toString: {
                            $mod: ["$totalWorkingDurationInDay", 60],
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $addFields: {
            breakDurationFormat: {
              $concat: [
                {
                  $toString: {
                    $floor: { $divide: ["$breakDuration", 60] },
                  },
                },
                ":",
                {
                  $cond: {
                    if: { $gte: [{ $mod: ["$breakDuration", 60] }, 10] },
                    then: { $toString: { $mod: ["$breakDuration", 60] } },
                    else: {
                      $concat: [
                        "0",
                        { $toString: { $mod: ["$breakDuration", 60] } },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $addFields: {
            firstDurationFormat: {
              $concat: [
                {
                  $toString: {
                    $floor: { $divide: ["$firstHalfDuration", 60] },
                  },
                },
                ":",
                {
                  $cond: {
                    if: { $gte: [{ $mod: ["$firstHalfDuration", 60] }, 10] },
                    then: { $toString: { $mod: ["$firstHalfDuration", 60] } },
                    else: {
                      $concat: [
                        "0",
                        { $toString: { $mod: ["$firstHalfDuration", 60] } },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $addFields: {
            secDurationFormat: {
              $concat: [
                {
                  $toString: {
                    $floor: { $divide: ["$secHalfDuration", 60] },
                  },
                },
                ":",
                {
                  $cond: {
                    if: { $gte: [{ $mod: ["$secHalfDuration", 60] }, 10] },
                    then: { $toString: { $mod: ["$secHalfDuration", 60] } },
                    else: {
                      $concat: [
                        "0",
                        { $toString: { $mod: ["$secHalfDuration", 60] } },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },

        {
          $group: {
            _id: "$_id",
            unitId: { $first: "$unitId" },
            shiftName: { $first: "$shiftName" },
            shiftTime: { $first: "$shiftTime" },
            weekWorkingDays: { $first: "$weekWorkingDays" },
            totalWorkingDurationInDay: { $first: "$totalWorkingDurationInDay" },
            durationFormat: { $first: "$durationFormat" },
            startTime: { $first: "$startTime" },
            endTime: { $first: "$endTime" },
            breakDuration: { $first: "$breakDuration" },
            breakDurationFormat: { $first: "$breakDurationFormat" },
            breakTime: { $first: "$breakTime" },

            breakStartTime: { $first: "$breakStartTime" },
            breakEndTime: { $first: "$breakEndTime" },
            weekEnds: { $first: "$weekEnds" },
            monthlyExtraWorkingDays: { $first: "$monthlyExtraWorkingDays" },
            halfDayStatus: { $first: "$halfDayStatus" },
            firstHalfDayStartTime: { $first: "$firstHalfDayStartTime" },
            firstHalfDayEndTime: { $first: "$firstHalfDayEndTime" },
            firstHalfTime: { $first: "$firstHalfTime" },
            firstHalfDuration: { $first: "$firstHalfDuration" },
            firstDurationFormat: { $first: "$firstDurationFormat" },

            secHalfDayStartTime: { $first: "$secHalfDayStartTime" },
            secHalfDayEndTime: { $first: "$secHalfDayEndTime" },
            secHalfTime: { $first: "$secHalfTime" },
            secHalfDuration: { $first: "$secHalfDuration" },
            secDurationFormat: { $first: "$secDurationFormat" },
            halfDayShortLoginExceedStatus: {
              $first: "$halfDayShortLoginExceedStatus",
            },
            halfDayShortLoginMin: { $first: "$halfDayShortLoginMin" },
            religiousBreakMin: { $first: "$religiousBreakMin" },
            monthlyExtraFreeMin: { $first: "$monthlyExtraFreeMin" },
            holidayDetails: { $push: "$holidayDetails" },
            shortLoginDeductions: { $first: "$shortLoginDeductions" },
            unPlannedLeaveExtraDeduction: {
              $first: "$unPlannedLeaveExtraDeduction",
            },
            plannedLeaveApplyBeforeDays: {
              $first: "$plannedLeaveApplyBeforeDays",
            },
            sickLeavePaidUnpaidStatus: { $first: "$sickLeavePaidUnpaidStatus" },
            sickLeaveDocumentDay: { $first: "$sickLeaveDocumentDay" },
            leaveAmountCalMonthDaysStatus: {
              $first: "$leaveAmountCalMonthDaysStatus",
            },
            totalAnnualPaidLeave: { $first: "$totalAnnualPaidLeave" },
            eachMonthPaidLeave: { $first: "$eachMonthPaidLeave" },
            paidLeaveDay: { $first: "$paidLeaveDay" },
            skipPaidLeaveMonth: { $first: "$skipPaidLeaveMonth" },
            carryForwordPaidLeaveStatus: {
              $first: "$carryForwordPaidLeaveStatus",
            },
            joiningDatePaidLeaveDeductions: {
              $first: "$joiningDatePaidLeaveDeductions",
            },
            afterTwoYearExtraPaidLeave: {
              $first: "$afterTwoYearExtraPaidLeave",
            },
            initialThreeMonthPaidLeaveStatus: {
              $first: "$initialThreeMonthPaidLeaveStatus",
            },
            maternityLeave: { $first: "$maternityLeave" },
            paternityLeave: { $first: "$paternityLeave" },
            weekOnceLeaveUnplanned: { $first: "$weekOnceLeaveUnplanned" },
            pfDeduction: { $first: "$pfDeduction" },
            esicDeduction: { $first: "$esicDeduction" },
            ptDeduction: { $first: "$ptDeduction" },
            otherAndTdsDeduction: { $first: "$otherAndTdsDeduction" },
            formattedCreatedAt: { $first: "$formattedCreatedAt" },
            activeFlag: { $first: "$activeFlag" },
            deleteFlag: { $first: "$deleteFlag" },
            createdAt: { $first: "$createdAt" },
            updatedAt: { $first: "$updatedAt" },
            unitDetails: { $first: "$unitDetails" },
            unitName: { $first: "$unitName" },
            timeZone: { $first: "$timeZone" },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      if (shift && shift.length > 0) {
        return shift;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin getShifts", error.message);
      throw new Error(error.message);
    }
  },

  async shiftCheck(SITE_DB_NAME, shiftId) {
    const Shift = await ShiftModel(SITE_DB_NAME);
    try {
      const shiftCheck = await Shift.findOne({ _id: shiftId });
      if (shiftCheck) {
        return shiftCheck;
      } else {
        return null;
      }
    } catch (error) {
      console.log(
        "database error from admin service deleteHoliday",
        error.message
      );
      throw new Error(error.message);
    }
  },
  //================================================dashboard============================================================
  async getUnitsCount(SITE_DB_NAME, unitIds, deleteFlag) {
    try {
      const Unit = await UnitModel(SITE_DB_NAME);
      const getCountDocuments = await Unit.countDocuments({
        _id: { $in: unitIds },
        deleteFlag: deleteFlag,
      });
      if (getCountDocuments) {
        return getCountDocuments;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service getCountDocuments",
        error.message
      );
      return error.message;
    }
  },
  async getShiftsCount(SITE_DB_NAME, unitIds, deleteFlag) {
    try {
      const Shift = await ShiftModel(SITE_DB_NAME);
      const getCountDocuments = await Shift.countDocuments({
        unitId: { $in: unitIds },
        deleteFlag: deleteFlag,
      });
      if (getCountDocuments) {
        return getCountDocuments;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service getCountDocuments",
        error.message
      );
      return error.message;
    }
  },
  async getHolidayCount(SITE_DB_NAME, shiftId, day, month, year, deleteFlag) {
    const Holiday = await HolidayModel(SITE_DB_NAME);
    let con = [{ $eq: [{ $year: "$date" }, parseInt(year)] }];

    if (month !== null && day !== month) {
      con.push({ $eq: [{ $month: "$date" }, parseInt(month)] });
    }
    if (day !== null && day !== undefined) {
      con.push({ $eq: [{ $dayOfMonth: "$date" }, parseInt(day)] });
    }
    try {
      const getCountDocuments = await Holiday.countDocuments({
        shiftId: shiftId,
        deleteFlag: deleteFlag,
        $expr: {
          $and: con,
        },
      });

      if (getCountDocuments) {
        return getCountDocuments;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service getCountDocuments",
        error.message
      );
      return error.message;
    }
  },
  async getholidayCompoffCount(
    SITE_DB_NAME,
    shiftId,
    day,
    month,
    year,
    deleteFlag
  ) {
    const Holiday = await HolidayModel(SITE_DB_NAME);

    let con = [{ $eq: [{ $year: "$date" }, parseInt(year)] }];

    if (month !== null && day !== month) {
      con.push({ $eq: [{ $month: "$date" }, parseInt(month)] });
    }
    if (day !== null && day !== undefined) {
      con.push({ $eq: [{ $dayOfMonth: "$date" }, parseInt(day)] });
    }
    try {
      const getCountDocuments = await Holiday.countDocuments({
        shiftId: shiftId,
        deleteFlag: deleteFlag,
        compOff: "Comp-Off",
        $expr: {
          $and: con,
        },
      });

      if (getCountDocuments) {
        return getCountDocuments;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service getCountDocuments",
        error.message
      );
      return error.message;
    }
  },
  async getShiftsCount(SITE_DB_NAME, unitIds, deleteFlag) {
    const Shift = await ShiftModel(SITE_DB_NAME);
    try {
      const getCountDocuments = await Shift.countDocuments({
        unitId: { $in: unitIds },
        deleteFlag: deleteFlag,
      });
      if (getCountDocuments) {
        return getCountDocuments;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service getCountDocuments",
        error.message
      );
      return error.message;
    }
  },
  async getUserCount(SITE_DB_NAME, unitIds, deleteFlag) {
    try {
      const User = await UserModel(SITE_DB_NAME);

      const getCountDocuments = await User.countDocuments({
        unitId: { $in: unitIds },
        deleteFlag: deleteFlag,
        roleName: { $ne: "Site-Owner" },
      });
      if (getCountDocuments) {
        return getCountDocuments;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service getCountDocuments",
        error.message
      );
      return error.message;
    }
  },
  async getEmployeeCounts(SITE_DB_NAME, unitIds, deleteFlag) {
    try {
      const User = await UserModel(SITE_DB_NAME);
      const getCountDocuments = await User.countDocuments({
        unitId: { $in: unitIds },
        deleteFlag: deleteFlag,
        roleName: { $nin: ["Site-Owner", "Admin"] },
      });
      if (getCountDocuments) {
        return getCountDocuments;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service getCountDocuments",
        error.message
      );
      return error.message;
    }
  },
  async getAdminCount(SITE_DB_NAME, unitIds, deleteFlag) {
    try {
      const User = await UserModel(SITE_DB_NAME);
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
        error.message
      );
      return error.message;
    }
  },
  async getEmployeeCount(SITE_DB_NAME, unitIds, relievingStatus, deleteFlag) {
    try {
      const User = await UserModel(SITE_DB_NAME);
      const getCountDocuments = await User.countDocuments({
        unitId: { $in: unitIds },
        deleteFlag: deleteFlag,
        relievingStatus: relievingStatus,
        roleName: { $ne: "Site-Owner" },
      });
      if (getCountDocuments) {
        return getCountDocuments;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service getCountDocuments",
        error.message
      );
      return error.message;
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
  async checkUserEmail(SITE_DB_NAME, email) {
    const User = await UserModel(SITE_DB_NAME);
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
        return 0;
      }
    } catch (error) {
      throw new Error(error.message);
    }
  },
  async checkUserEmailWithId(SITE_DB_NAME, employeeId, email) {
    const User = await UserModel(SITE_DB_NAME);
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
  async checkUserUniqueIdWithId(SITE_DB_NAME, employeeId, uniqueId) {
    const User = await UserModel(SITE_DB_NAME);
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

  async getUserDetails(SITE_DB_NAME, userId) {
    const User = await UserModel(SITE_DB_NAME);
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
            companyDetails: { $ifNull: ["$companyDetails", null] }, // Set "NA" if no matching team
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
            teamDetails: { $ifNull: ["$teamDetails", null] },
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
            departmentDetails: { $ifNull: ["$departmentDetails", null] },
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
            unitDetails: [{ $ifNull: ["$unitDetails", null] }],
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
            shiftDetails: { $ifNull: ["$shiftDetails", null] },
            paidLeaveCount: 0,
            maternityLeaveCount: 0,
            paternityLeaveCount: 0,
          },
        },
        {
          $lookup: {
            from: "holidays",
            localField: "shiftId",
            foreignField: "shiftId",
            as: "holidays",
          },
        },
        {
          $addFields: {
            userId: "$_id",
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M:%S",
                date: "$createdAt",
              },
            },
            formattedlastLoginTime: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M:%S",
                date: "$lastLoginTime",
              },
            },
            formattedJoiningDate: {
              $dateToString: {
                format: "%d-%m-%Y",
                date: "$joiningDate",
              },
            },
            sameFormattedJoiningDate: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$joiningDate",
              },
            },
            formattedRelievingDate: {
              $cond: {
                if: { $eq: [{ $type: "$relievingDate" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$relievingDate",
                  },
                },
                else: "$relievingDate",
              },
            },
            formattedDob: {
              $cond: {
                if: { $eq: [{ $type: "$dob" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$dob",
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
            teamId: 1,
            shiftId: 1,
            roleName: 1,
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
            relievingDate: 1,
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
            pPincode: 1,

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

            bankName: 1,
            bankAccountNumber: 1,
            IFSCCode: 1,
            accountHolderName: 1,
            bankStatus: 1,
            officialNumber: 1,
            documents: 1,
            documentStatus: 1,

            salary: 1,
            yearCTC: 1,
            CTCStatus: 1,
            religiousBreak: 1,
            physicallyChallenged: 1,
            spouseName: 1,
            motherName: 1,
            maritalStatus: 1,
            bloodGroup: 1,
            religion: 1,
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
            sameFormattedJoiningDate: 1,
            formattedRelievingDate: 1,
            roleDetails: 1,
            unitDetails: 1,
            shiftDetails: 1,
            teamDetails: 1,
            departmentDetails: 1,
            accessLevel: 1,
            holidays: 1,
            paidLeaveCount: 1,
            maternityLeaveCount: 1,
            paternityLeaveCount: 1,
            manualPunch: 1,
            showBirthAny: 1,
            twoFactorAuth: 1,
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
        error.message
      );
      throw new Error(error.message);
    }
  },
  async updateLoginTime(SITE_DB_NAME, userId) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const lastLoginTime = moment().format("YYYY-MM-DD HH:mm:ss");
      const updateStatus = await User.updateOne(
        { _id: userId },
        { $set: { lastLoginTime: lastLoginTime } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from commen service user details",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async checkEmployeeOne(SITE_DB_NAME, employeeId) {
    const User = await UserModel(SITE_DB_NAME);
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

  //================================================Holiday============================================================
  async addHolidayBulk(SITE_DB_NAME, holidayList) {
    const Holiday = await HolidayModel(SITE_DB_NAME);

    try {
      if (!Array.isArray(holidayList) || holidayList.length === 0) {
        return "EMPTY_DATA";
      }

      const incomingIds = [];

      // Take shiftId from list (all entries of same shift)
      const givenShiftId = holidayList[0].shiftId;

      const bulkOps = holidayList.map((h) => {
        const { _id, holidayName, date, shiftId, image, compOff } = h;

        if (_id) {
          incomingIds.push(_id);
          return {
            updateOne: {
              filter: { _id },
              update: { $set: { holidayName, date, shiftId, image, compOff } },
            },
          };
        } else {
          return {
            insertOne: {
              document: { holidayName, date, shiftId, image, compOff },
            },
          };
        }
      });

      const bulkResult = await Holiday.bulkWrite(bulkOps);

      // Add inserted IDs also
      if (bulkResult.insertedIds) {
        Object.values(bulkResult.insertedIds).forEach((id) => {
          incomingIds.push(id);
        });
      }

      // Delete only holidays for this specific shift
      await Holiday.deleteMany({
        shiftId: givenShiftId,
        _id: { $nin: incomingIds },
      });

      return bulkResult;
    } catch (error) {
      console.log("Database error in addHolidayBulk:", error.message);
      throw new Error(error.message);
    }
  },
  async addHoliday(SITE_DB_NAME, holidayName, date, shiftId, image, compOff) {
    const Holiday = await HolidayModel(SITE_DB_NAME);
    try {
      const addStatus = await Holiday.create({
        holidayName: holidayName,
        date: date,
        shiftId: shiftId,
        image,
        compOff,
      });
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service addholiday",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async checkHoliday(SITE_DB_NAME, holidayId) {
    const Holiday = await HolidayModel(SITE_DB_NAME);
    try {
      const holidayStatus = await Holiday.findOne({
        _id: holidayId,
        deleteFlag: 0,
      }); // 20 seconds timeout

      if (holidayStatus) {
        return holidayStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("holiday find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkHolidayView(SITE_DB_NAME, holidayId) {
    const Holiday = await HolidayModel(SITE_DB_NAME);
    try {
      const holidayStatus = await Holiday.findOne({ _id: holidayId }); // 20 seconds timeout

      if (holidayStatus) {
        return holidayStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("holiday find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkHolidayWithName(
    SITE_DB_NAME,
    holidayId,
    holidayName,
    date,
    shiftId
  ) {
    const Holiday = await HolidayModel(SITE_DB_NAME);
    try {
      const holidayStatus = await Holiday.findOne({
        _id: { $ne: holidayId },
        holidayName: holidayName,
        date: date,
        shiftId: shiftId,
        deleteFlag: 0,
      }); // 20 seconds timeout
      if (holidayStatus) {
        return holidayStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("holiday find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkHolidayName(SITE_DB_NAME, holidayName, date, shiftId) {
    const Holiday = await HolidayModel(SITE_DB_NAME);
    try {
      const holiday = await Holiday.findOne({
        shiftId: shiftId,
        holidayName: holidayName,
        date: date,
        deleteFlag: 0,
      }); // 20 seconds timeout

      if (holiday) {
        return holiday._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("holiday find db error", error.message);
      throw new Error(error.message);
    }
  },
  async editHoliday(
    SITE_DB_NAME,
    holidayId,
    holidayName,
    date,
    shiftId,
    image,
    compOff
  ) {
    const Holiday = await HolidayModel(SITE_DB_NAME);
    try {
      const updateStatus = await Holiday.updateOne(
        { _id: holidayId },
        {
          $set: {
            date: date,
            holidayName: holidayName,
            shiftId: shiftId,
            image,
            compOff,
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
      console.log(
        "database error from admin service editHoliday",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async activeDeactiveHoliday(SITE_DB_NAME, holidayId, activeFlag) {
    const Holiday = await HolidayModel(SITE_DB_NAME);
    try {
      const updateStatus = await Holiday.updateOne(
        { _id: holidayId },
        { $set: { activeFlag: activeFlag } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service activeDeactiveholiday",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async deleteHoliday(SITE_DB_NAME, holidayId, deleteFlag) {
    const Holiday = await HolidayModel(SITE_DB_NAME);
    try {
      const updateStatus = await Holiday.updateOne(
        { _id: holidayId },
        { $set: { deleteFlag: deleteFlag } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service deleteHoliday",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async holidayCompoffStatus(SITE_DB_NAME, holidayId, compOff) {
    const Holiday = await HolidayModel(SITE_DB_NAME);
    try {
      const updateStatus = await Holiday.updateOne(
        { _id: holidayId },
        { $set: { compOff: compOff } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service deleteHoliday",
        error.message
      );
      throw new Error(error.message);
    }
  },

  async getHolidays(SITE_DB_NAME, shiftIds, deleteFlag) {
    const Holiday = await HolidayModel(SITE_DB_NAME);
    try {
      const holidays = await Holiday.aggregate([
        {
          $match: {
            shiftId: { $in: shiftIds },
            deleteFlag: deleteFlag,
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
            shiftName: {
              $cond: {
                if: { $ne: ["$shiftDetails", "NA"] },
                then: "$shiftDetails.shiftName",
                else: "NA",
              },
            },
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
              },
            },

            formattedDate: {
              $cond: {
                if: { $eq: [{ $type: "$date" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$date",
                  },
                },
                else: "$date",
              },
            },
            formattedDateSame: {
              $cond: {
                if: { $eq: [{ $type: "$date" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$date",
                  },
                },
                else: "$date",
              },
            },
            formattedYear: {
              $cond: {
                if: { $eq: [{ $type: "$date" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%Y",
                    date: "$date",
                  },
                },
                else: "$date",
              },
            },
          },
        },
        { $sort: { date: 1 } },
        {
          $project: {
            _id: 1,
            holidayName: 1,
            shiftDetails: 1,
            shiftName: 1,
            shiftId: 1,
            date: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            formattedDate: 1,
            formattedDateSame: 1,
            formattedCreatedAt: 1,
            formattedYear: 1,
            image: 1,
            compOff: 1,
          },
        },
      ]);

      if (holidays && holidays.length > 0) {
        return holidays;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service holidays details",
        error.message
      );
      throw new Error(error.message);
    }
  },

  //================================================Holiday Temp============================================================

  async addHolidayTemp(SITE_DB_NAME, holidayName, image, date, compOff) {
    const HolidayTemp = await HolidayTempModel(SITE_DB_NAME);
    console.log(holidayName, image, date, compOff);

    try {
      const addStatus = await HolidayTemp.create({
        holidayName: holidayName,
        image,
        date,
        compOff,
      });
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service addHolidayTemp",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async checkHolidayTemp(SITE_DB_NAME, holidayId) {
    const HolidayTemp = await HolidayTempModel(SITE_DB_NAME);
    try {
      const holidayStatus = await HolidayTemp.findOne({
        _id: holidayId,
        deleteFlag: 0,
      }); // 20 seconds timeout

      if (holidayStatus) {
        return holidayStatus;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("holidayTemp find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkHolidayViewTemp(SITE_DB_NAME, holidayId) {
    const HolidayTemp = await HolidayTempModel(SITE_DB_NAME);
    try {
      const holidayStatus = await HolidayTemp.findOne({ _id: holidayId }); // 20 seconds timeout

      if (holidayStatus) {
        return holidayStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("holidayTemp find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkHolidayWithNameTemp(SITE_DB_NAME, holidayId, holidayName) {
    const HolidayTemp = await HolidayTempModel(SITE_DB_NAME);
    try {
      const holidayStatus = await HolidayTemp.findOne({
        _id: { $ne: holidayId },
        holidayName: holidayName,
        deleteFlag: 0,
      }); // 20 seconds timeout
      if (holidayStatus) {
        return holidayStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("holidayTemp find db error", error.message);
      throw new Error(error.message);
    }
  },
  async getHolidaysTemp(
    SITE_DB_NAME,
    deleteFlag,
    pagination = { pageSize: 10, pageNumber: 1 },
    search
  ) {
    const HolidayTemp = await HolidayTempModel(SITE_DB_NAME);
    try {
      const { pageSize, pageNumber } = pagination;
      const skip = Math.max(0, pageNumber - 1) * pageSize;
      const filter = {
        deleteFlag: deleteFlag,
      };

      //  Search by holidayName
      if (search && search.trim() !== "") {
        filter.holidayName = { $regex: search, $options: "i" };
      }

      // Sort → date: -1  (Latest holidays first)
      const sort = { date: -1 };

      // Main query
      const holiday = await HolidayTemp.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(pageSize);
      if (holiday) {
        return holiday;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("holidayTemp find db error", error.message);
      throw new Error(error.message);
    }
  },
  async activeDeactiveHolidayTemp(SITE_DB_NAME, holidayId, activeFlag) {
    const HolidayTemp = await HolidayTempModel(SITE_DB_NAME);
    try {
      const updateStatus = await HolidayTemp.updateOne(
        { _id: holidayId },
        { $set: { activeFlag: activeFlag } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service activeDeactiveHolidayTemp",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async checkHolidayNameTemp(SITE_DB_NAME, holidayName) {
    const HolidayTemp = await HolidayTempModel(SITE_DB_NAME);
    try {
      const holiday = await HolidayTemp.findOne({
        holidayName: holidayName,
        deleteFlag: 0,
      }); // 20 seconds timeout

      if (holiday) {
        return holiday._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("holidayTemp find db error", error.message);
      throw new Error(error.message);
    }
  },
  async editHolidayTemp(
    SITE_DB_NAME,
    holidayName,
    holidayId,
    image,
    date,
    compOff,
    removeFiles
  ) {
    const HolidayTemp = await HolidayTempModel(SITE_DB_NAME);
    try {
      // prepare $set object (only set image if provided)
      const setObj = {
        holidayName: holidayName,
        date,
        compOff,
      };
      if (typeof image !== "undefined") {
        setObj.image = image;
      }

      const updateOps = { $set: setObj };

      // if removeFiles provided, inspect existing doc to handle array vs string
      if (Array.isArray(removeFiles) && removeFiles.length > 0) {
        const existing = await HolidayTemp.findById(holidayId).lean();

        if (existing) {
          // case: stored as array -> use $pull to remove items from array
          if (Array.isArray(existing.image)) {
            updateOps.$pull = { image: { $in: removeFiles } };
          }
          // case: stored as single string and matches one of removeFiles -> clear it
          else if (
            typeof existing.image === "string" &&
            removeFiles.includes(existing.image)
          ) {
            // decide how you want to clear single-string image: null or empty string
            // I'm using null here; change to "" if you prefer empty string.
            updateOps.$set.image = null;
          }
        }
      }

      const updateStatus = await HolidayTemp.updateOne(
        { _id: holidayId },
        updateOps,
        { upsert: false }
      );

      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service editHolidayTemp",
        error.message
      );
      throw new Error(error.message);
    }
  },

  async deleteHolidayTemp(SITE_DB_NAME, holidayId) {
    const HolidayTemp = await HolidayTempModel(SITE_DB_NAME);
    try {
      const updateStatus = await HolidayTemp.updateOne(
        { _id: holidayId },
        { $set: { deleteFlag: 1 } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service deleteHoliday",
        error.message
      );
      throw new Error(error.message);
    }
  },

  async getBirthData(
    SITE_DB_NAME,
    roleName,
    unitIds,
    day,
    month,
    year,
    showBirthAny
  ) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      let query = { deleteFlag: 0, relievingStatus: 0, approveFlag: 1 };
      const currentYear = moment().year();
      if (roleName === "Site-Owner" || showBirthAny === 1) {
        query.$or = [
          { roleName: "Super Admin" },
          { deleteFlag: 0, relievingStatus: 0, activeFlag: 1, approveFlag: 1 },
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
            approveFlag: 1,
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
        const onlyDate = new Date(user.originalDob).toISOString().slice(0, 10);
        const dobMoment = moment(onlyDate); // Convert to moment date
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
          originalDob: onlyDate,
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
  async getJoiningData(
    SITE_DB_NAME,
    roleName,
    unitIds,
    day,
    month,
    year,
    showBirthAny
  ) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      let query = { deleteFlag: 0, relievingStatus: 0, approveFlag: 1 };
      const currentYear = moment().year();
      if (roleName === "Site-Owner" || showBirthAny === 1) {
        query.$or = [
          { roleName: "Super Admin" },
          { deleteFlag: 0, relievingStatus: 0, activeFlag: 1, approveFlag: 1 },
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
            approveFlag: 1,
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
            relievingDate: 1,
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

  // ====================== attendance
  async attendanceDaily(SITE_DB_NAME, userId, currentDate) {
    const Attendance = await AttendanceModel(SITE_DB_NAME);
    try {
      const attendance = await Attendance.findOne({
        userId,
        date: currentDate,
        deleteFlag: 0,
      });
      if (attendance) {
        return attendance;
      } else {
        return null;
      }
    } catch (error) {
      console.log("attendanceDaily find db error", error.message);
      throw new Error(error.message);
    }
  },
  async getWeekAttendancesStatus(SITE_DB_NAME, userId, weekWorkingDates) {
    const Attendance = await AttendanceModel(SITE_DB_NAME);
    try {
      return await Attendance.find({
        userId: userId,
        date: { $in: weekWorkingDates },
        status: { $in: ["Present"] },
      });
    } catch (error) {
      throw new Error(
        "Error fetching weekly attendance status: " + error.message
      );
    }
  },
  async attendanceByDateRange(SITE_DB_NAME, userId, startOfDay, endOfDay) {
    const Attendance = await AttendanceModel(SITE_DB_NAME);

    try {
      const attendance = await Attendance.findOne({
        userId: userId,
        date: { $gte: startOfDay, $lte: endOfDay },
        deleteFlag: 0,
      });

      if (attendance) {
        return attendance;
      } else {
        return null;
      }
    } catch (error) {
      console.log("attendanceByDateRange find db error", error.message);
      throw new Error(error.message);
    }
  },
  async attendanceByDate(SITE_DB_NAME, userId, currentDate) {
    const Attendance = await AttendanceModel(SITE_DB_NAME);
    try {
      const attendance = await Attendance.aggregate([
        {
          $match: {
            userId: userId,
            deleteFlag: 0,
            $expr: {
              $eq: [
                { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, // Convert the stored date to "YYYY-MM-DD"
                currentDate, // The date you're passing in as "YYYY-MM-DD"
              ],
            },
          },
        },
        {
          $lookup: {
            from: "users", // Name of the User collection in MongoDB
            localField: "userId", // Field from Attendance to match
            foreignField: "_id", // Field in the User collection
            as: "userDetails",
          },
        },
        {
          $unwind: {
            path: "$userDetails", // Unwind the userDetails array
            preserveNullAndEmptyArrays: true, // Preserve attendance if no user is found
          },
        },
        {
          $addFields: {
            unitIds: {
              $cond: {
                if: { $gt: [{ $type: "$userDetails" }, "missing"] },
                then: "$userDetails.unitId",
                else: null,
              },
            },
            name: {
              $cond: {
                if: { $gt: [{ $type: "$userDetails" }, "missing"] },
                then: "$userDetails.name",
                else: null,
              },
            },
            image: {
              $cond: {
                if: { $gt: [{ $type: "$userDetails" }, "missing"] },
                then: "$userDetails.image",
                else: null,
              },
            },
            designationName: {
              $cond: {
                if: { $gt: [{ $type: "$userDetails" }, "missing"] },
                then: "$userDetails.designationName",
                else: null,
              },
            },
            shiftId: {
              $cond: {
                if: { $gt: [{ $type: "$userDetails" }, "missing"] },
                then: "$userDetails.shiftId",
                else: null,
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            uniqueId: 1,
            unitIds: 1,
            name: 1,
            image: 1,
            designationName: 1,
            shiftId: 1,
            activeFlag: 1,
            breakDuration: 1,
            createdAt: 1,
            date: 1,
            deleteFlag: 1,
            firstIn: 1,
            firstInStatus: 1,
            lastOut: 1,
            lastOutStatus: 1,
            lateBy: 1,
            leaveStatus: 1,
            leaveType: 1,
            overTime: 1,
            presentStatus: 1,
            punches: 1,
            religiousBreakDuration: 1,
            religiousBreakStatus: 1,
            shiftBreakDuration: 1,
            shiftEnd: 1,
            shiftReligiousBreakDuration: 1,
            shiftStart: 1,
            shortLoginHDStatus: 1,
            status: 1,
            updatedAt: 1,
            workingHrs: 1,
            workingMin: 1,
            totalWorkingHrs: 1,
            totalWorkingMin: 1,
            takenBreak: 1,
            lateByEarly: 1,
            __v: 1,
          },
        },
      ]);

      if (attendance.length > 0) {
        return attendance[0];
      } else {
        return null;
      }
    } catch (error) {
      console.log("attendanceDaily find db error", error.message);
      throw new Error(error.message);
    }
  },

  async getUser(SITE_DB_NAME, userIdCurrent, roleNameCurrent, unitIdsCurrent) {
    const User = await UserModel(SITE_DB_NAME);
    let con = null;
    const deleteFlag = 0;
    if (roleNameCurrent == "Site-Owner") {
      con = {
        unitId: { $in: unitIdsCurrent },
        deleteFlag: deleteFlag,
        approveFlag: 1,
        roleName: { $nin: ["Site-Owner"] },
      };
    } else if (roleNameCurrent == "Admin") {
      con = {
        unitId: { $in: unitIdsCurrent },
        deleteFlag: deleteFlag,
        approveFlag: 1,
        roleName: { $nin: ["Site-Owner", "Admin"] },
      };
    } else if (roleNameCurrent == "HR-Manager") {
      con = {
        unitId: { $in: unitIdsCurrent },
        deleteFlag: deleteFlag,
        approveFlag: 1,
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager"] },
      };
    } else if (roleNameCurrent == "Manager") {
      con = {
        unitId: { $in: unitIdsCurrent },
        deleteFlag: deleteFlag,
        approveFlag: 1,
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager", "Manager"] },
      };
    } else {
      con = {
        _id: userIdCurrent,
        unitId: { $in: unitIdsCurrent },
        deleteFlag: deleteFlag,
        approveFlag: 1,
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager", "Manager"] },
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
            companyDetails: { $ifNull: ["$companyDetails", "NA"] }, // Set "NA" if no matching team
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
              },
            },
            formattedlastLoginTime: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$lastLoginTime",
              },
            },
            formattedJoiningDate: {
              $cond: {
                if: { $eq: [{ $type: "$joiningDate" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$joiningDate",
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
        {
          $addFields: {
            unitName: {
              $ifNull: [{ $arrayElemAt: ["$unitDetails.unitName", 0] }, "NA"],
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
            relievingDate: 1,
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
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getUserForExportAttendance(
    SITE_DB_NAME,
    userIdCurrent,
    roleNameCurrent,
    unitIdsCurrent
  ) {
    const User = await UserModel(SITE_DB_NAME);
    let con = null;
    const deleteFlag = 0;
    if (roleNameCurrent == "Site-Owner") {
      con = {
        deleteFlag: deleteFlag,
        approveFlag: 1,
        roleName: { $nin: ["Site-Owner"] },
        unitId: { $in: unitIdsCurrent },
      };
    } else if (roleNameCurrent == "Admin") {
      con = {
        unitId: { $in: unitIdsCurrent },
        deleteFlag: deleteFlag,
        approveFlag: 1,
        roleName: { $nin: ["Site-Owner", "Admin"] },
      };
    } else if (roleNameCurrent == "HR-Manager") {
      con = {
        unitId: { $in: unitIdsCurrent },
        deleteFlag: deleteFlag,
        approveFlag: 1,
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager"] },
      };
    } else if (roleNameCurrent == "Manager") {
      con = {
        unitId: { $in: unitIdsCurrent },
        deleteFlag: deleteFlag,
        approveFlag: 1,
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager", "Manager"] },
      };
    } else {
      con = {
        _id: userIdCurrent,
        unitId: { $in: unitIdsCurrent },
        deleteFlag: deleteFlag,
        approveFlag: 1,
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager", "Manager"] },
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
            companyDetails: { $ifNull: ["$companyDetails", "NA"] }, // Set "NA" if no matching team
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
              },
            },
            formattedlastLoginTime: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$lastLoginTime",
              },
            },
            formattedJoiningDate: {
              $cond: {
                if: { $eq: [{ $type: "$joiningDate" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$joiningDate",
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
            relievingDate: 1,
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
        error.message
      );
      throw new Error(error.message);
    }
  },

  //================================================Leave============================================================
  async checkLeaveDate(SITE_DB_NAME, userId, leaveDates) {
    const Leave = await LeaveModel(SITE_DB_NAME);
    try {
      const leaveStatus = await Leave.find({
        userId: userId,
        leaveDates: { $in: leaveDates.map((date) => new Date(date)) },
        status: { $nin: ["Cancelled", "Rejected"] },
        deleteFlag: 0,
      });
      if (leaveStatus) {
        return leaveStatus;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("leaveStatus find db error", error.message);
      throw new Error(error.message);
    }
  },
  async leaveByDate(SITE_DB_NAME, userId, leaveDate) {
    const Leave = await LeaveModel(SITE_DB_NAME);
    try {
      const leaveStatus = await Leave.findOne({
        userId: userId,
        status: { $nin: ["Cancelled", "Rejected"] },
        deleteFlag: 0,
        leavesDeductionStatus: {
          $elemMatch: {
            leaveDate: new Date(leaveDate),
          },
        },
      }).sort({ createdAt: -1 });

      if (leaveStatus) {
        return leaveStatus;
      } else {
        return null;
      }
    } catch (error) {
      console.log("leaveByDate find db error", error.message);
      throw new Error(error.message);
    }
  },
  async compoffByDate(SITE_DB_NAME, userId, compoffDate) {
    const Compoff = await CompoffModel(SITE_DB_NAME);
    try {
      const startOfDay = new Date(compoffDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(compoffDate);
      endOfDay.setHours(23, 59, 59, 999);
      const compoffStatus = await Compoff.findOne({
        userId: userId,
        status: { $nin: ["Cancelled"] },
        deleteFlag: 0,
        date: { $gte: startOfDay, $lte: endOfDay },
      }).sort({ createdAt: -1 });

      if (compoffStatus) {
        return compoffStatus;
      } else {
        return null;
      }
    } catch (error) {
      console.log("compoffByDate find db error", error.message);
      throw new Error(error.message);
    }
  },
  async regularizationByDate(SITE_DB_NAME, userId, regularizationDate) {
    const Regularization = await RegularizationModel(SITE_DB_NAME);
    try {
      const regularizationStatus = await Regularization.findOne({
        userId: userId,
        status: { $nin: ["Cancelled"] },
        deleteFlag: 0,
        date: new Date(regularizationDate),
      }).sort({ createdAt: -1 });

      if (regularizationStatus) {
        return regularizationStatus;
      } else {
        return null;
      }
    } catch (error) {
      console.log("regularizationByDate find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkLeaveDateWithId(SITE_DB_NAME, leaveId, userId, leaveDates) {
    const Leave = await LeaveModel(SITE_DB_NAME);
    try {
      const leaveStatus = await Leave.findOne({
        _id: { $ne: leaveId },
        userId: userId,
        leaveDates: { $in: leaveDates.map((date) => new Date(date)) },
        status: { $nin: ["Cancelled", "Rejected"] },
        deleteFlag: 0,
      }); // 20 seconds timeout
      if (leaveStatus) {
        return leaveStatus;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("checkLeaveDateWithId find db error", error.message);
      throw new Error(error.message);
    }
  },

  async checkLeave(SITE_DB_NAME, leaveId) {
    const Leave = await LeaveModel(SITE_DB_NAME);
    try {
      const leaveStatus = await Leave.findOne({
        _id: leaveId,
        deleteFlag: 0,
      });
      if (leaveStatus) {
        return leaveStatus;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("leave find db error", error.message);
      throw new Error(error.message);
    }
  },

  async addLeave(SITE_DB_NAME, data) {
    const Leave = await LeaveModel(SITE_DB_NAME);
    try {
      const addStatus = await Leave.create(data);
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin service addLeave", error.message);
      throw new Error(error.message);
    }
  },

  async checkLeave(SITE_DB_NAME, leaveId) {
    const Leave = await LeaveModel(SITE_DB_NAME);
    try {
      const leaveStatus = await Leave.findOne({
        _id: leaveId,
        deleteFlag: 0,
        status: { $in: ["Pending", "Approved"] },
      }); // 20 seconds timeout
      if (leaveStatus) {
        return leaveStatus;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("Leave find db error", error.message);
      throw new Error(error.message);
    }
  },

  async editLeave(SITE_DB_NAME, leaveId, data) {
    const Leave = await LeaveModel(SITE_DB_NAME);

    try {
      const updatedLeave = await Leave.findOneAndUpdate(
        { _id: leaveId },
        { $set: data },
        {
          new: true, // returns updated document
          runValidators: true, // validation apply
        }
      );

      return updatedLeave ? updatedLeave : "NA"; // updated object
    } catch (error) {
      console.log("database error from admin service editLeave", error.message);
      throw new Error(error.message);
    }
  },
  async approveRejectLeave(
    SITE_DB_NAME,
    leaveId,
    status,
    approvedBy,
    approvedAt,
    approvedByComment,
    leaveType
  ) {
    const Leave = await LeaveModel(SITE_DB_NAME);
    try {
      const updateStatus =
        status === "Approved"
          ? await Leave.updateOne(
              { _id: leaveId },
              {
                $set: {
                  status,
                  approvedBy,
                  approvedAt,
                  approvedByComment,
                  leaveType,
                  "leavesDeductionStatus.$[elem].leaveType": leaveType,
                },
              },
              {
                arrayFilters: [{ "elem.leaveType": { $exists: true } }],
              },
              { upsert: false }
            )
          : await Leave.updateOne(
              { _id: leaveId },
              { $set: { status, approvedBy, approvedAt, approvedByComment } },
              { upsert: false }
            );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service approveRejectLeave",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async cancelLeave(SITE_DB_NAME, leaveId, status, approvedBy, approvedAt) {
    const Leave = await LeaveModel(SITE_DB_NAME);
    try {
      const updateStatus = await Leave.updateOne(
        { _id: leaveId },
        { $set: { status, approvedBy, approvedAt } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service cancelLeave",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getMyLeavesCount(
    SITE_DB_NAME,
    userId,
    selectionType,
    monthYear,
    deleteFlag = 0
  ) {
    const Leave = await LeaveModel(SITE_DB_NAME);
    const matchStage = {
      userId,
      deleteFlag,
      status: { $nin: ["Rejected", "Cancelled"] },
    };

    // Handle date filtering
    if (
      selectionType === "custom" &&
      Array.isArray(monthYear) &&
      monthYear.length === 2
    ) {
      matchStage.appliedAt = {
        $gte: new Date(monthYear[0]),
        $lte: new Date(monthYear[1]),
      };
    } else if (selectionType === "month") {
      const startOfMonth = `${monthYear}-01`;
      const endOfMonth = `${monthYear}-31`;
      matchStage.appliedAt = { $gte: startOfMonth, $lte: endOfMonth };
    }

    try {
      // Only fetch fields needed for summary
      const leaves = await Leave.find(matchStage).lean();
      return this.summarizeLeaves(leaves);
    } catch (error) {
      console.log("database error from getMyLeavesCount:", error.message);
      throw new Error(error.message);
    }
  },
  async summarizeLeaves(leaves) {
    const summary = {
      totalLeaves: 0,
      Unplanned: 0,
      Planned: 0,
      Sick: 0,
      Maternity: 0,
      Paternity: 0,
    };
    if (leaves.length > 0) {
      for (const leave of leaves) {
        const count = parseFloat(leave.totalDays || 0);

        summary.totalLeaves += count;

        if (summary.hasOwnProperty(leave.leaveType)) {
          summary[leave.leaveType] += count;
        }
      }
    }
    return summary;
  },
  async getMyLeaves(
    SITE_DB_NAME,
    userId,
    selectionType,
    monthYear,
    deleteFlag,
    pagination
  ) {
    const Leave = await LeaveModel(SITE_DB_NAME);
    const matchStage = { userId: userId, deleteFlag: deleteFlag || 0 };
    const pageSize =
      Number(pagination?.pageSize) > 0 ? Number(pagination.pageSize) : 10;
    const pageNumber =
      Number(pagination?.pageNumber) > 0 ? Number(pagination.pageNumber) : 1;

    const skip = (pageNumber - 1) * pageSize;
    if (
      selectionType === "custom" &&
      Array.isArray(monthYear) &&
      monthYear.length === 2
    ) {
      matchStage.dates = {
        $elemMatch: {
          $gte: monthYear[0],
          $lte: monthYear[1],
        },
      };
    } else if (selectionType === "month") {
      const startOfMonth = `${monthYear}-01`;
      const endOfMonth = `${monthYear}-31`;
      matchStage.dates = {
        $elemMatch: {
          $gte: startOfMonth, // "2025-07-04"
          $lte: endOfMonth, // "2025-07-10"
        },
      };
    }
    try {
      const statuses = ["Pending", "Approved", "Rejected", "Cancelled"];
      const leaveTypes = [
        "Planned",
        "Unplanned",
        "Sick",
        "Maternity",
        "Paternity",
      ];
      const dayCount = {
        $cond: [{ $eq: ["$dayType", "FullDay"] }, 1, 0.5],
      };
      const leaveCounts = await Leave.aggregate([
        { $match: matchStage },

        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            totalLeaveDays: {
              $sum: dayCount,
            },
            ...Object.fromEntries(
              statuses.map((s) => [
                s.toLowerCase(),
                {
                  $sum: {
                    $cond: [{ $eq: ["$status", s] }, dayCount, 0],
                  },
                },
              ])
            ),

            ...Object.fromEntries(
              leaveTypes.map((t) => [
                t.toLowerCase(),
                {
                  $sum: {
                    $cond: [{ $eq: ["$leaveType", t] }, dayCount, 0],
                  },
                },
              ])
            ),
          },
        },
      ]);
      const leaves = await Leave.aggregate([
        {
          $match: matchStage,
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
          $lookup: {
            from: "users",
            localField: "approvedBy",
            foreignField: "_id",
            as: "userApproveDetails",
          },
        },

        {
          $unwind: {
            path: "$userApproveDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            let: { unitIds: "$unitId", myRole: "$roleName" }, // unitId is an array in leaves
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$roleName", "Site-Owner"] }, // Always include Site-Owner
                      {
                        $and: [
                          {
                            $gt: [
                              {
                                $size: {
                                  $setIntersection: ["$unitId", "$$unitIds"],
                                },
                              },
                              0,
                            ],
                          }, // Match at least one common unit
                          { $eq: ["$activeFlag", 1] }, // Only active users
                          { $eq: ["$relievingStatus", 0] }, // Exclude relieved employees
                          {
                            $switch: {
                              branches: [
                                {
                                  case: { $eq: ["$$myRole", "Employee"] },
                                  then: {
                                    $in: [
                                      "$roleName",
                                      [
                                        "Manager",
                                        "HR-Manager",
                                        "Admin",
                                        "Site-Owner",
                                      ],
                                    ],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "Manager"] },
                                  then: {
                                    $in: [
                                      "$roleName",
                                      ["HR-Manager", "Admin", "Site-Owner"],
                                    ],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "HR-Manager"] },
                                  then: {
                                    $in: ["$roleName", ["Admin", "Site-Owner"]],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "Admin"] },
                                  then: { $eq: ["$roleName", ["Site-Owner"]] },
                                },
                              ],
                              default: false,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  designationName: 1,
                  image: 1,
                  email: 1,
                  roleName: 1,
                  unitId: 1,
                },
              },
            ],
            as: "members",
          },
        },
        {
          $addFields: {
            userDetails: { $ifNull: ["$userDetails", null] },
            userName: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.name",
                else: null,
              },
            },
            userImage: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.image",
                else: null,
              },
            },
            userDesignationName: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.designationName",
                else: null,
              },
            },
            userApproveDetails: { $ifNull: ["$userApproveDetails", null] },
            userApproveName: {
              $cond: {
                if: { $ne: ["$userApproveDetails", null] },
                then: "$userApproveDetails.name",
                else: null,
              },
            },
            userApproveImage: {
              $cond: {
                if: { $ne: ["$userApproveDetails", null] },
                then: "$userApproveDetails.image",
                else: null,
              },
            },

            userApproveDesignationName: {
              $cond: {
                if: { $ne: ["$userApproveDetails", null] },
                then: "$userApproveDetails.designationName",
                else: null,
              },
            },
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
              },
            },

            formattedApprovedAt: {
              $cond: {
                if: { $eq: [{ $type: "$approvedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$approvedAt",
                  },
                },
                else: "$approvedAt",
              },
            },
            formattedAppliedAt: {
              $cond: {
                if: { $eq: [{ $type: "$appliedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$appliedAt",
                  },
                },
                else: "$appliedAt",
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
        {
          $project: {
            _id: 1,
            userId: 1,
            unitId: 1,
            roleName: 1,
            userName: 1,
            userImage: 1,
            userDesignationName: 1,
            userApproveName: 1,
            userApproveImage: 1,
            userApproveDesignationName: 1,
            leaveType: 1,
            paidLeaveCount: 1,
            maternityLeaveCount: 1,
            paternityLeaveCount: 1,
            dayType: 1,
            leaveDates: 1,
            dates: 1,
            totalDays: 1,
            reason: 1,
            status: 1,
            appliedAt: 1,
            approvedBy: 1,
            approvedAt: 1,
            documents: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            formattedAppliedAt: 1,
            formattedApprovedAt: 1,
            formattedCreatedAt: 1,
            leavesDeductionStatus: 1,
            userDetails: 1,
            userApproveDetails: 1,
            approvedByComment: 1,
            members: 1,
          },
        },
      ]);

      const defaultData = {
        totalRequests: 0,
        totalLeaveDays: 0,
        ...Object.fromEntries(statuses.map((s) => [s.toLowerCase(), 0])),
        ...Object.fromEntries(leaveTypes.map((t) => [t.toLowerCase(), 0])),
      };

      const result = leaveCounts[0] || defaultData;

      return {
        leaveCounts: result || {
          totalRequests: 0,
          totalLeaveDays: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          cancelled: 0,
          planned: 0,
          unplanned: 0,
          sick: 0,
          maternity: 0,
          paternity: 0,
        },
        leaves: leaves || [],
      };
    } catch (error) {
      console.log("database error from admin service leaves ", error.message);
      throw new Error(error.message);
    }
  },
  async getLeaves(
    SITE_DB_NAME,
    userIdCurrent,
    unitIdsCurrent,
    roleNameCurrent,
    monthYear,
    selectionType,
    deleteFlag,
    pagination
  ) {
    const Leave = await LeaveModel(SITE_DB_NAME);

    const pageSize =
      Number(pagination?.pageSize) > 0 ? Number(pagination.pageSize) : 10;
    const pageNumber =
      Number(pagination?.pageNumber) > 0 ? Number(pagination.pageNumber) : 1;

    const skip = (pageNumber - 1) * pageSize;
    let matchStage = { deleteFlag: deleteFlag || 0 };
    if (roleNameCurrent == "Site-Owner") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner"] },
      };
    } else if (roleNameCurrent == "Admin") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin"] },
      };
    } else if (roleNameCurrent == "HR-Manager") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager"] },
      };
    } else if (roleNameCurrent == "Manager") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager", "Manager"] },
      };
    } else {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        _id: userIdCurrent,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager", "Manager"] },
      };
    }

    if (
      selectionType === "custom" &&
      Array.isArray(monthYear) &&
      monthYear.length === 2
    ) {
      matchStage.dates = {
        $elemMatch: {
          $gte: monthYear[0],
          $lte: monthYear[1],
        },
      };
    } else if (selectionType === "month") {
      const startOfMonth = `${monthYear}-01`;
      const endOfMonth = `${monthYear}-31`;
      matchStage.dates = {
        $elemMatch: {
          $gte: startOfMonth, // "2025-07-04"
          $lte: endOfMonth, // "2025-07-10"
        },
      };
    }
    try {
      const statuses = ["Pending", "Approved", "Rejected", "Cancelled"];
      const leaveTypes = [
        "Planned",
        "Unplanned",
        "Sick",
        "Maternity",
        "Paternity",
      ];
      // helper to generate $cond for status / type
      const dayCount = {
        $cond: [{ $eq: ["$dayType", "FullDay"] }, 1, 0.5],
      };
      const leaveCounts = await Leave.aggregate([
        { $match: matchStage },

        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            totalLeaveDays: {
              $sum: dayCount,
            },
            ...Object.fromEntries(
              statuses.map((s) => [
                s.toLowerCase(),
                {
                  $sum: {
                    $cond: [{ $eq: ["$status", s] }, dayCount, 0],
                  },
                },
              ])
            ),

            ...Object.fromEntries(
              leaveTypes.map((t) => [
                t.toLowerCase(),
                {
                  $sum: {
                    $cond: [{ $eq: ["$leaveType", t] }, dayCount, 0],
                  },
                },
              ])
            ),
          },
        },
      ]);
      const leaves = await Leave.aggregate([
        {
          $match: matchStage,
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
        ...(roleNameCurrent === "Manager"
          ? [
              {
                $match: {
                  "userDetails.reportingManagerId": userIdCurrent,
                },
              },
            ]
          : []),
        {
          $lookup: {
            from: "users",
            localField: "approvedBy",
            foreignField: "_id",
            as: "userApproveDetails",
          },
        },

        {
          $unwind: {
            path: "$userApproveDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            let: { unitIds: "$unitId", myRole: "$roleName" }, // unitId is an array in leaves
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$roleName", "Site-Owner"] }, // Always include Site-Owner
                      {
                        $and: [
                          {
                            $gt: [
                              {
                                $size: {
                                  $setIntersection: ["$unitId", "$$unitIds"],
                                },
                              },
                              0,
                            ],
                          }, // Match at least one common unit
                          { $eq: ["$activeFlag", 1] }, // Only active users
                          { $eq: ["$relievingStatus", 0] }, // Exclude relieved employees
                          {
                            $switch: {
                              branches: [
                                {
                                  case: { $eq: ["$$myRole", "Member"] },
                                  then: {
                                    $in: [
                                      "$roleName",
                                      [
                                        "Manager",
                                        "HR-Manager",
                                        "Admin",
                                        "Site-Owner",
                                      ],
                                    ],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "Manager"] },
                                  then: {
                                    $in: [
                                      "$roleName",
                                      ["HR-Manager", "Admin", "Site-Owner"],
                                    ],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "HR-Manager"] },
                                  then: {
                                    $in: ["$roleName", ["Admin", "Site-Owner"]],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "Admin"] },
                                  then: { $eq: ["$roleName", ["Site-Owner"]] },
                                },
                              ],
                              default: false,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  designationName: 1,
                  image: 1,
                  email: 1,
                  roleName: 1,
                  unitId: 1,
                },
              },
            ],
            as: "members",
          },
        },
        {
          $addFields: {
            userDetails: { $ifNull: ["$userDetails", null] },
            userName: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.name",
                else: null,
              },
            },
            userImage: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.image",
                else: null,
              },
            },
            userDesignationName: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.designationName",
                else: null,
              },
            },
            userApproveDetails: { $ifNull: ["$userApproveDetails", null] },
            userApproveName: {
              $cond: {
                if: { $ne: ["$userApproveDetails", null] },
                then: "$userApproveDetails.name",
                else: null,
              },
            },
            userApproveImage: {
              $cond: {
                if: { $ne: ["$userApproveDetails", null] },
                then: "$userApproveDetails.image",
                else: null,
              },
            },

            userApproveDesignationName: {
              $cond: {
                if: { $ne: ["$userApproveDetails", null] },
                then: "$userApproveDetails.designationName",
                else: null,
              },
            },
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
              },
            },

            formattedApprovedAt: {
              $cond: {
                if: { $eq: [{ $type: "$approvedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$approvedAt",
                  },
                },
                else: "$approvedAt",
              },
            },
            formattedAppliedAt: {
              $cond: {
                if: { $eq: [{ $type: "$appliedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$appliedAt",
                  },
                },
                else: "$appliedAt",
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
        {
          $project: {
            _id: 1,
            userId: 1,
            unitId: 1,
            roleName: 1,
            userName: 1,
            userImage: 1,
            userDesignationName: 1,
            userApproveName: 1,
            userApproveImage: 1,
            userApproveDesignationName: 1,
            leaveType: 1,
            paidLeaveCount: 1,
            maternityLeaveCount: 1,
            paternityLeaveCount: 1,
            dayType: 1,
            leaveDates: 1,
            dates: 1,
            totalDays: 1,
            reason: 1,
            status: 1,
            appliedAt: 1,
            approvedBy: 1,
            approvedAt: 1,
            documents: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            formattedAppliedAt: 1,
            formattedApprovedAt: 1,
            formattedCreatedAt: 1,
            leavesDeductionStatus: 1,
            userDetails: 1,
            userApproveDetails: 1,
            approvedByComment: 1,
            members: 1,
          },
        },
      ]);

      const defaultData = {
        totalRequests: 0,
        totalLeaveDays: 0,
        ...Object.fromEntries(statuses.map((s) => [s.toLowerCase(), 0])),
        ...Object.fromEntries(leaveTypes.map((t) => [t.toLowerCase(), 0])),
      };

      const result = leaveCounts[0] || defaultData;

      return {
        leaveCounts: result || {
          totalRequests: 0,
          totalLeaveDays: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          cancelled: 0,
          planned: 0,
          unplanned: 0,
          sick: 0,
          maternity: 0,
          paternity: 0,
        },
        leaves: leaves || [],
      };
    } catch (error) {
      console.log("database error from admin service leaves ", error.message);
      throw new Error(error.message);
    }
  },

  async deleteLeave(SITE_DB_NAME, leaveId) {
    const Leave = await LeaveModel(SITE_DB_NAME);
    try {
      const updateStatus = await Leave.updateOne(
        { _id: leaveId },
        { $set: { deleteFlag: 1 } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service deleteLeave",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getNotificationUsersAll(
    SITE_DB_NAME,
    roleNameCurrent,
    unitIdsCurrent,
    roleIds,
    unitIds,
    deleteFlag
  ) {
    const User = await UserModel(SITE_DB_NAME);
    let matchStage = null;
    let role = null;

    if (roleNameCurrent == "Site-Owner") {
      matchStage = roleIds.includes("all")
        ? { deleteFlag: deleteFlag || 0, roleName: { $nin: ["Site-Owner"] } }
        : {
            deleteFlag: deleteFlag || 0,
            approveFlag: 1,
            roleName: { $nin: ["Site-Owner"] },
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
            approveFlag: 1,
            roleName: { $nin: ["Site-Owner", "Admin"] },
          }
        : {
            deleteFlag: deleteFlag || 0,
            approveFlag: 1,
            roleName: {
              $nin: ["Site-Owner", "Admin", "HR-Manager", "Manager"],
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
            approveFlag: 1,
            roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager"] },
          }
        : {
            deleteFlag: deleteFlag || 0,
            approveFlag: 1,
            roleName: {
              $nin: ["Site-Owner", "Admin", "HR-Manager", "Manager"],
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
            approveFlag: 1,
            roleName: {
              $nin: ["Site-Owner", "Admin", "HR-Manager", "Manager"],
            },
          }
        : {
            deleteFlag: deleteFlag || 0,
            approveFlag: 1,
            roleName: {
              $nin: ["Site-Owner", "Admin", "HR-Manager", "Manager"],
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
            approveFlag: 1,
            roleName: {
              $nin: ["Site-Owner", "Admin", "HR-Manager", "Manager"],
            },
          }
        : {
            deleteFlag: deleteFlag || 0,
            approveFlag: 1,
            roleName: {
              $nin: ["Site-Owner", "Admin", "HR-Manager", "Manager"],
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
              },
            },
            formattedlastLoginTime: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$lastLoginTime",
              },
            },
            formattedJoiningDate: {
              $cond: {
                if: { $eq: [{ $type: "$joiningDate" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$joiningDate",
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
            relievingDate: 1,
            languageId: 1,
            profileComplete: 1,
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
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getUsersByUnitIdsAndRoleAndUserId(
    SITE_DB_NAME,
    unitIdsSend,
    roleIdsSend,
    employeeIdsSend,
    roleName,
    unitIds,
    currentUserId = null
  ) {
    const User = await UserModel(SITE_DB_NAME);
    let matchStage = {
      deleteFlag: 0,
      activeFlag: 1,
      relievingStatus: 0,
      approveFlag: 1,
      _id: { $nin: [currentUserId] },
    }; // base condition

    if (
      unitIdsSend.includes("all") &&
      roleIdsSend.includes("all") &&
      employeeIdsSend.includes("all")
    ) {
      if (roleName === "Site-Owner") {
        matchStage.roleName = { $nin: ["Site-Owner"] };
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
    } else if (
      unitIdsSend.includes("all") &&
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
              },
            },
            formattedlastLoginTime: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$lastLoginTime",
              },
            },
            formattedJoiningDate: {
              $cond: {
                if: { $eq: [{ $type: "$joiningDate" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$joiningDate",
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
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getUsersAll(SITE_DB_NAME, roleNameCurrent, unitIdsCurrent, deleteFlag) {
    const User = await UserModel(SITE_DB_NAME);
    let matchStage = null;

    if (roleNameCurrent == "Site-Owner") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        approveFlag: 1,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner"] },
      };
    } else if (roleNameCurrent == "Admin") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        approveFlag: 1,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin"] },
      };
    } else if (roleNameCurrent == "HR-Manager") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        approveFlag: 1,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager"] },
      };
    } else if (roleNameCurrent == "Manager") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        approveFlag: 1,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager", "Manager"] },
      };
    } else {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        approveFlag: 1,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager", "Manager"] },
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
              },
            },
            formattedlastLoginTime: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$lastLoginTime",
              },
            },
            formattedJoiningDate: {
              $cond: {
                if: { $eq: [{ $type: "$joiningDate" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$joiningDate",
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
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getUsersByUnitIdsAndRole(SITE_DB_NAME, userUnitIds, userRole) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const roleHierarchy = {
        Employee: ["Manager", "HR-Manager", "Admin", "Site-Owner"],
        Manager: ["HR-Manager", "Admin", "Site-Owner"],
        "HR-Manager": ["Admin", "Site-Owner"],
        Admin: ["Site-Owner"],
      };

      const users = await User.find({
        $or: [
          { roleName: "Site-Owner" },
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
        error.message
      );
      throw new Error(error.message);
    }
  },
  //==================================================== Regularization request ==================================
  async addRegularization(SITE_DB_NAME, data) {
    const Regularization = await RegularizationModel(SITE_DB_NAME);
    try {
      const addStatus = await Regularization.create(data);
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from aaddRegularization", error.message);
      throw new Error(error.message);
    }
  },

  async checkRegularization(SITE_DB_NAME, regularizationId) {
    const Regularization = await RegularizationModel(SITE_DB_NAME);
    try {
      const regularizationStatus = await Regularization.findOne({
        _id: regularizationId,
        deleteFlag: 0,
        status: "Pending",
      }); // 20 seconds timeout
      if (regularizationStatus) {
        return regularizationStatus;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("regularization find db error", error.message);
      throw new Error(error.message);
    }
  },

  async checkRegularizationId(SITE_DB_NAME, regularizationId) {
    const Regularization = await RegularizationModel(SITE_DB_NAME);
    try {
      const regularizationStatus = await Regularization.findOne({
        _id: regularizationId,
        deleteFlag: 0,
      }); // 20 seconds timeout
      if (regularizationStatus) {
        return regularizationStatus;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("regularization find db error", error.message);
      throw new Error(error.message);
    }
  },

  async deleteRegularization(SITE_DB_NAME, regularizationId) {
    const Regularization = await RegularizationModel(SITE_DB_NAME);
    try {
      const updateStatus = await Regularization.updateOne(
        { _id: regularizationId },
        { $set: { deleteFlag: 1 } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service deleteRegularization",
        error.message
      );
      throw new Error(error.message);
    }
  },

  async editRegularization(SITE_DB_NAME, regularizationId, data) {
    const Regularization = await RegularizationModel(SITE_DB_NAME);
    try {
      const updateStatus = await Regularization.updateOne(
        { _id: regularizationId },
        { $set: data },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service editRegularization",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async approveRejectRegularization(SITE_DB_NAME, regularizationId, data) {
    const Regularization = await RegularizationModel(SITE_DB_NAME);
    try {
      const updateStatus = await Regularization.updateOne(
        { _id: regularizationId },
        { $set: data },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service approveRejectRegularization",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async updateDeleteFlagAttandance(SITE_DB_NAME, attendanceId) {
    const Attendance = await AttendanceModel(SITE_DB_NAME);
    try {
      // const updateStatus = await Attendance.updateOne({ _id: attendanceId }, { $set: { deleteFlag: 1 } }, { upsert: false });
      const updateStatus = await Attendance.deleteOne({ _id: attendanceId });
      if (updateStatus) {
        return updateStatus.deletedCount;
        // return updateStatus.modifiedCount; // Returns 1 if the document was updated
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service approveRejectRegularization",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async cancelRegularization(
    SITE_DB_NAME,
    regularizationId,
    status,
    approvedBy,
    approvedAt,
    approvedRoleName
  ) {
    const Regularization = await RegularizationModel(SITE_DB_NAME);
    try {
      const updateStatus = await Regularization.updateOne(
        { _id: regularizationId },
        {
          $set: {
            status,
            approvedBy,
            approvedAt,
            approvedRoleName,
            approvedStatus: status,
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
      console.log(
        "database error from admin service cancelRegularization",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getMyRegularizations(
    SITE_DB_NAME,
    userId,
    selectionType,
    monthYear,
    deleteFlag,
    pagination
  ) {
    const Regularization = await RegularizationModel(SITE_DB_NAME);
    const pageSize =
      Number(pagination?.pageSize) > 0 ? Number(pagination.pageSize) : 10;
    const pageNumber =
      Number(pagination?.pageNumber) > 0 ? Number(pagination.pageNumber) : 1;

    const skip = (pageNumber - 1) * pageSize;
    const matchStage = { userId: userId, deleteFlag: deleteFlag || 0 };

    if (
      selectionType === "custom" &&
      Array.isArray(monthYear) &&
      monthYear.length === 2
    ) {
      matchStage.date = {
        $gte: new Date(monthYear[0]), // Start Date
        $lte: new Date(monthYear[1]), // End Date
      };
    } else if (selectionType === "month") {
      const [year, month] = monthYear.split("-").map(Number);

      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      matchStage.date = { $gte: startOfMonth, $lte: endOfMonth };
    }
    try {
      const regularizationsCounts = await Regularization.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
            },
            approved: {
              $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] },
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] },
            },
          },
        },
      ]);
      const regularizations = await Regularization.aggregate([
        {
          $match: matchStage,
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
          $lookup: {
            from: "users",
            localField: "approvedBy",
            foreignField: "_id",
            as: "approveDetails",
          },
        },

        {
          $unwind: {
            path: "$approveDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "managerApprovedBy",
            foreignField: "_id",
            as: "managerApproveDetails",
          },
        },

        {
          $unwind: {
            path: "$managerApproveDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: "users",
            let: { unitIds: "$unitId", myRole: "$roleName" }, // unitId is an array in leaves
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$roleName", "Site-Owner"] }, // Always include Site-Owner
                      {
                        $and: [
                          {
                            $gt: [
                              {
                                $size: {
                                  $setIntersection: ["$unitId", "$$unitIds"],
                                },
                              },
                              0,
                            ],
                          }, // Match at least one common unit
                          { $eq: ["$activeFlag", 1] }, // Only active users
                          { $eq: ["$relievingStatus", 0] }, // Exclude relieved employees
                          {
                            $switch: {
                              branches: [
                                {
                                  case: { $eq: ["$$myRole", "Employee"] },
                                  then: {
                                    $in: [
                                      "$roleName",
                                      [
                                        "Manager",
                                        "HR-Manager",
                                        "Admin",
                                        "Site-Owner",
                                      ],
                                    ],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "Manager"] },
                                  then: {
                                    $in: [
                                      "$roleName",
                                      ["HR-Manager", "Admin", "Site-Owner"],
                                    ],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "HR-Manager"] },
                                  then: {
                                    $in: ["$roleName", ["Admin", "Site-Owner"]],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "Admin"] },
                                  then: { $eq: ["$roleName", ["Site-Owner"]] },
                                },
                              ],
                              default: false,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  designationName: 1,
                  image: 1,
                  email: 1,
                  roleName: 1,
                  unitId: 1,
                },
              },
            ],
            as: "members",
          },
        },
        {
          $addFields: {
            userDetails: { $ifNull: ["$userDetails", null] },
            userName: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.name",
                else: null,
              },
            },
            userImage: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.image",
                else: null,
              },
            },
            userDesignationName: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.designationName",
                else: null,
              },
            },

            approvedName: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.name",
                else: null,
              },
            },
            approvedImage: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.image",
                else: null,
              },
            },

            approvedDesignationName: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.designationName",
                else: null,
              },
            },
            managerApprovedName: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.name",
                else: null,
              },
            },
            managerApprovedImage: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.image",
                else: null,
              },
            },

            managerApprovedDesignationName: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.designationName",
                else: null,
              },
            },
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
              },
            },
            formattedDate: {
              $dateToString: {
                format: "%d-%m-%Y",
                date: "$date",
              },
            },

            formattedManagerApprovedAt: {
              $cond: {
                if: { $eq: [{ $type: "$managerApprovedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$managerApprovedAt",
                  },
                },
                else: "$managerApprovedAt",
              },
            },
            formattedApprovedAt: {
              $cond: {
                if: { $eq: [{ $type: "$approvedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$approvedAt",
                  },
                },
                else: "$approvedAt",
              },
            },
            formattedAppliedAt: {
              $cond: {
                if: { $eq: [{ $type: "$appliedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$appliedAt",
                  },
                },
                else: "$appliedAt",
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
        {
          $project: {
            _id: 1,
            userId: 1,
            unitId: 1,
            roleName: 1,
            userName: 1,
            userImage: 1,
            userDesignationName: 1,
            attendanceId: 1,
            date: 1,
            reason: 1,
            documents: 1,
            requestedPunches: 1,
            originalPunches: 1,
            status: 1,
            approvedRoleName: 1,
            approvedBy: 1,
            approvedStatus: 1,
            approvedName: 1,
            approvedImage: 1,
            approvedDesignationName: 1,
            approvedComment: 1,
            approvedAt: 1,

            managerApprovedBy: 1,
            managerApprovedName: 1,
            managerApprovedStatus: 1,
            managerApprovedImage: 1,
            managerApprovedDesignationName: 1,
            managerApprovedComment: 1,
            managerApprovedAt: 1,

            appliedAt: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            formattedDate: 1,
            formattedAppliedAt: 1,
            formattedApprovedAt: 1,
            formattedManagerApprovedAt: 1,
            formattedCreatedAt: 1,
            members: 1,
          },
        },
      ]);

      return {
        regularizationsCounts: regularizationsCounts[0] || {
          totalRequests: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          cancelled: 0,
        },
        regularizations: regularizations || [],
      };
    } catch (error) {
      console.log(
        "database error from admin service regularizations ",
        error.message
      );
      throw new Error(error.message);
    }
  },

  async getRegularizationRequests(
    SITE_DB_NAME,
    userIdCurrent,
    unitIdsCurrent,
    roleNameCurrent,
    selectionType,
    monthYear,
    deleteFlag,
    pagination,
    search
  ) {
    const Regularization = await RegularizationModel(SITE_DB_NAME);
    const pageSize =
      Number(pagination?.pageSize) > 0 ? Number(pagination.pageSize) : 10;
    const pageNumber =
      Number(pagination?.pageNumber) > 0 ? Number(pagination.pageNumber) : 1;

    const skip = (pageNumber - 1) * pageSize;
    let matchStage = { deleteFlag: deleteFlag || 0 };
    if (roleNameCurrent == "Site-Owner") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner"] },
      };
    } else if (roleNameCurrent == "Admin") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin"] },
      };
    } else if (roleNameCurrent == "HR-Manager") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager"] },
      };
    } else if (roleNameCurrent == "Manager") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager", "Manager"] },
      };
    } else {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        _id: userIdCurrent,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager", "Manager"] },
      };
    }
    if (
      selectionType === "custom" &&
      Array.isArray(monthYear) &&
      monthYear.length === 2
    ) {
      matchStage.date = {
        $gte: new Date(monthYear[0]), // Start Date
        $lte: new Date(monthYear[1]), // End Date
      };
    } else if (selectionType === "month") {
      const [year, month] = monthYear.split("-").map(Number);

      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      matchStage.date = { $gte: startOfMonth, $lte: endOfMonth };
    }

    try {
      const regularizationsCounts = await Regularization.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
            },
            approved: {
              $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] },
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] },
            },
          },
        },
      ]);
      const regularizations = await Regularization.aggregate([
        {
          $match: matchStage,
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
        ...(search
          ? [
              {
                $match: {
                  $or: [
                    { userName: { $regex: search, $options: "i" } },
                    { "userDetails.name": { $regex: search, $options: "i" } },
                  ],
                },
              },
            ]
          : []),
        ...(roleNameCurrent === "Manager"
          ? [
              {
                $match: {
                  "userDetails.reportingManagerId": userIdCurrent,
                },
              },
            ]
          : []),
        {
          $lookup: {
            from: "users",
            localField: "approvedBy",
            foreignField: "_id",
            as: "approveDetails",
          },
        },

        {
          $unwind: {
            path: "$approveDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "managerApprovedBy",
            foreignField: "_id",
            as: "managerApproveDetails",
          },
        },

        {
          $unwind: {
            path: "$managerApproveDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            let: { unitIds: "$unitId", myRole: "$roleName" }, // unitId is an array in leaves
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$roleName", "Site-Owner"] }, // Always include Site-Owner
                      {
                        $and: [
                          {
                            $gt: [
                              {
                                $size: {
                                  $setIntersection: ["$unitId", "$$unitIds"],
                                },
                              },
                              0,
                            ],
                          }, // Match at least one common unit
                          { $eq: ["$activeFlag", 1] }, // Only active users
                          { $eq: ["$relievingStatus", 0] }, // Exclude relieved employees
                          // Exclude relieved employees
                          {
                            $switch: {
                              branches: [
                                {
                                  case: { $eq: ["$$myRole", "Employee"] },
                                  then: {
                                    $in: [
                                      "$roleName",
                                      [
                                        "Manager",
                                        "HR-Manager",
                                        "Admin",
                                        "Site-Owner",
                                      ],
                                    ],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "Manager"] },
                                  then: {
                                    $in: [
                                      "$roleName",
                                      ["HR-Manager", "Admin", "Site-Owner"],
                                    ],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "HR-Manager"] },
                                  then: {
                                    $in: ["$roleName", ["Admin", "Site-Owner"]],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "Admin"] },
                                  then: { $eq: ["$roleName", ["Site-Owner"]] },
                                },
                              ],
                              default: false,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  designationName: 1,
                  image: 1,
                  email: 1,
                  roleName: 1,
                  unitId: 1,
                },
              },
            ],
            as: "members",
          },
        },
        {
          $addFields: {
            userDetails: { $ifNull: ["$userDetails", null] },
            finalShiftId: {
              $cond: {
                if: {
                  $gt: [{ $ifNull: ["$userDetails.shiftId", null] }, null],
                },
                then: "$userDetails.shiftId",
                else: "$shiftId",
              },
            },
            userName: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.name",
                else: null,
              },
            },
            userImage: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.image",
                else: null,
              },
            },
            userDesignationName: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.designationName",
                else: null,
              },
            },

            approvedName: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.name",
                else: null,
              },
            },
            approvedImage: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.image",
                else: null,
              },
            },

            approvedDesignationName: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.designationName",
                else: null,
              },
            },
            managerApprovedName: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.name",
                else: null,
              },
            },
            managerApprovedImage: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.image",
                else: null,
              },
            },

            managerApprovedDesignationName: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.designationName",
                else: null,
              },
            },
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
              },
            },
            formattedDate: {
              $dateToString: {
                format: "%d-%m-%Y",
                date: "$date",
              },
            },

            formattedManagerApprovedAt: {
              $cond: {
                if: { $eq: [{ $type: "$managerApprovedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$managerApprovedAt",
                  },
                },
                else: "$managerApprovedAt",
              },
            },
            formattedApprovedAt: {
              $cond: {
                if: { $eq: [{ $type: "$approvedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$approvedAt",
                  },
                },
                else: "$approvedAt",
              },
            },
            formattedAppliedAt: {
              $cond: {
                if: { $eq: [{ $type: "$appliedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$appliedAt",
                  },
                },
                else: "$appliedAt",
              },
            },
          },
        },
        {
          $lookup: {
            from: "shifts",
            localField: "finalShiftId",
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
            shiftStart: { $ifNull: ["$shiftDetails.startTime", null] },
            shiftEnd: { $ifNull: ["$shiftDetails.endTime", null] },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
        {
          $project: {
            _id: 1,
            userId: 1,
            unitId: 1,
            roleName: 1,
            userName: 1,
            userImage: 1,
            userDesignationName: 1,
            attendanceId: 1,
            date: 1,
            reason: 1,
            documents: 1,
            requestedPunches: 1,
            originalPunches: 1,
            status: 1,
            approvedRoleName: 1,
            approvedBy: 1,
            approvedStatus: 1,
            approvedName: 1,
            approvedImage: 1,
            approvedDesignationName: 1,
            approvedComment: 1,
            approvedAt: 1,

            managerApprovedBy: 1,
            managerApprovedName: 1,
            managerApprovedStatus: 1,
            managerApprovedImage: 1,
            managerApprovedDesignationName: 1,
            managerApprovedComment: 1,
            managerApprovedAt: 1,

            appliedAt: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            formattedDate: 1,
            formattedAppliedAt: 1,
            formattedApprovedAt: 1,
            formattedManagerApprovedAt: 1,
            formattedCreatedAt: 1,
            members: 1,
            finalShiftId: 1,
            shiftStart: 1,
            shiftEnd: 1,
          },
        },
      ]);

      return {
        regularizationsCounts: regularizationsCounts[0] || {
          totalRequests: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          cancelled: 0,
        },
        regularizations: regularizations || [],
      };
    } catch (error) {
      console.log(
        "database error from admin service regularizations ",
        error.message
      );
      throw new Error(error.message);
    }
  },
  //==================================================== Reimbursement request ==================================
  async addReimbursement(SITE_DB_NAME, data) {
    const Reimbursement = await ReimbursementModel(SITE_DB_NAME);
    try {
      const addStatus = await Reimbursement.create(data);
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from aaddReimbursement", error.message);
      throw new Error(error.message);
    }
  },

  async checkReimbursement(SITE_DB_NAME, reimbursementId) {
    const Reimbursement = await ReimbursementModel(SITE_DB_NAME);
    try {
      const reimbursementStatus = await Reimbursement.findOne({
        _id: reimbursementId,
        deleteFlag: 0,
      }); // 20 seconds timeout
      if (reimbursementStatus) {
        return reimbursementStatus;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("reimbursement find db error", error.message);
      throw new Error(error.message);
    }
  },

  async editReimbursement(SITE_DB_NAME, reimbursementId, data) {
    const Reimbursement = await ReimbursementModel(SITE_DB_NAME);
    try {
      const updateStatus = await Reimbursement.updateOne(
        { _id: reimbursementId },
        { $set: data },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service editReimbursement",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async approveRejectReimbursement(SITE_DB_NAME, reimbursementId, data) {
    const Reimbursement = await ReimbursementModel(SITE_DB_NAME);
    try {
      const updateStatus = await Reimbursement.updateOne(
        { _id: reimbursementId },
        { $set: data },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service approveRejectReimbursement",
        error.message
      );
      throw new Error(error.message);
    }
  },

  async cancelReimbursement(
    SITE_DB_NAME,
    reimbursementId,
    status,
    approvedBy,
    approvedAt,
    approvedRoleName
  ) {
    const Reimbursement = await ReimbursementModel(SITE_DB_NAME);
    try {
      const updateStatus = await Reimbursement.updateOne(
        { _id: reimbursementId },
        {
          $set: {
            status,
            approvedBy,
            approvedAt,
            approvedRoleName,
            approvedStatus: status,
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
      console.log(
        "database error from admin service cancelReimbursement",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getMyReimbursements(
    SITE_DB_NAME,
    userId,
    selectionType,
    monthYear,
    deleteFlag,
    pagination
  ) {
    const Reimbursement = await ReimbursementModel(SITE_DB_NAME);
    const matchStage = { userId: userId, deleteFlag: deleteFlag || 0 };

    const pageSize =
      Number(pagination?.pageSize) > 0 ? Number(pagination.pageSize) : 10;
    const pageNumber =
      Number(pagination?.pageNumber) > 0 ? Number(pagination.pageNumber) : 1;

    const skip = (pageNumber - 1) * pageSize;
    if (
      selectionType === "custom" &&
      Array.isArray(monthYear) &&
      monthYear.length === 2
    ) {
      matchStage.date = {
        $gte: new Date(monthYear[0]), // Start Date
        $lte: new Date(monthYear[1]), // End Date
      };
    } else if (selectionType === "month") {
      const [year, month] = monthYear.split("-").map(Number);

      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      matchStage.date = { $gte: startOfMonth, $lte: endOfMonth };
    }
    try {
      const reimbursementCounts = await Reimbursement.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
            },
            approved: {
              $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] },
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] },
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] },
            },
            paid: {
              $sum: { $cond: [{ $eq: ["$paidStatus", "Paid"] }, 1, 0] },
            },
            unpaid: {
              $sum: { $cond: [{ $eq: ["$paidStatus", "Unpaid"] }, 1, 0] },
            },
          },
        },
      ]);
      const reimbursements = await Reimbursement.aggregate([
        {
          $match: matchStage,
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
          $lookup: {
            from: "users",
            localField: "approvedBy",
            foreignField: "_id",
            as: "approveDetails",
          },
        },

        {
          $unwind: {
            path: "$approveDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "managerApprovedBy",
            foreignField: "_id",
            as: "managerApproveDetails",
          },
        },

        {
          $unwind: {
            path: "$managerApproveDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: "users",
            let: { unitIds: "$unitId", myRole: "$roleName" }, // unitId is an array in leaves
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$roleName", "Site-Owner"] }, // Always include Site-Owner
                      {
                        $and: [
                          {
                            $gt: [
                              {
                                $size: {
                                  $setIntersection: ["$unitId", "$$unitIds"],
                                },
                              },
                              0,
                            ],
                          }, // Match at least one common unit
                          { $eq: ["$activeFlag", 1] }, // Only active users
                          { $eq: ["$relievingStatus", 0] }, // Exclude relieved employees
                          {
                            $switch: {
                              branches: [
                                {
                                  case: { $eq: ["$$myRole", "Employee"] },
                                  then: {
                                    $in: [
                                      "$roleName",
                                      [
                                        "Manager",
                                        "HR-Manager",
                                        "Admin",
                                        "Site-Owner",
                                      ],
                                    ],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "Manager"] },
                                  then: {
                                    $in: [
                                      "$roleName",
                                      ["HR-Manager", "Admin", "Site-Owner"],
                                    ],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "HR-Manager"] },
                                  then: {
                                    $in: ["$roleName", ["Admin", "Site-Owner"]],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "Admin"] },
                                  then: { $eq: ["$roleName", ["Site-Owner"]] },
                                },
                              ],
                              default: false,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  designationName: 1,
                  image: 1,
                  email: 1,
                  roleName: 1,
                  unitId: 1,
                },
              },
            ],
            as: "members",
          },
        },
        {
          $addFields: {
            userDetails: { $ifNull: ["$userDetails", null] },
            userName: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.name",
                else: null,
              },
            },
            userImage: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.image",
                else: null,
              },
            },
            userDesignationName: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.designationName",
                else: null,
              },
            },

            approvedName: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.name",
                else: null,
              },
            },
            approvedImage: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.image",
                else: null,
              },
            },

            approvedDesignationName: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.designationName",
                else: null,
              },
            },
            managerApprovedName: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.name",
                else: null,
              },
            },
            managerApprovedImage: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.image",
                else: null,
              },
            },

            managerApprovedDesignationName: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.designationName",
                else: null,
              },
            },
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
              },
            },
            formattedDate: {
              $dateToString: {
                format: "%d-%m-%Y",
                date: "$date",
              },
            },

            formattedManagerApprovedAt: {
              $cond: {
                if: { $eq: [{ $type: "$managerApprovedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$managerApprovedAt",
                  },
                },
                else: "$managerApprovedAt",
              },
            },
            formattedApprovedAt: {
              $cond: {
                if: { $eq: [{ $type: "$approvedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$approvedAt",
                  },
                },
                else: "$approvedAt",
              },
            },
            formattedAppliedAt: {
              $cond: {
                if: { $eq: [{ $type: "$appliedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$appliedAt",
                  },
                },
                else: "$appliedAt",
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
        {
          $project: {
            _id: 1,
            userId: 1,
            unitId: 1,
            roleName: 1,
            userName: 1,
            userImage: 1,
            userDesignationName: 1,
            date: 1,
            amount: 1,
            finalAmount: 1,
            description: 1,
            documents: 1,
            status: 1,
            approvedRoleName: 1,
            approvedBy: 1,
            approvedStatus: 1,
            approvedName: 1,
            approvedImage: 1,
            approvedDesignationName: 1,
            approvedComment: 1,
            approvedAt: 1,

            managerApprovedBy: 1,
            managerApprovedName: 1,
            managerApprovedStatus: 1,
            managerApprovedImage: 1,
            managerApprovedDesignationName: 1,
            managerApprovedComment: 1,
            managerApprovedAt: 1,

            appliedAt: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            formattedDate: 1,
            formattedAppliedAt: 1,
            formattedApprovedAt: 1,
            formattedManagerApprovedAt: 1,
            formattedCreatedAt: 1,
            members: 1,
            paidMonth: 1,
            paidStatus: 1,
          },
        },
      ]);

      return {
        reimbursementCounts: reimbursementCounts[0] || {
          totalRequests: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          cancelled: 0,
          paid: 0,
          unpaid: 0,
        },
        reimbursements: reimbursements || [],
      };
    } catch (error) {
      console.log(
        "database error from admin service reimbursements ",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getReimbursementRequests(
    SITE_DB_NAME,
    userIdCurrent,
    unitIdsCurrent,
    roleNameCurrent,
    selectionType,
    monthYear,
    deleteFlag,
    pagination,
    search
  ) {
    const Reimbursement = await ReimbursementModel(SITE_DB_NAME);
    const User = await UserModel(SITE_DB_NAME);

    const pageSize =
      Number(pagination?.pageSize) > 0 ? Number(pagination.pageSize) : 10;
    const pageNumber =
      Number(pagination?.pageNumber) > 0 ? Number(pagination.pageNumber) : 1;

    const skip = (pageNumber - 1) * pageSize;
    let matchStage = { deleteFlag: deleteFlag || 0 };
    if (roleNameCurrent == "Site-Owner") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner"] },
      };
    } else if (roleNameCurrent == "Admin") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin"] },
      };
    } else if (roleNameCurrent == "HR-Manager") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager"] },
      };
    } else if (roleNameCurrent == "Manager") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager", "Manager"] },
      };
    } else {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        _id: userIdCurrent,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager", "Manager"] },
      };
    }

    if (
      selectionType === "custom" &&
      Array.isArray(monthYear) &&
      monthYear.length === 2
    ) {
      matchStage.date = {
        $gte: new Date(monthYear[0]), // Start Date
        $lte: new Date(monthYear[1]), // End Date
      };
    } else if (selectionType === "month") {
      const [year, month] = monthYear.split("-").map(Number);

      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      matchStage.date = { $gte: startOfMonth, $lte: endOfMonth };
    }

    try {
      const reimbursementCounts = await Reimbursement.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
            },
            approved: {
              $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] },
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] },
            },
            paid: {
              $sum: { $cond: [{ $eq: ["$paidStatus", "Paid"] }, 1, 0] },
            },
            unpaid: {
              $sum: { $cond: [{ $eq: ["$paidStatus", "Unpaid"] }, 1, 0] },
            },
          },
        },
      ]);
      const reimbursements = await Reimbursement.aggregate([
        {
          $match: matchStage,
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
        ...(search
          ? [
              {
                $match: {
                  $or: [
                    { userName: { $regex: search, $options: "i" } },
                    { "userDetails.name": { $regex: search, $options: "i" } },
                  ],
                },
              },
            ]
          : []),
        ...(roleNameCurrent === "Manager"
          ? [
              {
                $match: {
                  "userDetails.reportingManagerId": userIdCurrent,
                },
              },
            ]
          : []),
        {
          $lookup: {
            from: "users",
            localField: "approvedBy",
            foreignField: "_id",
            as: "approveDetails",
          },
        },

        {
          $unwind: {
            path: "$approveDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "managerApprovedBy",
            foreignField: "_id",
            as: "managerApproveDetails",
          },
        },

        {
          $unwind: {
            path: "$managerApproveDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            let: { unitIds: "$unitId", myRole: "$roleName" }, // unitId is an array in leaves
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$roleName", "Site-Owner"] }, // Always include Site-Owner
                      {
                        $and: [
                          {
                            $gt: [
                              {
                                $size: {
                                  $setIntersection: ["$unitId", "$$unitIds"],
                                },
                              },
                              0,
                            ],
                          }, // Match at least one common unit
                          { $eq: ["$activeFlag", 1] }, // Only active users
                          { $eq: ["$relievingStatus", 0] }, // Exclude relieved employees
                          // Exclude relieved employees
                          {
                            $switch: {
                              branches: [
                                {
                                  case: { $eq: ["$$myRole", "Employee"] },
                                  then: {
                                    $in: [
                                      "$roleName",
                                      [
                                        "Manager",
                                        "HR-Manager",
                                        "Admin",
                                        "Site-Owner",
                                      ],
                                    ],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "Manager"] },
                                  then: {
                                    $in: [
                                      "$roleName",
                                      ["HR-Manager", "Admin", "Site-Owner"],
                                    ],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "HR-Manager"] },
                                  then: {
                                    $in: ["$roleName", ["Admin", "Site-Owner"]],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "Admin"] },
                                  then: { $eq: ["$roleName", ["Site-Owner"]] },
                                },
                              ],
                              default: false,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  designationName: 1,
                  image: 1,
                  email: 1,
                  roleName: 1,
                  unitId: 1,
                },
              },
            ],
            as: "members",
          },
        },
        {
          $addFields: {
            userDetails: { $ifNull: ["$userDetails", null] },
            finalShiftId: {
              $cond: {
                if: {
                  $gt: [{ $ifNull: ["$userDetails.shiftId", null] }, null],
                },
                then: "$userDetails.shiftId",
                else: "$shiftId",
              },
            },
            userName: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.name",
                else: null,
              },
            },
            userImage: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.image",
                else: null,
              },
            },
            userDesignationName: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.designationName",
                else: null,
              },
            },

            approvedName: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.name",
                else: null,
              },
            },
            approvedImage: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.image",
                else: null,
              },
            },

            approvedDesignationName: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.designationName",
                else: null,
              },
            },
            managerApprovedName: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.name",
                else: null,
              },
            },
            managerApprovedImage: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.image",
                else: null,
              },
            },

            managerApprovedDesignationName: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.designationName",
                else: null,
              },
            },
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
              },
            },
            formattedDate: {
              $dateToString: {
                format: "%d-%m-%Y",
                date: "$date",
              },
            },

            formattedManagerApprovedAt: {
              $cond: {
                if: { $eq: [{ $type: "$managerApprovedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$managerApprovedAt",
                  },
                },
                else: "$managerApprovedAt",
              },
            },
            formattedApprovedAt: {
              $cond: {
                if: { $eq: [{ $type: "$approvedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$approvedAt",
                  },
                },
                else: "$approvedAt",
              },
            },
            formattedAppliedAt: {
              $cond: {
                if: { $eq: [{ $type: "$appliedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$appliedAt",
                  },
                },
                else: "$appliedAt",
              },
            },
          },
        },
        {
          $lookup: {
            from: "shifts",
            localField: "finalShiftId",
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
            shiftStart: { $ifNull: ["$shiftDetails.startTime", null] },
            shiftEnd: { $ifNull: ["$shiftDetails.endTime", null] },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
        {
          $project: {
            _id: 1,
            userId: 1,
            unitId: 1,
            roleName: 1,
            userName: 1,
            userImage: 1,
            userDesignationName: 1,
            date: 1,
            amount: 1,
            finalAmount: 1,
            description: 1,
            documents: 1,
            status: 1,
            approvedRoleName: 1,
            approvedBy: 1,
            approvedStatus: 1,
            approvedName: 1,
            approvedImage: 1,
            approvedDesignationName: 1,
            approvedComment: 1,
            approvedAt: 1,
            managerApprovedBy: 1,
            managerApprovedName: 1,
            managerApprovedStatus: 1,
            managerApprovedImage: 1,
            managerApprovedDesignationName: 1,
            managerApprovedComment: 1,
            managerApprovedAt: 1,
            appliedAt: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            formattedDate: 1,
            formattedAppliedAt: 1,
            formattedApprovedAt: 1,
            formattedManagerApprovedAt: 1,
            formattedCreatedAt: 1,
            members: 1,
            finalShiftId: 1,
            shiftStart: 1,
            shiftEnd: 1,
            paidMonth: 1,
            paidStatus: 1,
          },
        },
      ]);

      return {
        reimbursementCounts: reimbursementCounts[0] || {
          totalRequests: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          cancelled: 0,
          paid: 0,
          unpaid: 0,
        },
        reimbursements: reimbursements || [],
      };
    } catch (error) {
      console.log(
        "database error from admin service reimbursements ",
        error.message
      );
      throw new Error(error.message);
    }
  },
  //==================================================== Incentive request ==================================
  async addIncentive(SITE_DB_NAME, data) {
    const Incentive = await IncentiveModel(SITE_DB_NAME);
    try {
      const addStatus = await Incentive.create(data);
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from aaddIncentive", error.message);
      throw new Error(error.message);
    }
  },

  async checkIncentive(SITE_DB_NAME, incentiveId) {
    const Incentive = await IncentiveModel(SITE_DB_NAME);
    try {
      const incentiveStatus = await Incentive.findOne({
        _id: incentiveId,
        deleteFlag: 0,
      }); // 20 seconds timeout
      if (incentiveStatus) {
        return incentiveStatus;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("incentive find db error", error.message);
      throw new Error(error.message);
    }
  },

  async editIncentive(SITE_DB_NAME, incentiveId, data) {
    const Incentive = await IncentiveModel(SITE_DB_NAME);
    try {
      const updateStatus = await Incentive.updateOne(
        { _id: incentiveId },
        { $set: data },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service editIncentive",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async approveRejectIncentive(SITE_DB_NAME, incentiveId, data) {
    const Incentive = await IncentiveModel(SITE_DB_NAME);
    try {
      const updateStatus = await Incentive.updateOne(
        { _id: incentiveId },
        { $set: data },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service approveRejectIncentive",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async cancelIncentive(
    SITE_DB_NAME,
    incentiveId,
    status,
    approvedBy,
    approvedAt,
    approvedRoleName
  ) {
    const Incentive = await IncentiveModel(SITE_DB_NAME);
    try {
      const updateStatus = await Incentive.updateOne(
        { _id: incentiveId },
        {
          $set: {
            status,
            approvedBy,
            approvedAt,
            approvedRoleName,
            approvedStatus: status,
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
      console.log(
        "database error from admin service cancelIncentive",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async deleteIncentive(SITE_DB_NAME, incentiveId) {
    const Incentive = await IncentiveModel(SITE_DB_NAME);
    try {
      const updateStatus = await Incentive.updateOne(
        { _id: incentiveId },
        { $set: { deleteFlag: 1 } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service deleteIncentive",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getReimbursementsAmountByMonth(SITE_DB_NAME, userId, monthYear) {
    const Reimbursement = await ReimbursementModel(SITE_DB_NAME);
    const matchStage = {
      userId: userId,
      status: "Approved",
      paidStatus: "Paid",
      paidMonth: monthYear,
      deleteFlag: 0,
    };
    try {
      const Reimbursements = await Reimbursement.find(matchStage).lean();
      const totalAmount = Reimbursements.reduce((sum, Reimbursement) => {
        return sum + (Reimbursement.finalAmount || 0);
      }, 0);
      return {
        totalAmount,
        Reimbursements: Reimbursements,
      };
    } catch (error) {
      console.log(
        "Database error from admin service Reimbursements:",
        error.message
      );
      throw new Error(error.message);
    }
  },

  async getIncentivesAmountByMonth(SITE_DB_NAME, userId, monthYear) {
    const Incentive = await IncentiveModel(SITE_DB_NAME);
    const matchStage = {
      userId: userId,
      status: "Approved",
      paidStatus: "Paid",
      paidMonth: monthYear,
      deleteFlag: 0,
    };
    try {
      const incentives = await Incentive.find(matchStage).lean();
      const totalAmount = incentives.reduce((sum, incentive) => {
        return sum + (incentive.finalAmount || 0);
      }, 0);
      return {
        totalAmount,
        incentives: incentives,
      };
    } catch (error) {
      console.log(
        "Database error from admin service incentives:",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getIncentivesByMonth(
    SITE_DB_NAME,
    userId,
    selectionType,
    monthYear,
    deleteFlag
  ) {
    const Incentive = await IncentiveModel(SITE_DB_NAME);
    const matchStage = {
      userId: userId,
      levelName: "attendance", // <--- Added this
      deleteFlag: deleteFlag || 0,
    };

    const [year, month] = monthYear.split("-");
    const startOfMonth = moment(`${year}-${month}-01`)
      .startOf("month")
      .toDate();
    const endOfMonth = moment(`${year}-${month}-01`).endOf("month").toDate();
    matchStage.appliedAt = { $gte: startOfMonth, $lte: endOfMonth };

    try {
      const incentive = await Incentive.findOne(matchStage).lean();
      return incentive || null;
    } catch (error) {
      console.log(
        "Database error from admin service incentives:",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getMyIncentives(
    SITE_DB_NAME,
    userId,
    selectionType,
    monthYear,
    deleteFlag,
    pagination
  ) {
    const Incentive = await IncentiveModel(SITE_DB_NAME);
    const pageSize =
      Number(pagination?.pageSize) > 0 ? Number(pagination.pageSize) : 10;
    const pageNumber =
      Number(pagination?.pageNumber) > 0 ? Number(pagination.pageNumber) : 1;

    const skip = (pageNumber - 1) * pageSize;
    const matchStage = {
      userId: userId,
      deleteFlag: deleteFlag || 0,
      leaveName: { $ne: "attendance" },
    };

    if (
      selectionType === "custom" &&
      Array.isArray(monthYear) &&
      monthYear.length === 2
    ) {
      matchStage.appliedAt = {
        $gte: new Date(monthYear[0]), // Start Date
        $lte: new Date(monthYear[1]), // End Date
      };
    } else if (selectionType === "month") {
      const [year, month] = monthYear.split("-").map(Number);

      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      matchStage.appliedAt = { $gte: startOfMonth, $lte: endOfMonth };
    }
    try {
      const incentiveCounts = await Incentive.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
            },
            approved: {
              $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] },
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] },
            },
            paid: {
              $sum: { $cond: [{ $eq: ["$paidStatus", "Paid"] }, 1, 0] },
            },
            unpaid: {
              $sum: { $cond: [{ $eq: ["$paidStatus", "Unpaid"] }, 1, 0] },
            },
          },
        },
      ]);
      const incentives = await Incentive.aggregate([
        {
          $match: matchStage,
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
          $lookup: {
            from: "users",
            localField: "approvedBy",
            foreignField: "_id",
            as: "approveDetails",
          },
        },

        {
          $unwind: {
            path: "$approveDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "managerApprovedBy",
            foreignField: "_id",
            as: "managerApproveDetails",
          },
        },

        {
          $unwind: {
            path: "$managerApproveDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: "users",
            let: { unitIds: "$unitId", myRole: "$roleName" }, // unitId is an array in leaves
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$roleName", "Site-Owner"] }, // Always include Site-Owner
                      {
                        $and: [
                          {
                            $gt: [
                              {
                                $size: {
                                  $setIntersection: ["$unitId", "$$unitIds"],
                                },
                              },
                              0,
                            ],
                          }, // Match at least one common unit
                          { $eq: ["$activeFlag", 1] }, // Only active users
                          { $eq: ["$relievingStatus", 0] }, // Exclude relieved employees
                          {
                            $switch: {
                              branches: [
                                {
                                  case: { $eq: ["$$myRole", "Employee"] },
                                  then: {
                                    $in: [
                                      "$roleName",
                                      [
                                        "Manager",
                                        "HR-Manager",
                                        "Admin",
                                        "Site-Owner",
                                      ],
                                    ],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "Manager"] },
                                  then: {
                                    $in: [
                                      "$roleName",
                                      ["HR-Manager", "Admin", "Site-Owner"],
                                    ],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "HR-Manager"] },
                                  then: {
                                    $in: ["$roleName", ["Admin", "Site-Owner"]],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "Admin"] },
                                  then: { $eq: ["$roleName", ["Site-Owner"]] },
                                },
                              ],
                              default: false,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  designationName: 1,
                  image: 1,
                  email: 1,
                  roleName: 1,
                  unitId: 1,
                },
              },
            ],
            as: "members",
          },
        },
        {
          $addFields: {
            userDetails: { $ifNull: ["$userDetails", null] },
            userName: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.name",
                else: null,
              },
            },
            userImage: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.image",
                else: null,
              },
            },
            userDesignationName: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.designationName",
                else: null,
              },
            },

            approvedName: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.name",
                else: null,
              },
            },
            approvedImage: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.image",
                else: null,
              },
            },

            approvedDesignationName: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.designationName",
                else: null,
              },
            },
            managerApprovedName: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.name",
                else: null,
              },
            },
            managerApprovedImage: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.image",
                else: null,
              },
            },

            managerApprovedDesignationName: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.designationName",
                else: null,
              },
            },
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
              },
            },
            formattedDate: {
              $dateToString: {
                format: "%d-%m-%Y",
                date: "$date",
              },
            },

            formattedManagerApprovedAt: {
              $cond: {
                if: { $eq: [{ $type: "$managerApprovedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$managerApprovedAt",
                  },
                },
                else: "$managerApprovedAt",
              },
            },
            formattedApprovedAt: {
              $cond: {
                if: { $eq: [{ $type: "$approvedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$approvedAt",
                  },
                },
                else: "$approvedAt",
              },
            },
            formattedAppliedAt: {
              $cond: {
                if: { $eq: [{ $type: "$appliedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$appliedAt",
                  },
                },
                else: "$appliedAt",
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
        {
          $project: {
            _id: 1,
            userId: 1,
            unitId: 1,
            shiftIncentivePolicyId: 1,
            incentivePolicyId: 1,
            shiftId: 1,
            fulllable: 1,
            lable: 1,
            levelName: 1,
            descriptionPolicy: 1,
            documentPolicy: 1,
            incentive: 1,
            targetAchieved: 1,

            roleName: 1,
            userName: 1,
            userImage: 1,
            userDesignationName: 1,
            date: 1,
            amount: 1,
            finalAmount: 1,
            description: 1,
            clientName: 1,
            projectName: 1,
            documents: 1,
            status: 1,
            approvedRoleName: 1,
            approvedBy: 1,
            approvedStatus: 1,
            approvedName: 1,
            approvedImage: 1,
            approvedDesignationName: 1,
            approvedComment: 1,
            approvedAt: 1,

            managerApprovedBy: 1,
            managerApprovedName: 1,
            managerApprovedStatus: 1,
            managerApprovedImage: 1,
            managerApprovedDesignationName: 1,
            managerApprovedComment: 1,
            managerApprovedAt: 1,

            appliedAt: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            formattedDate: 1,
            formattedAppliedAt: 1,
            formattedApprovedAt: 1,
            formattedManagerApprovedAt: 1,
            formattedCreatedAt: 1,
            members: 1,
            paidMonth: 1,
            paidStatus: 1,
          },
        },
      ]);

      return {
        incentiveCounts: incentiveCounts[0] || {
          totalRequests: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          cancelled: 0,
          paid: 0,
          unpaid: 0,
        },
        incentives: incentives || [],
      };

      if (incentives && incentives.length > 0) {
        return incentives;
      } else {
        return [];
      }
    } catch (error) {
      console.log(
        "database error from admin service incentives ",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getIncentiveRequests(
    SITE_DB_NAME,
    userIdCurrent,
    unitIdsCurrent,
    roleNameCurrent,
    selectionType,
    monthYear,
    deleteFlag,
    pagination,
    search
  ) {
    const Incentive = await IncentiveModel(SITE_DB_NAME);
    const pageSize =
      Number(pagination?.pageSize) > 0 ? Number(pagination.pageSize) : 10;
    const pageNumber =
      Number(pagination?.pageNumber) > 0 ? Number(pagination.pageNumber) : 1;

    const skip = (pageNumber - 1) * pageSize;
    let matchStage = {
      deleteFlag: deleteFlag || 0,
      levelName: { $ne: "attendance" },
    };
    if (roleNameCurrent == "Site-Owner") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner"] },
        levelName: { $ne: "attendance" },
      };
    } else if (roleNameCurrent == "Admin") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin"] },
        levelName: { $ne: "attendance" },
      };
    } else if (roleNameCurrent == "HR-Manager") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager"] },
        levelName: { $ne: "attendance" },
      };
    } else if (roleNameCurrent == "Manager") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager", "Manager"] },
        levelName: { $ne: "attendance" },
      };
    } else {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        _id: userIdCurrent,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager", "Manager"] },
        levelName: { $ne: "attendance" },
      };
    }

    if (
      selectionType === "custom" &&
      Array.isArray(monthYear) &&
      monthYear.length === 2
    ) {
      matchStage.appliedAt = {
        $gte: new Date(monthYear[0]), // Start Date
        $lte: new Date(monthYear[1]), // End Date
      };
    } else if (selectionType === "month") {
      const [year, month] = monthYear.split("-").map(Number);

      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      matchStage.appliedAt = { $gte: startOfMonth, $lte: endOfMonth };
    }

    try {
      const incentiveCounts = await Incentive.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
            },
            approved: {
              $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] },
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] },
            },
            paid: {
              $sum: { $cond: [{ $eq: ["$paidStatus", "Paid"] }, 1, 0] },
            },
            unpaid: {
              $sum: { $cond: [{ $eq: ["$paidStatus", "Unpaid"] }, 1, 0] },
            },
          },
        },
      ]);
      const incentives = await Incentive.aggregate([
        {
          $match: matchStage,
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
        ...(search
          ? [
              {
                $match: {
                  $or: [
                    { userName: { $regex: search, $options: "i" } },
                    { "userDetails.name": { $regex: search, $options: "i" } },
                  ],
                },
              },
            ]
          : []),
        ...(roleNameCurrent === "Manager"
          ? [
              {
                $match: {
                  "userDetails.reportingManagerId": userIdCurrent,
                },
              },
            ]
          : []),
        {
          $lookup: {
            from: "users",
            localField: "approvedBy",
            foreignField: "_id",
            as: "approveDetails",
          },
        },

        {
          $unwind: {
            path: "$approveDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "managerApprovedBy",
            foreignField: "_id",
            as: "managerApproveDetails",
          },
        },

        {
          $unwind: {
            path: "$managerApproveDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            let: { unitIds: "$unitId", myRole: "$roleName" }, // unitId is an array in leaves
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$roleName", "Site-Owner"] }, // Always include Site-Owner
                      {
                        $and: [
                          {
                            $gt: [
                              {
                                $size: {
                                  $setIntersection: ["$unitId", "$$unitIds"],
                                },
                              },
                              0,
                            ],
                          }, // Match at least one common unit
                          { $eq: ["$activeFlag", 1] }, // Only active users
                          { $eq: ["$relievingStatus", 0] }, // Exclude relieved employees
                          // Exclude relieved employees
                          {
                            $switch: {
                              branches: [
                                {
                                  case: { $eq: ["$$myRole", "Employee"] },
                                  then: {
                                    $in: [
                                      "$roleName",
                                      [
                                        "Manager",
                                        "HR-Manager",
                                        "Admin",
                                        "Site-Owner",
                                      ],
                                    ],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "Manager"] },
                                  then: {
                                    $in: [
                                      "$roleName",
                                      ["HR-Manager", "Admin", "Site-Owner"],
                                    ],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "HR-Manager"] },
                                  then: {
                                    $in: ["$roleName", ["Admin", "Site-Owner"]],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "Admin"] },
                                  then: { $eq: ["$roleName", ["Site-Owner"]] },
                                },
                              ],
                              default: false,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  designationName: 1,
                  image: 1,
                  email: 1,
                  roleName: 1,
                  unitId: 1,
                },
              },
            ],
            as: "members",
          },
        },
        {
          $addFields: {
            userDetails: { $ifNull: ["$userDetails", null] },
            finalShiftId: {
              $cond: {
                if: {
                  $gt: [{ $ifNull: ["$userDetails.shiftId", null] }, null],
                },
                then: "$userDetails.shiftId",
                else: "$shiftId",
              },
            },
            userName: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.name",
                else: null,
              },
            },
            userImage: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.image",
                else: null,
              },
            },
            userDesignationName: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.designationName",
                else: null,
              },
            },

            approvedName: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.name",
                else: null,
              },
            },
            approvedImage: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.image",
                else: null,
              },
            },

            approvedDesignationName: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.designationName",
                else: null,
              },
            },
            managerApprovedName: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.name",
                else: null,
              },
            },
            managerApprovedImage: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.image",
                else: null,
              },
            },

            managerApprovedDesignationName: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.designationName",
                else: null,
              },
            },
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
              },
            },
            formattedDate: {
              $dateToString: {
                format: "%d-%m-%Y",
                date: "$date",
              },
            },

            formattedManagerApprovedAt: {
              $cond: {
                if: { $eq: [{ $type: "$managerApprovedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$managerApprovedAt",
                  },
                },
                else: "$managerApprovedAt",
              },
            },
            formattedApprovedAt: {
              $cond: {
                if: { $eq: [{ $type: "$approvedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$approvedAt",
                  },
                },
                else: "$approvedAt",
              },
            },
            formattedAppliedAt: {
              $cond: {
                if: { $eq: [{ $type: "$appliedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$appliedAt",
                  },
                },
                else: "$appliedAt",
              },
            },
          },
        },
        {
          $lookup: {
            from: "shifts",
            localField: "finalShiftId",
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
            shiftStart: { $ifNull: ["$shiftDetails.startTime", null] },
            shiftEnd: { $ifNull: ["$shiftDetails.endTime", null] },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
        {
          $project: {
            _id: 1,
            userId: 1,
            unitId: 1,
            shiftIncentivePolicyId: 1,
            incentivePolicyId: 1,
            shiftId: 1,
            fulllable: 1,
            lable: 1,
            levelName: 1,
            descriptionPolicy: 1,
            documentPolicy: 1,
            incentive: 1,
            targetAchieved: 1,
            roleName: 1,
            userName: 1,
            userImage: 1,
            userDesignationName: 1,
            date: 1,
            amount: 1,
            finalAmount: 1,
            description: 1,
            clientName: 1,
            projectName: 1,
            documents: 1,
            status: 1,
            approvedRoleName: 1,
            approvedBy: 1,
            approvedStatus: 1,
            approvedName: 1,
            approvedImage: 1,
            approvedDesignationName: 1,
            approvedComment: 1,
            approvedAt: 1,
            managerApprovedBy: 1,
            managerApprovedName: 1,
            managerApprovedStatus: 1,
            managerApprovedImage: 1,
            managerApprovedDesignationName: 1,
            managerApprovedComment: 1,
            managerApprovedAt: 1,
            appliedAt: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            formattedDate: 1,
            formattedAppliedAt: 1,
            formattedApprovedAt: 1,
            formattedManagerApprovedAt: 1,
            formattedCreatedAt: 1,
            members: 1,
            finalShiftId: 1,
            shiftStart: 1,
            shiftEnd: 1,
            paidMonth: 1,
            paidStatus: 1,
          },
        },
      ]);

      return {
        incentiveCounts: incentiveCounts[0] || {
          totalRequests: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          cancelled: 0,
          paid: 0,
          unpaid: 0,
        },
        incentives: incentives || [],
      };
    } catch (error) {
      console.log(
        "database error from admin service incentives ",
        error.message
      );
      throw new Error(error.message);
    }
  },
  //==================================================== Compoff request ==================================
  async addCompoff(SITE_DB_NAME, data) {
    const Compoff = await CompoffModel(SITE_DB_NAME);
    try {
      const addStatus = await Compoff.create(data);
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from aaddCompoff", error.message);
      throw new Error(error.message);
    }
  },

  async checkCompoff(SITE_DB_NAME, compoffId) {
    const Compoff = await CompoffModel(SITE_DB_NAME);
    try {
      const compoffStatus = await Compoff.findOne({
        _id: compoffId,
        deleteFlag: 0,
      });
      if (compoffStatus) {
        return compoffStatus;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("compoff find db error", error.message);
      throw new Error(error.message);
    }
  },

  async editCompoff(SITE_DB_NAME, compoffId, data) {
    const Compoff = await CompoffModel(SITE_DB_NAME);
    try {
      const updateStatus = await Compoff.updateOne(
        { _id: compoffId },
        { $set: data },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service editCompoff",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async approveRejectCompoff(SITE_DB_NAME, compoffId, data) {
    const Compoff = await CompoffModel(SITE_DB_NAME);
    try {
      const updateStatus = await Compoff.updateOne(
        { _id: compoffId },
        { $set: data },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service approveRejectCompoff",
        error.message
      );
      throw new Error(error.message);
    }
  },

  async deleteCompoff(SITE_DB_NAME, compoffId) {
    const Compoff = await CompoffModel(SITE_DB_NAME);
    try {
      const updateStatus = await Compoff.updateOne(
        { _id: compoffId },
        { $set: { deleteFlag: 1 } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service deleteCompoff",
        error.message
      );
      throw new Error(error.message);
    }
  },

  async cancelCompoff(
    SITE_DB_NAME,
    compoffId,
    status,
    approvedBy,
    approvedAt,
    approvedRoleName
  ) {
    const Compoff = await CompoffModel(SITE_DB_NAME);
    try {
      const updateStatus = await Compoff.updateOne(
        { _id: compoffId },
        {
          $set: {
            status,
            approvedBy,
            approvedAt,
            approvedRoleName,
            approvedStatus: status,
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
      console.log(
        "database error from admin service cancelCompoff",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async compoffByMonth(
    SITE_DB_NAME,
    userId,
    selectionType,
    monthYear,
    deleteFlag
  ) {
    const Compoff = await CompoffModel(SITE_DB_NAME);
    try {
      const [year, month] = monthYear.split("-");
      const startOfMonth = moment(`${year}-${month}-01`)
        .startOf("month")
        .toDate();
      const endOfMonth = moment(`${year}-${month}-01`).endOf("month").toDate(); // Last day of the month
      // matchStage.date = { $gte: startOfMonth, $lte: endOfMonth };
      const compoffs = await Compoff.find({
        userId: userId,
        status: { $in: ["Approved"] },
        // paidStatus: { $in: ["Paid"] },
        dayType: { $in: ["Full Day", "Half Day"] },
        deleteFlag: deleteFlag || 0,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      }).sort({ date: 1 });

      // Count calculation
      let totalCount = 0;
      compoffs.forEach((c) => {
        totalCount += c.dayType === "Full Day" ? 1 : 0.5;
      });

      return { compoffs, totalCount };
    } catch (error) {
      console.log("compoffByMonth find db error", error.message);
      throw new Error(error.message);
    }
  },
  async getMyCompoffs(
    SITE_DB_NAME,
    userId,
    selectionType,
    monthYear,
    deleteFlag,
    pagination
  ) {
    const Compoff = await CompoffModel(SITE_DB_NAME);
    const pageSize =
      Number(pagination?.pageSize) > 0 ? Number(pagination.pageSize) : 10;
    const pageNumber =
      Number(pagination?.pageNumber) > 0 ? Number(pagination.pageNumber) : 1;

    const skip = (pageNumber - 1) * pageSize;
    const matchStage = { userId: userId, deleteFlag: deleteFlag || 0 };

    if (
      selectionType === "custom" &&
      Array.isArray(monthYear) &&
      monthYear.length === 2
    ) {
      matchStage.date = {
        $gte: new Date(monthYear[0]), // Start Date
        $lte: new Date(monthYear[1]), // End Date
      };
    } else if (selectionType === "month") {
      const [year, month] = monthYear.split("-").map(Number);

      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      matchStage.date = { $gte: startOfMonth, $lte: endOfMonth };
    }
    try {
      const compoffCounts = await Compoff.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
            },
            approved: {
              $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] },
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] },
            },
            paid: {
              $sum: { $cond: [{ $eq: ["$paidStatus", "Paid"] }, 1, 0] },
            },
            unpaid: {
              $sum: { $cond: [{ $eq: ["$paidStatus", "Unpaid"] }, 1, 0] },
            },
          },
        },
      ]);
      const compoffs = await Compoff.aggregate([
        {
          $match: matchStage,
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
          $lookup: {
            from: "users",
            localField: "approvedBy",
            foreignField: "_id",
            as: "approveDetails",
          },
        },

        {
          $unwind: {
            path: "$approveDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "managerApprovedBy",
            foreignField: "_id",
            as: "managerApproveDetails",
          },
        },

        {
          $unwind: {
            path: "$managerApproveDetails",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: "users",
            let: { unitIds: "$unitId", myRole: "$roleName" }, // unitId is an array in leaves
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$roleName", "Site-Owner"] }, // Always include Site-Owner
                      {
                        $and: [
                          {
                            $gt: [
                              {
                                $size: {
                                  $setIntersection: ["$unitId", "$$unitIds"],
                                },
                              },
                              0,
                            ],
                          }, // Match at least one common unit
                          { $eq: ["$activeFlag", 1] }, // Only active users
                          { $eq: ["$relievingStatus", 0] }, // Exclude relieved employees
                          {
                            $switch: {
                              branches: [
                                {
                                  case: { $eq: ["$$myRole", "Employee"] },
                                  then: {
                                    $in: [
                                      "$roleName",
                                      [
                                        "Manager",
                                        "HR-Manager",
                                        "Admin",
                                        "Site-Owner",
                                      ],
                                    ],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "Manager"] },
                                  then: {
                                    $in: [
                                      "$roleName",
                                      ["HR-Manager", "Admin", "Site-Owner"],
                                    ],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "HR-Manager"] },
                                  then: {
                                    $in: ["$roleName", ["Admin", "Site-Owner"]],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "Admin"] },
                                  then: { $eq: ["$roleName", ["Site-Owner"]] },
                                },
                              ],
                              default: false,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  designationName: 1,
                  image: 1,
                  email: 1,
                  roleName: 1,
                  unitId: 1,
                },
              },
            ],
            as: "members",
          },
        },
        {
          $addFields: {
            userDetails: { $ifNull: ["$userDetails", null] },
            userName: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.name",
                else: null,
              },
            },
            userImage: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.image",
                else: null,
              },
            },
            userDesignationName: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.designationName",
                else: null,
              },
            },

            approvedName: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.name",
                else: null,
              },
            },
            approvedImage: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.image",
                else: null,
              },
            },

            approvedDesignationName: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.designationName",
                else: null,
              },
            },
            managerApprovedName: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.name",
                else: null,
              },
            },
            managerApprovedImage: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.image",
                else: null,
              },
            },

            managerApprovedDesignationName: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.designationName",
                else: null,
              },
            },
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
              },
            },
            formattedDate: {
              $dateToString: {
                format: "%d-%m-%Y",
                date: "$date",
              },
            },

            formattedManagerApprovedAt: {
              $cond: {
                if: { $eq: [{ $type: "$managerApprovedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$managerApprovedAt",
                  },
                },
                else: "$managerApprovedAt",
              },
            },
            formattedApprovedAt: {
              $cond: {
                if: { $eq: [{ $type: "$approvedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$approvedAt",
                  },
                },
                else: "$approvedAt",
              },
            },
            formattedAppliedAt: {
              $cond: {
                if: { $eq: [{ $type: "$appliedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$appliedAt",
                  },
                },
                else: "$appliedAt",
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
        {
          $project: {
            _id: 1,
            userId: 1,
            unitId: 1,
            roleName: 1,
            userName: 1,
            userImage: 1,
            userDesignationName: 1,
            date: 1,
            attendanceId: 1,
            originalPunches: 1,
            type: 1,
            dayType: 1,
            workedMin: 1,
            amount: 1,
            finalAmount: 1,
            description: 1,
            documents: 1,
            status: 1,
            approvedRoleName: 1,
            approvedBy: 1,
            approvedStatus: 1,
            approvedName: 1,
            approvedImage: 1,
            approvedDesignationName: 1,
            approvedComment: 1,
            approvedAt: 1,

            managerApprovedBy: 1,
            managerApprovedName: 1,
            managerApprovedStatus: 1,
            managerApprovedImage: 1,
            managerApprovedDesignationName: 1,
            managerApprovedComment: 1,
            managerApprovedAt: 1,

            appliedAt: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            formattedDate: 1,
            formattedAppliedAt: 1,
            formattedApprovedAt: 1,
            formattedManagerApprovedAt: 1,
            formattedCreatedAt: 1,
            members: 1,
            paidMonth: 1,
            paidStatus: 1,
          },
        },
      ]);
      return {
        compoffCounts: compoffCounts[0] || {
          totalRequests: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          cancelled: 0,
          paid: 0,
          unpaid: 0,
        },
        compoffs: compoffs || [],
      };
    } catch (error) {
      console.log("database error from admin service compoffs ", error.message);
      throw new Error(error.message);
    }
  },
  async getCompoffRequests(
    SITE_DB_NAME,
    userIdCurrent,
    unitIdsCurrent,
    roleNameCurrent,
    selectionType,
    monthYear,
    deleteFlag,
    pagination,
    search
  ) {
    const Compoff = await CompoffModel(SITE_DB_NAME);
    let matchStage = { deleteFlag: deleteFlag || 0 };
    const pageSize =
      Number(pagination?.pageSize) > 0 ? Number(pagination.pageSize) : 10;
    const pageNumber =
      Number(pagination?.pageNumber) > 0 ? Number(pagination.pageNumber) : 1;

    const skip = (pageNumber - 1) * pageSize;
    if (roleNameCurrent == "Site-Owner") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner"] },
      };
    } else if (roleNameCurrent == "Admin") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin"] },
      };
    } else if (roleNameCurrent == "HR-Manager") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager"] },
      };
    } else if (roleNameCurrent == "Manager") {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager", "Manager"] },
      };
    } else {
      matchStage = {
        deleteFlag: deleteFlag || 0,
        _id: userIdCurrent,
        unitId: { $in: unitIdsCurrent },
        roleName: { $nin: ["Site-Owner", "Admin", "HR-Manager", "Manager"] },
      };
    }

    if (
      selectionType === "custom" &&
      Array.isArray(monthYear) &&
      monthYear.length === 2
    ) {
      matchStage.date = {
        $gte: new Date(monthYear[0]), // Start Date
        $lte: new Date(monthYear[1]), // End Date
      };
    } else if (selectionType === "month") {
      const [year, month] = monthYear.split("-").map(Number);

      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

      matchStage.date = { $gte: startOfMonth, $lte: endOfMonth };
    }

    try {
      const compoffCounts = await Compoff.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
            },
            approved: {
              $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] },
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] },
            },
            paid: {
              $sum: { $cond: [{ $eq: ["$paidStatus", "Paid"] }, 1, 0] },
            },
            unpaid: {
              $sum: { $cond: [{ $eq: ["$paidStatus", "Unpaid"] }, 1, 0] },
            },
          },
        },
      ]);

      const compoffs = await Compoff.aggregate([
        {
          $match: matchStage,
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
        ...(search
          ? [
              {
                $match: {
                  $or: [
                    { userName: { $regex: search, $options: "i" } },
                    { "userDetails.name": { $regex: search, $options: "i" } },
                  ],
                },
              },
            ]
          : []),
        ...(roleNameCurrent === "Manager"
          ? [
              {
                $match: {
                  "userDetails.reportingManagerId": userIdCurrent,
                },
              },
            ]
          : []),
        {
          $lookup: {
            from: "users",
            localField: "approvedBy",
            foreignField: "_id",
            as: "approveDetails",
          },
        },

        {
          $unwind: {
            path: "$approveDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "managerApprovedBy",
            foreignField: "_id",
            as: "managerApproveDetails",
          },
        },

        {
          $unwind: {
            path: "$managerApproveDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            let: { unitIds: "$unitId", myRole: "$roleName" }, // unitId is an array in leaves
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ["$roleName", "Site-Owner"] }, // Always include Site-Owner
                      {
                        $and: [
                          {
                            $gt: [
                              {
                                $size: {
                                  $setIntersection: ["$unitId", "$$unitIds"],
                                },
                              },
                              0,
                            ],
                          }, // Match at least one common unit
                          { $eq: ["$activeFlag", 1] }, // Only active users
                          { $eq: ["$relievingStatus", 0] }, // Exclude relieved employees
                          // Exclude relieved employees
                          {
                            $switch: {
                              branches: [
                                {
                                  case: { $eq: ["$$myRole", "Employee"] },
                                  then: {
                                    $in: [
                                      "$roleName",
                                      [
                                        "Manager",
                                        "HR-Manager",
                                        "Admin",
                                        "Site-Owner",
                                      ],
                                    ],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "Manager"] },
                                  then: {
                                    $in: [
                                      "$roleName",
                                      ["HR-Manager", "Admin", "Site-Owner"],
                                    ],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "HR-Manager"] },
                                  then: {
                                    $in: ["$roleName", ["Admin", "Site-Owner"]],
                                  },
                                },
                                {
                                  case: { $eq: ["$$myRole", "Admin"] },
                                  then: { $eq: ["$roleName", ["Site-Owner"]] },
                                },
                              ],
                              default: false,
                            },
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  designationName: 1,
                  image: 1,
                  email: 1,
                  roleName: 1,
                  unitId: 1,
                },
              },
            ],
            as: "members",
          },
        },
        {
          $addFields: {
            userDetails: { $ifNull: ["$userDetails", null] },
            finalShiftId: {
              $cond: {
                if: {
                  $gt: [{ $ifNull: ["$userDetails.shiftId", null] }, null],
                },
                then: "$userDetails.shiftId",
                else: "$shiftId",
              },
            },
            userName: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.name",
                else: null,
              },
            },
            userImage: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.image",
                else: null,
              },
            },
            userDesignationName: {
              $cond: {
                if: { $ne: ["$userDetails", null] },
                then: "$userDetails.designationName",
                else: null,
              },
            },

            approvedName: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.name",
                else: null,
              },
            },
            approvedImage: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.image",
                else: null,
              },
            },

            approvedDesignationName: {
              $cond: {
                if: { $ne: ["$approveDetails", null] },
                then: "$approveDetails.designationName",
                else: null,
              },
            },
            managerApprovedName: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.name",
                else: null,
              },
            },
            managerApprovedImage: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.image",
                else: null,
              },
            },

            managerApprovedDesignationName: {
              $cond: {
                if: { $ne: ["$managerApproveDetails", null] },
                then: "$managerApproveDetails.designationName",
                else: null,
              },
            },
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
              },
            },
            formattedDate: {
              $dateToString: {
                format: "%d-%m-%Y",
                date: "$date",
              },
            },

            formattedManagerApprovedAt: {
              $cond: {
                if: { $eq: [{ $type: "$managerApprovedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$managerApprovedAt",
                  },
                },
                else: "$managerApprovedAt",
              },
            },
            formattedApprovedAt: {
              $cond: {
                if: { $eq: [{ $type: "$approvedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$approvedAt",
                  },
                },
                else: "$approvedAt",
              },
            },
            formattedAppliedAt: {
              $cond: {
                if: { $eq: [{ $type: "$appliedAt" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y %H:%M",
                    date: "$appliedAt",
                  },
                },
                else: "$appliedAt",
              },
            },
          },
        },
        {
          $lookup: {
            from: "shifts",
            localField: "finalShiftId",
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
            shiftStart: { $ifNull: ["$shiftDetails.startTime", null] },
            shiftEnd: { $ifNull: ["$shiftDetails.endTime", null] },
          },
        },

        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
        {
          $project: {
            _id: 1,
            userId: 1,
            unitId: 1,
            roleName: 1,
            userName: 1,
            userImage: 1,
            userDesignationName: 1,
            attendanceId: 1,
            originalPunches: 1,
            type: 1,
            dayType: 1,
            workedMin: 1,
            date: 1,
            amount: 1,
            finalAmount: 1,
            description: 1,
            documents: 1,
            status: 1,
            approvedRoleName: 1,
            approvedBy: 1,
            approvedStatus: 1,
            approvedName: 1,
            approvedImage: 1,
            approvedDesignationName: 1,
            approvedComment: 1,
            approvedAt: 1,
            managerApprovedBy: 1,
            managerApprovedName: 1,
            managerApprovedStatus: 1,
            managerApprovedImage: 1,
            managerApprovedDesignationName: 1,
            managerApprovedComment: 1,
            managerApprovedAt: 1,
            appliedAt: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            formattedDate: 1,
            formattedAppliedAt: 1,
            formattedApprovedAt: 1,
            formattedManagerApprovedAt: 1,
            formattedCreatedAt: 1,
            members: 1,
            finalShiftId: 1,
            shiftStart: 1,
            shiftEnd: 1,
            paidMonth: 1,
            paidStatus: 1,
          },
        },
      ]);

      return {
        compoffCounts: compoffCounts[0] || {
          totalRequests: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          cancelled: 0,
          paid: 0,
          unpaid: 0,
        },
        compoffs: compoffs || [],
      };
    } catch (error) {
      console.log("database error from admin service compoffs ", error.message);
      throw new Error(error.message);
    }
  },
  // =============================================== getEmployeeForCheckStore  ======================================================
  async getEmployeeForCheckStore(SITE_DB_NAME, deleteFlag) {
    const Employee = await EmployeeModel(SITE_DB_NAME);
    try {
      const getEmployee = await Employee.find({ deleteFlag: deleteFlag });
      if (getEmployee) {
        return getEmployee;
      } else {
        return [];
      }
    } catch (error) {
      console.log(
        "database error from admin service getEmployee",
        error.message
      );
      return error.message;
    }
  },
  async storeEmployees(SITE_DB_NAME, employees) {
    const Employee = await EmployeeModel(SITE_DB_NAME);
    try {
      const getStoreEmployee = Employee.insertMany(employees);
      if (getStoreEmployee) {
        return getStoreEmployee;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service storeEmployees",
        error.message
      );
      return error.message;
    }
  },
  //================================================proccess==========================================
  async bulkAddProccess(SITE_DB_NAME, data) {
    const Proccess = await ProccessModel(SITE_DB_NAME);
    try {
      const addStatus = await Proccess.insertMany(data);
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from bulkAddProccess", error.message);
      throw new Error(error.message);
    }
  },
  async addProccess(SITE_DB_NAME, data) {
    const Proccess = await ProccessModel(SITE_DB_NAME);
    try {
      const addStatus = await Proccess.create(data);
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from addProccess", error.message);
      throw new Error(error.message);
    }
  },
  async updateLastProccess(SITE_DB_NAME, proccessId, updateData) {
    const Proccess = await ProccessModel(SITE_DB_NAME);
    try {
      const updateStatus = await Proccess.findOneAndUpdate(
        { _id: proccessId },
        { $set: updateData }
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from updateLastProccess", error.message);
      throw new Error(error.message);
    }
  },
  async getProccessSingle(SITE_DB_NAME, userId, monthYear) {
    const Proccess = await ProccessModel(SITE_DB_NAME);
    try {
      const currentProccess = await Proccess.findOne({
        userId,
        deleteFlag: 0,
        startMonth: { $lte: monthYear },
        $or: [{ endMonth: null }, { endMonth: { $gte: monthYear } }],
      })
        .populate([
          {
            path: "createdById",
            select: "name image roleName designationName",
          },
        ])
        .sort({ _id: -1 }) // ✅ latest one
        .limit(1)
        .lean();

      if (currentProccess) {
        return currentProccess;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from commen service getProccessSingle",
        error.message
      );
      return error.message;
    }
  },
  async getProccess(SITE_DB_NAME, userId) {
    const Proccess = await ProccessModel(SITE_DB_NAME);
    try {
      const currentProccess = await Proccess.find({
        userId,
        deleteFlag: 0,
      })
        .populate([
          {
            path: "createdById",
            select: "name image roleName designationName",
          },
        ])
        .sort({ _id: -1 }); // ✅ latest one
      if (currentProccess.length > 0) {
        return currentProccess;
      } else {
        return [];
      }
    } catch (error) {
      console.log(
        "database error from commen service getProccess",
        error.message
      );
      return error.message;
    }
  },
  async addMonthlyProccessSingle(SITE_DB_NAME, data) {
    const MonthlyProccess = await MonthlyProccessModel(SITE_DB_NAME);
    try {
      const addStatus = await MonthlyProccess.create(data);
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from addMonthlyProccessSingle",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async updateMonthlyProccessSingle(
    SITE_DB_NAME,
    monthlyProccessId,
    updateData
  ) {
    const MonthlyProccess = await MonthlyProccessModel(SITE_DB_NAME);
    try {
      const updateStatus = await MonthlyProccess.findOneAndUpdate(
        { _id: monthlyProccessId },
        { $set: updateData }
      );
      if (updateStatus) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from updateMonthlyProccessSingle",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async bulkUpdateMonthlyProccess(SITE_DB_NAME, filter, updateData) {
    const MonthlyProccess = await MonthlyProccessModel(SITE_DB_NAME);
    try {
      const updateStatus = await MonthlyProccess.updateMany(filter, {
        $set: updateData,
      });
      if (updateStatus.modifiedCount > 0) {
        return updateStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from bulkUpdateMonthlyProccessSingle",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getMonthlyProccess(
    SITE_DB_NAME,
    filter = {},
    search = {},
    { page = 1, limit = 500 }
  ) {
    const MonthlyProccess = await MonthlyProccessModel(SITE_DB_NAME);
    try {
      const searchText = search?.searchText || "";
      const searchColumns = search?.searchColumns || [];
      let searchConditions = [];
      if (searchText && searchColumns.length) {
        const regex = new RegExp(searchText, "i");
        searchConditions = searchColumns.map((col) => {
          return { [col]: regex };
        });
      }
      const pipeline = [
        { $match: { deleteFlag: 0, ...filter } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "users",
            localField: "lastUpdatedById",
            foreignField: "_id",
            as: "lastUpdatedDetails",
          },
        },
        {
          $unwind: {
            path: "$lastUpdatedDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "createdById",
            foreignField: "_id",
            as: "createdDetails",
          },
        },
        {
          $unwind: {
            path: "$createdDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "statusById",
            foreignField: "_id",
            as: "statusDetails",
          },
        },
        {
          $unwind: { path: "$statusDetails", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "users",
            localField: "payStatusById",
            foreignField: "_id",
            as: "payStatusDetails",
          },
        },
        {
          $unwind: {
            path: "$payStatusDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "isFrozenById",
            foreignField: "_id",
            as: "isFrozenDetails",
          },
        },
        {
          $unwind: {
            path: "$isFrozenDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "units",
            localField: "unitIds",
            foreignField: "_id",
            as: "unitsDetails",
          },
        },
        {
          $addFields: {
            formattedMonth: {
              $let: {
                vars: {
                  monthStr: { $substr: ["$month", 5, 2] }, // "08"
                  yearStr: { $substr: ["$month", 0, 4] }, // "2025"
                },
                in: {
                  $concat: [
                    {
                      $arrayElemAt: [
                        [
                          "",
                          "Jan",
                          "Feb",
                          "Mar",
                          "Apr",
                          "May",
                          "Jun",
                          "Jul",
                          "Aug",
                          "Sep",
                          "Oct",
                          "Nov",
                          "Dec",
                        ],
                        { $toInt: "$$monthStr" },
                      ],
                    },
                    " ",
                    "$$yearStr",
                  ],
                },
              },
            },
            userIdData: {
              _id: "$userDetails._id",
              name: "$userDetails.name",
              image: "$userDetails.image",
              roleName: "$userDetails.roleName",
              designationName: "$userDetails.designationName",
              email: "$userDetails.email",
              personalEmail: "$userDetails.personalEmail",
              mobile: "$userDetails.mobile",
              bankAccountNumber: "$userDetails.bankAccountNumber",
              IFSCCode: "$userDetails.IFSCCode",
              bankName: "$userDetails.bankName",
              accountHolderName: "$userDetails.accountHolderName",
              UAN: "$userDetails.UAN",
              PANNumber: "$userDetails.PANNumber",
              joiningDate: {
                $dateToString: {
                  format: "%d-%m-%Y",
                  date: "$userDetails.joiningDate",
                },
              },
              gender: "$userDetails.gender",
            },
            createdByIdData: {
              _id: "$createdDetails._id",
              name: "$createdDetails.name",
              image: "$createdDetails.image",
              designationName: "$createdDetails.designationName",
            },
            statusByIdData: {
              _id: "$statusDetails._id",
              name: "$statusDetails.name",
              image: "$statusDetails.image",
              designationName: "$statusDetails.designationName",
            },
            payStatusByIdData: {
              _id: "$payStatusDetails._id",
              name: "$payStatusDetails.name",
              image: "$payStatusDetails.image",
              designationName: "$payStatusDetails.designationName",
            },
            isFrozenByIdData: {
              _id: "$isFrozenDetails._id",
              name: "$isFrozenDetails.name",
              image: "$isFrozenDetails.image",
              designationName: "$isFrozenDetails.designationName",
            },
            lastUpdatedByIdData: {
              _id: "$lastUpdatedDetails._id",
              name: "$lastUpdatedDetails.name",
              image: "$lastUpdatedDetails.image",
              designationName: "$lastUpdatedDetails.designationName",
            },
            unitName: { $arrayElemAt: ["$unitsDetails.unitName", 0] },
          },
        },
        ...(searchConditions.length
          ? [{ $match: { $or: searchConditions } }]
          : []),
      ];

      const result = await MonthlyProccess.aggregate([
        ...pipeline,
        { $sort: { _id: -1 } },
        {
          $facet: {
            data: [
              {
                $project: {
                  _id: 1,
                  formattedMonth: 1,
                  month: 1,
                  proccessId: 1,
                  createdById: 1,
                  userId: 1,
                  uniqueId: 1,
                  unitIds: 1,
                  unitName: 1,
                  roleName: 1,
                  designationName: 1,
                  lastUpdatedById: 1,
                  status: 1,
                  statusById: 1,
                  payStatus: 1,
                  payStatusById: 1,
                  isFrozen: 1,
                  isFrozenById: 1,

                  startDate: 1,
                  endDate: 1,
                  startMonth: 1,
                  endMonth: 1,
                  remarks: 1,
                  salaryGiveByCompany: 1,
                  salaryGiveByCompanyYear: 1,
                  pfEligibility: 1,
                  esicEligibility: 1,
                  ptEligibility: 1,
                  finalBasic: 1,
                  hra: 1,
                  otherAllowance: 1,
                  grossSalary: 1,
                  actualBasicSalary: 1,
                  pfMinBasicSalary: 1,
                  esicMinGrossSalary: 1,
                  epfp: 1,
                  epf: 1,
                  esicp: 1,
                  esic: 1,
                  totalCTC: 1,
                  emppfp: 1,
                  emppf: 1,
                  empesicp: 1,
                  empesic: 1,
                  totalCTCYearly: 1,
                  pt: 1,
                  otherTDS: 1,
                  totalDeduction: 1,
                  grandTotalCTCWithDeduction: 1,
                  grandTotalCTCWithDeductionYearly: 1,

                  attendanceData: 1,
                  totalLeaveDeductionDays: 1,
                  earnCompOffDays: 1,
                  earnCompOffDaysAmount: 1,
                  earnEncashLeave: 1,
                  earnEncashLeaveAmount: 1,
                  earnLWP: 1,
                  earnLWPAmount: 1,
                  earnTotalPay: 1,
                  earnfinalBasic: 1,
                  earnhra: 1,
                  earnotherAllowance: 1,
                  earngrossSalary: 1,
                  earnactualBasicSalary: 1,
                  earnpfMinBasicSalary: 1,
                  earnesicMinGrossSalary: 1,
                  earnepfp: 1,
                  earnepf: 1,
                  earnesic: 1,
                  earnesicp: 1,
                  earntotalCTC: 1,
                  earnemppfp: 1,
                  earnemppf: 1,
                  earnempesicp: 1,
                  earnempesic: 1,
                  earnIncentiveAmount: 1,
                  earnTotalPayWithIncentive: 1,
                  earnempptDeduction: 1,
                  earnempTDSDeduction: 1,
                  earnempwelfareDeduction: 1,
                  earnempotherDeduction: 1,
                  earnempTotalDeduction: 1,
                  earnNetPay: 1,
                  earnReimbursementAmount: 1,
                  earnOtherAmount: 1,
                  earnFinalNetPay: 1,
                  ctcStatus: 1,
                  proccessArr: 1,
                  activeFlag: 1,
                  deleteFlag: 1,
                  userIdData: 1,
                  createdByIdData: 1,
                  statusByIdData: 1,
                  payStatusByIdData: 1,
                  isFrozenByIdData: 1,
                  lastUpdatedByIdData: 1,
                  createdAt: 1,
                  updatedAt: 1,
                },
              },
              { $skip: (page - 1) * limit },
              { $limit: limit },
            ],
            total: [{ $count: "count" }],
          },
        },
      ]);

      const data = result[0]?.data || [];
      const total = result[0]?.total?.[0]?.count || 0;
      return { total, page, limit, data };
    } catch (error) {
      console.log(
        "database error from commen service getMonthlyProccess",
        error.message
      );
      return error.message;
    }
  },
  async getMonthlyProccessSingle(SITE_DB_NAME, userId, monthYear) {
    const MonthlyProccess = await MonthlyProccessModel(SITE_DB_NAME);
    try {
      const currentProccess = await MonthlyProccess.findOne({
        userId,
        deleteFlag: 0,
        month: monthYear,
      })
        .populate([
          {
            path: "userId",
            select:
              "name image roleName designationName joiningDate gender email personalEmail mobile bankAccountNumber accountHolderName bankName IFSCCode UAN PANNumber",
          },
        ])
        .populate([
          {
            path: "lastUpdatedById",
            select: "name image roleName designationName",
          },
        ])
        .populate([
          {
            path: "createdById",
            select: "name image roleName designationName",
          },
        ])
        .populate([
          {
            path: "statusById",
            select: "name image roleName designationName",
          },
        ])
        .populate([
          {
            path: "payStatusById",
            select: "name image roleName designationName",
          },
        ])
        .populate([
          {
            path: "isFrozenById",
            select: "name image roleName designationName",
          },
        ])
        .populate([
          {
            path: "unitIds",
            select: "unitName",
          },
        ])
        .lean();
      // .sort({ _id: -1 }) // ✅ latest one
      // .limit(1);

      if (currentProccess) {
        currentProccess.userIdData = currentProccess.userId;
        currentProccess.userId = currentProccess.userId._id;
        currentProccess.unitName = currentProccess.unitIds[0].unitName;
        currentProccess.unitIds = currentProccess.unitIds.map((u) => u._id);
        return currentProccess;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from commen service getMonthlyProccessSingle",
        error.message
      );
      return error.message;
    }
  },

  // =============================================== attendance time calculation main ======================================================
  async calculateAttendance(
    shiftIsFixed,
    shiftStartTime,
    shiftEndTime,
    totalShiftMinute,
    lunchStartTime,
    lunchEndTime,
    totalShiftBreak,
    punches,
    breakStatusFixed,
    crossNight,
    firstHalfDayStartTime,
    firstHalfDayEndTime,
    firstHalfDuration,
    secHalfDayStartTime,
    secHalfDayEndTime,
    secHalfDuration,
    leaveArr
  ) {
    // console.log(
    //   shiftIsFixed,
    //   shiftStartTime,
    //   shiftEndTime,
    //   totalShiftMinute,
    //   lunchStartTime,
    //   lunchEndTime,
    //   totalShiftBreak,
    //   punches,
    //   breakStatusFixed,
    //   crossNight,
    //   firstHalfDayStartTime,
    //   firstHalfDayEndTime,
    //   firstHalfDuration,
    //   secHalfDayStartTime,
    //   secHalfDayEndTime,
    //   secHalfDuration,
    //   leaveArr
    // );
    if (punches.length < 2) {
      return "NA";
    }

    function getShiftDurationInMinutes(shiftStart, shiftEnd) {
      const [startHour, startMin] = shiftStart.split(":").map(Number);
      const [endHour, endMin] = shiftEnd.split(":").map(Number);

      let startTotalMin = startHour * 60 + startMin;
      let endTotalMin = endHour * 60 + endMin;

      // If end is next day (cross night)
      if (endTotalMin <= startTotalMin) {
        endTotalMin += 24 * 60; // Add 1440 minutes
      }
      return endTotalMin - startTotalMin;
    }

    // Set shift times based on day or cross-night shift
    let shiftStart = crossNight === 1 ? shiftStartTime : shiftStartTime;
    let shiftEnd = crossNight === 1 ? shiftEndTime : shiftEndTime;
    let lunchStart =
      breakStatusFixed === 1
        ? crossNight === 1
          ? lunchStartTime
          : lunchStartTime
        : "";
    let lunchEnd =
      breakStatusFixed === 1
        ? crossNight === 1
          ? lunchEndTime
          : lunchEndTime
        : "";
    let totalShiftMinutes = totalShiftMinute; // Total shift duration (8.5 hours)
    const totalShiftMAinMinutes = getShiftDurationInMinutes(
      shiftStart,
      shiftEnd
    );

    let fixedBreak = totalShiftBreak; // Fixed lunch break (always deducted)

    let totalShiftWorkingMinutes = totalShiftMinutes - fixedBreak;
    let shortLogin = 0,
      lateBy = 0,
      overtime = 0;

    // Convert time to minutes (handles cross-night shifts)
    function timeToMinutes(time, isNextDay = false) {
      let [hours, minutes] = time.split(":").map(Number);
      let totalMinutes = hours * 60 + minutes;
      return isNextDay ? totalMinutes + 1440 : totalMinutes; // Adds 24 hours for next-day times
    }
    function isNextDayTime(timeStr, refStr) {
      const [h1, m1] = timeStr.split(":").map(Number); // punch time
      const [h2, m2] = refStr.split(":").map(Number); // shift start time
      return h1 < 7;
    }
    let shiftStartMin = timeToMinutes(shiftStart);
    let shiftEndMin = timeToMinutes(shiftEnd, crossNight === 1); // Add 1440 min if night shift
    let lunchStartMin = lunchStart
      ? timeToMinutes(
          lunchStart,
          crossNight === 1 && isNextDayTime(lunchStart, shiftStart)
        )
      : 0;
    let lunchEndMin = lunchEnd
      ? timeToMinutes(
          lunchEnd,
          crossNight === 1 && isNextDayTime(lunchEnd, shiftStart)
        )
      : 0;

    // Extract punchIn and punchOut (first and last punch)
    let punchIn = punches[0];
    let punchOut = punches[punches.length - 1];

    let punchInMin = timeToMinutes(
      punchIn,
      crossNight === 1 && isNextDayTime(punchIn, shiftStart)
    );
    let punchOutMin = timeToMinutes(
      punchOut,
      crossNight === 1 && isNextDayTime(punchOut, shiftStart)
    );

    // 1. Check Late Entry & Overtime
    if (shiftIsFixed === 1) {
      if (punchInMin > shiftStartMin) {
        shortLogin += punchInMin - shiftStartMin;
      } else if (punchInMin < shiftStartMin) {
        overtime += shiftStartMin - punchInMin;
      }

      if (punchOutMin < shiftEndMin) {
        shortLogin += shiftEndMin - punchOutMin;
      } else if (punchOutMin > shiftEndMin) {
        overtime += punchOutMin - shiftEndMin;
      }
    }

    // 2. Calculate Extra Break Time (Beyond Fixed Lunch)
    for (let i = 1; i < punches.length - 1; i += 2) {
      let outTime = timeToMinutes(
        punches[i],
        crossNight === 1 && isNextDayTime(punches[i], shiftStart)
      );
      let inTime = timeToMinutes(
        punches[i + 1],
        crossNight === 1 && isNextDayTime(punches[i + 1], shiftStart)
      );

      if (outTime < lunchStartMin) {
        // Extra Break before lunch → Count in Late By
        let extraBreak = inTime - outTime;
        if (inTime > lunchStartMin) {
          // If employee returned during lunch break, exclude break period
          let breakBeforeLunch = lunchStartMin - outTime;
          let breakAfterLunch = inTime > lunchEndMin ? inTime - lunchEndMin : 0;
          lateBy += breakBeforeLunch + breakAfterLunch;
        } else {
          lateBy += extraBreak;
        }
      } else if (outTime >= lunchStartMin && outTime < lunchEndMin) {
        // If within Lunch Break, skip fixed break time
        if (inTime > lunchEndMin) {
          lateBy += inTime - lunchEndMin; // Extra late after lunch
        }
      } else if (outTime >= lunchEndMin) {
        // Extra Break after lunch → Count in Late By
        //lateBy += inTime - outTime;
        const evStart = 1020; // 17:00
        const evEnd = 1030; // 17:10
        if (breakStatusFixed && outTime < evEnd && inTime > evStart) {
          lateBy += inTime - outTime;
          const evBreakDuration =
            inTime - outTime > evEnd - evStart
              ? evEnd - evStart
              : inTime - outTime;
          lateBy -= evBreakDuration;
          //console.log("EV Break Applied. Deducted:", evBreakDuration, "minutes");
        } else {
          lateBy += inTime - outTime;
        }
      }
    }
    let takenBreak = breakStatusFixed ? fixedBreak + lateBy : lateBy;
    // Ensure fixed 30 min break is always deducted
    let isFirstHalf = punchInMin < lunchEndMin;
    let breakTime = breakStatusFixed
      ? isFirstHalf
        ? fixedBreak
        : 0
      : fixedBreak; // this condtion only manage fixed break if not fixed break then in half day leave deduct 1 hours
    // 3. Calculate Final Working Hours
    lateBy = breakStatusFixed
      ? lateBy + shortLogin
      : shortLogin + Math.max(0, lateBy - breakTime);

    if (crossNight && punchOutMin < punchInMin) punchOutMin += 1440;

    const workingMinutes = punchOutMin - punchInMin;
    const workingDuration = moment.duration(workingMinutes, "minutes");
    const workingTime = workingDuration.format("hh:mm", { trim: false });

    let totalWorkingMinutes =
      shiftIsFixed === 1
        ? totalShiftMinutes - breakTime - lateBy
        : workingMinutes - breakTime - lateBy;
    if (shiftIsFixed === 0) {
      lateBy = totalShiftMinutes - (totalWorkingMinutes + breakTime);
      shortLogin = lateBy;
    }
    const actualWorkingDuration = moment.duration(
      totalWorkingMinutes,
      "minutes"
    );
    const actualWorkingTime = actualWorkingDuration.format("hh:mm", {
      trim: false,
    });

    return {
      PunchIn: punchIn,
      PunchOut: punchOut,
      ShiftType: crossNight === 1 ? "Night Shift" : "Day Shift",
      TotalShiftMinutes: totalShiftMinutes,
      BreakTime: breakTime,
      LateBy: lateBy,
      Overtime: overtime,
      actualWorkingMinutes: totalWorkingMinutes,
      actualWorkingTime: actualWorkingTime,
      workingMinutes: workingMinutes,
      workingTime: workingTime,
      shortLogin: shortLogin,
      breakStatusFixed: breakStatusFixed,
      takenBreak: takenBreak,
      lateByEarly: shortLogin,
    };
  },
  async calculateMonthlyPaidLeaves(SITE_DB_NAME, userDetails, dayMonthYear) {
    try {
      const joiningDateStr = userDetails?.joiningDate;
      const relievingDateStr = userDetails?.relievingDate;
      const appliedLeaves = [];
      let totalAnnualPaidLeave =
        userDetails?.shiftDetails?.totalAnnualPaidLeave;
      let paidLeaveDay = userDetails?.shiftDetails?.paidLeaveDay;
      let skipPaidLeaveMonth = userDetails?.shiftDetails?.skipPaidLeaveMonth;
      let carryForwordPaidLeaveStatus =
        userDetails?.shiftDetails?.carryForwordPaidLeaveStatus;
      let joiningDatePaidLeaveDeductions =
        userDetails?.shiftDetails?.joiningDatePaidLeaveDeductions;
      let afterTwoYearExtraPaidLeave =
        userDetails?.shiftDetails?.afterTwoYearExtraPaidLeave;
      let initialThreeMonthPaidLeaveStatus =
        userDetails?.shiftDetails?.initialThreeMonthPaidLeaveStatus;
      let shortLoginDeductions =
        userDetails?.shiftDetails?.shortLoginDeductions;
      let weekWorkingDays = userDetails?.shiftDetails?.weekWorkingDays;
      let weekEnds = userDetails?.shiftDetails?.weekEnds;
      let monthlyExtraWorkingDays =
        userDetails?.shiftDetails?.monthlyExtraWorkingDays;
      let monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin;
      let holidays = userDetails?.shiftDetails?.holidays;
      let shiftId = userDetails?.shiftDetails?.shiftId;
      let salary = userDetails?.salary;
      let plannedLeaveDeduction = 1;
      let unPlannedLeaveExtraDeduction =
        userDetails?.shiftDetails?.unPlannedLeaveExtraDeduction;
      const resetLeaveAtNewYear = 1;
      const joiningDate = new Date(joiningDateStr);

      // Extra leave in the month of 2-year completion

      const relievingDate = relievingDateStr
        ? new Date(relievingDateStr)
        : new Date(new Date().getFullYear(), 11, 31);
      const relievingDateForAttendance = relievingDateStr
        ? new Date(relievingDateStr)
        : new Date();
      const appliedMap = Object.fromEntries(
        appliedLeaves.map((item) => [item.month, item.value])
      );

      function getMonthsBetween(start, end) {
        const result = [];
        let current = new Date(start.getFullYear(), start.getMonth(), 1);
        while (current <= end) {
          result.push(
            `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(
              2,
              "0"
            )}`
          );
          current.setMonth(current.getMonth() + 1);
        }
        return result;
      }

      function getDeductionFromSlab(monthlyLeaveRate, slabs, day, reverse) {
        for (const slab of slabs) {
          if (day >= slab.start && day <= slab.end) {
            return reverse ? monthlyLeaveRate - slab.deduction : slab.deduction;
          }
        }
        return 0;
      }
      // const start = joiningDateStr.getFullYear() === dayMonthYear.slice(0, 5) ? joiningDateStr : new Date(`${dayMonthYear.slice(0, 5)}01-01`);
      const start = joiningDateStr;
      let months = getMonthsBetween(start, relievingDate);
      const allpolicy = await this.checkExistPaidLeavePolicy(
        SITE_DB_NAME,
        userDetails.userId,
        months
      );
      const checkExistPaidLeave = await this.checkExistPaidLeave(
        SITE_DB_NAME,
        userDetails.userId
      );

      let carryForward = 0;
      let extraLeaveGiven = false;
      const previousMonth = moment().subtract(1, "month").format("YYYY-MM");
      const currentMonth = moment().format("YYYY-MM");
      const nextMonth = moment().add(1, "month").format("YYYY-MM");
      const currentSystemMonth = moment(currentMonth, "YYYY-MM");
      const today = moment(); // e.g., 2025-06-19
      const lockDay = 8;
      const isAfterLockDay = today.date() >= lockDay;
      const result = [];
      months = months.filter(
        (month) =>
          !checkExistPaidLeave.some(
            (item) =>
              item.month.slice(0, 4) === month.slice(0, 4) &&
              month.slice(0, 4) !== currentMonth.slice(0, 4)
          )
      );
      for (let i = 0; i < months.length; i++) {
        const isCurrentMonth = months[i] === currentMonth;
        const isPrevMonthAndBeforeLockDay =
          months[i] === previousMonth && moment().date() < 8;
        const findExistPaidLeave =
          checkExistPaidLeave.find((p) => months[i] === p.month) || null;

        const [year, month] = months[i].split("-").map(Number);
        const findPaildLeavePolicy =
          allpolicy.find((p) => months[i] === p.yearMonth) || null;

        if (findPaildLeavePolicy) {
          totalAnnualPaidLeave = findPaildLeavePolicy?.totalAnnualPaidLeave;
          paidLeaveDay = findPaildLeavePolicy?.paidLeaveDay;
          skipPaidLeaveMonth = findPaildLeavePolicy?.skipPaidLeaveMonth;
          carryForwordPaidLeaveStatus =
            findPaildLeavePolicy?.carryForwordPaidLeaveStatus;
          joiningDatePaidLeaveDeductions =
            findPaildLeavePolicy?.joiningDatePaidLeaveDeductions;
          afterTwoYearExtraPaidLeave =
            findPaildLeavePolicy?.afterTwoYearExtraPaidLeave;
          initialThreeMonthPaidLeaveStatus =
            findPaildLeavePolicy?.initialThreeMonthPaidLeaveStatus;
          shortLoginDeductions = findPaildLeavePolicy?.shortLoginDeductions;
          weekWorkingDays = findPaildLeavePolicy?.weekWorkingDays;
          weekEnds = findPaildLeavePolicy?.weekEnds;
          monthlyExtraWorkingDays =
            findPaildLeavePolicy?.monthlyExtraWorkingDays;
          monthlyExtraFreeMin = findPaildLeavePolicy?.monthlyExtraFreeMin;
          holidays = findPaildLeavePolicy?.holidays;
          shiftId = findPaildLeavePolicy?.shiftId;
          salary = findPaildLeavePolicy?.salary;
          unPlannedLeaveExtraDeduction =
            findPaildLeavePolicy?.unPlannedLeaveExtraDeduction;
          plannedLeaveDeduction = findPaildLeavePolicy?.plannedLeaveDeduction;
        }
        if (salary === 0) {
          salary = userDetails?.salary;
        }
        const date = new Date(year, month - 1, 1);
        const monthName = date
          .toLocaleString("default", { month: "long" })
          .toLowerCase();
        const skipMonths = skipPaidLeaveMonth.map((m) => m.toLowerCase());
        const isSkip = skipMonths.includes(monthName);
        const isProbation = i < 3 && initialThreeMonthPaidLeaveStatus === 1;
        const isJoiningMonth =
          year === joiningDate.getFullYear() &&
          month === joiningDate.getMonth() + 1;
        const isRelievingMonth =
          year === relievingDate.getFullYear() &&
          month === relievingDate.getMonth() + 1;
        const completedTwoYears =
          date >=
          new Date(joiningDate.getFullYear() + 2, joiningDate.getMonth(), 1);
        const monthlyEarnRate =
          completedTwoYears && afterTwoYearExtraPaidLeave
            ? paidLeaveDay +
              (afterTwoYearExtraPaidLeave / totalAnnualPaidLeave) * paidLeaveDay
            : paidLeaveDay;

        let earned = isSkip ? 0 : monthlyEarnRate;

        // Deduct based on joining day
        if (isJoiningMonth) {
          const joinDay = joiningDate.getDate();
          const deduction = getDeductionFromSlab(
            monthlyEarnRate,
            joiningDatePaidLeaveDeductions,
            joinDay,
            false
          );
          earned = Math.max(0, earned - deduction);
        }

        // Deduct based on relieving day (reversed logic)
        if (isRelievingMonth) {
          const relieveDay = relievingDate.getDate();
          const deduction = getDeductionFromSlab(
            monthlyEarnRate,
            joiningDatePaidLeaveDeductions,
            relieveDay,
            true
          );
          earned = Math.max(0, earned - deduction);
        }

        // Handle carry forward reset in Jan
        if (resetLeaveAtNewYear && month === 1) {
          carryForward = 0;
        }

        let applied = 0;
        let leaveData = {};
        if (isProbation) {
          applied = 0;
        } else if (appliedLeaves.length === 0 && userDetails) {
          if (
            !findExistPaidLeave ||
            isCurrentMonth ||
            isPrevMonthAndBeforeLockDay
          ) {
            if (nextMonth > months[i]) {
              leaveData = await this.getMonthlyAttendanceRow(
                SITE_DB_NAME,
                userDetails,
                moment(date).format("YYYY-MM"),
                new Date(year, month, 0).getDate(),
                shortLoginDeductions,
                weekWorkingDays,
                weekEnds,
                monthlyExtraWorkingDays,
                monthlyExtraFreeMin,
                holidays,
                shiftId,
                salary,
                plannedLeaveDeduction,
                unPlannedLeaveExtraDeduction,
                isRelievingMonth,
                isJoiningMonth
              );
              applied = leaveData?.totalDeduction || 0;
            }
          } else {
            if (findExistPaidLeave) {
              applied = findExistPaidLeave?.appliedLeave;
              leaveData = findExistPaidLeave?.leaveData;
            }
          }
        } else {
          applied = appliedMap[months[i]] || 0;
        }
        let encashed = 0;
        const available = carryForwordPaidLeaveStatus
          ? carryForward + earned
          : earned;
        let remaining = Math.max(0, available - applied);
        const deductedPaidLeaves = Math.min(applied, available);
        if (
          parseFloat(remaining.toFixed(2)) > 0 &&
          currentSystemMonth > moment(months[i], "YYYY-MM") &&
          (carryForwordPaidLeaveStatus === 0 ||
            (currentSystemMonth.format("MM") === 1 &&
              months[i] ===
                `${moment(months[i], "YYYY-MM").format("YYYY")}-12`))
        ) {
          encashed = remaining;
          remaining = 0;
        }

        if (carryForwordPaidLeaveStatus) carryForward = remaining;
        if (
          !findExistPaidLeave ||
          isCurrentMonth ||
          isPrevMonthAndBeforeLockDay
        ) {
          result.push({
            userId: userDetails?.userId,
            uniqueId: userDetails?.uniqueId,
            month: months[i],
            leaveEarned: parseFloat(earned.toFixed(2)),
            appliedLeave: applied,
            leaveForDeduction: Number(applied - deductedPaidLeaves),
            carryForward: carryForwordPaidLeaveStatus
              ? parseFloat(carryForward.toFixed(2))
              : 0,
            remainingBalance: parseFloat(remaining.toFixed(2)),
            locked: isProbation,
            note: isProbation
              ? "Leave earned but locked due to 3-month probation"
              : "",
            dbEditLocked:
              months[i] < previousMonth ||
              (months[i] === previousMonth && isAfterLockDay),
            encashed: encashed,
            deductedPaidLeaves,
            leaveData,
          });
        }
      }

      //dayMonthYear ? result.filter((resul) => resul.month === dayMonthYear) : result;
      // console.log("result", result);

      return result;
    } catch (error) {
      console.log(error.message);

      return [];
    }
  },

  async getMonthlyAttendanceRow(
    SITE_DB_NAME,
    userDetails,
    monthYear,
    monthDay,
    shortLoginDeductions,
    weekWorkingDays,
    weekEnds,
    monthlyExtraWorkingDays,
    monthlyExtraFreeMin,
    holidays,
    shiftId,
    salary,
    plannedLeaveDeduction,
    unPlannedLeaveExtraDeduction,
    isRelievingMonth,
    isJoiningMonth
  ) {
    const Attendance = await AttendanceModel(SITE_DB_NAME);
    const ShiftIncentivePolicy = await ShiftIncentivePolicyModel(SITE_DB_NAME);
    const Incentive = await IncentiveModel(SITE_DB_NAME);

    const {
      userId,
      roleName,
      unitId,
      uniqueId,
      religiousBreak,
      joiningDate,
      relievingDate,
      shiftDetails: shift = null,
    } = userDetails;

    if (!unitId?.length || !shift || !shiftId) return null;

    const currentDate = moment();
    const shiftReligiousBreakDuration =
      religiousBreak > 0 ? shift.religiousBreakMin : 0;
    const startOfMonth = moment(`${monthYear}-01`);
    const datesOfMonth = Array.from({ length: monthDay }, (_, i) =>
      startOfMonth.clone().date(i + 1)
    );

    const attendanceDocs = await Attendance.find({
      userId,
      date: { $in: datesOfMonth.map((d) => d.format("YYYY-MM-DD")) },
    });
    const attendanceMap = new Map(
      attendanceDocs.map((a) => [moment(a.date).format("YYYY-MM-DD"), a])
    );
    const holidaySet = new Set(
      holidays.map((h) => moment(h.date).format("YYYY-MM-DD"))
    );
    const extraWorkingSet = new Set(monthlyExtraWorkingDays);

    let presentDays = 0,
      halfDays = 0,
      unplanned = 0,
      planned = 0,
      sick = 0,
      maternity = 0,
      paternity = 0,
      absentDays = 0,
      totalShortLogin = 0,
      punchMissing = 0,
      checkStatusPM = true;

    for (let i = 0; i < datesOfMonth.length; i++) {
      const dateObj = datesOfMonth[i];
      const dateStr = dateObj.format("YYYY-MM-DD");

      if (dateObj.isAfter(currentDate) || moment(joiningDate).isAfter(dateObj))
        continue;
      if (relievingDate && moment(relievingDate).isBefore(dateObj)) continue;

      const weekDay = dateObj.format("dddd");
      const weekNumber = Math.ceil((i + 1) / 7);
      const weekKey = `${weekNumber}${weekDay}`;
      const attendance = attendanceMap.get(dateStr);
      let status = "Absent";

      if (!attendance) {
        const isHoliday = holidaySet.has(dateStr);
        const isWeekend = weekEnds.includes(weekDay);
        const isExtraWorking = extraWorkingSet.has(weekKey);

        if (isWeekend && !isExtraWorking) {
          const weekStart = dateObj.clone().startOf("isoWeek");
          const weekWorkingDates = weekWorkingDays.map((day) =>
            weekStart.clone().day(day).format("YYYY-MM-DD")
          );
          const weekAttendances = await Attendance.find({
            userId,
            date: { $in: weekWorkingDates },
            status: "Present",
          });
          status = weekAttendances.length ? "Weekend" : "Absent";
        } else if (isHoliday && isWeekend) {
          status = "Holiday (Weekend)";
        } else if (isHoliday) {
          status = "Holiday";
        }
      } else {
        status = attendance.status;
        totalShortLogin += attendance.lateBy || 0;
      }

      let exstatus = "NA";
      if (status === "Present") {
        exstatus =
          (attendance.punches?.length ?? 0) % 2 === 0
            ? attendance.shortLoginHDStatus === 0
              ? "P"
              : "HD"
            : "PM";
        if (exstatus === "PM") checkStatusPM = false;
      } else if (status === "Absent") {
        exstatus = "A";
      } else if (status === "Holiday") {
        exstatus = "H";
      } else if (status === "Weekend") {
        exstatus = "W";
      } else if (status === "Holiday (Weekend)") {
        exstatus = "HW";
      }
      const pl = Number(plannedLeaveDeduction) || 0;
      const up = Number(unPlannedLeaveExtraDeduction) || 0;
      if (exstatus === "HD") {
        const leave = await this.leaveByDate(userId, dateStr);

        if (leave) {
          if (
            leave?.dayType !== "FullDay" &&
            leave?.leaveType === "Unplanned"
          ) {
            halfDays += Math.max(pl, 0) / 2 + Math.max(up, 0) / 2;
            presentDays += 0.5;
            unplanned += 0.5;
          } else {
            halfDays += Math.max(pl, 0) / 2;
            presentDays += 0.5;
            if (leave?.leaveType === "Planned") planned += 0.5;
            else if (leave.leaveType === "Sick") sick += 0.5;
          }
        } else {
          halfDays += Math.max(pl, 0) / 2 + Math.max(up, 0) / 2;
          presentDays += 0.5;
          unplanned += 0.5;
        }
      } else if (exstatus === "A") {
        const leave = await this.leaveByDate(userId, dateStr);

        if (leave) {
          if (
            leave?.dayType === "FullDay" &&
            leave?.leaveType === "Unplanned"
          ) {
            absentDays += Math.max(pl, 0) + Math.max(up, 0);
            unplanned += 1;
          } else {
            absentDays += Math.max(pl, 0);
            if (leave?.leaveType === "Planned") planned += 1;
            else if (leave?.leaveType === "Sick") sick += 1;
            else if (leave?.leaveType === "Maternity") maternity += 1;
            else if (leave?.leaveType === "Paternity") paternity += 1;
          }
        } else {
          if (isRelievingMonth || isJoiningMonth) {
            absentDays += Math.max(pl, 0);
            planned += 1;
          } else {
            absentDays += Math.max(pl, 0) + Math.max(up, 0);
            unplanned += 1;
          }
        }
      } else if (["P", "PM", "HW", "H", "W"].includes(exstatus)) {
        presentDays++;
        if (["PM"].includes(exstatus)) punchMissing++;
      }
    }

    const getDeductionFromSlab = (slabs, totalMin) => {
      let lastMatch = 0;
      for (const slab of slabs) {
        if (totalMin >= slab.start) {
          lastMatch = slab.deduction;
          if (totalMin <= slab.end) return slab.deduction;
        }
      }
      return lastMatch;
    };

    const shortLoginDeduction = getDeductionFromSlab(
      shortLoginDeductions,
      totalShortLogin
    );
    const halfDayDeduction = halfDays;
    const totalDeduction =
      Number(shortLoginDeduction) +
      Number(absentDays) +
      Number(halfDayDeduction);
    const currentMonth = currentDate.format("YYYY-MM");

    const payrollDate = new Date(); // or use payroll month date

    // Months difference
    let monthsDiff =
      (payrollDate.getFullYear() - joiningDate.getFullYear()) * 12 +
      (payrollDate.getMonth() - joiningDate.getMonth());

    // If joined after 15th, don’t count joining month
    if (joiningDate.getDate() > 15) monthsDiff--;

    // Incentive allowed only after 3 months
    const isIncentiveAllowed = monthsDiff >= 3;
    // monthlyExtraFreeMin =0
    if (
      isIncentiveAllowed &&
      checkStatusPM &&
      totalDeduction === 0 &&
      totalShortLogin <= monthlyExtraFreeMin &&
      startOfMonth.isBefore(moment(currentMonth, "YYYY-MM"))
    ) {
      if (!shiftCache[shiftId]) {
        shiftCache[shiftId] = await ShiftIncentivePolicy.findOne({
          shiftId,
          levelName: "attendance",
          activeFlag: 1,
          deleteFlag: 0,
        });
      }

      const policy = shiftCache[shiftId];
      if (policy) {
        const endOfMonth = startOfMonth.clone().endOf("month");
        const lastDateStr = endOfMonth.format("YYYY-MM-DD");

        const existingIncentive = await Incentive.findOne({
          userId,
          shiftId,
          levelName: "attendance",
          date: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
          deleteFlag: 0,
        });
        const proccessData = await this.getProccessSingle(
          SITE_DB_NAME,
          userId,
          currentMonth
        );
        let grossSalary = 0;
        if (proccessData !== "NA") {
          const getDecryptData = await decryptData({
            grossSalary: proccessData?.grossSalary || 0,
          });
          grossSalary = getDecryptData?.grossSalary || 0;
        }

        let fivePercent = Math.round(salary * 0.05);
        if (policy?.incentive[0]?.type === "Percentage") {
          fivePercent = Math.round(
            (grossSalary * policy?.incentive[0]?.value) / 100
          );
        } else if (policy?.incentive[0]?.type === "Fixed") {
          fivePercent = Number(policy?.incentive[0]?.value);
        }
        const incentivePayload = {
          userId,
          unitId,
          shiftIncentivePolicyId: policy._id,
          incentivePolicyId: policy.incentivePolicyId || null,
          shiftId,
          fulllable: policy.fulllable,
          lable: policy.lable,
          levelName: policy.levelName,
          descriptionPolicy: policy.description || "",
          documentPolicy: policy.document || "",
          incentive: policy.incentive || [],
          roleName,
          date: lastDateStr,
          amount: fivePercent,
          finalAmount: fivePercent,
          targetAchieved: 1,
          description: "Full attendance incentive (5% of salary)",
          documents: [],
          status: "Pending",
          paidStatus: "Pending",
          appliedAt: new Date(),
          activeFlag: 1,
          deleteFlag: 0,
        };

        if (existingIncentive) {
          await Incentive.updateOne(
            { _id: existingIncentive._id },
            { $set: incentivePayload }
          );
        } else {
          await Incentive.create(incentivePayload);
        }
      }
    } else {
      //console.log("checkStatusPM false", checkStatusPM && totalDeduction === 0 && totalShortLogin <= monthlyExtraFreeMin && startOfMonth.isBefore(moment(currentMonth, "YYYY-MM")));
      // console.log("checkStatusPM condiiton", checkStatusPM , totalDeduction === 0 , totalShortLogin <= monthlyExtraFreeMin ,  startOfMonth.isBefore(moment(currentMonth, "YYYY-MM")));
      // console.log("checkStatusPM uniqueId",shiftId,uniqueId, checkStatusPM , totalDeduction  , totalShortLogin , monthlyExtraFreeMin , startOfMonth,currentMonth);
    }

    return {
      presentDays,
      totalDeduction,
      absentDays,
      halfDays: Number(halfDays * 2),
      shortLoginDeduction,
      totalShortLogin,
      unplanned,
      planned,
      sick,
      maternity,
      paternity,
      punchMissing,
    };
  },
  async getNotifications(SITE_DB_NAME, userId, checkUser, limit, offset) {
    const UserNotificationMessage = await UserNotificationMessageModel(
      SITE_DB_NAME
    );
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
            { $set: { readStatus: 1, updatedAt: new Date() } }
          );
        }
      }
      return notifications;
    } catch (error) {
      console.log(
        "database error from commen getNotifications ",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getNotificationCount(SITE_DB_NAME, userId) {
    const UserNotificationMessage = await UserNotificationMessageModel(
      SITE_DB_NAME
    );
    try {
      const count = await UserNotificationMessage.find({
        otherUserId: userId,
        readStatus: 0,
        deleteFlag: 0,
      });
      return count ? count : [];
    } catch (error) {
      console.log(
        "database error from commen getNotifications ",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async clearNotification(SITE_DB_NAME, userId, deleteFlag) {
    const UserNotificationMessage = await UserNotificationMessageModel(
      SITE_DB_NAME
    );
    try {
      const updateStatus = await UserNotificationMessage.updateMany(
        { otherUserId: userId },
        { $set: { deleteFlag: deleteFlag } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service clearNotification",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async deleteNotification(SITE_DB_NAME, notificationId, deleteFlag) {
    const UserNotificationMessage = await UserNotificationMessageModel(
      SITE_DB_NAME
    );
    try {
      const updateStatus = await UserNotificationMessage.updateOne(
        { _id: notificationId },
        { $set: { deleteFlag: deleteFlag } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service deleteNotification",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async readNotification(SITE_DB_NAME, notificationId, deleteFlag) {
    const UserNotificationMessage = await UserNotificationMessageModel(
      SITE_DB_NAME
    );
    try {
      const updateStatus = await UserNotificationMessage.updateOne(
        { _id: notificationId },
        { $set: { readStatus: deleteFlag } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service readNotification",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async checkNotification(SITE_DB_NAME, notificationId) {
    const UserNotificationMessage = await UserNotificationMessageModel(
      SITE_DB_NAME
    );
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
  async shiftsByUnit(SITE_DB_NAME, unitIds, deleteFlag) {
    const Shift = await ShiftModel(SITE_DB_NAME);
    try {
      let match =
        unitIds === "all"
          ? {
              deleteFlag: deleteFlag,
            }
          : {
              unitId: { $in: unitIds },
              deleteFlag: deleteFlag,
            };
      const shift = await Shift.aggregate([
        {
          $match: match,
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
            from: "holidays",
            localField: "holidayIds",
            foreignField: "_id",
            as: "holidayDetails",
          },
        },

        {
          $unwind: {
            path: "$holidayDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            unitName: { $ifNull: ["$unitDetails.unitName", "NA"] },
            holidayDetails: { $ifNull: ["$holidayDetails", "NA"] },
            shiftTime: {
              $concat: [
                { $ifNull: ["$startTime", ""] },
                " TO ",
                { $ifNull: ["$endTime", ""] },
              ],
            },
            breakTime: {
              $concat: [
                { $ifNull: ["$breakStartTime", ""] },
                " TO ",
                { $ifNull: ["$breakEndTime", ""] },
              ],
            },
            firstHalfTime: {
              $concat: [
                { $ifNull: ["$firstHalfDayStartTime", ""] },
                " TO ",
                { $ifNull: ["$firstHalfDayEndTime", ""] },
              ],
            },
            secHalfTime: {
              $concat: [
                { $ifNull: ["$secHalfDayStartTime", ""] },
                " TO ",
                { $ifNull: ["$secHalfDayEndTime", ""] },
              ],
            },
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M", // Format for date
                date: "$createdAt",
                // Optional: Set timezone if required
              },
            },
          },
        },
        {
          $addFields: {
            durationFormat: {
              $concat: [
                {
                  $toString: {
                    $floor: { $divide: ["$totalWorkingDurationInDay", 60] },
                  },
                },
                ":",
                {
                  $cond: {
                    if: {
                      $gte: [{ $mod: ["$totalWorkingDurationInDay", 60] }, 10],
                    },
                    then: {
                      $toString: { $mod: ["$totalWorkingDurationInDay", 60] },
                    },
                    else: {
                      $concat: [
                        "0",
                        {
                          $toString: {
                            $mod: ["$totalWorkingDurationInDay", 60],
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $addFields: {
            breakDurationFormat: {
              $concat: [
                {
                  $toString: {
                    $floor: { $divide: ["$breakDuration", 60] },
                  },
                },
                ":",
                {
                  $cond: {
                    if: { $gte: [{ $mod: ["$breakDuration", 60] }, 10] },
                    then: { $toString: { $mod: ["$breakDuration", 60] } },
                    else: {
                      $concat: [
                        "0",
                        { $toString: { $mod: ["$breakDuration", 60] } },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $addFields: {
            firstDurationFormat: {
              $concat: [
                {
                  $toString: {
                    $floor: { $divide: ["$firstHalfDuration", 60] },
                  },
                },
                ":",
                {
                  $cond: {
                    if: { $gte: [{ $mod: ["$firstHalfDuration", 60] }, 10] },
                    then: { $toString: { $mod: ["$firstHalfDuration", 60] } },
                    else: {
                      $concat: [
                        "0",
                        { $toString: { $mod: ["$firstHalfDuration", 60] } },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $addFields: {
            secDurationFormat: {
              $concat: [
                {
                  $toString: {
                    $floor: { $divide: ["$secHalfDuration", 60] },
                  },
                },
                ":",
                {
                  $cond: {
                    if: { $gte: [{ $mod: ["$secHalfDuration", 60] }, 10] },
                    then: { $toString: { $mod: ["$secHalfDuration", 60] } },
                    else: {
                      $concat: [
                        "0",
                        { $toString: { $mod: ["$secHalfDuration", 60] } },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },

        {
          $group: {
            _id: "$_id",
            unitId: { $first: "$unitId" },
            shiftName: { $first: "$shiftName" },
            shiftTime: { $first: "$shiftTime" },
            weekWorkingDays: { $first: "$weekWorkingDays" },
            totalWorkingDurationInDay: { $first: "$totalWorkingDurationInDay" },
            durationFormat: { $first: "$durationFormat" },
            startTime: { $first: "$startTime" },
            endTime: { $first: "$endTime" },
            breakDuration: { $first: "$breakDuration" },
            breakDurationFormat: { $first: "$breakDurationFormat" },
            breakTime: { $first: "$breakTime" },

            breakStartTime: { $first: "$breakStartTime" },
            breakEndTime: { $first: "$breakEndTime" },
            weekEnds: { $first: "$weekEnds" },
            monthlyExtraWorkingDays: { $first: "$monthlyExtraWorkingDays" },
            halfDayStatus: { $first: "$halfDayStatus" },
            firstHalfDayStartTime: { $first: "$firstHalfDayStartTime" },
            firstHalfDayEndTime: { $first: "$firstHalfDayEndTime" },
            firstHalfTime: { $first: "$firstHalfTime" },
            firstHalfDuration: { $first: "$firstHalfDuration" },
            firstDurationFormat: { $first: "$firstDurationFormat" },

            secHalfDayStartTime: { $first: "$secHalfDayStartTime" },
            secHalfDayEndTime: { $first: "$secHalfDayEndTime" },
            secHalfTime: { $first: "$secHalfTime" },
            secHalfDuration: { $first: "$secHalfDuration" },
            secDurationFormat: { $first: "$secDurationFormat" },
            halfDayShortLoginExceedStatus: {
              $first: "$halfDayShortLoginExceedStatus",
            },
            halfDayShortLoginMin: { $first: "$halfDayShortLoginMin" },
            religiousBreakMin: { $first: "$religiousBreakMin" },
            monthlyExtraFreeMin: { $first: "$monthlyExtraFreeMin" },
            holidayDetails: { $push: "$holidayDetails" },
            shortLoginDeductions: { $first: "$shortLoginDeductions" },
            unPlannedLeaveExtraDeduction: {
              $first: "$unPlannedLeaveExtraDeduction",
            },
            plannedLeaveApplyBeforeDays: {
              $first: "$plannedLeaveApplyBeforeDays",
            },
            sickLeavePaidUnpaidStatus: { $first: "$sickLeavePaidUnpaidStatus" },
            sickLeaveDocumentDay: { $first: "$sickLeaveDocumentDay" },
            leaveAmountCalMonthDaysStatus: {
              $first: "$leaveAmountCalMonthDaysStatus",
            },
            totalAnnualPaidLeave: { $first: "$totalAnnualPaidLeave" },
            eachMonthPaidLeave: { $first: "$eachMonthPaidLeave" },
            paidLeaveDay: { $first: "$paidLeaveDay" },
            skipPaidLeaveMonth: { $first: "$skipPaidLeaveMonth" },
            carryForwordPaidLeaveStatus: {
              $first: "$carryForwordPaidLeaveStatus",
            },
            joiningDatePaidLeaveDeductions: {
              $first: "$joiningDatePaidLeaveDeductions",
            },
            afterTwoYearExtraPaidLeave: {
              $first: "$afterTwoYearExtraPaidLeave",
            },
            initialThreeMonthPaidLeaveStatus: {
              $first: "$initialThreeMonthPaidLeaveStatus",
            },
            maternityLeave: { $first: "$maternityLeave" },
            paternityLeave: { $first: "$paternityLeave" },
            weekOnceLeaveUnplanned: { $first: "$weekOnceLeaveUnplanned" },
            pfDeduction: { $first: "$pfDeduction" },
            esicDeduction: { $first: "$esicDeduction" },
            ptDeduction: { $first: "$ptDeduction" },
            otherAndTdsDeduction: { $first: "$otherAndTdsDeduction" },
            formattedCreatedAt: { $first: "$formattedCreatedAt" },
            activeFlag: { $first: "$activeFlag" },
            deleteFlag: { $first: "$deleteFlag" },
            createdAt: { $first: "$createdAt" },
            updatedAt: { $first: "$updatedAt" },
            unitDetails: { $first: "$unitDetails" },
            unitName: { $first: "$unitName" },
            timeZone: { $first: "$timeZone" },
          },
        },
        {
          $sort: { createdAt: -1 }, // <-- Add this stage to sort by createdAt descending
        },
      ]);

      if (shift && shift.length > 0) {
        return shift;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin getShifts", error.message);
      throw new Error(error.message);
    }
  },
  async incentivePolicys(SITE_DB_NAME) {
    const IncentivePolicy = await IncentivePolicyModel(SITE_DB_NAME);
    try {
      const incentivePolicys = await IncentivePolicy.find({ deleteFlag: 0 });
      if (incentivePolicys) {
        return incentivePolicys;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service incentivePolicys",
        error.message
      );
      return error.message;
    }
  },
  async shiftIncentivePolicys(SITE_DB_NAME, shiftId) {
    const ShiftIncentivePolicy = await ShiftIncentivePolicyModel(SITE_DB_NAME);
    try {
      const shiftIncentivePolicys = await ShiftIncentivePolicy.find({
        deleteFlag: 0,
        shiftId: shiftId,
      });
      if (shiftIncentivePolicys) {
        return shiftIncentivePolicys;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service shiftIncentivePolicys",
        error.message
      );
      return error.message;
    }
  },
  async addShiftIncentivePolicy(SITE_DB_NAME, shiftId, incentiveData) {
    const ShiftIncentivePolicy = await ShiftIncentivePolicyModel(SITE_DB_NAME);
    try {
      await ShiftIncentivePolicy.deleteMany({ shiftId });
      const addStatus = await ShiftIncentivePolicy.insertMany(incentiveData);
      if (addStatus && addStatus.length > 0) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "Database error from admin service addShiftIncentivePolicy:",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getDeviceStatuses(SITE_DB_NAME, deleteFlag) {
    const Device = await DeviceModel(SITE_DB_NAME);
    try {
      function formatTimeAgo(diffMs) {
        const seconds = Math.floor(diffMs / 1000);
        if (seconds < 60)
          return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;

        const minutes = Math.floor(seconds / 60);
        if (minutes < 60)
          return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;

        const days = Math.floor(hours / 24);
        return `${days} day${days !== 1 ? "s" : ""} ago`;
      }
      const devices = await Device.find({ deleteFlag: deleteFlag }).lean();
      const now = new Date();
      const devicesWithStatus = devices.map((device) => {
        const lastActive = device.lastActive
          ? new Date(device.lastActive)
          : null;
        let status = "Offline"; // default

        if (lastActive) {
          const diffMs = now - lastActive;
          const timeAgo = formatTimeAgo(diffMs);

          // ✅ Agar last active 3 min ke andar hai → Online
          if (diffMs <= 3 * 60 * 1000) {
            status = `Online ${timeAgo}`;
          }
          // ✅ Agar 20 min se zyada ho gaya hai → Offline
          else if (diffMs > 20 * 60 * 1000) {
            status = `Offline`;
          }
          // ✅ Agar 3–20 min ke beech mein hai → Last Active
          else {
            status = `${timeAgo} Last Active`;
          }
        } else {
          status = "Offline";
        }

        return {
          ...device,
          status,
        };
      });

      return devicesWithStatus;
    } catch (error) {
      console.error("Error checking device statuses:", error);
      throw error;
    }
  },
  async editDevice(SITE_DB_NAME, deviceId, data) {
    const Device = await DeviceModel(SITE_DB_NAME);
    try {
      const updateStatus = await Device.updateOne(
        { _id: deviceId },
        { $set: data },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from admin service ediTteam", error.message);
      throw new Error(error.message);
    }
  },
  async activeDeactiveDevice(SITE_DB_NAME, deviceId, activeFlag) {
    const Device = await DeviceModel(SITE_DB_NAME);
    try {
      const updateStatus = await Device.updateOne(
        { _id: deviceId },
        { $set: { activeFlag: activeFlag } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service activeDeactiveteam",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async checkDevice(SITE_DB_NAME, DeviceId) {
    const Device = await DeviceModel(SITE_DB_NAME);
    try {
      const checkDevice = await Device.findById(DeviceId);
      if (checkDevice) {
        return checkDevice;
      } else {
        return 0;
      }
    } catch (error) {
      throw new Error(error.message);
    }
  },
  async checkDeviceWithNumber(SITE_DB_NAME, DeviceId, deviceSerialNumber) {
    const Device = await DeviceModel(SITE_DB_NAME);
    try {
      const checkDevice = await Device.find({
        _id: { $ne: DeviceId },
        deviceSerialNumber: deviceSerialNumber,
      });
      if (checkDevice.length > 0) {
        return checkDevice;
      } else {
        return 0;
      }
    } catch (error) {
      throw new Error(error.message);
    }
  },
  async checkExistPaidLeavePolicy(SITE_DB_NAME, userId, yearMonths) {
    const UserShiftPaidLeavePolicy = await UserShiftPaidLeavePolicyModel(
      SITE_DB_NAME
    );
    try {
      const checkExistPaidLeavePolicy = await UserShiftPaidLeavePolicy.find({
        userId,
        yearMonth: { $in: yearMonths },
      });
      if (checkExistPaidLeavePolicy.length > 0) {
        return checkExistPaidLeavePolicy;
      } else {
        return [];
      }
    } catch (error) {
      throw new Error(error.message);
    }
  },
  async addPaidLeavePolicy(SITE_DB_NAME, data) {
    const UserShiftPaidLeavePolicy = await UserShiftPaidLeavePolicyModel(
      SITE_DB_NAME
    );
    try {
      const addStatus = await UserShiftPaidLeavePolicy.insertMany(data);
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from commen service addPaidLeavePolicy",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async checkExistPaidLeave(SITE_DB_NAME, userId) {
    const CreditPaidLeave = await CreditPaidLeaveModel(SITE_DB_NAME);
    try {
      const checkExistPaidLeave = await CreditPaidLeave.find({
        userId,
        dbEditLocked: true,
      });
      if (checkExistPaidLeave.length > 0) {
        return checkExistPaidLeave;
      } else {
        return [];
      }
    } catch (error) {
      throw new Error(error.message);
    }
  },
  async getPaidLeave(SITE_DB_NAME, userId, yearMonth) {
    const CreditPaidLeave = await CreditPaidLeaveModel(SITE_DB_NAME);
    try {
      const checkExistPaidLeave = await CreditPaidLeave.find({
        userId,
        month: yearMonth,
      });
      if (checkExistPaidLeave.length > 0) {
        return checkExistPaidLeave;
      } else {
        return [];
      }
    } catch (error) {
      throw new Error(error.message);
    }
  },
  async bulkCreditPaidLeave(SITE_DB_NAME, data) {
    const CreditPaidLeave = await CreditPaidLeaveModel(SITE_DB_NAME);
    try {
      const addStatus = await CreditPaidLeave.bulkWrite(data, {
        ordered: false,
      });
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from commen service bulkCreditPaidLeave",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async markAttendanceMailSent(SITE_DB_NAME, attendanceIds) {
    const Attendance = await AttendanceModel(SITE_DB_NAME);
    try {
      const updateStatus = await Attendance.updateMany(
        { _id: { $in: attendanceIds } }, // All IDs in array
        { $set: { mailSend: 1 } } // Set mailSend to 1
      );

      return updateStatus.modifiedCount; // How many records updated
    } catch (error) {
      console.log("Error updating mailSend in Attendance:", error.message);
      throw new Error(error.message);
    }
  },
  async getPunchMismatchRecords(SITE_DB_NAME) {
    const Attendance = await AttendanceModel(SITE_DB_NAME);
    try {
      const yesterday = moment().subtract(1, "days").startOf("day").toDate();
      const today = moment().startOf("day").toDate();

      return await Attendance.find({
        date: { $gte: yesterday, $lt: today }, // Only yesterday
        mailSend: { $ne: 1 }, // Not already mailed
        deleteFlag: 0, // Optional: skip deleted
        $expr: { $ne: [{ $mod: [{ $size: "$punches" }, 2] }, 0] },
      })
        .populate("userId", "email name languageId") // Get user info
        .lean();
    } catch (error) {
      console.log("Errorget mailSend in Attendance:", error.message);
      throw new Error(error.message);
    }
  },

  async getRegistrations(SITE_DB_NAME, unitIds, deleteFlag) {
    const User = await UserModel(SITE_DB_NAME);
    const query =
      unitIds.length <= 0
        ? { deleteFlag: deleteFlag, approveFlag: { $in: [0, 2] } }
        : {
            unitId: { $in: unitIds },
            deleteFlag: deleteFlag,
            approveFlag: { $in: [0, 2] },
          };

    try {
      const user = await User.aggregate([
        {
          $match: query,
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
            companyDetails: { $ifNull: ["$companyDetails", "NA"] }, // Set "NA" if no matching team
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
              },
            },
            formattedlastLoginTime: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$lastLoginTime",
              },
            },
            formattedJoiningDate: {
              $cond: {
                if: { $eq: [{ $type: "$joiningDate" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$joiningDate",
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
            relievingDate: 1,
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
        error.message
      );
      throw new Error(error.message);
    }
  },
  async viewRegistration(SITE_DB_NAME, userId) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const user = await User.aggregate([
        {
          $match: { _id: userId, roleName: { $ne: "Site-Owner" } },
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
            companyDetails: { $ifNull: ["$companyDetails", "NA"] }, // Set "NA" if no matching team
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
              },
            },
            formattedlastLoginTime: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$lastLoginTime",
              },
            },
            formattedJoiningDate: {
              $cond: {
                if: { $eq: [{ $type: "$joiningDate" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$joiningDate",
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
            relievingDate: 1,
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
        error.message
      );
      throw new Error(error.message);
    }
  },
  async checkRegistrationOne(SITE_DB_NAME, employeeId) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const employeeStatus = await User.findOne({
        _id: employeeId,
        approveFlag: 0,
      }); // 20 seconds timeout
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
  async checkPermission(SITE_DB_NAME, permissionId) {
    const Permission = await PermissionModel(SITE_DB_NAME);
    try {
      const permissionStatus = await Permission.findOne({ _id: permissionId }); // 20 seconds timeout

      if (permissionStatus) {
        return permissionStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("permission find db error", error.message);
      throw new Error(error.message);
    }
  },
  async getPermissions(SITE_DB_NAME, deleteFlag) {
    const Permission = await PermissionModel(SITE_DB_NAME);
    try {
      const Permissions = await Permission.aggregate([
        {
          $match: {
            deleteFlag: deleteFlag,
            roleName: { $ne: "Site-Owner" },
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
        { $sort: { createdAt: -1 } },
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
        "database error from commen service Permissions details",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getPermissionOne(SITE_DB_NAME, permissionId) {
    const Permission = await PermissionModel(SITE_DB_NAME);
    try {
      const Permissions = await Permission.aggregate([
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
        { $sort: { createdAt: -1 } },
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
        error.message
      );
      throw new Error(error.message);
    }
  },

  async shiftsDataByUnits(SITE_DB_NAME, unitIds, deleteFlag) {
    const Shift = await ShiftModel(SITE_DB_NAME);
    try {
      const query =
        unitIds.length <= 0
          ? { deleteFlag: deleteFlag }
          : { unitId: { $in: unitIds }, deleteFlag: deleteFlag };
      const shift = await Shift.aggregate([
        {
          $match: query,
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
            from: "holidays",
            localField: "holidayIds",
            foreignField: "_id",
            as: "holidayDetails",
          },
        },

        {
          $unwind: {
            path: "$holidayDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            unitName: { $ifNull: ["$unitDetails.unitName", "NA"] },
            holidayDetails: { $ifNull: ["$holidayDetails", "NA"] },
            shiftTime: {
              $concat: [
                { $ifNull: ["$startTime", ""] },
                " TO ",
                { $ifNull: ["$endTime", ""] },
              ],
            },
            breakTime: {
              $concat: [
                { $ifNull: ["$breakStartTime", ""] },
                " TO ",
                { $ifNull: ["$breakEndTime", ""] },
              ],
            },
            firstHalfTime: {
              $concat: [
                { $ifNull: ["$firstHalfDayStartTime", ""] },
                " TO ",
                { $ifNull: ["$firstHalfDayEndTime", ""] },
              ],
            },
            secHalfTime: {
              $concat: [
                { $ifNull: ["$secHalfDayStartTime", ""] },
                " TO ",
                { $ifNull: ["$secHalfDayEndTime", ""] },
              ],
            },
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M", // Format for date
                date: "$createdAt",
                // Optional: Set timezone if required
              },
            },
          },
        },
        {
          $addFields: {
            durationFormat: {
              $concat: [
                {
                  $toString: {
                    $floor: { $divide: ["$totalWorkingDurationInDay", 60] },
                  },
                },
                ":",
                {
                  $cond: {
                    if: {
                      $gte: [{ $mod: ["$totalWorkingDurationInDay", 60] }, 10],
                    },
                    then: {
                      $toString: { $mod: ["$totalWorkingDurationInDay", 60] },
                    },
                    else: {
                      $concat: [
                        "0",
                        {
                          $toString: {
                            $mod: ["$totalWorkingDurationInDay", 60],
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $addFields: {
            breakDurationFormat: {
              $concat: [
                {
                  $toString: {
                    $floor: { $divide: ["$breakDuration", 60] },
                  },
                },
                ":",
                {
                  $cond: {
                    if: { $gte: [{ $mod: ["$breakDuration", 60] }, 10] },
                    then: { $toString: { $mod: ["$breakDuration", 60] } },
                    else: {
                      $concat: [
                        "0",
                        { $toString: { $mod: ["$breakDuration", 60] } },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $addFields: {
            firstDurationFormat: {
              $concat: [
                {
                  $toString: {
                    $floor: { $divide: ["$firstHalfDuration", 60] },
                  },
                },
                ":",
                {
                  $cond: {
                    if: { $gte: [{ $mod: ["$firstHalfDuration", 60] }, 10] },
                    then: { $toString: { $mod: ["$firstHalfDuration", 60] } },
                    else: {
                      $concat: [
                        "0",
                        { $toString: { $mod: ["$firstHalfDuration", 60] } },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
        {
          $addFields: {
            secDurationFormat: {
              $concat: [
                {
                  $toString: {
                    $floor: { $divide: ["$secHalfDuration", 60] },
                  },
                },
                ":",
                {
                  $cond: {
                    if: { $gte: [{ $mod: ["$secHalfDuration", 60] }, 10] },
                    then: { $toString: { $mod: ["$secHalfDuration", 60] } },
                    else: {
                      $concat: [
                        "0",
                        { $toString: { $mod: ["$secHalfDuration", 60] } },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },

        {
          $group: {
            _id: "$_id",
            unitId: { $first: "$unitId" },
            shiftName: { $first: "$shiftName" },
            shiftTime: { $first: "$shiftTime" },
            weekWorkingDays: { $first: "$weekWorkingDays" },
            totalWorkingDurationInDay: { $first: "$totalWorkingDurationInDay" },
            durationFormat: { $first: "$durationFormat" },
            startTime: { $first: "$startTime" },
            endTime: { $first: "$endTime" },
            breakDuration: { $first: "$breakDuration" },
            breakDurationFormat: { $first: "$breakDurationFormat" },
            breakTime: { $first: "$breakTime" },

            breakStartTime: { $first: "$breakStartTime" },
            breakEndTime: { $first: "$breakEndTime" },
            weekEnds: { $first: "$weekEnds" },
            monthlyExtraWorkingDays: { $first: "$monthlyExtraWorkingDays" },
            halfDayStatus: { $first: "$halfDayStatus" },
            firstHalfDayStartTime: { $first: "$firstHalfDayStartTime" },
            firstHalfDayEndTime: { $first: "$firstHalfDayEndTime" },
            firstHalfTime: { $first: "$firstHalfTime" },
            firstHalfDuration: { $first: "$firstHalfDuration" },
            firstDurationFormat: { $first: "$firstDurationFormat" },

            secHalfDayStartTime: { $first: "$secHalfDayStartTime" },
            secHalfDayEndTime: { $first: "$secHalfDayEndTime" },
            secHalfTime: { $first: "$secHalfTime" },
            secHalfDuration: { $first: "$secHalfDuration" },
            secDurationFormat: { $first: "$secDurationFormat" },
            halfDayShortLoginExceedStatus: {
              $first: "$halfDayShortLoginExceedStatus",
            },
            halfDayShortLoginMin: { $first: "$halfDayShortLoginMin" },
            religiousBreakMin: { $first: "$religiousBreakMin" },
            monthlyExtraFreeMin: { $first: "$monthlyExtraFreeMin" },
            holidayDetails: { $push: "$holidayDetails" },
            shortLoginDeductions: { $first: "$shortLoginDeductions" },
            unPlannedLeaveExtraDeduction: {
              $first: "$unPlannedLeaveExtraDeduction",
            },
            plannedLeaveApplyBeforeDays: {
              $first: "$plannedLeaveApplyBeforeDays",
            },
            sickLeavePaidUnpaidStatus: { $first: "$sickLeavePaidUnpaidStatus" },
            sickLeaveDocumentDay: { $first: "$sickLeaveDocumentDay" },
            leaveAmountCalMonthDaysStatus: {
              $first: "$leaveAmountCalMonthDaysStatus",
            },
            totalAnnualPaidLeave: { $first: "$totalAnnualPaidLeave" },
            eachMonthPaidLeave: { $first: "$eachMonthPaidLeave" },
            paidLeaveDay: { $first: "$paidLeaveDay" },
            skipPaidLeaveMonth: { $first: "$skipPaidLeaveMonth" },
            carryForwordPaidLeaveStatus: {
              $first: "$carryForwordPaidLeaveStatus",
            },
            joiningDatePaidLeaveDeductions: {
              $first: "$joiningDatePaidLeaveDeductions",
            },
            afterTwoYearExtraPaidLeave: {
              $first: "$afterTwoYearExtraPaidLeave",
            },
            initialThreeMonthPaidLeaveStatus: {
              $first: "$initialThreeMonthPaidLeaveStatus",
            },
            maternityLeave: { $first: "$maternityLeave" },
            paternityLeave: { $first: "$paternityLeave" },
            weekOnceLeaveUnplanned: { $first: "$weekOnceLeaveUnplanned" },
            pfDeduction: { $first: "$pfDeduction" },
            esicDeduction: { $first: "$esicDeduction" },
            ptDeduction: { $first: "$ptDeduction" },
            otherAndTdsDeduction: { $first: "$otherAndTdsDeduction" },
            formattedCreatedAt: { $first: "$formattedCreatedAt" },
            activeFlag: { $first: "$activeFlag" },
            deleteFlag: { $first: "$deleteFlag" },
            createdAt: { $first: "$createdAt" },
            updatedAt: { $first: "$updatedAt" },
            unitDetails: { $first: "$unitDetails" },
            unitName: { $first: "$unitName" },
            timeZone: { $first: "$timeZone" },
          },
        },
        { $sort: { createdAt: -1 } },
      ]);

      if (shift && shift.length > 0) {
        return shift;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin getShifts", error.message);
      throw new Error(error.message);
    }
  },

  //================================================getTeams============================================================

  async getUnitTeams(SITE_DB_NAME, unitId) {
    const Team = await TeamModel(SITE_DB_NAME);
    try {
      const departments = await Team.aggregate([
        {
          $match: {
            unitId: unitId,
            deleteFlag: 0,
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
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $addFields: {
            unitDetails: { $ifNull: ["$unitDetails", "NA"] },
            unitName: {
              $cond: {
                if: { $ne: ["$unitDetails", "NA"] },
                then: "$unitDetails.unitName",
                else: "NA",
              },
            },
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $project: {
            _id: 1,
            teamName: 1,
            unitName: 1,
            unitId: 1,
            userDetails: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            formattedCreatedAt: 1,
          },
        },
      ]);

      if (departments && departments.length > 0) {
        return departments;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service getTeams details",
        error.message
      );
      throw new Error(error.message);
    }
  },

  //================================================employee============================================================

  async addRegistration(
    SITE_DB_NAME,
    unitId,
    companyId,
    shiftId,
    roleId,
    roleName,
    teamId,
    departmentId,
    reportingManagerId,
    accessLevel,
    designationName,
    name,
    firstName,
    lastName,
    uniqueId,
    empId,
    email,
    password,
    phoneCode,
    mobileNumber,
    personalEmail,
    joiningDate,
    profileComplete,
    approveFlag,
    approvedById,
    registeredById,
    showPassword
  ) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const addStatus = await User.create({
        unitId,
        companyId,
        shiftId,
        roleId,
        roleName,
        teamId,
        departmentId,
        reportingManagerId,
        accessLevel,
        designationName,
        name,
        firstName,
        lastName,
        uniqueId,
        empId,
        email,
        password,
        phoneCode,
        mobileNumber,
        personalEmail,
        joiningDate,
        profileComplete,
        approveFlag,
        approvedById,
        registeredById,
        showPassword,
      });
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin service addUnit", error.message);
      throw new Error(error.message);
    }
  },
  async updateRegistration(SITE_DB_NAME, employeeId, data) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const updateStatus = await User.updateOne(
        { _id: employeeId },
        {
          $set: data,
        }
      );
      return updateStatus.modifiedCount ? updateStatus : "NA";
    } catch (error) {
      console.error("Database error in updateRegistration:", error.message);
      throw new Error(error.message);
    }
  },

  //================================================getTeams============================================================

  async getTeams(SITE_DB_NAME, unitIds, deleteFlag) {
    const Team = await TeamModel(SITE_DB_NAME);
    try {
      const departments = await Team.aggregate([
        {
          $match: {
            unitId: { $in: unitIds },
            deleteFlag: deleteFlag,
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
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $addFields: {
            unitDetails: { $ifNull: ["$unitDetails", "NA"] },
            unitName: {
              $cond: {
                if: { $ne: ["$unitDetails", "NA"] },
                then: "$unitDetails.unitName",
                else: "NA",
              },
            },
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
        {
          $project: {
            _id: 1,
            teamName: 1,
            unitName: 1,
            unitId: 1,
            userDetails: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            formattedCreatedAt: 1,
          },
        },
      ]);

      if (departments && departments.length > 0) {
        return departments;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service getTeams details",
        error.message
      );
      throw new Error(error.message);
    }
  },
  //================================================employee============================================================

  async addEmployee(
    SITE_DB_NAME,
    unitId,
    companyId,
    shiftId,
    roleId,
    roleName,
    teamId,
    departmentId,
    reportingManagerId,
    accessLevel,
    designationName,
    name,
    firstName,
    lastName,
    uniqueId,
    empId,
    email,
    password,
    phoneCode,
    mobileNumber,
    personalEmail,
    fatherName,
    originalDob,
    dob,
    gender,
    aadharNumber,
    aadharImage,
    PANNumber,
    PANImage,
    address,
    addressProof,
    city,
    state,
    pincode,
    pAddress,
    pCity,
    pState,
    pPincode,
    joiningDate,
    image,
    salary,
    yearCTC,
    pfEligibleStatus,
    UAN,
    pfNumber,
    pFJoiningDate,
    pFExitDate,
    epsEligibleStatus,
    ePSJoiningDate,
    ePSExitDate,
    ptStatus,
    lwfEligibleStatus,
    hPSEligibleStatus,
    UPI,
    aadhaarEnrollmentNumber,
    physicallyChallenged,
    spouseName,
    motherName,
    maritalStatus,
    bloodGroup,
    religion,
    emergencyContactNumber,
    religiousBreak,
    bankName,
    bankAccountNumber,
    IFSCCode,
    accountHolderName,
    officialNumber,
    documents,
    CTCStatus,
    bankStatus,
    documentStatus,
    profileComplete,
    approvedById,
    registeredById,
    showPassword,
    eSICNumber
  ) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const addStatus = await User.create({
        unitId,
        companyId,
        shiftId,
        roleId,
        roleName,
        teamId,
        departmentId,
        reportingManagerId,
        accessLevel,
        designationName,
        name,
        firstName,
        lastName,
        uniqueId,
        empId,
        email,
        password,
        phoneCode,
        mobileNumber,
        personalEmail,
        fatherName,
        originalDob,
        dob,
        gender,
        aadharNumber,
        aadharImage,
        PANNumber,
        PANImage,
        address,
        addressProof,
        city,
        state,
        pincode,
        pAddress,
        pCity,
        pState,
        pPincode,
        joiningDate,
        image,
        salary,
        yearCTC,
        pfEligibleStatus,
        UAN,
        pfNumber,
        pFJoiningDate,
        pFExitDate,
        epsEligibleStatus,
        ePSJoiningDate,
        ePSExitDate,
        ptStatus,
        lwfEligibleStatus,
        hPSEligibleStatus,
        UPI,
        aadhaarEnrollmentNumber,
        physicallyChallenged,
        spouseName,
        motherName,
        maritalStatus,
        bloodGroup,
        religion,
        emergencyContactNumber,
        religiousBreak,
        bankName,
        bankAccountNumber,
        IFSCCode,
        accountHolderName,
        officialNumber,
        documents,
        CTCStatus,
        bankStatus,
        documentStatus,
        profileComplete,
        approvedById,
        registeredById,
        showPassword,
        eSICNumber,
      });
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin service addUnit", error.message);
      throw new Error(error.message);
    }
  },
  async checkEmployee(SITE_DB_NAME, employeeId) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const EmployeeStatus = await User.findOne({
        _id: employeeId,
        deleteFlag: 0,
      }); // 20 seconds timeout

      if (EmployeeStatus) {
        return EmployeeStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("unit find db error", error.message);
      throw new Error(error.message);
    }
  },

  async editEmployee(
    SITE_DB_NAME,
    employeeId,
    unitId,
    companyId,
    shiftId,
    roleId,
    roleName,
    teamId,
    departmentId,
    accessLevel,
    designationName,
    name,
    firstName,
    lastName,
    uniqueId,
    email,
    phoneCode,
    mobileNumber,
    personalEmail,
    fatherName,
    originalDob,
    dob,
    gender,
    aadharNumber,
    aadharImage,
    PANNumber,
    PANImage,
    address,
    addressProof,
    city,
    state,
    pincode,
    pAddress,
    pCity,
    pState,
    pPincode,
    joiningDate,
    image,
    pfEligibleStatus,
    UAN,
    pfNumber,
    pFJoiningDate,
    pFExitDate,
    epsEligibleStatus,
    ePSJoiningDate,
    ePSExitDate,
    ptStatus,
    lwfEligibleStatus,
    hPSEligibleStatus,
    UPI,
    aadhaarEnrollmentNumber,
    physicallyChallenged,
    spouseName,
    motherName,
    maritalStatus,
    bloodGroup,
    religion,
    emergencyContactNumber,
    religiousBreak,
    bankName,
    bankAccountNumber,
    IFSCCode,
    accountHolderName,
    officialNumber,
    documents,
    bankStatus,
    documentStatus,
    reportingManagerId,
    eSICNumber
  ) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const updateStatus = await User.updateOne(
        { _id: employeeId },
        {
          $set: {
            unitId,
            companyId,
            shiftId,
            roleId,
            roleName,
            teamId,
            departmentId,
            accessLevel,
            designationName,
            name,
            firstName,
            lastName,
            uniqueId,
            email,
            phoneCode,
            mobileNumber,
            personalEmail,
            fatherName,
            originalDob,
            dob,
            gender,
            aadharNumber,
            aadharImage,
            PANNumber,
            PANImage,
            address,
            addressProof,
            city,
            state,
            pincode,
            pAddress,
            pCity,
            pState,
            pPincode,
            joiningDate,
            image,
            pfEligibleStatus,
            UAN,
            pfNumber,
            pFJoiningDate,
            pFExitDate,
            epsEligibleStatus,
            ePSJoiningDate,
            ePSExitDate,
            ptStatus,
            lwfEligibleStatus,
            hPSEligibleStatus,
            UPI,
            aadhaarEnrollmentNumber,
            physicallyChallenged,
            spouseName,
            motherName,
            maritalStatus,
            bloodGroup,
            religion,
            emergencyContactNumber,
            religiousBreak,
            bankName,
            bankAccountNumber,
            IFSCCode,
            accountHolderName,
            officialNumber,
            documents,
            bankStatus,
            documentStatus,
            reportingManagerId,
            eSICNumber,
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
      console.log(
        "database error from admin service editEmployee",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async activeDeactiveEmployee(SITE_DB_NAME, employeeId, activeFlag) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const updateStatus = await User.updateOne(
        { _id: employeeId },
        { $set: { activeFlag: activeFlag } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service activeDeactiveEmployee",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async manualPunchEmployee(SITE_DB_NAME, employeeId, manualPunch) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const updateStatus = await User.updateOne(
        { _id: employeeId },
        { $set: { manualPunch: manualPunch } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service activeDeactiveEmployee",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async deleteEmployee(SITE_DB_NAME, employeeId, deleteFlag) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const updateStatus = await User.updateOne(
        { _id: employeeId },
        { $set: { deleteFlag: deleteFlag } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service deleteEmployee",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async approveEmployee(SITE_DB_NAME, employeeId, approveFlag) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const updateStatus = await User.updateOne(
        { _id: employeeId },
        { $set: { approveFlag: approveFlag } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service approveEmployee",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getEmployees(SITE_DB_NAME, unitIds, deleteFlag) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const user = await User.aggregate([
        {
          $match: {
            unitId: { $in: unitIds },
            deleteFlag: deleteFlag,
            approveFlag: 1,
            roleName: { $ne: "Site-Owner" },
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
            companyDetails: { $ifNull: ["$companyDetails", "NA"] }, // Set "NA" if no matching team
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
              },
            },
            formattedlastLoginTime: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$lastLoginTime",
              },
            },
            formattedJoiningDate: {
              $cond: {
                if: { $eq: [{ $type: "$joiningDate" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$joiningDate",
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
            relievingDate: 1,
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
        error.message
      );
      throw new Error(error.message);
    }
  },
  async viewEmployee(SITE_DB_NAME, userId) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const user = await User.aggregate([
        {
          $match: { _id: userId, roleName: { $ne: "Site-Owner" } },
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
            companyDetails: { $ifNull: ["$companyDetails", "NA"] }, // Set "NA" if no matching team
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
              },
            },
            formattedlastLoginTime: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$lastLoginTime",
              },
            },
            formattedJoiningDate: {
              $cond: {
                if: { $eq: [{ $type: "$joiningDate" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$joiningDate",
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
            relievingDate: 1,
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
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getUnitEmployees(SITE_DB_NAME, unitId, deleteFlag) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const user = await User.aggregate([
        {
          $match: {
            roleName: { $ne: "Site-Owner" },
            unitId: { $in: [unitId] },
            deleteFlag: deleteFlag,
            approveFlag: 1,
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
            companyDetails: { $ifNull: ["$companyDetails", "NA"] }, // Set "NA" if no matching team
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
              },
            },
            formattedlastLoginTime: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$lastLoginTime",
              },
            },
            formattedJoiningDate: {
              $cond: {
                if: { $eq: [{ $type: "$joiningDate" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$joiningDate",
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
            relievingDate: 1,
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
            formattedPhysicallyChallenged: 1,
            formattedReligiousBreak: 1,
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
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getReportingManagerAll(SITE_DB_NAME, unitId, deleteFlag) {
    const User = await UserModel(SITE_DB_NAME);
    const objectIdUnitIds = await unitId.map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    try {
      const user = await User.aggregate([
        {
          $match: {
            deleteFlag: deleteFlag,
            approveFlag: 1,
            $or: [
              { roleName: "Site-Owner" },
              {
                unitId: { $in: objectIdUnitIds },
              },
            ],
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
            companyDetails: { $ifNull: ["$companyDetails", "NA"] }, // Set "NA" if no matching team
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
              },
            },
            formattedlastLoginTime: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$lastLoginTime",
              },
            },
            formattedJoiningDate: {
              $cond: {
                if: { $eq: [{ $type: "$joiningDate" }, "date"] },
                then: {
                  $dateToString: {
                    format: "%d-%m-%Y",
                    date: "$joiningDate",
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
        error.message
      );
      throw new Error(error.message);
    }
  },
  //================================================department============================================================

  async addDepartment(SITE_DB_NAME, departmentName) {
    const Department = await DepartmentModel(SITE_DB_NAME);
    try {
      const addStatus = await Department.create({
        departmentName: departmentName,
      });
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service addDepartment",
        error.message
      );
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
            $set: { departmentId: id },
          }
        );
      }
      // Step 1: Assign role to selected users
      // Step 2: Remove role from users not in the new list
      const removeQuery = {
        departmentId: id,
        ...(objectIds.length > 0 && { _id: { $nin: objectIds } }), // not in the list
      };

      const updatedRemoved = await User.updateMany(removeQuery, {
        $set: { departmentId: null },
      });

      return updatedRemoved;
    } catch (error) {
      console.error("Error in updateMultiPeopleAndRemove:", error);
      throw new Error(error.message);
    }
  },

  async getMultiPeopleDepartment(SITE_DB_NAME, departmentId) {
    const Department = await DepartmentModel(SITE_DB_NAME);
    try {
      const roleDetails = await Department.aggregate([
        {
          $match: {
            deleteFlag: 0,
            _id: new mongoose.Types.ObjectId(departmentId), // ensure ObjectId
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "_id", // department._id
            foreignField: "departmentId", // user.departmentId
            as: "assignedUsers",
          },
        },
        {
          $project: {
            _id: 1,
            departmentName: 1,
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
      console.error("Error in getMultiPeopleDepartment:", error);
      throw new Error(error.message);
    }
  },

  async checkDepartment(SITE_DB_NAME, departmentId) {
    const Department = await DepartmentModel(SITE_DB_NAME);
    try {
      const departmentStatus = await Department.findOne({
        _id: departmentId,
        deleteFlag: 0,
      }); // 20 seconds timeout

      if (departmentStatus) {
        return departmentStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("department find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkDepartmentView(SITE_DB_NAME, departmentId) {
    const Department = await DepartmentModel(SITE_DB_NAME);
    try {
      const departmentStatus = await Department.findOne({ _id: departmentId }); // 20 seconds timeout

      if (departmentStatus) {
        return departmentStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("department find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkDepartmentWithName(SITE_DB_NAME, departmentId, departmentName) {
    const Department = await DepartmentModel(SITE_DB_NAME);
    try {
      const departmentStatus = await Department.findOne({
        _id: { $ne: departmentId },
        departmentName: departmentName,
        deleteFlag: 0,
      }); // 20 seconds timeout
      if (departmentStatus) {
        return departmentStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("department find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkDepartmentName(SITE_DB_NAME, departmentName) {
    const Department = await DepartmentModel(SITE_DB_NAME);
    try {
      const departmentStatus = await Department.findOne({
        departmentName: departmentName,
        deleteFlag: 0,
      }); // 20 seconds timeout

      if (departmentStatus) {
        return departmentStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("department find db error", error.message);
      throw new Error(error.message);
    }
  },
  async editDepartment(SITE_DB_NAME, departmentId, departmentName) {
    const Department = await DepartmentModel(SITE_DB_NAME);
    try {
      const updateStatus = await Department.updateOne(
        { _id: departmentId },
        {
          $set: {
            departmentName: departmentName,
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
      console.log("database error from admin service editUnit", error.message);
      throw new Error(error.message);
    }
  },
  async activeDeactiveDepartment(SITE_DB_NAME, departmentId, activeFlag) {
    const Department = await DepartmentModel(SITE_DB_NAME);
    try {
      const updateStatus = await Department.updateOne(
        { _id: departmentId },
        { $set: { activeFlag: activeFlag } },
        { upsert: false }
      );
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log(
        "database error from admin service activeDeactiveDepartment",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async deleteDepartment(SITE_DB_NAME, departmentId) {
    const Department = await DepartmentModel(SITE_DB_NAME);
    const User = await UserModel(SITE_DB_NAME); // ⭐ FIXED: User model import

    try {
      // Step 1: Mark Department as deleted
      const updateStatus = await Department.updateOne(
        { _id: departmentId },
        { $set: { deleteFlag: 1 } }
      );

      // Step 2: Remove departmentId from all assigned users
      const updateUsers = await User.updateMany(
        { departmentId: departmentId }, // ⭐ FIXED: correct field
        { $set: { departmentId: null } }
      );

      return {
        deletedDepartments: updateStatus.modifiedCount,
        updatedUsers: updateUsers.modifiedCount,
      };
    } catch (error) {
      console.log(
        "database error from admin service deletedepartment",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getDepartments(SITE_DB_NAME, deleteFlag, pagination, search) {
    const Department = await DepartmentModel(SITE_DB_NAME);
    try {
      const { pageSize, pageNumber } = pagination;
      const skip = (pageNumber - 1) * pageSize;

      let query = {
        deleteFlag: deleteFlag,
      };

      if (search && search.trim() !== "") {
        const regex = new RegExp(search.trim(), "i"); // case-insensitive regex
        query.$or = [{ departmentName: regex }];
      }
      const departments = await Department.aggregate([
        { $match: query },
        {
          $lookup: {
            from: "users",
            localField: "_id", // designation._id
            foreignField: "departmentId", // user.designationId
            as: "assignedUsers",
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
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: pageSize },
        {
          $project: {
            _id: 1,
            departmentName: 1,
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
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            formattedCreatedAt: 1,
          },
        },
      ]);

      if (departments && departments.length > 0) {
        return departments;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service departments details",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getDepartmentOne(SITE_DB_NAME, departmentId) {
    const Department = await DepartmentModel(SITE_DB_NAME);
    try {
      const departments = await Department.aggregate([
        {
          $match: {
            _id: departmentId,
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
        {
          $project: {
            _id: 1,
            departmentName: 1,
            activeFlag: 1,
            deleteFlag: 1,
            createdAt: 1,
            updatedAt: 1,
            formattedCreatedAt: 1,
          },
        },
      ]);

      if (departments && departments.length > 0) {
        return departments[0];
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service department details",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getShiftIdsByUnitIds(SITE_DB_NAME, unitIds) {
    const Shift = await ShiftModel(SITE_DB_NAME);
    try {
      const result = await Shift.aggregate([
        {
          $match: { unitId: { $in: unitIds } },
        },
        {
          $group: {
            _id: null,
            shiftIds: { $push: "$_id" },
          },
        },
        {
          $project: {
            _id: 0,
            shiftIds: 1,
          },
        },
      ]);
      return result.length > 0 ? result[0].shiftIds : [];
    } catch (error) {
      console.log(
        "database error from admin service getShiftIdsByUnitIds details",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getEmployeeByUniqueId(SITE_DB_NAME, uniqueId) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const getEmployee = await User.findOne({
        deleteFlag: 0,
        uniqueId: uniqueId,
      });
      if (getEmployee) {
        return getEmployee;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log(
        "database error from admin service getEmployee",
        error.message
      );
      throw new Error(error.message);
    }
  },
  async getRoleByRoleName(SITE_DB_NAME, roleName) {
    const Role = await RoleModel(SITE_DB_NAME);
    try {
      const getRoles = await Permission.findOne({
        deleteFlag: 0,
        roleName: roleName,
      });
      if (getRoles) {
        return getRoles;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin service getRoles", error.message);
      throw new Error(error.message);
    }
  },
  async getUnitByUnitName(SITE_DB_NAME, unitName) {
    const Unit = await UnitModel(SITE_DB_NAME);
    try {
      const getUnits = await Unit.findOne({
        deleteFlag: 0,
        unitName: unitName,
      });
      if (getUnits) {
        return getUnits;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin service getRoles", error.message);
      throw new Error(error.message);
    }
  },
  async getShiftByShiftName(SITE_DB_NAME, shiftName) {
    const Shift = await ShiftModel(SITE_DB_NAME);
    try {
      const getShifts = await Shift.findOne({
        deleteFlag: 0,
        shiftName: shiftName,
      });
      if (getShifts) {
        return getShifts;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin service getRoles", error.message);
      throw new Error(error.message);
    }
  },
  async getTeamByTeamName(SITE_DB_NAME, teamName) {
    const Team = await TeamModel(SITE_DB_NAME);
    try {
      const getTeams = await Team.findOne({
        deleteFlag: 0,
        teamName: teamName,
      });
      if (getTeams) {
        return getTeams;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin service getRoles", error.message);
      throw new Error(error.message);
    }
  },
  async getDepartmentByDepartmentName(SITE_DB_NAME, departmentName) {
    const Department = await DepartmentModel(SITE_DB_NAME);
    try {
      const getDepartments = await Department.findOne({
        deleteFlag: 0,
        departmentName: departmentName,
      });

      if (getDepartments) {
        return getDepartments;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin service getRoles", error.message);
      throw new Error(error.message);
    }
  },
  async getReportingManagerByReportingManagerName(
    SITE_DB_NAME,
    reportingManagerName
  ) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const getReportingManagers = await User.findOne({
        deleteFlag: 0,
        name: reportingManagerName,
      });
      if (getReportingManagers) {
        return getReportingManagers;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin service getRoles", error.message);
      throw new Error(error.message);
    }
  },

  async getSuperAdminId(SITE_DB_NAME) {
    const User = await UserModel(SITE_DB_NAME);
    try {
      const superAdmin = await User.findOne(
        { roleName: "Site-Owner" },
        { _id: 1 }
      );

      if (!superAdmin) {
        return 0;
      }

      return superAdmin._id;
    } catch (error) {
      console.error("Error fetching Site-Owner ID:", error);
      throw error;
    }
  },

  async getPunchLastRecordId(SITE_DB_NAME) {
    const PunchRecord = await PunchRecordModel(SITE_DB_NAME);
    try {
      const punchRecord = await PunchRecord.findOne().select(
        "lastGlobalRecordId"
      );
      if (!punchRecord) {
        return 0;
      }

      return punchRecord.lastGlobalRecordId;
    } catch (error) {
      console.error("Error fetching punchRecord ID:", error);
      throw error;
    }
  },
  async storePunchRecord(SITE_DB_NAME, punchDataArray, currentMonth) {
    const PunchRecord = await PunchRecordModel(SITE_DB_NAME);
    try {
      let lastRecordId = 0;
      const batchSize = 100;
      let bulkOperations = [];
      let newInsertedRecords = [];

      let punchRecord = await PunchRecord.findOne({
        "punchesRecord.month": currentMonth,
      });

      if (!punchRecord) {
        await PunchRecord.updateOne(
          {},
          {
            $push: {
              punchesRecord: {
                month: currentMonth,
                punches: [],
                lastRecordId: 0,
              },
            },
          },
          { upsert: true }
        );
      }
      let existingRecordIds = await PunchRecord.findOne({
        "punchesRecord.month": currentMonth,
      });

      let existingIds = new Set(
        existingRecordIds?.punchesRecord
          ?.find((p) => p.month === currentMonth)
          ?.punches.map((p) => p.recordId) || []
      );

      for (let i = 0; i < punchDataArray.length; i += batchSize) {
        let batch = punchDataArray
          .map((punchData) => {
            if (!punchData.recordId) return null;
            lastRecordId = punchData.recordId;
            if (existingIds.has(punchData.recordId)) {
            } else {
              newInsertedRecords.push(punchData);
            }
            return {
              updateOne: {
                filter: {
                  "punchesRecord.month": currentMonth,
                  "punchesRecord.punches.recordId": punchData.recordId,
                },
                update: {
                  $set: {
                    "punchesRecord.$[monthElem].punches.$[punchElem]":
                      punchData,
                  },
                },
                arrayFilters: [
                  { "monthElem.month": currentMonth },
                  { "punchElem.recordId": punchData.recordId },
                ],
                upsert: false,
              },
            };
          })
          .filter((punch) => punch !== null);

        if (batch.length > 0) {
          bulkOperations.push(...batch);
        }
      }

      let newPunches = punchDataArray.map((punchData) => ({
        updateOne: {
          filter: {
            "punchesRecord.month": currentMonth,
            "punchesRecord.punches.recordId": { $ne: punchData.recordId },
          },
          update: {
            $push: { "punchesRecord.$.punches": punchData },
          },
          upsert: false,
        },
      }));

      bulkOperations.push(...newPunches);
      if (bulkOperations.length > 0) {
        newRecord = await PunchRecord.bulkWrite(bulkOperations, {
          ordered: false,
        });
      }
      const filter = { "punchesRecord.month": currentMonth };
      const update = {
        $set: { "punchesRecord.$.lastRecordId": lastRecordId },
      };
      await PunchRecord.updateOne(filter, update);

      let punchesRecord = await PunchRecord.findOne();
      if (!punchesRecord) {
        punchesRecord = new PunchRecord({
          punchesRecord: [],
          lastGlobalRecordId: 0,
        });
      }
      punchesRecord.lastGlobalRecordId = lastRecordId;
      await punchesRecord.save();
      return {
        lastGlobalRecordId: lastRecordId,
        newRecord: newInsertedRecords,
      };
    } catch (error) {
      console.error("❌ Error storing punch records:", error);
      throw error;
    }
  },
};
