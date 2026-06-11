require("dotenv").config();
const { body, query, validationResult } = require("express-validator");

const msg = require("../../helpers/hrLanguageMessageHelper");
const CommenFunction = require("../../helpers/commenHelper");
const MailFunctions = require("../../helpers/mailSendHelper");

const AdminService = require("../../services/hrServices/adminService");
const CommenService = require("../../services/hrServices/commenService");

//====================================== dashboard===========================

const dashboard = async (req, res) => {
  if (!req.currentUserId) {
    return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
  }
  if (!req.currentUser) {
    return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
  } else {
    try {
      const unitIds = req?.currentUser?.unitId;
      if (!unitIds || unitIds?.length === 0) {
        return res.status(200).json({ success: false, msg: msg.msgUnitNotExist });
      }
      const deleteFlag = 0;
      const unitCount = await AdminService.getUnitsCount(unitIds, deleteFlag);
      const shiftCount = await AdminService.getShiftsCount(unitIds, deleteFlag);
      const userCount = await AdminService.getUserCount(unitIds, deleteFlag);
      const employeeCount = await AdminService.getEmployeeCounts(unitIds, deleteFlag);
      const activeEmployeeCount = await AdminService.getEmployeeCount(unitIds, 0, deleteFlag);
      const offBoradingEmployeeCount = await AdminService.getEmployeeCount(unitIds, 1, deleteFlag);
      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { unitCount, shiftCount, employeeCount, activeEmployeeCount, offBoradingEmployeeCount, userCount },
      };
      return res.status(200).json(record);
    } catch (error) {
      console.log("database error key 2", error);
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  }
};
//====================================== companies===========================
const companies = async (req, res) => {
  try {
    const companies = await AdminService.getCompanies();

    if (companies === "NA") {
      const record = {
        success: true,
        msg: msg.msgDataNotFound,
        data: { companies: [] },
      };
      return res.status(200).json(record);
    }
    const record = {
      success: true,
      msg: msg.msgDataFound,
      data: { companies: companies },
    };
    return res.status(200).json(record);
  } catch (error) {
    console.log("database error key 2", error);
    const record = {
      success: false,
      msg: msg.msgServerError,
      key: error,
    };
    return res.status(500).json(record);
  }
};

const roles = async (req, res) => {
  try {
    const roles = await AdminService.getRoles();

    if (roles === "NA") {
      const record = {
        success: true,
        msg: msg.msgDataNotFound,
        data: { roles: [] },
      };
      return res.status(200).json(record);
    }
    const record = {
      success: true,
      msg: msg.msgDataFound,
      data: { roles: roles },
    };
    return res.status(200).json(record);
  } catch (error) {
    console.log("database error key 2", error);
    const record = {
      success: false,
      msg: msg.msgServerError,
      key: error,
    };
    return res.status(500).json(record);
  }
};

const weekDays = async (req, res) => {
  try {
    const weekDays = await AdminService.getWeekDays();

    if (weekDays === "NA") {
      const record = {
        success: true,
        msg: msg.msgDataNotFound,
        data: { weekDays: [] },
      };
      return res.status(200).json(record);
    }
    const record = {
      success: true,
      msg: msg.msgDataFound,
      data: { weekDays: weekDays },
    };
    return res.status(200).json(record);
  } catch (error) {
    console.log("database error key 2", error);
    const record = {
      success: false,
      msg: msg.msgServerError,
      key: error,
    };
    return res.status(500).json(record);
  }
};

