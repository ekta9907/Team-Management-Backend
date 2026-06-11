require("dotenv").config();
const mongoose = require("mongoose");

const Permission = require("../../models/superAdminModels/accessPermissionModel");
const User = require("../../models/workspaceModels/userModel");
const Role = require("../../models/workspaceModels/roleModel");
const Team = require("../../models/workspaceModels/teamModel");
const Unit = require("../../models/workspaceModels/unitModel");
const Shift = require("../../models/workspaceModels/shiftModel");
const Company = require("../../models/workspaceModels/companyModel");
const Holiday = require("../../models/workspaceModels/holidayModel");
const WeekDay = require("../../models/workspaceModels/weekDayModel");
const Department = require("../../models/workspaceModels/departmentModel");
const TIME_ZONE = process.env.TIME_ZONE;
module.exports = {
  //================================================dashboard============================================================
  async getUnitsCount(unitIds, deleteFlag) {
    try {
      const getCountDocuments = await Unit.countDocuments({ _id: { $in: unitIds }, deleteFlag: deleteFlag });
      if (getCountDocuments) {
        return getCountDocuments;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from admin service getCountDocuments", error.message);
      return error.message;
    }
  },
  async getShiftsCount(unitIds, deleteFlag) {
    try {
      const getCountDocuments = await Shift.countDocuments({ unitId: { $in: unitIds }, deleteFlag: deleteFlag });
      if (getCountDocuments) {
        return getCountDocuments;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from admin service getCountDocuments", error.message);
      return error.message;
    }
  },
  async getUserCount(unitIds, deleteFlag) {
    try {
      const getCountDocuments = await User.countDocuments({ unitId: { $in: unitIds }, deleteFlag: deleteFlag, roleName: { $ne: "Super-Admin" } });
      if (getCountDocuments) {
        return getCountDocuments;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from admin service getCountDocuments", error.message);
      return error.message;
    }
  },
  async getEmployeeCounts(unitIds, deleteFlag) {
    try {
      const getCountDocuments = await User.countDocuments({ unitId: { $in: unitIds }, deleteFlag: deleteFlag, roleName: { $nin: ["Super-Admin", "Admin"] } });
      if (getCountDocuments) {
        return getCountDocuments;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from admin service getCountDocuments", error.message);
      return error.message;
    }
  },
  async getAdminCount(unitIds, deleteFlag) {
    try {
      const getCountDocuments = await User.countDocuments({ unitId: { $in: unitIds }, deleteFlag: deleteFlag, roleName: { $eq: "Admin" } });
      if (getCountDocuments) {
        return getCountDocuments;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from admin service getCountDocuments", error.message);
      return error.message;
    }
  },
  async getEmployeeCount(unitIds, relievingStatus, deleteFlag) {
    try {
      const getCountDocuments = await User.countDocuments({ unitId: { $in: unitIds }, deleteFlag: deleteFlag, relievingStatus: relievingStatus, roleName: { $ne: "Super-Admin" } });
      if (getCountDocuments) {
        return getCountDocuments;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from admin service getCountDocuments", error.message);
      return error.message;
    }
  },
  //================================================Companies============================================================
  async getCompanies() {
    try {
      const getCompanies = await Company.find({ deleteFlag: 0 });
      if (getCompanies) {
        return getCompanies;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin service getCompanies", error.message);
      return error.message;
    }
  },

  //================================================WeekDays============================================================
  async getWeekDays() {
    try {
      const getWeekDays = await WeekDay.find({ deleteFlag: 0 });
      if (getWeekDays) {
        return getWeekDays;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin service getWeekDays", error.message);
      return error.message;
    }
  },
  //================================================units============================================================

  async addUnit(unitName, companyId) {
    try {
      const addStatus = await Unit.create({ unitName: unitName, companyId: companyId });
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
  async checkUnit(unitId) {
    try {
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
  async checkUnitView(unitId) {
    try {
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
  async checkUnitWithName(unitId, unitName) {
    try {
      const unitStatus = await Unit.findOne({ _id: { $ne: unitId }, unitName: unitName, deleteFlag: 0 }); // 20 seconds timeout
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
  async checkUnitName(unitName) {
    try {
      const unitStatus = await Unit.findOne({ unitName: unitName, deleteFlag: 0 }); // 20 seconds timeout

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
  async editUnit(unitId, unitName, companyId) {
    try {
      const updateStatus = await Unit.updateOne({ _id: unitId }, { $set: { unitName: unitName, companyId: companyId } }, { upsert: false });
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
  async activeDeactiveUnit(unitId, activeFlag) {
    try {
      const updateStatus = await Unit.updateOne({ _id: unitId }, { $set: { activeFlag: activeFlag } }, { upsert: false });
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from admin service activeDeactiveUnit", error.message);
      throw new Error(error.message);
    }
  },
  async deleteUnit(unitId, deleteFlag) {
    try {
      const updateStatus = await Unit.updateOne({ _id: unitId }, { $set: { deleteFlag: deleteFlag } }, { upsert: false });
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from admin service deleteUnit", error.message);
      throw new Error(error.message);
    }
  },

  async getUnits(unitIds, deleteFlag) {
    try {
      const units = await Unit.aggregate([
        {
          $match: {
            _id: { $in: unitIds },
            deleteFlag: deleteFlag,
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
                timezone: TIME_ZONE || "Asia/Kolkata",
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
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
        return units;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin service units details", error.message);
      throw new Error(error.message);
    }
  },
  async getUnitOne(unitId) {
    try {
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
                timezone: TIME_ZONE || "Asia/Kolkata",
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
  //================================================roles============================================================
  async getRoles() {
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
  //================================================department============================================================
  async getUnitDepartments(deleteFlag) {
    try {
      const getDepartments = await Department.find({ deleteFlag: deleteFlag });

      if (getDepartments) {
        return getDepartments;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin service getDepartments", error.message);
      return error.message;
    }
  },
  //================================================getTeams============================================================

  async getUnitTeams(unitId) {
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
                timezone: TIME_ZONE || "Asia/Kolkata",
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
      console.log("database error from admin service getTeams details", error.message);
      throw new Error(error.message);
    }
  },
  async getTeams(unitIds, deleteFlag) {
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
                timezone: TIME_ZONE || "Asia/Kolkata",
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
      console.log("database error from admin service getTeams details", error.message);
      throw new Error(error.message);
    }
  },
  //================================================Shifts============================================================

  async addShift(
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
  async checkShift(shiftId) {
    try {
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
  async checkShiftOne(shiftId) {
    try {
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
  async checkShiftWithName(shiftId, shiftName) {
    try {
      const shiftStatus = await Shift.findOne({ _id: { $ne: shiftId }, shiftName: shiftName, deleteFlag: 0 }); // 20 seconds timeout
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
  async checkShiftName(shiftName) {
    try {
      const shiftStatus = await Shift.findOne({ shiftName: shiftName, deleteFlag: 0 }); // 20 seconds timeout

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
  async activeDeactiveShift(shiftId, activeFlag) {
    try {
      const updateStatus = await Shift.updateOne({ _id: shiftId }, { $set: { activeFlag: activeFlag } }, { upsert: false });
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from admin service activeDeactiveShift", error.message);
      throw new Error(error.message);
    }
  },
  async deleteShift(shiftId, deleteFlag) {
    try {
      const updateStatus = await Shift.updateOne({ _id: shiftId }, { $set: { deleteFlag: deleteFlag } }, { upsert: false });
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from admin service deleteShift", error.message);
      throw new Error(error.message);
    }
  },

  async getShifts(unitIds, deleteFlag) {
    try {
      const shift = await Shift.aggregate([
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
              $concat: [{ $ifNull: ["$startTime", ""] }, " TO ", { $ifNull: ["$endTime", ""] }],
            },
            breakTime: {
              $concat: [{ $ifNull: ["$breakStartTime", ""] }, " TO ", { $ifNull: ["$breakEndTime", ""] }],
            },
            firstHalfTime: {
              $concat: [{ $ifNull: ["$firstHalfDayStartTime", ""] }, " TO ", { $ifNull: ["$firstHalfDayEndTime", ""] }],
            },
            secHalfTime: {
              $concat: [{ $ifNull: ["$secHalfDayStartTime", ""] }, " TO ", { $ifNull: ["$secHalfDayEndTime", ""] }],
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
                    if: { $gte: [{ $mod: ["$totalWorkingDurationInDay", 60] }, 10] },
                    then: { $toString: { $mod: ["$totalWorkingDurationInDay", 60] } },
                    else: {
                      $concat: ["0", { $toString: { $mod: ["$totalWorkingDurationInDay", 60] } }],
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
                      $concat: ["0", { $toString: { $mod: ["$breakDuration", 60] } }],
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
                      $concat: ["0", { $toString: { $mod: ["$firstHalfDuration", 60] } }],
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
                      $concat: ["0", { $toString: { $mod: ["$secHalfDuration", 60] } }],
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
            halfDayShortLoginExceedStatus: { $first: "$halfDayShortLoginExceedStatus" },
            halfDayShortLoginMin: { $first: "$halfDayShortLoginMin" },
            religiousBreakMin: { $first: "$religiousBreakMin" },
            monthlyExtraFreeMin: { $first: "$monthlyExtraFreeMin" },
            holidayDetails: { $push: "$holidayDetails" },
            shortLoginDeductions: { $first: "$shortLoginDeductions" },
            unPlannedLeaveExtraDeduction: { $first: "$unPlannedLeaveExtraDeduction" },
            plannedLeaveApplyBeforeDays: { $first: "$plannedLeaveApplyBeforeDays" },
            sickLeavePaidUnpaidStatus: { $first: "$sickLeavePaidUnpaidStatus" },
            sickLeaveDocumentDay: { $first: "$sickLeaveDocumentDay" },
            leaveAmountCalMonthDaysStatus: { $first: "$leaveAmountCalMonthDaysStatus" },
            totalAnnualPaidLeave: { $first: "$totalAnnualPaidLeave" },
            eachMonthPaidLeave: { $first: "$eachMonthPaidLeave" },
            paidLeaveDay: { $first: "$paidLeaveDay" },
            skipPaidLeaveMonth: { $first: "$skipPaidLeaveMonth" },
            carryForwordPaidLeaveStatus: { $first: "$carryForwordPaidLeaveStatus" },
            joiningDatePaidLeaveDeductions: { $first: "$joiningDatePaidLeaveDeductions" },
            afterTwoYearExtraPaidLeave: { $first: "$afterTwoYearExtraPaidLeave" },
            initialThreeMonthPaidLeaveStatus: { $first: "$initialThreeMonthPaidLeaveStatus" },
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
        return shift;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin getShifts", error.message);
      throw new Error(error.message);
    }
  },

  async getOneShift(shiftId) {
    try {
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
              $concat: [{ $ifNull: ["$startTime", ""] }, " TO ", { $ifNull: ["$endTime", ""] }],
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
            halfDayShortLoginExceedStatus: { $first: "$halfDayShortLoginExceedStatus" },
            halfDayShortLoginMin: { $first: "$halfDayShortLoginMin" },
            religiousBreakMin: { $first: "$religiousBreakMin" },
            monthlyExtraFreeMin: { $first: "$monthlyExtraFreeMin" },
            holidayDetails: { $push: "$holidayDetails" },
            shortLoginDeductions: { $first: "$shortLoginDeductions" },

            unPlannedLeaveExtraDeduction: { $first: "$unPlannedLeaveExtraDeduction" },
            plannedLeaveApplyBeforeDays: { $first: "$plannedLeaveApplyBeforeDays" },
            sickLeavePaidUnpaidStatus: { $first: "$sickLeavePaidUnpaidStatus" },
            sickLeaveDocumentDay: { $first: "$sickLeaveDocumentDay" },
            leaveAmountCalMonthDaysStatus: { $first: "$leaveAmountCalMonthDaysStatus" },
            totalAnnualPaidLeave: { $first: "$totalAnnualPaidLeave" },
            eachMonthPaidLeave: { $first: "$eachMonthPaidLeave" },
            paidLeaveDay: { $first: "$paidLeaveDay" },
            skipPaidLeaveMonth: { $first: "$skipPaidLeaveMonth" },
            carryForwordPaidLeaveStatus: { $first: "$carryForwordPaidLeaveStatus" },
            joiningDatePaidLeaveDeductions: { $first: "$joiningDatePaidLeaveDeductions" },
            afterTwoYearExtraPaidLeave: { $first: "$afterTwoYearExtraPaidLeave" },
            initialThreeMonthPaidLeaveStatus: { $first: "$initialThreeMonthPaidLeaveStatus" },
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
      console.log("database error from admin service getOneShift", error.message);
      throw new Error(error.message);
    }
  },
  async getUnitShifts(unitId, deleteFlag) {
    try {
      const objectIdUnitIds = await unitId.map((id) => new mongoose.Types.ObjectId(id));
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
              $concat: [{ $ifNull: ["$startTime", ""] }, " TO ", { $ifNull: ["$endTime", ""] }],
            },
            breakTime: {
              $concat: [{ $ifNull: ["$breakStartTime", ""] }, " TO ", { $ifNull: ["$breakEndTime", ""] }],
            },
            firstHalfTime: {
              $concat: [{ $ifNull: ["$firstHalfDayStartTime", ""] }, " TO ", { $ifNull: ["$firstHalfDayEndTime", ""] }],
            },
            secHalfTime: {
              $concat: [{ $ifNull: ["$secHalfDayStartTime", ""] }, " TO ", { $ifNull: ["$secHalfDayEndTime", ""] }],
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
                    if: { $gte: [{ $mod: ["$totalWorkingDurationInDay", 60] }, 10] },
                    then: { $toString: { $mod: ["$totalWorkingDurationInDay", 60] } },
                    else: {
                      $concat: ["0", { $toString: { $mod: ["$totalWorkingDurationInDay", 60] } }],
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
                      $concat: ["0", { $toString: { $mod: ["$breakDuration", 60] } }],
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
                      $concat: ["0", { $toString: { $mod: ["$firstHalfDuration", 60] } }],
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
                      $concat: ["0", { $toString: { $mod: ["$secHalfDuration", 60] } }],
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
            halfDayShortLoginExceedStatus: { $first: "$halfDayShortLoginExceedStatus" },
            halfDayShortLoginMin: { $first: "$halfDayShortLoginMin" },
            religiousBreakMin: { $first: "$religiousBreakMin" },
            monthlyExtraFreeMin: { $first: "$monthlyExtraFreeMin" },
            holidayDetails: { $push: "$holidayDetails" },
            shortLoginDeductions: { $first: "$shortLoginDeductions" },
            unPlannedLeaveExtraDeduction: { $first: "$unPlannedLeaveExtraDeduction" },
            plannedLeaveApplyBeforeDays: { $first: "$plannedLeaveApplyBeforeDays" },
            sickLeavePaidUnpaidStatus: { $first: "$sickLeavePaidUnpaidStatus" },
            sickLeaveDocumentDay: { $first: "$sickLeaveDocumentDay" },
            leaveAmountCalMonthDaysStatus: { $first: "$leaveAmountCalMonthDaysStatus" },
            totalAnnualPaidLeave: { $first: "$totalAnnualPaidLeave" },
            eachMonthPaidLeave: { $first: "$eachMonthPaidLeave" },
            paidLeaveDay: { $first: "$paidLeaveDay" },
            skipPaidLeaveMonth: { $first: "$skipPaidLeaveMonth" },
            carryForwordPaidLeaveStatus: { $first: "$carryForwordPaidLeaveStatus" },
            joiningDatePaidLeaveDeductions: { $first: "$joiningDatePaidLeaveDeductions" },
            afterTwoYearExtraPaidLeave: { $first: "$afterTwoYearExtraPaidLeave" },
            initialThreeMonthPaidLeaveStatus: { $first: "$initialThreeMonthPaidLeaveStatus" },
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
  //================================================employee============================================================

  async addEmployee(
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
  async checkEmployee(employeeId) {
    try {
      const EmployeeStatus = await User.findOne({ _id: employeeId, deleteFlag: 0 }); // 20 seconds timeout

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

  async editEmployee(
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
      console.log("database error from admin service editEmployee", error.message);
      throw new Error(error.message);
    }
  },
  async activeDeactiveEmployee(employeeId, activeFlag) {
    try {
      const updateStatus = await User.updateOne({ _id: employeeId }, { $set: { activeFlag: activeFlag } }, { upsert: false });
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from admin service activeDeactiveEmployee", error.message);
      throw new Error(error.message);
    }
  },
  async manualPunchEmployee(employeeId, manualPunch) {
    try {
      const updateStatus = await User.updateOne({ _id: employeeId }, { $set: { manualPunch: manualPunch } }, { upsert: false });
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from admin service activeDeactiveEmployee", error.message);
      throw new Error(error.message);
    }
  },
  async deleteEmployee(employeeId, deleteFlag) {
    try {
      const updateStatus = await User.updateOne({ _id: employeeId }, { $set: { deleteFlag: deleteFlag } }, { upsert: false });
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from admin service deleteEmployee", error.message);
      throw new Error(error.message);
    }
  },
  async approveEmployee(employeeId, approveFlag) {
    try {
      const updateStatus = await User.updateOne({ _id: employeeId }, { $set: { approveFlag: approveFlag } }, { upsert: false });
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from admin service approveEmployee", error.message);
      throw new Error(error.message);
    }
  },
  async getEmployees(unitIds, deleteFlag) {
    try {
      const user = await User.aggregate([
        {
          $match: { unitId: { $in: unitIds }, deleteFlag: deleteFlag, approveFlag: 1, roleName: { $ne: "Super-Admin" } },
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
            departmentName: { $ifNull: ["$departmentDetails.departmentName", "NA"] },
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
              $ifNull: [{ $arrayElemAt: ["$reportingManagerDetails.name", 0] }, "NA"],
            },
            reportingManagerName: {
              $ifNull: [{ $arrayElemAt: ["$reportingManagerDetails.name", 0] }, "NA"],
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
      console.log("database error from commen service user details", error.message);
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
              $ifNull: [{ $arrayElemAt: ["$reportingManagerDetails.name", 0] }, "NA"],
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
      console.log("database error from commen service user details", error.message);
      throw new Error(error.message);
    }
  },
  async getUnitEmployees(unitId, deleteFlag) {
    try {
      const user = await User.aggregate([
        {
          $match: {
            roleName: { $ne: "Super-Admin" },
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
            departmentName: { $ifNull: ["$departmentDetails.departmentName", "NA"] },
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
              $ifNull: [{ $arrayElemAt: ["$reportingManagerDetails.name", 0] }, "NA"],
            },
            reportingManagerName: {
              $ifNull: [{ $arrayElemAt: ["$reportingManagerDetails.name", 0] }, "NA"],
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
      console.log("database error from commen service user details", error.message);
      throw new Error(error.message);
    }
  },
  async getReportingManagerAll(unitId, deleteFlag) {
    const objectIdUnitIds = await unitId.map((id) => new mongoose.Types.ObjectId(id));

    try {
      const user = await User.aggregate([
        {
          $match: {
            deleteFlag: deleteFlag,
            approveFlag: 1,
            $or: [
              { roleName: "Super-Admin" },
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
              $ifNull: [{ $arrayElemAt: ["$reportingManagerDetails.name", 0] }, "NA"],
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
      console.log("database error from commen service user details", error.message);
      throw new Error(error.message);
    }
  },
  //================================================department============================================================

  async addDepartment(departmentName) {
    try {
      const addStatus = await Department.create({ departmentName: departmentName });
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin service addDepartment", error.message);
      throw new Error(error.message);
    }
  },
  async checkDepartment(departmentId) {
    try {
      const departmentStatus = await Department.findOne({ _id: departmentId, deleteFlag: 0 }); // 20 seconds timeout

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
  async checkDepartmentView(departmentId) {
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
  async checkDepartmentWithName(departmentId, departmentName) {
    try {
      const departmentStatus = await Department.findOne({ _id: { $ne: departmentId }, departmentName: departmentName, deleteFlag: 0 }); // 20 seconds timeout
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
  async checkDepartmentName(departmentName) {
    try {
      const departmentStatus = await Department.findOne({ departmentName: departmentName, deleteFlag: 0 }); // 20 seconds timeout

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
  async editDepartment(departmentId, departmentName) {
    try {
      const updateStatus = await Department.updateOne({ _id: departmentId }, { $set: { departmentName: departmentName } }, { upsert: false });
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
  async activeDeactiveDepartment(departmentId, activeFlag) {
    try {
      const updateStatus = await Department.updateOne({ _id: departmentId }, { $set: { activeFlag: activeFlag } }, { upsert: false });
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from admin service activeDeactiveDepartment", error.message);
      throw new Error(error.message);
    }
  },
  async deleteDepartment(departmentId, deleteFlag) {
    try {
      const updateStatus = await Department.updateOne({ _id: departmentId }, { $set: { deleteFlag: deleteFlag } }, { upsert: false });
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from admin service deletedepartment", error.message);
      throw new Error(error.message);
    }
  },

  async getDepartments(deleteFlag) {
    try {
      const departments = await Department.aggregate([
        {
          $match: {
            deleteFlag: deleteFlag,
          },
        },
        {
          $addFields: {
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
                timezone: TIME_ZONE || "Asia/Kolkata",
              },
            },
          },
        },
        { $sort: { createdAt: -1 } },
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
        return departments;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin service departments details", error.message);
      throw new Error(error.message);
    }
  },
  async getDepartmentOne(departmentId) {
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
                timezone: TIME_ZONE || "Asia/Kolkata",
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
      console.log("database error from admin service department details", error.message);
      throw new Error(error.message);
    }
  },

  //================================================Team============================================================

  async addTeam(teamName, unitId) {
    try {
      const addStatus = await Team.create({ teamName: teamName, unitId: unitId });
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin service addTeam", error.message);
      throw new Error(error.message);
    }
  },
  async checkTeam(teamId) {
    try {
      const teamStatus = await Team.findOne({ _id: teamId, deleteFlag: 0 }); // 20 seconds timeout

      if (teamStatus) {
        return teamStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("Team find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkTeamView(teamId) {
    try {
      const teamStatus = await Team.findOne({ _id: teamId }); // 20 seconds timeout

      if (teamStatus) {
        return teamStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("Team find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkTeamWithName(teamId, teamName, unitId) {
    try {
      const teamStatus = await Team.findOne({ _id: { $ne: teamId }, teamName: teamName, unitId: unitId, deleteFlag: 0 }); // 20 seconds timeout
      if (teamStatus) {
        return teamStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("team find db error", error.message);
      throw new Error(error.message);
    }
  },
  async checkTeamName(teamName, unitId) {
    try {
      const teamStatus = await Team.findOne({ unitId: unitId, teamName: teamName, deleteFlag: 0 }); // 20 seconds timeout

      if (teamStatus) {
        return teamStatus._id;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("team find db error", error.message);
      throw new Error(error.message);
    }
  },
  async editTeam(teamId, teamName, unitId) {
    try {
      const updateStatus = await Team.updateOne({ _id: teamId }, { $set: { teamName: teamName, unitId: unitId } }, { upsert: false });
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
  async activeDeactiveTeam(teamId, activeFlag) {
    try {
      const updateStatus = await Team.updateOne({ _id: teamId }, { $set: { activeFlag: activeFlag } }, { upsert: false });
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from admin service activeDeactiveteam", error.message);
      throw new Error(error.message);
    }
  },
  async deleteTeam(teamId, deleteFlag) {
    try {
      const updateStatus = await Team.updateOne({ _id: teamId }, { $set: { deleteFlag: deleteFlag } }, { upsert: false });
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from admin service deleteTeam", error.message);
      throw new Error(error.message);
    }
  },
  //================================================Holiday============================================================

  async addHoliday(holidayName, date, shiftId, image, compOff) {
    try {
      const addStatus = await Holiday.create({ holidayName: holidayName, date: date, shiftId: shiftId, image, compOff });
      if (addStatus) {
        return addStatus;
      } else {
        return "NA";
      }
    } catch (error) {
      console.log("database error from admin service addholiday", error.message);
      throw new Error(error.message);
    }
  },
  async checkHoliday(holidayId) {
    try {
      const holidayStatus = await Holiday.findOne({ _id: holidayId, deleteFlag: 0 }); // 20 seconds timeout

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
  async checkHolidayView(holidayId) {
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
  async checkHolidayWithName(holidayId, holidayName, date, shiftId) {
    try {
      const holidayStatus = await Holiday.findOne({ _id: { $ne: holidayId }, holidayName: holidayName, date: date, shiftId: shiftId, deleteFlag: 0 }); // 20 seconds timeout
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
  async checkHolidayName(holidayName, date, shiftId) {
    try {
      const holiday = await Holiday.findOne({ shiftId: shiftId, holidayName: holidayName, date: date, deleteFlag: 0 }); // 20 seconds timeout

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
  async editHoliday(holidayId, holidayName, date, shiftId, image, compOff) {
    try {
      const updateStatus = await Holiday.updateOne({ _id: holidayId }, { $set: { date: date, holidayName: holidayName, shiftId: shiftId, image, compOff } }, { upsert: false });
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from admin service editHoliday", error.message);
      throw new Error(error.message);
    }
  },
  async activeDeactiveHoliday(holidayId, activeFlag) {
    try {
      const updateStatus = await Holiday.updateOne({ _id: holidayId }, { $set: { activeFlag: activeFlag } }, { upsert: false });
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from admin service activeDeactiveholiday", error.message);
      throw new Error(error.message);
    }
  },
  async deleteHoliday(holidayId, deleteFlag) {
    try {
      const updateStatus = await Holiday.updateOne({ _id: holidayId }, { $set: { deleteFlag: deleteFlag } }, { upsert: false });
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from admin service deleteHoliday", error.message);
      throw new Error(error.message);
    }
  },
  
  async getHolidays(shiftIds, deleteFlag) {
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
                timezone: TIME_ZONE || "Asia/Kolkata",
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
      console.log("database error from admin service holidays details", error.message);
      throw new Error(error.message);
    }
  },

  async getPermissions(deleteFlag) {
    try {
      const Permissions = await Permission.aggregate([
        {
          $match: {
            deleteFlag: deleteFlag,
            roleName: { $ne: "Super-Admin" },
          },
        },
        {
          $addFields: {
            formattedCreatedAt: {
              $dateToString: {
                format: "%d-%m-%Y %H:%M",
                date: "$createdAt",
                timezone: TIME_ZONE || "Asia/Kolkata",
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
      console.log("database error from admin service Permissions details", error.message);
      throw new Error(error.message);
    }
  },
  async getPermissionOne(permissionId) {
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
                timezone: TIME_ZONE || "Asia/Kolkata",
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
      console.log("database error from admin service Permissions details", error.message);
      throw new Error(error.message);
    }
  },
  async editPermission(permissionId, accessLevel) {
    try {
      const updateStatus = await Permission.updateOne({ _id: permissionId }, { $set: { accessLevel: accessLevel } });
      if (updateStatus) {
        return updateStatus.modifiedCount;
      } else {
        return 0;
      }
    } catch (error) {
      console.log("database error from admin service editPermission", error.message);
      throw new Error(error.message);
    }
  },
  async checkPermission(permissionId) {
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

  async getShiftIdsByUnitIds(unitIds) {
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
      console.log("database error from admin service getShiftIdsByUnitIds details", error.message);
      throw new Error(error.message);
    }
  },
  async getRoleByRoleName(roleName) {
    try {
      const getRoles = await Permission.findOne({ deleteFlag: 0, roleName: roleName });
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
  async getUnitByUnitName(unitName) {
    try {
      const getUnits = await Unit.findOne({ deleteFlag: 0, unitName: unitName });
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
  async getShiftByShiftName(shiftName) {
    try {
      const getShifts = await Shift.findOne({ deleteFlag: 0, shiftName: shiftName });
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
  async getTeamByTeamName(teamName) {
    try {
      const getTeams = await Team.findOne({ deleteFlag: 0, teamName: teamName });
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
  async getDepartmentByDepartmentName(departmentName) {
    try {
      const getDepartments = await Department.findOne({ deleteFlag: 0, departmentName: departmentName });

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
  async getReportingManagerByReportingManagerName(reportingManagerName) {
    try {
      const getReportingManagers = await User.findOne({ deleteFlag: 0, name: reportingManagerName });
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
};
