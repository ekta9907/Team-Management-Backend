require("dotenv").config();
const { body, query, validationResult } = require("express-validator");

const msg = require("../../helpers/hrLanguageMessageHelper");
const CommenFunction = require("../../helpers/commenHelper");
const MailFunctions = require("../../helpers/mailSendHelper");

const EmployeeService = require("../../services/hrServices/employeeService");

const CommenService = require("../../services/hrServices/commenService");

//====================================== dashboard===========================

const dashboard = [
  //  validation
  query("dayMonthYear").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(200).json({ success: false, msg: errors.array()[0].msg });
    } else {
      if (!req.currentUserId) {
        return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
      }
      if (!req.currentUser) {
        return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
      } else {
        const { dayMonthYear } = req.query;
        try {
          const unitIds = req?.currentUser?.unitId;
          if (!unitIds || unitIds?.length === 0) {
            return res.status(200).json({ success: false, msg: msg.msgUnitNotExist });
          }
          const shiftId = req?.currentUser?.shiftId;

          if (!shiftId) {
            return res.status(200).json({ success: false, msg: msg.msgShiftNotExist });
          }
          const parts = String(dayMonthYear).split("-");
          let year, month, day;
          if (parts.length === 3) {
            [year, month, day] = parts;
          } else if (parts.length === 2) {
            [year, month] = parts;
          } else if (parts.length === 1) {
            [year] = parts;
          }
          const deleteFlag = 0;
          const holidayCount = await EmployeeService.getHolidayCount(shiftId, day, month, year, deleteFlag);
          const shiftCount = await EmployeeService.getShiftsCount(unitIds, deleteFlag);
          const userCount = await EmployeeService.getUserCount(unitIds, deleteFlag);
          const employeeCount = await EmployeeService.getEmployeeCounts(unitIds, deleteFlag);
          const activeEmployeeCount = await EmployeeService.getEmployeeCount(unitIds, 0, deleteFlag);
          const offBoradingEmployeeCount = await EmployeeService.getEmployeeCount(unitIds, 1, deleteFlag);
          const record = {
            success: true,
            msg: msg.msgDataFound,
            data: { holidayCount, shiftCount, employeeCount, activeEmployeeCount, offBoradingEmployeeCount, userCount },
          };
          return res.status(200).json(record);
        } catch (error) {
          logger.error("Database error in dashboard emp", { error });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      }
    }
  },
];

module.exports = {
  dashboard,
};
