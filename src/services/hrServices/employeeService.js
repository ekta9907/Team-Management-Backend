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
        { $sort: { createdAt: -1 } },
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
};