//====================================== unit===========================
const units = [
  query("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else if (!req.currentUserId) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    } else if (!req.currentUser) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    } else {
      const { deleteFlag } = req.query;
      try {
        const unitIds = req?.currentUser?.unitId;
        if (!unitIds || unitIds?.length === 0) {
          return res.status(200).json({ success: false, msg: msg.msgUnitNotExist });
        }
        const units = await AdminService.getUnits(unitIds, Number(deleteFlag));

        if (units === "NA") {
          const record = {
            success: true,
            msg: msg.msgDataNotFound,
            data: { units: [] },
          };
          return res.status(200).json(record);
        }
        const record = {
          success: true,
          msg: msg.msgDataFound,
          data: { units: units },
        };
        return res.status(200).json(record);
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];
const addUnit = [
  //  validation
  body("companyId").trim().exists().withMessage(msg.msgCompanyIdReqired).notEmpty().withMessage(msg.msgCompanyIdReqired),
  body("unitName").trim().exists().withMessage(msg.msgUnitNameReqired).notEmpty().withMessage(msg.msgUnitNameReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { unitName, companyId } = req.body;
        const checkUnitName = await AdminService.checkUnitName(unitName);
        if (checkUnitName !== 0) {
          const record = {
            success: false,
            msg: msg.msgUnitExist,
          };
          return res.status(200).json(record);
        }

        try {
          const unit = await AdminService.addUnit(unitName, companyId);
          if (unit === "NA") {
            const record = {
              success: false,
              msg: msg.msgUnitAddError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgUnitAddSuccess,
              data: { unit: unit },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const editUnit = [
  //  validation
  body("unitId").trim().exists().withMessage(msg.msgUnitIdReqired).notEmpty().withMessage(msg.msgUnitIdReqired),
  body("companyId").trim().exists().withMessage(msg.msgCompanyIdReqired).notEmpty().withMessage(msg.msgCompanyIdReqired),
  body("unitName").trim().exists().withMessage(msg.msgUnitNameReqired).notEmpty().withMessage(msg.msgUnitNameReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { unitId, unitName, companyId } = req.body;

        const checkUnit = await AdminService.checkUnit(unitId);
        if (checkUnit === 0) {
          const record = {
            success: false,
            msg: msg.msgUnitNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const checkUnitWithName = await AdminService.checkUnitWithName(unitId, unitName);
          if (checkUnitWithName !== 0) {
            const record = {
              success: false,
              msg: msg.msgUnitExist,
            };
            return res.status(200).json(record);
          }

          try {
            const unitStatus = await AdminService.editUnit(unitId, unitName, companyId);
            if (unitStatus === 0) {
              const record = {
                success: false,
                msg: msg.msgUnitUpdateError,
              };
              return res.status(200).json(record);
            } else {
              const record = {
                success: true,
                msg: msg.msgUnitUpdateSuccess,
                data: { unit: unitStatus },
              };
              return res.status(200).json(record);
            }
          } catch (error) {
            console.log("database error key 3", error);
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: error,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const activeDeactiveUnit = [
  //  validation
  body("unitId").trim().exists().withMessage(msg.msgUnitIdReqired).notEmpty().withMessage(msg.msgUnitIdReqired),
  body("activeFlag").trim().exists().withMessage(msg.msgActiveFlagReqired).notEmpty().withMessage(msg.msgActiveFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { unitId, activeFlag } = req.body;
        const checkUnit = await AdminService.checkUnit(unitId);
        if (checkUnit === 0) {
          const record = {
            success: false,
            msg: msg.msgUnitNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          let activeDeactiveFlag = 0;
          if (activeFlag === "0") {
            activeDeactiveFlag = 1;
          } else {
            activeDeactiveFlag = 0;
          }
          const unitStatus = await AdminService.activeDeactiveUnit(unitId, activeDeactiveFlag);
          if (unitStatus === 0) {
            const record = {
              success: false,
              msg: msg.msgUnitUpdateError,
            };
            return res.status(200).json(record);
          } else {
            if (activeFlag === "0") {
              const record = {
                success: true,
                msg: msg.msgUnitActiveSuccess,
                data: { unit: unitStatus },
              };
              return res.status(200).json(record);
            } else {
              const record = {
                success: true,
                msg: msg.msgUnitDeactiveSuccess,
                data: { unit: unitStatus },
              };
              return res.status(200).json(record);
            }
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const deleteUnit = [
  //  validation
  body("unitId").trim().exists().withMessage(msg.msgUnitIdReqired).notEmpty().withMessage(msg.msgUnitIdReqired),
  body("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { unitId, deleteFlag } = req.body;

        const checkUnit = await AdminService.checkUnit(unitId);
        if (checkUnit === 0) {
          const record = {
            success: false,
            msg: msg.msgUnitNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const unitStatus = await AdminService.deleteUnit(unitId, deleteFlag);
          if (unitStatus === 0) {
            const record = {
              success: false,
              msg: msg.msgUnitDeleteError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgUnitDeleteSuccess,
              data: { unit: unitStatus },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

//======================================   shift===========================
const shifts = [
  query("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else if (!req.currentUserId) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    } else if (!req.currentUser) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    } else {
      const { deleteFlag } = req.query;

      try {
        const unitIds = req?.currentUser?.unitId;
        if (!unitIds || unitIds?.length === 0) {
          return res.status(200).json({ success: false, msg: msg.msgUnitNotExist });
        }
        const shifts = await AdminService.getShifts(unitIds, Number(deleteFlag));
        if (shifts === "NA") {
          const record = {
            success: true,
            msg: msg.msgDataNotFound,
            data: { shifts: [] },
          };
          return res.status(200).json(record);
        }
        const record = {
          success: true,
          msg: msg.msgDataFound,
          data: { shifts: shifts },
        };
        return res.status(200).json(record);
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];
const getOneShift = [
  //  validation
  query("shiftId").trim().exists().withMessage(msg.msgShiftIdReqired).notEmpty().withMessage(msg.msgShiftIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { shiftId } = req.query;
        const checkShift = await AdminService.checkShiftOne(shiftId);
        if (checkShift === 0) {
          const record = {
            success: false,
            msg: msg.msgShiftNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const shift = await AdminService.getOneShift(checkShift);
          if (shift === "NA") {
            const record = {
              success: true,
              msg: msg.msgDataNotFound,
              data: { shift: "NA" },
            };
            return res.status(200).json(record);
          }
          const record = {
            success: true,
            msg: msg.msgDataFound,
            data: { shift: shift },
          };
          return res.status(200).json(record);
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];
const unitShifts = [
  query("unitId").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  query("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    }

    const { unitId, deleteFlag } = req.query;

    try {
      const shifts = await AdminService.getUnitShifts(unitId, Number(deleteFlag));
      if (shifts === "NA") {
        const record = {
          success: true,
          msg: msg.msgDataNotFound,
          data: { shifts: [] },
        };
        return res.status(200).json(record);
      }
      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { shifts: shifts },
      };
      return res.status(200).json(record);
    } catch (error) {
      console.log("database error key 2", error);
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];

const addShift = [
  //  validation
  body("unitId").trim().exists().withMessage(msg.msgUnitIdReqired).notEmpty().withMessage(msg.msgUnitIdReqired),
  body("shiftName").trim().exists().withMessage(msg.msgShiftNameReqired).notEmpty().withMessage(msg.msgShiftNameReqired),
  body("startTime").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("endTime").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("totalWorkingDurationInDay").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("firstHalfDayStartTime").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("firstHalfDayEndTime").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("firstHalfDuration").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("secHalfDayStartTime").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("secHalfDayEndTime").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("secHalfDuration").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("weekWorkingDays").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("ptDeduction").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("otherAndTdsDeduction").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("otherAndTdsDeduction").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const {
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
        } = req.body;

        const checkShiftName = await AdminService.checkShiftName(shiftName);
        if (checkShiftName !== 0) {
          const record = {
            success: false,
            msg: msg.msgShiftExist,
          };
          return res.status(200).json(record);
        }

        try {
          const shift = await AdminService.addShift(
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
          );
          if (shift === "NA") {
            const record = {
              success: false,
              msg: msg.msgShiftAddError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgShiftAddSuccess,
              data: { shift: shift },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const editShift = [
  //  validation
  body("shiftId").trim().exists().withMessage(msg.msgShiftIdReqired).notEmpty().withMessage(msg.msgShiftIdReqired),
  body("unitId").trim().exists().withMessage(msg.msgUnitIdReqired).notEmpty().withMessage(msg.msgUnitIdReqired),
  body("shiftName").trim().exists().withMessage(msg.msgShiftNameReqired).notEmpty().withMessage(msg.msgShiftNameReqired),
  body("startTime").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("endTime").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("totalWorkingDurationInDay").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("firstHalfDayStartTime").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("firstHalfDayEndTime").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("firstHalfDuration").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("secHalfDayStartTime").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("secHalfDayEndTime").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("secHalfDuration").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("weekWorkingDays").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("ptDeduction").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("otherAndTdsDeduction").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("otherAndTdsDeduction").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const {
          unitId,
          shiftId,
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
        } = req.body;

        const checkShift = await AdminService.checkShift(shiftId);
        if (checkShift === 0) {
          const record = {
            success: false,
            msg: msg.msgShiftNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const checkShiftWithName = await AdminService.checkShiftWithName(shiftId, shiftName);
          if (checkShiftWithName !== 0) {
            const record = {
              success: false,
              msg: msg.msgShiftExist,
            };
            return res.status(200).json(record);
          }

          try {
            const shiftStatus = await AdminService.editShift(
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
            );
            if (shiftStatus === 0) {
              const record = {
                success: false,
                msg: msg.msgShiftUpdateError,
              };
              return res.status(200).json(record);
            } else {
              const record = {
                success: true,
                msg: msg.msgShiftUpdateSuccess,
                data: { shift: shiftStatus },
              };
              return res.status(200).json(record);
            }
          } catch (error) {
            console.log("database error key 3", error);
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: error,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const activeDeactiveShift = [
  //  validation
  body("shiftId").trim().exists().withMessage(msg.msgShiftIdReqired).notEmpty().withMessage(msg.msgShiftIdReqired),
  body("activeFlag").trim().exists().withMessage(msg.msgActiveFlagReqired).notEmpty().withMessage(msg.msgActiveFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { shiftId, activeFlag } = req.body;
        const checkShift = await AdminService.checkShift(shiftId);
        if (checkShift === 0) {
          const record = {
            success: false,
            msg: msg.msgShiftNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          let activeDeactiveFlag = 0;
          if (activeFlag === "0") {
            activeDeactiveFlag = 1;
          } else {
            activeDeactiveFlag = 0;
          }
          const shiftStatus = await AdminService.activeDeactiveShift(shiftId, activeDeactiveFlag);
          if (shiftStatus === 0) {
            const record = {
              success: false,
              msg: msg.msgShiftUpdateError,
            };
            return res.status(200).json(record);
          } else {
            if (activeFlag === "0") {
              const record = {
                success: true,
                msg: msg.msgShiftActiveSuccess,
                data: { shift: shiftStatus },
              };
              return res.status(200).json(record);
            } else {
              const record = {
                success: true,
                msg: msg.msgShiftDeactiveSuccess,
                data: { shift: shiftStatus },
              };
              return res.status(200).json(record);
            }
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const deleteShift = [
  //  validation
  body("shiftId").trim().exists().withMessage(msg.msgShiftIdReqired).notEmpty().withMessage(msg.msgShiftIdReqired),
  body("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { shiftId, deleteFlag } = req.body;

        const checkShift = await AdminService.checkShift(shiftId);
        if (checkShift === 0) {
          const record = {
            success: false,
            msg: msg.msgShiftNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const shiftStatus = await AdminService.deleteShift(shiftId, deleteFlag);
          if (shiftStatus === 0) {
            const record = {
              success: false,
              msg: msg.msgShiftDeleteError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgShiftDeleteSuccess,
              data: { shift: shiftStatus },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];
//====================================== Employee===========================
const addEmployeeByCSV = async (req, res) => {
  try {
    const {
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
      eSICNumber,
    } = req.body;
    const registeredById = req.currentUserId;
    const reportingManager = req.body.reportingManagerId;
    let reportingManagerId = null;
    if (reportingManager === "") {
      reportingManagerId = null;
    } else {
      reportingManagerId = reportingManager;
    }
    const approvedById = req.currentUserId;
    const checkUserEmail = await CommenService.checkUserEmail(email.toLowerCase());
    if (checkUserEmail !== 0) {
      const record = {
        success: false,
        msg: msg.msgEmailAlreadyExist,
      };
      return record;
    }
    const checkUserUniqueId = await CommenService.checkUserUniqueId(uniqueId);
    if (checkUserUniqueId !== 0) {
      const record = {
        success: false,
        msg: msg.msgUniqueIdAlreadyExist,
      };
      return record;
    }
    // const password = await CommenFunction.generateRandomPassword(10);
    const password = "123456";
    const showPassword = password;
    const hashPassword = await CommenFunction.hashPassword(password);
    const empId = firstName + uniqueId;
    const phoneCode = "+91";
    try {
      const employee = await AdminService.addEmployee(
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
        email.toLowerCase(),
        hashPassword,
        phoneCode,
        mobileNumber,
        personalEmail.toLowerCase(),
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
      );
      if (employee === "NA") {
        const record = {
          success: false,
          msg: msg.msgEmployeeAddError,
        };
        return record;
      } else {
        const userDetails = await CommenService.getUserDetails(employee._id);
        let languageId = "0";
        if (userDetails !== "NA") {
          languageId = userDetails.languageId;
        }

        const siteURL = process.env.SITE_URL;
        const mailEmail = email;
        const mailName = name;

        const mailSubject = msg.mailSubjectAddEmployee[languageId];
        const mailHeading = msg.mailHeadingAddEmployee[languageId];
        const headerGreeting = msg.mailHeaderGreetingAddEmployee[languageId];
        const mailContents = msg.mailContentAddEmployee(siteURL, process.env.FOOTERBACKGROUND, email, password);
        const mailContent = mailContents[languageId];

        try {
          const mailFromName = process.env.MAIL_FROM_NAME;
          const appName = process.env.APP_NAME;
          const appLogo = process.env.APP_LOGO;
          const borderBackground = process.env.BORDERBACKGROUND;
          const footerGreeting = msg.mailFooterGreeting[languageId];
          const footerDescription = msg.mailFooterDescription[languageId];
          const footerBackground = process.env.FOOTERBACKGROUND;

          const mailBody = await MailFunctions.mailBodyData({
            appName: appName,
            appLogo: appLogo,
            borderBackground: borderBackground,
            mailHeading: mailHeading,
            headerGreeting: headerGreeting,
            name: mailName,
            mailContent: mailContent,
            footerGreeting: footerGreeting,
            footerBackground: footerBackground,
            footerDescription: footerDescription,
          });

          try {
            const responce = await MailFunctions.mailSend(mailEmail, mailFromName, mailSubject, mailBody);
            if (!responce) {
              const record = {
                success: false,
                msg: msg.msgPasswordResetLinkSendError,
              };
              return record;
            }
            const record = {
              success: true,
              msg: msg.msgEmployeeAddSuccess,
              data: { userDetails: userDetails, responce: responce },
            };
            return record;
          } catch (error) {
            console.log("mail error key 2");
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: error,
            };
            return record;
          }
        } catch (error) {
          console.log("mail error key 1");
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return record;
        }
      }
    } catch (error) {
      console.log("database error key 2", error);
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return record;
    }
  } catch (error) {
    console.log("database error key 2", error);
    const record = {
      success: false,
      msg: msg.msgServerError,
      key: error,
    };
    return record;
  }
};
const addEmployee = [
  //  validation
  body("unitId").trim().exists().withMessage(msg.msgUnitIdReqired).notEmpty().withMessage(msg.msgUnitIdReqired),
  body("companyId").trim().exists().withMessage(msg.msgCompanyIdReqired).notEmpty().withMessage(msg.msgCompanyIdReqired),
  body("shiftId").trim().exists().withMessage(msg.msgShiftIdReqired).notEmpty().withMessage(msg.msgShiftIdReqired),
  body("roleId").trim().exists().withMessage(msg.msgRoleIdReqired).notEmpty().withMessage(msg.msgRoleIdReqired),
  body("roleName").trim().exists().withMessage(msg.msgRoleNameReqired).notEmpty().withMessage(msg.msgRoleNameReqired),
  body("departmentId").trim().exists().withMessage(msg.msgDesignationIdReqired).notEmpty().withMessage(msg.msgDesignationIdReqired),

  body("uniqueId").trim().exists().withMessage(msg.msgUniqueIdReqired).notEmpty().withMessage(msg.msgUniqueIdReqired),
  body("designationName").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("firstName").trim().exists().withMessage(msg.msgFirstNameReqired).notEmpty().withMessage(msg.msgFirstNameReqired),
  body("lastName").trim().exists().withMessage(msg.msgLastNameReqired).notEmpty().withMessage(msg.msgLastNameReqired),
  body("name").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("email").trim().exists().withMessage(msg.msgEmailReqired).notEmpty().withMessage(msg.msgEmailReqired),
  body("personalEmail").trim().exists().withMessage(msg.msgEmailReqired).notEmpty().withMessage(msg.msgEmailReqired),
  body("mobileNumber").trim().exists().withMessage(msg.msgMobileNumberReqired).notEmpty().withMessage(msg.msgMobileNumberReqired),
  body("dob").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("originalDob").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("joiningDate").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("PANNumber").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("aadharNumber").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("fatherName").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("address").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("gender").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("maritalStatus").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("city").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("state").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("pincode").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg, errors });
    } else {
      try {
        const {
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
          eSICNumber,
        } = req.body;
        const registeredById = req.currentUserId;
        const reportingManager = req.body.reportingManagerId;
        let reportingManagerId = null;
        if (reportingManager === "") {
          reportingManagerId = null;
        } else {
          reportingManagerId = reportingManager;
        }
        const approvedById = req.currentUserId;
        const checkUserEmail = await CommenService.checkUserEmail(email.toLowerCase());
        if (checkUserEmail !== 0) {
          const record = {
            success: false,
            msg: msg.msgEmailAlreadyExist,
          };
          return res.status(200).json(record);
        }
        const checkUserUniqueId = await CommenService.checkUserUniqueId(uniqueId);
        if (checkUserUniqueId !== 0) {
          const record = {
            success: false,
            msg: msg.msgUniqueIdAlreadyExist,
          };
          return res.status(200).json(record);
        }
        const password = await CommenFunction.generateRandomPassword(10);
        const showPassword = password;
        const hashPassword = await CommenFunction.hashPassword(password);
        const empId = firstName + uniqueId;
        const phoneCode = "+91";
        try {
          const employee = await AdminService.addEmployee(
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
            email.toLowerCase(),
            hashPassword,
            phoneCode,
            mobileNumber,
            personalEmail.toLowerCase(),
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
          );
          if (employee === "NA") {
            const record = {
              success: false,
              msg: msg.msgEmployeeAddError,
            };
            return res.status(200).json(record);
          } else {
            const userDetails = await CommenService.getUserDetails(employee._id);
            let languageId = "0";
            if (userDetails !== "NA") {
              languageId = userDetails.languageId;
            }

            const siteURL = process.env.SITE_URL;
            const mailEmail = email;
            const mailName = name;

            const mailSubject = msg.mailSubjectAddEmployee[languageId];
            const mailHeading = msg.mailHeadingAddEmployee[languageId];
            const headerGreeting = msg.mailHeaderGreetingAddEmployee[languageId];
            const mailContents = msg.mailContentAddEmployee(siteURL, process.env.FOOTERBACKGROUND, email, password);
            const mailContent = mailContents[languageId];

            try {
              const mailFromName = process.env.MAIL_FROM_NAME;
              const appName = process.env.APP_NAME;
              const appLogo = process.env.APP_LOGO;
              const borderBackground = process.env.BORDERBACKGROUND;
              const footerGreeting = msg.mailFooterGreeting[languageId];
              const footerDescription = msg.mailFooterDescription[languageId];
              const footerBackground = process.env.FOOTERBACKGROUND;

              const mailBody = await MailFunctions.mailBodyData({
                appName: appName,
                appLogo: appLogo,
                borderBackground: borderBackground,
                mailHeading: mailHeading,
                headerGreeting: headerGreeting,
                name: mailName,
                mailContent: mailContent,
                footerGreeting: footerGreeting,
                footerBackground: footerBackground,
                footerDescription: footerDescription,
              });

              try {
                const responce = await MailFunctions.mailSend(mailEmail, mailFromName, mailSubject, mailBody);
                if (!responce) {
                  const record = {
                    success: false,
                    msg: msg.msgPasswordResetLinkSendError,
                  };
                  return res.status(200).json(record);
                }
                const record = {
                  success: true,
                  msg: msg.msgEmployeeAddSuccess,
                  data: { userDetails: userDetails, responce: responce },
                };
                return res.status(200).json(record);
              } catch (error) {
                console.log("mail error key 2");
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: error,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              console.log("mail error key 1");
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: error,
              };
              return res.status(500).json(record);
            }
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];
const editEmployee = [
  //  validation
  body("employeeId").trim().exists().withMessage(msg.msgEmployeeIdReqired).notEmpty().withMessage(msg.msgEmployeeIdReqired),
  body("unitId").trim().exists().withMessage(msg.msgUnitIdReqired).notEmpty().withMessage(msg.msgUnitIdReqired),
  body("companyId").trim().exists().withMessage(msg.msgCompanyIdReqired).notEmpty().withMessage(msg.msgCompanyIdReqired),
  body("shiftId").trim().exists().withMessage(msg.msgShiftIdReqired).notEmpty().withMessage(msg.msgShiftIdReqired),
  body("roleId").trim().exists().withMessage(msg.msgRoleIdReqired).notEmpty().withMessage(msg.msgRoleIdReqired),
  body("roleName").trim().exists().withMessage(msg.msgRoleNameReqired).notEmpty().withMessage(msg.msgRoleNameReqired),
  body("departmentId").trim().exists().withMessage(msg.msgDesignationIdReqired).notEmpty().withMessage(msg.msgDesignationIdReqired),

  body("uniqueId").trim().exists().withMessage(msg.msgUniqueIdReqired).notEmpty().withMessage(msg.msgUniqueIdReqired),
  body("designationName").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("firstName").trim().exists().withMessage(msg.msgFirstNameReqired).notEmpty().withMessage(msg.msgFirstNameReqired),
  body("lastName").trim().exists().withMessage(msg.msgLastNameReqired).notEmpty().withMessage(msg.msgLastNameReqired),
  body("name").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("email").trim().exists().withMessage(msg.msgEmailReqired).notEmpty().withMessage(msg.msgEmailReqired),
  body("personalEmail").trim().exists().withMessage(msg.msgEmailReqired).notEmpty().withMessage(msg.msgEmailReqired),
  body("mobileNumber").trim().exists().withMessage(msg.msgMobileNumberReqired).notEmpty().withMessage(msg.msgMobileNumberReqired),
  body("dob").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("originalDob").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("joiningDate").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("PANNumber").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("aadharNumber").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("fatherName").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("address").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("gender").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("maritalStatus").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("city").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("state").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  body("pincode").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg, errors });
    } else {
      try {
        const {
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
          eSICNumber,
        } = req.body;
        const reportingManager = req.body.reportingManagerId;
        let reportingManagerId = null;
        if (reportingManager === "") {
          reportingManagerId = null;
        } else {
          reportingManagerId = reportingManager;
        }

        const checkUserEmail = await CommenService.checkUserEmailWithId(employeeId, email.toLowerCase());
        if (checkUserEmail !== 0) {
          const record = {
            success: false,
            msg: msg.msgEmailAlreadyExist,
          };
          return res.status(200).json(record);
        }
        const checkUserUniqueId = await CommenService.checkUserUniqueIdWithId(employeeId, uniqueId);
        if (checkUserUniqueId !== 0) {
          const record = {
            success: false,
            msg: msg.msgUniqueIdAlreadyExist,
          };
          return res.status(200).json(record);
        }
        // const password = await CommenFunction.generateRandomPassword(10);
        // const showPassword = password;
        // const hashPassword = await CommenFunction.hashPassword(password);

        const phoneCode = "+91";
        try {
          const employee = await AdminService.editEmployee(
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
            email.toLowerCase(),
            phoneCode,
            mobileNumber,
            personalEmail.toLowerCase(),
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
          );
          if (employee === "NA") {
            const record = {
              success: false,
              msg: msg.msgEmployeeUpdateError,
            };
            return res.status(200).json(record);
          } else {
            const userDetails = await CommenService.getUserDetails(employee._id);
            let languageId = "0";
            if (userDetails !== "NA") {
              languageId = userDetails.languageId;
            }

            const siteURL = process.env.SITE_URL;
            const mailEmail = email;
            const mailName = name;

            const mailSubject = msg.mailSubjectUpdateEmployee[languageId];
            const mailHeading = msg.mailHeadingUpdateEmployee[languageId];
            const headerGreeting = msg.mailHeaderGreetingUpdateEmployee[languageId];
            const mailContents = msg.mailContentUpdateEmployee(siteURL, process.env.FOOTERBACKGROUND);
            const mailContent = mailContents[languageId];

            try {
              const mailFromName = process.env.MAIL_FROM_NAME;
              const appName = process.env.APP_NAME;
              const appLogo = process.env.APP_LOGO;
              const borderBackground = process.env.BORDERBACKGROUND;
              const footerGreeting = msg.mailFooterGreeting[languageId];
              const footerDescription = msg.mailFooterDescription[languageId];
              const footerBackground = process.env.FOOTERBACKGROUND;

              const mailBody = await MailFunctions.mailBodyData({
                appName: appName,
                appLogo: appLogo,
                borderBackground: borderBackground,
                mailHeading: mailHeading,
                headerGreeting: headerGreeting,
                name: mailName,
                mailContent: mailContent,
                footerGreeting: footerGreeting,
                footerBackground: footerBackground,
                footerDescription: footerDescription,
              });

              try {
                const responce = await MailFunctions.mailSend(mailEmail, mailFromName, mailSubject, mailBody);
                if (!responce) {
                  const record = {
                    success: false,
                    msg: msg.msgPasswordResetLinkSendError,
                  };
                  return res.status(200).json(record);
                }
                const record = {
                  success: true,
                  msg: msg.msgEmployeeUpdateSuccess,
                  data: { userDetails: userDetails, responce: responce },
                };
                return res.status(200).json(record);
              } catch (error) {
                console.log("mail error key 2");
                const record = {
                  success: false,
                  msg: msg.msgServerError,
                  key: error,
                };
                return res.status(500).json(record);
              }
            } catch (error) {
              console.log("mail error key 1");
              const record = {
                success: false,
                msg: msg.msgServerError,
                key: error,
              };
              return res.status(500).json(record);
            }
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const activeDeactiveEmployee = [
  //  validation
  body("employeeId").trim().exists().withMessage(msg.msgEmployeeIdReqired).notEmpty().withMessage(msg.msgEmployeeIdReqired),
  body("activeFlag").trim().exists().withMessage(msg.msgActiveFlagReqired).notEmpty().withMessage(msg.msgActiveFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { employeeId, activeFlag } = req.body;
        const checkEmployee = await AdminService.checkEmployee(employeeId);
        if (checkEmployee === 0) {
          const record = {
            success: false,
            msg: msg.msgEmployeeNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          let activeDeactiveFlag = 0;
          if (activeFlag === "0") {
            activeDeactiveFlag = 1;
          } else {
            activeDeactiveFlag = 0;
          }
          const employeeStatus = await AdminService.activeDeactiveEmployee(employeeId, activeDeactiveFlag);
          if (employeeStatus === 0) {
            const record = {
              success: false,
              msg: msg.msgEmployeeUpdateError,
            };
            return res.status(200).json(record);
          } else {
            if (activeFlag === "0") {
              const record = {
                success: true,
                msg: msg.msgEmployeeActiveSuccess,
                data: { employee: employeeStatus },
              };
              return res.status(200).json(record);
            } else {
              const record = {
                success: true,
                msg: msg.msgEmployeeDeactiveSuccess,
                data: { employee: employeeStatus },
              };
              return res.status(200).json(record);
            }
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];
const manualPunchStatusEmployee = [
  //  validation
  body("employeeId").trim().exists().withMessage(msg.msgEmployeeIdReqired).notEmpty().withMessage(msg.msgEmployeeIdReqired),
  body("manualPunch").trim().exists().withMessage(msg.msgActiveFlagReqired).notEmpty().withMessage(msg.msgActiveFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { employeeId, manualPunch } = req.body;
        const checkEmployee = await AdminService.checkEmployee(employeeId);
        if (checkEmployee === 0) {
          const record = {
            success: false,
            msg: msg.msgEmployeeNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          let manualPunchFlag = 0;
          if (manualPunch === "0") {
            manualPunchFlag = 1;
          } else {
            manualPunchFlag = 0;
          }
          const employeeStatus = await AdminService.manualPunchEmployee(employeeId, manualPunchFlag);
          if (employeeStatus === 0) {
            const record = {
              success: false,
              msg: msg.msgEmployeeUpdateError,
            };
            return res.status(200).json(record);
          } else {
            if (manualPunch === "0") {
              const record = {
                success: true,
                msg: msg.msgEmployeeManualPunchOnSuccess,
                data: { employee: employeeStatus },
              };
              return res.status(200).json(record);
            } else {
              const record = {
                success: true,
                msg: msg.msgEmployeeManualPunchOffSuccess,
                data: { employee: employeeStatus },
              };
              return res.status(200).json(record);
            }
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const deleteEmployee = [
  //  validation
  body("employeeId").trim().exists().withMessage(msg.msgEmployeeIdReqired).notEmpty().withMessage(msg.msgEmployeeIdReqired),
  body("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { employeeId, deleteFlag } = req.body;

        const checkEmployee = await AdminService.checkEmployee(employeeId);
        if (checkEmployee === 0) {
          const record = {
            success: false,
            msg: msg.msgEmployeeNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const employeeStatus = await AdminService.deleteEmployee(employeeId, deleteFlag);
          if (employeeStatus === 0) {
            const record = {
              success: false,
              msg: msg.msgEmployeeDeleteError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgEmployeeDeleteSuccess,
              data: { employee: employeeStatus },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];
const approveEmployee = [
  //  validation
  body("employeeId").trim().exists().withMessage(msg.msgEmployeeIdReqired).notEmpty().withMessage(msg.msgEmployeeIdReqired),
  body("approveFlag").trim().exists().withMessage(msg.msgApproveFlagReqired).notEmpty().withMessage(msg.msgApproveFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { employeeId, approveFlag } = req.body;

        const checkEmployee = await AdminService.checkEmployee(employeeId);
        if (checkEmployee === 0) {
          const record = {
            success: false,
            msg: msg.msgEmployeeNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const employeeStatus = await AdminService.approveEmployee(employeeId, approveFlag);
          if (employeeStatus === 0) {
            const record = {
              success: false,
              msg: msg.msgEmployeeApproveError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgEmployeeApproveSuccess,
              data: { employee: employeeStatus },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const viewEmployee = [
  //  validation
  query("employeeId").trim().exists().withMessage(msg.msgEmployeeIdReqired).notEmpty().withMessage(msg.msgEmployeeIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { employeeId } = req.query;
        const checkEmployee = await AdminService.checkEmployeeOne(employeeId);
        if (checkEmployee === 0) {
          const record = {
            success: false,
            msg: msg.msgEmployeeNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const employee = await AdminService.viewEmployee(checkEmployee);
          if (employee === "NA") {
            const record = {
              success: true,
              msg: msg.msgDataNotFound,
              data: { employee: "NA" },
            };
            return res.status(200).json(record);
          }
          const record = {
            success: true,
            msg: msg.msgDataFound,
            data: { employee: employee },
          };
          return res.status(200).json(record);
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];
const employees = [
  query("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else if (!req.currentUserId) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    } else if (!req.currentUser) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    } else {
      const { deleteFlag } = req.query;

      try {
        const unitIds = req?.currentUser?.unitId;
        if (!unitIds || unitIds?.length === 0) {
          return res.status(200).json({ success: false, msg: msg.msgUnitNotExist });
        }
        const employees = await AdminService.getEmployees(unitIds, Number(deleteFlag));
        if (employees === "NA") {
          const record = {
            success: true,
            msg: msg.msgDataNotFound,
            data: { employees: [] },
          };
          return res.status(200).json(record);
        }
        const record = {
          success: true,
          msg: msg.msgDataFound,
          data: { employees: employees },
        };
        return res.status(200).json(record);
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];
const unitEmployees = [
  query("unitId").trim().exists().withMessage(msg.msgUnitIdReqired).notEmpty().withMessage(msg.msgUnitIdReqired),
  query("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    }

    const { unitId, deleteFlag } = req.query;
    const checkUnit = await AdminService.checkUnitView(unitId);
    if (checkUnit === 0) {
      const record = {
        success: false,
        msg: msg.msgUnitNotExist,
      };
      return res.status(200).json(record);
    }

    try {
      const unit = await AdminService.getUnitOne(checkUnit._id);
      if (unit === "NA") {
        const record = {
          success: true,
          msg: msg.msgDataNotFound,
          data: { unit: "NA" },
        };
        return res.status(200).json(record);
      }
      const employees = await AdminService.getUnitEmployees(checkUnit._id, Number(deleteFlag));
      if (employees === "NA") {
        const record = {
          success: true,
          msg: msg.msgDataNotFound,
          data: { employees: [], unit: unit },
        };
        return res.status(200).json(record);
      }

      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { employees: employees, unit: unit },
      };
      return res.status(200).json(record);
    } catch (error) {
      console.log("database error key 2", error);
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const getReportingManagerAll = [
  query("unitId").trim().exists().withMessage(msg.msgUnitIdReqired).notEmpty().withMessage(msg.msgUnitIdReqired),
  query("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    }

    const { unitId, deleteFlag } = req.query;
    // const checkUnit = await AdminService.checkUnitView(unitId);
    // if (checkUnit === 0) {
    //     const record = {
    //         success: false,
    //         msg: msg.msgUnitNotExist,
    //     };
    //     return res.status(200).json(record);
    // }

    try {
      const employees = await AdminService.getReportingManagerAll(unitId, Number(deleteFlag));
      if (employees === "NA") {
        const record = {
          success: true,
          msg: msg.msgDataNotFound,
          data: { employees: [] },
        };
        return res.status(200).json(record);
      }

      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { employees: employees },
      };
      return res.status(200).json(record);
    } catch (error) {
      console.log("database error key 2", error);
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];

//====================================== department===========================
const unitDepartments = [
  query("deleteFlag").trim().exists().withMessage(msg.msgUnitIdReqired).notEmpty().withMessage(msg.msgUnitIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    }

    const { deleteFlag } = req.query;
    try {
      const departments = await AdminService.getUnitDepartments(Number(deleteFlag));

      if (departments === "NA") {
        const record = {
          success: true,
          msg: msg.msgDataNotFound,
          data: { departments: [] },
        };
        return res.status(200).json(record);
      }
      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { departments: departments },
      };
      return res.status(200).json(record);
    } catch (error) {
      console.log("database error key 2", error);
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const departments = [
  query("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    }

    const { deleteFlag } = req.query;
    try {
      const departments = await AdminService.getDepartments(Number(deleteFlag));

      if (departments === "NA") {
        const record = {
          success: true,
          msg: msg.msgDataNotFound,
          data: { departments: [] },
        };
        return res.status(200).json(record);
      }
      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { departments: departments },
      };
      return res.status(200).json(record);
    } catch (error) {
      console.log("database error key 2", error);
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];

const addDepartment = [
  //  validation

  body("departmentName").trim().exists().withMessage(msg.msgDepartmentNameReqired).notEmpty().withMessage(msg.msgDepartmentNameReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { departmentName } = req.body;
        const checkDepartmentName = await AdminService.checkDepartmentName(departmentName);
        if (checkDepartmentName !== 0) {
          const record = {
            success: false,
            msg: msg.msgDepartmentExist,
          };
          return res.status(200).json(record);
        }

        try {
          const unit = await AdminService.addDepartment(departmentName);
          if (unit === "NA") {
            const record = {
              success: false,
              msg: msg.msgDepartmentAddError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgDepartmentAddSuccess,
              data: { unit: unit },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const editDepartment = [
  //  validation

  body("departmentId").trim().exists().withMessage(msg.msgDepartmentIdReqired).notEmpty().withMessage(msg.msgDepartmentIdReqired),
  body("departmentName").trim().exists().withMessage(msg.msgDepartmentNameReqired).notEmpty().withMessage(msg.msgDepartmentNameReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { departmentName, departmentId } = req.body;

        const checkDepartment = await AdminService.checkDepartment(departmentId);
        if (checkDepartment === 0) {
          const record = {
            success: false,
            msg: msg.msgDepartmentNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const checkDepartmentWithName = await AdminService.checkDepartmentWithName(departmentId, departmentName);
          if (checkDepartmentWithName !== 0) {
            const record = {
              success: false,
              msg: msg.msgDepartmentExist,
            };
            return res.status(200).json(record);
          }

          try {
            const departmentStatus = await AdminService.editDepartment(departmentId, departmentName);
            if (departmentStatus === 0) {
              const record = {
                success: false,
                msg: msg.msgDepartmentUpdateError,
              };
              return res.status(200).json(record);
            } else {
              const record = {
                success: true,
                msg: msg.msgDepartmentUpdateSuccess,
                data: { department: departmentStatus },
              };
              return res.status(200).json(record);
            }
          } catch (error) {
            console.log("database error key 3", error);
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: error,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const activeDeactiveDepartment = [
  //  validation
  body("departmentId").trim().exists().withMessage(msg.msgDepartmentIdReqired).notEmpty().withMessage(msg.msgDepartmentIdReqired),
  body("activeFlag").trim().exists().withMessage(msg.msgActiveFlagReqired).notEmpty().withMessage(msg.msgActiveFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { departmentId, activeFlag } = req.body;
        const checkDepartment = await AdminService.checkDepartment(departmentId);
        if (checkDepartment === 0) {
          const record = {
            success: false,
            msg: msg.msgDepartmentNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          let activeDeactiveFlag = 0;
          if (activeFlag === "0") {
            activeDeactiveFlag = 1;
          } else {
            activeDeactiveFlag = 0;
          }
          const departmentStatus = await AdminService.activeDeactiveDepartment(departmentId, activeDeactiveFlag);
          if (departmentStatus === 0) {
            const record = {
              success: false,
              msg: msg.msgDepartmentUpdateError,
            };
            return res.status(200).json(record);
          } else {
            if (activeFlag === "0") {
              const record = {
                success: true,
                msg: msg.msgDepartmentActiveSuccess,
                data: { department: departmentStatus },
              };
              return res.status(200).json(record);
            } else {
              const record = {
                success: true,
                msg: msg.msgDepartmentDeactiveSuccess,
                data: { department: departmentStatus },
              };
              return res.status(200).json(record);
            }
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const deleteDepartment = [
  //  validation
  body("departmentId").trim().exists().withMessage(msg.msgDepartmentIdReqired).notEmpty().withMessage(msg.msgDepartmentIdReqired),
  body("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { departmentId, deleteFlag } = req.body;

        const checkDepartment = await AdminService.checkDepartment(departmentId);
        if (checkDepartment === 0) {
          const record = {
            success: false,
            msg: msg.msgDepartmentNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const departmentStatus = await AdminService.deleteDepartment(departmentId, deleteFlag);
          if (departmentStatus === 0) {
            const record = {
              success: false,
              msg: msg.msgDepartmentDeleteError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgDepartmentDeleteSuccess,
              data: { department: departmentStatus },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];
//====================================== teams===========================
const teams = [
  query("deleteFlag").trim().exists().withMessage(msg.msgUnitIdReqired).notEmpty().withMessage(msg.msgUnitIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else if (!req.currentUserId) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    } else if (!req.currentUser) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    } else {
      const { deleteFlag } = req.query;
      try {
        const unitIds = req?.currentUser?.unitId;
        if (!unitIds || unitIds?.length === 0) {
          return res.status(200).json({ success: false, msg: msg.msgUnitNotExist });
        }

        const teams = await AdminService.getTeams(unitIds, Number(deleteFlag));

        if (teams === "NA") {
          const record = {
            success: true,
            msg: msg.msgDataNotFound,
            data: { teams: [] },
          };
          return res.status(200).json(record);
        }
        const record = {
          success: true,
          msg: msg.msgDataFound,
          data: { teams: teams },
        };
        return res.status(200).json(record);
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];
const unitTeams = [
  query("unitId").trim().exists().withMessage(msg.msgUnitIdReqired).notEmpty().withMessage(msg.msgUnitIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    }

    const { unitId } = req.query;
    try {
      const checkUnit = await AdminService.checkUnitView(unitId);
      if (checkUnit === 0) {
        const record = {
          success: false,
          msg: msg.msgUnitNotExist,
        };
        return res.status(200).json(record);
      }
      const teams = await AdminService.getUnitTeams(checkUnit._id);

      if (teams === "NA") {
        const record = {
          success: true,
          msg: msg.msgDataNotFound,
          data: { teams: [] },
        };
        return res.status(200).json(record);
      }
      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { teams: teams },
      };
      return res.status(200).json(record);
    } catch (error) {
      console.log("database error key 2", error);
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];

const addTeam = [
  //  validation
  body("unitId").trim().exists().withMessage(msg.msgUnitIdReqired).notEmpty().withMessage(msg.msgUnitIdReqired),
  body("teamName").trim().exists().withMessage(msg.msgTeamNameReqired).notEmpty().withMessage(msg.msgTeamNameReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { teamName, unitId } = req.body;
        const checkTeamName = await AdminService.checkTeamName(teamName, unitId);
        if (checkTeamName !== 0) {
          const record = {
            success: false,
            msg: msg.msgTeamExist,
          };
          return res.status(200).json(record);
        }

        try {
          const team = await AdminService.addTeam(teamName, unitId);
          if (team === "NA") {
            const record = {
              success: false,
              msg: msg.msgTeamAddError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgTeamAddSuccess,
              data: { team: team },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const editTeam = [
  //  validation

  body("unitId").trim().exists().withMessage(msg.msgUnitIdReqired).notEmpty().withMessage(msg.msgUnitIdReqired),
  body("teamId").trim().exists().withMessage(msg.msgTeamIdReqired).notEmpty().withMessage(msg.msgTeamIdReqired),
  body("teamName").trim().exists().withMessage(msg.msgTeamNameReqired).notEmpty().withMessage(msg.msgTeamNameReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { teamName, teamId, unitId } = req.body;

        const checkTeam = await AdminService.checkTeam(teamId);
        if (checkTeam === 0) {
          const record = {
            success: false,
            msg: msg.msgTeamNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const checkTeamWithName = await AdminService.checkTeamWithName(teamId, teamName, unitId);
          if (checkTeamWithName !== 0) {
            const record = {
              success: false,
              msg: msg.msgTeamExist,
            };
            return res.status(200).json(record);
          }

          try {
            const teamStatus = await AdminService.editTeam(teamId, teamName, unitId);
            if (teamStatus === 0) {
              const record = {
                success: false,
                msg: msg.msgTeamUpdateError,
              };
              return res.status(200).json(record);
            } else {
              const record = {
                success: true,
                msg: msg.msgTeamUpdateSuccess,
                data: { team: teamStatus },
              };
              return res.status(200).json(record);
            }
          } catch (error) {
            console.log("database error key 3", error);
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: error,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const activeDeactiveTeam = [
  //  validation
  body("teamId").trim().exists().withMessage(msg.msgTeamIdReqired).notEmpty().withMessage(msg.msgTeamIdReqired),
  body("activeFlag").trim().exists().withMessage(msg.msgActiveFlagReqired).notEmpty().withMessage(msg.msgActiveFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { teamId, activeFlag } = req.body;
        const checkTeam = await AdminService.checkTeam(teamId);
        if (checkTeam === 0) {
          const record = {
            success: false,
            msg: msg.msgTeamNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          let activeDeactiveFlag = 0;
          if (activeFlag === "0") {
            activeDeactiveFlag = 1;
          } else {
            activeDeactiveFlag = 0;
          }
          const teamStatus = await AdminService.activeDeactiveTeam(teamId, activeDeactiveFlag);
          if (teamStatus === 0) {
            const record = {
              success: false,
              msg: msg.msgTeamUpdateError,
            };
            return res.status(200).json(record);
          } else {
            if (activeFlag === "0") {
              const record = {
                success: true,
                msg: msg.msgTeamActiveSuccess,
                data: { team: teamStatus },
              };
              return res.status(200).json(record);
            } else {
              const record = {
                success: true,
                msg: msg.msgTeamDeactiveSuccess,
                data: { Team: teamStatus },
              };
              return res.status(200).json(record);
            }
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const deleteTeam = [
  //  validation
  body("teamId").trim().exists().withMessage(msg.msgTeamIdReqired).notEmpty().withMessage(msg.msgTeamIdReqired),
  body("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { teamId, deleteFlag } = req.body;

        const checkTeam = await AdminService.checkTeam(teamId);
        if (checkTeam === 0) {
          const record = {
            success: false,
            msg: msg.msgTeamNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const teamStatus = await AdminService.deleteTeam(teamId, deleteFlag);
          if (teamStatus === 0) {
            const record = {
              success: false,
              msg: msg.msgTeamDeleteError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgTeamDeleteSuccess,
              data: { team: teamStatus },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];
//====================================== Holiday===========================
const addHoliday = [
  //  validation
  body("shiftId").trim().exists().withMessage(msg.msgShiftIdReqired).notEmpty().withMessage(msg.msgShiftIdReqired),
  body("date").trim().exists().withMessage(msg.msgDateReqired).notEmpty().withMessage(msg.msgDateReqired),
  body("holidayName").trim().exists().withMessage(msg.msgHolidayNameReqired).notEmpty().withMessage(msg.msgHolidayNameReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { holidayName, shiftId, date, image, compOff } = req.body;
        const checkHolidayName = await AdminService.checkHolidayName(holidayName, date, shiftId);
        if (checkHolidayName !== 0) {
          const record = {
            success: false,
            msg: msg.msgHolidayExist,
          };
          return res.status(200).json(record);
        }

        try {
          const holiday = await AdminService.addHoliday(holidayName, date, shiftId, image, compOff);
          if (holiday === "NA") {
            const record = {
              success: false,
              msg: msg.msgHolidayAddError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgHolidayAddSuccess,
              data: { holiday: holiday },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const editHoliday = [
  //  validation

  body("shiftId").trim().exists().withMessage(msg.msgShiftIdReqired).notEmpty().withMessage(msg.msgShiftIdReqired),
  body("date").trim().exists().withMessage(msg.msgDateReqired).notEmpty().withMessage(msg.msgDateReqired),
  body("holidayId").trim().exists().withMessage(msg.msgHolidayIdReqired).notEmpty().withMessage(msg.msgHolidayIdReqired),
  body("holidayName").trim().exists().withMessage(msg.msgHolidayNameReqired).notEmpty().withMessage(msg.msgHolidayNameReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { holidayName, holidayId, date, shiftId, image, compOff } = req.body;

        const checkHoliday = await AdminService.checkHoliday(holidayId);
        if (checkHoliday === 0) {
          const record = {
            success: false,
            msg: msg.msgHolidayNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const checkHolidayWithName = await AdminService.checkHolidayWithName(holidayId, holidayName, date, shiftId);
          if (checkHolidayWithName !== 0) {
            const record = {
              success: false,
              msg: msg.msgHolidayExist,
            };
            return res.status(200).json(record);
          }

          try {
            const holidayStatus = await AdminService.editHoliday(holidayId, holidayName, date, shiftId, image, compOff);
            if (holidayStatus === 0) {
              const record = {
                success: false,
                msg: msg.msgHolidayUpdateError,
              };
              return res.status(200).json(record);
            } else {
              const record = {
                success: true,
                msg: msg.msgHolidayUpdateSuccess,
                data: { holiday: holidayStatus },
              };
              return res.status(200).json(record);
            }
          } catch (error) {
            console.log("database error key 3", error);
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: error,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const activeDeactiveHoliday = [
  //  validation
  body("holidayId").trim().exists().withMessage(msg.msgHolidayIdReqired).notEmpty().withMessage(msg.msgHolidayIdReqired),
  body("activeFlag").trim().exists().withMessage(msg.msgActiveFlagReqired).notEmpty().withMessage(msg.msgActiveFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { holidayId, activeFlag } = req.body;
        const checkHoliday = await AdminService.checkHoliday(holidayId);
        if (checkHoliday === 0) {
          const record = {
            success: false,
            msg: msg.msgHolidayNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          let activeDeactiveFlag = 0;
          if (activeFlag === "0") {
            activeDeactiveFlag = 1;
          } else {
            activeDeactiveFlag = 0;
          }
          const holidayStatus = await AdminService.activeDeactiveHoliday(holidayId, activeDeactiveFlag);
          if (holidayStatus === 0) {
            const record = {
              success: false,
              msg: msg.msgHolidayUpdateError,
            };
            return res.status(200).json(record);
          } else {
            if (activeFlag === "0") {
              const record = {
                success: true,
                msg: msg.msgHolidayActiveSuccess,
                data: { holiday: holidayStatus },
              };
              return res.status(200).json(record);
            } else {
              const record = {
                success: true,
                msg: msg.msgHolidayDeactiveSuccess,
                data: { Holiday: holidayStatus },
              };
              return res.status(200).json(record);
            }
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const deleteHoliday = [
  //  validation
  body("holidayId").trim().exists().withMessage(msg.msgHolidayIdReqired).notEmpty().withMessage(msg.msgHolidayIdReqired),
  body("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { holidayId, deleteFlag } = req.body;

        const checkHoliday = await AdminService.checkHoliday(holidayId);
        if (checkHoliday === 0) {
          const record = {
            success: false,
            msg: msg.msgHolidayNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const holidayStatus = await AdminService.deleteHoliday(holidayId, deleteFlag);
          if (holidayStatus === 0) {
            const record = {
              success: false,
              msg: msg.msgHolidayDeleteError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgHolidayDeleteSuccess,
              data: { holiday: holidayStatus },
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const holidays = [
  query("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else if (!req.currentUserId) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    } else if (!req.currentUser) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    } else {
      const { deleteFlag } = req.query;
      try {
        const unitIds = req?.currentUser?.unitId;
        if (!unitIds || unitIds?.length === 0) {
          return res.status(200).json({ success: false, msg: msg.msgUnitNotExist });
        }
        const shiftIds = await AdminService.getShiftIdsByUnitIds(unitIds);
        if (!Array.isArray(shiftIds) || !shiftIds || shiftIds?.length === 0) {
          return res.status(200).json({ success: false, msg: msg.msgShiftNotExist });
        }
        const holidays = await AdminService.getHolidays(shiftIds, Number(deleteFlag));

        if (holidays === "NA") {
          const record = {
            success: true,
            msg: msg.msgDataNotFound,
            data: { holidays: [] },
          };
          return res.status(200).json(record);
        }
        const record = {
          success: true,
          msg: msg.msgDataFound,
          data: { holidays: holidays },
        };
        return res.status(200).json(record);
      } catch (error) {
        console.log("database error key 2", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

const permission = [
  //  validation
  query("permissionId").trim().exists().withMessage(msg.msgPermissionIdReqired).notEmpty().withMessage(msg.msgPermissionIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      try {
        const { permissionId } = req.query;
        const checkPermission = await AdminService.checkPermission(permissionId);
        if (checkPermission === 0) {
          const record = {
            success: false,
            msg: msg.msgEmployeeNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          const permission = await AdminService.getPermissionOne(checkPermission);
          if (permission === "NA") {
            const record = {
              success: true,
              msg: msg.msgDataNotFound,
              data: { permission: "NA" },
            };
            return res.status(200).json(record);
          }
          const record = {
            success: true,
            msg: msg.msgDataFound,
            data: { permission: permission },
          };
          return res.status(200).json(record);
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];
const permissions = [
  query("deleteFlag").trim().exists().withMessage(msg.msgDeleteFlagReqired).notEmpty().withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    }

    const { deleteFlag } = req.query;
    try {
      const permissions = await AdminService.getPermissions(Number(deleteFlag));

      if (permissions === "NA") {
        const record = {
          success: true,
          msg: msg.msgDataNotFound,
          data: { permissions: [] },
        };
        return res.status(200).json(record);
      }
      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { permissions: permissions },
      };
      return res.status(200).json(record);
    } catch (error) {
      console.log("database error key 2", error);
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const editPermission = [
  body("permissionId").trim().exists().withMessage(msg.msgPermissionIdReqired).notEmpty().withMessage(msg.msgPermissionIdReqired),
  body("accessLevel").exists().withMessage(msg.msgDateReqired).notEmpty().withMessage(msg.msgDateReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      console.log(req.body.accessLevel.map((item) => item));

      try {
        const { permissionId, accessLevel } = req.body;
        const checkPermission = await AdminService.checkPermission(permissionId);
        if (checkPermission === 0) {
          const record = {
            success: false,
            msg: msg.msgHolidayNotExist,
          };
          return res.status(200).json(record);
        }
        try {
          try {
            const permissionStatus = await AdminService.editPermission(permissionId, accessLevel);
            if (permissionStatus === 0) {
              const record = {
                success: false,
                msg: msg.msgPermissionUpdateError,
              };
              return res.status(200).json(record);
            } else {
              const record = {
                success: true,
                msg: msg.msgPermissionUpdateSuccess,
                data: { permission: permissionStatus },
              };
              return res.status(200).json(record);
            }
          } catch (error) {
            console.log("database error key 3", error);
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: error,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          console.log("database error key 2", error);
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("database error key 1", error);
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    }
  },
];

module.exports = {
  dashboard,
  companies,
  roles,
  weekDays,
  addUnit,
  editUnit,
  activeDeactiveUnit,
  deleteUnit,
  units,
  unitTeams,
  unitDepartments,
  departments,
  addDepartment,
  editDepartment,
  activeDeactiveDepartment,
  deleteDepartment,
  addShift,
  editShift,
  getOneShift,
  activeDeactiveShift,
  deleteShift,
  shifts,
  unitShifts,
  addEmployeeByCSV,
  addEmployee,
  editEmployee,
  viewEmployee,
  activeDeactiveEmployee,
  manualPunchStatusEmployee,
  deleteEmployee,
  approveEmployee,
  employees,
  unitEmployees,
  getReportingManagerAll,
  teams,
  addTeam,
  editTeam,
  activeDeactiveTeam,
  deleteTeam,
  holidays,
  addHoliday,
  editHoliday,
  activeDeactiveHoliday,
  deleteHoliday,
  permissions,
  editPermission,
  permission,

};
