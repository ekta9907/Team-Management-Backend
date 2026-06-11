//====================================== File return ===========================
require("dotenv").config();

const ExcelJS = require("exceljs");
const moment = require("moment");
require("moment-duration-format");
const workbook = new ExcelJS.Workbook();
const sheet = workbook.addWorksheet("Attendance");
const msg = require("../../helpers/hrLanguageMessageHelper");
const CommenService = require("../../services/hrServices/commenService");

const AttendanceModel = require("../../models/workspaceModels/attendanceModel");
// const HolidayModel = require("../../models/workspaceModels/holidayModel");

const { body, query, validationResult } = require("express-validator");
const logger = require("../../helpers/loggerHelper");
const OneSignalHelperUser = require("../../helpers/oneSignalHelperTenant");
const CommenFunction = require("../../helpers/commenHelper");
const MailFunctions = require("../../helpers/mailSendHelper");
const {
  encryptDataByKey,
  decryptDataByKey,
} = require("../../helpers/commenHelper");
const recordNumberKeys = [
  "emppfp",
  "empesicp",
  "epfp",
  "esicp",
  "pfMinBasicSalary",
  "esicMinGrossSalary",
  "epf",
  "esic",
  "emppf",
  "empesic",
  "salaryGiveByCompany",
  "finalBasic",
  "hra",
  "otherAllowance",
  "grossSalary",
  "actualBasicSalary",
  "totalCTC",
  "pt",
  "otherTDS",
  "salaryGiveByCompanyYear",
  "totalCTCYearly",
  "totalDeduction",
  "grandTotalCTCWithDeduction",
  "grandTotalCTCWithDeductionYearly",
];
const monthlyRecordNumberKeys = [
  "emppfp",
  "empesicp",
  "epfp",
  "esicp",
  "pfMinBasicSalary",
  "esicMinGrossSalary",
  "epf",
  "esic",
  "emppf",
  "empesic",
  "salaryGiveByCompany",
  "finalBasic",
  "hra",
  "otherAllowance",
  "grossSalary",
  "actualBasicSalary",
  "totalCTC",
  "pt",
  "otherTDS",
  "salaryGiveByCompanyYear",
  "totalCTCYearly",
  "totalDeduction",
  "grandTotalCTCWithDeduction",
  "grandTotalCTCWithDeductionYearly",

  "earnCompOffDaysAmount",
  "earnEncashLeaveAmount",
  "earnLWPAmount",
  "earnTotalPay",

  "earnfinalBasic",
  "earnhra",
  "earnotherAllowance",
  "earngrossSalary",
  "earnactualBasicSalary",
  "earnpfMinBasicSalary",
  "earnesicMinGrossSalary",
  "earnepfp",
  "earnepf",
  "earnesic",
  "earnesicp",
  "earntotalCTC",

  "earnemppfp",
  "earnemppf",
  "earnempesicp",
  "earnempesic",

  "earnIncentiveAmount",
  "earnTotalPayWithIncentive",

  "earnempptDeduction",
  "earnempTDSDeduction",
  "earnempwelfareDeduction",
  "earnempotherDeduction",
  "earnempTotalDeduction",

  "earnNetPay",

  "earnReimbursementAmount",
  "earnOtherAmount",

  "earnFinalNetPay",
];

//====================================== dashboard===========================

const dashboard = [
  //  validation
  query("dayMonthYear")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }

    const { deleteFlag, monthYear, monthDay, dayMonthYear } = req.query;
    try {
      const unitIdsCurrent = CURRENT_USER?.unitId;
      const roleNameCurrent = CURRENT_USER?.roleName;
      const showBirthAny = CURRENT_USER?.showBirthAny || 0;

      // if (!unitIdsCurrent || unitIdsCurrent?.length === 0) {
      //   return res.status(200).json({ success: false, msg: msg.msgUnitNotExist });
      // }
      const shiftIdCurrent = CURRENT_USER?.shiftId;

      // if (!shiftIdCurrent) {
      //   return res.status(200).json({ success: false, msg: msg.msgShiftNotExist });
      // }

      const parts = String(dayMonthYear).split("-");
      let year, month, day;
      if (parts.length === 3) {
        [year, month, day] = parts;
      } else if (parts.length === 2) {
        [year, month] = parts;
      } else if (parts.length === 1) {
        [year] = parts;
      }
      const unitCount = await CommenService.getUnitsCount(
        SITE_DB_NAME,
        unitIdsCurrent,
        deleteFlag
      );
      const shiftCount = await CommenService.getShiftsCount(
        SITE_DB_NAME,
        unitIdsCurrent,
        deleteFlag
      );
      const holidayCount = await CommenService.getHolidayCount(
        SITE_DB_NAME,
        shiftIdCurrent,
        day,
        month,
        year,
        deleteFlag
      );
      const holidayCompoffCount = await CommenService.getholidayCompoffCount(
        SITE_DB_NAME,
        shiftIdCurrent,
        day,
        month,
        year,
        deleteFlag
      );
      const userCount = await CommenService.getUserCount(
        SITE_DB_NAME,
        unitIdsCurrent,
        deleteFlag
      );
      const employeeCount = await CommenService.getEmployeeCounts(
        SITE_DB_NAME,
        unitIdsCurrent,
        deleteFlag
      );
      const activeEmployeeCount = await CommenService.getEmployeeCount(
        SITE_DB_NAME,
        unitIdsCurrent,
        0,
        deleteFlag
      );
      const offBoradingEmployeeCount = await CommenService.getEmployeeCount(
        SITE_DB_NAME,
        unitIdsCurrent,
        1,
        deleteFlag
      );

      const birthdayData = await CommenService.getBirthData(
        SITE_DB_NAME,
        roleNameCurrent,
        unitIdsCurrent,
        day,
        month,
        year,
        showBirthAny
      );
      const joiningData = await CommenService.getJoiningData(
        SITE_DB_NAME,
        roleNameCurrent,
        unitIdsCurrent,
        day,
        month,
        year,
        showBirthAny
      );
      try {
        let userId,
          unitIds,
          uniqueId,
          religiousBreak,
          joiningDate,
          holidays,
          shift,
          shiftId,
          name,
          monthlyExtraFreeMin,
          relievingDate,
          image,
          monthlyExtraWorkingDays,
          weekEnds,
          weekWorkingDays;

        if ("userId" in req.query && req.query.userId) {
          let userIdReq = req?.query?.userId;
          const checkUser = await CommenService.checkUser(
            SITE_DB_NAME,
            userIdReq
          );
          if (checkUser === "NA") {
            userId = 0;
          }
          userId = checkUser._id;
          const userDetails = await CommenService.getUserDetails(
            SITE_DB_NAME,
            checkUser._id
          );

          unitIds = userDetails?.unitId;
          name = userDetails?.name;
          uniqueId = userDetails?.uniqueId;
          image = userDetails?.image;
          religiousBreak = userDetails?.religiousBreak;
          joiningDate = userDetails?.joiningDate;
          holidays = userDetails?.holidays || [];
          shift = userDetails?.shiftDetails || null;
          monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
          weekEnds = shift?.weekEnds || [];
          shiftId = userDetails?.shiftId;
          relievingDate = userDetails?.relievingDate;
          monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin;
          weekWorkingDays = shift?.weekWorkingDays || [];
        } else {
          userId = CURRENT_USER_ID;
          unitIds = CURRENT_USER?.unitId;
          uniqueId = CURRENT_USER?.uniqueId;
          name = CURRENT_USER?.name;
          image = CURRENT_USER?.image;
          religiousBreak = CURRENT_USER?.religiousBreak;
          joiningDate = CURRENT_USER?.joiningDate;
          holidays = CURRENT_USER?.holidays || [];
          shift = CURRENT_USER?.shiftDetails || null;
          monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
          weekEnds = shift?.weekEnds || [];
          shiftId = CURRENT_USER?.shiftId;
          relievingDate = CURRENT_USER?.relievingDate;
          monthlyExtraFreeMin = CURRENT_USER?.shiftDetails?.monthlyExtraFreeMin;
          weekWorkingDays = shift?.weekWorkingDays || [];
        }

        if (!unitIds || unitIds?.length === 0) {
          return res.status(200).json({
            success: false,
            msg: msg.msgUnitNotExist,
            attendances: [],
          });
        }

        const shiftIds = [shiftId];
        if (!shiftIds || shiftIds?.length === 0) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgUnitNotExist });
        }
        if (!shift) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgShiftNotExist });
        }
        if (!Array.isArray(shiftIds) || !shiftIds || shiftIds?.length === 0) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgShiftNotExist });
        }

        const promises = Array.from({ length: monthDay }, async (_, index) => {
          const day = monthDay - index;
          const currentDate = new Date().toISOString().split("T")[0];

          const attendanceDate = `${monthYear}-${String(day).padStart(2, "0")}`;
          const weekDay = new Date(attendanceDate).getDay();
          if (
            new Date(currentDate) < new Date(attendanceDate) ||
            new Date(joiningDate) > new Date(attendanceDate)
          ) {
            return null;
          }
          if (relievingDate) {
            if (
              new Date(relievingDate.toISOString().split("T")[0]) <
              new Date(attendanceDate)
            ) {
              return null;
            }
          }
          const attendance = await CommenService.attendanceByDate(
            SITE_DB_NAME,
            userId,
            attendanceDate
          );
          let shiftReligiousBreakDuration = 0;
          if (religiousBreak > 0 && weekDay === 5) {
            shiftReligiousBreakDuration = shift?.religiousBreakMin;
          }

          if (!attendance) {
            let status = "Absent";

            const holidayStatus = holidays.find((holiday) => {
              const holidayDate = new Date(holiday.date)
                .toISOString()
                .split("T")[0];
              return holidayDate === attendanceDate;
            });
            // If it's Saturday or Sunday
            let dayName = moment(attendanceDate, "YYYY-MM-DD").format("dddd");
            let weekNumber = Math.ceil(day / 7);

            let isExtraWorkingDay = monthlyExtraWorkingDays.includes(
              `${weekNumber}${dayName}`
            );
            if (!holidayStatus && weekEnds.includes(dayName)) {
              status = "Weekend";
              if (isExtraWorkingDay) {
                status = "Absent";
              }
              const weekWorkingDates = getWeekDatesByNames(
                attendanceDate,
                weekWorkingDays
              );
              // const weekAttendancesStatus = await Attendance.find({
              //   userId: userId,
              //   date: { $in: weekWorkingDates },
              //   status: { $in: ["Present"] },
              // });
              const weekAttendancesStatus =
                await CommenService.getWeekAttendancesStatus(
                  SITE_DB_NAME,
                  userId,
                  weekWorkingDates
                );
              const weekHolidays = holidays.some((holiday) => {
                const holidayDate = new Date(holiday.date)
                  .toISOString()
                  .split("T")[0];
                return weekWorkingDates.includes(holidayDate);
              });
              if (weekAttendancesStatus.length === 0 && !weekHolidays) {
                status = "Absent";
              }
            }
            // If it's Holiday
            else if (holidayStatus && !weekEnds.includes(dayName)) {
              status = "Holiday";
            } else if (holidayStatus && weekEnds.includes(dayName)) {
              status = `Holiday (Weekend)`;
            }

            return {
              userId: userId,
              uniqueId: uniqueId,
              name: name,
              image: image,
              shiftId: shiftId,
              shiftStart: shift?.startTime,
              shiftEnd: shift?.endTime,
              shiftBreakDuration: shift?.breakDuration,
              shiftReligiousBreakDuration: shiftReligiousBreakDuration,
              date: new Date(attendanceDate),
              punches: [],
              firstIn: null,
              firstInStatus: 0,
              lastOut: null,
              lastOutStatus: 0,
              workingHrs: "00:00",
              workingMin: 0,
              breakDuration: 0,
              lateBy: 0,
              overTime: 0,
              status: status,
              presentStatus: "No",
              leaveStatus: "No",
              leaveType: "No",
              activeFlag: 1,
              shortLoginHDStatus: 0,
              religiousBreakDuration: shiftReligiousBreakDuration,
              religiousBreakStatus: religiousBreak,
              deleteFlag: deleteFlag || 0,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          } else {
            return attendance;
          }
        });

        // Wait for all days to be processed
        const attendances = await Promise.all(promises);

        const currentDate = moment().format("YYYY-MM-DD");
        const startDate = moment().add(1, "days").format("YYYY-MM-DD");
        const endDate = moment().add(7, "days").format("YYYY-MM-DD");

        const getPaidLeave = await CommenService.getPaidLeave(
          SITE_DB_NAME,
          userId,
          `${year}-${month}`
        );

        const todayLeaves = [];
        const upComingLeaves =
          (await leavesForDashboard({
            deleteFlag: 0,
            monthYear: [currentDate, endDate],
            selectionType: "custom",
            userDetails: CURRENT_USER,
            SITE_DB_NAME,
          })) || [];
        // (await leavesForDashboard({ deleteFlag: 0, monthYear, selectionType: "month", userDetails: CURRENT_USER })) ||
        const monthlyLeaves = [];
        const record = {
          success: true,
          msg: msg.msgDataFound,
          data: {
            unitCount,
            shiftCount,
            joiningData,
            birthdayData,
            holidayCount,
            holidayCompoffCount,
            employeeCount,
            activeEmployeeCount,
            offBoradingEmployeeCount,
            userCount,
            attendances: attendances.filter((item) => item !== null),
            paidLeave: getPaidLeave,
            leaveData: { todayLeaves, upComingLeaves, monthlyLeaves },
          },
        };
        return res.status(200).json(record);
      } catch (error) {
        logger.error("Database error in dashboard emp 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in dashboard emp 2", { error });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const leavesForDashboard = async (data) => {
  const { deleteFlag, monthYear, selectionType, userDetails, SITE_DB_NAME } =
    data;
  try {
    let userId, unitIds, roleName;
    userId = userDetails.userId;
    unitIds = userDetails?.unitId;
    roleName = userDetails?.roleName;
    let leaves = [];
    leaves = await CommenService.getLeaves(
      SITE_DB_NAME,
      userId,
      unitIds,
      roleName,
      selectionType,
      monthYear,
      Number(deleteFlag)
    );
    return leaves;
  } catch (error) {
    logger.error("Database error in leaves application", {
      error: error.meessage,
    });
    const record = { success: true, msg: error.message, key: "error" };
    return res.status(500).json(record);
  }
};

const uploadFile = async (req, res) => {
  if (!req.file && !req.file?.filename) {
    const record = { success: false, msg: msg.msgUploadFileError, key: 3 };
    return res.status(200).json(record);
  }
  const record = {
    success: true,
    msg: msg.msgUploadFileSuccess,
    fileName: req.folderName + "/" + req.file.filename,
    file: req.file,
  };
  return res.status(200).json(record);
};

const permissions = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }

    const { deleteFlag } = req.query;
    try {
      const permissions = await CommenService.getPermissions(
        SITE_DB_NAME,
        Number(deleteFlag)
      );

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
const permission = [
  //  validation
  query("permissionId")
    .trim()
    .exists()
    .withMessage(msg.msgPermissionIdReqired)
    .notEmpty()
    .withMessage(msg.msgPermissionIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { permissionId } = req.query;
      const checkPermission = await CommenService.checkPermission(
        SITE_DB_NAME,
        permissionId
      );
      if (checkPermission === 0) {
        const record = {
          success: false,
          msg: msg.msgEmployeeNotExist,
        };
        return res.status(200).json(record);
      }
      try {
        const permission = await CommenService.getPermissionOne(
          SITE_DB_NAME,
          checkPermission
        );
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
  },
];

const addRegistration = [
  //  validation
  body("unitId")
    .trim()
    .exists()
    .withMessage(msg.msgUnitIdReqired)
    .notEmpty()
    .withMessage(msg.msgUnitIdReqired),
  body("companyId")
    .trim()
    .exists()
    .withMessage(msg.msgCompanyIdReqired)
    .notEmpty()
    .withMessage(msg.msgCompanyIdReqired),
  body("shiftId")
    .trim()
    .exists()
    .withMessage(msg.msgShiftIdReqired)
    .notEmpty()
    .withMessage(msg.msgShiftIdReqired),
  body("roleId")
    .trim()
    .exists()
    .withMessage(msg.msgRoleIdReqired)
    .notEmpty()
    .withMessage(msg.msgRoleIdReqired),
  body("roleName")
    .trim()
    .exists()
    .withMessage(msg.msgRoleNameReqired)
    .notEmpty()
    .withMessage(msg.msgRoleNameReqired),
  body("departmentId")
    .trim()
    .exists()
    .withMessage(msg.msgDesignationIdReqired)
    .notEmpty()
    .withMessage(msg.msgDesignationIdReqired),

  body("uniqueId")
    .trim()
    .exists()
    .withMessage(msg.msgUniqueIdReqired)
    .notEmpty()
    .withMessage(msg.msgUniqueIdReqired),
  body("designationName")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("firstName")
    .trim()
    .exists()
    .withMessage(msg.msgFirstNameReqired)
    .notEmpty()
    .withMessage(msg.msgFirstNameReqired),
  body("lastName")
    .trim()
    .exists()
    .withMessage(msg.msgLastNameReqired)
    .notEmpty()
    .withMessage(msg.msgLastNameReqired),
  body("name")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("email")
    .trim()
    .exists()
    .withMessage(msg.msgEmailReqired)
    .notEmpty()
    .withMessage(msg.msgEmailReqired),
  body("personalEmail")
    .trim()
    .exists()
    .withMessage(msg.msgEmailReqired)
    .notEmpty()
    .withMessage(msg.msgEmailReqired),
  body("mobileNumber")
    .trim()
    .exists()
    .withMessage(msg.msgMobileNumberReqired)
    .notEmpty()
    .withMessage(msg.msgMobileNumberReqired),

  body("joiningDate")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg, errors });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
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
        joiningDate,

        profileComplete,
        approveFlag,
      } = req.body;
      const registeredById = CURRENT_USER_ID;
      const reportingManager = req.body.reportingManagerId;
      let reportingManagerId = null;
      if (reportingManager === "") {
        reportingManagerId = null;
      } else {
        reportingManagerId = reportingManager;
      }
      const approvedById = CURRENT_USER_ID;
      const checkUserEmail = await CommenService.checkUserEmail(
        SITE_DB_NAME,
        email.toLowerCase()
      );
      if (checkUserEmail !== 0) {
        const record = {
          success: false,
          msg: msg.msgEmailAlreadyExist,
        };
        return res.status(200).json(record);
      }
      const checkUserUniqueId = await CommenService.checkUserUniqueId(
        SITE_DB_NAME,
        uniqueId
      );
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
        const employee = await CommenService.addRegistration(
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
          email.toLowerCase(),
          hashPassword,
          phoneCode,
          mobileNumber,
          personalEmail.toLowerCase(),
          joiningDate,

          profileComplete,
          approveFlag,
          approvedById,
          registeredById,
          showPassword
        );
        if (employee === "NA") {
          const record = {
            success: false,
            msg: msg.msgEmployeeAddError,
          };
          return res.status(200).json(record);
        } else {
          const userDetails = await CommenService.getUserDetails(
            SITE_DB_NAME,
            employee._id
          );
          let languageId = "0";
          if (userDetails !== "NA") {
            languageId = userDetails.languageId;
          }

          const siteURL = process.env.SITE_URL;
          const APP_URL = process.env.APP_URL;
          const mailEmail = email;
          const mailName = name;
          const registerLink = `${APP_URL}/commen/redirect/${employee._id}?type=register`;
          const mailSubject = msg.mailSubjectAddRegistration[languageId];
          const mailHeading = msg.mailHeadingAddRegistration[languageId];
          const headerGreeting = msg.mailHeaderGreetingAddEmployee[languageId];
          const mailContents = msg.mailContentAddRegistration(
            registerLink,
            process.env.FOOTERBACKGROUND,
            email,
            password,
            employee._id
          );
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
              const responce = await MailFunctions.mailSend(
                mailEmail,
                mailFromName,
                mailSubject,
                mailBody
              );
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
  },
];

const editRegistration = [
  //  validation
  body("employeeId")
    .trim()
    .exists()
    .withMessage(msg.msgEmployeeIdReqired)
    .notEmpty()
    .withMessage(msg.msgEmployeeIdReqired),
  body("unitId")
    .trim()
    .exists()
    .withMessage(msg.msgUnitIdReqired)
    .notEmpty()
    .withMessage(msg.msgUnitIdReqired),
  body("companyId")
    .trim()
    .exists()
    .withMessage(msg.msgCompanyIdReqired)
    .notEmpty()
    .withMessage(msg.msgCompanyIdReqired),
  body("shiftId")
    .trim()
    .exists()
    .withMessage(msg.msgShiftIdReqired)
    .notEmpty()
    .withMessage(msg.msgShiftIdReqired),
  body("roleId")
    .trim()
    .exists()
    .withMessage(msg.msgRoleIdReqired)
    .notEmpty()
    .withMessage(msg.msgRoleIdReqired),
  body("roleName")
    .trim()
    .exists()
    .withMessage(msg.msgRoleNameReqired)
    .notEmpty()
    .withMessage(msg.msgRoleNameReqired),
  body("departmentId")
    .trim()
    .exists()
    .withMessage(msg.msgDesignationIdReqired)
    .notEmpty()
    .withMessage(msg.msgDesignationIdReqired),

  body("uniqueId")
    .trim()
    .exists()
    .withMessage(msg.msgUniqueIdReqired)
    .notEmpty()
    .withMessage(msg.msgUniqueIdReqired),
  body("designationName")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("firstName")
    .trim()
    .exists()
    .withMessage(msg.msgFirstNameReqired)
    .notEmpty()
    .withMessage(msg.msgFirstNameReqired),
  body("lastName")
    .trim()
    .exists()
    .withMessage(msg.msgLastNameReqired)
    .notEmpty()
    .withMessage(msg.msgLastNameReqired),
  body("name")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("email")
    .trim()
    .exists()
    .withMessage(msg.msgEmailReqired)
    .notEmpty()
    .withMessage(msg.msgEmailReqired),
  body("personalEmail")
    .trim()
    .exists()
    .withMessage(msg.msgEmailReqired)
    .notEmpty()
    .withMessage(msg.msgEmailReqired),
  body("mobileNumber")
    .trim()
    .exists()
    .withMessage(msg.msgMobileNumberReqired)
    .notEmpty()
    .withMessage(msg.msgMobileNumberReqired),
  body("dob")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("originalDob")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("joiningDate")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("PANNumber")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("aadharNumber")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("fatherName")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("address")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("gender")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("maritalStatus")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("profileComplete")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("approveFlag")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("city")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("state")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("pincode")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg, errors });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
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
        approveFlag,
        profileComplete,
        eSICNumber,
      } = req.body;
      const reportingManager = req.body.reportingManagerId;
      let reportingManagerId = null;
      if (reportingManager === "") {
        reportingManagerId = null;
      } else {
        reportingManagerId = reportingManager;
      }
      const checkUser = await CommenService.checkUser(SITE_DB_NAME, employeeId);
      if (checkUser === "NA") {
        const record = {
          success: false,
          msg: msg.msgEmailAlreadyExist,
        };
        return res.status(200).json(record);
      }
      const checkUserEmail = await CommenService.checkUserEmailWithId(
        SITE_DB_NAME,
        employeeId,
        email.toLowerCase()
      );
      if (checkUserEmail !== 0) {
        const record = {
          success: false,
          msg: msg.msgEmailAlreadyExist,
        };
        return res.status(200).json(record);
      }

      const checkUserUniqueId = await CommenService.checkUserUniqueIdWithId(
        SITE_DB_NAME,
        employeeId,
        uniqueId
      );
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
        const employee = await CommenService.updateRegistration(
          SITE_DB_NAME,
          employeeId,
          {
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
            email: email.toLowerCase(),
            phoneCode,
            mobileNumber,
            personalEmail: personalEmail.toLowerCase(),
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
            approveFlag,
            profileComplete,
            eSICNumber,
          }
        );
        if (employee === "NA") {
          const record = {
            success: false,
            msg: msg.msgEmployeeUpdateError,
          };
          return res.status(200).json(record);
        } else {
          const userDetails = await CommenService.getUserDetails(
            SITE_DB_NAME,
            checkUser._id
          );
          let languageId = "0";
          if (userDetails !== "NA") {
            languageId = userDetails.languageId;
          }

          const siteURL = process.env.SITE_URL;
          const mailEmail = email;
          const mailName = name;

          const mailSubject = msg.mailSubjectApprovalEmployee[languageId];
          const mailHeading = msg.mailHeadingApprovalEmployee[languageId];
          const headerGreeting =
            msg.mailHeaderGreetingUpdateEmployee[languageId];
          const mailContents = msg.mailContentApprovalEmployee(
            siteURL,
            process.env.FOOTERBACKGROUND,
            name,
            email,
            checkUser?.showPassword
          );
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
              const responce = await MailFunctions.mailSend(
                mailEmail,
                mailFromName,
                mailSubject,
                mailBody
              );
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
  },
];

const updateRegistration = [
  // Basic validation for employeeId
  body("employeeId")
    .trim()
    .exists()
    .withMessage(msg.msgEmployeeIdReqired)
    .notEmpty()
    .withMessage(msg.msgEmployeeIdReqired),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg, errors });
    }

    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { employeeId } = req.body;
      const checkUser = await CommenService.checkUser(SITE_DB_NAME, employeeId);

      if (checkUser === "NA") {
        return res.status(200).json({
          success: false,
          msg: msg.msgEmailAlreadyExist,
        });
      }

      const updateData = {};
      for (const [key, value] of Object.entries(req.body)) {
        if (value !== undefined && key !== "employeeId") {
          updateData[key] = value;
        }
      }

      updateData.phoneCode = "+91";

      if (updateData.personalEmail) {
        updateData.personalEmail = updateData.personalEmail.toLowerCase();
      }

      const employee = await CommenService.updateRegistration(
        SITE_DB_NAME,
        employeeId,
        updateData
      );

      if (employee === "NA") {
        return res.status(200).json({
          success: false,
          msg: msg.msgEmployeeUpdateError,
        });
      }

      const registeredUserDetails = await CommenService.getUserDetails(
        SITE_DB_NAME,
        checkUser.registeredById
      );
      let languageId = "0";
      if (registeredUserDetails !== "NA")
        languageId = registeredUserDetails.languageId;

      const siteURL = process.env.SITE_URL;
      const mailEmail = registeredUserDetails.email;
      const mailName = registeredUserDetails?.name;

      const mailSubject = msg.mailSubjectUpdateRegistration[languageId];
      const mailHeading = msg.mailHeadingUpdateRegistration[languageId];
      const headerGreeting = msg.mailHeaderGreetingUpdateEmployee[languageId];
      const mailContents = msg.mailContentUpdateRegistration(
        siteURL,
        process.env.FOOTERBACKGROUND,
        checkUser._id,
        checkUser?.name,
        checkUser?.uniqueId
      );
      const mailContent = mailContents[languageId];

      const mailFromName = process.env.MAIL_FROM_NAME;
      const appName = process.env.APP_NAME;
      const appLogo = process.env.APP_LOGO;
      const borderBackground = process.env.BORDERBACKGROUND;
      const footerGreeting = msg.mailFooterGreeting[languageId];
      const footerDescription = msg.mailFooterDescription[languageId];
      const footerBackground = process.env.FOOTERBACKGROUND;

      const mailBody = await MailFunctions.mailBodyData({
        appName,
        appLogo,
        borderBackground,
        mailHeading,
        headerGreeting,
        name: mailName,
        mailContent,
        footerGreeting,
        footerBackground,
        footerDescription,
      });

      if (updateData?.profileComplete === 1) {
        const response = await MailFunctions.mailSend(
          mailEmail,
          mailFromName,
          mailSubject,
          mailBody
        );
        if (!response) {
          return res.status(200).json({
            success: false,
            msg: msg.msgPasswordResetLinkSendError,
          });
        }
      }

      return res.status(200).json({
        success: true,
        msg:
          updateData.profileComplete === 1
            ? msg.msgRegistrationUpdateSuccess
            : msg.msgEmployeeUpdateSuccess,
        data: registeredUserDetails,
      });
    } catch (error) {
      console.error("updateRegistration Error:", error);
      return res.status(500).json({
        success: false,
        msg: msg.msgServerError,
        key: error.message,
      });
    }
  },
];

const registrations = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag } = req.query;

    try {
      let unitIds = CURRENT_USER?.unitId;
      const roleName = CURRENT_USER?.roleName;
      if (roleName !== "Site-Owner") {
        if (!unitIds || unitIds?.length === 0) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgUnitNotExist });
        }
      } else {
        unitIds = [];
      }

      const registrations = await CommenService.getRegistrations(
        SITE_DB_NAME,
        unitIds,
        Number(deleteFlag)
      );
      if (registrations === "NA") {
        const record = {
          success: true,
          msg: msg.msgDataNotFound,
          data: { registrations: [] },
        };
        return res.status(200).json(record);
      }
      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { registrations: registrations },
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

const viewRegistration = [
  //  validation
  query("employeeId")
    .trim()
    .exists()
    .withMessage(msg.msgEmployeeIdReqired)
    .notEmpty()
    .withMessage(msg.msgEmployeeIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { employeeId } = req.query;
      const checkRegistration = await CommenService.checkRegistrationOne(
        SITE_DB_NAME,
        employeeId
      );
      if (checkRegistration === 0) {
        const record = {
          success: false,
          msg: msg.msgExpireUpdateError,
        };
        return res.status(200).json(record);
      }
      try {
        const registration = await CommenService.viewRegistration(
          SITE_DB_NAME,
          checkRegistration
        );
        if (registration === "NA") {
          const record = {
            success: true,
            msg: msg.msgDataNotFound,
            data: { registration: "NA" },
          };
          return res.status(200).json(record);
        }
        const record = {
          success: true,
          msg: msg.msgDataFound,
          data: { registration: registration },
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
  },
];
const validateEmployee = async (employee) => {
  try {
    const validationErrors = [];
    const fields = [
      "unitId",
      "companyId",
      "shiftId",
      "roleId",
      "roleName",
      "departmentId",
      "accessLevel",
      "designationName",
      "name",
      "firstName",
      "lastName",
      "uniqueId",
      "email",
      "mobileNumber",
      "personalEmail",
      "fatherName",
      "originalDob",
      "dob",
      "gender",
      "aadharNumber",
      "PANNumber",
      "address",
      "city",
      "state",
      "pincode",
      "joiningDate",
      "emergencyContactNumber",
    ];

    for (const field of fields) {
      if (
        employee[field] === null ||
        employee[field] === undefined ||
        (typeof employee[field] === "string" &&
          employee[field].trim() === "") ||
        (typeof employee[field] !== "string" && !employee[field])
      ) {
        validationErrors.push(
          msg[`msg${field.charAt(0).toUpperCase() + field.slice(1)}Required`]
        );
      }
    }

    return validationErrors;
  } catch (error) {
    logger.error("Database error in validationErrors", { error });
  }
};
const uploadEmployeeCsv = async (req, res) => {
  const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
  try {
    const result = req.body;
    let successRecords = [];

    let add = null;
    for (let index = 0; index < result.length; index++) {
      const employee = result[index];
      if (
        !employee.roleName ||
        employee.roleName === "" ||
        employee.roleName === " "
      ) {
        break;
      }

      employee["documents"] = [];
      if (employee.roleName) {
        const role = await CommenService.getRoleByRoleName(
          SITE_DB_NAME,
          employee.roleName
        );
        if (role !== "NA") {
          employee["accessLevel"] = role.accessLevel;
          employee["roleId"] = role.roleId;
        } else {
          employee["accessLevel"] = [];
          employee["roleId"] = "";
        }
      } else {
        employee["accessLevel"] = [];
        employee["roleId"] = "";
      }

      if (employee.unitName) {
        const unit = await CommenService.getUnitByUnitName(
          SITE_DB_NAME,
          employee.unitName
        );
        if (unit !== "NA") {
          employee["companyId"] = unit.companyId;
          employee["unitId"] = unit._id;
        } else {
          employee["companyId"] = "";
          employee["unitId"] = "";
        }
      } else {
        employee["companyId"] = "";
        employee["unitId"] = "";
      }
      if (employee.shiftName) {
        const shift = await CommenService.getShiftByShiftName(
          SITE_DB_NAME,
          employee.shiftName
        );
        if (shift !== "NA") {
          employee["shiftId"] = shift._id;
        } else {
          employee["shiftId"] = "";
        }
      } else {
        employee["shiftId"] = "";
      }
      if (employee.departmentName) {
        const department = await CommenService.getDepartmentByDepartmentName(
          SITE_DB_NAME,
          employee.departmentName
        );
        if (department !== "NA") {
          employee["departmentId"] = department._id;
        } else {
          employee["departmentId"] = "";
        }
      } else {
        employee["departmentId"] = "";
      }
      if (employee.teamName) {
        const team = await CommenService.getTeamByTeamName(
          SITE_DB_NAME,
          employee.teamName
        );
        if (team !== "NA") {
          employee["teamId"] = team._id;
        } else {
          employee["teamId"] = null;
        }
      } else {
        employee["teamId"] = null;
      }
      if (employee.reportingManagerName) {
        const reportingManager =
          await CommenService.getReportingManagerByReportingManagerName(
            SITE_DB_NAME,
            employee.reportingManagerName
          );
        if (reportingManager !== "NA") {
          employee["reportingManagerId"] = reportingManager._id;
        } else {
          employee["reportingManagerId"] = null;
        }
      } else {
        employee["reportingManagerId"] = null;
      }
      if (employee.employeeNumber) {
        employee["uniqueId"] = employee.employeeNumber;
      } else {
        employee["uniqueId"] = "";
      }

      employee["CTCStatus"] = 0;
      if (
        !employee.bankAccountNumber ||
        employee.bankAccountNumber === "" ||
        employee.bankAccountNumber === " "
      ) {
        employee["bankStatus"] = 0;
      } else {
        employee["bankStatus"] = 1;
      }

      employee["documentStatus"] = 0;
      employee["profileComplete"] = 1;
      employee["aadharImage"] = null;
      employee["PANImage"] = null;
      employee["addressProof"] = null;
      employee["image"] = null;
      employee["salary"] = 0;
      employee["yearCTC"] = 0;
      employee["pfEligibleStatus"] = employee.pfEligibleStatus || 0;
      employee["UAN"] = employee.UAN || null;
      employee["pfNumber"] = employee.pfNumber || null;
      employee["eSICNumber"] = employee.eSICNumber || null;
      employee["pFJoiningDate"] = employee.pFJoiningDate || null;
      employee["pFExitDate"] = employee.pFExitDate || null;
      employee["ePSJoiningDate"] = employee.ePSJoiningDate || null;
      employee["ePSExitDate"] = employee.ePSExitDate || null;
      employee["epsEligibleStatus"] = employee.epsEligibleStatus || 0;
      employee["ptStatus"] = employee.ptStatus || 0;
      employee["lwfEligibleStatus"] = employee.lwfEligibleStatus || 0;
      employee["hPSEligibleStatus"] = employee.hPSEligibleStatus || 0;
      employee["UPI"] = employee.UPI || null;
      employee["aadhaarEnrollmentNumber"] =
        employee.aadhaarEnrollmentNumber || null;

      if (
        !employee.physicallyChallenged ||
        employee.physicallyChallenged === "No" ||
        employee.physicallyChallenged === ""
      ) {
        employee.physicallyChallenged = 0;
      } else if (
        employee.physicallyChallenged === "yes" ||
        employee.physicallyChallenged === "Yes"
      ) {
        employee.physicallyChallenged = 1;
      } else {
        employee.physicallyChallenged = 0;
      }

      if (
        !employee.religiousBreak ||
        employee.religiousBreak === "No" ||
        employee.religiousBreak === ""
      ) {
        employee.religiousBreak = 0;
      } else if (
        employee.religiousBreak === "yes" ||
        employee.religiousBreak === "Yes"
      ) {
        employee.religiousBreak = 1;
      } else {
        employee.religiousBreak = 0;
      }
      req.body = employee;
      let validationErrors = await validateEmployee(employee);
      if (validationErrors.length > 0) {
        return res.status(200).json({
          success: false,
          msg: employee.email + " " + validationErrors[0],
          key: 2,
        });
      }
      add = await addEmployeeByCSV(req, res);
      successRecords.push(add);
      if (!add.success) {
        return res.status(200).json({
          success: false,
          msg: employee.email + "  " + add.msg,
          key: 1,
        });
      }
    }
    const record = {
      success: true,
      msg: msg.msgUploadFileSuccess,
      successRecords,
      key: 0,
      result,
    };
    return res.status(200).json(record);
  } catch (error) {
    logger.error("Database error in addEmployeeByCSV", { error });
    const record = { success: true, msg: error.message, key: "error" };
    return res.status(500).json(record);
  }
};
const updateEmployeeCsv = async (req, res) => {
  const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
  try {
    const result = req.body;
    let successRecords = [];

    for (let index = 0; index < result.length; index++) {
      const updates = result[index];
      if (!updates.employeeNumber || updates.employeeNumber.trim() === "") {
        return res.status(400).json({
          success: false,
          msg: "Missing employeeNumber for record",
          key: 1,
        });
      }

      const existingEmployee = await CommenService.getEmployeeByUniqueId(
        SITE_DB_NAME,
        updates.employeeNumber
      );
      if (!existingEmployee) {
        return res.status(404).json({
          success: false,
          msg: `Employee with uniqueId ${updates.employeeNumber} not found`,
          key: 1,
        });
      }

      // Prepare the update object
      const updateFields = {};

      // Loop through fields and update only non-empty ones
      for (const [key, value] of Object.entries(updates)) {
        if (
          value !== undefined &&
          value !== null &&
          value !== "" &&
          value.trim() !== ""
        ) {
          updateFields[key] = value;
        }
      }

      // Additional processing like mapping names to IDs
      if (updateFields.roleName) {
        const role = await CommenService.getRoleByRoleName(
          SITE_DB_NAME,
          updateFields.roleName
        );
        if (role !== "NA") {
          updateFields["accessLevel"] = role.accessLevel;
          updateFields["roleId"] = role.roleId;
        }
      }
      let unit_id = null;
      if (updateFields.unitName) {
        const unit = await CommenService.getUnitByUnitName(
          SITE_DB_NAME,
          updateFields.unitName
        );
        if (unit !== "NA") {
          updateFields["companyId"] = unit.companyId;
          updateFields["unitId"] = unit._id;
          unit_id = unit._id;
        }
      }

      if (updateFields.shiftName) {
        const shift = await CommenService.getShiftByShiftName(
          SITE_DB_NAME,
          updateFields.shiftName
        );
        if (shift !== "NA") {
          updateFields["shiftId"] = shift._id;
        }
      }

      if (updateFields.departmentName) {
        const dept = await CommenService.getDepartmentByDepartmentName(
          SITE_DB_NAME,
          updateFields.departmentName
        );
        if (dept !== "NA") {
          updateFields["departmentId"] = dept._id;
        }
      }

      if (updateFields.teamName) {
        const team = await CommenService.getTeamByTeamNameWithUnitId(
          SITE_DB_NAME,
          updateFields.teamName,
          unit_id
        );
        if (team !== "NA") {
          updateFields["teamId"] = team._id;
        }
      }

      if (updateFields.reportingManagerName) {
        const manager =
          await CommenService.getReportingManagerByReportingManagerName(
            SITE_DB_NAME,
            updateFields.reportingManagerName
          );
        if (manager !== "NA") {
          updateFields["reportingManagerId"] = manager._id;
        }
      }

      // Normalize yes/no boolean fields
      if (updateFields.physicallyChallenged) {
        updateFields.physicallyChallenged = ["yes", "Yes", "YES"].includes(
          updateFields.physicallyChallenged
        )
          ? 1
          : 0;
      }

      if (updateFields.religiousBreak) {
        updateFields.religiousBreak = ["yes", "Yes", "YES"].includes(
          updateFields.religiousBreak
        )
          ? 1
          : 0;
      }
      if (updateFields?.relievingDate) {
        updateFields.relievingStatus = 1;
      }

      const updatedEmployee = await CommenService.updateEmployeeFields(
        SITE_DB_NAME,
        existingEmployee._id,
        updateFields
      );
      successRecords.push(updatedEmployee);
    }

    return res.status(200).json({
      success: true,
      msg: "CSV upload successful",
      successRecords,
      key: 0,
    });
  } catch (error) {
    logger.error("Database error in updateEmployeeCsv", { error });
    return res
      .status(500)
      .json({ success: false, msg: error.message, key: "error" });
  }
};

//====================================== punch related data end ===========================

//====================================== attendance ===========================
const attendancePunch = [
  body("punchDate")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const Attendance = await AttendanceModel(SITE_DB_NAME);
    function splitCode(str) {
      const match = str.match(/^([a-zA-Z]+)(\d+)$/);
      if (match) {
        return {
          prefix: match[1], // Characters
          number: match[2], // Numbers
        };
      }
      return { prefix: null, number: null }; // Invalid format
    }
    try {
      let type = req.body.type;
      let image = req?.file?.key || "";
      let latitude = req?.body?.latitude || "";
      let longitude = req?.body?.longitude || "";
      let address = req?.body?.address || "";
      let serialNumber = req?.body?.serialNumber || "";
      const leaveArr = [];
      const userId = CURRENT_USER_ID;
      const uniqueId = CURRENT_USER?.uniqueId;
      const religiousBreak = CURRENT_USER?.religiousBreak || 0;
      const unitIds = CURRENT_USER?.unitId;
      const unitName = splitCode(uniqueId).prefix || "";
      const shift = CURRENT_USER?.shiftDetails || null;
      const shiftIsFixed = CURRENT_USER?.shiftDetails?.shiftIsFixed || 0;
      const halfDayShortLoginMin =
        CURRENT_USER?.shiftDetails?.halfDayShortLoginMin || 0;
      if (!unitIds || unitIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist });
      }
      const shiftId = CURRENT_USER?.shiftId;
      const shiftIds = [shiftId];
      if (!shiftIds || shiftIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist });
      }

      if (!Array.isArray(shiftIds) || !shiftIds || shiftIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgShiftNotExist });
      }

      const punchDateInput = req.body.punchDate;
      // Check if punchDate is provided; if not, use the current date
      const currentDate = punchDateInput
        ? moment(punchDateInput, "YYYY-MM-DD HH:mm:ss").format("YYYY-MM-DD")
        : moment().format("YYYY-MM-DD");

      // Parse and format punch date and time as YYYY-MM-DD HH:mm:ss
      const punchTime = punchDateInput
        ? moment(punchDateInput, "YYYY-MM-DD HH:mm:ss")
        : moment();

      const punchTimeString = punchTime.format("HH:mm");

      let checkAttendanceDate = null;
      // Check if the shift crosses midnight
      const shiftStartTime = moment(shift?.startTime, "HH:mm");
      const shiftEndTime = moment(shift?.endTime, "HH:mm");

      const isCrossNightShift = shiftStartTime.isAfter(shiftEndTime);
      const crossNight = isCrossNightShift ? 1 : 0;

      // Determine Attendance Date (Same day or Previous day)

      if (isCrossNightShift) {
        // If punch-out is after midnight, assign it to previous day
        const shiftStartHour = shiftStartTime.hour();
        const shiftEndHour = shiftEndTime.hour();
        if (punchTime.hour() < shiftEndHour + 5) {
          //console.log("night shift", checkAttendanceDate);
          checkAttendanceDate = moment(currentDate)
            .subtract(1, "day")
            .format("YYYY-MM-DD");
        } else {
          checkAttendanceDate = currentDate;
          ///console.log("night shift but day same", checkAttendanceDate);
        }
      } else {
        checkAttendanceDate = currentDate;
        // console.log("day shift", checkAttendanceDate);
      }

      try {
        const startOfDay = new Date(checkAttendanceDate + "T00:00:00.000Z");
        const endOfDay = new Date(checkAttendanceDate + "T23:59:59.999Z");

        let attendance = await Attendance.findOne({
          userId,
          date: { $gte: startOfDay, $lte: endOfDay },
          deleteFlag: 0,
        });

        if (!type) {
          if (!attendance) {
            type = "IN";
          } else {
            const seen = new Set();
            const punches1 = attendance.punches.filter((punch) => {
              const date = new Date(punch.time?.$date || punch.time);
              const key = `${date.getUTCFullYear()}-${
                date.getUTCMonth() + 1
              }-${date.getUTCDate()} ${date.getUTCHours()}:${date.getUTCMinutes()}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });

            // REASSIGN TYPES

            attendance.punches = punches1;

            if (attendance.punches.length % 2 === 1) {
              // Odd number punch (3rd, 5th, 7th) → OUT
              type = "OUT";
            } else {
              const lastPunch =
                attendance.punches[attendance.punches.length - 1];
              type = "OUT";
              if (lastPunch?.type === "OUT") {
                type = "POSOUT";
                lastPunch.type = "POSIN";
              }
            }
            attendance = await attendance.save();
          }
        }
        let shiftReligiousBreakDuration = 0;
        const weekDay = new Date(checkAttendanceDate).getDay();

        if (religiousBreak > 0 && weekDay === 5) {
          shiftReligiousBreakDuration = shift?.religiousBreakMin;
        }
        if (type === "IN") {
          if (shift === "NA") {
            const record = {
              success: true,
              msg: msg.msgDataNotFound,
              data: { shift: "NA" },
            };
            return res.status(200).json(record);
          }

          if (!attendance) {
            let atMonth = moment(checkAttendanceDate).format("MMYYYY");
            const newAttendance = new Attendance({
              shiftStart: shift?.startTime,
              shiftEnd: shift?.endTime,
              shiftDuration: shift?.totalWorkingDurationInDay,
              shiftBreakDuration: shift?.breakDuration,
              shiftReligiousBreakDuration: shiftReligiousBreakDuration,
              userId: userId,
              uniqueId: uniqueId,
              date: checkAttendanceDate,
              firstIn: punchTimeString,
              firstInStatus: 1,
              punches: [
                {
                  userId: userId,
                  timeString: punchTimeString,
                  time: punchTime,
                  type: type,
                  image: image,
                  address: address,
                  latitude: latitude,
                  longitude: longitude,
                  serialNumber: serialNumber,
                },
              ],
              breakDuration: shift?.breakDuration,
              religiousBreakDuration: shiftReligiousBreakDuration,
              religiousBreakStatus: religiousBreak,
              unitName: unitName,
              atMonth: atMonth,
            });

            const getAttendance = await newAttendance.save();
            return res.status(200).json({
              success: true,
              msg: "Punch In Successfully",
              data: { attendance: getAttendance },
            });
          }
        } else if (type === "OUT") {
          attendance.punches.push({
            userId: userId,
            timeString: punchTimeString,
            time: punchTime,
            type: type,
            image: image,
            address: address,
            latitude: latitude,
            longitude: longitude,
            serialNumber: serialNumber,
          });
          // const seen = new Set();
          const punches = attendance.punches.sort(
            (a, b) =>
              new Date(a.time?.$date || a.time) -
              new Date(b.time?.$date || b.time)
          );
          punches.forEach((punch, index) => {
            if (index === 0) {
              punch.type = "IN";
            } else if (index === 1) {
              punch.type = "OUT";
            } else if (index % 2 === 0) {
              punches[index - 1].type = "POSIN";
              punch.type = "POSOUT";
            } else {
              punch.type = "OUT";
            }
          });

          attendance.punches = punches;
          const firstPunche = punches.length > 0 ? punches[0] : null;
          if (attendance.firstInStatus === 1) {
            attendance.lastOut =
              punches[punches.length - 1]?.timeString || punchTimeString;
            attendance.lastOutStatus = 1;
            //============
            const maxAdjust = 30;
            const religiousBreak =
              Number(attendance.shiftReligiousBreakDuration) || 0;
            const breakStatusFixed =
              shift?.breakStartTime && shift?.breakEndTime ? 1 : 0;

            let shiftBreakStartTime = shift?.breakStartTime;
            let shiftBreakEndTime = shift?.breakEndTime;

            if (breakStatusFixed) {
              const adjust = Math.min(religiousBreak, maxAdjust);
              const extra = Math.max(0, religiousBreak - maxAdjust);

              shiftBreakStartTime = moment(shiftBreakStartTime, "HH:mm")
                .subtract(adjust, "minutes")
                .format("HH:mm");

              shiftBreakEndTime = moment(shiftBreakEndTime, "HH:mm")
                .add(extra, "minutes")
                .format("HH:mm");
            }

            const shiftBreakDuration =
              (Number(shift?.breakDuration) || 0) + religiousBreak;

            //============

            const allPunches = punches.map((punch) => punch.timeString);
            const calculatedAttendance =
              await CommenService.calculateAttendance(
                shiftIsFixed,
                shift?.startTime,
                shift?.endTime,
                shift?.totalWorkingDurationInDay,
                shiftBreakStartTime,
                shiftBreakEndTime,
                shiftBreakDuration,
                allPunches,
                breakStatusFixed,
                crossNight,
                shift?.firstHalfDayStartTime,
                shift?.firstHalfDayEndTime,
                shift?.firstHalfDuration,
                shift?.secHalfDayStartTime,
                shift?.secHalfDayEndTime,
                shift?.secHalfDuration,
                leaveArr
              );

            if (calculatedAttendance !== "NA") {
              if (
                Number(halfDayShortLoginMin) <
                Number(calculatedAttendance.LateBy)
              ) {
                if (
                  Number(shift.firstHalfDuration) >
                  Number(calculatedAttendance.actualWorkingMinutes) +
                    Number(calculatedAttendance.BreakTime)
                ) {
                  const hlfDayLateBy =
                    Number(shift.firstHalfDuration) -
                    (Number(calculatedAttendance.actualWorkingMinutes) +
                      Number(calculatedAttendance.BreakTime));
                  if (Number(halfDayShortLoginMin) > Number(hlfDayLateBy)) {
                    attendance.lateBy = Math.max(0, Number(hlfDayLateBy)); // Assign actual late duration
                    attendance.shortLoginHDStatus = 1; // No half-day status
                    attendance.status = "Present"; // No half-day status
                    attendance.takenBreak = calculatedAttendance.takenBreak;
                    attendance.lateByEarly = Math.max(
                      0,
                      Number(
                        calculatedAttendance.takenBreak >
                          calculatedAttendance.BreakTime
                          ? hlfDayLateBy -
                              calculatedAttendance.takenBreak -
                              calculatedAttendance.BreakTime
                          : hlfDayLateBy
                      )
                    );
                  } else {
                    attendance.lateBy = Number(0); // Assign actual late duration
                    attendance.status = "Absent"; // No half-day status
                    attendance.shortLoginHDStatus = 0; // No half-day status
                    attendance.takenBreak = Number(0);
                    attendance.lateByEarly = Number(0);
                  }
                } else {
                  attendance.lateBy = Number(0); // Assign actual late duration
                  attendance.shortLoginHDStatus = 1; // No half-day status
                  attendance.status = "Present"; // No half-day status
                  attendance.takenBreak = calculatedAttendance.takenBreak;
                  attendance.lateByEarly = Number(0);
                }
              } else {
                attendance.lateBy = Math.max(
                  0,
                  Number(calculatedAttendance.LateBy)
                ); // Assign actual late duration
                attendance.shortLoginHDStatus = 0; // No half-day status
                attendance.status = "Present"; // No half-day status
                attendance.takenBreak = calculatedAttendance.takenBreak;
                attendance.lateByEarly = Math.max(
                  0,
                  Number(calculatedAttendance.lateByEarly)
                );
              }

              const breakDuration = calculatedAttendance.BreakTime;
              attendance.breakDuration = Number(breakDuration);
              attendance.overTime = Number(calculatedAttendance.Overtime);
              attendance.workingHrs = calculatedAttendance.actualWorkingTime;
              attendance.workingMin = Number(
                calculatedAttendance.actualWorkingMinutes
              );
              attendance.totalWorkingHrs = calculatedAttendance.workingTime;
              attendance.totalWorkingMin = Number(
                calculatedAttendance.workingMinutes
              );
            } else {
              attendance.lateBy = 0; // Assign actual late duration
              attendance.shortLoginHDStatus = 0; // No half-day status
              attendance.overTime = 0;
              attendance.workingHrs = 0;
              attendance.workingMin = 0;
              attendance.totalWorkingHrs = 0;
              attendance.totalWorkingMin = 0;
              attendance.takenBreak = 0;
              attendance.lateByEarly = 0;
            }

            const getAttendance = await attendance.save();
            return res.status(200).json({
              success: true,
              msg: "Punch Out successfully",
              data: {
                attendance: getAttendance,
                calculatedAttendance: calculatedAttendance,
              },
            });
          }
        } else if (type === "POSIN") {
          attendance.punches.push({
            userId: userId,
            timeString: punchTimeString,
            time: punchTime,
            type: type,
            image: image,
            address: address,
            latitude: latitude,
            longitude: longitude,
            serialNumber: serialNumber,
          });
          const getAttendance = await attendance.save();
          return res.status(200).json({
            success: true,
            msg: "Punch Push Successfully",
            data: { attendance: getAttendance },
          });
        } else if (type === "POSOUT") {
          attendance.punches.push({
            userId: userId,
            timeString: punchTimeString,
            time: punchTime,
            type: type,
            image: image,
            address: address,
            latitude: latitude,
            longitude: longitude,
            serialNumber: serialNumber,
          });
          const getAttendance = await attendance.save();
          return res.status(200).json({
            success: true,
            msg: "Punch Resume Successfully",
            data: { attendance: getAttendance },
          });
        }
      } catch (error) {
        logger.error("Database error in attendance punch  application", {
          error,
        });
        const record = { success: true, msg: error.message, key: "error" };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in attendance punch  application", {
        error,
        errorm: error.message,
      });
      const record = { success: true, msg: error.message, key: "errors" };
      return res.status(500).json(record);
    }
  },
];
const attendanceDaily = async (req, res) => {
  try {
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const unitIds = req?.CURRENT_USER?.unitId;
    if (!unitIds || unitIds?.length === 0) {
      return res.status(200).json({ success: false, msg: msg.msgUnitNotExist });
    }
    const shiftId = CURRENT_USER?.shiftId;
    const shift = CURRENT_USER?.shiftDetails;
    const shiftIds = [shiftId];
    if (!shiftIds || shiftIds?.length === 0) {
      return res.status(200).json({ success: false, msg: msg.msgUnitNotExist });
    }

    if (!Array.isArray(shiftIds) || !shiftIds || shiftIds?.length === 0) {
      return res
        .status(200)
        .json({ success: false, msg: msg.msgShiftNotExist });
    }

    const currentDate = moment().format("YYYY-MM-DD");
    console.log("currentDate", currentDate);
    const punchTime = moment();

    //const attendance = await CommenService.attendanceDaily(userId, currentDate);
    let checkAttendanceDate = null;
    // Check if the shift crosses midnight
    const shiftStartTime = moment(shift?.startTime, "HH:mm");
    const shiftEndTime = moment(shift?.endTime, "HH:mm");

    const isCrossNightShift = shiftStartTime.isAfter(shiftEndTime);
    const crossNight = isCrossNightShift ? 1 : 0;

    if (isCrossNightShift) {
      const shiftStartHour = shiftStartTime.hour();
      const shiftEndHour = shiftEndTime.hour();
      if (punchTime.hour() < shiftEndHour + 5) {
        checkAttendanceDate = moment(currentDate)
          .subtract(1, "day")
          .format("YYYY-MM-DD");
      } else {
        checkAttendanceDate = currentDate;
      }
    } else {
      checkAttendanceDate = currentDate;
    }
    const startOfDay = new Date(checkAttendanceDate + "T00:00:00.000Z");
    const endOfDay = new Date(checkAttendanceDate + "T23:59:59.999Z");
    const attendance = await CommenService.attendanceByDateRange(
      SITE_DB_NAME,
      CURRENT_USER_ID,
      startOfDay,
      endOfDay
    );
    // const attendance = await Attendance.findOne({
    //   userId,
    //   date: { $gte: startOfDay, $lte: endOfDay },
    //   deleteFlag: 0,
    // });

    return res.status(200).json({
      success: true,
      msg: ["data found"],
      data: { attendance: attendance },
    });
  } catch (error) {
    logger.error("Database error in attendanceDaily application", {
      error: error.message,
    });
    const record = { success: true, msg: error.message, key: "error" };
    return res.status(500).json(record);
  }
};
// ===================================================== self function
const attendancePunchRegularization = async (SITE_DB_NAME, data) => {
  const Attendance = await AttendanceModel(SITE_DB_NAME);
  const { userId } = data;
  const punchDate = data?.time;
  if (!punchDate) {
    return { success: false, msg: msg.msgDateReqired };
  } else if (!userId) {
    return { success: false, msg: msg.msgUserNotExist };
  } else {
    function splitCode(str) {
      const match = str.match(/^([a-zA-Z]+)(\d+)$/);
      if (match) {
        return {
          prefix: match[1], // Characters
          number: match[2], // Numbers
        };
      }
      return { prefix: null, number: null }; // Invalid format
    }

    try {
      const checkUser = await CommenService.checkUser(SITE_DB_NAME, userId);
      const userDetails = await CommenService.getUserDetails(
        SITE_DB_NAME,
        checkUser._id
      );

      let type = null;
      let image = data?.image || "";
      let latitude = data?.latitude || "";
      let longitude = data?.longitude || "";
      let address = data?.address || "";
      const leaveArr = [];
      const uniqueId = userDetails?.uniqueId;
      const religiousBreak = userDetails?.religiousBreak || 0;
      const unitIds = userDetails?.unitId;
      const shift = userDetails?.shiftDetails || null;
      const unitName = splitCode(uniqueId).prefix || "";
      const shiftIsFixed = userDetails?.shiftDetails?.shiftIsFixed || 0;
      const halfDayShortLoginMin =
        userDetails?.shiftDetails?.halfDayShortLoginMin || 0;
      if (!unitIds || unitIds?.length === 0) {
        return { success: false, msg: msg.msgUnitNotExist };
      }
      const shiftId = userDetails?.shiftId;
      const shiftIds = [shiftId];
      if (!shiftIds || shiftIds?.length === 0) {
        return { success: false, msg: msg.msgUnitNotExist };
      }

      if (!Array.isArray(shiftIds) || !shiftIds || shiftIds?.length === 0) {
        return { success: false, msg: msg.msgShiftNotExist };
      }

      const punchDateInput = data?.time;
      // Check if punchDate is provided; if not, use the current date
      const currentDate = punchDateInput
        ? moment(punchDateInput).format("YYYY-MM-DD")
        : moment().format("YYYY-MM-DD");
      const punchTime = punchDateInput ? moment(punchDateInput) : moment();

      const punchTimeString = punchTime.format("HH:mm");

      let checkAttendanceDate = null;
      // Check if the shift crosses midnight
      const shiftStartTime = moment(shift?.startTime, "HH:mm");
      const shiftEndTime = moment(shift?.endTime, "HH:mm");

      const isCrossNightShift = shiftStartTime.isAfter(shiftEndTime);
      const crossNight = isCrossNightShift ? 1 : 0;

      // Determine Attendance Date (Same day or Previous day)

      if (isCrossNightShift) {
        // If punch-out is after midnight, assign it to previous day
        const shiftStartHour = shiftStartTime.hour();
        const shiftEndHour = shiftEndTime.hour();
        if (punchTime.hour() < shiftEndHour + 5) {
          //console.log("night shift", checkAttendanceDate);
          checkAttendanceDate = moment(currentDate)
            .subtract(1, "day")
            .format("YYYY-MM-DD");
        } else {
          checkAttendanceDate = currentDate;
          ///console.log("night shift but day same", checkAttendanceDate);
        }
      } else {
        checkAttendanceDate = currentDate;
        // console.log("day shift", checkAttendanceDate);
      }

      try {
        const attendance = await Attendance.findOne({
          userId,
          date: checkAttendanceDate,
          deleteFlag: 0,
        });
        if (!type) {
          if (!attendance) {
            type = "IN";
          } else {
            const lastPunch = attendance.punches[attendance.punches.length - 1];
            type = "OUT";
            if (lastPunch.type === "OUT") {
              lastPunch.type = "POSIN";
              await attendance.save();
              type = "POSOUT";
            }
          }
        }
        let shiftReligiousBreakDuration = 0;
        const weekDay = new Date(checkAttendanceDate).getDay();

        if (religiousBreak > 0 && weekDay === 5) {
          shiftReligiousBreakDuration = shift?.religiousBreakMin;
        }
        if (type === "IN") {
          if (shift === "NA") {
            const record = {
              success: true,
              msg: msg.msgDataNotFound,
              data: { shift: "NA" },
            };
            return record;
          }

          if (!attendance) {
            let atMonth = moment(checkAttendanceDate).format("MMYYYY");
            const newAttendance = new Attendance({
              shiftStart: shift?.startTime,
              shiftEnd: shift?.endTime,
              shiftDuration: shift?.totalWorkingDurationInDay,
              shiftBreakDuration: shift?.breakDuration,
              shiftReligiousBreakDuration: shiftReligiousBreakDuration,
              userId: userId,
              uniqueId: uniqueId,
              date: checkAttendanceDate,
              firstIn: punchTimeString,
              firstInStatus: 1,
              punches: [
                {
                  userId: userId,
                  timeString: punchTimeString,
                  time: punchTime,
                  type: type,
                  image: image,
                  address: address,
                  latitude: latitude,
                  longitude: longitude,
                },
              ],
              breakDuration: shift?.breakDuration,
              religiousBreakDuration: shiftReligiousBreakDuration,
              religiousBreakStatus: religiousBreak,
              atMonth: atMonth,
              unitName: unitName,
            });

            const getAttendance = await newAttendance.save();
            return {
              success: true,
              msg: "Punch In Successfully",
              data: { attendance: getAttendance },
            };
          }
        } else if (type === "OUT") {
          attendance.punches.push({
            userId: userId,
            timeString: punchTimeString,
            time: punchTime,
            type: type,
            image: image,
            address: address,
            latitude: latitude,
            longitude: longitude,
          });
          const punches = attendance.punches;
          const firstPunche = punches.length > 0 ? punches[0] : null;
          if (attendance.firstInStatus === 1) {
            attendance.lastOut = punchTimeString;
            attendance.lastOutStatus = 1;
            //============
            const maxAdjust = 30;
            const religiousBreak =
              Number(attendance.shiftReligiousBreakDuration) || 0;
            const breakStatusFixed =
              shift?.breakStartTime && shift?.breakEndTime ? 1 : 0;

            let shiftBreakStartTime = shift?.breakStartTime;
            let shiftBreakEndTime = shift?.breakEndTime;

            if (breakStatusFixed) {
              const adjust = Math.min(religiousBreak, maxAdjust);
              const extra = Math.max(0, religiousBreak - maxAdjust);

              shiftBreakStartTime = moment(shiftBreakStartTime, "HH:mm")
                .subtract(adjust, "minutes")
                .format("HH:mm");

              shiftBreakEndTime = moment(shiftBreakEndTime, "HH:mm")
                .add(extra, "minutes")
                .format("HH:mm");
            }

            const shiftBreakDuration =
              (Number(shift?.breakDuration) || 0) + religiousBreak;

            //============

            // const shiftBreakDuration = Number(shift?.breakDuration) + Number(attendance.shiftReligiousBreakDuration);
            // const breakStatusFixed = !shift?.breakStartTime || !shift?.breakEndTime ? 0 : 1;
            // const shiftBreakStartTime = breakStatusFixed ? moment(shift?.breakStartTime, "HH:mm").subtract(attendance.shiftReligiousBreakDuration, "minutes").format("HH:mm") : "";
            // // const shiftBreakEndTime = breakStatusFixed ? moment(shift?.breakEndTime, "HH:mm").add(attendance.shiftReligiousBreakDuration, "minutes").format("HH:mm") : "";
            // const shiftBreakEndTime = shift?.breakEndTime;

            const allPunches = punches.map((punch) => punch.timeString);
            const calculatedAttendance =
              await CommenService.calculateAttendance(
                shiftIsFixed,
                shift?.startTime,
                shift?.endTime,
                shift?.totalWorkingDurationInDay,
                shiftBreakStartTime,
                shiftBreakEndTime,
                shiftBreakDuration,
                allPunches,
                breakStatusFixed,
                crossNight,
                shift?.firstHalfDayStartTime,
                shift?.firstHalfDayEndTime,
                shift?.firstHalfDuration,
                shift?.secHalfDayStartTime,
                shift?.secHalfDayEndTime,
                shift?.secHalfDuration,
                leaveArr
              );
            if (calculatedAttendance !== "NA") {
              if (
                Number(halfDayShortLoginMin) <
                Number(calculatedAttendance.LateBy)
              ) {
                if (
                  Number(shift.firstHalfDuration) >
                  Number(calculatedAttendance.actualWorkingMinutes) +
                    Number(calculatedAttendance.BreakTime)
                ) {
                  const hlfDayLateBy =
                    Number(shift.firstHalfDuration) -
                    (Number(calculatedAttendance.actualWorkingMinutes) +
                      Number(calculatedAttendance.BreakTime));

                  if (Number(halfDayShortLoginMin) > Number(hlfDayLateBy)) {
                    attendance.lateBy = Math.max(0, Number(hlfDayLateBy)); // Assign actual late duration
                    attendance.shortLoginHDStatus = 1; //  half-day status
                    attendance.status = "Present"; // No half-day status
                    attendance.takenBreak = calculatedAttendance.takenBreak;
                    attendance.lateByEarly = Math.max(
                      0,
                      Number(
                        calculatedAttendance.takenBreak >
                          calculatedAttendance.BreakTime
                          ? hlfDayLateBy -
                              calculatedAttendance.takenBreak -
                              calculatedAttendance.BreakTime
                          : hlfDayLateBy
                      )
                    );
                  } else {
                    attendance.lateBy = Math.max(0, Number(0)); // Assign actual late duration
                    attendance.status = "Absent"; // full-day status
                    attendance.shortLoginHDStatus = 0; //  half-day status
                    attendance.takenBreak = Number(0);
                    attendance.lateByEarly = Number(0);
                  }
                } else {
                  attendance.status = "Present"; // No half-day status
                  attendance.lateBy = Number(0); // Assign actual late duration
                  attendance.shortLoginHDStatus = 1; //  half-day status
                  attendance.takenBreak = calculatedAttendance.takenBreak;
                  attendance.lateByEarly = Number(0);
                }
              } else {
                attendance.status = "Present"; // No half-day status
                attendance.lateBy = Math.max(
                  0,
                  Number(calculatedAttendance.LateBy)
                ); // Assign actual late duration
                attendance.shortLoginHDStatus = 0; // No half-day status
                attendance.takenBreak = calculatedAttendance.takenBreak;
                attendance.lateByEarly = Math.max(
                  0,
                  Number(calculatedAttendance.lateByEarly)
                );
              }
              // const LateBy = breakStatusFixed ? calculatedAttendance.LateBy : calculatedAttendance.LateBy - calculatedAttendance.BreakTime;
              // if (LateBy > halfDayShortLoginMin && halfDayShortLoginMin > 0) {
              //   attendance.lateBy =
              //     calculatedAttendance.actualWorkingMinutes + calculatedAttendance.BreakTime > shift.firstHalfDuration
              //       ? 0
              //       : Number(shift.firstHalfDuration - calculatedAttendance.actualWorkingMinutes + calculatedAttendance.BreakTime); // Ignore late time if short login is more than 2 hours
              //   attendance.shortLoginHDStatus = 1; // Mark it as half-day due to short login
              // } else {
              //   attendance.lateBy = Number(LateBy); // Assign actual late duration
              //   attendance.shortLoginHDStatus = 0; // No half-day status
              // }
              const breakDuration = calculatedAttendance.BreakTime;
              attendance.breakDuration = Number(breakDuration);
              attendance.overTime = Number(calculatedAttendance.Overtime);
              attendance.workingHrs = calculatedAttendance.actualWorkingTime;
              attendance.workingMin = Number(
                calculatedAttendance.actualWorkingMinutes
              );
              attendance.totalWorkingHrs = calculatedAttendance.workingTime;
              attendance.totalWorkingMin = Number(
                calculatedAttendance.workingMinutes
              );
            } else {
              attendance.lateBy = 0; // Assign actual late duration
              attendance.shortLoginHDStatus = 0; // No half-day status
              attendance.overTime = 0;
              attendance.workingHrs = 0;
              attendance.workingMin = 0;
              attendance.totalWorkingHrs = 0;
              attendance.totalWorkingMin = 0;
              attendance.takenBreak = 0;
              attendance.lateByEarly = 0;
            }

            const getAttendance = await attendance.save();
            return {
              success: true,
              msg: "Punch Out successfully",
              data: {
                attendance: getAttendance,
                calculatedAttendance: calculatedAttendance,
              },
            };
          }
        } else if (type === "POSIN") {
          attendance.punches.push({
            userId: userId,
            timeString: punchTimeString,
            time: punchTime,
            type: type,
            image: image,
            address: address,
            latitude: latitude,
            longitude: longitude,
          });
          const getAttendance = await attendance.save();
          return {
            success: true,
            msg: "Punch Push Successfully",
            data: { attendance: getAttendance },
          };
        } else if (type === "POSOUT") {
          attendance.punches.push({
            userId: userId,
            timeString: punchTimeString,
            time: punchTime,
            type: type,
            image: image,
            address: address,
            latitude: latitude,
            longitude: longitude,
          });
          const getAttendance = await attendance.save();
          return {
            success: true,
            msg: "Punch Resume Successfully",
            data: { attendance: getAttendance },
          };
        }
      } catch (error) {
        logger.error("Database error in attendance punch reg application 1", {
          error,
          msg: error.message,
        });
        const record = { success: true, msg: error.message, key: "error" };
        return record;
      }
    } catch (error) {
      logger.error("Database error in attendance punch  reg application 2", {
        error,
        msg: error.message,
      });
      const record = { success: true, msg: error.message, key: "errors" };
      return record;
    }
  }
};
const myattendance = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  query("monthYear")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag, monthYear } = req.query;
    const [year, month] = monthYear.split("-").map(Number);
    const monthDay = new Date(year, month, 0).getDate();
    try {
      let userId,
        unitIds,
        uniqueId,
        religiousBreak,
        joiningDate,
        holidays,
        shift,
        shiftId,
        name,
        monthlyExtraFreeMin,
        relievingDate,
        image,
        monthlyExtraWorkingDays,
        weekEnds,
        weekWorkingDays;

      if ("userId" in req.query && req.query.userId) {
        let userIdReq = req?.query?.userId;
        const checkUser = await CommenService.checkUser(
          SITE_DB_NAME,
          userIdReq
        );
        if (checkUser === "NA") {
          userId = 0;
        }
        userId = checkUser._id;
        const userDetails = await CommenService.getUserDetails(
          SITE_DB_NAME,
          checkUser._id
        );

        unitIds = userDetails?.unitId;
        name = userDetails?.name;
        uniqueId = userDetails?.uniqueId;
        image = userDetails?.image;
        religiousBreak = userDetails?.religiousBreak;
        joiningDate = userDetails?.joiningDate;
        holidays = userDetails?.holidays || [];
        shift = userDetails?.shiftDetails || null;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        weekWorkingDays = shift?.weekWorkingDays || [];
        shiftId = userDetails?.shiftId;
        relievingDate = userDetails?.relievingDate;
        monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin;
      } else {
        userId = CURRENT_USER_ID;
        unitIds = CURRENT_USER?.unitId;
        uniqueId = CURRENT_USER?.uniqueId;
        name = CURRENT_USER?.name;
        image = CURRENT_USER?.image;
        religiousBreak = CURRENT_USER?.religiousBreak;
        joiningDate = CURRENT_USER?.joiningDate;
        holidays = CURRENT_USER?.holidays || [];
        shift = CURRENT_USER?.shiftDetails || null;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        weekWorkingDays = shift?.weekWorkingDays || [];
        shiftId = CURRENT_USER?.shiftId;
        relievingDate = CURRENT_USER?.relievingDate;
        monthlyExtraFreeMin = CURRENT_USER?.shiftDetails?.monthlyExtraFreeMin;
      }

      if (!unitIds || unitIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist, attendances: [] });
      }

      const shiftIds = [shiftId];
      if (!shiftIds || shiftIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist });
      }
      if (!shift) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgShiftNotExist });
      }
      if (!Array.isArray(shiftIds) || !shiftIds || shiftIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgShiftNotExist });
      }

      const promises = Array.from({ length: monthDay }, async (_, index) => {
        const day = monthDay - index;
        const currentDate = new Date().toISOString().split("T")[0];

        const attendanceDate = `${monthYear}-${String(day).padStart(2, "0")}`;
        const weekDay = new Date(attendanceDate).getDay();
        if (
          new Date(currentDate) < new Date(attendanceDate) ||
          new Date(joiningDate) > new Date(attendanceDate)
        ) {
          return null;
        }
        if (relievingDate) {
          if (
            new Date(relievingDate.toISOString().split("T")[0]) <
            new Date(attendanceDate)
          ) {
            return null;
          }
        }
        const leave = await CommenService.leaveByDate(
          SITE_DB_NAME,
          userId,
          attendanceDate
        );
        const compoff = await CommenService.compoffByDate(
          SITE_DB_NAME,
          userId,
          attendanceDate
        );
        const regularization = await CommenService.regularizationByDate(
          SITE_DB_NAME,
          userId,
          attendanceDate
        );

        const attendance = await CommenService.attendanceByDate(
          SITE_DB_NAME,
          userId,
          attendanceDate
        );
        let shiftReligiousBreakDuration = 0;
        if (religiousBreak > 0 && weekDay === 5) {
          shiftReligiousBreakDuration = shift?.religiousBreakMin;
        }

        if (!attendance) {
          let status = "Absent";

          const holidayStatus = holidays.find((holiday) => {
            const holidayDate = new Date(holiday.date)
              .toISOString()
              .split("T")[0];
            return holidayDate === attendanceDate;
          });
          // If it's Saturday or Sunday
          let dayName = moment(attendanceDate, "YYYY-MM-DD").format("dddd");
          let weekNumber = Math.ceil(day / 7);

          let isExtraWorkingDay = monthlyExtraWorkingDays.includes(
            `${weekNumber}${dayName}`
          );
          if (!holidayStatus && weekEnds.includes(dayName)) {
            status = "Weekend";
            if (isExtraWorkingDay) {
              status = "Absent";
            }
            const weekWorkingDates = getWeekDatesByNames(
              attendanceDate,
              weekWorkingDays
            );
            // const weekAttendancesStatus = await Attendance.find({
            //   userId: userId,
            //   date: { $in: weekWorkingDates },
            //   status: { $in: ["Present"] },
            // });
            const weekAttendancesStatus =
              await CommenService.getWeekAttendancesStatus(
                SITE_DB_NAME,
                userId,
                weekWorkingDates
              );
            const weekHolidays = holidays.some((holiday) => {
              const holidayDate = new Date(holiday.date)
                .toISOString()
                .split("T")[0];
              return weekWorkingDates.includes(holidayDate);
            });
            if (weekAttendancesStatus.length === 0 && !weekHolidays) {
              status = "Absent";
            }
          }
          // If it's Holiday
          else if (holidayStatus && !weekEnds.includes(dayName)) {
            status = "Holiday";
          } else if (holidayStatus && weekEnds.includes(dayName)) {
            status = `Holiday (Weekend)`;
          }

          return {
            userId: userId,
            uniqueId: uniqueId,
            name: name,
            image: image,
            shiftId: shiftId,
            shiftStart: shift?.startTime,
            shiftEnd: shift?.endTime,
            shiftDuration: shift?.totalWorkingDurationInDay,
            shiftBreakDuration: shift?.breakDuration,
            shiftReligiousBreakDuration: shiftReligiousBreakDuration,
            date: new Date(attendanceDate),
            punches: [],
            firstIn: null,
            firstInStatus: 0,
            lastOut: null,
            lastOutStatus: 0,
            workingHrs: "00:00",
            workingMin: 0,
            totalWorkingHrs: "00:00",
            totalWorkingMin: 0,
            breakDuration: 0,
            lateBy: 0,
            overTime: 0,
            status: status,
            presentStatus: "No",
            leaveStatus: "No",
            leaveType: "No",
            activeFlag: 1,
            shortLoginHDStatus: 0,
            religiousBreakDuration: shiftReligiousBreakDuration,
            religiousBreakStatus: religiousBreak,
            deleteFlag: deleteFlag || 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            takenBreak: 0,
            lateByEarly: 0,
            statusCompoff: "Absent",
            leave: leave,
            compoff: compoff,
            regularization: regularization,
            lateByEarly: 0,
            takenBreak: 0,
          };
        } else {
          let statusCompoff = "Present";
          const holidayStatus = holidays.find((holiday) => {
            const holidayDate = new Date(holiday.date)
              .toISOString()
              .split("T")[0];
            return holidayDate === attendanceDate;
          });
          // If it's Saturday or Sunday
          let dayName = moment(attendanceDate, "YYYY-MM-DD").format("dddd");
          let weekNumber = Math.ceil(day / 7);

          let isExtraWorkingDay = monthlyExtraWorkingDays.includes(
            `${weekNumber}${dayName}`
          );
          if (!holidayStatus && weekEnds.includes(dayName)) {
            statusCompoff = "Weekend";
          }
          // If it's Holiday
          else if (holidayStatus && !weekEnds.includes(dayName)) {
            statusCompoff = "Holiday";
          } else if (holidayStatus && weekEnds.includes(dayName)) {
            statusCompoff = `Holiday (Weekend)`;
          } else if (
            attendance.totalWorkingMin >=
            attendance.shiftDuration + attendance.shiftDuration / 2
          ) {
            statusCompoff = `Extra-Hours`;
          }
          attendance.statusCompoff = statusCompoff;
          attendance.leave = leave;
          attendance.compoff = compoff;
          attendance.regularization = regularization;
          return attendance;
        }
      });

      // Wait for all days to be processed
      const attendances = await Promise.all(promises);
      return res.status(200).json({
        success: true,
        msg: ["data found"],
        data: {
          attendances: attendances.filter((item) => item !== null),
          name,
          uniqueId,
          monthlyExtraFreeMin,
        },
      });
    } catch (error) {
      logger.error("Database error in attendances application", { error });
      const record = { success: true, msg: error.message, key: "error" };
      return res.status(500).json(record);
    }
  },
];

async function isUserActiveInMonth(user, monthYear) {
  const startOfMonth = new Date(`${monthYear}-01`);
  const endOfMonth = new Date(startOfMonth);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);

  const today = new Date();

  const joining = new Date(user.joiningDate);
  const relieving = user.relievingDate ? new Date(user.relievingDate) : null;

  const joiningOk = joining <= endOfMonth && joining <= today;

  const relievingOk = !relieving || relieving >= startOfMonth;
  return joiningOk && relievingOk;
}

const attendances = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  query("dayMonthYear")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  query("monthDay")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag, dayMonthYear, monthDay, pageSize, pageNumber } =
      req.query;

    if (!CURRENT_USER) {
      return res.status(200).json({
        success: false,
        msg: msg.msgUnitNotExist,
        attendances: [],
        attendanceCounts: {
          totalUser: 0,
          totalPresentUser: 0,
          totalAbsentUser: 0,
          totalNumberOfShortloginUser: 0,
          totalHalfDayUser: 0,
        },
      });
    }
    const userIdCurrent = CURRENT_USER_ID;
    const roleNameCurrent = CURRENT_USER?.roleName;
    let unitIdsCurrent = CURRENT_USER?.unitId;

    const unitId = req?.query?.unitId || "";

    if (unitId && unitId !== "all") {
      const checkUnitId = await CommenService.checkUnit(SITE_DB_NAME, unitId);
      unitIdsCurrent = [checkUnitId];
    }
    try {
      const getUser = await CommenService.getUser(
        SITE_DB_NAME,
        userIdCurrent,
        roleNameCurrent,
        unitIdsCurrent
      );
      if (getUser === "NA") {
        return res.status(200).json({
          success: false,
          msg: msg.msgUserNotExist,
          attendances: [],
          attendanceCounts: {
            totalUser: 0,
            totalPresentUser: 0,
            totalAbsentUser: 0,
            totalNumberOfShortloginUser: 0,
            totalHalfDayUser: 0,
          },
        });
      }
      try {
        const userChecks = await Promise.all(
          getUser.map(async (user) => ({
            user,
            isActive: await isUserActiveInMonth(
              user,
              moment(dayMonthYear, "YYYY-MM-DD").format("YYYY-MM")
            ),
          }))
        );

        const filterUser = userChecks
          .filter((check) => check.isActive)
          .map((check) => check.user);

        const promises = Array.from(
          {
            length: filterUser.length,
          },
          async (_, index) => {
            let userId,
              unitIds,
              uniqueId,
              religiousBreak,
              joiningDate,
              holidays,
              shift,
              shiftId,
              name,
              monthlyExtraFreeMin,
              relievingDate,
              image,
              monthlyExtraWorkingDays,
              weekEnds,
              designationName,
              weekWorkingDays;
            userId = filterUser[index]._id;

            const userDetails = await CommenService.getUserDetails(
              SITE_DB_NAME,
              userId
            );

            if (userDetails !== "NA") {
              userId = userDetails?.userId;
              unitIds = userDetails?.unitId;
              name = userDetails?.name;
              image = userDetails?.image;
              uniqueId = userDetails?.uniqueId;
              religiousBreak = userDetails?.religiousBreak;
              joiningDate = userDetails?.joiningDate;
              holidays = userDetails?.holidays || [];
              shift = userDetails?.shiftDetails || null;
              monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
              weekEnds = shift?.weekEnds || [];
              shiftId = userDetails?.shiftId;
              relievingDate = userDetails?.relievingDate;
              monthlyExtraFreeMin =
                userDetails?.shiftDetails?.monthlyExtraFreeMin;
              designationName = userDetails?.designationName;
              weekWorkingDays = shift?.weekWorkingDays || [];
            }

            if (!unitIds || unitIds?.length === 0) {
              return null;
            }
            const shiftIds = [shiftId];
            if (!shiftIds || shiftIds?.length === 0) {
              return null;
            }
            if (!shift) {
              return null;
            }
            if (
              !Array.isArray(shiftIds) ||
              !shiftIds ||
              shiftIds?.length === 0
            ) {
              return null;
            }

            const currentDate = new Date().toISOString().split("T")[0];

            const attendanceDate = dayMonthYear;
            const day = moment(attendanceDate, "YYYY-MM-DD").format("DD");

            const weekDay = new Date(attendanceDate).getDay();
            if (
              new Date(currentDate) < new Date(attendanceDate) ||
              new Date(joiningDate) > new Date(attendanceDate)
            ) {
              return null;
            }
            if (relievingDate) {
              if (
                new Date(relievingDate.toISOString().split("T")[0]) <
                new Date(attendanceDate)
              ) {
                return null;
              }
            }

            const attendance = await CommenService.attendanceByDate(
              SITE_DB_NAME,
              userId,
              attendanceDate
            );

            let shiftReligiousBreakDuration = 0;
            if (religiousBreak > 0) {
              shiftReligiousBreakDuration = shift?.religiousBreakMin;
            }

            if (!attendance) {
              let status = "Absent";

              const holidayStatus = holidays.find((holiday) => {
                const holidayDate = new Date(holiday.date)
                  .toISOString()
                  .split("T")[0];
                return holidayDate === attendanceDate;
              });
              // If it's Saturday or Sunday
              let dayName = moment(attendanceDate, "YYYY-MM-DD").format("dddd");
              let weekNumber = Math.ceil(day / 7);

              let isExtraWorkingDay = monthlyExtraWorkingDays.includes(
                `${weekNumber}${dayName}`
              );
              if (!holidayStatus && weekEnds.includes(dayName)) {
                status = "Weekend";
                if (isExtraWorkingDay) {
                  status = "Absent";
                }
                const weekWorkingDates = getWeekDatesByNames(
                  attendanceDate,
                  weekWorkingDays
                );
                // const weekAttendancesStatus = await Attendance.find({
                //   userId: userId,
                //   date: { $in: weekWorkingDates },
                //   status: { $in: ["Present"] },
                // });
                const weekAttendancesStatus =
                  await CommenService.getWeekAttendancesStatus(
                    SITE_DB_NAME,
                    userId,
                    weekWorkingDates
                  );

                const weekHolidays = holidays.some((holiday) => {
                  const holidayDate = new Date(holiday.date)
                    .toISOString()
                    .split("T")[0];
                  return weekWorkingDates.includes(holidayDate);
                });
                if (weekAttendancesStatus.length === 0 && !weekHolidays) {
                  status = "Absent";
                }
              }
              // If it's Holiday
              else if (holidayStatus && !weekEnds.includes(dayName)) {
                status = "Holiday";
              } else if (holidayStatus && weekEnds.includes(dayName)) {
                status = `Holiday (Weekend)`;
              }

              return {
                _id: userId + uniqueId,
                userId: userId,
                unitIds: unitIds,
                uniqueId: uniqueId,
                name: name,
                image: image,
                shiftId: shiftId,
                shiftStart: shift?.startTime,
                shiftEnd: shift?.endTime,
                shiftBreakDuration: shift?.breakDuration,
                shiftReligiousBreakDuration: shiftReligiousBreakDuration,
                date: new Date(attendanceDate),
                punches: [],
                firstIn: null,
                firstInStatus: 0,
                lastOut: null,
                lastOutStatus: 0,
                workingHrs: "00:00",
                workingMin: 0,
                totalWorkingHrs: "00:00",
                totalWorkingMin: 0,
                breakDuration: 0,
                lateBy: 0,
                overTime: 0,
                status: status,
                presentStatus: "No",
                leaveStatus: "No",
                leaveType: "No",
                activeFlag: 1,
                shortLoginHDStatus: 0,
                religiousBreakDuration: shiftReligiousBreakDuration,
                religiousBreakStatus: religiousBreak,
                designationName: designationName,
                deleteFlag: deleteFlag || 0,
                createdAt: new Date(),
                updatedAt: new Date(),
                statusCompoff: "Absent",
                lateByEarly: 0,
                takenBreak: 0,
              };
            } else {
              let statusCompoff = "Present";
              const holidayStatus = holidays.find((holiday) => {
                const holidayDate = new Date(holiday.date)
                  .toISOString()
                  .split("T")[0];
                return holidayDate === attendanceDate;
              });
              // If it's Saturday or Sunday
              let dayName = moment(attendanceDate, "YYYY-MM-DD").format("dddd");
              let weekNumber = Math.ceil(day / 7);

              let isExtraWorkingDay = monthlyExtraWorkingDays.includes(
                `${weekNumber}${dayName}`
              );
              if (!holidayStatus && weekEnds.includes(dayName)) {
                statusCompoff = "Weekend";
              }
              // If it's Holiday
              else if (holidayStatus && !weekEnds.includes(dayName)) {
                statusCompoff = "Holiday";
              } else if (holidayStatus && weekEnds.includes(dayName)) {
                statusCompoff = `Holiday (Weekend)`;
              } else if (
                attendance.totalWorkingMin >=
                attendance.shiftDuration + attendance.shiftDuration / 2
              ) {
                statusCompoff = `Extra-Hours`;
              }
              attendance.statusCompoff = statusCompoff;
              return attendance;
            }
          }
        );

        const attendancesResult = (await Promise.all(promises)).filter(
          (x) => x !== null
        );
        let size = parseInt(pageSize);
        let page = parseInt(pageNumber);

        let isPagination = false;

        if (!isNaN(size) && !isNaN(page) && size > 0 && page > 0) {
          isPagination = true;
        }
        const totalRecords = attendancesResult.length;
        const skip = (pageNumber - 1) * pageSize;
        const paginatedAttendances = isPagination
          ? attendancesResult.slice(skip, skip + Number(pageSize))
          : attendancesResult;

        const totalUser = filterUser.length;
        const totalPresentUser = attendancesResult.filter(
          (a) => a.status === "Present"
        ).length;
        const totalAbsentUser = attendancesResult.filter(
          (a) => a.status === "Absent"
        ).length;
        const totalNumberOfShortloginUser = attendancesResult.filter(
          (a) => a.shortLoginHDStatus === 1
        ).length;
        const totalHalfDayUser = attendancesResult.filter(
          (a) => a.leaveType === "Half-Day"
        ).length;

        const attendanceCounts = {
          totalUser,
          totalPresentUser,
          totalAbsentUser,
          totalNumberOfShortloginUser,
          totalHalfDayUser,
        };

        return res.status(200).json({
          success: true,
          msg: ["data found"],
          data: {
            attendanceCounts,
            totalRecords,
            attendances: paginatedAttendances,
          },
        });
      } catch (error) {
        logger.error("Database error in attendances application", {
          error: error.message,
          key: 1,
        });
        const record = { success: true, msg: error.message, key: "error" };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in attendances application", {
        error: error.message,
        key: 2,
      });
      const record = { success: true, msg: error.message, key: "error" };
      return res.status(500).json(record);
    }
  },
];

//====================================== leave ===========================
const leaveApply = [
  //  validation
  body("leaveDates")
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("reason")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("dayType")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("selectedleaveType")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      let { leaveDates, reason, dayType, selectedleaveType } = req.body;

      leaveDates = leaveDates
        ? Array.isArray(leaveDates)
          ? leaveDates
          : [leaveDates]
        : [];
      let userId,
        roleName,
        unitIds,
        uniqueId,
        religiousBreak,
        joiningDate,
        holidays,
        shift,
        shiftId,
        name,
        monthlyExtraFreeMin,
        relievingDate,
        image,
        monthlyExtraWorkingDays,
        weekEnds,
        plannedLeaveApplyBeforeDays,
        reportingManager,
        sickLeaveDocumentDay;
      let paidLeaveCount = 0;
      let paternityLeaveCount = 0;
      let maternityLeaveCount = 0;

      let documents = [];

      if (!req.file) {
        documents = req?.files.map((file) => file?.key);
      } else if ("key" in req.file) {
        const filename = req.file.key;
        documents = filename;
      }

      if ("userId" in req.body && req.body.userId) {
        let userIdReq = req?.body?.userId;
        const checkUser = await CommenService.checkUser(
          SITE_DB_NAME,
          userIdReq
        );
        if (checkUser === "NA") {
          userId = 0;
        } else {
          userId = checkUser._id;
          const userDetails = await CommenService.getUserDetails(
            SITE_DB_NAME,
            checkUser._id
          );
          roleName = userDetails?.roleName;
          reportingManager = userDetails?.reportingManagerId;
          unitIds = userDetails?.unitId;
          name = userDetails?.name;
          uniqueId = userDetails?.uniqueId;
          image = userDetails?.image;
          religiousBreak = userDetails?.religiousBreak;
          joiningDate = userDetails?.joiningDate;
          holidays = userDetails?.holidays || [];
          shift = userDetails?.shiftDetails || null;
          monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
          plannedLeaveApplyBeforeDays = shift?.plannedLeaveApplyBeforeDays || 7;
          sickLeaveDocumentDay = shift?.sickLeaveDocumentDay || 2;
          weekEnds = shift?.weekEnds || [];
          shiftId = userDetails?.shiftId;
          relievingDate = userDetails?.relievingDate;
          monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin;
          paidLeaveCount = userDetails?.paidLeaveCount;
          paternityLeaveCount = userDetails?.paternityLeaveCount;
          maternityLeaveCount = userDetails?.maternityLeaveCount;
        }
      } else {
        userId = CURRENT_USER_ID;
        roleName = CURRENT_USER?.roleName;
        reportingManager = CURRENT_USER?.reportingManagerId;
        unitIds = CURRENT_USER?.unitId;
        uniqueId = CURRENT_USER?.uniqueId;
        name = CURRENT_USER?.name;
        image = CURRENT_USER?.image;
        religiousBreak = CURRENT_USER?.religiousBreak;
        joiningDate = CURRENT_USER?.joiningDate;
        holidays = CURRENT_USER?.holidays || [];
        shift = CURRENT_USER?.shiftDetails || null;
        plannedLeaveApplyBeforeDays = shift?.plannedLeaveApplyBeforeDays || 7;
        sickLeaveDocumentDay = shift?.sickLeaveDocumentDay || 2;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = CURRENT_USER?.shiftId;
        relievingDate = CURRENT_USER?.relievingDate;
        monthlyExtraFreeMin = CURRENT_USER?.shiftDetails?.monthlyExtraFreeMin;
        paidLeaveCount = CURRENT_USER?.paidLeaveCount;
        paternityLeaveCount = CURRENT_USER?.paternityLeaveCount;
        maternityLeaveCount = CURRENT_USER?.maternityLeaveCount;
      }
      if (!unitIds || unitIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist });
      }
      if (!leaveDates || leaveDates?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgDateReqired });
      }
      if (!userId) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUserNotExist });
      }

      let paidLeaveCountInsert = 0;
      let paternityLeaveCountInsert = 0;
      let maternityLeaveCountInsert = 0;
      let paidLeaveCountInsertMultiple = 0;
      let paternityLeaveCountInsertMultiple = 0;
      let maternityLeaveCountInsertMultiple = 0;

      let newLeaves = [];
      let existingDates = [];
      let paidType = "Unpaid";
      let leaveType = "Unplanned";
      const currentDate = moment().format("YYYY-MM-DD");

      if (selectedleaveType === "Planned") {
        const applyLeaveFirstDate = leaveDates[0] || null;
        const daysDifference = moment(applyLeaveFirstDate).diff(
          moment(currentDate),
          "days"
        );

        leaveType =
          daysDifference >= plannedLeaveApplyBeforeDays
            ? "Planned"
            : "Unplanned";
      } else {
        leaveType = selectedleaveType;
      }

      try {
        let allLeaveDate = [];

        const checkLeaveDate = await CommenService.checkLeaveDate(
          SITE_DB_NAME,
          userId,
          leaveDates
        );

        const holidaysArr = holidays.map(
          (holiday) => holiday.date.toISOString().split("T")[0]
        );
        if (checkLeaveDate && checkLeaveDate.length > 0) {
          existingDates = checkLeaveDate.flatMap((leave) =>
            leave.leaveDates.map(
              (date) => new Date(date).toISOString().split("T")[0]
            )
          );
          allLeaveDate = leaveDates
            .filter((leaveDate) => !existingDates.includes(leaveDate))
            .filter((leaveDate) => !holidaysArr.includes(leaveDate))
            .filter((leaveDate) => {
              let dayName = moment(leaveDate, "YYYY-MM-DD").format("dddd");
              let day = moment(leaveDate, "YYYY-MM-DD").format("DD");
              let weekNumber = Math.ceil(day / 7);
              let isExtraWorkingDay = monthlyExtraWorkingDays.includes(
                `${weekNumber}${dayName}`
              );
              let weekEndArr = weekEnds;
              if (isExtraWorkingDay) {
                weekEndArr = weekEnds.filter((day) => day !== "Saturday");
              }

              return !weekEndArr.includes(dayName);
            });
        } else {
          allLeaveDate = leaveDates
            .filter((leaveDate) => !holidaysArr.includes(leaveDate))
            .filter((leaveDate) => {
              let dayName = moment(leaveDate, "YYYY-MM-DD").format("dddd");
              let day = moment(leaveDate, "YYYY-MM-DD").format("DD");
              let weekNumber = Math.ceil(day / 7);
              let isExtraWorkingDay = monthlyExtraWorkingDays.includes(
                `${weekNumber}${dayName}`
              );
              let weekEndArr = weekEnds;
              if (isExtraWorkingDay) {
                weekEndArr = weekEnds.filter((day) => day !== "Saturday");
              }

              return !weekEndArr.includes(dayName);
            });
        }
        if (
          selectedleaveType === "Sick" &&
          sickLeaveDocumentDay < allLeaveDate.length &&
          documents.length === 0
        ) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgDocumentRequired });
        }
        try {
          newLeaves = allLeaveDate.map((leaveDate, index) => {
            let totalDay = 0;
            if (selectedleaveType === "Maternity") {
              if (maternityLeaveCount > 0) {
                paidType = "Paid";
                if (dayType === "FullDay") {
                  if (maternityLeaveCount > 0.5) {
                    maternityLeaveCount -= 1;
                    maternityLeaveCountInsert = 1;
                    totalDay = 1;
                    maternityLeaveCountInsertMultiple += 1;
                  } else {
                    maternityLeaveCount -= 0.5;
                    maternityLeaveCountInsert = 0.5;
                    maternityLeaveCountInsertMultiple += 0.5;
                    totalDay = 0.5;

                    paidType = "HalfDayPaid";
                  }
                } else {
                  maternityLeaveCount -= 0.5;
                  maternityLeaveCountInsert = 0.5;
                  maternityLeaveCountInsertMultiple += 0.5;
                  totalDay = 0.5;

                  paidType = "HalfDayPaid";
                }
              }
            } else if (selectedleaveType === "Paternity") {
              if (paternityLeaveCount > 0) {
                paidType = "Paid";
                if (dayType === "FullDay") {
                  if (paternityLeaveCount > 0.5) {
                    paternityLeaveCount -= 1;
                    paternityLeaveCountInsert = 1;
                    paternityLeaveCountInsertMultiple += 1;
                    totalDay = 1;
                  } else {
                    paternityLeaveCount -= 0.5;
                    paternityLeaveCountInsert = 0.5;
                    paternityLeaveCountInsertMultiple += 0.5;
                    totalDay = 0.5;

                    paidType = "HalfDayPaid";
                  }
                } else {
                  paternityLeaveCount -= 0.5;
                  paternityLeaveCountInsert = 0.5;
                  paternityLeaveCountInsertMultiple += 0.5;
                  totalDay = 0.5;

                  paidType = "HalfDayPaid";
                }
              }
            } else {
              if (paidLeaveCount > 0) {
                paidType = "Paid";
                if (dayType === "FullDay") {
                  if (paidLeaveCount > 0.5) {
                    paidLeaveCount -= 1;
                    paidLeaveCountInsert = 1;
                    paidLeaveCountInsertMultiple += 1;
                    totalDay = 1;
                  } else {
                    paidLeaveCount -= 0.5;
                    paidLeaveCountInsert = 0.5;
                    paidLeaveCountInsertMultiple += 0.5;
                    totalDay = 0.5;
                    paidType = "HalfDayPaid";
                  }
                } else {
                  paidLeaveCount -= 0.5;
                  paidLeaveCountInsert = 0.5;
                  paidLeaveCountInsertMultiple += 0.5;
                  totalDay = 0.5;
                  paidType = "HalfDayPaid";
                }
              } else {
                if (dayType === "FullDay") {
                  if (paidLeaveCount > 0.5) {
                    totalDay = 1;
                  } else {
                    totalDay = 0.5;
                  }
                } else {
                  totalDay = 0.5;
                }
              }
            }

            return {
              userId,
              unitId: unitIds,
              roleName: roleName,
              leaveType: leaveType,
              dayType: dayType,
              totalDay: totalDay,
              paidType: paidType,
              leaveDate: new Date(leaveDate),
              paidLeaveCount: paidLeaveCountInsert,
              maternityLeaveCount: maternityLeaveCountInsert,
              paternityLeaveCount: paternityLeaveCountInsert,
            };
          });
          try {
            const totalDays =
              dayType === "FullDay"
                ? allLeaveDate.length
                : allLeaveDate.length / 2;

            if (allLeaveDate.length > 0) {
              const leaveData = {
                userId: userId,
                unitId: unitIds,
                roleName: roleName,
                leaveType: leaveType,
                leavesDeductionStatus: newLeaves,
                approvedAt: moment().format("YYYY-MM-DD HH:mm"),
                dayType: dayType,
                leaveDates: allLeaveDate.map(
                  (Leavedate) => new Date(Leavedate)
                ),
                dates: allLeaveDate,
                reason,
                totalDays: totalDays,
                status: "Pending",
                documents: documents,
                paidLeaveCount: paidLeaveCountInsertMultiple,
                maternityLeaveCount: maternityLeaveCountInsertMultiple,
                paternityLeaveCount: paternityLeaveCountInsertMultiple,
              };
              const leaveAddStatus = await CommenService.addLeave(
                SITE_DB_NAME,
                leaveData
              );
              if (leaveAddStatus === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgLeaveAddError,
                };
                return res.status(200).json(record);
              } else {
                const notifyUsers =
                  await CommenService.getUsersByUnitIdsAndRole(
                    SITE_DB_NAME,
                    unitIds,
                    roleName
                  );
                const recipientIds = notifyUsers
                  .filter((user) => {
                    const isSuperAdmin = user.roleName === "Site-Owner";
                    const isAdminWithMatchingUnit =
                      user.roleName === "Admin" &&
                      Array.isArray(user.unitId) &&
                      user.unitId.some((id) =>
                        unitIds.some((unitId) => unitId.equals(id))
                      ); //
                    const isReportingManager =
                      reportingManager &&
                      reportingManager.equals &&
                      reportingManager.equals(user._id);

                    return (
                      isReportingManager ||
                      isSuperAdmin ||
                      isAdminWithMatchingUnit
                    );
                  })
                  .map((user) => user._id);
                const APP_LOGO = process.env.APP_LOGO || "";
                const APP_SITE_URL = process.env.SITE_URL || "";
                const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                const notiUserId = userId;
                const action = "leave_request";
                const actionId = leaveAddStatus._id;
                const titles = msg.generateLeaveMessage(
                  "",
                  "",
                  "",
                  "Created"
                ).title;
                const messages = msg.generateLeaveMessage(
                  "",
                  "",
                  "",
                  "Created"
                ).message;

                const actionJson = {
                  actionId: actionId,
                  action: action,
                  option: {
                    logoUrl: APP_LOGO,
                    redirectionUrl: {
                      webLink: APP_SITE_URL,
                      deepLink: APP_DEEP_LINK_URL,
                    },
                    imageUrl: "",
                    soundFile: "",
                  },
                  appType: "customer",
                };

                let notificationArr = [];
                async function addNotifications(notiOtherUserIds) {
                  for (const notiOtherUserId of notiOtherUserIds) {
                    const notification =
                      await OneSignalHelperUser.getNotificationArrSingle(
                        SITE_DB_NAME,
                        notiUserId,
                        notiOtherUserId,
                        action,
                        actionId,
                        titles,
                        messages,
                        actionJson
                      );
                    if (notification !== "NA") {
                      notificationArr.push(notification);
                    }
                  }
                }

                await addNotifications(recipientIds);

                if (notificationArr.length > 0) {
                  await OneSignalHelperUser.oneSignalNotificationSendCall(
                    notificationArr
                  );
                }

                const record = {
                  success: true,
                  msg: msg.msgLeaveAddSuccess,
                  data: {
                    leave: leaveAddStatus,
                    alreadyExists: existingDates,
                  },
                };
                return res.status(200).json(record);
              }
            } else {
              const record = {
                success: true,
                msg: msg.msgLeaveAddSuccess,
                data: { leave: [], alreadyExists: existingDates },
              };
              return res.status(200).json(record);
            }
          } catch (error) {
            logger.error("Database error in leave application 1", {
              error: error.message,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: error,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in leave application 2", {
            error: error.message,
          });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("error.message", error.message);

        logger.error("Database error in leave application 3", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in add leave application 4", {
        error: error.message,
      });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
//====================================== leave ===========================
const editApply = [
  //  validation
  body("leaveId")
    .trim()
    .exists()
    .withMessage(msg.msgLeaveIdReqired)
    .notEmpty()
    .withMessage(msg.msgLeaveIdReqired),
  body("leaveDates")
    .trim()
    .exists()
    .withMessage(msg.msgLeaveDatesReqired)
    .notEmpty()
    .withMessage(msg.msgLeaveDatesReqired),
  body("reason")
    .trim()
    .exists()
    .withMessage(msg.msgLeaveReasonReqired)
    .notEmpty()
    .withMessage(msg.msgLeaveReasonReqired),
  body("dayType")
    .trim()
    .exists()
    .withMessage(msg.msgLeaveDayTypeReqired)
    .notEmpty()
    .withMessage(msg.msgLeaveDayTypeReqired),
  body("selectedleaveType")
    .trim()
    .exists()
    .withMessage(msg.msgLeaveTypeReqired)
    .notEmpty()
    .withMessage(msg.msgLeaveTypeReqired),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      let { leaveId, leaveDates, reason, dayType, selectedleaveType } =
        req.body;
      leaveDates = leaveDates
        ? Array.isArray(leaveDates)
          ? leaveDates
          : [leaveDates]
        : [];
      let userId,
        roleName,
        unitIds,
        uniqueId,
        religiousBreak,
        joiningDate,
        holidays,
        shift,
        shiftId,
        name,
        monthlyExtraFreeMin,
        relievingDate,
        image,
        monthlyExtraWorkingDays,
        weekEnds,
        plannedLeaveApplyBeforeDays,
        sickLeaveDocumentDay,
        reportingManager;
      let paidLeaveCount = 0;
      let paternityLeaveCount = 0;
      let maternityLeaveCount = 0;

      if ("userId" in req.body && req.body.userId) {
        let userIdReq = req?.body?.userId;

        const checkUser = await CommenService.checkUser(
          SITE_DB_NAME,
          userIdReq
        );
        if (checkUser === "NA") {
          userId = 0;
        } else {
          userId = checkUser._id;
          const userDetails = await CommenService.getUserDetails(
            SITE_DB_NAME,
            checkUser._id
          );
          roleName = userDetails?.roleName;
          reportingManager = userDetails?.reportingManagerId;
          unitIds = userDetails?.unitId;
          name = userDetails?.name;
          uniqueId = userDetails?.uniqueId;
          image = userDetails?.image;
          religiousBreak = userDetails?.religiousBreak;
          joiningDate = userDetails?.joiningDate;
          holidays = userDetails?.holidays || [];
          shift = userDetails?.shiftDetails || null;
          monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
          plannedLeaveApplyBeforeDays = shift?.plannedLeaveApplyBeforeDays || 7;
          sickLeaveDocumentDay = shift?.sickLeaveDocumentDay || 2;
          weekEnds = shift?.weekEnds || [];
          shiftId = userDetails?.shiftId;
          relievingDate = userDetails?.relievingDate;
          monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin;
          paidLeaveCount = userDetails?.paidLeaveCount;
          paternityLeaveCount = userDetails?.paternityLeaveCount;
          maternityLeaveCount = userDetails?.maternityLeaveCount;
        }
      } else {
        userId = CURRENT_USER_ID;
        roleName = CURRENT_USER?.roleName;
        reportingManager = CURRENT_USER?.reportingManagerId;
        unitIds = CURRENT_USER?.unitId;
        uniqueId = CURRENT_USER?.uniqueId;
        name = CURRENT_USER?.name;
        image = CURRENT_USER?.image;
        religiousBreak = CURRENT_USER?.religiousBreak;
        joiningDate = CURRENT_USER?.joiningDate;
        holidays = CURRENT_USER?.holidays || [];
        shift = CURRENT_USER?.shiftDetails || null;
        plannedLeaveApplyBeforeDays = shift?.plannedLeaveApplyBeforeDays || 7;
        sickLeaveDocumentDay = shift?.sickLeaveDocumentDay || 2;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = CURRENT_USER?.shiftId;
        relievingDate = CURRENT_USER?.relievingDate;
        monthlyExtraFreeMin = CURRENT_USER?.shiftDetails?.monthlyExtraFreeMin;
        paidLeaveCount = CURRENT_USER?.paidLeaveCount;
        paternityLeaveCount = CURRENT_USER?.paternityLeaveCount;
        maternityLeaveCount = CURRENT_USER?.maternityLeaveCount;
      }

      if (!unitIds || unitIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist });
      }
      if (!leaveDates || leaveDates?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgDateReqired });
      }
      if (!userId) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUserNotExist });
      }

      let paidLeaveCountInsert = 0;
      let paternityLeaveCountInsert = 0;
      let maternityLeaveCountInsert = 0;
      let paidLeaveCountInsertMultiple = 0;
      let paternityLeaveCountInsertMultiple = 0;
      let maternityLeaveCountInsertMultiple = 0;

      let newLeaves = [];
      let existingDates = [];
      let paidType = "Unpaid";
      let leaveType = "Unplanned";
      const currentDate = moment().format("YYYY-MM-DD");

      if (selectedleaveType === "Planned") {
        const applyLeaveFirstDate = leaveDates[0] || null;
        const daysDifference = moment(applyLeaveFirstDate).diff(
          moment(currentDate),
          "days"
        );

        leaveType =
          daysDifference >= plannedLeaveApplyBeforeDays
            ? "Planned"
            : "Unplanned";
      } else {
        leaveType = selectedleaveType;
      }

      try {
        let allLeaveDate = [];

        const checkLeaveDate = await CommenService.checkLeaveDateWithId(
          SITE_DB_NAME,
          leaveId,
          userId,
          leaveDates
        );

        const requestCheckStatus = await CommenService.checkLeave(
          SITE_DB_NAME,
          leaveId
        );
        if (requestCheckStatus === "NA") {
          const record = {
            success: false,
            msg: msg.msgLeaveNotExist,
          };
          return res.status(200).json(record);
        }
        const currentDoc = requestCheckStatus?.documents || [];
        const removeDocs = req.body.oldDocuments || [];
        const oldDocs = (currentDoc || []).filter((doc) =>
          removeDocs.includes(doc)
        );
        const newDocs = (req.files || []).map((file) =>
          file.key ? file.key : `${req.folderName}/${file.filename}`
        );
        const documents = [...oldDocs, ...newDocs];

        const holidaysArr = holidays.map(
          (holiday) => holiday.date.toISOString().split("T")[0]
        );
        if (checkLeaveDate && checkLeaveDate.length > 0) {
          existingDates = checkLeaveDate.flatMap((leave) =>
            leave.leaveDates.map(
              (date) => new Date(date).toISOString().split("T")[0]
            )
          );
          allLeaveDate = leaveDates
            .filter((leaveDate) => !existingDates.includes(leaveDate))
            .filter((leaveDate) => !holidaysArr.includes(leaveDate))
            .filter((leaveDate) => {
              let dayName = moment(leaveDate, "YYYY-MM-DD").format("dddd");
              let day = moment(leaveDate, "YYYY-MM-DD").format("DD");
              let weekNumber = Math.ceil(day / 7);
              let isExtraWorkingDay = monthlyExtraWorkingDays.includes(
                `${weekNumber}${dayName}`
              );
              let weekEndArr = weekEnds;
              if (isExtraWorkingDay) {
                weekEndArr = weekEnds.filter((day) => day !== "Saturday");
              }

              return !weekEndArr.includes(dayName);
            });
        } else {
          allLeaveDate = leaveDates
            .filter((leaveDate) => !holidaysArr.includes(leaveDate))
            .filter((leaveDate) => {
              let dayName = moment(leaveDate, "YYYY-MM-DD").format("dddd");
              let day = moment(leaveDate, "YYYY-MM-DD").format("DD");
              let weekNumber = Math.ceil(day / 7);
              let isExtraWorkingDay = monthlyExtraWorkingDays.includes(
                `${weekNumber}${dayName}`
              );
              let weekEndArr = weekEnds;
              if (isExtraWorkingDay) {
                weekEndArr = weekEnds.filter((day) => day !== "Saturday");
              }

              return !weekEndArr.includes(dayName);
            });
        }
        if (
          selectedleaveType === "Sick" &&
          sickLeaveDocumentDay < allLeaveDate.length &&
          documents.length === 0
        ) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgDocumentRequired });
        }
        try {
          newLeaves = allLeaveDate.map((leaveDate, index) => {
            let totalDay = 0;
            if (selectedleaveType === "Maternity") {
              if (maternityLeaveCount > 0) {
                paidType = "Paid";
                if (dayType === "FullDay") {
                  if (maternityLeaveCount > 0.5) {
                    maternityLeaveCount -= 1;
                    maternityLeaveCountInsert = 1;
                    totalDay = 1;
                    maternityLeaveCountInsertMultiple += 1;
                  } else {
                    maternityLeaveCount -= 0.5;
                    maternityLeaveCountInsert = 0.5;
                    maternityLeaveCountInsertMultiple += 0.5;
                    totalDay = 0.5;

                    paidType = "HalfDayPaid";
                  }
                } else {
                  maternityLeaveCount -= 0.5;
                  maternityLeaveCountInsert = 0.5;
                  maternityLeaveCountInsertMultiple += 0.5;
                  totalDay = 0.5;

                  paidType = "HalfDayPaid";
                }
              }
            } else if (selectedleaveType === "Paternity") {
              if (paternityLeaveCount > 0) {
                paidType = "Paid";
                if (dayType === "FullDay") {
                  if (paternityLeaveCount > 0.5) {
                    paternityLeaveCount -= 1;
                    paternityLeaveCountInsert = 1;
                    paternityLeaveCountInsertMultiple += 1;
                    totalDay = 1;
                  } else {
                    paternityLeaveCount -= 0.5;
                    paternityLeaveCountInsert = 0.5;
                    paternityLeaveCountInsertMultiple += 0.5;
                    totalDay = 0.5;

                    paidType = "HalfDayPaid";
                  }
                } else {
                  paternityLeaveCount -= 0.5;
                  paternityLeaveCountInsert = 0.5;
                  paternityLeaveCountInsertMultiple += 0.5;
                  totalDay = 0.5;

                  paidType = "HalfDayPaid";
                }
              }
            } else {
              if (paidLeaveCount > 0) {
                paidType = "Paid";
                if (dayType === "FullDay") {
                  if (paidLeaveCount > 0.5) {
                    paidLeaveCount -= 1;
                    paidLeaveCountInsert = 1;
                    paidLeaveCountInsertMultiple += 1;
                    totalDay = 1;
                  } else {
                    paidLeaveCount -= 0.5;
                    paidLeaveCountInsert = 0.5;
                    paidLeaveCountInsertMultiple += 0.5;
                    totalDay = 0.5;
                    paidType = "HalfDayPaid";
                  }
                } else {
                  paidLeaveCount -= 0.5;
                  paidLeaveCountInsert = 0.5;
                  paidLeaveCountInsertMultiple += 0.5;
                  totalDay = 0.5;
                  paidType = "HalfDayPaid";
                }
              } else {
                if (dayType === "FullDay") {
                  if (paidLeaveCount > 0.5) {
                    totalDay = 1;
                  } else {
                    totalDay = 0.5;
                  }
                } else {
                  totalDay = 0.5;
                }
              }
            }

            return {
              userId,
              unitId: unitIds,
              roleName: roleName,
              leaveType: leaveType,
              dayType: dayType,
              totalDay: totalDay,
              paidType: paidType,
              leaveDate: new Date(leaveDate),
              paidLeaveCount: paidLeaveCountInsert,
              maternityLeaveCount: maternityLeaveCountInsert,
              paternityLeaveCount: paternityLeaveCountInsert,
            };
          });
          try {
            const totalDays =
              dayType === "FullDay"
                ? allLeaveDate.length
                : allLeaveDate.length / 2;

            if (allLeaveDate.length > 0) {
              const leaveData = {
                userId: userId,
                unitId: unitIds,
                roleName: roleName,
                leaveType: leaveType,
                leavesDeductionStatus: newLeaves,
                approvedAt: moment().format("YYYY-MM-DD HH:mm"),
                dayType: dayType,
                leaveDates: allLeaveDate.map(
                  (Leavedate) => new Date(Leavedate)
                ),
                dates: allLeaveDate,
                reason,
                totalDays: totalDays,
                status: "Pending",
                documents: documents,
                paidLeaveCount: paidLeaveCountInsertMultiple,
                maternityLeaveCount: maternityLeaveCountInsertMultiple,
                paternityLeaveCount: paternityLeaveCountInsertMultiple,
              };
              const leaveAddStatus = await CommenService.editLeave(
                SITE_DB_NAME,
                leaveId,
                leaveData
              );
              if (leaveAddStatus === "NA") {
                const record = {
                  success: false,
                  msg: msg.msgLeaveAddError,
                };
                return res.status(200).json(record);
              } else {
                const notifyUsers =
                  await CommenService.getUsersByUnitIdsAndRole(
                    SITE_DB_NAME,
                    unitIds,
                    roleName
                  );

                const recipientIds = notifyUsers
                  .filter((user) => {
                    const isSuperAdmin = user.roleName === "Site-Owner";
                    const isAdminWithMatchingUnit =
                      user.roleName === "Admin" &&
                      Array.isArray(user.unitId) &&
                      user.unitId.some((id) =>
                        unitIds.some((unitId) => unitId.equals(id))
                      ); //
                    const isReportingManager =
                      reportingManager &&
                      reportingManager.equals &&
                      reportingManager.equals(user._id);

                    return (
                      isReportingManager ||
                      isSuperAdmin ||
                      isAdminWithMatchingUnit
                    );
                  })
                  .map((user) => user._id);
                const APP_LOGO = process.env.APP_LOGO || "";
                const APP_SITE_URL = process.env.SITE_URL || "";
                const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
                const notiUserId = userId;
                const action = "leave_request";
                const actionId = leaveId;
                const titles = msg.generateLeaveMessage(
                  "",
                  "",
                  "",
                  "Updated"
                ).title;
                const messages = msg.generateLeaveMessage(
                  "",
                  "",
                  "",
                  "Updated"
                ).message;

                const actionJson = {
                  actionId: actionId,
                  action: action,
                  option: {
                    logoUrl: APP_LOGO,
                    redirectionUrl: {
                      webLink: APP_SITE_URL,
                      deepLink: APP_DEEP_LINK_URL,
                    },
                    imageUrl: "",
                    soundFile: "",
                  },
                  appType: "customer",
                };

                let notificationArr = [];

                async function addNotifications(notiOtherUserIds) {
                  for (const notiOtherUserId of notiOtherUserIds) {
                    const notification =
                      await OneSignalHelperUser.getNotificationArrSingle(
                        SITE_DB_NAME,
                        notiUserId,
                        notiOtherUserId,
                        action,
                        actionId,
                        titles,
                        messages,
                        actionJson
                      );
                    if (notification !== "NA") {
                      notificationArr.push(notification);
                    }
                  }
                }

                await addNotifications(recipientIds);

                if (notificationArr.length > 0) {
                  await OneSignalHelperUser.oneSignalNotificationSendCall(
                    notificationArr
                  );
                }

                const record = {
                  success: true,
                  msg: msg.msgLeaveUpdateSuccess,
                  data: {
                    leave: leaveAddStatus,
                    alreadyExists: existingDates,
                  },
                };
                return res.status(200).json(record);
              }
            } else {
              const record = {
                success: true,
                msg: msg.msgLeaveUpdateSuccess,
                data: {
                  leave: leaveAddStatus,
                  alreadyExists: existingDates,
                },
              };
              return res.status(200).json(record);
            }
          } catch (error) {
            logger.error("Database error in leave application 1", { error });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: error,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in leave application 2", { error });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        console.log("error.message", error.message);

        logger.error("Database error in leave application 3", { error });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in edit leave application 4", {
        error: error.message,
      });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const leaveApproveRejectStatus = [
  //  validation
  body("leaveId")
    .trim()
    .exists()
    .withMessage(msg.msgLeaveIdReqired)
    .notEmpty()
    .withMessage(msg.msgLeaveIdReqired),
  body("status")
    .trim()
    .exists()
    .withMessage(msg.msgStatusReqired)
    .notEmpty()
    .withMessage(msg.msgStatusReqired),
  body("leaveType")
    .trim()
    .exists()
    .withMessage(msg.msgStatusReqired)
    .notEmpty()
    .withMessage(msg.msgStatusReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const userId = CURRENT_USER_ID;
    const currentName = CURRENT_USER?.name;
    const currentRoleName = CURRENT_USER?.roleName;
    if (!userId) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    }
    try {
      const { leaveId, status, comment, leaveType } = req.body;

      let approvedBy = userId;
      let approvedAt = moment().format("YYYY-MM-DD HH:mm");
      const checkLeave = await CommenService.checkLeave(SITE_DB_NAME, leaveId);
      if (checkLeave === 0) {
        const record = {
          success: false,
          msg: msg.msgLeaveNotExist,
        };
        return res.status(200).json(record);
      }

      try {
        const leaveStatus = await CommenService.approveRejectLeave(
          SITE_DB_NAME,
          leaveId,
          status,
          approvedBy,
          approvedAt,
          comment,
          leaveType
        );
        if (leaveStatus === 0) {
          const record = {
            success: false,
            msg: msg.msgLeaveUpdateError,
          };
          return res.status(200).json(record);
        } else {
          const getUserDetails = await CommenService.getUserDetails(
            SITE_DB_NAME,
            checkLeave?.userId
          );
          const userName = getUserDetails !== "NA" ? getUserDetails.name : "NA";
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const notiUserId = userId;
          const notiOtherUserId = checkLeave?.userId;
          const action = "leave_request";
          const actionId = leaveId;
          let titles = msg.generateLeaveMessage(
            userName,
            currentName,
            currentRoleName,
            "Rejected"
          ).title;
          let messages = msg.generateLeaveMessage(
            userName,
            currentName,
            currentRoleName,
            "Rejected"
          ).message;
          if (status === "Approved") {
            titles = msg.generateLeaveMessage(
              userName,
              currentName,
              currentRoleName,
              "Approved"
            ).title;
            messages = msg.generateLeaveMessage(
              userName,
              currentName,
              currentRoleName,
              "Approved"
            ).message;
          }

          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };

          let notificationArr = [];

          const notification =
            await OneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson
            );
          if (notification !== "NA") {
            notificationArr.push(notification);
          }

          if (notificationArr.length > 0) {
            await OneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr
            );
          }
          if (status === "Approved") {
            const record = {
              success: true,
              msg: msg.msgLeaveApprovedSuccess,
              data: { leave: leaveStatus },
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgLeaveRejectedSuccess,
              data: { leave: leaveStatus },
            };
            return res.status(200).json(record);
          }
        }
      } catch (error) {
        logger.error(
          "Database error in leaveApproveRejectStatus  application 3",
          { error: error.message }
        );
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error(
        "Database error in  leaveApproveRejectStatus application 4",
        { error: error.message }
      );
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];

const cancelLeave = [
  //  validation
  query("leaveId")
    .trim()
    .exists()
    .withMessage(msg.msgLeaveIdReqired)
    .notEmpty()
    .withMessage(msg.msgLeaveIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const userId = CURRENT_USER_ID;
    const currentName = CURRENT_USER?.name;
    const currentRoleName = CURRENT_USER?.roleName;
    if (!userId) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    }
    try {
      const { leaveId } = req.query;

      const checkLeave = await CommenService.checkLeave(SITE_DB_NAME, leaveId);
      if (checkLeave === 0) {
        const record = {
          success: false,
          msg: msg.msgLeaveNotExist,
        };
        return res.status(200).json(record);
      }
      let status = "Cancelled";
      let approvedBy = userId;
      let approvedAt = moment().format("YYYY-MM-DD HH:mm");
      try {
        const leaveStatus = await CommenService.cancelLeave(
          SITE_DB_NAME,
          leaveId,
          status,
          approvedBy,
          approvedAt
        );
        if (leaveStatus === 0) {
          const record = {
            success: false,
            msg: msg.msgLeaveDeleteError,
          };
          return res.status(200).json(record);
        } else {
          if (checkLeave?.userId.toString() !== userId.toString()) {
            const getUserDetails = await CommenService.getUserDetails(
              SITE_DB_NAME,
              checkLeave?.userId
            );
            const userName =
              getUserDetails !== "NA" ? getUserDetails.name : "NA";
            const APP_LOGO = process.env.APP_LOGO || "";
            const APP_SITE_URL = process.env.SITE_URL || "";
            const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
            const notiUserId = userId;
            const notiOtherUserId = checkLeave?.userId;
            const action = "leave_request";
            const actionId = leaveId;
            let titles = msg.generateLeaveMessage(
              userName,
              currentName,
              currentRoleName,
              "Cancelled"
            ).title;
            let messages = msg.generateLeaveMessage(
              userName,
              currentName,
              currentRoleName,
              "Cancelled"
            ).message;

            const actionJson = {
              actionId: actionId,
              action: action,
              option: {
                logoUrl: APP_LOGO,
                redirectionUrl: {
                  webLink: APP_SITE_URL,
                  deepLink: APP_DEEP_LINK_URL,
                },
                imageUrl: "",
                soundFile: "",
              },
              appType: "customer",
            };

            let notificationArr = [];

            const notification =
              await OneSignalHelperUser.getNotificationArrSingle(
                SITE_DB_NAME,
                notiUserId,
                notiOtherUserId,
                action,
                actionId,
                titles,
                messages,
                actionJson
              );
            if (notification !== "NA") {
              notificationArr.push(notification);
            }

            if (notificationArr.length > 0) {
              await OneSignalHelperUser.oneSignalNotificationSendCall(
                notificationArr
              );
            }
          }
          const record = {
            success: true,
            msg: msg.msgLeaveCancelledSuccess,
            data: { leave: leaveStatus },
          };
          return res.status(200).json(record);
        }
      } catch (error) {
        logger.error("Database error in cancelLeave application 1", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in cancelLeave application 2", { error });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const myLeaves = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  query("monthYear")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  query("selectionType")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag, monthYear, selectionType } = req.query;

    try {
      let userId,
        unitIds,
        uniqueId,
        religiousBreak,
        joiningDate,
        holidays,
        shift,
        shiftId,
        name,
        monthlyExtraFreeMin,
        relievingDate,
        image,
        monthlyExtraWorkingDays,
        weekEnds;
      let paidLeaveCount = 0;
      let paternityLeaveCount = 0;
      let maternityLeaveCount = 0;
      if ("userId" in req.query && req.query.userId) {
        let userIdReq = req?.query?.userId;
        const checkUser = await CommenService.checkUser(
          SITE_DB_NAME,
          userIdReq
        );
        if (checkUser === "NA") {
          userId = 0;
        }
        userId = checkUser._id;
        const userDetails = await CommenService.getUserDetails(
          SITE_DB_NAME,
          checkUser._id
        );

        unitIds = userDetails?.unitId;
        name = userDetails?.name;
        uniqueId = userDetails?.uniqueId;
        image = userDetails?.image;
        religiousBreak = userDetails?.religiousBreak;
        joiningDate = userDetails?.joiningDate;
        holidays = userDetails?.holidays || [];
        shift = userDetails?.shiftDetails || null;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = userDetails?.shiftId;
        relievingDate = userDetails?.relievingDate;
        monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin;
        paidLeaveCount = userDetails?.paidLeaveCount;
        paternityLeaveCount = userDetails?.paternityLeaveCount;
        maternityLeaveCount = userDetails?.maternityLeaveCount;
      } else {
        userId = CURRENT_USER_ID;
        unitIds = CURRENT_USER?.unitId;
        uniqueId = CURRENT_USER?.uniqueId;
        name = CURRENT_USER?.name;
        image = CURRENT_USER?.image;
        religiousBreak = CURRENT_USER?.religiousBreak;
        joiningDate = CURRENT_USER?.joiningDate;
        holidays = CURRENT_USER?.holidays || [];
        shift = CURRENT_USER?.shiftDetails || null;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = CURRENT_USER?.shiftId;
        relievingDate = CURRENT_USER?.relievingDate;
        monthlyExtraFreeMin = CURRENT_USER?.shiftDetails?.monthlyExtraFreeMin;
        paidLeaveCount = CURRENT_USER?.paidLeaveCount;
        paternityLeaveCount = CURRENT_USER?.paternityLeaveCount;
        maternityLeaveCount = CURRENT_USER?.maternityLeaveCount;
      }

      if (!unitIds || unitIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist, leaves: [] });
      }

      const shiftIds = [shiftId];
      if (!shiftIds || shiftIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist });
      }
      if (!shift) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgShiftNotExist });
      }
      if (!Array.isArray(shiftIds) || !shiftIds || shiftIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgShiftNotExist });
      }
      const pagination = {
        pageSize: parseInt(req.query.pageSize) || 10,
        pageNumber: parseInt(req.query.pageNumber) || 1,
      };
      const { leaveCounts, leaves } = await CommenService.getMyLeaves(
        SITE_DB_NAME,
        userId,
        selectionType,
        monthYear,
        Number(deleteFlag),
        pagination
      );
      return res.status(200).json({
        success: true,
        msg: ["data found"],
        data: {
          leaves: leaves.filter((item) => item !== null),
          name,
          uniqueId,
          monthlyExtraFreeMin,
          paidLeaveCount,
          paternityLeaveCount,
          maternityLeaveCount,
          leaveCounts: leaveCounts,
        },
      });
    } catch (error) {
      logger.error("Database error in leaves application", { error });
      const record = { success: true, msg: error.message, key: "error" };
      return res.status(500).json(record);
    }
  },
];
const leaves = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  query("monthYear")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  query("selectionType")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag, monthYear, selectionType } = req.query;

    try {
      let userId,
        unitIds,
        uniqueId,
        religiousBreak,
        joiningDate,
        holidays,
        shift,
        shiftId,
        name,
        monthlyExtraFreeMin,
        relievingDate,
        image,
        monthlyExtraWorkingDays,
        weekEnds,
        roleName;

      if ("userId" in req.query && req.query.userId) {
        let userIdReq = req?.query?.userId;
        const checkUser = await CommenService.checkUser(
          SITE_DB_NAME,
          userIdReq
        );
        if (checkUser === "NA") {
          userId = 0;
        }
        userId = checkUser._id;
        const userDetails = await CommenService.getUserDetails(
          SITE_DB_NAME,
          checkUser._id
        );

        unitIds = userDetails?.unitId;
        name = userDetails?.name;
        roleName = userDetails?.roleName;
        uniqueId = userDetails?.uniqueId;
        image = userDetails?.image;
        religiousBreak = userDetails?.religiousBreak;
        joiningDate = userDetails?.joiningDate;
        holidays = userDetails?.holidays || [];
        shift = userDetails?.shiftDetails || null;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = userDetails?.shiftId;
        relievingDate = userDetails?.relievingDate;
        monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin;
        paidLeaveCount = userDetails?.paidLeaveCount;
        paternityLeaveCount = userDetails?.paternityLeaveCount;
        maternityLeaveCount = userDetails?.maternityLeaveCount;
      } else {
        userId = CURRENT_USER_ID;
        unitIds = CURRENT_USER?.unitId;
        roleName = CURRENT_USER?.roleName;
        uniqueId = CURRENT_USER?.uniqueId;
        name = CURRENT_USER?.name;
        image = CURRENT_USER?.image;
        religiousBreak = CURRENT_USER?.religiousBreak;
        joiningDate = CURRENT_USER?.joiningDate;
        holidays = CURRENT_USER?.holidays || [];
        shift = CURRENT_USER?.shiftDetails || null;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = CURRENT_USER?.shiftId;
        relievingDate = CURRENT_USER?.relievingDate;
        monthlyExtraFreeMin = CURRENT_USER?.shiftDetails?.monthlyExtraFreeMin;
        paidLeaveCount = CURRENT_USER?.paidLeaveCount;
        paternityLeaveCount = CURRENT_USER?.paternityLeaveCount;
        maternityLeaveCount = CURRENT_USER?.maternityLeaveCount;
      }

      const pagination = {
        pageSize: parseInt(req.query.pageSize) || 10,
        pageNumber: parseInt(req.query.pageNumber) || 1,
      };
      const unitId = req?.query?.unitId || "";

      if (unitId && unitId !== "all") {
        const checkUnitId = await CommenService.checkUnit(SITE_DB_NAME, unitId);
        unitIds = [checkUnitId];
      }
      const { leaveCounts, leaves } = await CommenService.getLeaves(
        SITE_DB_NAME,
        userId,
        unitIds,
        roleName,
        monthYear,
        selectionType,
        Number(deleteFlag),
        pagination
      );
      return res.status(200).json({
        success: true,
        msg: ["data found"],
        data: {
          leaveCounts: leaveCounts,
          leaves: leaves || [],
        },
      });
    } catch (error) {
      logger.error("Database error in leaves application", { error });
      const record = { success: true, msg: error.message, key: "error" };
      return res.status(500).json(record);
    }
  },
];
const deleteLeave = [
  //  validation
  query("leaveId")
    .trim()
    .exists()
    .withMessage(msg.msgLeaveIdReqired)
    .notEmpty()
    .withMessage(msg.msgLeaveIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { leaveId } = req.query;

      const checkLeave = await CommenService.checkLeave(SITE_DB_NAME, leaveId);
      if (checkLeave === 0) {
        const record = {
          success: false,
          msg: msg.msgLeaveNotExist,
        };
        return res.status(200).json(record);
      }
      try {
        const leaveStatus = await CommenService.deleteLeave(
          SITE_DB_NAME,
          leaveId
        );
        if (leaveStatus === 0) {
          const record = {
            success: false,
            msg: msg.msgLeaveDeleteError,
          };
          return res.status(200).json(record);
        } else {
          const record = {
            success: true,
            msg: msg.msgLeaveDeleteSuccess,
          };
          return res.status(200).json(record);
        }
      } catch (error) {
        logger.error("Database error in deleteleave", { error });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in deleteleave", { error });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const getUsersAll = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const userId = CURRENT_USER_ID;
    const unitIds = CURRENT_USER?.unitId;
    const roleName = CURRENT_USER?.roleName;
    if (roleName !== "Site-Owner") {
      if (!unitIds || unitIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist, leaves: [] });
      }
    }
    const { deleteFlag } = req.query;

    try {
      const employees = await CommenService.getUsersAll(
        SITE_DB_NAME,
        roleName,
        unitIds,
        Number(deleteFlag)
      );
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
      logger.error("Database error in  getUsersAll application", { error });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const getNotificationEmployeeAll = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  query("unitId")
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  query("roleId")
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const userId = CURRENT_USER_ID;
    const unitIds = CURRENT_USER?.unitId;
    const roleName = CURRENT_USER?.roleName;
    if (roleName !== "Site-Owner") {
      if (!unitIds || unitIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist, leaves: [] });
      }
    }
    const { deleteFlag, roleId, unitId } = req.query;
    try {
      const employees = await CommenService.getNotificationUsersAll(
        SITE_DB_NAME,
        roleName,
        unitIds,
        roleId,
        unitId,
        Number(deleteFlag)
      );
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
      logger.error("Database error in  getUsersAll application", { error });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
//====================================== Regularization ===========================
const addRegularizationRequest = [
  body("reason")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      let { userId, attendanceId, date, reason } = req.body;
      let roleName,
        unitIds,
        shift,
        uniqueId,
        religiousBreak,
        joiningDate,
        holidays,
        shiftId,
        name,
        monthlyExtraFreeMin,
        relievingDate,
        image,
        monthlyExtraWorkingDays,
        weekEnds,
        plannedLeaveApplyBeforeDays,
        reportingManager,
        sickLeaveDocumentDay;

      if ("userId" in req.body && req.body.userId) {
        let userIdReq = req?.body?.userId;
        const checkUser = await CommenService.checkUser(
          SITE_DB_NAME,
          userIdReq
        );
        const userDetails = await CommenService.getUserDetails(
          SITE_DB_NAME,
          checkUser._id
        );
        userId = checkUser._id;
        roleName = userDetails?.roleName;
        reportingManager = userDetails?.reportingManagerId;
        unitIds = userDetails?.unitId;
        name = userDetails?.name;
        uniqueId = userDetails?.uniqueId;
        image = userDetails?.image;
        religiousBreak = userDetails?.religiousBreak;
        joiningDate = userDetails?.joiningDate;
        holidays = userDetails?.holidays || [];
        shift = userDetails?.shiftDetails || null;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        plannedLeaveApplyBeforeDays = shift?.plannedLeaveApplyBeforeDays || 7;
        sickLeaveDocumentDay = shift?.sickLeaveDocumentDay || 2;
        weekEnds = shift?.weekEnds || [];
        shiftId = userDetails?.shiftId;
        relievingDate = userDetails?.relievingDate;
        monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin;
      } else {
        roleName = CURRENT_USER?.roleName;
        reportingManager = CURRENT_USER?.reportingManagerId;
        userId = CURRENT_USER_ID;
        unitIds = CURRENT_USER?.unitId;
        uniqueId = CURRENT_USER?.uniqueId;
        name = CURRENT_USER?.name;
        image = CURRENT_USER?.image;
        religiousBreak = CURRENT_USER?.religiousBreak;
        joiningDate = CURRENT_USER?.joiningDate;
        holidays = CURRENT_USER?.holidays || [];
        shift = CURRENT_USER?.shiftDetails || null;
        plannedLeaveApplyBeforeDays = shift?.plannedLeaveApplyBeforeDays || 7;
        sickLeaveDocumentDay = shift?.sickLeaveDocumentDay || 2;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = CURRENT_USER?.shiftId;
        relievingDate = CURRENT_USER?.relievingDate;
        monthlyExtraFreeMin = CURRENT_USER?.shiftDetails?.monthlyExtraFreeMin;
      }
      let { originalPunches } = req.body;
      let { requestPunches } = req.body;
      if (typeof originalPunches === "string") {
        originalPunches = JSON.parse(originalPunches);
      }

      if (typeof requestPunches === "string") {
        requestPunches = JSON.parse(requestPunches);
      }

      if (!unitIds || unitIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist });
      }
      if (!requestPunches || requestPunches?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgDateReqired });
      }
      if (!userId) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUserNotExist });
      }
      if (!Array.isArray(requestPunches) || requestPunches.length % 2 !== 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgRequestLengthNotValidExist });
      }

      let documents = [];

      if (req?.files) {
        documents = req?.files.map((file) => file?.key);
      }
      try {
        const requestData = {
          userId: userId,
          unitId: unitIds,
          roleName: roleName,
          attendanceId: attendanceId,
          date: date,
          originalPunches: originalPunches,
          requestedPunches: requestPunches,
          reason: reason,
          documents: documents,
        };
        const requestAddStatus = await CommenService.addRegularization(
          SITE_DB_NAME,
          requestData
        );
        if (requestAddStatus === "NA") {
          const record = {
            success: false,
            msg: msg.msgRegAddError,
          };
          return res.status(200).json(record);
        } else {
          const notifyUsers = await CommenService.getUsersByUnitIdsAndRole(
            SITE_DB_NAME,
            unitIds,
            roleName
          );

          const recipientIds = notifyUsers
            .filter((user) => {
              const isSuperAdmin = user.roleName === "Site-Owner";

              const isAdminWithMatchingUnit =
                user.roleName === "Admin" &&
                Array.isArray(user.unitId) &&
                user.unitId.some((id) =>
                  unitIds.some((unitId) => unitId.equals(id))
                ); //
              const isReportingManagerMatch =
                reportingManager &&
                user._id &&
                reportingManager.equals(user._id);

              return (
                isReportingManagerMatch ||
                isSuperAdmin ||
                isAdminWithMatchingUnit
              );
            })
            .map((user) => user._id);

          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const notiUserId = userId;
          const action = "reg_request";
          const actionId = requestAddStatus._id;
          const titles = msg.generateRegMessage("", "", "", "Created").title;
          const messages = msg.generateRegMessage(
            "",
            "",
            "",
            "Created"
          ).message;

          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };

          let notificationArr = [];

          async function addNotifications(notiOtherUserIds) {
            for (const notiOtherUserId of notiOtherUserIds) {
              const notification =
                await OneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson
                );
              if (notification !== "NA") {
                notificationArr.push(notification);
              }
            }
          }

          await addNotifications(recipientIds);

          if (notificationArr.length > 0) {
            await OneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr
            );
          }

          const record = {
            success: true,
            msg: msg.msgRegAddSuccess,
            data: { regularization: requestAddStatus },
          };
          return res.status(200).json(record);
        }
      } catch (error) {
        logger.error("Database error in add Reg application 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in add Reg application 2", {
        error: error.message,
        key: 1,
      });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
//====================================== Regularization ===========================
const editRegularizationRequest = [
  //  validation
  body("regularizationId")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("userId")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("reason")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { regularizationId, userId, attendanceId, date, reason } = req.body;
      let roleName,
        unitIds,
        shift,
        uniqueId,
        religiousBreak,
        joiningDate,
        holidays,
        shiftId,
        name,
        monthlyExtraFreeMin,
        relievingDate,
        image,
        monthlyExtraWorkingDays,
        weekEnds,
        plannedLeaveApplyBeforeDays,
        reportingManager,
        sickLeaveDocumentDay;

      if ("userId" in req.body && req.body.userId) {
        let userIdReq = req?.body?.userId;
        const checkUser = await CommenService.checkUser(
          SITE_DB_NAME,
          userIdReq
        );
        if (checkUser === "NA") {
        } else {
          const userDetails = await CommenService.getUserDetails(
            SITE_DB_NAME,
            checkUser._id
          );
          roleName = userDetails?.roleName;
          reportingManager = userDetails?.reportingManagerId;

          unitIds = userDetails?.unitId;
          name = userDetails?.name;
          uniqueId = userDetails?.uniqueId;
          image = userDetails?.image;
          religiousBreak = userDetails?.religiousBreak;
          joiningDate = userDetails?.joiningDate;
          holidays = userDetails?.holidays || [];
          shift = userDetails?.shiftDetails || null;
          monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
          plannedLeaveApplyBeforeDays = shift?.plannedLeaveApplyBeforeDays || 7;
          sickLeaveDocumentDay = shift?.sickLeaveDocumentDay || 2;
          weekEnds = shift?.weekEnds || [];
          shiftId = userDetails?.shiftId;
          relievingDate = userDetails?.relievingDate;
          monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin;
        }
      } else {
        reportingManager = CURRENT_USER?.reportingManagerId;
        roleName = CURRENT_USER?.roleName;
        unitIds = CURRENT_USER?.unitId;
        uniqueId = CURRENT_USER?.uniqueId;
        name = CURRENT_USER?.name;
        image = CURRENT_USER?.image;
        religiousBreak = CURRENT_USER?.religiousBreak;
        joiningDate = CURRENT_USER?.joiningDate;
        holidays = CURRENT_USER?.holidays || [];
        shift = CURRENT_USER?.shiftDetails || null;
        plannedLeaveApplyBeforeDays = shift?.plannedLeaveApplyBeforeDays || 7;
        sickLeaveDocumentDay = shift?.sickLeaveDocumentDay || 2;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = CURRENT_USER?.shiftId;
        relievingDate = CURRENT_USER?.relievingDate;
        monthlyExtraFreeMin = CURRENT_USER?.shiftDetails?.monthlyExtraFreeMin;
      }

      let { originalPunches } = req.body;
      let { requestPunches } = req.body;
      if (typeof originalPunches === "string") {
        originalPunches = JSON.parse(originalPunches);
      }

      if (typeof requestPunches === "string") {
        requestPunches = JSON.parse(requestPunches);
      }

      if (!unitIds || unitIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist });
      }
      if (!requestPunches || requestPunches?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgDateReqired });
      }
      if (!userId) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUserNotExist });
      }
      if (!Array.isArray(requestPunches) || requestPunches.length % 2 !== 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgRequestLengthNotValidExist });
      }
      try {
        const requestCheckStatus = await CommenService.checkRegularization(
          SITE_DB_NAME,
          regularizationId
        );
        if (requestCheckStatus === "NA") {
          const record = {
            success: false,
            msg: msg.msgRegNotExist,
          };
          return res.status(200).json(record);
        }
        const currentDoc = requestCheckStatus?.documents || [];
        const removeDocs = req.body.oldDocuments || [];
        const oldDocs = (currentDoc || []).filter((doc) =>
          removeDocs.includes(doc)
        );
        const newDocs = (req.files || []).map((file) =>
          file.key ? file.key : `${req.folderName}/${file.filename}`
        );
        const documents = [...oldDocs, ...newDocs];

        const requestData = {
          requestedPunches: requestPunches,
          reason: reason,
          documents: documents,
        };
        const requestUpdateStatus = await CommenService.editRegularization(
          SITE_DB_NAME,
          regularizationId,
          requestData
        );
        if (requestUpdateStatus === "NA") {
          const record = {
            success: false,
            msg: msg.msgRegUpdateError,
          };
          return res.status(200).json(record);
        } else {
          const notifyUsers = await CommenService.getUsersByUnitIdsAndRole(
            SITE_DB_NAME,
            unitIds,
            roleName
          );
          const recipientIds = notifyUsers
            .filter((user) => {
              const isSuperAdmin = user.roleName === "Site-Owner";

              const isAdminWithMatchingUnit =
                user.roleName === "Admin" &&
                Array.isArray(user.unitId) &&
                user.unitId.some((id) =>
                  unitIds.some((unitId) => unitId.equals(id))
                ); //
              const isReportingManagerMatch =
                reportingManager &&
                user._id &&
                reportingManager.equals(user._id);

              return (
                isReportingManagerMatch ||
                isSuperAdmin ||
                isAdminWithMatchingUnit
              );
            })
            .map((user) => user._id);
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const notiUserId = userId;
          const action = "reg_request";
          const actionId = regularizationId;
          const titles = msg.generateRegMessage("", "", "", "Updated").title;
          const messages = msg.generateRegMessage(
            "",
            "",
            "",
            "Updated"
          ).message;

          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };

          let notificationArr = [];

          async function addNotifications(notiOtherUserIds) {
            for (const notiOtherUserId of notiOtherUserIds) {
              const notification =
                await OneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson
                );
              if (notification !== "NA") {
                notificationArr.push(notification);
              }
            }
          }

          await addNotifications(recipientIds);

          if (notificationArr.length > 0) {
            await OneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr
            );
          }

          const record = {
            success: true,
            msg: msg.msgRegUpdateSuccess,
            data: { regularization: requestUpdateStatus },
          };
          return res.status(200).json(record);
        }
      } catch (error) {
        logger.error("Database error in edit Reg application 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in edit Reg application 2", {
        error: error.message,
        key: 1,
      });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const cancelRegularizationRequest = [
  //  validation
  body("regularizationId")
    .trim()
    .exists()
    .withMessage(msg.msgRegularizationIdReqired)
    .notEmpty()
    .withMessage(msg.msgRegularizationIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const userId = CURRENT_USER_ID;
    const currentName = CURRENT_USER?.name;
    const currentRoleName = CURRENT_USER?.roleName;
    if (!userId) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    }
    try {
      const { regularizationId, deleteFlag } = req.body;

      const checkRegularization = await CommenService.checkRegularization(
        SITE_DB_NAME,
        regularizationId
      );
      if (checkRegularization === 0) {
        const record = {
          success: false,
          msg: msg.msgRegNotExist,
        };
        return res.status(200).json(record);
      }
      let status = "Cancelled";
      let approvedBy = userId;
      let approvedAt = moment().format("YYYY-MM-DD HH:mm");
      try {
        const regularizationStatus = await CommenService.cancelRegularization(
          SITE_DB_NAME,
          regularizationId,
          status,
          approvedBy,
          approvedAt,
          currentRoleName
        );
        if (regularizationStatus === 0) {
          const record = {
            success: false,
            msg: msg.msgRegDeleteError,
          };
          return res.status(200).json(record);
        } else {
          try {
            if (checkRegularization?.userId.toString() !== userId.toString()) {
              console.log(checkRegularization?.userId, userId);
              const getUserDetails = await CommenService.getUserDetails(
                SITE_DB_NAME,
                checkRegularization?.userId
              );
              const userName =
                getUserDetails !== "NA" ? getUserDetails.name : "NA";
              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const notiUserId = userId;
              const notiOtherUserId = checkRegularization?.userId;
              const action = "reg_request";
              const actionId = regularizationId;
              let titles = msg.generateRegMessage(
                userName,
                currentName,
                currentRoleName,
                "Cancelled"
              ).title;
              let messages = msg.generateRegMessage(
                userName,
                currentName,
                currentRoleName,
                "Cancelled"
              ).message;

              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };

              let notificationArr = [];

              const notification =
                await OneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson
                );
              if (notification !== "NA") {
                notificationArr.push(notification);
              }

              if (notificationArr.length > 0) {
                await OneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr
                );
              }
            }
            const record = {
              success: true,
              msg: msg.msgRegCancelledSuccess,
              data: { regularization: regularizationStatus },
            };
            return res.status(200).json(record);
          } catch (error) {
            logger.error(
              "Database error in cancelRegularization application 0",
              { error }
            );
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: error,
            };
            return res.status(500).json(record);
          }
        }
      } catch (error) {
        logger.error("Database error in cancelRegularization application 1", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in cancelRegularization application 2", {
        error,
      });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const myRegularizations = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  query("monthYear")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  query("selectionType")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag, monthYear, selectionType } = req.query;

    try {
      let userId,
        unitIds,
        uniqueId,
        religiousBreak,
        joiningDate,
        holidays,
        shift,
        shiftId,
        name,
        monthlyExtraFreeMin,
        relievingDate,
        image,
        monthlyExtraWorkingDays,
        weekEnds;
      let paidLeaveCount = 0;
      let paternityLeaveCount = 0;
      let maternityLeaveCount = 0;
      if ("userId" in req.query && req.query.userId) {
        let userIdReq = req?.query?.userId;
        const checkUser = await CommenService.checkUser(
          SITE_DB_NAME,
          userIdReq
        );
        if (checkUser === "NA") {
          userId = 0;
        }
        userId = checkUser._id;
        const userDetails = await CommenService.getUserDetails(
          SITE_DB_NAME,
          checkUser._id
        );

        unitIds = userDetails?.unitId;
        name = userDetails?.name;
        uniqueId = userDetails?.uniqueId;
        image = userDetails?.image;
        religiousBreak = userDetails?.religiousBreak;
        joiningDate = userDetails?.joiningDate;
        holidays = userDetails?.holidays || [];
        shift = userDetails?.shiftDetails || null;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = userDetails?.shiftId;
        relievingDate = userDetails?.relievingDate;
        monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin;
        paidLeaveCount = userDetails?.paidLeaveCount;
        paternityLeaveCount = userDetails?.paternityLeaveCount;
        maternityLeaveCount = userDetails?.maternityLeaveCount;
      } else {
        userId = CURRENT_USER_ID;
        unitIds = CURRENT_USER?.unitId;
        uniqueId = CURRENT_USER?.uniqueId;
        name = CURRENT_USER?.name;
        image = CURRENT_USER?.image;
        religiousBreak = CURRENT_USER?.religiousBreak;
        joiningDate = CURRENT_USER?.joiningDate;
        holidays = CURRENT_USER?.holidays || [];
        shift = CURRENT_USER?.shiftDetails || null;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = CURRENT_USER?.shiftId;
        relievingDate = CURRENT_USER?.relievingDate;
        monthlyExtraFreeMin = CURRENT_USER?.shiftDetails?.monthlyExtraFreeMin;
        paidLeaveCount = CURRENT_USER?.paidLeaveCount;
        paternityLeaveCount = CURRENT_USER?.paternityLeaveCount;
        maternityLeaveCount = CURRENT_USER?.maternityLeaveCount;
      }

      if (!unitIds || unitIds?.length === 0) {
        return res.status(200).json({
          success: false,
          msg: msg.msgUnitNotExist,
          regularizations: [],
        });
      }

      const shiftIds = [shiftId];
      if (!shiftIds || shiftIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist });
      }
      if (!shift) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgShiftNotExist });
      }
      if (!Array.isArray(shiftIds) || !shiftIds || shiftIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgShiftNotExist });
      }
      const pagination = {
        pageSize: parseInt(req.query.pageSize) || 10,
        pageNumber: parseInt(req.query.pageNumber) || 1,
      };
      const { regularizationsCounts, regularizations } =
        await CommenService.getMyRegularizations(
          SITE_DB_NAME,
          userId,
          selectionType,
          monthYear,
          Number(deleteFlag),
          pagination
        );
      const record = {
        success: true,
        msg: ["data found"],
        data: {
          regularizations: regularizations,
          name,
          uniqueId,
          regularizationsCounts: regularizationsCounts,
        },
      };
      return res.status(200).json(record);
    } catch (error) {
      logger.error("Database error in regularizations application", {
        error: error.message,
      });
      const record = { success: true, msg: error.message, key: "error" };
      return res.status(500).json(record);
    }
  },
];
const regularizationRequests = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  query("monthYear")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  query("selectionType")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag, monthYear, selectionType } = req.query;

    try {
      let userId,
        unitIds,
        uniqueId,
        religiousBreak,
        joiningDate,
        holidays,
        shift,
        shiftId,
        name,
        monthlyExtraFreeMin,
        relievingDate,
        image,
        monthlyExtraWorkingDays,
        weekEnds,
        roleName;

      if ("userId" in req.query && req.query.userId) {
        let userIdReq = req?.query?.userId;
        const checkUser = await CommenService.checkUser(
          SITE_DB_NAME,
          userIdReq
        );
        if (checkUser === "NA") {
          userId = 0;
        }
        userId = checkUser._id;
        const userDetails = await CommenService.getUserDetails(
          SITE_DB_NAME,
          checkUser._id
        );

        unitIds = userDetails?.unitId;
        name = userDetails?.name;
        roleName = userDetails?.roleName;
        uniqueId = userDetails?.uniqueId;
        image = userDetails?.image;
        religiousBreak = userDetails?.religiousBreak;
        joiningDate = userDetails?.joiningDate;
        holidays = userDetails?.holidays || [];
        shift = userDetails?.shiftDetails || null;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = userDetails?.shiftId;
        relievingDate = userDetails?.relievingDate;
        monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin;
        paidLeaveCount = userDetails?.paidLeaveCount;
        paternityLeaveCount = userDetails?.paternityLeaveCount;
        maternityLeaveCount = userDetails?.maternityLeaveCount;
      } else {
        userId = CURRENT_USER_ID;
        unitIds = CURRENT_USER?.unitId;
        roleName = CURRENT_USER?.roleName;
        uniqueId = CURRENT_USER?.uniqueId;
        name = CURRENT_USER?.name;
        image = CURRENT_USER?.image;
        religiousBreak = CURRENT_USER?.religiousBreak;
        joiningDate = CURRENT_USER?.joiningDate;
        holidays = CURRENT_USER?.holidays || [];
        shift = CURRENT_USER?.shiftDetails || null;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = CURRENT_USER?.shiftId;
        relievingDate = CURRENT_USER?.relievingDate;
        monthlyExtraFreeMin = CURRENT_USER?.shiftDetails?.monthlyExtraFreeMin;
        paidLeaveCount = CURRENT_USER?.paidLeaveCount;
        paternityLeaveCount = CURRENT_USER?.paternityLeaveCount;
        maternityLeaveCount = CURRENT_USER?.maternityLeaveCount;
      }
      if (roleName !== "Site-Owner") {
        if (!unitIds || unitIds?.length === 0) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgUnitNotExist, leaves: [] });
        }

        const shiftIds = [shiftId];
        if (!shiftIds || shiftIds?.length === 0) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgUnitNotExist });
        }
        if (!shift) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgShiftNotExist });
        }
        if (!Array.isArray(shiftIds) || !shiftIds || shiftIds?.length === 0) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgShiftNotExist });
        }
      }
      const pagination = {
        pageSize: parseInt(req.query.pageSize) || 10,
        pageNumber: parseInt(req.query.pageNumber) || 1,
      };
      const unitId = req?.query?.unitId || "";

      if (unitId && unitId !== "all") {
        const checkUnitId = await CommenService.checkUnit(SITE_DB_NAME, unitId);
        unitIds = [checkUnitId];
      }

      const search = req.query.search || "";
      const { regularizationsCounts, regularizations } =
        await CommenService.getRegularizationRequests(
          SITE_DB_NAME,
          userId,
          unitIds,
          roleName,
          selectionType,
          monthYear,
          Number(deleteFlag),
          pagination,
          search
        );
      return res.status(200).json({
        success: true,
        msg: ["data found"],
        data: {
          regularizations: regularizations.filter((item) => item !== null),
          regularizationsCounts: regularizationsCounts,
        },
      });
    } catch (error) {
      logger.error("Database error in regularizations application", { error });
      const record = { success: true, msg: error.message, key: "error" };
      return res.status(500).json(record);
    }
  },
];

// ================================================== self function end ==========================================
const approveRejectStatusRegularizationRequest = [
  //  validation
  body("regularizationId")
    .trim()
    .exists()
    .withMessage(msg.msgRegularizationIdReqired)
    .notEmpty()
    .withMessage(msg.msgRegularizationIdReqired),
  body("status")
    .trim()
    .exists()
    .withMessage(msg.msgStatusReqired)
    .notEmpty()
    .withMessage(msg.msgStatusReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const userId = CURRENT_USER_ID;
    const currentName = CURRENT_USER?.name;
    const currentRoleName = CURRENT_USER?.roleName;
    if (!userId) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    }

    try {
      const { regularizationId, status, comment, requestPunches } = req.body;
      if (!Array.isArray(requestPunches) || requestPunches.length % 2 !== 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgRequestLengthNotValidExist });
      }
      const checkRegularization = await CommenService.checkRegularization(
        SITE_DB_NAME,
        regularizationId
      );
      if (checkRegularization === 0) {
        const record = {
          success: false,
          msg: msg.msgRegNotExist,
        };
        return res.status(200).json(record);
      }
      let approvedBy = userId;
      let approvedAt = moment().format("YYYY-MM-DD HH:mm");

      try {
        let updateData = {};
        if (currentRoleName === "Manager") {
          updateData = {
            managerApprovedBy: approvedBy,
            managerApprovedAt: approvedAt,
            managerApprovedComment: comment,
            managerApprovedStatus: status,
          };
          if (status === "Rejected") {
            updateData["status"] = status;
          } else {
            updateData["requestedPunches"] = requestPunches;
          }
        } else {
          updateData = {
            approvedBy,
            approvedAt,
            approvedComment: comment,
            approvedStatus: status,
            approvedRoleName: currentRoleName,
            status,
          };
          if (status !== "Rejected") {
            updateData["requestedPunches"] = requestPunches;
          }
        }
        const regularizationStatus =
          await CommenService.approveRejectRegularization(
            SITE_DB_NAME,
            regularizationId,
            updateData
          );
        // const regularizationStatus = 1;

        if (regularizationStatus === 0) {
          const record = {
            success: false,
            msg: msg.msgRegUpdateError,
          };
          return res.status(200).json(record);
        } else {
          const getUserDetails = await CommenService.getUserDetails(
            SITE_DB_NAME,
            checkRegularization?.userId
          );
          const userName = getUserDetails !== "NA" ? getUserDetails.name : "NA";
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const notiUserId = userId;
          const notiOtherUserId = checkRegularization?.userId;
          const action = "reg_request";
          const actionId = regularizationId;
          let titles = msg.generateRegMessage(
            userName,
            currentName,
            currentRoleName,
            "Rejected"
          ).title;
          let messages = msg.generateRegMessage(
            userName,
            currentName,
            currentRoleName,
            "Rejected"
          ).message;
          if (status === "Approved") {
            titles = msg.generateRegMessage(
              userName,
              currentName,
              currentRoleName,
              "Approved"
            ).title;
            messages = msg.generateRegMessage(
              userName,
              currentName,
              currentRoleName,
              "Approved"
            ).message;
          }
          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };

          let notificationArr = [];

          const notification =
            await OneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson
            );
          if (notification !== "NA") {
            notificationArr.push(notification);
          }

          if (notificationArr.length > 0) {
            await OneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr
            );
          }
          if (status === "Approved") {
            if (currentRoleName === "Manager") {
              const record = {
                success: true,
                msg: msg.msgRegApprovedSuccess,
                data: { regularization: regularizationStatus },
              };
              return res.status(200).json(record);
            } else {
              const attendanceId = checkRegularization.attendanceId;

              let updateStatusAtt = 1;
              if (attendanceId) {
                updateStatusAtt =
                  await CommenService.updateDeleteFlagAttandance(
                    SITE_DB_NAME,
                    attendanceId
                  );
              }
              if (updateStatusAtt !== 0) {
                for (const punch of requestPunches) {
                  const result = await attendancePunchRegularization(
                    SITE_DB_NAME,
                    punch
                  );
                }
              }

              const record = {
                success: true,
                msg: msg.msgRegApprovedSuccess,
                data: { regularization: regularizationStatus },
              };
              return res.status(200).json(record);
            }
          } else {
            const record = {
              success: true,
              msg: msg.msgRegRejectedSuccess,
              data: { regularization: regularizationStatus },
            };
            return res.status(200).json(record);
          }
        }
      } catch (error) {
        logger.error("Database error in regularization application 4", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in regularization application 4", {
        error,
      });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];

const deleteRegularization = [
  //  validation
  query("regularizationId")
    .trim()
    .exists()
    .withMessage(msg.msgRegularizationIdReqired)
    .notEmpty()
    .withMessage(msg.msgRegularizationIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { regularizationId } = req.query;

      const checkRegularization = await CommenService.checkRegularizationId(
        SITE_DB_NAME,
        regularizationId
      );
      if (checkRegularization === 0) {
        const record = {
          success: false,
          msg: msg.msgRegNotExist,
        };
        return res.status(200).json(record);
      }

      try {
        const regularizationStatus = await CommenService.deleteRegularization(
          SITE_DB_NAME,
          regularizationId
        );
        if (regularizationStatus === 0) {
          const record = {
            success: false,
            msg: msg.msgRegDeleteError,
          };
          return res.status(200).json(record);
        } else {
          const record = {
            success: true,
            msg: msg.msgRegDeleteSuccess,
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
  },
];

const getWeekDatesByNames = (referenceDate, targetDays = []) => {
  const base = moment(referenceDate).startOf("isoWeek"); // Monday
  const daysMap = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
    Saturday: 5,
    Sunday: 6,
  };

  return targetDays.map((dayName) =>
    base.clone().add(daysMap[dayName], "days").format("YYYY-MM-DD")
  );
};

const myNotification = [
  query("limit")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  query("offset")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { limit, offset } = req.query;
    const userId = CURRENT_USER_ID;
    try {
      const checkUser = await CommenService.checkUser(SITE_DB_NAME, userId);
      const notifications = await CommenService.getNotifications(
        SITE_DB_NAME,
        userId,
        checkUser,
        limit,
        offset
      );
      const notificationCount = await CommenService.getNotificationCount(
        SITE_DB_NAME,
        userId
      );
      const loadmore = notifications.length === parseInt(limit);
      return res.status(200).json({
        success: true,
        msg: ["data found"],
        data: { notifications, loadmore, notificationCount },
      });
    } catch (error) {
      logger.error("Database error in notifications application", {
        error: error.message,
      });
      const record = { success: true, msg: error.message, key: "error" };
      return res.status(500).json(record);
    }
  },
];
const myNotificationCount = async (req, res) => {
  if (!req.currentUser) {
    return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
  } else {
    const userId = CURRENT_USER_ID;
    try {
      const checkUser = await CommenService.checkUser(SITE_DB_NAME, userId);
      const notifications = await CommenService.getNotificationCount(
        SITE_DB_NAME,
        userId
      );
      return res.status(200).json({
        success: true,
        msg: ["data found"],
        data: { notificationCount: notifications.length, notifications },
      });
    } catch (error) {
      logger.error("Database error in notifications application", {
        error: error.message,
      });
      const record = { success: true, msg: error.message, key: "error" };
      return res.status(500).json(record);
    }
  }
};
const deleteNotification = [
  //  validation
  body("NotificationId")
    .trim()
    .exists()
    .withMessage(msg.msgNotificationIdReqired)
    .notEmpty()
    .withMessage(msg.msgNotificationIdReqired),
  body("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { NotificationId, deleteFlag } = req.body;

      const checkNotificationId = await CommenService.checkNotification(
        SITE_DB_NAME,
        NotificationId
      );
      if (checkNotificationId === 0) {
        const record = {
          success: false,
          msg: msg.msgNotificationIdNotExist,
        };
        return res.status(200).json(record);
      }

      try {
        const NotificationStatus = await CommenService.deleteNotification(
          SITE_DB_NAME,
          NotificationId,
          deleteFlag
        );
        if (NotificationStatus === 0) {
          const record = {
            success: false,
            msg: msg.msgNotificationDeleteError,
          };
          return res.status(200).json(record);
        } else {
          const record = {
            success: true,
            msg: msg.msgNotificationDeleteSuccess,
            data: { Notification: NotificationStatus },
          };
          return res.status(200).json(record);
        }
      } catch (error) {
        logger.error("Database error in Notification", { error });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in Notification", { error });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const readNotification = [
  //  validation
  body("notificationId")
    .trim()
    .exists()
    .withMessage(msg.msgNotificationIdReqired)
    .notEmpty()
    .withMessage(msg.msgNotificationIdReqired),
  body("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { notificationId, deleteFlag } = req.body;

      const checkNotificationId = await CommenService.checkNotification(
        SITE_DB_NAME,
        notificationId
      );
      if (checkNotificationId === 0) {
        const record = {
          success: false,
          msg: msg.msgNotificationIdNotExist,
        };
        return res.status(200).json(record);
      }

      try {
        const NotificationStatus = await CommenService.readNotification(
          SITE_DB_NAME,
          notificationId,
          deleteFlag
        );
        if (NotificationStatus === 0) {
          const record = {
            success: false,
            msg: msg.msgNotificationDeleteError,
          };
          return res.status(200).json(record);
        } else {
          const record = {
            success: true,
            msg: msg.msgNotificationDeleteSuccess,
            data: { Notification: NotificationStatus },
          };
          return res.status(200).json(record);
        }
      } catch (error) {
        logger.error("Database error in Notification", { error });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in Notification", { error });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const clearNotification = [
  body("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { deleteFlag } = req.body;
      const userId = CURRENT_USER_ID;
      try {
        const NotificationStatus = await CommenService.clearNotification(
          SITE_DB_NAME,
          userId,
          deleteFlag
        );
        if (NotificationStatus === 0) {
          const record = {
            success: false,
            msg: msg.msgNotificationDeleteError,
          };
          return res.status(200).json(record);
        } else {
          const record = {
            success: true,
            msg: msg.msgNotificationDeleteSuccess,
            data: { Notification: NotificationStatus },
          };
          return res.status(200).json(record);
        }
      } catch (error) {
        logger.error("Database error in Notification", { error });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in Notification", { error });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
//====================================== Compoff ===========================
const sendAnnouncement = [
  //  validation
  body("message")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("subject")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { message, subject } = req.body;
      const employeeIdsSend = req.body.employeeIds;
      const unitIdsSend = req.body.unitIds;
      const roleIdsSend = req.body.roleIds;

      const userId = CURRENT_USER_ID;
      const roleName = CURRENT_USER?.roleName;
      const reportingManager = CURRENT_USER?.reportingManagerId;
      const unitIds = CURRENT_USER?.unitId;
      const notifyUsers = await CommenService.getUsersByUnitIdsAndRoleAndUserId(
        SITE_DB_NAME,
        unitIdsSend,
        roleIdsSend,
        employeeIdsSend,
        roleName,
        unitIds,
        userId
      );

      const recipientIds = notifyUsers.map((user) => user._id);

      const APP_LOGO = process.env.APP_LOGO || "";
      const APP_SITE_URL = process.env.SITE_URL || "";
      const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
      const notiUserId = userId;
      const action = "announcement";
      const actionId = null;
      const titles = [subject, subject, subject, subject];
      const messages = [message, message, message, message];

      const actionJson = {
        actionId: actionId,
        action: action,
        option: {
          logoUrl: APP_LOGO,
          redirectionUrl: {
            webLink: APP_SITE_URL,
            deepLink: APP_DEEP_LINK_URL,
          },
          imageUrl: "",
          soundFile: "",
        },
        appType: "customer",
      };

      let notificationArr = [];

      async function addNotifications(notiOtherUserIds) {
        for (const notiOtherUserId of notiOtherUserIds) {
          const notification =
            await OneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson
            );
          if (notification !== "NA") {
            notificationArr.push(notification);
          }
        }
      }

      await addNotifications(recipientIds);
      let announcement = null;
      if (notificationArr.length > 0) {
        announcement = await OneSignalHelperUser.oneSignalNotificationSendCall(
          notificationArr
        );
      }

      const record = {
        success: true,
        msg: msg.msgNotificationSendSuccess,
        data: { announcement: announcement },
      };
      return res.status(200).json(record);
    } catch (error) {
      logger.error("Database error in Reg application 2", {
        error: error.message,
        key: 1,
      });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
// ==================================================  ==========================================
//====================================== Reimbursement ===========================
const addReimbursementRequest = [
  //  validation
  body("description")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("amount")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { date, description, amount, finalAmount } = req.body;
      let roleName,
        userId,
        unitIds,
        shift,
        uniqueId,
        religiousBreak,
        joiningDate,
        holidays,
        shiftId,
        name,
        monthlyExtraFreeMin,
        relievingDate,
        image,
        monthlyExtraWorkingDays,
        weekEnds,
        plannedLeaveApplyBeforeDays,
        reportingManager,
        sickLeaveDocumentDay;

      if ("userId" in req.body && req.body.userId) {
        userId = req?.body?.userId;
        const checkUser = await CommenService.checkUser(SITE_DB_NAME, userId);
        if (checkUser === "NA") {
        } else {
          const userDetails = await CommenService.getUserDetails(
            SITE_DB_NAME,
            checkUser._id
          );
          roleName = userDetails?.roleName;
          reportingManager = userDetails?.reportingManagerId;
          unitIds = userDetails?.unitId;
          name = userDetails?.name;
          uniqueId = userDetails?.uniqueId;
          image = userDetails?.image;
          religiousBreak = userDetails?.religiousBreak;
          joiningDate = userDetails?.joiningDate;
          holidays = userDetails?.holidays || [];
          shift = userDetails?.shiftDetails || null;
          monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
          plannedLeaveApplyBeforeDays = shift?.plannedLeaveApplyBeforeDays || 7;
          sickLeaveDocumentDay = shift?.sickLeaveDocumentDay || 2;
          weekEnds = shift?.weekEnds || [];
          shiftId = userDetails?.shiftId;
          relievingDate = userDetails?.relievingDate;
          monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin;
        }
      } else {
        userId = CURRENT_USER_ID;
        roleName = CURRENT_USER?.roleName;
        roleName = CURRENT_USER?.roleName;
        reportingManager = CURRENT_USER?.reportingManagerId;
        unitIds = CURRENT_USER?.unitId;
        uniqueId = CURRENT_USER?.uniqueId;
        name = CURRENT_USER?.name;
        image = CURRENT_USER?.image;
        religiousBreak = CURRENT_USER?.religiousBreak;
        joiningDate = CURRENT_USER?.joiningDate;
        holidays = CURRENT_USER?.holidays || [];
        shift = CURRENT_USER?.shiftDetails || null;
        plannedLeaveApplyBeforeDays = shift?.plannedLeaveApplyBeforeDays || 7;
        sickLeaveDocumentDay = shift?.sickLeaveDocumentDay || 2;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = CURRENT_USER?.shiftId;
        relievingDate = CURRENT_USER?.relievingDate;
        monthlyExtraFreeMin = CURRENT_USER?.shiftDetails?.monthlyExtraFreeMin;
      }
      if (!unitIds || unitIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist });
      }

      if (!userId) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUserNotExist });
      }

      try {
        let documents = [];

        if (!req.file) {
          documents = req?.files.map((file) => file?.key);
        } else if ("key" in req.file) {
          const filename = req.file.key;
          documents = filename;
        } else {
          documents = [];
        }
        const requestData = {
          userId: userId,
          unitId: unitIds,
          roleName: roleName,
          date: date,
          description,
          amount,
          finalAmount,
          documents: documents,
        };
        const requestAddStatus = await CommenService.addReimbursement(
          SITE_DB_NAME,
          requestData
        );
        if (requestAddStatus === "NA") {
          const record = {
            success: false,
            msg: msg.msgRegAddError,
          };
          return res.status(200).json(record);
        } else {
          const notifyUsers = await CommenService.getUsersByUnitIdsAndRole(
            SITE_DB_NAME,
            unitIds,
            roleName
          );

          const recipientIds = notifyUsers
            .filter((user) => {
              const isSuperAdmin = user.roleName === "Site-Owner";

              const isAdminWithMatchingUnit =
                user.roleName === "Admin" &&
                Array.isArray(user.unitId) &&
                user.unitId.some((id) =>
                  unitIds.some((unitId) => unitId.equals(id))
                ); //
              const isReportingManagerMatch =
                reportingManager &&
                user._id &&
                reportingManager.equals(user._id);

              return (
                isReportingManagerMatch ||
                isSuperAdmin ||
                isAdminWithMatchingUnit
              );
            })
            .map((user) => user._id);

          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const notiUserId = userId;
          const action = "rei_request";
          const actionId = requestAddStatus._id;
          const titles = msg.generateReiMessage("", "", "", "Created").title;
          const messages = msg.generateReiMessage(
            "",
            "",
            "",
            "Created"
          ).message;

          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };

          let notificationArr = [];

          async function addNotifications(notiOtherUserIds) {
            for (const notiOtherUserId of notiOtherUserIds) {
              const notification =
                await OneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson
                );
              if (notification !== "NA") {
                notificationArr.push(notification);
              }
            }
          }

          await addNotifications(recipientIds);

          if (notificationArr.length > 0) {
            await OneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr
            );
          }

          const record = {
            success: true,
            msg: msg.msgReiAddSuccess,
            data: { reimbursement: requestAddStatus },
          };
          return res.status(200).json(record);
        }
      } catch (error) {
        logger.error("Database error in add reimbursement application 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in add reimbursement application 2", {
        error: error.message,
        key: 1,
      });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
//====================================== Reimbursement ===========================
const editReimbursementRequest = [
  //  validation
  body("reimbursementId")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("userId")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("description")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("amount")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const {
        reimbursementId,
        userId,
        description,
        amount,
        finalAmount,
        date,
      } = req.body;
      let roleName,
        unitIds,
        shift,
        uniqueId,
        religiousBreak,
        joiningDate,
        holidays,
        shiftId,
        name,
        monthlyExtraFreeMin,
        relievingDate,
        image,
        monthlyExtraWorkingDays,
        weekEnds,
        plannedLeaveApplyBeforeDays,
        reportingManager,
        sickLeaveDocumentDay;

      if ("userId" in req.body && req.body.userId) {
        let userIdReq = req?.body?.userId;
        const checkUser = await CommenService.checkUser(
          SITE_DB_NAME,
          userIdReq
        );
        if (checkUser === "NA") {
        } else {
          const userDetails = await CommenService.getUserDetails(
            SITE_DB_NAME,
            checkUser._id
          );
          roleName = userDetails?.roleName;
          reportingManager = userDetails?.reportingManagerId;
          unitIds = userDetails?.unitId;
          name = userDetails?.name;
          uniqueId = userDetails?.uniqueId;
          image = userDetails?.image;
          religiousBreak = userDetails?.religiousBreak;
          joiningDate = userDetails?.joiningDate;
          holidays = userDetails?.holidays || [];
          shift = userDetails?.shiftDetails || null;
          monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
          plannedLeaveApplyBeforeDays = shift?.plannedLeaveApplyBeforeDays || 7;
          sickLeaveDocumentDay = shift?.sickLeaveDocumentDay || 2;
          weekEnds = shift?.weekEnds || [];
          shiftId = userDetails?.shiftId;
          relievingDate = userDetails?.relievingDate;
          monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin;
        }
      } else {
        reportingManager = CURRENT_USER?.reportingManagerId;
        roleName = CURRENT_USER?.roleName;
        unitIds = CURRENT_USER?.unitId;
        uniqueId = CURRENT_USER?.uniqueId;
        name = CURRENT_USER?.name;
        image = CURRENT_USER?.image;
        religiousBreak = CURRENT_USER?.religiousBreak;
        joiningDate = CURRENT_USER?.joiningDate;
        holidays = CURRENT_USER?.holidays || [];
        shift = CURRENT_USER?.shiftDetails || null;
        plannedLeaveApplyBeforeDays = shift?.plannedLeaveApplyBeforeDays || 7;
        sickLeaveDocumentDay = shift?.sickLeaveDocumentDay || 2;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = CURRENT_USER?.shiftId;
        relievingDate = CURRENT_USER?.relievingDate;
        monthlyExtraFreeMin = CURRENT_USER?.shiftDetails?.monthlyExtraFreeMin;
      }
      if (!unitIds || unitIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist });
      }

      if (!userId) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUserNotExist });
      }

      try {
        const requestCheckStatus = await CommenService.checkReimbursement(
          SITE_DB_NAME,
          reimbursementId
        );
        if (requestCheckStatus === "NA") {
          const record = {
            success: false,
            msg: msg.msgRegNotExist,
          };
          return res.status(200).json(record);
        }
       const currentDoc = requestCheckStatus?.documents || [];
       const removeDocs = req.body.oldDocuments || [];
       const oldDocs = (currentDoc || []).filter((doc) =>
         removeDocs.includes(doc)
       );
       const newDocs = (req.files || []).map((file) =>
         file.key ? file.key : `${req.folderName}/${file.filename}`
       );
       const documents = [...oldDocs, ...newDocs];

        const requestData = {
          amount: amount,
          finalAmount: finalAmount,
          description: description,
          documents: documents,
          date,
        };
        const requestUpdateStatus = await CommenService.editReimbursement(
          SITE_DB_NAME,
          reimbursementId,
          requestData
        );
        if (requestUpdateStatus === "NA") {
          const record = {
            success: false,
            msg: msg.msgRegUpdateError,
          };
          return res.status(200).json(record);
        } else {
          const notifyUsers = await CommenService.getUsersByUnitIdsAndRole(
            SITE_DB_NAME,
            unitIds,
            roleName
          );
          const recipientIds = notifyUsers
            .filter((user) => {
              const isSuperAdmin = user.roleName === "Site-Owner";

              const isAdminWithMatchingUnit =
                user.roleName === "Admin" &&
                Array.isArray(user.unitId) &&
                user.unitId.some((id) =>
                  unitIds.some((unitId) => unitId.equals(id))
                ); //
              const isReportingManagerMatch =
                reportingManager &&
                user._id &&
                reportingManager.equals(user._id);

              return (
                isReportingManagerMatch ||
                isSuperAdmin ||
                isAdminWithMatchingUnit
              );
            })
            .map((user) => user._id);
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const notiUserId = userId;
          const action = "rei_request";
          const actionId = reimbursementId;
          const titles = msg.generateReiMessage("", "", "", "Updated").title;
          const messages = msg.generateReiMessage(
            "",
            "",
            "",
            "Updated"
          ).message;

          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };

          let notificationArr = [];

          async function addNotifications(notiOtherUserIds) {
            for (const notiOtherUserId of notiOtherUserIds) {
              const notification =
                await OneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson
                );
              if (notification !== "NA") {
                notificationArr.push(notification);
              }
            }
          }

          await addNotifications(recipientIds);

          if (notificationArr.length > 0) {
            await OneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr
            );
          }

          const record = {
            success: true,
            msg: msg.msgReiUpdateSuccess,
            data: { reimbursement: requestUpdateStatus },
          };
          return res.status(200).json(record);
        }
      } catch (error) {
        logger.error("Database error in Reg application 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in Reg application 2", {
        error: error.message,
        key: 1,
      });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const cancelReimbursementRequest = [
  //  validation
  body("reimbursementId")
    .trim()
    .exists()
    .withMessage(msg.msgReimbursementIdReqired)
    .notEmpty()
    .withMessage(msg.msgReimbursementIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const userId = CURRENT_USER_ID;
    const currentName = CURRENT_USER?.name;
    const currentRoleName = CURRENT_USER?.roleName;
    if (!userId) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    }
    try {
      const { reimbursementId } = req.body;

      const checkReimbursement = await CommenService.checkReimbursement(
        SITE_DB_NAME,
        reimbursementId
      );
      if (checkReimbursement === 0) {
        const record = {
          success: false,
          msg: msg.msgRegNotExist,
        };
        return res.status(200).json(record);
      }
      let status = "Cancelled";
      let approvedBy = userId;
      let approvedAt = moment().format("YYYY-MM-DD HH:mm");
      try {
        const reimbursementStatus = await CommenService.cancelReimbursement(
          SITE_DB_NAME,
          reimbursementId,
          status,
          approvedBy,
          approvedAt,
          currentRoleName
        );
        if (reimbursementStatus === 0) {
          const record = {
            success: false,
            msg: msg.msgRegDeleteError,
          };
          return res.status(200).json(record);
        } else {
          try {
            if (checkReimbursement?.userId.toString() !== userId.toString()) {
              console.log(checkReimbursement?.userId, userId);
              const getUserDetails = await CommenService.getUserDetails(
                SITE_DB_NAME,
                checkReimbursement?.userId
              );
              const userName =
                getUserDetails !== "NA" ? getUserDetails.name : "NA";
              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const notiUserId = userId;
              const notiOtherUserId = checkReimbursement?.userId;
              const action = "rei_request";
              const actionId = reimbursementId;
              let titles = msg.generateReiMessage(
                userName,
                currentName,
                currentRoleName,
                "Cancelled"
              ).title;
              let messages = msg.generateReiMessage(
                userName,
                currentName,
                currentRoleName,
                "Cancelled"
              ).message;

              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };

              let notificationArr = [];

              const notification =
                await OneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson
                );
              if (notification !== "NA") {
                notificationArr.push(notification);
              }

              if (notificationArr.length > 0) {
                await OneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr
                );
              }
            }
            const record = {
              success: true,
              msg: msg.msgReiCancelledSuccess,
              data: { reimbursement: reimbursementStatus },
            };
            return res.status(200).json(record);
          } catch (error) {
            logger.error(
              "Database error in cancelReimbursement application 0",
              { error }
            );
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: error,
            };
            return res.status(500).json(record);
          }
        }
      } catch (error) {
        logger.error("Database error in cancelReimbursement application 1", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in cancelReimbursement application 2", {
        error,
      });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const myReimbursements = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  query("monthYear")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  query("selectionType")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag, monthYear, selectionType } = req.query;

    try {
      let userId,
        unitIds,
        uniqueId,
        religiousBreak,
        joiningDate,
        holidays,
        shift,
        shiftId,
        name,
        monthlyExtraFreeMin,
        relievingDate,
        image,
        monthlyExtraWorkingDays,
        weekEnds;
      let paidLeaveCount = 0;
      let paternityLeaveCount = 0;
      let maternityLeaveCount = 0;
      if ("userId" in req.query && req.query.userId) {
        let userIdReq = req?.query?.userId;
        const checkUser = await CommenService.checkUser(
          SITE_DB_NAME,
          userIdReq
        );
        if (checkUser === "NA") {
          userId = 0;
        }
        userId = checkUser._id;
        const userDetails = await CommenService.getUserDetails(
          SITE_DB_NAME,
          checkUser._id
        );

        unitIds = userDetails?.unitId;
        name = userDetails?.name;
        uniqueId = userDetails?.uniqueId;
        image = userDetails?.image;
        religiousBreak = userDetails?.religiousBreak;
        joiningDate = userDetails?.joiningDate;
        holidays = userDetails?.holidays || [];
        shift = userDetails?.shiftDetails || null;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = userDetails?.shiftId;
        relievingDate = userDetails?.relievingDate;
        monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin;
        paidLeaveCount = userDetails?.paidLeaveCount;
        paternityLeaveCount = userDetails?.paternityLeaveCount;
        maternityLeaveCount = userDetails?.maternityLeaveCount;
      } else {
        userId = CURRENT_USER_ID;
        unitIds = CURRENT_USER?.unitId;
        uniqueId = CURRENT_USER?.uniqueId;
        name = CURRENT_USER?.name;
        image = CURRENT_USER?.image;
        religiousBreak = CURRENT_USER?.religiousBreak;
        joiningDate = CURRENT_USER?.joiningDate;
        holidays = CURRENT_USER?.holidays || [];
        shift = CURRENT_USER?.shiftDetails || null;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = CURRENT_USER?.shiftId;
        relievingDate = CURRENT_USER?.relievingDate;
        monthlyExtraFreeMin = CURRENT_USER?.shiftDetails?.monthlyExtraFreeMin;
        paidLeaveCount = CURRENT_USER?.paidLeaveCount;
        paternityLeaveCount = CURRENT_USER?.paternityLeaveCount;
        maternityLeaveCount = CURRENT_USER?.maternityLeaveCount;
      }

      if (!unitIds || unitIds?.length === 0) {
        return res.status(200).json({
          success: false,
          msg: msg.msgUnitNotExist,
          reimbursements: [],
        });
      }

      const shiftIds = [shiftId];
      if (!shiftIds || shiftIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist });
      }
      if (!shift) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgShiftNotExist });
      }
      if (!Array.isArray(shiftIds) || !shiftIds || shiftIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgShiftNotExist });
      }
      const pagination = {
        pageSize: parseInt(req.query.pageSize) || 10,
        pageNumber: parseInt(req.query.pageNumber) || 1,
      };
      const { reimbursementCounts, reimbursements } =
        await CommenService.getMyReimbursements(
          SITE_DB_NAME,
          userId,
          selectionType,
          monthYear,
          Number(deleteFlag),
          pagination
        );
      if (reimbursements === "NA") {
        const record = {
          success: true,
          msg: ["data not found"],
          reimbursements: [],
        };
        return res.status(200).json(record);
      } else {
        const record = {
          success: true,
          msg: ["data found"],
          data: {
            reimbursements: reimbursements?.filter((item) => item !== null),
            name,
            uniqueId,
            reimbursementCounts: reimbursementCounts,
          },
        };
        return res.status(200).json(record);
      }
    } catch (error) {
      logger.error("Database error in reimbursements application", {
        error: error.message,
      });
      const record = { success: true, msg: error.message, key: "error" };
      return res.status(500).json(record);
    }
  },
];
const reimbursementRequests = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  query("monthYear")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  query("selectionType")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag, monthYear, selectionType } = req.query;

    try {
      let userId,
        unitIds,
        uniqueId,
        religiousBreak,
        joiningDate,
        holidays,
        shift,
        shiftId,
        name,
        monthlyExtraFreeMin,
        relievingDate,
        image,
        monthlyExtraWorkingDays,
        weekEnds,
        roleName;

      if ("userId" in req.query && req.query.userId) {
        let userIdReq = req?.query?.userId;
        const checkUser = await CommenService.checkUser(
          SITE_DB_NAME,
          userIdReq
        );
        if (checkUser === "NA") {
          userId = 0;
        }
        userId = checkUser._id;
        const userDetails = await CommenService.getUserDetails(
          SITE_DB_NAME,
          checkUser._id
        );

        unitIds = userDetails?.unitId;
        name = userDetails?.name;
        roleName = userDetails?.roleName;
        uniqueId = userDetails?.uniqueId;
        image = userDetails?.image;
        religiousBreak = userDetails?.religiousBreak;
        joiningDate = userDetails?.joiningDate;
        holidays = userDetails?.holidays || [];
        shift = userDetails?.shiftDetails || null;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = userDetails?.shiftId;
        relievingDate = userDetails?.relievingDate;
        monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin;
        paidLeaveCount = userDetails?.paidLeaveCount;
        paternityLeaveCount = userDetails?.paternityLeaveCount;
        maternityLeaveCount = userDetails?.maternityLeaveCount;
      } else {
        userId = CURRENT_USER_ID;
        unitIds = CURRENT_USER?.unitId;
        roleName = CURRENT_USER?.roleName;
        uniqueId = CURRENT_USER?.uniqueId;
        name = CURRENT_USER?.name;
        image = CURRENT_USER?.image;
        religiousBreak = CURRENT_USER?.religiousBreak;
        joiningDate = CURRENT_USER?.joiningDate;
        holidays = CURRENT_USER?.holidays || [];
        shift = CURRENT_USER?.shiftDetails || null;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = CURRENT_USER?.shiftId;
        relievingDate = CURRENT_USER?.relievingDate;
        monthlyExtraFreeMin = CURRENT_USER?.shiftDetails?.monthlyExtraFreeMin;
        paidLeaveCount = CURRENT_USER?.paidLeaveCount;
        paternityLeaveCount = CURRENT_USER?.paternityLeaveCount;
        maternityLeaveCount = CURRENT_USER?.maternityLeaveCount;
      }
      if (roleName !== "Site-Owner") {
        if (!unitIds || unitIds?.length === 0) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgUnitNotExist, leaves: [] });
        }

        const shiftIds = [shiftId];
        if (!shiftIds || shiftIds?.length === 0) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgUnitNotExist });
        }
        if (!shift) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgShiftNotExist });
        }
        if (!Array.isArray(shiftIds) || !shiftIds || shiftIds?.length === 0) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgShiftNotExist });
        }
      }

      const pagination = {
        pageSize: parseInt(req.query.pageSize) || 10,
        pageNumber: parseInt(req.query.pageNumber) || 1,
      };

      const unitId = req?.query?.unitId || "";

      if (unitId && unitId !== "all") {
        const checkUnitId = await CommenService.checkUnit(SITE_DB_NAME, unitId);
        unitIds = [checkUnitId];
      }

      const search = req.query.search || "";
      const { reimbursementCounts, reimbursements } =
        await CommenService.getReimbursementRequests(
          SITE_DB_NAME,
          userId,
          unitIds,
          roleName,
          selectionType,
          monthYear,
          Number(deleteFlag),
          pagination,
          search
        );

      return res.status(200).json({
        success: true,
        msg: ["data found"],
        data: {
          reimbursements: reimbursements.filter((item) => item !== null),
          reimbursementCounts: reimbursementCounts,
        },
      });
    } catch (error) {
      logger.error("Database error in reimbursements application", { error });
      const record = { success: true, msg: error.message, key: "error" };
      return res.status(500).json(record);
    }
  },
];

const approveRejectStatusReimbursementRequest = [
  //  validation
  body("reimbursementId")
    .trim()
    .exists()
    .withMessage(msg.msgReimbursementIdReqired)
    .notEmpty()
    .withMessage(msg.msgReimbursementIdReqired),
  body("status")
    .trim()
    .exists()
    .withMessage(msg.msgStatusReqired)
    .notEmpty()
    .withMessage(msg.msgStatusReqired),
  body("finalAmount")
    .trim()
    .exists()
    .withMessage(msg.msgStatusReqired)
    .notEmpty()
    .withMessage(msg.msgStatusReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const userId = CURRENT_USER_ID;
    const currentName = CURRENT_USER?.name;
    const currentRoleName = CURRENT_USER?.roleName;
    if (!userId) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    }

    try {
      const {
        reimbursementId,
        status,
        comment,
        finalAmount,
        paidStatus,
        paidMonth,
      } = req.body;

      const checkReimbursement = await CommenService.checkReimbursement(
        SITE_DB_NAME,
        reimbursementId
      );
      if (checkReimbursement === 0) {
        const record = {
          success: false,
          msg: msg.msgReiNotExist,
        };
        return res.status(200).json(record);
      }
      let approvedBy = userId;
      let approvedAt = moment().format("YYYY-MM-DD HH:mm");

      try {
        let updateData = {};
        if (currentRoleName === "Manager") {
          updateData = {
            managerApprovedBy: approvedBy,
            managerApprovedAt: approvedAt,
            managerApprovedComment: comment,
            managerApprovedStatus: status,
            finalAmount: finalAmount,
          };
          if (status === "Rejected") {
            updateData["status"] = status;
          }
        } else {
          updateData = {
            approvedBy,
            approvedAt,
            approvedComment: comment,
            approvedStatus: status,
            approvedRoleName: currentRoleName,
            status,
            finalAmount: finalAmount,
            paidMonth: paidMonth,
            paidStatus: paidStatus,
          };
        }
        const reimbursementStatus =
          await CommenService.approveRejectReimbursement(
            SITE_DB_NAME,
            reimbursementId,
            updateData
          );
        // const reimbursementStatus = 1;

        if (reimbursementStatus === 0) {
          const record = {
            success: false,
            msg: msg.msgRegUpdateError,
          };
          return res.status(200).json(record);
        } else {
          const getUserDetails = await CommenService.getUserDetails(
            SITE_DB_NAME,
            checkReimbursement?.userId
          );
          const userName = getUserDetails !== "NA" ? getUserDetails.name : "NA";
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const notiUserId = userId;
          const notiOtherUserId = checkReimbursement?.userId;
          const action = "rei_request";
          const actionId = reimbursementId;
          let titles = msg.generateReiMessage(
            userName,
            currentName,
            currentRoleName,
            "Rejected"
          ).title;
          let messages = msg.generateReiMessage(
            userName,
            currentName,
            currentRoleName,
            "Rejected"
          ).message;
          if (status === "Approved") {
            titles = msg.generateReiMessage(
              userName,
              currentName,
              currentRoleName,
              "Approved"
            ).title;
            messages = msg.generateReiMessage(
              userName,
              currentName,
              currentRoleName,
              "Approved"
            ).message;
          }
          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };

          let notificationArr = [];

          const notification =
            await OneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson
            );
          if (notification !== "NA") {
            notificationArr.push(notification);
          }

          if (notificationArr.length > 0) {
            await OneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr
            );
          }
          if (status === "Approved") {
            if (currentRoleName === "Manager") {
              const record = {
                success: true,
                msg: msg.msgReiApprovedSuccess,
                data: { reimbursement: reimbursementStatus },
              };
              return res.status(200).json(record);
            } else {
              const record = {
                success: true,
                msg: msg.msgReiApprovedSuccess,
                data: { reimbursement: reimbursementStatus },
              };
              return res.status(200).json(record);
            }
          } else {
            const record = {
              success: true,
              msg: msg.msgReiRejectedSuccess,
              data: { reimbursement: reimbursementStatus },
            };
            return res.status(200).json(record);
          }
        }
      } catch (error) {
        logger.error("Database error in reimbursement application 4", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in reimbursement application 4", {
        error,
      });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const updatePayStatusReimbursementRequest = [
  //  validation
  body("reimbursementId")
    .trim()
    .exists()
    .withMessage(msg.msgReimbursementIdReqired)
    .notEmpty()
    .withMessage(msg.msgReimbursementIdReqired),
  body("paidMonth")
    .trim()
    .exists()
    .withMessage(msg.msgStatusReqired)
    .notEmpty()
    .withMessage(msg.msgStatusReqired),
  body("paidStatus")
    .trim()
    .exists()
    .withMessage(msg.msgStatusReqired)
    .notEmpty()
    .withMessage(msg.msgStatusReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const userId = CURRENT_USER_ID;
    const currentName = CURRENT_USER?.name;
    const currentRoleName = CURRENT_USER?.roleName;
    if (!userId) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    }

    try {
      const { reimbursementId, paidStatus, paidMonth } = req.body;

      const checkReimbursement = await CommenService.checkReimbursement(
        SITE_DB_NAME,
        reimbursementId
      );
      if (checkReimbursement === 0) {
        const record = {
          success: false,
          msg: msg.msgReiNotExist,
        };
        return res.status(200).json(record);
      }
      let approvedBy = userId;
      let approvedAt = moment().format("YYYY-MM-DD HH:mm");

      try {
        let updateData = {};

        updateData = {
          approvedBy,
          approvedAt,
          paidMonth: paidMonth,
          paidStatus: paidStatus,
        };

        const reimbursementStatus =
          await CommenService.approveRejectReimbursement(
            SITE_DB_NAME,
            reimbursementId,
            updateData
          );

        if (reimbursementStatus === 0) {
          const record = {
            success: false,
            msg: msg.msgRegUpdateError,
          };
          return res.status(200).json(record);
        }
        const getUserDetails = await CommenService.getUserDetails(
          SITE_DB_NAME,
          checkReimbursement?.userId
        );
        const userName = getUserDetails !== "NA" ? getUserDetails.name : "NA";
        const APP_LOGO = process.env.APP_LOGO || "";
        const APP_SITE_URL = process.env.SITE_URL || "";
        const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
        const notiUserId = userId;
        const notiOtherUserId = checkReimbursement?.userId;
        const action = "rei_request";
        const actionId = reimbursementId;
        let titles = msg.generateReiMessage(
          userName,
          currentName,
          currentRoleName,
          "Updated"
        ).title;
        let messages = msg.generateReiMessage(
          userName,
          currentName,
          currentRoleName,
          "Updated"
        ).message;

        const actionJson = {
          actionId: actionId,
          action: action,
          option: {
            logoUrl: APP_LOGO,
            redirectionUrl: {
              webLink: APP_SITE_URL,
              deepLink: APP_DEEP_LINK_URL,
            },
            imageUrl: "",
            soundFile: "",
          },
          appType: "customer",
        };

        let notificationArr = [];

        const notification = await OneSignalHelperUser.getNotificationArrSingle(
          SITE_DB_NAME,
          notiUserId,
          notiOtherUserId,
          action,
          actionId,
          titles,
          messages,
          actionJson
        );
        if (notification !== "NA") {
          notificationArr.push(notification);
        }

        if (notificationArr.length > 0) {
          await OneSignalHelperUser.oneSignalNotificationSendCall(
            notificationArr
          );
        }

        const record = {
          success: true,
          msg: msg.msgReiUpdateSuccess,
          data: { reimbursement: reimbursementStatus },
        };
        return res.status(200).json(record);
      } catch (error) {
        logger.error("Database error in reimbursement application 4", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in reimbursement application 4", {
        error,
      });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const deleteReimbursement = [
  //  validation
  query("reimbursementId")
    .trim()
    .exists()
    .withMessage(msg.msgReimbursementIdReqired)
    .notEmpty()
    .withMessage(msg.msgReimbursementIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { reimbursementId } = req.query;

      const checkReimbursement = await CommenService.checkReimbursement(
        SITE_DB_NAME,
        reimbursementId
      );
      if (checkReimbursement === 0) {
        const record = {
          success: false,
          msg: msg.msgReiNotExist,
        };
        return res.status(200).json(record);
      }

      try {
        const reimbursementStatus = await CommenService.deleteCompoff(
          SITE_DB_NAME,
          reimbursementId
        );
        if (reimbursementStatus === 0) {
          const record = {
            success: false,
            msg: msg.msgRegDeleteError,
          };
          return res.status(200).json(record);
        } else {
          const record = {
            success: true,
            msg: msg.msgRegDeleteSuccess,
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
  },
];
//====================================== Incentive ===========================
const addIncentiveRequest = [
  //  validation
  body("description")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("amount")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("finalAmount")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("levelName")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("lable")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("fulllable")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("shiftIdIncentivePolicy")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("shiftIncentivePolicyId")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  // body("incentivePolicyId")
  //   .trim()
  //   .exists()
  //   .withMessage(msg.msgAllFieldReqired)
  //   .notEmpty()
  //   .withMessage(msg.msgAllFieldReqired),
  body("targetAchieved")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const {
        date,
        description,
        amount,
        finalAmount,
        targetAchieved,
        shiftIncentivePolicyId,
        // incentivePolicyId,
        shiftIdIncentivePolicy,
        fulllable,
        lable,
        levelName,
        descriptionPolicy,
        documentPolicy,
        clientName,
        projectName,
      } = req.body;
      let roleName,
        userId,
        unitIds,
        shift,
        uniqueId,
        religiousBreak,
        joiningDate,
        holidays,
        shiftId,
        name,
        monthlyExtraFreeMin,
        relievingDate,
        image,
        monthlyExtraWorkingDays,
        weekEnds,
        plannedLeaveApplyBeforeDays,
        reportingManager,
        sickLeaveDocumentDay;

      if ("userId" in req.body && req.body.userId) {
        userId = req?.body?.userId;
        const checkUser = await CommenService.checkUser(SITE_DB_NAME, userId);
        if (checkUser === "NA") {
        } else {
          const userDetails = await CommenService.getUserDetails(
            SITE_DB_NAME,
            checkUser._id
          );
          roleName = userDetails?.roleName;
          reportingManager = userDetails?.reportingManagerId;
          unitIds = userDetails?.unitId;
          name = userDetails?.name;
          uniqueId = userDetails?.uniqueId;
          image = userDetails?.image;
          religiousBreak = userDetails?.religiousBreak;
          joiningDate = userDetails?.joiningDate;
          holidays = userDetails?.holidays || [];
          shift = userDetails?.shiftDetails || null;
          monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
          plannedLeaveApplyBeforeDays = shift?.plannedLeaveApplyBeforeDays || 7;
          sickLeaveDocumentDay = shift?.sickLeaveDocumentDay || 2;
          weekEnds = shift?.weekEnds || [];
          shiftId = userDetails?.shiftId;
          relievingDate = userDetails?.relievingDate;
          monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin;
        }
      } else {
        userId = CURRENT_USER_ID;
        roleName = CURRENT_USER?.roleName;
        roleName = CURRENT_USER?.roleName;
        reportingManager = CURRENT_USER?.reportingManagerId;
        unitIds = CURRENT_USER?.unitId;
        uniqueId = CURRENT_USER?.uniqueId;
        name = CURRENT_USER?.name;
        image = CURRENT_USER?.image;
        religiousBreak = CURRENT_USER?.religiousBreak;
        joiningDate = CURRENT_USER?.joiningDate;
        holidays = CURRENT_USER?.holidays || [];
        shift = CURRENT_USER?.shiftDetails || null;
        plannedLeaveApplyBeforeDays = shift?.plannedLeaveApplyBeforeDays || 7;
        sickLeaveDocumentDay = shift?.sickLeaveDocumentDay || 2;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = CURRENT_USER?.shiftId;
        relievingDate = CURRENT_USER?.relievingDate;
        monthlyExtraFreeMin = CURRENT_USER?.shiftDetails?.monthlyExtraFreeMin;
      }
      if (!unitIds || unitIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist });
      }

      if (!userId) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUserNotExist });
      }

      try {
        let documents = [];

        if (req?.files) {
          documents = req?.files.map((file) => file?.key);
        }

        let { incentive } = req.body;
        if (typeof incentive === "string") {
          try {
            incentive = JSON.parse(incentive);
          } catch (e) {
            const record = {
              success: false,
              msg: msg.msgInvalidJSONIncentive,
              key: "incentive",
            };
            return res.status(200).json(record);
          }
        }

        const requestData = {
          userId: userId,
          unitId: unitIds,
          roleName: roleName,
          date,
          description,
          amount,
          finalAmount,
          documents,
          targetAchieved,
          shiftIncentivePolicyId,
          // incentivePolicyId,
          shiftId: shiftIdIncentivePolicy,
          fulllable,
          lable,
          levelName,
          descriptionPolicy,
          documentPolicy,
          incentive,
          clientName,
          projectName,
        };
        const requestAddStatus = await CommenService.addIncentive(
          SITE_DB_NAME,
          requestData
        );
        if (requestAddStatus === "NA") {
          const record = {
            success: false,
            msg: msg.msgRegAddError,
          };
          return res.status(200).json(record);
        } else {
          const notifyUsers = await CommenService.getUsersByUnitIdsAndRole(
            SITE_DB_NAME,
            unitIds,
            roleName
          );

          const recipientIds = notifyUsers
            .filter((user) => {
              const isSiteOwner = user.roleName === "Site-Owner";

              const isAdminWithMatchingUnit =
                user.roleName === "Admin" &&
                Array.isArray(user.unitId) &&
                user.unitId.some((id) =>
                  unitIds.some((unitId) => unitId.equals(id))
                ); //
              const isReportingManagerMatch =
                reportingManager &&
                user._id &&
                reportingManager.equals(user._id);

              return (
                isReportingManagerMatch ||
                isSiteOwner ||
                isAdminWithMatchingUnit
              );
            })
            ?.map((user) => user._id);

          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const notiUserId = userId;
          const action = "incentive_request";
          const actionId = requestAddStatus._id;
          const titles = msg.generateIncentiveMessage(
            "",
            "",
            "",
            "Created"
          ).title;
          const messages = msg.generateIncentiveMessage(
            "",
            "",
            "",
            "Created"
          ).message;

          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };

          let notificationArr = [];

          async function addNotifications(notiOtherUserIds) {
            for (const notiOtherUserId of notiOtherUserIds) {
              const notification =
                await OneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson
                );
              if (notification !== "NA") {
                notificationArr.push(notification);
              }
            }
          }

          await addNotifications(recipientIds);

          if (notificationArr.length > 0) {
            await OneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr
            );
          }

          const record = {
            success: true,
            msg: msg.msgIncentiveAddSuccess,
            data: { incentive: requestAddStatus },
          };
          return res.status(200).json(record);
        }
      } catch (error) {
        logger.error("Database error in Reg application 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in Reg application 2", {
        error: error.message,
        key: 1,
      });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
//====================================== Incentive ===========================
const editIncentiveRequest = [
  //  validation
  body("incentiveId")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("userId")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("description")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("amount")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const {
        incentiveId,
        userId,
        date,
        description,
        amount,
        finalAmount,
        targetAchieved,
        shiftIncentivePolicyId,
        incentivePolicyId,
        shiftIdIncentivePolicy,
        fulllable,
        lable,
        levelName,
        descriptionPolicy,
        documentPolicy,
        clientName,
        projectName,
      } = req.body;
      let roleName,
        unitIds,
        shift,
        uniqueId,
        religiousBreak,
        joiningDate,
        holidays,
        shiftId,
        name,
        monthlyExtraFreeMin,
        relievingDate,
        image,
        monthlyExtraWorkingDays,
        weekEnds,
        plannedLeaveApplyBeforeDays,
        reportingManager,
        sickLeaveDocumentDay;

      if ("userId" in req.body && req.body.userId) {
        let userIdReq = req?.body?.userId;
        const checkUser = await CommenService.checkUser(
          SITE_DB_NAME,
          userIdReq
        );
        if (checkUser === "NA") {
        } else {
          const userDetails = await CommenService.getUserDetails(
            SITE_DB_NAME,
            checkUser._id
          );
          roleName = userDetails?.roleName;
          reportingManager = userDetails?.reportingManagerId;
          unitIds = userDetails?.unitId;
          name = userDetails?.name;
          uniqueId = userDetails?.uniqueId;
          image = userDetails?.image;
          religiousBreak = userDetails?.religiousBreak;
          joiningDate = userDetails?.joiningDate;
          holidays = userDetails?.holidays || [];
          shift = userDetails?.shiftDetails || null;
          monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
          plannedLeaveApplyBeforeDays = shift?.plannedLeaveApplyBeforeDays || 7;
          sickLeaveDocumentDay = shift?.sickLeaveDocumentDay || 2;
          weekEnds = shift?.weekEnds || [];
          shiftId = userDetails?.shiftId;
          relievingDate = userDetails?.relievingDate;
          monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin;
        }
      } else {
        reportingManager = CURRENT_USER?.reportingManagerId;
        roleName = CURRENT_USER?.roleName;
        unitIds = CURRENT_USER?.unitId;
        uniqueId = CURRENT_USER?.uniqueId;
        name = CURRENT_USER?.name;
        image = CURRENT_USER?.image;
        religiousBreak = CURRENT_USER?.religiousBreak;
        joiningDate = CURRENT_USER?.joiningDate;
        holidays = CURRENT_USER?.holidays || [];
        shift = CURRENT_USER?.shiftDetails || null;
        plannedLeaveApplyBeforeDays = shift?.plannedLeaveApplyBeforeDays || 7;
        sickLeaveDocumentDay = shift?.sickLeaveDocumentDay || 2;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = CURRENT_USER?.shiftId;
        relievingDate = CURRENT_USER?.relievingDate;
        monthlyExtraFreeMin = CURRENT_USER?.shiftDetails?.monthlyExtraFreeMin;
      }
      if (!unitIds || unitIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist });
      }

      if (!userId) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUserNotExist });
      }

      let { incentive } = req.body;
      if (typeof incentive === "string") {
        try {
          incentive = JSON.parse(incentive);
        } catch (e) {
          const record = {
            success: false,
            msg: msg.msgInvalidJSONIncentive,
            key: "incentive",
          };
          return res.status(200).json(record);
        }
      }

      try {
        const requestCheckStatus = await CommenService.checkIncentive(
          SITE_DB_NAME,
          incentiveId
        );
        if (requestCheckStatus === "NA") {
          const record = {
            success: false,
            msg: msg.msgRegNotExist,
          };
          return res.status(200).json(record);
        }

        const currentDoc = requestCheckStatus?.documents || [];
        const removeDocs = req.body.oldDocuments || [];
        const oldDocs = (currentDoc || []).filter((doc) =>
          removeDocs.includes(doc)
        );
        const newDocs = (req.files || []).map((file) =>
          file.key ? file.key : `${req.folderName}/${file.filename}`
        );
        const documents = [...oldDocs, ...newDocs];

        const requestData = {
          date,
          description,
          amount,
          finalAmount,
          documents,
          targetAchieved,
          shiftIncentivePolicyId,
          incentivePolicyId,
          shiftId: shiftIdIncentivePolicy,
          fulllable,
          lable,
          levelName,
          descriptionPolicy,
          documentPolicy,
          incentive,
          clientName,
          projectName,
        };
        const requestUpdateStatus = await CommenService.editIncentive(
          SITE_DB_NAME,
          incentiveId,
          requestData
        );
        if (requestUpdateStatus === "NA") {
          const record = {
            success: false,
            msg: msg.msgRegUpdateError,
          };
          return res.status(200).json(record);
        } else {
          const notifyUsers = await CommenService.getUsersByUnitIdsAndRole(
            SITE_DB_NAME,
            unitIds,
            roleName
          );
          const recipientIds = notifyUsers
            .filter((user) => {
              const isSiteOwner = user.roleName === "Site-Owner";

              const isAdminWithMatchingUnit =
                user.roleName === "Admin" &&
                Array.isArray(user.unitId) &&
                user.unitId.some((id) =>
                  unitIds.some((unitId) => unitId.equals(id))
                ); //
              const isReportingManagerMatch =
                reportingManager &&
                user._id &&
                reportingManager.equals(user._id);

              return (
                isReportingManagerMatch ||
                isSiteOwner ||
                isAdminWithMatchingUnit
              );
            })
            .map((user) => user._id);
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const notiUserId = userId;
          const action = "incentive_request";
          const actionId = incentiveId;
          const titles = msg.generateIncentiveMessage(
            "",
            "",
            "",
            "Updated"
          ).title;
          const messages = msg.generateIncentiveMessage(
            "",
            "",
            "",
            "Updated"
          ).message;

          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };

          let notificationArr = [];

          async function addNotifications(notiOtherUserIds) {
            for (const notiOtherUserId of notiOtherUserIds) {
              const notification =
                await OneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson
                );
              if (notification !== "NA") {
                notificationArr.push(notification);
              }
            }
          }

          await addNotifications(recipientIds);

          if (notificationArr.length > 0) {
            await OneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr
            );
          }

          const record = {
            success: true,
            msg: msg.msgIncentiveUpdateSuccess,
            data: { incentive: requestUpdateStatus },
          };
          return res.status(200).json(record);
        }
      } catch (error) {
        logger.error("Database error in Reg application 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in Reg application 2", {
        error: error.message,
        key: 1,
      });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const cancelIncentiveRequest = [
  //  validation
  body("incentiveId")
    .trim()
    .exists()
    .withMessage(msg.msgIncentiveIdReqired)
    .notEmpty()
    .withMessage(msg.msgIncentiveIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const userId = CURRENT_USER_ID;
    const currentName = CURRENT_USER?.name;
    const currentRoleName = CURRENT_USER?.roleName;
    if (!userId) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    }
    try {
      const { incentiveId } = req.body;

      const checkIncentive = await CommenService.checkIncentive(
        SITE_DB_NAME,
        incentiveId
      );
      if (checkIncentive === 0) {
        const record = {
          success: false,
          msg: msg.msgRegNotExist,
        };
        return res.status(200).json(record);
      }
      let status = "Cancelled";
      let approvedBy = userId;
      let approvedAt = moment().format("YYYY-MM-DD HH:mm");
      try {
        const incentiveStatus = await CommenService.cancelIncentive(
          SITE_DB_NAME,
          incentiveId,
          status,
          approvedBy,
          approvedAt,
          currentRoleName
        );
        if (incentiveStatus === 0) {
          const record = {
            success: false,
            msg: msg.msgRegDeleteError,
          };
          return res.status(200).json(record);
        } else {
          try {
            if (checkIncentive?.userId.toString() !== userId.toString()) {
              console.log(checkIncentive?.userId, userId);
              const getUserDetails = await CommenService.getUserDetails(
                SITE_DB_NAME,
                checkIncentive?.userId
              );
              const userName =
                getUserDetails !== "NA" ? getUserDetails.name : "NA";
              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const notiUserId = userId;
              const notiOtherUserId = checkIncentive?.userId;
              const action = "incentive_request";
              const actionId = incentiveId;
              let titles = msg.generateIncentiveMessage(
                userName,
                currentName,
                currentRoleName,
                "Cancelled"
              ).title;
              let messages = msg.generateIncentiveMessage(
                userName,
                currentName,
                currentRoleName,
                "Cancelled"
              ).message;

              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };

              let notificationArr = [];

              const notification =
                await OneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson
                );
              if (notification !== "NA") {
                notificationArr.push(notification);
              }

              if (notificationArr.length > 0) {
                await OneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr
                );
              }
            }
            const record = {
              success: true,
              msg: msg.msgIncentiveCancelledSuccess,
              data: { incentive: incentiveStatus },
            };
            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in cancelIncentive application 0", {
              error,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: error,
            };
            return res.status(500).json(record);
          }
        }
      } catch (error) {
        logger.error("Database error in cancelIncentive application 1", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in cancelIncentive application 2", {
        error,
      });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];

const deleteIncentive = [
  //  validation
  query("incentiveId")
    .trim()
    .exists()
    .withMessage(msg.msgIncentiveIdReqired)
    .notEmpty()
    .withMessage(msg.msgIncentiveIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { incentiveId } = req.query;

      const checkIncentive = await CommenService.checkIncentive(
        SITE_DB_NAME,
        incentiveId
      );
      if (checkIncentive === 0) {
        const record = {
          success: false,
          msg: msg.msgRegNotExist,
        };
        return res.status(200).json(record);
      }

      try {
        const incentiveStatus = await CommenService.deleteIncentive(
          SITE_DB_NAME,
          incentiveId
        );
        if (incentiveStatus === 0) {
          const record = {
            success: false,
            msg: msg.msgIncentiveDeleteError,
          };
          return res.status(200).json(record);
        } else {
          const record = {
            success: true,
            msg: msg.msgIncentiveDeleteSuccess,
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
  },
];
const myIncentives = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  query("monthYear")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  query("selectionType")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag, monthYear, selectionType } = req.query;

    try {
      let userId,
        unitIds,
        uniqueId,
        religiousBreak,
        joiningDate,
        holidays,
        shift,
        shiftId,
        name,
        monthlyExtraFreeMin,
        relievingDate,
        image,
        monthlyExtraWorkingDays,
        weekEnds;
      let paidLeaveCount = 0;
      let paternityLeaveCount = 0;
      let maternityLeaveCount = 0;
      if ("userId" in req.query && req.query.userId) {
        let userIdReq = req?.query?.userId;
        const checkUser = await CommenService.checkUser(
          SITE_DB_NAME,
          userIdReq
        );
        if (checkUser === "NA") {
          userId = 0;
        }
        userId = checkUser._id;
        const userDetails = await CommenService.getUserDetails(
          SITE_DB_NAME,
          checkUser._id
        );

        unitIds = userDetails?.unitId;
        name = userDetails?.name;
        uniqueId = userDetails?.uniqueId;
        image = userDetails?.image;
        religiousBreak = userDetails?.religiousBreak;
        joiningDate = userDetails?.joiningDate;
        holidays = userDetails?.holidays || [];
        shift = userDetails?.shiftDetails || null;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = userDetails?.shiftId;
        relievingDate = userDetails?.relievingDate;
        monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin;
        paidLeaveCount = userDetails?.paidLeaveCount;
        paternityLeaveCount = userDetails?.paternityLeaveCount;
        maternityLeaveCount = userDetails?.maternityLeaveCount;
      } else {
        userId = CURRENT_USER_ID;
        unitIds = CURRENT_USER?.unitId;
        uniqueId = CURRENT_USER?.uniqueId;
        name = CURRENT_USER?.name;
        image = CURRENT_USER?.image;
        religiousBreak = CURRENT_USER?.religiousBreak;
        joiningDate = CURRENT_USER?.joiningDate;
        holidays = CURRENT_USER?.holidays || [];
        shift = CURRENT_USER?.shiftDetails || null;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = CURRENT_USER?.shiftId;
        relievingDate = CURRENT_USER?.relievingDate;
        monthlyExtraFreeMin = CURRENT_USER?.shiftDetails?.monthlyExtraFreeMin;
        paidLeaveCount = CURRENT_USER?.paidLeaveCount;
        paternityLeaveCount = CURRENT_USER?.paternityLeaveCount;
        maternityLeaveCount = CURRENT_USER?.maternityLeaveCount;
      }

      if (!unitIds || unitIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist, incentives: [] });
      }

      const shiftIds = [shiftId];
      if (!shiftIds || shiftIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist });
      }

      if (!shift) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgShiftNotExist });
      }
      if (!Array.isArray(shiftIds) || !shiftIds || shiftIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgShiftNotExist });
      }
      const pagination = {
        pageSize: parseInt(req.query.pageSize) || 10,
        pageNumber: parseInt(req.query.pageNumber) || 1,
      };
      const { incentiveCounts, incentives } =
        await CommenService.getMyIncentives(
          SITE_DB_NAME,
          userId,
          selectionType,
          monthYear,
          Number(deleteFlag),
          pagination
        );
      const record = {
        success: true,
        msg: ["data found"],
        data: {
          incentives: incentives?.filter((item) => item !== null),
          name,
          uniqueId,
          incentiveCounts: incentiveCounts,
        },
      };
      return res.status(200).json(record);
    } catch (error) {
      logger.error("Database error in incentives application", {
        error: error.message,
      });
      const record = { success: true, msg: error.message, key: "error" };
      return res.status(500).json(record);
    }
  },
];
const incentiveRequests = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  query("monthYear")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  query("selectionType")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag, monthYear, selectionType } = req.query;

    try {
      let userId,
        unitIds,
        uniqueId,
        religiousBreak,
        joiningDate,
        holidays,
        shift,
        shiftId,
        name,
        monthlyExtraFreeMin,
        relievingDate,
        image,
        monthlyExtraWorkingDays,
        weekEnds,
        roleName;

      if ("userId" in req.query && req.query.userId) {
        let userIdReq = req?.query?.userId;
        const checkUser = await CommenService.checkUser(
          SITE_DB_NAME,
          userIdReq
        );
        if (checkUser === "NA") {
          userId = 0;
        }
        userId = checkUser._id;
        const userDetails = await CommenService.getUserDetails(
          SITE_DB_NAME,
          checkUser._id
        );

        unitIds = userDetails?.unitId;
        name = userDetails?.name;
        roleName = userDetails?.roleName;
        uniqueId = userDetails?.uniqueId;
        image = userDetails?.image;
        religiousBreak = userDetails?.religiousBreak;
        joiningDate = userDetails?.joiningDate;
        holidays = userDetails?.holidays || [];
        shift = userDetails?.shiftDetails || null;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = userDetails?.shiftId;
        relievingDate = userDetails?.relievingDate;
        monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin;
        paidLeaveCount = userDetails?.paidLeaveCount;
        paternityLeaveCount = userDetails?.paternityLeaveCount;
        maternityLeaveCount = userDetails?.maternityLeaveCount;
      } else {
        userId = CURRENT_USER_ID;
        unitIds = CURRENT_USER?.unitId;
        roleName = CURRENT_USER?.roleName;
        uniqueId = CURRENT_USER?.uniqueId;
        name = CURRENT_USER?.name;
        image = CURRENT_USER?.image;
        religiousBreak = CURRENT_USER?.religiousBreak;
        joiningDate = CURRENT_USER?.joiningDate;
        holidays = CURRENT_USER?.holidays || [];
        shift = CURRENT_USER?.shiftDetails || null;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = CURRENT_USER?.shiftId;
        relievingDate = CURRENT_USER?.relievingDate;
        monthlyExtraFreeMin = CURRENT_USER?.shiftDetails?.monthlyExtraFreeMin;
        paidLeaveCount = CURRENT_USER?.paidLeaveCount;
        paternityLeaveCount = CURRENT_USER?.paternityLeaveCount;
        maternityLeaveCount = CURRENT_USER?.maternityLeaveCount;
      }

      const shiftIds = [shiftId];
      if (!shiftIds || shiftIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist });
      }
      if (!shift) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgShiftNotExist });
      }
      if (!Array.isArray(shiftIds) || !shiftIds || shiftIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgShiftNotExist });
      }

      const pagination = {
        pageSize: parseInt(req.query.pageSize) || 10,
        pageNumber: parseInt(req.query.pageNumber) || 1,
      };

      const unitId = req?.query?.unitId || "";

      if (unitId && unitId !== "all") {
        const checkUnitId = await CommenService.checkUnit(SITE_DB_NAME, unitId);
        unitIds = [checkUnitId];
      }

      const search = req.query.search || "";
      const { incentiveCounts, incentives } =
        await CommenService.getIncentiveRequests(
          SITE_DB_NAME,
          userId,
          unitIds,
          roleName,
          selectionType,
          monthYear,
          Number(deleteFlag),
          pagination,
          search
        );
      return res.status(200).json({
        success: true,
        msg: ["data found"],
        data: {
          incentives: incentives.filter((item) => item !== null),
          incentiveCounts: incentiveCounts,
        },
      });
    } catch (error) {
      logger.error("Database error in incentives application", { error });
      const record = { success: true, msg: error.message, key: "error" };
      return res.status(500).json(record);
    }
  },
];
const approveRejectStatusIncentiveRequest = [
  //  validation
  body("incentiveId")
    .trim()
    .exists()
    .withMessage(msg.msgIncentiveIdReqired)
    .notEmpty()
    .withMessage(msg.msgIncentiveIdReqired),
  body("status")
    .trim()
    .exists()
    .withMessage(msg.msgStatusReqired)
    .notEmpty()
    .withMessage(msg.msgStatusReqired),
  body("finalAmount")
    .trim()
    .exists()
    .withMessage(msg.msgStatusReqired)
    .notEmpty()
    .withMessage(msg.msgStatusReqired),
  body("targetAchieved")
    .trim()
    .exists()
    .withMessage(msg.msgStatusReqired)
    .notEmpty()
    .withMessage(msg.msgStatusReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const userId = CURRENT_USER_ID;
    const currentName = CURRENT_USER?.name;
    const currentRoleName = CURRENT_USER?.roleName;
    if (!userId) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    }

    try {
      const {
        incentiveId,
        status,
        comment,
        finalAmount,
        targetAchieved,
        clientName,
        projectName,
        paidStatus,
        paidMonth,
      } = req.body;

      const checkIncentive = await CommenService.checkIncentive(
        SITE_DB_NAME,
        incentiveId
      );
      if (checkIncentive === 0) {
        const record = {
          success: false,
          msg: msg.msgIncentiveNotExist,
        };
        return res.status(200).json(record);
      }
      let approvedBy = userId;
      let approvedAt = moment().format("YYYY-MM-DD HH:mm");

      try {
        let updateData = {};
        if (currentRoleName === "Manager") {
          updateData =
            status !== "Rejected"
              ? {
                  managerApprovedBy: approvedBy,
                  managerApprovedAt: approvedAt,
                  managerApprovedComment: comment,
                  managerApprovedStatus: status,
                  finalAmount: finalAmount,
                  targetAchieved,
                  clientName,
                  projectName,
                }
              : {
                  managerApprovedBy: approvedBy,
                  managerApprovedAt: approvedAt,
                  managerApprovedComment: comment,
                  managerApprovedStatus: status,
                };
          if (status === "Rejected") {
            updateData["status"] = status;
          }
        } else {
          updateData =
            status !== "Rejected"
              ? {
                  approvedBy,
                  approvedAt,
                  approvedComment: comment,
                  approvedStatus: status,
                  approvedRoleName: currentRoleName,
                  status,
                  finalAmount: finalAmount,
                  targetAchieved,
                  paidStatus,
                  paidMonth,
                }
              : {
                  approvedBy,
                  approvedAt,
                  approvedComment: comment,
                  approvedStatus: status,
                  approvedRoleName: currentRoleName,
                  status,
                };
        }
        const incentiveStatus = await CommenService.approveRejectIncentive(
          SITE_DB_NAME,
          incentiveId,
          updateData
        );
        // const incentiveStatus = 1;

        if (incentiveStatus === 0) {
          const record = {
            success: false,
            msg: msg.msgRegUpdateError,
          };
          return res.status(200).json(record);
        } else {
          const getUserDetails = await CommenService.getUserDetails(
            SITE_DB_NAME,
            checkIncentive?.userId
          );
          const userName = getUserDetails !== "NA" ? getUserDetails.name : "NA";
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const notiUserId = userId;
          const notiOtherUserId = checkIncentive?.userId;
          const action = "incentive_request";
          const actionId = incentiveId;
          let titles = msg.generateIncentiveMessage(
            userName,
            currentName,
            currentRoleName,
            "Rejected"
          ).title;
          let messages = msg.generateIncentiveMessage(
            userName,
            currentName,
            currentRoleName,
            "Rejected"
          ).message;
          if (status === "Approved") {
            titles = msg.generateIncentiveMessage(
              userName,
              currentName,
              currentRoleName,
              "Approved"
            ).title;
            messages = msg.generateIncentiveMessage(
              userName,
              currentName,
              currentRoleName,
              "Approved"
            ).message;
          }
          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };

          let notificationArr = [];

          const notification =
            await OneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson
            );
          if (notification !== "NA") {
            notificationArr.push(notification);
          }

          if (notificationArr.length > 0) {
            await OneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr
            );
          }
          if (status === "Approved") {
            if (currentRoleName === "Manager") {
              const record = {
                success: true,
                msg: msg.msgIncentiveApprovedSuccess,
                data: { incentive: incentiveStatus },
              };
              return res.status(200).json(record);
            } else {
              const record = {
                success: true,
                msg: msg.msgIncentiveApprovedSuccess,
                data: { incentive: incentiveStatus },
              };
              return res.status(200).json(record);
            }
          } else {
            const record = {
              success: true,
              msg: msg.msgIncentiveRejectedSuccess,
              data: { incentive: incentiveStatus },
            };
            return res.status(200).json(record);
          }
        }
      } catch (error) {
        logger.error("Database error in incentive application 4", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in incentive application 4", { error });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const updatePayStatusIncentiveRequest = [
  //  validation
  body("incentiveId")
    .trim()
    .exists()
    .withMessage(msg.msgIncentiveIdReqired)
    .notEmpty()
    .withMessage(msg.msgIncentiveIdReqired),
  body("paidStatus")
    .trim()
    .exists()
    .withMessage(msg.msgStatusReqired)
    .notEmpty()
    .withMessage(msg.msgStatusReqired),
  body("paidMonth")
    .trim()
    .exists()
    .withMessage(msg.msgStatusReqired)
    .notEmpty()
    .withMessage(msg.msgStatusReqired),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const userId = CURRENT_USER_ID;
    const currentName = CURRENT_USER?.name;
    const currentRoleName = CURRENT_USER?.roleName;
    if (!userId) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    }

    try {
      const { incentiveId, paidStatus, paidMonth } = req.body;

      const checkIncentive = await CommenService.checkIncentive(
        SITE_DB_NAME,
        incentiveId
      );
      if (checkIncentive === 0) {
        const record = {
          success: false,
          msg: msg.msgIncentiveNotExist,
        };
        return res.status(200).json(record);
      }
      let approvedBy = userId;
      let approvedAt = moment().format("YYYY-MM-DD HH:mm");

      try {
        let updateData = {};

        updateData = {
          approvedBy,
          approvedAt,
          paidStatus,
          paidMonth,
        };

        const incentiveStatus = await CommenService.approveRejectIncentive(
          SITE_DB_NAME,
          incentiveId,
          updateData
        );

        if (incentiveStatus === 0) {
          const record = {
            success: false,
            msg: msg.msgRegUpdateError,
          };
          return res.status(200).json(record);
        } else {
          const getUserDetails = await CommenService.getUserDetails(
            SITE_DB_NAME,
            checkIncentive?.userId
          );
          const userName = getUserDetails !== "NA" ? getUserDetails.name : "NA";
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const notiUserId = userId;
          const notiOtherUserId = checkIncentive?.userId;
          const action = "incentive_request";
          const actionId = incentiveId;
          let titles = msg.generateIncentiveMessage(
            userName,
            currentName,
            currentRoleName,
            "Updated"
          ).title;
          let messages = msg.generateIncentiveMessage(
            userName,
            currentName,
            currentRoleName,
            "Updated"
          ).message;

          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };

          let notificationArr = [];

          const notification =
            await OneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson
            );
          if (notification !== "NA") {
            notificationArr.push(notification);
          }

          if (notificationArr.length > 0) {
            await OneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr
            );
          }

          const record = {
            success: true,
            msg: msg.msgIncentiveUpdateSuccess,
            data: { incentive: incentiveStatus },
          };
          return res.status(200).json(record);
        }
      } catch (error) {
        logger.error("Database error in incentive application 4", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in incentive application 4", { error });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
//====================================== Compoff ===========================
const addCompoffRequest = [
  //  validation
  body("description")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("attendanceId")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("dayType")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("originalPunches")
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("type")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { date, description, dayType, attendanceId, type, workedMin } =
        req.body;
      let amount,
        finalAmount = 0;
      let roleName,
        userId,
        unitIds,
        shift,
        uniqueId,
        religiousBreak,
        joiningDate,
        holidays,
        shiftId,
        name,
        monthlyExtraFreeMin,
        relievingDate,
        image,
        monthlyExtraWorkingDays,
        weekEnds,
        plannedLeaveApplyBeforeDays,
        reportingManager,
        sickLeaveDocumentDay;

      if ("userId" in req.body && req.body.userId) {
        userId = req?.body?.userId;
        const checkUser = await CommenService.checkUser(SITE_DB_NAME, userId);
        if (checkUser === "NA") {
        } else {
          const userDetails = await CommenService.getUserDetails(
            SITE_DB_NAME,
            checkUser._id
          );
          roleName = userDetails?.roleName;
          reportingManager = userDetails?.reportingManagerId;
          unitIds = userDetails?.unitId;
          name = userDetails?.name;
          uniqueId = userDetails?.uniqueId;
          image = userDetails?.image;
          religiousBreak = userDetails?.religiousBreak;
          joiningDate = userDetails?.joiningDate;
          holidays = userDetails?.holidays || [];
          shift = userDetails?.shiftDetails || null;
          monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
          plannedLeaveApplyBeforeDays = shift?.plannedLeaveApplyBeforeDays || 7;
          sickLeaveDocumentDay = shift?.sickLeaveDocumentDay || 2;
          weekEnds = shift?.weekEnds || [];
          shiftId = userDetails?.shiftId;
          relievingDate = userDetails?.relievingDate;
          monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin;
        }
      } else {
        userId = CURRENT_USER_ID;
        roleName = CURRENT_USER?.roleName;
        roleName = CURRENT_USER?.roleName;
        reportingManager = CURRENT_USER?.reportingManagerId;
        unitIds = CURRENT_USER?.unitId;
        uniqueId = CURRENT_USER?.uniqueId;
        name = CURRENT_USER?.name;
        image = CURRENT_USER?.image;
        religiousBreak = CURRENT_USER?.religiousBreak;
        joiningDate = CURRENT_USER?.joiningDate;
        holidays = CURRENT_USER?.holidays || [];
        shift = CURRENT_USER?.shiftDetails || null;
        plannedLeaveApplyBeforeDays = shift?.plannedLeaveApplyBeforeDays || 7;
        sickLeaveDocumentDay = shift?.sickLeaveDocumentDay || 2;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = CURRENT_USER?.shiftId;
        relievingDate = CURRENT_USER?.relievingDate;
        monthlyExtraFreeMin = CURRENT_USER?.shiftDetails?.monthlyExtraFreeMin;
      }
      if (!unitIds || unitIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist });
      }

      if (!userId) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUserNotExist });
      }
      let { originalPunches } = req.body;
      if (typeof originalPunches === "string") {
        originalPunches = JSON.parse(originalPunches);
      }
      let documents = [];

      if (!req.file) {
        documents = req?.files.map((file) => file?.key);
      } else if ("key" in req.file) {
        const filename = req.file.key;
        documents = filename;
      } else {
        documents = [];
      }
      try {
        const requestData = {
          userId: userId,
          unitId: unitIds,
          roleName: roleName,
          date: date,
          description,
          amount,
          finalAmount,
          documents,
          dayType,
          attendanceId,
          originalPunches,
          type,
          workedMin,
        };
        const requestAddStatus = await CommenService.addCompoff(
          SITE_DB_NAME,
          requestData
        );
        if (requestAddStatus === "NA") {
          const record = {
            success: false,
            msg: msg.msgCompoffAddError,
          };
          return res.status(200).json(record);
        } else {
          const notifyUsers = await CommenService.getUsersByUnitIdsAndRole(
            SITE_DB_NAME,
            unitIds,
            roleName
          );

          const recipientIds = notifyUsers
            .filter((user) => {
              const isSuperAdmin = user.roleName === "Site-Owner";

              const isAdminWithMatchingUnit =
                user.roleName === "Admin" &&
                Array.isArray(user.unitId) &&
                user.unitId.some((id) =>
                  unitIds.some((unitId) => unitId.equals(id))
                ); //
              const isReportingManagerMatch =
                reportingManager &&
                user._id &&
                reportingManager.equals(user._id);

              return (
                isReportingManagerMatch ||
                isSuperAdmin ||
                isAdminWithMatchingUnit
              );
            })
            .map((user) => user._id);

          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const notiUserId = userId;
          const action = "compoff_request";
          const actionId = requestAddStatus._id;
          const titles = msg.generateCompoffMessage(
            "",
            "",
            "",
            "Created"
          ).title;
          const messages = msg.generateCompoffMessage(
            "",
            "",
            "",
            "Created"
          ).message;

          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };

          let notificationArr = [];

          async function addNotifications(notiOtherUserIds) {
            for (const notiOtherUserId of notiOtherUserIds) {
              const notification =
                await OneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson
                );
              if (notification !== "NA") {
                notificationArr.push(notification);
              }
            }
          }

          await addNotifications(recipientIds);

          if (notificationArr.length > 0) {
            await OneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr
            );
          }

          const record = {
            success: true,
            msg: msg.msgCompoffAddSuccess,
            data: { compoff: requestAddStatus },
          };
          return res.status(200).json(record);
        }
      } catch (error) {
        logger.error("Database error in add CompoffRequest 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in add CompoffRequest application 2", {
        error: error.message,
        key: 1,
      });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
//====================================== Compoff ===========================
const editCompoffRequest = [
  //  validation
  body("compoffId")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("userId")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("description")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  //body("amount").trim().exists().withMessage(msg.msgAllFieldReqired).notEmpty().withMessage(msg.msgAllFieldReqired),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      // amount, finalAmount, date,
      const { compoffId, userId, description, dayType } = req.body;
      let roleName,
        unitIds,
        shift,
        uniqueId,
        religiousBreak,
        joiningDate,
        holidays,
        shiftId,
        name,
        monthlyExtraFreeMin,
        relievingDate,
        image,
        monthlyExtraWorkingDays,
        weekEnds,
        plannedLeaveApplyBeforeDays,
        reportingManager,
        sickLeaveDocumentDay;

      if ("userId" in req.body && req.body.userId) {
        let userIdReq = req?.body?.userId;
        const checkUser = await CommenService.checkUser(
          SITE_DB_NAME,
          userIdReq
        );
        if (checkUser === "NA") {
        } else {
          const userDetails = await CommenService.getUserDetails(
            SITE_DB_NAME,
            checkUser._id
          );
          roleName = userDetails?.roleName;
          reportingManager = userDetails?.reportingManagerId;
          unitIds = userDetails?.unitId;
          name = userDetails?.name;
          uniqueId = userDetails?.uniqueId;
          image = userDetails?.image;
          religiousBreak = userDetails?.religiousBreak;
          joiningDate = userDetails?.joiningDate;
          holidays = userDetails?.holidays || [];
          shift = userDetails?.shiftDetails || null;
          monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
          plannedLeaveApplyBeforeDays = shift?.plannedLeaveApplyBeforeDays || 7;
          sickLeaveDocumentDay = shift?.sickLeaveDocumentDay || 2;
          weekEnds = shift?.weekEnds || [];
          shiftId = userDetails?.shiftId;
          relievingDate = userDetails?.relievingDate;
          monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin;
        }
      } else {
        reportingManager = CURRENT_USER?.reportingManagerId;
        roleName = CURRENT_USER?.roleName;
        unitIds = CURRENT_USER?.unitId;
        uniqueId = CURRENT_USER?.uniqueId;
        name = CURRENT_USER?.name;
        image = CURRENT_USER?.image;
        religiousBreak = CURRENT_USER?.religiousBreak;
        joiningDate = CURRENT_USER?.joiningDate;
        holidays = CURRENT_USER?.holidays || [];
        shift = CURRENT_USER?.shiftDetails || null;
        plannedLeaveApplyBeforeDays = shift?.plannedLeaveApplyBeforeDays || 7;
        sickLeaveDocumentDay = shift?.sickLeaveDocumentDay || 2;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = CURRENT_USER?.shiftId;
        relievingDate = CURRENT_USER?.relievingDate;
        monthlyExtraFreeMin = CURRENT_USER?.shiftDetails?.monthlyExtraFreeMin;
      }
      if (!unitIds || unitIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist });
      }

      if (!userId) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUserNotExist });
      }

      try {
        const requestCheckStatus = await CommenService.checkCompoff(
          SITE_DB_NAME,
          compoffId
        );
        if (requestCheckStatus === "NA") {
          const record = {
            success: false,
            msg: msg.msgCompoffNotExist,
          };
          return res.status(200).json(record);
        }
        const currentDoc = requestCheckStatus?.documents || [];
        const removeDocs = req.body.oldDocuments || [];
        const oldDocs = (currentDoc || []).filter((doc) =>
          removeDocs.includes(doc)
        );
        const newDocs = (req.files || []).map((file) =>
          file.key ? file.key : `${req.folderName}/${file.filename}`
        );
        const documents = [...oldDocs, ...newDocs];

        const requestData = {
          dayType,
          description: description,
          documents: documents,
        };
        const requestUpdateStatus = await CommenService.editCompoff(
          SITE_DB_NAME,
          compoffId,
          requestData
        );
        if (requestUpdateStatus === "NA") {
          const record = {
            success: false,
            msg: msg.msgCompoffUpdateError,
          };
          return res.status(200).json(record);
        } else {
          const notifyUsers = await CommenService.getUsersByUnitIdsAndRole(
            SITE_DB_NAME,
            unitIds,
            roleName
          );
          const recipientIds = notifyUsers
            .filter((user) => {
              const isSuperAdmin = user.roleName === "Site-Owner";

              const isAdminWithMatchingUnit =
                user.roleName === "Admin" &&
                Array.isArray(user.unitId) &&
                user.unitId.some((id) =>
                  unitIds.some((unitId) => unitId.equals(id))
                ); //
              const isReportingManagerMatch =
                reportingManager &&
                user._id &&
                reportingManager.equals(user._id);

              return (
                isReportingManagerMatch ||
                isSuperAdmin ||
                isAdminWithMatchingUnit
              );
            })
            .map((user) => user._id);
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const notiUserId = userId;
          const action = "compoff_request";
          const actionId = compoffId;
          const titles = msg.generateCompoffMessage(
            "",
            "",
            "",
            "Updated"
          ).title;
          const messages = msg.generateCompoffMessage(
            "",
            "",
            "",
            "Updated"
          ).message;

          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };

          let notificationArr = [];

          async function addNotifications(notiOtherUserIds) {
            for (const notiOtherUserId of notiOtherUserIds) {
              const notification =
                await OneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson
                );
              if (notification !== "NA") {
                notificationArr.push(notification);
              }
            }
          }

          await addNotifications(recipientIds);

          if (notificationArr.length > 0) {
            await OneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr
            );
          }

          const record = {
            success: true,
            msg: msg.msgCompoffUpdateSuccess,
            data: { compoff: requestUpdateStatus },
          };
          return res.status(200).json(record);
        }
      } catch (error) {
        logger.error("Database error in editCompoffRequest application 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in editCompoffRequest application 2", {
        error: error.message,
        key: 1,
      });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const cancelCompoffRequest = [
  //  validation
  body("compoffId")
    .trim()
    .exists()
    .withMessage(msg.msgCompoffIdReqired)
    .notEmpty()
    .withMessage(msg.msgCompoffIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const userId = CURRENT_USER_ID;
    const currentName = CURRENT_USER?.name;
    const currentRoleName = CURRENT_USER?.roleName;
    if (!userId) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    }
    try {
      const { compoffId } = req.body;

      const checkCompoff = await CommenService.checkCompoff(
        SITE_DB_NAME,
        compoffId
      );
      if (checkCompoff === 0) {
        const record = {
          success: false,
          msg: msg.msgCompoffNotExist,
        };
        return res.status(200).json(record);
      }
      let status = "Cancelled";
      let approvedBy = userId;
      let approvedAt = moment().format("YYYY-MM-DD HH:mm");
      try {
        const compoffStatus = await CommenService.cancelCompoff(
          SITE_DB_NAME,
          compoffId,
          status,
          approvedBy,
          approvedAt,
          currentRoleName
        );
        if (compoffStatus === 0) {
          const record = {
            success: false,
            msg: msg.msgCompoffDeleteError,
          };
          return res.status(200).json(record);
        } else {
          try {
            if (checkCompoff?.userId.toString() !== userId.toString()) {
              console.log(checkCompoff?.userId, userId);
              const getUserDetails = await CommenService.getUserDetails(
                SITE_DB_NAME,
                checkCompoff?.userId
              );
              const userName =
                getUserDetails !== "NA" ? getUserDetails.name : "NA";
              const APP_LOGO = process.env.APP_LOGO || "";
              const APP_SITE_URL = process.env.SITE_URL || "";
              const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
              const notiUserId = userId;
              const notiOtherUserId = checkCompoff?.userId;
              const action = "compoff_request";
              const actionId = compoffId;
              let titles = msg.generateCompoffMessage(
                userName,
                currentName,
                currentRoleName,
                "Cancelled"
              ).title;
              let messages = msg.generateCompoffMessage(
                userName,
                currentName,
                currentRoleName,
                "Cancelled"
              ).message;

              const actionJson = {
                actionId: actionId,
                action: action,
                option: {
                  logoUrl: APP_LOGO,
                  redirectionUrl: {
                    webLink: APP_SITE_URL,
                    deepLink: APP_DEEP_LINK_URL,
                  },
                  imageUrl: "",
                  soundFile: "",
                },
                appType: "customer",
              };

              let notificationArr = [];

              const notification =
                await OneSignalHelperUser.getNotificationArrSingle(
                  SITE_DB_NAME,
                  notiUserId,
                  notiOtherUserId,
                  action,
                  actionId,
                  titles,
                  messages,
                  actionJson
                );
              if (notification !== "NA") {
                notificationArr.push(notification);
              }

              if (notificationArr.length > 0) {
                await OneSignalHelperUser.oneSignalNotificationSendCall(
                  notificationArr
                );
              }
            }
            const record = {
              success: true,
              msg: msg.msgCompoffCancelledSuccess,
              data: { compoff: compoffStatus },
            };
            return res.status(200).json(record);
          } catch (error) {
            logger.error("Database error in cancelCompoff application 0", {
              error,
            });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: error,
            };
            return res.status(500).json(record);
          }
        }
      } catch (error) {
        logger.error("Database error in cancelCompoff application 1", {
          error,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in cancelCompoff application 2", {
        error,
      });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const myCompoffs = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  query("monthYear")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  query("selectionType")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag, monthYear, selectionType } = req.query;

    try {
      let userId,
        unitIds,
        uniqueId,
        religiousBreak,
        joiningDate,
        holidays,
        shift,
        shiftId,
        name,
        monthlyExtraFreeMin,
        relievingDate,
        image,
        monthlyExtraWorkingDays,
        weekEnds;
      let paidLeaveCount = 0;
      let paternityLeaveCount = 0;
      let maternityLeaveCount = 0;
      if ("userId" in req.query && req.query.userId) {
        let userIdReq = req?.query?.userId;
        const checkUser = await CommenService.checkUser(
          SITE_DB_NAME,
          userIdReq
        );
        if (checkUser === "NA") {
          userId = 0;
        }
        userId = checkUser._id;
        const userDetails = await CommenService.getUserDetails(
          SITE_DB_NAME,
          checkUser._id
        );

        unitIds = userDetails?.unitId;
        name = userDetails?.name;
        uniqueId = userDetails?.uniqueId;
        image = userDetails?.image;
        religiousBreak = userDetails?.religiousBreak;
        joiningDate = userDetails?.joiningDate;
        holidays = userDetails?.holidays || [];
        shift = userDetails?.shiftDetails || null;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = userDetails?.shiftId;
        relievingDate = userDetails?.relievingDate;
        monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin;
        paidLeaveCount = userDetails?.paidLeaveCount;
        paternityLeaveCount = userDetails?.paternityLeaveCount;
        maternityLeaveCount = userDetails?.maternityLeaveCount;
      } else {
        userId = CURRENT_USER_ID;
        unitIds = CURRENT_USER?.unitId;
        uniqueId = CURRENT_USER?.uniqueId;
        name = CURRENT_USER?.name;
        image = CURRENT_USER?.image;
        religiousBreak = CURRENT_USER?.religiousBreak;
        joiningDate = CURRENT_USER?.joiningDate;
        holidays = CURRENT_USER?.holidays || [];
        shift = CURRENT_USER?.shiftDetails || null;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = CURRENT_USER?.shiftId;
        relievingDate = CURRENT_USER?.relievingDate;
        monthlyExtraFreeMin = CURRENT_USER?.shiftDetails?.monthlyExtraFreeMin;
        paidLeaveCount = CURRENT_USER?.paidLeaveCount;
        paternityLeaveCount = CURRENT_USER?.paternityLeaveCount;
        maternityLeaveCount = CURRENT_USER?.maternityLeaveCount;
      }

      if (!unitIds || unitIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist, compoffs: [] });
      }

      const shiftIds = [shiftId];
      if (!shiftIds || shiftIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist });
      }
      if (!shift) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgShiftNotExist });
      }
      if (!Array.isArray(shiftIds) || !shiftIds || shiftIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgShiftNotExist });
      }

      const pagination = {
        pageSize: parseInt(req.query.pageSize) || 10,
        pageNumber: parseInt(req.query.pageNumber) || 1,
      };
      const { compoffCounts, compoffs } = await CommenService.getMyCompoffs(
        SITE_DB_NAME,
        userId,
        selectionType,
        monthYear,
        Number(deleteFlag),
        pagination
      );

      const record = {
        success: true,
        msg: ["data found"],
        data: {
          compoffs: compoffs?.filter((item) => item !== null),
          name,
          uniqueId,
          compoffCounts: compoffCounts,
        },
      };
      return res.status(200).json(record);
    } catch (error) {
      logger.error("Database error in compoffs application", {
        error: error.message,
      });
      const record = { success: true, msg: error.message, key: "error" };
      return res.status(500).json(record);
    }
  },
];
const compoffRequests = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  query("monthYear")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  query("selectionType")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag, monthYear, selectionType } = req.query;

    try {
      let userId,
        unitIds,
        uniqueId,
        religiousBreak,
        joiningDate,
        holidays,
        shift,
        shiftId,
        name,
        monthlyExtraFreeMin,
        relievingDate,
        image,
        monthlyExtraWorkingDays,
        weekEnds,
        roleName;

      if ("userId" in req.query && req.query.userId) {
        let userIdReq = req?.query?.userId;
        const checkUser = await CommenService.checkUser(
          SITE_DB_NAME,
          userIdReq
        );
        if (checkUser === "NA") {
          userId = 0;
        }
        userId = checkUser._id;
        const userDetails = await CommenService.getUserDetails(
          SITE_DB_NAME,
          checkUser._id
        );

        unitIds = userDetails?.unitId;
        name = userDetails?.name;
        roleName = userDetails?.roleName;
        uniqueId = userDetails?.uniqueId;
        image = userDetails?.image;
        religiousBreak = userDetails?.religiousBreak;
        joiningDate = userDetails?.joiningDate;
        holidays = userDetails?.holidays || [];
        shift = userDetails?.shiftDetails || null;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = userDetails?.shiftId;
        relievingDate = userDetails?.relievingDate;
        monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin;
        paidLeaveCount = userDetails?.paidLeaveCount;
        paternityLeaveCount = userDetails?.paternityLeaveCount;
        maternityLeaveCount = userDetails?.maternityLeaveCount;
      } else {
        userId = CURRENT_USER_ID;
        unitIds = CURRENT_USER?.unitId;
        roleName = CURRENT_USER?.roleName;
        uniqueId = CURRENT_USER?.uniqueId;
        name = CURRENT_USER?.name;
        image = CURRENT_USER?.image;
        religiousBreak = CURRENT_USER?.religiousBreak;
        joiningDate = CURRENT_USER?.joiningDate;
        holidays = CURRENT_USER?.holidays || [];
        shift = CURRENT_USER?.shiftDetails || null;
        monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
        weekEnds = shift?.weekEnds || [];
        shiftId = CURRENT_USER?.shiftId;
        relievingDate = CURRENT_USER?.relievingDate;
        monthlyExtraFreeMin = CURRENT_USER?.shiftDetails?.monthlyExtraFreeMin;
        paidLeaveCount = CURRENT_USER?.paidLeaveCount;
        paternityLeaveCount = CURRENT_USER?.paternityLeaveCount;
        maternityLeaveCount = CURRENT_USER?.maternityLeaveCount;
      }
      if (roleName !== "Site-Owner") {
        if (!unitIds || unitIds?.length === 0) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgUnitNotExist, leaves: [] });
        }

        const shiftIds = [shiftId];
        if (!shiftIds || shiftIds?.length === 0) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgUnitNotExist });
        }
        if (!shift) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgShiftNotExist });
        }
        if (!Array.isArray(shiftIds) || !shiftIds || shiftIds?.length === 0) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgShiftNotExist });
        }
      }
      const pagination = {
        pageSize: parseInt(req.query.pageSize) || 10,
        pageNumber: parseInt(req.query.pageNumber) || 1,
      };
      const unitId = req?.query?.unitId || "";

      if (unitId && unitId !== "all") {
        const checkUnitId = await CommenService.checkUnit(SITE_DB_NAME, unitId);
        unitIds = [checkUnitId];
      }

      const search = req.query.search || "";
      const { compoffCounts, compoffs } =
        await CommenService.getCompoffRequests(
          SITE_DB_NAME,
          userId,
          unitIds,
          roleName,
          selectionType,
          monthYear,
          Number(deleteFlag),
          pagination,
          search
        );

      return res.status(200).json({
        success: true,
        msg: ["data found"],
        data: {
          compoffs: compoffs.filter((item) => item !== null),
          compoffCounts: compoffCounts,
        },
      });
    } catch (error) {
      logger.error("Database error in Compoffs application", { error });
      const record = { success: true, msg: error.message, key: "error" };
      return res.status(500).json(record);
    }
  },
];

const deleteCompoff = [
  //  validation
  query("compoffId")
    .trim()
    .exists()
    .withMessage(msg.msgCompoffIdReqired)
    .notEmpty()
    .withMessage(msg.msgCompoffIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { compoffId } = req.query;

      const checkCompoff = await CommenService.checkCompoff(
        SITE_DB_NAME,
        compoffId
      );
      if (checkCompoff === 0) {
        const record = {
          success: false,
          msg: msg.msgCompoffNotExist,
        };
        return res.status(200).json(record);
      }

      try {
        const compoffStatus = await CommenService.deleteCompoff(
          SITE_DB_NAME,
          compoffId
        );
        if (compoffStatus === 0) {
          const record = {
            success: false,
            msg: msg.msgCompoffDeleteError,
          };
          return res.status(200).json(record);
        } else {
          const record = {
            success: true,
            msg: msg.msgCompoffDeleteSuccess,
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
  },
];

const approveRejectStatusCompoffRequest = [
  //  validation
  body("compoffId")
    .trim()
    .exists()
    .withMessage(msg.msgCompoffIdReqired)
    .notEmpty()
    .withMessage(msg.msgCompoffIdReqired),
  body("status")
    .trim()
    .exists()
    .withMessage(msg.msgStatusReqired)
    .notEmpty()
    .withMessage(msg.msgStatusReqired),
  body("workedMin")
    .trim()
    .exists()
    .withMessage(msg.msgStatusReqired)
    .notEmpty()
    .withMessage(msg.msgStatusReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const userId = CURRENT_USER_ID;
    const currentName = CURRENT_USER?.name;
    const currentRoleName = CURRENT_USER?.roleName;
    if (!userId) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    }

    try {
      const { compoffId, status, comment, dayType, workedMin, type } = req.body;

      const checkCompoff = await CommenService.checkCompoff(
        SITE_DB_NAME,
        compoffId
      );
      if (checkCompoff === 0) {
        const record = {
          success: false,
          msg: msg.msgCompoffNotExist,
        };
        return res.status(200).json(record);
      }
      let approvedBy = userId;
      let approvedAt = moment().format("YYYY-MM-DD HH:mm");

      try {
        let updateData = {};
        if (currentRoleName === "Manager") {
          updateData = {
            managerApprovedBy: approvedBy,
            managerApprovedAt: approvedAt,
            managerApprovedComment: comment,
            managerApprovedStatus: status,
            dayType: dayType,
            workedMin: workedMin,
          };
          if (status === "Rejected") {
            updateData["status"] = status;
          }
        } else {
          updateData = {
            approvedBy,
            approvedAt,
            approvedComment: comment,
            approvedStatus: status,
            approvedRoleName: currentRoleName,
            status,
            dayType: dayType,
            workedMin: workedMin,
          };
        }
        const compoffStatus = await CommenService.approveRejectCompoff(
          SITE_DB_NAME,
          compoffId,
          updateData
        );
        // const compoffStatus = 1;

        if (compoffStatus === 0) {
          const record = {
            success: false,
            msg: msg.msgCompoffUpdateError,
          };
          return res.status(200).json(record);
        } else {
          const getUserDetails = await CommenService.getUserDetails(
            SITE_DB_NAME,
            checkCompoff?.userId
          );
          const userName = getUserDetails !== "NA" ? getUserDetails.name : "NA";
          const APP_LOGO = process.env.APP_LOGO || "";
          const APP_SITE_URL = process.env.SITE_URL || "";
          const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          const notiUserId = userId;
          const notiOtherUserId = checkCompoff?.userId;
          const action = "compoff_request";
          const actionId = compoffId;
          let titles = msg.generateCompoffMessage(
            userName,
            currentName,
            currentRoleName,
            "Rejected"
          ).title;
          let messages = msg.generateCompoffMessage(
            userName,
            currentName,
            currentRoleName,
            "Rejected"
          ).message;
          if (status === "Approved") {
            titles = msg.generateCompoffMessage(
              userName,
              currentName,
              currentRoleName,
              "Approved"
            ).title;
            messages = msg.generateCompoffMessage(
              userName,
              currentName,
              currentRoleName,
              "Approved"
            ).message;
          }
          const actionJson = {
            actionId: actionId,
            action: action,
            option: {
              logoUrl: APP_LOGO,
              redirectionUrl: {
                webLink: APP_SITE_URL,
                deepLink: APP_DEEP_LINK_URL,
              },
              imageUrl: "",
              soundFile: "",
            },
            appType: "customer",
          };

          let notificationArr = [];

          const notification =
            await OneSignalHelperUser.getNotificationArrSingle(
              SITE_DB_NAME,
              notiUserId,
              notiOtherUserId,
              action,
              actionId,
              titles,
              messages,
              actionJson
            );
          if (notification !== "NA") {
            notificationArr.push(notification);
          }

          if (notificationArr.length > 0) {
            await OneSignalHelperUser.oneSignalNotificationSendCall(
              notificationArr
            );
          }
          if (status === "Approved") {
            if (currentRoleName === "Manager") {
              const record = {
                success: true,
                msg: msg.msgCompoffApprovedSuccess,
                data: { compoff: compoffStatus },
              };
              return res.status(200).json(record);
            } else {
              const record = {
                success: true,
                msg: msg.msgCompoffApprovedSuccess,
                data: { compoff: compoffStatus },
              };
              return res.status(200).json(record);
            }
          } else {
            const record = {
              success: true,
              msg: msg.msgCompoffRejectedSuccess,
              data: { compoff: compoffStatus },
            };
            return res.status(200).json(record);
          }
        }
      } catch (error) {
        logger.error("Database error in compoff application 4", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in compoff application 4", { error });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];

const updatePayStatusCompoffRequest = [
  //  validation
  body("compoffId")
    .trim()
    .exists()
    .withMessage(msg.msgCompoffIdReqired)
    .notEmpty()
    .withMessage(msg.msgCompoffIdReqired),
  body("paidMonth")
    .trim()
    .exists()
    .withMessage(msg.msgStatusReqired)
    .notEmpty()
    .withMessage(msg.msgStatusReqired),
  body("paidStatus")
    .trim()
    .exists()
    .withMessage(msg.msgStatusReqired)
    .notEmpty()
    .withMessage(msg.msgStatusReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const userId = CURRENT_USER_ID;
    const currentName = CURRENT_USER?.name;
    const currentRoleName = CURRENT_USER?.roleName;
    if (!userId) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    }

    try {
      const { compoffId, paidStatus, paidMonth } = req.body;

      const checkCompoff = await CommenService.checkCompoff(
        SITE_DB_NAME,
        compoffId
      );
      if (checkCompoff === 0) {
        const record = {
          success: false,
          msg: msg.msgCompoffNotExist,
        };
        return res.status(200).json(record);
      }
      let approvedBy = userId;
      let approvedAt = moment().format("YYYY-MM-DD HH:mm");

      try {
        let updateData = {};

        updateData = {
          approvedBy,
          approvedAt,
          paidMonth: paidMonth,
          paidStatus: paidStatus,
        };

        const compoffStatus = await CommenService.approveRejectCompoff(
          SITE_DB_NAME,
          compoffId,
          updateData
        );

        if (compoffStatus === 0) {
          const record = {
            success: false,
            msg: msg.msgCompoffUpdateError,
          };
          return res.status(200).json(record);
        }
        const getUserDetails = await CommenService.getUserDetails(
          SITE_DB_NAME,
          checkCompoff?.userId
        );
        const userName = getUserDetails !== "NA" ? getUserDetails.name : "NA";
        const APP_LOGO = process.env.APP_LOGO || "";
        const APP_SITE_URL = process.env.SITE_URL || "";
        const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
        const notiUserId = userId;
        const notiOtherUserId = checkCompoff?.userId;
        const action = "rei_request";
        const actionId = compoffId;
        let titles = msg.generateReiMessage(
          userName,
          currentName,
          currentRoleName,
          "Updated"
        ).title;
        let messages = msg.generateReiMessage(
          userName,
          currentName,
          currentRoleName,
          "Updated"
        ).message;

        const actionJson = {
          actionId: actionId,
          action: action,
          option: {
            logoUrl: APP_LOGO,
            redirectionUrl: {
              webLink: APP_SITE_URL,
              deepLink: APP_DEEP_LINK_URL,
            },
            imageUrl: "",
            soundFile: "",
          },
          appType: "customer",
        };

        let notificationArr = [];

        const notification = await OneSignalHelperUser.getNotificationArrSingle(
          SITE_DB_NAME,
          notiUserId,
          notiOtherUserId,
          action,
          actionId,
          titles,
          messages,
          actionJson
        );
        if (notification !== "NA") {
          notificationArr.push(notification);
        }

        if (notificationArr.length > 0) {
          await OneSignalHelperUser.oneSignalNotificationSendCall(
            notificationArr
          );
        }

        const record = {
          success: true,
          msg: msg.msgCompoffUpdateSuccess,
          data: { compoff: compoffStatus },
        };
        return res.status(200).json(record);
      } catch (error) {
        logger.error("Database error in compoff application 4", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in compoff application 4", {
        error,
      });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const shiftsByUnit = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }

    const { deleteFlag } = req.query;
    const roleNameCurrent = CURRENT_USER?.roleName;
    const unitIdsCurrent =
      roleNameCurrent === "Site-Owner" ? "all" : CURRENT_USER?.unitId;

    try {
      const shifts = await CommenService.shiftsByUnit(
        SITE_DB_NAME,
        unitIdsCurrent,
        Number(deleteFlag)
      );
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
const shiftIncentivePolicys = [
  query("shiftId")
    .trim()
    .exists()
    .withMessage(msg.msgShiftIdReqired)
    .notEmpty()
    .withMessage(msg.msgShiftIdReqired),
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag } = req.query;
    try {
      const unitIds = CURRENT_USER?.unitId;
      const shiftId = req?.query.shiftId ?? CURRENT_USER?.shiftId;
      const shiftIds = [shiftId];
      if (!shiftIds || shiftIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgShiftNotExist });
      }

      if (!Array.isArray(shiftIds) || !shiftIds || shiftIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgShiftNotExist });
      }
      const policys = await CommenService.shiftIncentivePolicys(
        SITE_DB_NAME,
        shiftIds,
        Number(deleteFlag)
      );

      if (policys === "NA") {
        const record = {
          success: true,
          msg: msg.msgDataNotFound,
          data: { policys: [] },
        };
        return res.status(200).json(record);
      }
      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { policys: policys },
      };
      return res.status(200).json(record);
    } catch (error) {
      logger.error("Database error in policys", { error });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const incentivePolicys = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag } = req.query;
    try {
      const policys = await CommenService.incentivePolicys(
        SITE_DB_NAME,
        Number(deleteFlag)
      );

      if (policys === "NA") {
        const record = {
          success: true,
          msg: msg.msgDataNotFound,
          data: { policys: [] },
        };
        return res.status(200).json(record);
      }
      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { policys: policys },
      };
      return res.status(200).json(record);
    } catch (error) {
      logger.error("Database error in policys", { error });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
//====================================== ShiftIncentivePolicy===========================
const addShiftIncentivePolicy = [
  //  validation
  body("shiftId")
    .trim()
    .exists()
    .withMessage(msg.msgShiftIdReqired)
    .notEmpty()
    .withMessage(msg.msgShiftIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { shiftId, incentiveData } = req.body;

      try {
        const incentive = await CommenService.addShiftIncentivePolicy(
          SITE_DB_NAME,
          shiftId,
          incentiveData
        );
        if (incentive === "NA") {
          const record = {
            success: false,
            msg: msg.msgShiftIncentivePolicyAddError,
          };
          return res.status(200).json(record);
        } else {
          const record = {
            success: true,
            msg: msg.msgShiftIncentivePolicyAddSuccess,
            data: { incentive: incentive },
          };
          return res.status(200).json(record);
        }
      } catch (error) {
        logger.error("Database error in add hoiliday", { error });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in add hoiliday", { error });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
// ================================================== self function end ==========================================
const attAdminRequest = [
  //  validation
  body("attendanceId")
    .trim()
    .exists()
    .withMessage(msg.msgShiftIdReqired)
    .notEmpty()
    .withMessage(msg.msgShiftIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const userId = CURRENT_USER_ID;
    const currentName = CURRENT_USER?.name;
    const currentRoleName = CURRENT_USER?.roleName;
    if (!userId) {
      return res.status(200).json({ success: false, msg: msg.msgUserNotExist });
    }

    try {
      const attendanceId = req?.body?.attendanceId;
      const requestPunches = req?.body?.requestPunches;
      let updateStatusAtt = 1;
      if (attendanceId) {
        updateStatusAtt = await CommenService.updateDeleteFlagAttandance(
          SITE_DB_NAME,
          attendanceId
        );
      }
      try {
        let result = null;
        if (updateStatusAtt !== 0) {
          for (const punch of requestPunches) {
            result = await attendancePunchRegularization(SITE_DB_NAME, punch);
          }
        }

        const record = {
          success: true,
          msg: msg.msgRegApprovedSuccess,
          data: { attendance: result },
        };
        return res.status(200).json(record);
      } catch (error) {
        logger.error("Database error in attendance attAdminRequest 4", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in attendance attAdminRequest 4", {
        error,
      });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const getDeviceStatuses = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }

    const { deleteFlag } = req.query;
    try {
      const devices = await CommenService.getDeviceStatuses(
        SITE_DB_NAME,
        Number(deleteFlag)
      );
      if (devices === "NA") {
        const record = {
          success: true,
          msg: msg.msgDataNotFound,
          data: { devices: [] },
        };
        return res.status(200).json(record);
      }
      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { devices: devices },
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
const editDevice = [
  //  validation
  body("deviceId")
    .trim()
    .exists()
    .withMessage(msg.msgDeviceIdReqired)
    .notEmpty()
    .withMessage(msg.msgDeviceIdReqired),
  body("deviceSerialNumber")
    .trim()
    .exists()
    .withMessage(msg.msgDeviceIdReqired)
    .notEmpty()
    .withMessage(msg.msgDeviceIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const {
        deviceSerialNumber,
        deviceAddress,
        deviceIPAddress,
        deviceModelId,
        deviceModelName,
        deviceModelNumber,
        deviceName,
        deviceId,
      } = req.body;

      const checkDevice = await CommenService.checkDevice(
        SITE_DB_NAME,
        deviceId
      );
      if (checkDevice === 0) {
        const record = {
          success: false,
          msg: msg.msgDeviceNotExist,
        };
        return res.status(200).json(record);
      }

      try {
        const checkDeviceWithNumber = await CommenService.checkDeviceWithNumber(
          SITE_DB_NAME,
          deviceId,
          deviceSerialNumber
        );
        if (checkDeviceWithNumber !== 0) {
          const record = {
            success: false,
            msg: msg.msgDeviceExist,
          };
          return res.status(200).json(record);
        }
        const data = {
          deviceSerialNumber,
          deviceAddress,
          deviceIPAddress,
          deviceModelId,
          deviceModelName,
          deviceModelNumber,
          deviceName,
        };
        try {
          const deviceStatus = await CommenService.editDevice(
            SITE_DB_NAME,
            deviceId,
            data
          );
          if (deviceStatus === 0) {
            const record = {
              success: false,
              msg: msg.msgDeviceUpdateError,
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgDeviceUpdateSuccess,
              data: { device: deviceStatus },
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
  },
];

const activeDeactiveDevice = [
  //  validation
  body("deviceId")
    .trim()
    .exists()
    .withMessage(msg.msgDeviceIdReqired)
    .notEmpty()
    .withMessage(msg.msgDeviceIdReqired),
  body("activeFlag")
    .trim()
    .exists()
    .withMessage(msg.msgActiveFlagReqired)
    .notEmpty()
    .withMessage(msg.msgActiveFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { deviceId, activeFlag } = req.body;
      const checkDevice = await CommenService.checkDevice(
        SITE_DB_NAME,
        deviceId
      );
      if (checkDevice === 0) {
        const record = {
          success: false,
          msg: msg.msgDeviceNotExist,
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
        const deviceStatus = await CommenService.activeDeactiveDevice(
          SITE_DB_NAME,
          deviceId,
          activeDeactiveFlag
        );
        if (deviceStatus === 0) {
          const record = {
            success: false,
            msg: msg.msgDeviceUpdateError,
          };
          return res.status(200).json(record);
        } else {
          if (activeFlag === "0") {
            const record = {
              success: true,
              msg: msg.msgDeviceActiveSuccess,
              data: { device: deviceStatus },
            };
            return res.status(200).json(record);
          } else {
            const record = {
              success: true,
              msg: msg.msgDeviceDeactiveSuccess,
              data: { device: deviceStatus },
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
  },
];
const assignPaidLeavePolicy = async () => {
  const userIdCurrent = await CommenService.getSuperAdminId(SITE_DB_NAME);
  const roleNameCurrent = "Site-Owner";
  const unitIdsCurrent = [];
  if (!roleNameCurrent) {
    return { success: false, msg: msg.msgUnitNotExist, insertData: [] };
  }

  try {
    try {
      const getUser = await CommenService.getUser(
        SITE_DB_NAME,
        userIdCurrent,
        roleNameCurrent,
        unitIdsCurrent
      );

      if (getUser === "NA") {
        return { success: false, msg: msg.msgUserNotExist, insertData: [] };
      }
      const CurrentMonth = moment().format("YYYY-MM");
      const userChecks = await Promise.all(
        getUser.map(async (user) => ({
          user,
          isActive: await isUserActiveInMonth(user, CurrentMonth),
        }))
      );
      const filterUser = userChecks
        .filter((check) => check.isActive)
        .map((check) => check.user);

      const promises = Array.from(
        {
          length: filterUser.length,
        },
        async (_, index) => {
          let userId,
            unitIds,
            uniqueId,
            salary,
            religiousBreak,
            joiningDate,
            holidays,
            shift,
            shiftId,
            name,
            monthlyExtraFreeMin,
            relievingDate,
            image,
            monthlyExtraWorkingDays,
            weekEnds,
            designationName,
            totalAnnualPaidLeave,
            eachMonthPaidLeave,
            paidLeaveDay,
            skipPaidLeaveMonth,
            carryForwordPaidLeaveStatus,
            shortLoginDeductions,
            joiningDatePaidLeaveDeductions,
            afterTwoYearExtraPaidLeave,
            initialThreeMonthPaidLeaveStatus,
            maternityLeave,
            paternityLeave,
            weekOnceLeaveUnplanned,
            unPlannedLeaveExtraDeduction,
            weekWorkingDays;
          userId = filterUser[index]._id;
          const userDetails = await CommenService.getUserDetails(
            SITE_DB_NAME,
            userId
          );

          if (userDetails !== "NA") {
            userId = userDetails?.userId;
            unitIds = userDetails?.unitId;
            name = userDetails?.name;
            image = userDetails?.image;
            uniqueId = userDetails?.uniqueId;
            religiousBreak = userDetails?.religiousBreak;
            joiningDate = userDetails?.joiningDate;
            holidays = userDetails?.holidays || [];
            shift = userDetails?.shiftDetails || null;
            monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
            weekEnds = shift?.weekEnds || [];
            shiftId = userDetails?.shiftId;
            salary = userDetails?.salary;
            relievingDate = userDetails?.relievingDate;
            monthlyExtraFreeMin =
              userDetails?.shiftDetails?.monthlyExtraFreeMin;
            designationName = userDetails?.designationName;
            weekWorkingDays = shift?.weekWorkingDays || [];
            totalAnnualPaidLeave = shift?.totalAnnualPaidLeave || 0;
            eachMonthPaidLeave = shift?.eachMonthPaidLeave || 0;
            paidLeaveDay = shift?.paidLeaveDay || 0;
            skipPaidLeaveMonth = shift?.skipPaidLeaveMonth || [];
            carryForwordPaidLeaveStatus =
              shift?.carryForwordPaidLeaveStatus || 0;
            shortLoginDeductions = shift?.shortLoginDeductions || [];
            joiningDatePaidLeaveDeductions =
              shift?.joiningDatePaidLeaveDeductions || [];
            afterTwoYearExtraPaidLeave = shift?.afterTwoYearExtraPaidLeave || 0;
            initialThreeMonthPaidLeaveStatus =
              shift?.initialThreeMonthPaidLeaveStatus || 0;
            maternityLeave = shift?.maternityLeave || 0;
            paternityLeave = shift?.paternityLeave || 0;
            weekOnceLeaveUnplanned = shift?.weekOnceLeaveUnplanned || 0;
            unPlannedLeaveExtraDeduction =
              shift?.unPlannedLeaveExtraDeduction || 0;
          }
          function getMonthsBetween(start, end) {
            const result = [];
            let current = new Date(start.getFullYear(), start.getMonth(), 1);
            while (current <= end) {
              result.push(
                `${current.getFullYear()}-${String(
                  current.getMonth() + 1
                ).padStart(2, "0")}`
              );
              current.setMonth(current.getMonth() + 1);
            }
            return result;
          }
          const currentYear = new Date().getFullYear();
          const now = new Date();
          joiningDate = new Date(joiningDate);
          relievingDate = relievingDate
            ? new Date(relievingDate)
            : new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          const start =
            joiningDate.getFullYear() === currentYear
              ? joiningDate
              : new Date(`${currentYear}-01-01`);
          const months = getMonthsBetween(start, relievingDate);
          const checkExist = await CommenService.checkExistPaidLeavePolicy(
            SITE_DB_NAME,
            userId,
            months
          );

          const existingMonthSet = new Set(
            checkExist.map((doc) => doc.yearMonth)
          );

          const monthsToInsert = months.filter((m) => !existingMonthSet.has(m));
          const insertPayload = monthsToInsert.map((monthStr) => {
            const [year, month] = monthStr.split("-").map(Number);
            const data = {
              uniqueId,
              userId,
              shiftId,
              year,
              month,
              yearMonth: monthStr,
              totalAnnualPaidLeave: totalAnnualPaidLeave,
              eachMonthPaidLeave: eachMonthPaidLeave,
              paidLeaveDay: paidLeaveDay,
              skipPaidLeaveMonth: skipPaidLeaveMonth,
              carryForwordPaidLeaveStatus: carryForwordPaidLeaveStatus,
              shortLoginDeductions: shortLoginDeductions,
              joiningDatePaidLeaveDeductions: joiningDatePaidLeaveDeductions,
              afterTwoYearExtraPaidLeave: afterTwoYearExtraPaidLeave,
              initialThreeMonthPaidLeaveStatus:
                initialThreeMonthPaidLeaveStatus,
              maternityLeave: maternityLeave,
              paternityLeave: paternityLeave,
              weekOnceLeaveUnplanned: weekOnceLeaveUnplanned,
              monthlyExtraWorkingDays: monthlyExtraWorkingDays,
              weekEnds: weekEnds,
              weekWorkingDays: weekWorkingDays,
              monthlyExtraFreeMin: monthlyExtraFreeMin,
              holidays: holidays,
              salary: salary,
              unPlannedLeaveExtraDeduction:
                unPlannedLeaveExtraDeduction || 0.25,
              plannedLeaveDeduction: 1,
            };
            return data;
          });
          if (insertPayload.length > 0) {
            const createStatus = await CommenService.addPaidLeavePolicy(
              SITE_DB_NAME,
              insertPayload
            );
            if (createStatus === "NA") {
              logger.error(
                "Database error in addPaidLeavePolicy application cron job",
                { error: createStatus, key: 0 }
              );
            } else {
              return [...createStatus, ...checkExist];
            }
          } else {
            return checkExist;
          }
        }
      );

      // // Wait for all days to be processed

      const insertData = await Promise.all(promises);
      return {
        success: true,
        msg: ["data found"],
        data: { insertData: insertData },
      };
    } catch (error) {
      logger.error("Database error in assignPaidLeavePolicy application", {
        error: error.message,
        key: 1,
      });
      const record = { success: true, msg: error.message, key: "error" };
      return record;
    }
  } catch (error) {
    logger.error("Database error in assignPaidLeavePolicy application", {
      error: error.message,
      key: 2,
    });
    const record = { success: true, msg: error.message, key: "error" };
    return record;
  }
};

const assignPaidLeave = async () => {
  const userIdCurrent = await CommenService.getSuperAdminId(SITE_DB_NAME);
  const roleNameCurrent = "Site-Owner";
  const unitIdsCurrent = [];

  if (!roleNameCurrent) {
    return { success: false, msg: msg.msgUnitNotExist, insertData: [] };
  }

  try {
    const startTime = Date.now();
    const getUser = await CommenService.getUser(
      SITE_DB_NAME,
      userIdCurrent,
      roleNameCurrent,
      unitIdsCurrent
    );
    if (getUser === "NA") {
      return { success: false, msg: msg.msgUserNotExist, insertData: [] };
    }

    const CurrentMonth = moment().format("YYYY-MM");
    const activeUsers = getUser.filter(
      async (user) => await isUserActiveInMonth(user, CurrentMonth)
    );

    const BATCH_SIZE = 10;
    const shiftCache = {}; // cache shift policies to reduce DB hits
    const insertData = [];

    for (let i = 0; i < activeUsers.length; i += BATCH_SIZE) {
      const batch = activeUsers.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (user) => {
          try {
            const userDetails = await CommenService.getUserDetails(
              SITE_DB_NAME,
              user._id
            );
            if (userDetails === "NA") return null;

            const { userId, uniqueId, shiftId } = userDetails;
            // if (uniqueId !== "BO12") return null; // Only process `WEB11` as per your condition

            // Optional: Cache shift policy
            // if (!shiftCache[shiftId]) {
            //   shiftCache[shiftId] = userDetails?.shiftDetails || {};
            // }

            const paidLeaveData =
              await CommenService.calculateMonthlyPaidLeaves(
                SITE_DB_NAME,
                userDetails,
                CurrentMonth
              );
            if (paidLeaveData.length > 0) {
              const bulkOps = paidLeaveData
                .filter(
                  (item) =>
                    item.userId &&
                    item.uniqueId &&
                    item.month &&
                    typeof item.leaveEarned === "number"
                )
                .map((item) => ({
                  updateOne: {
                    filter: {
                      userId: item.userId,
                      uniqueId: item.uniqueId,
                      month: item.month,
                    },
                    update: {
                      $set: {
                        leaveEarned: parseFloat(item.leaveEarned.toFixed(2)),
                        appliedLeave: item.appliedLeave || 0,
                        leaveForDeduction: item.leaveForDeduction || 0,
                        carryForward: item.carryForward || 0,
                        remainingBalance: item.remainingBalance || 0,
                        locked: !!item.locked,
                        note: item.note || "",
                        dbEditLocked: !!item.dbEditLocked,
                        encashed: item.encashed,
                        deductedPaidLeaves: item.deductedPaidLeaves,
                        leaveData: item?.leaveData || {},
                      },
                    },
                    upsert: true,
                  },
                }));

              const result = await CommenService.bulkCreditPaidLeave(
                SITE_DB_NAME,
                bulkOps
              );

              if (result) {
                return result;
              } else {
                return "";
              }
            } else {
              return "";
            }
          } catch (error) {
            logger.error("Error in paid leave batch user processing", {
              userId: user._id,
              error: error.message,
            });
            return { success: false, msg: error.message, key: "error" };
          }
        })
      );
      // Filter successful inserts only
      results.forEach((res) => {
        if (res.status === "fulfilled" && res.value) insertData.push(res.value);
      });
    }
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log("duration", duration);
    return {
      success: true,
      msg: ["Data processed successfully"],
      data: { insertData },
    };
  } catch (error) {
    logger.error("assignPaidLeave failed", { error: error.message });
    return { success: false, msg: error.message, key: "error" };
  }
};
const processingData = [
  body("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  body("dayMonthYear")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("monthDay")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { dayMonthYear, monthDay } = req.body;
    const monthYear = moment(dayMonthYear, "YYYY-MM-DD").format("YYYY-MM");

    const userIdCurrent = CURRENT_USER_ID;
    let createdById = CURRENT_USER_ID;
    let createdByIdName = CURRENT_USER?.name;
    let createdByIdImage = CURRENT_USER?.image;
    let createdByIdDesignationName = CURRENT_USER?.designationName;

    const roleNameCurrent = CURRENT_USER?.roleName;
    const unitIdsCurrent = CURRENT_USER?.unitId;

    try {
      const getUser = await CommenService.getUser(
        SITE_DB_NAME,
        userIdCurrent,
        roleNameCurrent,
        unitIdsCurrent
      );
      if (getUser === "NA") {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUserNotExist, proccess: [] });
      }
      const userChecks = await Promise.all(
        getUser.map(async (user) => ({
          user,
          isActive: await isUserActiveInMonth(
            user,
            moment(dayMonthYear, "YYYY-MM-DD").format("YYYY-MM")
          ),
        }))
      );
      const filterUser = userChecks
        .filter((check) => check.isActive)
        .map((check) => check.user);
      try {
        const promises = Array.from(
          {
            length: filterUser.length,
          },
          async (_, index) => {
            let userId,
              unitIds,
              uniqueId,
              joiningDate,
              shift,
              shiftId,
              name,
              image,
              gender,
              designationName,
              holidays,
              unitName,
              monthlyExtraWorkingDays,
              weekEnds,
              relievingDate,
              religiousBreak,
              weekWorkingDays,
              roleName;
            userId = filterUser[index]._id;
            const userDetails = await CommenService.getUserDetails(
              SITE_DB_NAME,
              userId
            );

            if (userDetails !== "NA") {
              userId = userDetails?.userId;
              unitIds = userDetails?.unitId;
              name = userDetails?.name;
              image = userDetails?.image;
              gender = userDetails?.gender;
              uniqueId = userDetails?.uniqueId;
              religiousBreak = userDetails?.religiousBreak;
              joiningDate = userDetails?.joiningDate;
              holidays = userDetails?.holidays || [];
              shift = userDetails?.shiftDetails || null;
              monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
              weekEnds = shift?.weekEnds || [];
              shiftId = userDetails?.shiftId;
              relievingDate = userDetails?.relievingDate;
              monthlyExtraFreeMin =
                userDetails?.shiftDetails?.monthlyExtraFreeMin;
              designationName = userDetails?.designationName;
              roleName = userDetails?.roleName;
              unitName = userDetails?.unitDetails[0].unitName;
              weekWorkingDays = shift?.weekWorkingDays || [];
            }
            if (!unitIds || unitIds?.length === 0) {
              // return res.status(200).json({ success: false, msg: msg.msgUnitNotExist, proccess: [] });
              return null;
            }
            const shiftIds = [shiftId];
            if (!shiftIds || shiftIds?.length === 0) {
              // return res.status(200).json({ success: false, msg: msg.msgUnitNotExist });
              return null;
            }
            if (!shift) {
              // return res.status(200).json({ success: false, msg: msg.msgShiftNotExist });
              return null;
            }
            if (
              !Array.isArray(shiftIds) ||
              !shiftIds ||
              shiftIds?.length === 0
            ) {
              // return res.status(200).json({ success: false, msg: msg.msgShiftNotExist });
              return null;
            }

            const proccessData = await CommenService.getProccessSingle(
              SITE_DB_NAME,
              userId,
              monthYear
            );
            const processArr = await CommenService.getProccess(
              SITE_DB_NAME,
              userId
            );

            let proccess = null;
            if (proccessData !== "NA") {
              const {
                startDate,
                endDate,
                startMonth,
                endMonth,
                remarks,
                status,
                salaryGiveByCompany,
                salaryGiveByCompanyYear,
                pfEligibility,
                esicEligibility,
                ptEligibility,
                finalBasic,
                hra,
                otherAllowance,
                grossSalary,
                actualBasicSalary,
                pfMinBasicSalary,
                epfp,
                epf,
                esicp,
                esic,
                emppfp,
                emppf,
                empesicp,
                empesic,
                totalCTC,
                totalCTCYearly,
                pt,
                otherTDS,
                totalDeduction,
                grandTotalCTCWithDeduction,
                grandTotalCTCWithDeductionYearly,
                deleteFlag,
                activeFlag,
                createdAt,
                updatedAt,
              } = proccessData ?? {};
              proccess = {
                _id: proccessData?._id,
                unitIds: proccessData?.unitIds,
                name: name,
                image: image,
                gender: gender,
                joiningDate: moment(joiningDate, "YYYY-MM-DD").format(
                  "DD-MM-YYYY"
                ),
                createdById: proccessData?.createdById,
                createdByName: proccessData?.createdById?.name,
                createdByImage: proccessData?.createdById?.image,
                createdByDesignationName:
                  proccessData?.createdById?.designationName,
                unitName: proccessData?.unitName,
                unitNameCurrent: unitName,
                roleName: roleName,
                designationName: designationName,
                userId: proccessData?.userId,
                uniqueId: proccessData?.uniqueId,
                startDate,
                endDate,
                startMonth,
                endMonth,
                remarks,
                status,
                salaryGiveByCompany,
                salaryGiveByCompanyYear,
                pfEligibility,
                esicEligibility,
                ptEligibility,
                finalBasic,
                hra,
                otherAllowance,
                grossSalary,
                actualBasicSalary,
                pfMinBasicSalary,
                epfp,
                epf,
                esicp,
                esic,
                emppfp,
                emppf,
                empesicp,
                empesic,
                totalCTC,
                totalCTCYearly,
                pt,
                otherTDS,
                totalDeduction,
                grandTotalCTCWithDeduction,
                grandTotalCTCWithDeductionYearly,
                deleteFlag,
                activeFlag,
                createdAt,
                updatedAt,
                ctcStatus: true,
                processArr: processArr,
              };
            } else {
              proccess = {
                _id: userId,
                createdById: createdById,
                createdByName: createdByIdName,
                createdByImage: createdByIdImage,
                createdByDesignationName: createdByIdDesignationName,
                unitIds: unitIds,
                unitName: unitName,
                unitNameCurrent: unitName,
                roleName: roleName,
                designationName: designationName,
                userId: userId,
                uniqueId: uniqueId,
                joiningDate: moment(joiningDate).format("DD-MM-YYYY"),
                name: name,
                image: image,
                gender: gender,
                status: "Pending",
                startDate: joiningDate,
                endDate: null,
                startMonth: moment(joiningDate).format("YYYY-MM"),
                endMonth: null,
                remarks: "",
                salaryGiveByCompany: 0,
                salaryGiveByCompanyYear: 0,
                pfEligibility: 0,
                esicEligibility: 0,
                ptEligibility: 0,
                finalBasic: 0,
                hra: 0,
                otherAllowance: 0,
                grossSalary: 0,
                actualBasicSalary: 0,
                pfMinBasicSalary: 0,
                epfp: 0,
                epf: 0,
                esicp: 0,
                esic: 0,
                emppfp: 0,
                emppf: 0,
                empesicp: 0,
                empesic: 0,
                totalCTC: 0,
                totalCTCYearly: 0,
                pt: 0,
                otherTDS: 0,
                totalDeduction: 0,
                grandTotalCTCWithDeduction: 0,
                grandTotalCTCWithDeductionYearly: 0,
                deleteFlag: 0,
                activeFlag: 0,
                ctcStatus: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                processArr: [],
              };
            }
            return proccess;
          }
        );

        // Wait for all days to be processed

        const processingDataAll = await Promise.all(promises);
        const ctcsp = await CommenService.getCTCSP(SITE_DB_NAME);
        return res.status(200).json({
          success: true,
          msg: ["data found"],
          data: {
            proccess: processingDataAll.filter((item) => item !== null),
            ctcsp: ctcsp,
          },
        });
      } catch (error) {
        console.log(error);
        logger.error("Database error in processingData 1 application", {
          error: error.message,
          key: 1,
        });
        const record = { success: true, msg: error.message, key: "error" };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in processingData application", {
        error: error.message,
        key: 2,
      });
      const record = { success: true, msg: error.message, key: "error" };
      return res.status(500).json(record);
    }
  },
];

//======================================  add Proccess ===========================
const addProccess = [
  //  validation

  body("proccessId")
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("uniqueId")
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("unitIds")
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("userId")
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("roleName")
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("unitName")
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("designationName")
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("actualBasicSalary")
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("finalBasic")
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("startDate")
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("startMonth")
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("status")
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("salaryGiveByCompany")
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("salaryGiveByCompanyYear")
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("finalBasic")
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("grossSalary")
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("actualBasicSalary")
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("totalCTC")
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("totalCTCYearly")
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    if (!CURRENT_USER) {
      return res
        .status(200)
        .json({ success: false, msg: msg.msgUnitNotExist, proccess: [] });
    }
    const userIdCurrent = CURRENT_USER_ID;
    const roleNameCurrent = CURRENT_USER?.roleName;
    if (!roleNameCurrent) {
      return res
        .status(200)
        .json({ success: false, msg: msg.msgUnitNotExist, proccess: [] });
    }
    if (roleNameCurrent !== "Site-Owner" && roleNameCurrent !== "Admin") {
      return res
        .status(200)
        .json({ success: false, msg: msg.msgUnitNotExist, proccess: [] });
    }
    try {
      const {
        proccessId,
        uniqueId,
        unitIds,
        userId,
        roleName,
        unitName,

        designationName,
        endDate,
        endMonth,
        epf,
        epfp,
        esic,
        esicp,
        emppfp,
        emppf,
        empesicp,
        empesic,
        pfEligibility,
        esicEligibility,
        ptEligibility,
        salaryGiveByCompany,
        salaryGiveByCompanyYear,
        finalBasic,
        hra,
        otherAllowance,
        grossSalary,
        actualBasicSalary,
        pfMinBasicSalary,
        esicMinGrossSalary,
        totalCTC,
        totalCTCYearly,
        pt,
        otherTDS,
        totalDeduction,

        grandTotalCTCWithDeduction,
        grandTotalCTCWithDeductionYearly,
        startDate,
        startMonth,
        status,
        remarks,
      } = req.body;

      const checkUser = await CommenService.checkUser(SITE_DB_NAME, userId);
      if (checkUser === "NA") {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUserNotExist });
      }

      try {
        const requestData = {
          createdById: userIdCurrent,
          uniqueId,
          unitIds,
          userId,
          roleName,
          unitName,

          designationName,
          endDate,
          endMonth,
          epf,
          epfp,
          esic,
          esicp,
          emppfp,
          emppf,
          empesicp,
          empesic,
          pfEligibility,
          esicEligibility,
          ptEligibility,
          salaryGiveByCompany,
          salaryGiveByCompanyYear,
          finalBasic,
          hra,
          otherAllowance,
          grossSalary,
          actualBasicSalary,
          pfMinBasicSalary,
          esicMinGrossSalary,
          totalCTC,
          totalCTCYearly,
          pt,
          otherTDS,
          totalDeduction,

          grandTotalCTCWithDeduction,
          grandTotalCTCWithDeductionYearly,
          startDate,
          startMonth,
          status,
          remarks,
        };
        const requestAddStatus = await CommenService.addProccess(
          SITE_DB_NAME,
          requestData
        );
        if (requestAddStatus === "NA") {
          const record = {
            success: false,
            msg: msg.msgProccessAddError,
          };
          return res.status(200).json(record);
        } else {
          const updatedDate = moment(startDate).subtract(1, "day");
          const endDate = updatedDate.format("YYYY-MM-DD");
          const endMonth = updatedDate.format("YYYY-MM");
          const updateData = { endDate, endMonth };
          const updateLastProccess = await CommenService.updateLastProccess(
            SITE_DB_NAME,
            proccessId,
            updateData
          );
          if (updateLastProccess === "NA") {
            logger.error("Proccess last id not found", {
              error: updateLastProccess,
              key: 0,
            });
          }
          // const notifyUsers = await CommenService.getUsersByUnitIdsAndRole(unitIds, roleName);
          // const recipientIds = notifyUsers
          //   .filter((user) => {
          //     const isSuperAdmin = user.roleName === "Site-Owner";
          //     const isAdminWithMatchingUnit = user.roleName === "Admin" && Array.isArray(user.unitId) && user.unitId.some((id) => unitIds.some((unitId) => unitId.equals(id))); //
          //     const isReportingManagerMatch = reportingManager && user._id && reportingManager.equals(user._id);

          //     return isReportingManagerMatch || isSuperAdmin || isAdminWithMatchingUnit;
          //   })
          //   .map((user) => user._id);

          // const APP_LOGO = process.env.APP_LOGO || "";
          // const APP_SITE_URL = process.env.SITE_URL || "";
          // const APP_DEEP_LINK_URL = process.env.APP_DEEP_LINK_URL || "";
          // const notiUserId = userId;
          // const action = "proccess";
          // const actionId = requestAddStatus._id;
          // const titles = msg.generateReiMessage("", "", "", "Created").title;
          // const messages = msg.generateReiMessage("", "", "", "Created").message;
          // const actionJson = {
          //   actionId: actionId,
          //   action: action,
          //   option: {
          //     logoUrl: APP_LOGO,
          //     redirectionUrl: { webLink: APP_SITE_URL, deepLink: APP_DEEP_LINK_URL },
          //     imageUrl: "",
          //     soundFile: "",
          //   },
          //   appType: "customer",
          // };
          // let notificationArr = [];
          // async function addNotifications(notiOtherUserIds) {
          //   for (const notiOtherUserId of notiOtherUserIds) {
          //     const notification = await OneSignalHelperUser.getNotificationArrSingle(SITE_DB_NAME,notiUserId, notiOtherUserId, action, actionId, titles, messages, actionJson);
          //     if (notification !== "NA") {
          //       notificationArr.push(notification);
          //     }
          //   }
          // }
          // await addNotifications(recipientIds);
          // if (notificationArr.length > 0) {
          //   await OneSignalHelperUser.oneSignalNotificationSendCall(notificationArr);
          // }

          const record = {
            success: true,
            msg: msg.msgProccessAddSuccess,
            data: { proccesss: requestAddStatus },
          };
          return res.status(200).json(record);
        }
      } catch (error) {
        logger.error("Database error in add proccesss application 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in add proccesss application 2", {
        error: error.message,
        key: 1,
      });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const round2 = (num) => parseFloat(num?.toFixed(2) || 0);
const toBoolNumber = (val) => {
  if (typeof val === "string") {
    val = val.trim().toLowerCase();
    return val === "yes" ? 1 : 0;
  }
  return val ? 1 : 0; // अगर पहले से boolean या number है
};
const uploadProccessExcel = [
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const userIdCurrent = CURRENT_USER_ID;
    const roleNameCurrent = CURRENT_USER?.roleName;

    try {
      const result = req.body;
      const validRecords = [];
      const invalidRecords = [];
      const ctcsp = await CommenService.getCTCSP(SITE_DB_NAME);
      let pfMinBasicSalary,
        epfp,
        esicp,
        esicMinGrossSalary,
        emppfp,
        emppf,
        empesicp,
        empesic = 0;
      pfMinBasicSalary = ctcsp.pfMinBasicSalary;
      esicMinGrossSalary = ctcsp.esicMinSalary;
      epfp = ctcsp.epfEmployerPfMinBasicSalaryPercentage;
      esicp = ctcsp.esicEmployerGrossPercentage;
      emppfp = ctcsp.pfEmployeePfMinBasicSalaryPercentage;
      empesicp = ctcsp.esicEmployeeGrossPercentage;

      for (let index = 0; index < result.length; index++) {
        const record = result[index];
        const errors = await validateProccess(record);
        if (!record.uniqueId || record.uniqueId.trim() === "") {
          return res.status(400).json({
            success: false,
            msg: "Missing Employee No. for record",
            key: 1,
          });
        }
        const existingEmployee = await CommenService.getEmployeeByUniqueId(
          SITE_DB_NAME,
          record?.uniqueId
        );
        if (!existingEmployee) {
          return res.status(404).json({
            success: false,
            msg: `Employee with Employee No. ${record?.uniqueId} not found`,
            key: 1,
          });
        }

        if (errors.length > 0) {
          invalidRecords.push({ record, errors });
          return res.status(200).json({
            success: false,
            msg: "Some records have validation errors",
            error: errors,
            invalidRecords,
          });
        }
        const userId = existingEmployee._id;
        const userDetails = await CommenService.getUserDetails(
          SITE_DB_NAME,
          userId
        );
        if (userDetails === "NA") {
          return res.status(404).json({
            success: false,
            msg: `Employee with Employee No ${record.uniqueId} not found`,
            key: 1,
            userDetails,
          });
        }

        let unitIds,
          roleName,
          unitName,
          designationName,
          endDate,
          startMonth,
          endMonth = null;
        let pt,
          otherTDS,
          salaryGiveByCompanyYear,
          totalCTCYearly,
          totalDeduction,
          grandTotalCTCWithDeduction,
          grandTotalCTCWithDeductionYearly = 0;
        startMonth = moment(record.startDate).format("YYYY-MM");
        unitIds = userDetails?.unitIds;
        roleName = userDetails?.roleName;
        unitName = userDetails?.unitDetails?.[0]?.unitName;
        designationName = userDetails?.designationName;
        salaryGiveByCompanyYear = round2(
          Number(record?.salaryGiveByCompany) * 12
        );
        totalCTCYearly = round2(Number(record?.totalCTC) * 12);
        totalDeduction = Number(pt || 0) + Number(otherTDS || 0);
        grandTotalCTCWithDeduction =
          Number(record?.totalCTC) - Number(pt || 0) - Number(otherTDS || 0);
        grandTotalCTCWithDeductionYearly = round2(
          Number(grandTotalCTCWithDeduction) * 12
        );

        let recordNumber = {
          epfp: Number(epfp),
          esicp: Number(esicp),
          emppfp: Number(emppfp),
          empesicp: Number(empesicp),
          emppf: Number(record?.emppf),
          empesic: Number(record?.empesic),
          pfMinBasicSalary: Number(pfMinBasicSalary),
          esicMinGrossSalary: Number(esicMinGrossSalary),
          epf: Number(record?.epf),
          esic: Number(record?.esic),
          salaryGiveByCompany: Number(record?.salaryGiveByCompany),
          finalBasic: Number(record?.finalBasic),
          hra: Number(record?.hra),
          otherAllowance: Number(record?.otherAllowance),
          grossSalary: Number(record?.salaryGiveByCompany),
          actualBasicSalary: Number(record?.salaryGiveByCompany - record?.hra),
          totalCTC: Number(record?.totalCTC),
          pt: Number(pt),
          otherTDS: Number(otherTDS),
          salaryGiveByCompanyYear: Number(salaryGiveByCompanyYear),
          totalCTCYearly: Number(totalCTCYearly),
          totalDeduction: Number(totalDeduction),
          grandTotalCTCWithDeduction: Number(grandTotalCTCWithDeduction),
          grandTotalCTCWithDeductionYearly: Number(
            grandTotalCTCWithDeductionYearly
          ),
        };

        recordNumber = await encryptDataByKey(recordNumber, recordNumberKeys);
        const requestData = {
          createdById: userIdCurrent,
          uniqueId: record?.uniqueId,
          unitIds,
          userId,
          roleName,
          unitName,
          designationName,
          startMonth,
          endDate,
          endMonth,
          startDate: record?.startDate,
          status: record?.status,
          remarks: record?.remarks,

          pfEligibility: toBoolNumber(record?.pfEligibility),
          esicEligibility: toBoolNumber(record?.esicEligibility),
          ptEligibility: toBoolNumber(record?.ptEligibility),

          pfMinBasicSalary: recordNumber?.pfMinBasicSalary,
          esicMinGrossSalary: recordNumber?.esicMinGrossSalary,
          epfp: recordNumber?.epfp,
          esicp: recordNumber?.esicp,

          epf: recordNumber?.epf,
          esic: recordNumber?.esic,
          emppfp: recordNumber?.emppfp,
          empesicp: recordNumber?.empesicp,

          emppf: recordNumber?.emppf,
          empesic: recordNumber?.empesic,
          salaryGiveByCompany: recordNumber?.salaryGiveByCompany,
          salaryGiveByCompanyYear: recordNumber?.salaryGiveByCompanyYear,
          finalBasic: recordNumber?.finalBasic,
          hra: recordNumber?.hra,
          otherAllowance: recordNumber?.otherAllowance,
          grossSalary: recordNumber?.grossSalary,

          actualBasicSalary: recordNumber?.actualBasicSalary,
          totalCTC: recordNumber?.totalCTC,
          totalCTCYearly: recordNumber?.totalCTCYearly,

          pt: recordNumber?.pt,
          otherTDS: recordNumber?.otherTDS,
          totalDeduction: recordNumber?.totalDeduction,
          grandTotalCTCWithDeduction: recordNumber?.grandTotalCTCWithDeduction,
          grandTotalCTCWithDeductionYearly:
            recordNumber?.grandTotalCTCWithDeductionYearly,
        };
        validRecords.push(requestData);
      }

      try {
        let requestAddStatus = [];
        if (validRecords.length > 0) {
          requestAddStatus = await CommenService.bulkAddProccess(
            SITE_DB_NAME,
            validRecords
          );
          if (requestAddStatus === "NA") {
            const record = {
              success: false,
              msg: msg.msgProccessAddError,
            };
            return res.status(200).json(record);
          }
        }

        const record = {
          success: true,
          msg: msg.msgProccessAddSuccess,
          data: { proccesss: requestAddStatus },
        };
        return res.status(200).json(record);
      } catch (error) {
        logger.error("Database error in add proccesss builk application 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in add proccesss application 2", {
        error: error.message,
        key: 1,
      });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];

const validateProccess = async (proccess) => {
  try {
    const validationErrors = [];

    const fields = [
      "uniqueId",
      "pfEligibility",
      "esicEligibility",
      "ptEligibility",
      "salaryGiveByCompany",
      "finalBasic",

      // "grossSalary",
      // "actualBasicSalary",
      "totalCTC",
      "startDate",
      "status",
    ];

    for (const field of fields) {
      if (
        proccess[field] === null ||
        proccess[field] === undefined ||
        (typeof proccess[field] === "string" &&
          proccess[field].trim() === "") ||
        (typeof proccess[field] !== "string" && !proccess[field])
      ) {
        validationErrors.push(
          msg[`msg${field.charAt(0).toUpperCase() + field.slice(1)}Required`]
        );
      }
    }

    return validationErrors;
  } catch (error) {
    logger.error("Database error in validateProccess error", {
      error: error.message,
    });
  }
};

const sendPunchMissingMail = async () => {
  try {
    const startTime = Date.now();

    // 1. Fetch punch-missing records
    const punchMissingData = await CommenService.getPunchMismatchRecords(
      SITE_DB_NAME
    );
    console.log(`Found ${punchMissingData.length} punch-missing records.`);

    if (!punchMissingData || punchMissingData.length === 0) {
      return { success: true, msg: "No punch-missing records to process." };
    }

    // Common static values
    const languageId = "0";
    const siteURL = process.env.SITE_URL + "/myattendance";
    const mailHeading = msg.mailHeadingPunchMissing[languageId];
    const headerGreeting = msg.mailHeaderGreetingPunchMissing[languageId];
    const mailFromName = process.env.MAIL_FROM_NAME;
    const appName = process.env.APP_NAME;
    const appLogo = process.env.APP_LOGO;
    const borderBackground = process.env.BORDERBACKGROUND;
    const footerGreeting = msg.mailFooterGreeting[languageId];
    const footerDescription = msg.mailFooterDescription[languageId];
    const footerBackground = process.env.FOOTERBACKGROUND;

    const chunkSize = 10;

    // 2. Process in batches
    for (let i = 0; i < punchMissingData.length; i += chunkSize) {
      const batchStartTime = Date.now();
      const batch = punchMissingData.slice(i, i + chunkSize);

      // 3. Prepare mail data for this batch (parallel processing)
      const mailData = await Promise.all(
        batch.map(async (attendance) => {
          const mailEmail = attendance?.userId?.email || "NA";
          const mailName = attendance?.userId?.name || "NA";
          const mailSubject = `${msg.mailSubjectPunchMissing[languageId]}`;

          const mailContent = msg.mailContentPunchMissing(
            moment(attendance.date).format("DD-MM-YYYY"),
            siteURL,
            footerBackground
          )[languageId];

          const mailBody = await MailFunctions.mailBodyData({
            appName,
            appLogo,
            borderBackground,
            mailHeading,
            headerGreeting,
            name: mailName,
            mailContent,
            footerGreeting,
            footerBackground,
            footerDescription,
          });

          return {
            email: mailEmail,
            subject: mailSubject,
            mailBody: mailBody,
            id: attendance._id,
          };
        })
      );

      // 4. Send batch emails
      const response = await MailFunctions.bulkMailSend(mailFromName, mailData);

      if (!response) {
        console.error(`Batch ${i / chunkSize + 1} failed to send emails.`);
        continue;
      }

      // 5. Mark attendance as mailed
      const attendanceIds = mailData.map((m) => m.id);
      if (attendanceIds.length > 0) {
        await CommenService.markAttendanceMailSent(SITE_DB_NAME, attendanceIds);
      }

      const batchEndTime = Date.now();
      console.log(
        `Batch ${i / chunkSize + 1}: ${
          attendanceIds.length
        } records processed successfully in ${(
          (batchEndTime - batchStartTime) /
          1000
        ).toFixed(2)}s`
      );
    }

    const endTime = Date.now();
    console.log(
      `All batches completed in ${((endTime - startTime) / 1000).toFixed(2)}s`
    );

    return { success: true, msg: msg.mailPunchMissingSuccess };
  } catch (error) {
    logger.error("Punch Missing Mail Error:", { error: error.message });
    return { success: false, msg: msg.msgServerError, key: error };
  }
};
// =================================================================Month Ly Proccess

const processingDataMonthly = [
  body("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  body("dayMonthYear")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("monthDay")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag, dayMonthYear, monthDay, roleBack } = req.body;
    const monthYear = moment(dayMonthYear, "YYYY-MM-DD").format("YYYY-MM");

    const userIdCurrent = CURRENT_USER_ID;
    let createdById = CURRENT_USER_ID;
    const roleNameCurrent = CURRENT_USER?.roleName;
    const unitIdsCurrent = CURRENT_USER?.unitId;

    try {
      const ctcsp = await CommenService.getCTCSP(SITE_DB_NAME);
      try {
        const getUser = await CommenService.getUser(
          SITE_DB_NAME,
          userIdCurrent,
          roleNameCurrent,
          unitIdsCurrent
        );
        const filter = { month: monthYear };
        const search = req?.body?.search ?? {
          searchText: "",
          searchColumns: [],
        };
        const pagination = req?.body?.pagination ?? { page: 1, limit: 500 };
        if (getUser === "NA") {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgUserNotExist, proccess: [] });
        }
        const userChecks = await Promise.all(
          getUser.map(async (user) => ({
            user,
            isActive: await isUserActiveInMonth(
              user,
              moment(dayMonthYear, "YYYY-MM-DD").format("YYYY-MM")
            ),
          }))
        );
        const filterUser = userChecks
          .filter((check) => check.isActive)
          .map((check) => check.user);
        const promises = Array.from(
          {
            length: filterUser.length,
          },
          async (_, index) => {
            let user = filterUser[index];
            let userId = filterUser[index]._id;
            let unitIds = user?.unitId;
            let uniqueId = user?.uniqueId;
            let designationName = user?.designationName;
            let roleName = user?.roleName;
            let unitName = user?.unitName || "NA";

            if (!unitIds || unitIds?.length === 0) {
              return null;
            }
            let monthlyProccessSingle =
              await CommenService.getMonthlyProccessSingle(
                SITE_DB_NAME,
                userId,
                monthYear
              );
            if (monthlyProccessSingle !== "NA") {
              const isInArray =
                Array.isArray(roleBack) &&
                roleBack.includes(monthlyProccessSingle._id.toString());
              if (monthlyProccessSingle.isFrozen === "Yes" && !isInArray) {
                return null;
              }
            }
            const proccessData = await CommenService.getProccessSingle(
              SITE_DB_NAME,
              userId,
              monthYear
            );

            if (proccessData === "NA") {
              return null;
            }

            const proccessDecryptData = await decryptDataByKey(
              proccessData,
              recordNumberKeys
            );

            const calculationProccess = await calculationProccessFunction(
              ctcsp,
              proccessDecryptData,
              user,
              monthYear
            );

            if (calculationProccess === "NA") {
              return null;
            }
            // console.log("calculationProccess", calculationProccess);
            const monthlyProccessDecryptData = {
              month: monthYear,
              proccessId: proccessDecryptData?._id,
              createdById: createdById,
              unitIds: unitIds,
              unitName: unitName,
              roleName: roleName,
              designationName: designationName,
              userId: userId,
              uniqueId: uniqueId,
              startDate: proccessDecryptData?.startDate,
              endDate: proccessDecryptData?.endDate,
              startMonth: proccessDecryptData?.startMonth,
              endMonth: proccessDecryptData?.endMonth,
              remarks: proccessDecryptData?.remarks,
              salaryGiveByCompany: proccessDecryptData?.salaryGiveByCompany,
              salaryGiveByCompanyYear:
                proccessDecryptData?.salaryGiveByCompanyYear,
              pfEligibility: proccessDecryptData?.pfEligibility,
              esicEligibility: proccessDecryptData?.esicEligibility,
              ptEligibility: proccessDecryptData?.ptEligibility,
              finalBasic: proccessDecryptData?.finalBasic,
              hra: proccessDecryptData?.hra,
              otherAllowance: proccessDecryptData?.otherAllowance,
              grossSalary: proccessDecryptData?.grossSalary,
              actualBasicSalary: proccessDecryptData?.actualBasicSalary,
              pfMinBasicSalary: proccessDecryptData?.pfMinBasicSalary,
              esicMinGrossSalary: proccessDecryptData?.esicMinGrossSalary,
              epfp: proccessDecryptData?.epfp,
              epf: proccessDecryptData?.epf,
              esicp: proccessDecryptData?.esicp,
              esic: proccessDecryptData?.esic,
              totalCTC: proccessDecryptData?.totalCTC,
              emppfp: proccessDecryptData?.emppfp,
              empesicp: proccessDecryptData?.empesicp,
              emppf: proccessDecryptData?.emppf,
              empesic: proccessDecryptData?.empesic,
              totalCTCYearly: proccessDecryptData?.totalCTCYearly,
              pt: proccessDecryptData?.pt,
              otherTDS: proccessDecryptData?.otherTDS,
              totalDeduction: proccessDecryptData?.totalDeduction,
              grandTotalCTCWithDeduction:
                proccessDecryptData?.grandTotalCTCWithDeduction,
              grandTotalCTCWithDeductionYearly:
                proccessDecryptData?.grandTotalCTCWithDeductionYearly,
              lastUpdatedById: createdById,
              status: "Initial",
              statusById: createdById,
              payStatus: "Unpaid",
              payStatusById: null,
              isFrozen: "No",
              isFrozenById: null,
              attendanceData: calculationProccess?.attendanceData,
              totalLeaveDeductionDays:
                calculationProccess?.totalLeaveDeductionDays,
              totalPresentDays: calculationProccess?.totalPresentDays,
              earnCompOffDays: calculationProccess?.earnCompOffDays,
              earnEncashLeave: calculationProccess?.earnEncashLeave,
              earnCompOffDaysAmount: calculationProccess?.earnCompOffDaysAmount,
              earnEncashLeaveAmount: calculationProccess?.earnEncashLeaveAmount,
              earnLWP: calculationProccess?.earnLWP,
              earnLWPAmount: calculationProccess?.earnLWPAmount,
              earnTotalPay: calculationProccess?.earnTotalPay,
              earnfinalBasic: calculationProccess?.earnfinalBasic,
              earnhra: calculationProccess?.earnhra,
              earnotherAllowance: calculationProccess?.earnotherAllowance,
              earngrossSalary: calculationProccess?.earngrossSalary,
              earnactualBasicSalary: calculationProccess?.earnactualBasicSalary,
              earnpfMinBasicSalary: calculationProccess?.earnpfMinBasicSalary,
              earnesicMinGrossSalary:
                calculationProccess?.earnesicMinGrossSalary,
              earnepfp: calculationProccess?.earnepfp,
              earnepf: calculationProccess?.earnepf,
              earnesic: calculationProccess?.earnesic,
              earnesicp: calculationProccess?.earnesicp,
              earntotalCTC: calculationProccess?.earntotalCTC,
              earnemppfp: calculationProccess?.earnemppfp,
              earnemppf: calculationProccess?.earnemppf,
              earnempesicp: calculationProccess?.earnempesicp,
              earnempesic: calculationProccess?.earnempesic,
              earnIncentiveAmount: calculationProccess?.earnIncentiveAmount,
              earnTotalPayWithIncentive:
                calculationProccess?.earnTotalPayWithIncentive,
              earnempptDeduction: calculationProccess?.earnempptDeduction,
              earnempTDSDeduction: calculationProccess?.earnempTDSDeduction,
              earnempwelfareDeduction:
                calculationProccess?.earnempwelfareDeduction,
              earnempotherDeduction: calculationProccess?.earnempotherDeduction,
              earnempTotalDeduction: calculationProccess?.earnempTotalDeduction,
              earnNetPay: calculationProccess?.earnNetPay,
              earnReimbursementAmount:
                calculationProccess?.earnReimbursementAmount,
              earnOtherAmount: calculationProccess?.earnOtherAmount,
              earnFinalNetPay: calculationProccess?.earnFinalNetPay,
            };
            const dataProccessSingle = await encryptDataByKey(
              monthlyProccessDecryptData,
              monthlyRecordNumberKeys
            );

            const addProccessSingle =
              monthlyProccessSingle === "NA"
                ? await CommenService.addMonthlyProccessSingle(
                    SITE_DB_NAME,
                    dataProccessSingle
                  )
                : await CommenService.updateMonthlyProccessSingle(
                    SITE_DB_NAME,
                    monthlyProccessSingle._id,
                    dataProccessSingle
                  );
            if (addProccessSingle === "NA") {
              return null;
            } else {
              return addProccessSingle;
            }
          }
        );

        // Wait for all days to be processed
        if (promises.length > 0) {
          const monthlyProccessDataAll = await Promise.all(
            promises.filter((item) => item !== null)
          );
        }

        try {
          const monthlyProccess = await CommenService.getMonthlyProccess(
            SITE_DB_NAME,
            filter,
            search,
            pagination
          );

          return res.status(200).json({
            success: true,
            msg: ["data found"],
            data: {
              ctcsp: ctcsp,
              monthlyProccess: monthlyProccess?.data || [],
              total: monthlyProccess?.total || [],
              page: monthlyProccess?.page || [],
              limit: monthlyProccess?.limit || [],
            },
          });
        } catch (error) {
          logger.error("Database error in processingData application", {
            error: error.message,
            key: 0,
          });
          const record = { success: true, msg: error.message, key: "error" };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in processingData application", {
          error: error.message,
          key: 1,
        });
        const record = { success: true, msg: error.message, key: "error" };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in processingData application", {
        error: error.message,
        key: 2,
      });
      const record = { success: true, msg: error.message, key: "error" };
      return res.status(500).json(record);
    }
  },
];
const exportAttendance = [
  query("dayMonthYear")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  query("monthDay")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  query("unitId")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag, dayMonthYear, monthDay, unitId, unitName } = req.query;
    if (!CURRENT_USER) {
      return res
        .status(200)
        .json({ success: false, msg: msg.msgUnitNotExist, attendances: [] });
    }
    const userIdCurrent = CURRENT_USER_ID;
    const roleNameCurrent = CURRENT_USER?.roleName;
    const unitIdsCurrent = CURRENT_USER?.unitId;
    if (!roleNameCurrent) {
      return res
        .status(200)
        .json({ success: false, msg: msg.msgUnitNotExist, attendances: [] });
    }
    const monthYear = moment(dayMonthYear, "YYYY-MM-DD").format("YYYY-MM");
    try {
      try {
        const checkUnitId = await CommenService.checkUnit(SITE_DB_NAME, unitId);
        const getUser = await CommenService.getUserForExportAttendance(
          SITE_DB_NAME,
          userIdCurrent,
          roleNameCurrent,
          [checkUnitId]
        );
        if (getUser === "NA") {
          return res.status(200).json({
            success: false,
            msg: msg.msgUserNotExist,
            attendances: [],
          });
        }
        const userChecks = await Promise.all(
          getUser.map(async (user) => ({
            user,
            isActive: await isUserActiveInMonth(
              user,
              moment(dayMonthYear, "YYYY-MM-DD").format("YYYY-MM")
            ),
          }))
        );
        const filterUser = userChecks
          .filter((check) => check.isActive)
          .map((check) => check.user);
        const promises = Array.from(
          {
            length: filterUser.length,
          },
          async (_, index) => {
            let userId,
              unitIds,
              uniqueId,
              religiousBreak,
              joiningDate,
              holidays,
              shift,
              shiftId,
              name,
              monthlyExtraFreeMin,
              relievingDate,
              image,
              monthlyExtraWorkingDays,
              weekEnds,
              email,
              designationName,
              bankName,
              bankAccountNumber,
              IFSCCode,
              personalEmail,
              accountHolderName,
              departmentName,
              shortLoginDeductions,
              unPlannedLeaveExtraDeduction,
              plannedLeaveDeduction = 1,
              weekWorkingDays;
            userId = filterUser[index]._id;
            const leaves = await CommenService.getMyLeavesCount(
              SITE_DB_NAME,
              userId,
              "month",
              monthYear,
              0
            );
            const paidLeaves = await CommenService.getPaidLeave(
              SITE_DB_NAME,
              userId,
              monthYear
            );
            let carryForward = 0;
            let leaveEarned = 0;
            let appliedLeave = 0;
            let leaveForDeduction = 0;
            let remainingBalance = 0;
            let encashed = 0;
            let deductedPaidLeaves = 0;
            let leaveData = {};

            if (paidLeaves.length > 0) {
              leaveEarned = paidLeaves[0].leaveEarned;
              carryForward = paidLeaves[0].carryForward;
              appliedLeave = paidLeaves[0].appliedLeave;
              leaveForDeduction = paidLeaves[0].leaveForDeduction;
              remainingBalance = paidLeaves[0].remainingBalance;
              encashed = paidLeaves[0].encashed;
              deductedPaidLeaves = paidLeaves[0].deductedPaidLeaves;
              leaveData = paidLeaves[0].leaveData;
            }
            const userDetails = await CommenService.getUserDetails(
              SITE_DB_NAME,
              userId
            );
            if (userDetails !== "NA") {
              userId = userDetails?.userId;
              unitIds = userDetails?.unitId;
              name = userDetails?.name;
              email = userDetails?.email;
              image = userDetails?.image;
              uniqueId = userDetails?.uniqueId;
              personalEmail = userDetails?.personalEmail;
              bankName = userDetails?.bankName;
              bankAccountNumber = userDetails?.bankAccountNumber;
              IFSCCode = userDetails?.IFSCCode;
              accountHolderName = userDetails?.accountHolderName;
              departmentName = userDetails?.departmentDetails?.departmentName;
              religiousBreak = userDetails?.religiousBreak;
              joiningDate = userDetails?.joiningDate;
              holidays = userDetails?.holidays || [];
              shift = userDetails?.shiftDetails || null;
              monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
              weekEnds = shift?.weekEnds || [];
              shiftId = userDetails?.shiftId;
              relievingDate = userDetails?.relievingDate;
              monthlyExtraFreeMin =
                userDetails?.shiftDetails?.monthlyExtraFreeMin;
              designationName = userDetails?.designationName;
              weekWorkingDays = shift?.weekWorkingDays || [];
              shortLoginDeductions =
                userDetails?.shiftDetails?.shortLoginDeductions;
              unPlannedLeaveExtraDeduction =
                userDetails?.shiftDetails?.unPlannedLeaveExtraDeduction;
            }
            const allpolicy = await CommenService.checkExistPaidLeavePolicy(
              SITE_DB_NAME,
              userId,
              [monthYear]
            );
            const findPaildLeavePolicy =
              allpolicy.length > 0 ? allpolicy[0] : null;

            if (findPaildLeavePolicy) {
              shortLoginDeductions = findPaildLeavePolicy?.shortLoginDeductions;
              weekWorkingDays = findPaildLeavePolicy?.weekWorkingDays;
              weekEnds = findPaildLeavePolicy?.weekEnds;
              monthlyExtraWorkingDays =
                findPaildLeavePolicy?.monthlyExtraWorkingDays;
              monthlyExtraFreeMin = findPaildLeavePolicy?.monthlyExtraFreeMin;
              holidays = findPaildLeavePolicy?.holidays;
              shiftId = findPaildLeavePolicy?.shiftId;
              unPlannedLeaveExtraDeduction =
                findPaildLeavePolicy?.unPlannedLeaveExtraDeduction;
              plannedLeaveDeduction =
                findPaildLeavePolicy?.plannedLeaveDeduction;
            }
            if (!unitIds || unitIds?.length === 0) {
              return null;
            }
            const shiftIds = [shiftId];
            if (!shiftIds || shiftIds?.length === 0) {
              return null;
            }
            if (!shift) {
              return null;
            }
            if (
              !Array.isArray(shiftIds) ||
              !shiftIds ||
              shiftIds?.length === 0
            ) {
              return null;
            }
            const [yearStr, monthStr] = monthYear.split("-");
            const year = parseInt(yearStr);
            const month = parseInt(monthStr);
            const isJoiningMonth =
              year === new Date(joiningDate).getFullYear() &&
              month === new Date(joiningDate).getMonth() + 1;
            const isRelievingMonth = relievingDate
              ? year ===
                  new Date(
                    relievingDate.toISOString().split("T")[0]
                  ).getFullYear() &&
                month ===
                  new Date(
                    relievingDate.toISOString().split("T")[0]
                  ).getMonth() +
                    1
              : false;

            const currentDate = new Date().toISOString().split("T")[0];
            const promisesAtt = Array.from(
              { length: monthDay },
              async (_, index) => {
                const day = index + 1;
                const attendanceDate = `${monthYear}-${String(day).padStart(
                  2,
                  "0"
                )}`;

                const weekDay = new Date(attendanceDate).getDay();
                if (
                  new Date(currentDate) < new Date(attendanceDate) ||
                  new Date(joiningDate) > new Date(attendanceDate)
                ) {
                  //return null;
                }
                if (relievingDate) {
                  if (
                    new Date(relievingDate.toISOString().split("T")[0]) <
                    new Date(attendanceDate)
                  ) {
                    //return null;
                  }
                }

                const attendance = await CommenService.attendanceByDate(
                  SITE_DB_NAME,
                  userId,
                  attendanceDate
                );

                let shiftReligiousBreakDuration = 0;
                if (religiousBreak > 0) {
                  shiftReligiousBreakDuration = shift?.religiousBreakMin;
                }

                if (!attendance) {
                  let status = "Absent";

                  const holidayStatus = holidays.find((holiday) => {
                    const holidayDate = new Date(holiday.date)
                      .toISOString()
                      .split("T")[0];
                    return holidayDate === attendanceDate;
                  });
                  let dayName = moment(attendanceDate, "YYYY-MM-DD").format(
                    "dddd"
                  );
                  let weekNumber = Math.ceil(day / 7);

                  let isExtraWorkingDay = monthlyExtraWorkingDays.includes(
                    `${weekNumber}${dayName}`
                  );
                  if (!holidayStatus && weekEnds.includes(dayName)) {
                    status = "Weekend";
                    if (isExtraWorkingDay) {
                      status = "Absent";
                    }
                    const weekWorkingDates = getWeekDatesByNames(
                      attendanceDate,
                      weekWorkingDays
                    );
                    // const weekAttendancesStatus = await Attendance.find({
                    //   userId: userId,
                    //   date: { $in: weekWorkingDates },
                    //   status: { $in: ["Present"] },
                    // });
                    const weekAttendancesStatus =
                      await CommenService.getWeekAttendancesStatus(
                        SITE_DB_NAME,
                        userId,
                        weekWorkingDates
                      );

                    const weekHolidays = holidays.some((holiday) => {
                      const holidayDate = new Date(holiday.date)
                        .toISOString()
                        .split("T")[0];
                      return weekWorkingDates.includes(holidayDate);
                    });
                    if (weekAttendancesStatus.length === 0 && !weekHolidays) {
                      status = "Absent";
                    }
                  }
                  // If it's Holiday
                  else if (holidayStatus && !weekEnds.includes(dayName)) {
                    status = "Holiday";
                  } else if (holidayStatus && weekEnds.includes(dayName)) {
                    status = `Holiday (Weekend)`;
                  }

                  return {
                    _id: userId + uniqueId,
                    userId: userId,
                    unitIds: unitIds,
                    uniqueId: uniqueId,
                    name: name,
                    image: image,
                    shiftId: shiftId,
                    shiftStart: shift?.startTime,
                    shiftEnd: shift?.endTime,
                    shiftBreakDuration: shift?.breakDuration,
                    shiftReligiousBreakDuration: shiftReligiousBreakDuration,
                    date: new Date(attendanceDate),
                    punches: [],
                    firstIn: null,
                    firstInStatus: 0,
                    lastOut: null,
                    lastOutStatus: 0,
                    workingHrs: "00:00",
                    workingMin: 0,
                    totalWorkingHrs: "00:00",
                    totalWorkingMin: 0,
                    breakDuration: 0,
                    lateBy: 0,
                    overTime: 0,
                    status: status,
                    presentStatus: "No",
                    leaveStatus: "No",
                    leaveType: "No",
                    activeFlag: 1,
                    shortLoginHDStatus: 0,
                    religiousBreakDuration: shiftReligiousBreakDuration,
                    religiousBreakStatus: religiousBreak,
                    designationName: designationName,
                    deleteFlag: deleteFlag || 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    lateByEarly: 0,
                    takenBreak: 0,
                  };
                } else {
                  return attendance;
                }
              }
            );
            const userAttendances = await Promise.all(promisesAtt);
            let presentDays = 0;
            let halfDays = 0;
            let halfDayDeduction = 0;
            let absentDays = 0;
            let punchMissingDays = 0;
            let totalShortLogin = 0;
            let totalLateByEarly = 0;
            let totalBreakDuration = 0;
            let totalShiftBreakDuration = 0;
            let totalBreakShortLogin = 0;

            let totalDeduction = 0,
              shortLoginDeduction = 0,
              unplanned = 0,
              planned = 0,
              sick = 0,
              maternity = 0,
              paternity = 0;
            const pl = Number(plannedLeaveDeduction) || 0;
            const up = Number(unPlannedLeaveExtraDeduction) || 0;
            // Wait for all days to be processed
            const userAttendanceResults = await Promise.all(
              userAttendances
                .filter((item) => item !== null)
                .map(async (a, inx) => {
                  const exstatus =
                    a.status === "Present"
                      ? a.punches?.length % 2 === 0
                        ? a?.shortLoginHDStatus === 0
                          ? "P"
                          : "HD"
                        : "PM"
                      : a.status === "Absent"
                      ? "A"
                      : a.status === "Holiday"
                      ? "H"
                      : a.status === "Weekend"
                      ? "W"
                      : a.status === "Holiday (Weekend)"
                      ? "HW"
                      : "NA";
                  const dateStr = moment(a.date).format("YYYY-MM-DD");
                  if (exstatus === "HD") {
                    //halfDays += 1;
                    //presentDays += 0.5;
                    const leave = await CommenService.leaveByDate(
                      SITE_DB_NAME,
                      userId,
                      dateStr
                    );

                    if (leave) {
                      if (
                        leave.dayType !== "FullDay" &&
                        leave?.leaveType === "Unplanned"
                      ) {
                        halfDays += Math.max(pl, 0) / 2 + Math.max(up, 0) / 2;
                        presentDays += 0.5;
                        unplanned += 0.5;
                      } else {
                        halfDays += Math.max(pl, 0) / 2;
                        presentDays += 0.5;
                        if (leave?.leaveType === "Planned") planned += 0.5;
                        else if (leave?.leaveType === "Sick") sick += 0.5;
                      }
                    } else {
                      halfDays += Math.max(pl, 0) / 2 + Math.max(up, 0) / 2;
                      presentDays += 0.5;
                      unplanned += 0.5;
                    }
                  } else if (exstatus === "A") {
                    // absentDays += 1;
                    const leave = await CommenService.leaveByDate(
                      SITE_DB_NAME,
                      userId,
                      dateStr
                    );

                    if (leave) {
                      if (
                        leave.dayType === "FullDay" &&
                        leave?.leaveType === "Unplanned"
                      ) {
                        absentDays += Math.max(pl, 0) + Math.max(up, 0);
                        unplanned += 1;
                      } else {
                        absentDays += Math.max(pl, 0);
                        if (leave?.leaveType === "Planned") planned += 1;
                        else if (leave?.leaveType === "Sick") sick += 1;
                        else if (leave?.leaveType === "Maternity")
                          maternity += 1;
                        else if (leave?.leaveType === "Paternity")
                          paternity += 1;
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
                  } else if (exstatus === "PM") {
                    punchMissingDays += 1;
                  } else {
                    presentDays += 1;
                  }
                  totalShortLogin += a.lateBy;
                  totalLateByEarly += a.lateByEarly;
                  totalBreakDuration += a.takenBreak;
                  totalShiftBreakDuration += a.shiftBreakDuration;
                  totalBreakShortLogin += Math.max(
                    0,
                    a.takenBreak - a.shiftBreakDuration
                  );
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

                  shortLoginDeduction = getDeductionFromSlab(
                    shortLoginDeductions,
                    totalShortLogin
                  );
                  halfDayDeduction = Number(halfDays * 2);
                  totalDeduction =
                    Number(shortLoginDeduction) +
                    Number(absentDays) +
                    Number(halfDays);
                  // `[${exstatus},${a.lateBy}]`

                  return exstatus;
                })
            );
            const row = [
              index + 1,
              uniqueId,
              name,
              departmentName,
              moment(joiningDate, "YYYY-MM-DD").format("DD-MM-YYYY"),
              ...userAttendanceResults,
              // totalShiftBreakDuration,
              totalBreakDuration,
              totalBreakShortLogin,
              totalLateByEarly,
              totalShortLogin,
              // presentDays,
              // halfDays,
              // absentDays,
              // punchMissingDays || 0,
              //===========================
              punchMissingDays,
              presentDays,
              halfDayDeduction,
              absentDays,
              shortLoginDeduction,
              totalDeduction,
              unplanned,
              planned,
              sick,
              maternity,
              paternity,
              leaveForDeduction,
              //===========================

              shift?.shiftName,
              email,
              personalEmail,
              bankAccountNumber,
              IFSCCode,
              bankName,
              accountHolderName,
              leaves?.totalLeaves || 0,
              leaves?.Unplanned || 0,
              leaves?.Planned || 0,
              leaves?.Sick || 0,
              leaves?.Maternity || 0,
              leaves?.Paternity || 0,
              carryForward,
              leaveEarned,
              appliedLeave,
              leaveForDeduction,
              remainingBalance,
              encashed,
              deductedPaidLeaves,
              JSON.stringify(leaveData),
              JSON.stringify(paidLeaves),
            ];
            // sheet.addRow(row);
            return row;
          }
        );

        // Wait for all employee to be processed

        const attendances = await Promise.all(promises);

        return res.status(200).json({
          success: true,
          msg: ["data found"],
          data: { attendances: attendances.filter((item) => item !== null) },
        });
      } catch (error) {
        logger.error("Database error in attendances application", {
          error: error.message,
          key: 1,
        });
        const record = { success: true, msg: error.message, key: "error" };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in attendances application", {
        error: error.message,
        key: 2,
      });
      const record = { success: true, msg: error.message, key: "error" };
      return res.status(500).json(record);
    }
  },
];
const exportAttendanceBreak = [
  query("dayMonthYear")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  query("monthDay")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  query("unitId")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag, dayMonthYear, monthDay, unitId, unitName } = req.query;
    if (!CURRENT_USER) {
      return res
        .status(200)
        .json({ success: false, msg: msg.msgUnitNotExist, attendances: [] });
    }
    const userIdCurrent = CURRENT_USER_ID;
    const roleNameCurrent = CURRENT_USER?.roleName;
    const unitIdsCurrent = CURRENT_USER?.unitId;
    if (!roleNameCurrent) {
      return res
        .status(200)
        .json({ success: false, msg: msg.msgUnitNotExist, attendances: [] });
    }
    const monthYear = moment(dayMonthYear, "YYYY-MM-DD").format("YYYY-MM");
    try {
      try {
        const checkUnitId = await CommenService.checkUnit(SITE_DB_NAME, unitId);
        const getUser = await CommenService.getUserForExportAttendance(
          SITE_DB_NAME,
          userIdCurrent,
          roleNameCurrent,
          [checkUnitId]
        );
        if (getUser === "NA") {
          return res.status(200).json({
            success: false,
            msg: msg.msgUserNotExist,
            attendances: [],
          });
        }
        const userChecks = await Promise.all(
          getUser.map(async (user) => ({
            user,
            isActive: await isUserActiveInMonth(
              user,
              moment(dayMonthYear, "YYYY-MM-DD").format("YYYY-MM")
            ),
          }))
        );
        const filterUser = userChecks
          .filter((check) => check.isActive)
          .map((check) => check.user);
        const promises = Array.from(
          {
            length: filterUser.length,
          },
          async (_, index) => {
            let userId,
              unitIds,
              uniqueId,
              religiousBreak,
              joiningDate,
              holidays,
              shift,
              shiftId,
              name,
              monthlyExtraFreeMin,
              relievingDate,
              image,
              monthlyExtraWorkingDays,
              weekEnds,
              email,
              designationName,
              bankName,
              bankAccountNumber,
              IFSCCode,
              personalEmail,
              accountHolderName,
              departmentName,
              shortLoginDeductions,
              unPlannedLeaveExtraDeduction,
              plannedLeaveDeduction = 1,
              weekWorkingDays;
            userId = filterUser[index]._id;
            const leaves = await CommenService.getMyLeavesCount(
              SITE_DB_NAME,
              userId,
              "month",
              monthYear,
              0
            );
            const paidLeaves = await CommenService.getPaidLeave(
              SITE_DB_NAME,
              userId,
              monthYear
            );
            let carryForward = 0;
            let leaveEarned = 0;
            let appliedLeave = 0;
            let leaveForDeduction = 0;
            let remainingBalance = 0;
            let encashed = 0;
            let deductedPaidLeaves = 0;
            let leaveData = {};

            if (paidLeaves.length > 0) {
              leaveEarned = paidLeaves[0].leaveEarned;
              carryForward = paidLeaves[0].carryForward;
              appliedLeave = paidLeaves[0].appliedLeave;
              leaveForDeduction = paidLeaves[0].leaveForDeduction;
              remainingBalance = paidLeaves[0].remainingBalance;
              encashed = paidLeaves[0].encashed;
              deductedPaidLeaves = paidLeaves[0].deductedPaidLeaves;
              leaveData = paidLeaves[0].leaveData;
            }
            const userDetails = await CommenService.getUserDetails(
              SITE_DB_NAME,
              userId
            );
            if (userDetails !== "NA") {
              userId = userDetails?.userId;
              unitIds = userDetails?.unitId;
              name = userDetails?.name;
              email = userDetails?.email;
              image = userDetails?.image;
              uniqueId = userDetails?.uniqueId;
              personalEmail = userDetails?.personalEmail;
              bankName = userDetails?.bankName;
              bankAccountNumber = userDetails?.bankAccountNumber;
              IFSCCode = userDetails?.IFSCCode;
              accountHolderName = userDetails?.accountHolderName;
              departmentName = userDetails?.departmentDetails?.departmentName;
              religiousBreak = userDetails?.religiousBreak;
              joiningDate = userDetails?.joiningDate;
              holidays = userDetails?.holidays || [];
              shift = userDetails?.shiftDetails || null;
              monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
              weekEnds = shift?.weekEnds || [];
              shiftId = userDetails?.shiftId;
              relievingDate = userDetails?.relievingDate;
              monthlyExtraFreeMin =
                userDetails?.shiftDetails?.monthlyExtraFreeMin;
              designationName = userDetails?.designationName;
              weekWorkingDays = shift?.weekWorkingDays || [];
              shortLoginDeductions =
                userDetails?.shiftDetails?.shortLoginDeductions;
              unPlannedLeaveExtraDeduction =
                userDetails?.shiftDetails?.unPlannedLeaveExtraDeduction;
            }
            const allpolicy = await CommenService.checkExistPaidLeavePolicy(
              SITE_DB_NAME,
              userId,
              [monthYear]
            );
            const findPaildLeavePolicy =
              allpolicy.length > 0 ? allpolicy[0] : null;

            if (findPaildLeavePolicy) {
              shortLoginDeductions = findPaildLeavePolicy?.shortLoginDeductions;
              weekWorkingDays = findPaildLeavePolicy?.weekWorkingDays;
              weekEnds = findPaildLeavePolicy?.weekEnds;
              monthlyExtraWorkingDays =
                findPaildLeavePolicy?.monthlyExtraWorkingDays;
              monthlyExtraFreeMin = findPaildLeavePolicy?.monthlyExtraFreeMin;
              holidays = findPaildLeavePolicy?.holidays;
              shiftId = findPaildLeavePolicy?.shiftId;
              unPlannedLeaveExtraDeduction =
                findPaildLeavePolicy?.unPlannedLeaveExtraDeduction;
              plannedLeaveDeduction =
                findPaildLeavePolicy?.plannedLeaveDeduction;
            }
            if (!unitIds || unitIds?.length === 0) {
              return null;
            }
            const shiftIds = [shiftId];
            if (!shiftIds || shiftIds?.length === 0) {
              return null;
            }
            if (!shift) {
              return null;
            }
            if (
              !Array.isArray(shiftIds) ||
              !shiftIds ||
              shiftIds?.length === 0
            ) {
              return null;
            }
            const [yearStr, monthStr] = monthYear.split("-");
            const year = parseInt(yearStr);
            const month = parseInt(monthStr);
            const isJoiningMonth =
              year === new Date(joiningDate).getFullYear() &&
              month === new Date(joiningDate).getMonth() + 1;
            const isRelievingMonth = relievingDate
              ? year ===
                  new Date(
                    relievingDate.toISOString().split("T")[0]
                  ).getFullYear() &&
                month ===
                  new Date(
                    relievingDate.toISOString().split("T")[0]
                  ).getMonth() +
                    1
              : false;

            const currentDate = new Date().toISOString().split("T")[0];
            const promisesAtt = Array.from(
              { length: monthDay },
              async (_, index) => {
                const day = index + 1;
                const attendanceDate = `${monthYear}-${String(day).padStart(
                  2,
                  "0"
                )}`;

                const weekDay = new Date(attendanceDate).getDay();
                if (
                  new Date(currentDate) < new Date(attendanceDate) ||
                  new Date(joiningDate) > new Date(attendanceDate)
                ) {
                  //return null;
                }
                if (relievingDate) {
                  if (
                    new Date(relievingDate.toISOString().split("T")[0]) <
                    new Date(attendanceDate)
                  ) {
                    //return null;
                  }
                }

                const attendance = await CommenService.attendanceByDate(
                  SITE_DB_NAME,
                  userId,
                  attendanceDate
                );

                let shiftReligiousBreakDuration = 0;
                if (religiousBreak > 0) {
                  shiftReligiousBreakDuration = shift?.religiousBreakMin;
                }

                if (!attendance) {
                  let status = "Absent";

                  const holidayStatus = holidays.find((holiday) => {
                    const holidayDate = new Date(holiday.date)
                      .toISOString()
                      .split("T")[0];
                    return holidayDate === attendanceDate;
                  });
                  let dayName = moment(attendanceDate, "YYYY-MM-DD").format(
                    "dddd"
                  );
                  let weekNumber = Math.ceil(day / 7);

                  let isExtraWorkingDay = monthlyExtraWorkingDays.includes(
                    `${weekNumber}${dayName}`
                  );
                  if (!holidayStatus && weekEnds.includes(dayName)) {
                    status = "Weekend";
                    if (isExtraWorkingDay) {
                      status = "Absent";
                    }
                    const weekWorkingDates = getWeekDatesByNames(
                      attendanceDate,
                      weekWorkingDays
                    );
                    // const weekAttendancesStatus = await Attendance.find({
                    //   userId: userId,
                    //   date: { $in: weekWorkingDates },
                    //   status: { $in: ["Present"] },
                    // });
                    const weekAttendancesStatus =
                      await CommenService.getWeekAttendancesStatus(
                        SITE_DB_NAME,
                        userId,
                        weekWorkingDates
                      );

                    const weekHolidays = holidays.some((holiday) => {
                      const holidayDate = new Date(holiday.date)
                        .toISOString()
                        .split("T")[0];
                      return weekWorkingDates.includes(holidayDate);
                    });
                    if (weekAttendancesStatus.length === 0 && !weekHolidays) {
                      status = "Absent";
                    }
                  }
                  // If it's Holiday
                  else if (holidayStatus && !weekEnds.includes(dayName)) {
                    status = "Holiday";
                  } else if (holidayStatus && weekEnds.includes(dayName)) {
                    status = `Holiday (Weekend)`;
                  }

                  return {
                    _id: userId + uniqueId,
                    userId: userId,
                    unitIds: unitIds,
                    uniqueId: uniqueId,
                    name: name,
                    image: image,
                    shiftId: shiftId,
                    shiftStart: shift?.startTime,
                    shiftEnd: shift?.endTime,
                    shiftBreakDuration: shift?.breakDuration,
                    shiftReligiousBreakDuration: shiftReligiousBreakDuration,
                    date: new Date(attendanceDate),
                    punches: [],
                    firstIn: null,
                    firstInStatus: 0,
                    lastOut: null,
                    lastOutStatus: 0,
                    workingHrs: "00:00",
                    workingMin: 0,
                    totalWorkingHrs: "00:00",
                    totalWorkingMin: 0,
                    breakDuration: 0,
                    lateBy: 0,
                    overTime: 0,
                    status: status,
                    presentStatus: "No",
                    leaveStatus: "No",
                    leaveType: "No",
                    activeFlag: 1,
                    shortLoginHDStatus: 0,
                    religiousBreakDuration: shiftReligiousBreakDuration,
                    religiousBreakStatus: religiousBreak,
                    designationName: designationName,
                    deleteFlag: deleteFlag || 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    lateByEarly: 0,
                    takenBreak: 0,
                  };
                } else {
                  return attendance;
                }
              }
            );
            const userAttendances = await Promise.all(promisesAtt);
            let presentDays = 0;
            let halfDays = 0;
            let halfDayDeduction = 0;
            let absentDays = 0;
            let punchMissingDays = 0;
            let totalShortLogin = 0;
            let totalLateByEarly = 0;
            let totalBreakDuration = 0;
            let totalShiftBreakDuration = 0;
            let totalBreakShortLogin = 0;

            let totalDeduction = 0,
              shortLoginDeduction = 0,
              unplanned = 0,
              planned = 0,
              sick = 0,
              maternity = 0,
              paternity = 0;
            const pl = Number(plannedLeaveDeduction) || 0;
            const up = Number(unPlannedLeaveExtraDeduction) || 0;
            // Wait for all days to be processed
            const userAttendanceResults = await Promise.all(
              userAttendances
                .filter((item) => item !== null)
                .map(async (a, inx) => {
                  const exstatus =
                    a.status === "Present"
                      ? a.punches?.length % 2 === 0
                        ? a?.shortLoginHDStatus === 0
                          ? "P"
                          : "HD"
                        : "PM"
                      : a.status === "Absent"
                      ? "A"
                      : a.status === "Holiday"
                      ? "H"
                      : a.status === "Weekend"
                      ? "W"
                      : a.status === "Holiday (Weekend)"
                      ? "HW"
                      : "NA";
                  const dateStr = moment(a.date).format("YYYY-MM-DD");
                  if (exstatus === "HD") {
                    //halfDays += 1;
                    //presentDays += 0.5;
                    const leave = await CommenService.leaveByDate(
                      SITE_DB_NAME,
                      userId,
                      dateStr
                    );

                    if (leave) {
                      if (
                        leave.dayType !== "FullDay" &&
                        leave?.leaveType === "Unplanned"
                      ) {
                        halfDays += Math.max(pl, 0) / 2 + Math.max(up, 0) / 2;
                        presentDays += 0.5;
                        unplanned += 0.5;
                      } else {
                        halfDays += Math.max(pl, 0) / 2;
                        presentDays += 0.5;
                        if (leave?.leaveType === "Planned") planned += 0.5;
                        else if (leave?.leaveType === "Sick") sick += 0.5;
                      }
                    } else {
                      halfDays += Math.max(pl, 0) / 2 + Math.max(up, 0) / 2;
                      presentDays += 0.5;
                      unplanned += 0.5;
                    }
                  } else if (exstatus === "A") {
                    // absentDays += 1;
                    const leave = await CommenService.leaveByDate(
                      SITE_DB_NAME,
                      userId,
                      dateStr
                    );

                    if (leave) {
                      if (
                        leave.dayType === "FullDay" &&
                        leave?.leaveType === "Unplanned"
                      ) {
                        absentDays += Math.max(pl, 0) + Math.max(up, 0);
                        unplanned += 1;
                      } else {
                        absentDays += Math.max(pl, 0);
                        if (leave?.leaveType === "Planned") planned += 1;
                        else if (leave?.leaveType === "Sick") sick += 1;
                        else if (leave?.leaveType === "Maternity")
                          maternity += 1;
                        else if (leave?.leaveType === "Paternity")
                          paternity += 1;
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
                  } else if (exstatus === "PM") {
                    punchMissingDays += 1;
                  } else {
                    presentDays += 1;
                  }
                  totalShortLogin += a.lateBy;
                  totalLateByEarly += a.lateByEarly;
                  totalBreakDuration += a.takenBreak;
                  totalShiftBreakDuration += a.shiftBreakDuration;
                  totalBreakShortLogin += Math.max(
                    0,
                    a.takenBreak - a.shiftBreakDuration
                  );
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

                  shortLoginDeduction = getDeductionFromSlab(
                    shortLoginDeductions,
                    totalShortLogin
                  );
                  halfDayDeduction = Number(halfDays * 2);
                  totalDeduction =
                    Number(shortLoginDeduction) +
                    Number(absentDays) +
                    Number(halfDays);
                  // `[${exstatus},${a.lateBy}]`

                  return a.takenBreak;
                })
            );
            const row = [
              index + 1,
              uniqueId,
              name,
              departmentName,
              moment(joiningDate, "YYYY-MM-DD").format("DD-MM-YYYY"),
              ...userAttendanceResults,
              // totalShiftBreakDuration,
              // totalBreakDuration,
              // totalBreakShortLogin,
              // totalLateByEarly,
              // totalShortLogin,
              // presentDays,
              // halfDays,
              // absentDays,
              // punchMissingDays || 0,
              //===========================
              // punchMissingDays,
              // presentDays,
              // halfDayDeduction,
              // absentDays,
              // shortLoginDeduction,
              // totalDeduction,
              // unplanned,
              // planned,
              // sick,
              // maternity,
              // paternity,
              // leaveForDeduction,
              // //===========================

              // shift?.shiftName,
              // email,
              // personalEmail,
              // bankAccountNumber,
              // IFSCCode,
              // bankName,
              // accountHolderName,
              // leaves?.totalLeaves || 0,
              // leaves?.Unplanned || 0,
              // leaves?.Planned || 0,
              // leaves?.Sick || 0,
              // leaves?.Maternity || 0,
              // leaves?.Paternity || 0,
              // carryForward,
              // leaveEarned,
              // appliedLeave,
              // leaveForDeduction,
              // remainingBalance,
              // encashed,
              // deductedPaidLeaves,
              // JSON.stringify(leaveData),
              // JSON.stringify(paidLeaves),
            ];
            // sheet.addRow(row);
            return row;
          }
        );

        // Wait for all employee to be processed

        const attendances = await Promise.all(promises);

        return res.status(200).json({
          success: true,
          msg: ["data found"],
          data: { attendances: attendances.filter((item) => item !== null) },
        });
      } catch (error) {
        logger.error("Database error in attendances application", {
          error: error.message,
          key: 1,
        });
        const record = { success: true, msg: error.message, key: "error" };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in attendances application", {
        error: error.message,
        key: 2,
      });
      const record = { success: true, msg: error.message, key: "error" };
      return res.status(500).json(record);
    }
  },
];
const exportAttendanceFinal = [
  query("dayMonthYear")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  query("monthDay")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  query("unitId")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag, dayMonthYear, monthDay, unitId, unitName } = req.query;
    if (!CURRENT_USER) {
      return res
        .status(200)
        .json({ success: false, msg: msg.msgUnitNotExist, attendances: [] });
    }
    const userIdCurrent = CURRENT_USER_ID;
    const roleNameCurrent = CURRENT_USER?.roleName;
    const unitIdsCurrent = CURRENT_USER?.unitId;
    if (!roleNameCurrent) {
      return res
        .status(200)
        .json({ success: false, msg: msg.msgUnitNotExist, attendances: [] });
    }
    const monthYear = moment(dayMonthYear, "YYYY-MM-DD").format("YYYY-MM");
    try {
      try {
        const checkUnitId = await CommenService.checkUnit(SITE_DB_NAME, unitId);
        const getUser = await CommenService.getUserForExportAttendance(
          SITE_DB_NAME,
          userIdCurrent,
          roleNameCurrent,
          [checkUnitId]
        );
        if (getUser === "NA") {
          return res.status(200).json({
            success: false,
            msg: msg.msgUserNotExist,
            attendances: [],
          });
        }
        const userChecks = await Promise.all(
          getUser.map(async (user) => ({
            user,
            isActive: await isUserActiveInMonth(
              user,
              moment(dayMonthYear, "YYYY-MM-DD").format("YYYY-MM")
            ),
          }))
        );
        const filterUser = userChecks
          .filter((check) => check.isActive)
          .map((check) => check.user);

        const promises = Array.from(
          {
            length: filterUser.length,
          },
          async (_, index) => {
            let userId,
              unitIds,
              uniqueId,
              religiousBreak,
              joiningDate,
              holidays,
              shift,
              shiftId,
              name,
              monthlyExtraFreeMin,
              relievingDate,
              image,
              monthlyExtraWorkingDays,
              weekEnds,
              email,
              designationName,
              bankName,
              bankAccountNumber,
              IFSCCode,
              personalEmail,
              accountHolderName,
              departmentName,
              shortLoginDeductions,
              unPlannedLeaveExtraDeduction,
              plannedLeaveDeduction = 1,
              weekWorkingDays;

            userId = filterUser[index]._id;
            const getReimbursementsAmountByMonth =
              await CommenService.getReimbursementsAmountByMonth(
                SITE_DB_NAME,
                userId,
                monthYear
              );
            const getIncentivesAmountByMonth =
              await CommenService.getIncentivesAmountByMonth(
                SITE_DB_NAME,
                userId,
                monthYear
              );
            const getIncentivesByMonth =
              await CommenService.getIncentivesByMonth(
                SITE_DB_NAME,
                userId,
                "month",
                monthYear,
                0
              );

            const compoffByMonth = await CommenService.compoffByMonth(
              SITE_DB_NAME,
              userId,
              "month",
              monthYear,
              0
            );
            const leaves = await CommenService.getMyLeavesCount(
              SITE_DB_NAME,
              userId,
              "month",
              monthYear,
              0
            );
            const paidLeaves = await CommenService.getPaidLeave(
              SITE_DB_NAME,
              userId,
              monthYear
            );
            let carryForward = 0;
            let leaveEarned = 0;
            let appliedLeave = 0;
            let leaveForDeduction = 0;
            let remainingBalance = 0;
            let encashed = 0;
            let deductedPaidLeaves = 0;
            let leaveData = {};

            if (paidLeaves.length > 0) {
              leaveEarned = paidLeaves[0].leaveEarned;
              carryForward = paidLeaves[0].carryForward;
              appliedLeave = paidLeaves[0].appliedLeave;
              leaveForDeduction = paidLeaves[0].leaveForDeduction;
              remainingBalance = paidLeaves[0].remainingBalance;
              encashed = paidLeaves[0].encashed;
              deductedPaidLeaves = paidLeaves[0].deductedPaidLeaves;
              leaveData = paidLeaves[0].leaveData;
            }
            const userDetails = await CommenService.getUserDetails(
              SITE_DB_NAME,
              userId
            );
            if (userDetails !== "NA") {
              userId = userDetails?.userId;
              unitIds = userDetails?.unitId;
              name = userDetails?.name;
              email = userDetails?.email;
              image = userDetails?.image;
              uniqueId = userDetails?.uniqueId;
              personalEmail = userDetails?.personalEmail;
              bankName = userDetails?.bankName;
              bankAccountNumber = userDetails?.bankAccountNumber;
              IFSCCode = userDetails?.IFSCCode;
              accountHolderName = userDetails?.accountHolderName;
              departmentName = userDetails?.departmentDetails?.departmentName;
              religiousBreak = userDetails?.religiousBreak;
              joiningDate = userDetails?.joiningDate;
              holidays = userDetails?.holidays || [];
              shift = userDetails?.shiftDetails || null;
              monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
              weekEnds = shift?.weekEnds || [];
              shiftId = userDetails?.shiftId;
              relievingDate = userDetails?.relievingDate;
              monthlyExtraFreeMin =
                userDetails?.shiftDetails?.monthlyExtraFreeMin;
              designationName = userDetails?.designationName;
              weekWorkingDays = shift?.weekWorkingDays || [];
              shortLoginDeductions =
                userDetails?.shiftDetails?.shortLoginDeductions;
              unPlannedLeaveExtraDeduction =
                userDetails?.shiftDetails?.unPlannedLeaveExtraDeduction;
            }
            const allpolicy = await CommenService.checkExistPaidLeavePolicy(
              SITE_DB_NAME,
              userId,
              [monthYear]
            );
            const findPaildLeavePolicy =
              allpolicy.length > 0 ? allpolicy[0] : null;

            if (findPaildLeavePolicy) {
              shortLoginDeductions = findPaildLeavePolicy?.shortLoginDeductions;
              weekWorkingDays = findPaildLeavePolicy?.weekWorkingDays;
              weekEnds = findPaildLeavePolicy?.weekEnds;
              monthlyExtraWorkingDays =
                findPaildLeavePolicy?.monthlyExtraWorkingDays;
              monthlyExtraFreeMin = findPaildLeavePolicy?.monthlyExtraFreeMin;
              holidays = findPaildLeavePolicy?.holidays;
              shiftId = findPaildLeavePolicy?.shiftId;
              unPlannedLeaveExtraDeduction =
                findPaildLeavePolicy?.unPlannedLeaveExtraDeduction;
              plannedLeaveDeduction =
                findPaildLeavePolicy?.plannedLeaveDeduction;
            }
            if (!unitIds || unitIds?.length === 0) {
              return null;
            }
            const shiftIds = [shiftId];
            if (!shiftIds || shiftIds?.length === 0) {
              return null;
            }
            if (!shift) {
              return null;
            }
            if (
              !Array.isArray(shiftIds) ||
              !shiftIds ||
              shiftIds?.length === 0
            ) {
              return null;
            }
            const [yearStr, monthStr] = monthYear.split("-");
            const year = parseInt(yearStr);
            const month = parseInt(monthStr);
            const isJoiningMonth =
              year === new Date(joiningDate).getFullYear() &&
              month === new Date(joiningDate).getMonth() + 1;
            const isRelievingMonth = relievingDate
              ? year ===
                  new Date(
                    relievingDate.toISOString().split("T")[0]
                  ).getFullYear() &&
                month ===
                  new Date(
                    relievingDate.toISOString().split("T")[0]
                  ).getMonth() +
                    1
              : false;

            const currentDate = new Date().toISOString().split("T")[0];
            const promisesAtt = Array.from(
              { length: monthDay },
              async (_, index) => {
                const day = index + 1;
                const attendanceDate = `${monthYear}-${String(day).padStart(
                  2,
                  "0"
                )}`;

                const weekDay = new Date(attendanceDate).getDay();
                if (
                  new Date(currentDate) < new Date(attendanceDate) ||
                  new Date(joiningDate) > new Date(attendanceDate)
                ) {
                  //return null;
                }
                if (relievingDate) {
                  if (
                    new Date(relievingDate.toISOString().split("T")[0]) <
                    new Date(attendanceDate)
                  ) {
                    //return null;
                  }
                }

                const attendance = await CommenService.attendanceByDate(
                  SITE_DB_NAME,
                  userId,
                  attendanceDate
                );

                let shiftReligiousBreakDuration = 0;
                if (religiousBreak > 0) {
                  shiftReligiousBreakDuration = shift?.religiousBreakMin;
                }

                if (!attendance) {
                  let status = "Absent";

                  const holidayStatus = holidays.find((holiday) => {
                    const holidayDate = new Date(holiday.date)
                      .toISOString()
                      .split("T")[0];
                    return holidayDate === attendanceDate;
                  });
                  let dayName = moment(attendanceDate, "YYYY-MM-DD").format(
                    "dddd"
                  );
                  let weekNumber = Math.ceil(day / 7);

                  let isExtraWorkingDay = monthlyExtraWorkingDays.includes(
                    `${weekNumber}${dayName}`
                  );
                  if (!holidayStatus && weekEnds.includes(dayName)) {
                    status = "Weekend";
                    if (isExtraWorkingDay) {
                      status = "Absent";
                    }
                    const weekWorkingDates = getWeekDatesByNames(
                      attendanceDate,
                      weekWorkingDays
                    );
                    // const weekAttendancesStatus = await Attendance.find({
                    //   userId: userId,
                    //   date: { $in: weekWorkingDates },
                    //   status: { $in: ["Present"] },
                    // });
                    const weekAttendancesStatus =
                      await CommenService.getWeekAttendancesStatus(
                        SITE_DB_NAME,
                        userId,
                        weekWorkingDates
                      );

                    const weekHolidays = holidays.some((holiday) => {
                      const holidayDate = new Date(holiday.date)
                        .toISOString()
                        .split("T")[0];
                      return weekWorkingDates.includes(holidayDate);
                    });
                    if (weekAttendancesStatus.length === 0 && !weekHolidays) {
                      status = "Absent";
                    }
                  }
                  // If it's Holiday
                  else if (holidayStatus && !weekEnds.includes(dayName)) {
                    status = "Holiday";
                  } else if (holidayStatus && weekEnds.includes(dayName)) {
                    status = `Holiday (Weekend)`;
                  }

                  return {
                    _id: userId + uniqueId,
                    userId: userId,
                    unitIds: unitIds,
                    uniqueId: uniqueId,
                    name: name,
                    image: image,
                    shiftId: shiftId,
                    shiftStart: shift?.startTime,
                    shiftEnd: shift?.endTime,
                    shiftBreakDuration: shift?.breakDuration,
                    shiftReligiousBreakDuration: shiftReligiousBreakDuration,
                    date: new Date(attendanceDate),
                    punches: [],
                    firstIn: null,
                    firstInStatus: 0,
                    lastOut: null,
                    lastOutStatus: 0,
                    workingHrs: "00:00",
                    workingMin: 0,
                    totalWorkingHrs: "00:00",
                    totalWorkingMin: 0,
                    breakDuration: 0,
                    lateBy: 0,
                    overTime: 0,
                    status: status,
                    presentStatus: "No",
                    leaveStatus: "No",
                    leaveType: "No",
                    activeFlag: 1,
                    shortLoginHDStatus: 0,
                    religiousBreakDuration: shiftReligiousBreakDuration,
                    religiousBreakStatus: religiousBreak,
                    designationName: designationName,
                    deleteFlag: deleteFlag || 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    lateByEarly: 0,
                    takenBreak: 0,
                  };
                } else {
                  return attendance;
                }
              }
            );
            const userAttendances = await Promise.all(promisesAtt);
            let presentDays = 0;
            let halfDaysDeduction = 0;
            let plannedSickDeduction = 0;
            let halfDaySum = 0;
            let halfDayCount = 0;
            let halfDayPL = 0;
            let halfDayUPL = 0;
            let absent = 0;
            let absentDaysDeduction = 0;
            let absentDays = 0;
            let absentHalfDay = 0;
            let punchMissingDays = 0;
            let totalShortLogin = 0;
            let totalLateByEarly = 0;
            let totalBreakDuration = 0;
            let totalShiftBreakDuration = 0;
            let totalBreakShortLogin = 0;

            let totalDeduction = 0,
              shortLoginDeduction = 0,
              unplanned = 0,
              unplannedDeduction = 0,
              planned = 0,
              sick = 0,
              maternity = 0,
              paternity = 0,
              paidLeave = leaveEarned,
              compOff = compoffByMonth?.totalCount || 0,
              incentiveEligible5Percent = getIncentivesByMonth ? "YES" : "NO";
            const pl = Number(plannedLeaveDeduction) || 0;
            const up = Number(unPlannedLeaveExtraDeduction) || 0;
            // Wait for all days to be processed
            const userAttendanceResults = await Promise.all(
              userAttendances
                .filter((item) => item !== null)
                .map(async (a, inx) => {
                  let exstatus =
                    a.status === "Present"
                      ? a.punches?.length % 2 === 0
                        ? a?.shortLoginHDStatus === 0
                          ? "P"
                          : "HD"
                        : "PM"
                      : a.status === "Absent"
                      ? "A"
                      : a.status === "Holiday"
                      ? "H"
                      : a.status === "Weekend"
                      ? "W"
                      : a.status === "Holiday (Weekend)"
                      ? "HW"
                      : "NA";
                  const dateStr = moment(a.date).format("YYYY-MM-DD");
                  if (exstatus === "HD") {
                    //halfDays += 1;
                    //presentDays += 0.5;
                    const leave = await CommenService.leaveByDate(
                      SITE_DB_NAME,
                      userId,
                      dateStr
                    );

                    if (leave) {
                      if (
                        leave.dayType !== "FullDay" &&
                        leave?.leaveType === "Unplanned"
                      ) {
                        halfDaysDeduction +=
                          Math.max(pl, 0) / 2 + Math.max(up, 0) / 2;
                        presentDays += 0.5;
                        unplanned += 0.5;
                        halfDayCount += 1;
                        halfDayUPL += 1;
                        // unplannedDeduction += Math.max(pl, 0) / 2 + Math.max(up, 0) / 2;
                      } else {
                        halfDaysDeduction += Math.max(pl, 0) / 2;
                        presentDays += 0.5;
                        halfDayCount += 1;
                        halfDayPL += 1;
                        if (leave?.leaveType === "Planned") planned += 0.5;
                        else if (leave?.leaveType === "Sick") sick += 0.5;
                      }
                    } else {
                      halfDaysDeduction +=
                        Math.max(pl, 0) / 2 + Math.max(up, 0) / 2;
                      //unplannedDeduction += Math.max(pl, 0) / 2 + Math.max(up, 0) / 2;
                      presentDays += 0.5;
                      unplanned += 0.5;
                      halfDayCount += 1;
                      halfDayUPL += 1;
                    }
                  } else if (exstatus === "A") {
                    // absentDays += 1;
                    const leave = await CommenService.leaveByDate(
                      SITE_DB_NAME,
                      userId,
                      dateStr
                    );

                    if (leave) {
                      if (
                        leave.dayType === "FullDay" &&
                        leave?.leaveType === "Unplanned"
                      ) {
                        absentDaysDeduction +=
                          Math.max(pl, 0) + Math.max(up, 0);
                        unplanned += 1;
                        absent += 1;
                        unplannedDeduction += Math.max(pl, 0) + Math.max(up, 0);
                        exstatus = "UPL";
                      } else {
                        absentDaysDeduction += Math.max(pl, 0);
                        absent += 1;
                        if (leave?.leaveType === "Planned") {
                          planned += 1;
                          exstatus = "PL"; // Planned leave
                        } else if (leave?.leaveType === "Sick") {
                          sick += 1;
                          exstatus = "SL"; // Sick leave
                        } else if (leave?.leaveType === "Maternity") {
                          maternity += 1;
                        } else if (leave?.leaveType === "Paternity") {
                          paternity += 1;
                        }
                      }
                    } else {
                      if (isRelievingMonth || isJoiningMonth) {
                        absentDaysDeduction += Math.max(pl, 0);
                        planned += 1;
                        absent += 1;
                        exstatus = "PL";
                      } else {
                        absentDaysDeduction +=
                          Math.max(pl, 0) + Math.max(up, 0);
                        unplanned += 1;
                        absent += 1;
                        exstatus = "UPL";
                        unplannedDeduction += Math.max(pl, 0) + Math.max(up, 0);
                      }
                    }
                  } else if (exstatus === "PM") {
                    punchMissingDays += 1;
                  } else {
                    presentDays += 1;
                  }
                  totalShortLogin += a.lateBy;
                  totalLateByEarly += a.lateByEarly;
                  totalBreakDuration += a.takenBreak;
                  totalShiftBreakDuration += a.shiftBreakDuration;
                  totalBreakShortLogin += Math.max(
                    0,
                    a.takenBreak - a.shiftBreakDuration
                  );
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
                  halfDaySum = halfDayCount / 2;
                  absentHalfDay = halfDaySum + absent;
                  plannedSickDeduction = planned + sick;
                  shortLoginDeduction = getDeductionFromSlab(
                    shortLoginDeductions,
                    totalShortLogin
                  );
                  totalDeduction =
                    Number(shortLoginDeduction) +
                    Number(absentDaysDeduction) +
                    Number(halfDaysDeduction);
                  // `[${exstatus},${a.lateBy}]`

                  return exstatus;
                })
            );
            let incentiveAmount5Percent = 0,
              applyIncentiveAmount =
                getIncentivesAmountByMonth?.totalAmount || 0,
              applyReimbursementAmount =
                getReimbursementsAmountByMonth?.totalAmount || 0,
              lwpAmount = 0,
              grossSalary = 0,
              netSalary = 0;
            let lwp = totalDeduction - compOff - paidLeave;
            const row = [
              index + 1,
              uniqueId,
              name,
              departmentName,
              moment(joiningDate, "YYYY-MM-DD").format("DD-MM-YYYY"),
              ...userAttendanceResults,
              //===========================
              punchMissingDays,
              presentDays,
              absentHalfDay,
              totalShortLogin,
              shortLoginDeduction,
              halfDaysDeduction,
              unplannedDeduction,
              plannedSickDeduction,
              totalDeduction,
              //=====================
              paidLeave,
              compOff,
              lwp,
              incentiveEligible5Percent,
              //===========================

              incentiveAmount5Percent,
              applyIncentiveAmount,
              applyReimbursementAmount,
              lwpAmount,
              grossSalary,
              netSalary,
              email,
              personalEmail,
              bankAccountNumber,
              IFSCCode,
              bankName,
              accountHolderName,
              absent,
              halfDayUPL,
              halfDayPL,
              halfDayCount,
              unplanned,
              planned,
              sick,
              // leaves?.totalLeaves || 0,
              // leaves?.Unplanned || 0,
              // leaves?.Planned || 0,
              // leaves?.Sick || 0,
              // leaves?.Maternity || 0,
              // leaves?.Paternity || 0,
              // carryForward,
              // leaveEarned,
              // appliedLeave,
              // leaveForDeduction,
              // remainingBalance,
              // encashed,
              // deductedPaidLeaves,
              // JSON.stringify(leaveData),
              // JSON.stringify(paidLeaves),
            ];
            // sheet.addRow(row);
            return row;
          }
        );

        // Wait for all employee to be processed

        const attendances = await Promise.all(promises);

        return res.status(200).json({
          success: true,
          msg: ["data found"],
          data: { attendances: attendances.filter((item) => item !== null) },
        });
      } catch (error) {
        logger.error("Database error in attendances application", {
          error: error.message,
          key: 1,
        });
        const record = { success: true, msg: error.message, key: "error" };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in attendances application", {
        error: error.message,
        key: 2,
      });
      const record = { success: true, msg: error.message, key: "error" };
      return res.status(500).json(record);
    }
  },
];
const exportAttendanceLog = [
  query("dayMonthYear")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  query("monthDay")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  query("unitId")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag, dayMonthYear, monthDay, unitId, unitName } = req.query;
    if (!CURRENT_USER) {
      return res
        .status(200)
        .json({ success: false, msg: msg.msgUnitNotExist, attendances: [] });
    }
    const userIdCurrent = CURRENT_USER_ID;
    const roleNameCurrent = CURRENT_USER?.roleName;
    const unitIdsCurrent = CURRENT_USER?.unitId;
    if (!roleNameCurrent) {
      return res
        .status(200)
        .json({ success: false, msg: msg.msgUnitNotExist, attendances: [] });
    }
    const monthYear = moment(dayMonthYear, "YYYY-MM-DD").format("YYYY-MM");
    try {
      try {
        const checkUnitId = await CommenService.checkUnit(SITE_DB_NAME, unitId);
        const getUser = await CommenService.getUserForExportAttendance(
          SITE_DB_NAME,
          userIdCurrent,
          roleNameCurrent,
          [checkUnitId]
        );
        if (getUser === "NA") {
          return res.status(200).json({
            success: false,
            msg: msg.msgUserNotExist,
            attendances: [],
          });
        }
        const userChecks = await Promise.all(
          getUser.map(async (user) => ({
            user,
            isActive: await isUserActiveInMonth(
              user,
              moment(dayMonthYear, "YYYY-MM-DD").format("YYYY-MM")
            ),
          }))
        );
        const filterUser = userChecks
          .filter((check) => check.isActive)
          .map((check) => check.user);
        const promises = Array.from(
          {
            length: filterUser.length,
          },
          async (_, index) => {
            let userId,
              unitIds,
              uniqueId,
              religiousBreak,
              joiningDate,
              holidays,
              shift,
              shiftId,
              name,
              monthlyExtraFreeMin,
              relievingDate,
              image,
              monthlyExtraWorkingDays,
              weekEnds,
              email,
              designationName,
              bankName,
              bankAccountNumber,
              IFSCCode,
              personalEmail,
              accountHolderName,
              departmentName,
              shortLoginDeductions,
              unPlannedLeaveExtraDeduction,
              plannedLeaveDeduction = 1,
              weekWorkingDays;
            userId = filterUser[index]._id;
            const userDetails = await CommenService.getUserDetails(
              SITE_DB_NAME,
              userId
            );
            const leaves = await CommenService.getMyLeavesCount(
              SITE_DB_NAME,
              userId,
              "month",
              monthYear,
              0
            );
            const paidLeaves = await CommenService.getPaidLeave(
              SITE_DB_NAME,
              userId,
              monthYear
            );
            let carryForward = 0;
            let leaveEarned = 0;
            let appliedLeave = 0;
            let leaveForDeduction = 0;
            let remainingBalance = 0;
            let encashed = 0;
            let deductedPaidLeaves = 0;
            let leaveData = {};

            if (paidLeaves.length > 0) {
              leaveEarned = paidLeaves[0].leaveEarned;
              carryForward = paidLeaves[0].carryForward;
              appliedLeave = paidLeaves[0].appliedLeave;
              leaveForDeduction = paidLeaves[0].leaveForDeduction;
              remainingBalance = paidLeaves[0].remainingBalance;
              encashed = paidLeaves[0].encashed;
              deductedPaidLeaves = paidLeaves[0].deductedPaidLeaves;
              leaveData = paidLeaves[0].leaveData;
            }
            if (userDetails !== "NA") {
              userId = userDetails?.userId;
              unitIds = userDetails?.unitId;
              name = userDetails?.name;
              email = userDetails?.email;
              image = userDetails?.image;
              uniqueId = userDetails?.uniqueId;
              personalEmail = userDetails?.personalEmail;
              bankName = userDetails?.bankName;
              bankAccountNumber = userDetails?.bankAccountNumber;
              IFSCCode = userDetails?.IFSCCode;
              accountHolderName = userDetails?.accountHolderName;
              departmentName = userDetails?.departmentDetails?.departmentName;
              religiousBreak = userDetails?.religiousBreak;
              joiningDate = userDetails?.joiningDate;
              holidays = userDetails?.holidays || [];
              shift = userDetails?.shiftDetails || null;
              monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
              weekEnds = shift?.weekEnds || [];
              shiftId = userDetails?.shiftId;
              relievingDate = userDetails?.relievingDate;
              monthlyExtraFreeMin =
                userDetails?.shiftDetails?.monthlyExtraFreeMin;
              designationName = userDetails?.designationName;
              weekWorkingDays = shift?.weekWorkingDays || [];
              shortLoginDeductions =
                userDetails?.shiftDetails?.shortLoginDeductions;
              unPlannedLeaveExtraDeduction =
                userDetails?.shiftDetails?.unPlannedLeaveExtraDeduction;
            }
            const allpolicy = await CommenService.checkExistPaidLeavePolicy(
              SITE_DB_NAME,
              userId,
              [monthYear]
            );
            const findPaildLeavePolicy =
              allpolicy.length > 0 ? allpolicy[0] : null;

            if (findPaildLeavePolicy) {
              shortLoginDeductions = findPaildLeavePolicy?.shortLoginDeductions;
              weekWorkingDays = findPaildLeavePolicy?.weekWorkingDays;
              weekEnds = findPaildLeavePolicy?.weekEnds;
              monthlyExtraWorkingDays =
                findPaildLeavePolicy?.monthlyExtraWorkingDays;
              monthlyExtraFreeMin = findPaildLeavePolicy?.monthlyExtraFreeMin;
              holidays = findPaildLeavePolicy?.holidays;
              shiftId = findPaildLeavePolicy?.shiftId;
              unPlannedLeaveExtraDeduction =
                findPaildLeavePolicy?.unPlannedLeaveExtraDeduction;
              plannedLeaveDeduction =
                findPaildLeavePolicy?.plannedLeaveDeduction;
            }
            if (!unitIds || unitIds?.length === 0) {
              return null;
            }
            const shiftIds = [shiftId];
            if (!shiftIds || shiftIds?.length === 0) {
              return null;
            }
            if (!shift) {
              return null;
            }
            if (
              !Array.isArray(shiftIds) ||
              !shiftIds ||
              shiftIds?.length === 0
            ) {
              return null;
            }
            const [yearStr, monthStr] = monthYear.split("-");
            const year = parseInt(yearStr);
            const month = parseInt(monthStr);
            const isJoiningMonth =
              year === new Date(joiningDate).getFullYear() &&
              month === new Date(joiningDate).getMonth() + 1;
            const isRelievingMonth = relievingDate
              ? year ===
                  new Date(
                    relievingDate.toISOString().split("T")[0]
                  ).getFullYear() &&
                month ===
                  new Date(
                    relievingDate.toISOString().split("T")[0]
                  ).getMonth() +
                    1
              : false;
            const currentDate = new Date().toISOString().split("T")[0];
            const promisesAtt = Array.from(
              { length: monthDay },
              async (_, index) => {
                const day = index + 1;
                const attendanceDate = `${monthYear}-${String(day).padStart(
                  2,
                  "0"
                )}`;

                const weekDay = new Date(attendanceDate).getDay();
                if (
                  new Date(currentDate) < new Date(attendanceDate) ||
                  new Date(joiningDate) > new Date(attendanceDate)
                ) {
                  //return null;
                }
                if (relievingDate) {
                  if (
                    new Date(relievingDate.toISOString().split("T")[0]) <
                    new Date(attendanceDate)
                  ) {
                    //return null;
                  }
                }

                const attendance = await CommenService.attendanceByDate(
                  SITE_DB_NAME,
                  userId,
                  attendanceDate
                );

                let shiftReligiousBreakDuration = 0;
                if (religiousBreak > 0) {
                  shiftReligiousBreakDuration = shift?.religiousBreakMin;
                }

                if (!attendance) {
                  let status = "Absent";

                  const holidayStatus = holidays.find((holiday) => {
                    const holidayDate = new Date(holiday.date)
                      .toISOString()
                      .split("T")[0];
                    return holidayDate === attendanceDate;
                  });
                  let dayName = moment(attendanceDate, "YYYY-MM-DD").format(
                    "dddd"
                  );
                  let weekNumber = Math.ceil(day / 7);

                  let isExtraWorkingDay = monthlyExtraWorkingDays.includes(
                    `${weekNumber}${dayName}`
                  );
                  if (!holidayStatus && weekEnds.includes(dayName)) {
                    status = "Weekend";
                    if (isExtraWorkingDay) {
                      status = "Absent";
                    }
                    const weekWorkingDates = getWeekDatesByNames(
                      attendanceDate,
                      weekWorkingDays
                    );
                    // const weekAttendancesStatus = await Attendance.find({
                    //   userId: userId,
                    //   date: { $in: weekWorkingDates },
                    //   status: { $in: ["Present"] },
                    // });
                    const weekAttendancesStatus =
                      await CommenService.getWeekAttendancesStatus(
                        SITE_DB_NAME,
                        userId,
                        weekWorkingDates
                      );

                    const weekHolidays = holidays.some((holiday) => {
                      const holidayDate = new Date(holiday.date)
                        .toISOString()
                        .split("T")[0];
                      return weekWorkingDates.includes(holidayDate);
                    });
                    if (weekAttendancesStatus.length === 0 && !weekHolidays) {
                      status = "Absent";
                    }
                  }
                  // If it's Holiday
                  else if (holidayStatus && !weekEnds.includes(dayName)) {
                    status = "Holiday";
                  } else if (holidayStatus && weekEnds.includes(dayName)) {
                    status = `Holiday (Weekend)`;
                  }

                  return {
                    _id: userId + uniqueId,
                    userId: userId,
                    unitIds: unitIds,
                    uniqueId: uniqueId,
                    name: name,
                    image: image,
                    shiftId: shiftId,
                    shiftStart: shift?.startTime,
                    shiftEnd: shift?.endTime,
                    shiftBreakDuration: shift?.breakDuration,
                    shiftReligiousBreakDuration: shiftReligiousBreakDuration,
                    date: new Date(attendanceDate),
                    punches: [],
                    firstIn: null,
                    firstInStatus: 0,
                    lastOut: null,
                    lastOutStatus: 0,
                    workingHrs: "00:00",
                    workingMin: 0,
                    totalWorkingHrs: "00:00",
                    totalWorkingMin: 0,
                    breakDuration: 0,
                    lateBy: 0,
                    overTime: 0,
                    status: status,
                    presentStatus: "No",
                    leaveStatus: "No",
                    leaveType: "No",
                    activeFlag: 1,
                    shortLoginHDStatus: 0,
                    religiousBreakDuration: shiftReligiousBreakDuration,
                    religiousBreakStatus: religiousBreak,
                    designationName: designationName,
                    deleteFlag: deleteFlag || 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    lateByEarly: 0,
                    takenBreak: 0,
                  };
                } else {
                  return attendance;
                }
              }
            );
            const userAttendances = await Promise.all(promisesAtt);
            let presentDays = 0;
            let halfDays = 0;
            let halfDayDeduction = 0;
            let absentDays = 0;
            let totalShortLogin = 0;
            let totalLateByEarly = 0;
            let totalBreakDuration = 0;
            let totalShiftBreakDuration = 0;
            let totalBreakShortLogin = 0;
            let punchMissingDays = 0;
            let totalDeduction = 0,
              shortLoginDeduction = 0,
              unplanned = 0,
              planned = 0,
              sick = 0,
              maternity = 0,
              paternity = 0;
            const pl = Number(plannedLeaveDeduction) || 0;
            const up = Number(unPlannedLeaveExtraDeduction) || 0;
            // Wait for all days to be processed
            const userAttendanceResults = await Promise.all(
              userAttendances
                .filter((item) => item !== null)
                .flatMap(async (a, inx) => {
                  const exstatus =
                    a.status === "Present"
                      ? a.punches?.length % 2 === 0
                        ? a?.shortLoginHDStatus === 0
                          ? "P"
                          : "HD"
                        : "PM"
                      : a.status === "Absent"
                      ? "A"
                      : a.status === "Holiday"
                      ? "H"
                      : a.status === "Weekend"
                      ? "W"
                      : a.status === "Holiday (Weekend)"
                      ? "HW"
                      : "NA";
                  const dateStr = moment(a.date).format("YYYY-MM-DD");
                  if (exstatus === "HD") {
                    //halfDays += 1;
                    //presentDays += 0.5;
                    const leave = await CommenService.leaveByDate(
                      SITE_DB_NAME,
                      userId,
                      dateStr
                    );

                    if (leave) {
                      if (
                        leave.dayType !== "FullDay" &&
                        leave?.leaveType === "Unplanned"
                      ) {
                        halfDays += Math.max(pl, 0) / 2 + Math.max(up, 0) / 2;
                        presentDays += 0.5;
                        unplanned += 0.5;
                      } else {
                        halfDays += Math.max(pl, 0) / 2;
                        presentDays += 0.5;
                        if (leave?.leaveType === "Planned") planned += 0.5;
                        else if (leave?.leaveType === "Sick") sick += 0.5;
                      }
                    } else {
                      halfDays += Math.max(pl, 0) / 2 + Math.max(up, 0) / 2;
                      presentDays += 0.5;
                      unplanned += 0.5;
                    }
                  } else if (exstatus === "A") {
                    // absentDays += 1;
                    const leave = await CommenService.leaveByDate(
                      SITE_DB_NAME,
                      userId,
                      dateStr
                    );

                    if (leave) {
                      if (
                        leave.dayType === "FullDay" &&
                        leave?.leaveType === "Unplanned"
                      ) {
                        absentDays += Math.max(pl, 0) + Math.max(up, 0);
                        unplanned += 1;
                      } else {
                        absentDays += Math.max(pl, 0);
                        if (leave?.leaveType === "Planned") planned += 1;
                        else if (leave?.leaveType === "Sick") sick += 1;
                        else if (leave?.leaveType === "Maternity")
                          maternity += 1;
                        else if (leave?.leaveType === "Paternity")
                          paternity += 1;
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
                  } else if (exstatus === "PM") {
                    punchMissingDays += 1;
                  } else {
                    presentDays += 1;
                  }
                  totalShortLogin += a.lateBy;
                  totalLateByEarly += a.lateByEarly;
                  totalBreakDuration += a.takenBreak;
                  totalShiftBreakDuration += a.shiftBreakDuration;
                  totalBreakShortLogin += Math.max(
                    0,
                    a.takenBreak - a.shiftBreakDuration
                  );

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

                  shortLoginDeduction = getDeductionFromSlab(
                    shortLoginDeductions,
                    totalShortLogin
                  );
                  halfDayDeduction = Number(halfDays * 2);
                  totalDeduction =
                    Number(shortLoginDeduction) +
                    Number(absentDays) +
                    Number(halfDays);
                  // `[${exstatus},${a.lateBy}]`
                  return [exstatus, a.firstIn || "", a.lastOut || ""];
                })
            );
            const flatResults = userAttendanceResults.flat();
            const row = [
              index + 1,
              uniqueId,
              name,
              departmentName,
              moment(joiningDate, "YYYY-MM-DD").format("DD-MM-YYYY"),
              ...flatResults,
              // totalShiftBreakDuration,
              totalBreakDuration,
              totalBreakShortLogin,
              totalLateByEarly,
              totalShortLogin,
              // presentDays,
              // halfDays,
              // absentDays,
              // punchMissingDays || 0,
              //===========================
              punchMissingDays,
              presentDays,
              halfDayDeduction,
              absentDays,
              shortLoginDeduction,
              totalDeduction,
              unplanned,
              planned,
              sick,
              maternity,
              paternity,
              leaveForDeduction,
              //===========================
              shift.shiftName,
              email,
              personalEmail,
              bankAccountNumber,
              IFSCCode,
              bankName,
              accountHolderName,
              leaves?.totalLeaves || 0,
              leaves?.Unplanned || 0,
              leaves?.Planned || 0,
              leaves?.Sick || 0,
              leaves?.Maternity || 0,
              leaves?.Paternity || 0,
              carryForward,
              leaveEarned,
              appliedLeave,
              leaveForDeduction,
              remainingBalance,
              encashed,
              deductedPaidLeaves,
              JSON.stringify(leaveData),
              JSON.stringify(paidLeaves),
            ];
            // sheet.addRow(row);
            return row;
          }
        );

        // Wait for all employee to be processed

        const attendances = await Promise.all(promises);

        return res.status(200).json({
          success: true,
          msg: ["data found"],
          data: { attendances: attendances.filter((item) => item !== null) },
        });
      } catch (error) {
        logger.error("Database error in attendances application", {
          error: error.message,
          key: 1,
        });
        const record = { success: true, msg: error.message, key: "error" };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in attendances application", {
        error: error.message,
        key: 2,
      });
      const record = { success: true, msg: error.message, key: "error" };
      return res.status(500).json(record);
    }
  },
];
const exportDailyAttendance = [
  query("dayMonthYear")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  query("monthDay")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  query("unitId")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag, dayMonthYear, monthDay, unitId, unitName } = req.query;
    if (!CURRENT_USER) {
      return res
        .status(200)
        .json({ success: false, msg: msg.msgUnitNotExist, attendances: [] });
    }
    const userIdCurrent = CURRENT_USER_ID;
    const roleNameCurrent = CURRENT_USER?.roleName;
    const unitIdsCurrent = CURRENT_USER?.unitId;
    if (!roleNameCurrent) {
      return res
        .status(200)
        .json({ success: false, msg: msg.msgUnitNotExist, attendances: [] });
    }
    const monthYear = moment(dayMonthYear, "YYYY-MM-DD").format("YYYY-MM");
    try {
      try {
        const checkUnitId = await CommenService.checkUnit(SITE_DB_NAME, unitId);
        const getUser = await CommenService.getUserForExportAttendance(
          SITE_DB_NAME,
          userIdCurrent,
          roleNameCurrent,
          [checkUnitId]
        );
        if (getUser === "NA") {
          return res.status(200).json({
            success: false,
            msg: msg.msgUserNotExist,
            attendances: [],
          });
        }
        const userChecks = await Promise.all(
          getUser.map(async (user) => ({
            user,
            isActive: await isUserActiveInMonth(
              user,
              moment(dayMonthYear, "YYYY-MM-DD").format("YYYY-MM")
            ),
          }))
        );
        const filterUser = userChecks
          .filter((check) => check.isActive)
          .map((check) => check.user);
        const promises = Array.from(
          {
            length: filterUser.length,
          },
          async (_, index) => {
            let userId,
              unitIds,
              uniqueId,
              religiousBreak,
              joiningDate,
              holidays,
              shift,
              shiftId,
              name,
              monthlyExtraFreeMin,
              relievingDate,
              image,
              monthlyExtraWorkingDays,
              weekEnds,
              email,
              designationName,
              bankName,
              bankAccountNumber,
              IFSCCode,
              personalEmail,
              accountHolderName,
              departmentName,
              teamName,
              shortLoginDeductions,
              unPlannedLeaveExtraDeduction,
              plannedLeaveDeduction = 1,
              weekWorkingDays;
            userId = filterUser[index]._id;
            const userDetails = await CommenService.getUserDetails(
              SITE_DB_NAME,
              userId
            );

            if (userDetails !== "NA") {
              userId = userDetails?.userId;
              unitIds = userDetails?.unitId;
              name = userDetails?.name;
              email = userDetails?.email;
              image = userDetails?.image;
              uniqueId = userDetails?.uniqueId;
              personalEmail = userDetails?.personalEmail;
              bankName = userDetails?.bankName;
              bankAccountNumber = userDetails?.bankAccountNumber;
              IFSCCode = userDetails?.IFSCCode;
              accountHolderName = userDetails?.accountHolderName;
              departmentName = userDetails?.departmentDetails?.departmentName;
              teamName = userDetails?.teamDetails?.teamName;
              religiousBreak = userDetails?.religiousBreak;
              joiningDate = userDetails?.joiningDate;
              holidays = userDetails?.holidays || [];
              shift = userDetails?.shiftDetails || null;
              monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [];
              weekEnds = shift?.weekEnds || [];
              shiftId = userDetails?.shiftId;
              relievingDate = userDetails?.relievingDate;
              monthlyExtraFreeMin =
                userDetails?.shiftDetails?.monthlyExtraFreeMin;
              shortLoginDeductions =
                userDetails?.shiftDetails?.shortLoginDeductions;
              unPlannedLeaveExtraDeduction =
                userDetails?.shiftDetails?.unPlannedLeaveExtraDeduction;
              designationName = userDetails?.designationName;
              weekWorkingDays = shift?.weekWorkingDays || [];
            }
            const allpolicy = await CommenService.checkExistPaidLeavePolicy(
              SITE_DB_NAME,
              userId,
              [monthYear]
            );
            const findPaildLeavePolicy =
              allpolicy.length > 0 ? allpolicy[0] : null;

            if (findPaildLeavePolicy) {
              shortLoginDeductions = findPaildLeavePolicy?.shortLoginDeductions;
              weekWorkingDays = findPaildLeavePolicy?.weekWorkingDays;
              weekEnds = findPaildLeavePolicy?.weekEnds;
              monthlyExtraWorkingDays =
                findPaildLeavePolicy?.monthlyExtraWorkingDays;
              monthlyExtraFreeMin = findPaildLeavePolicy?.monthlyExtraFreeMin;
              holidays = findPaildLeavePolicy?.holidays;
              shiftId = findPaildLeavePolicy?.shiftId;
              unPlannedLeaveExtraDeduction =
                findPaildLeavePolicy?.unPlannedLeaveExtraDeduction;
              plannedLeaveDeduction =
                findPaildLeavePolicy?.plannedLeaveDeduction;
            }
            if (!unitIds || unitIds?.length === 0) {
              return null;
            }
            const shiftIds = [shiftId];
            if (!shiftIds || shiftIds?.length === 0) {
              return null;
            }
            if (!shift) {
              return null;
            }
            if (
              !Array.isArray(shiftIds) ||
              !shiftIds ||
              shiftIds?.length === 0
            ) {
              return null;
            }

            const currentDate = new Date().toISOString().split("T")[0];
            const promisesAtt = Array.from({ length: 1 }, async (_, index) => {
              const day = moment(dayMonthYear, "YYYY-MM-DD").format("DD");
              const attendanceDate = `${monthYear}-${String(day).padStart(
                2,
                "0"
              )}`;

              const weekDay = new Date(attendanceDate).getDay();
              if (
                new Date(currentDate) < new Date(attendanceDate) ||
                new Date(joiningDate) > new Date(attendanceDate)
              ) {
                //return null;
              }
              if (relievingDate) {
                if (
                  new Date(relievingDate.toISOString().split("T")[0]) <
                  new Date(attendanceDate)
                ) {
                  //return null;
                }
              }

              const attendance = await CommenService.attendanceByDate(
                SITE_DB_NAME,
                userId,
                attendanceDate
              );

              let shiftReligiousBreakDuration = 0;
              if (religiousBreak > 0) {
                shiftReligiousBreakDuration = shift?.religiousBreakMin;
              }

              if (!attendance) {
                let status = "Absent";

                const holidayStatus = holidays.find((holiday) => {
                  const holidayDate = new Date(holiday.date)
                    .toISOString()
                    .split("T")[0];
                  return holidayDate === attendanceDate;
                });
                let dayName = moment(attendanceDate, "YYYY-MM-DD").format(
                  "dddd"
                );
                let weekNumber = Math.ceil(day / 7);

                let isExtraWorkingDay = monthlyExtraWorkingDays.includes(
                  `${weekNumber}${dayName}`
                );
                if (!holidayStatus && weekEnds.includes(dayName)) {
                  status = "Weekend";
                  if (isExtraWorkingDay) {
                    status = "Absent";
                  }
                  const weekWorkingDates = getWeekDatesByNames(
                    attendanceDate,
                    weekWorkingDays
                  );
                  // const weekAttendancesStatus = await Attendance.find({
                  //   userId: userId,
                  //   date: { $in: weekWorkingDates },
                  //   status: { $in: ["Present"] },
                  // });
                  const weekAttendancesStatus =
                    await CommenService.getWeekAttendancesStatus(
                      SITE_DB_NAME,
                      userId,
                      weekWorkingDates
                    );

                  const weekHolidays = holidays.some((holiday) => {
                    const holidayDate = new Date(holiday.date)
                      .toISOString()
                      .split("T")[0];
                    return weekWorkingDates.includes(holidayDate);
                  });
                  if (weekAttendancesStatus.length === 0 && !weekHolidays) {
                    status = "Absent";
                  }
                }
                // If it's Holiday
                else if (holidayStatus && !weekEnds.includes(dayName)) {
                  status = "Holiday";
                } else if (holidayStatus && weekEnds.includes(dayName)) {
                  status = `Holiday (Weekend)`;
                }

                return {
                  _id: userId + uniqueId,
                  userId: userId,
                  unitIds: unitIds,
                  uniqueId: uniqueId,
                  name: name,
                  image: image,
                  shiftId: shiftId,
                  shiftStart: shift?.startTime,
                  shiftEnd: shift?.endTime,
                  shiftBreakDuration: shift?.breakDuration,
                  shiftReligiousBreakDuration: shiftReligiousBreakDuration,
                  date: new Date(attendanceDate),
                  punches: [],
                  firstIn: null,
                  firstInStatus: 0,
                  lastOut: null,
                  lastOutStatus: 0,
                  workingHrs: "00:00",
                  workingMin: 0,
                  totalWorkingHrs: "00:00",
                  totalWorkingMin: 0,
                  breakDuration: 0,
                  lateBy: 0,
                  overTime: 0,
                  status: status,
                  presentStatus: "No",
                  leaveStatus: "No",
                  leaveType: "No",
                  activeFlag: 1,
                  shortLoginHDStatus: 0,
                  religiousBreakDuration: shiftReligiousBreakDuration,
                  religiousBreakStatus: religiousBreak,
                  designationName: designationName,
                  deleteFlag: deleteFlag || 0,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  lateByEarly: 0,
                  takenBreak: 0,
                };
              } else {
                return attendance;
              }
            });
            const userAttendances = await Promise.all(promisesAtt);
            let presentDays = 0;
            let halfDays = 0;
            let absentDays = 0;
            let punchMissingDays = 0;
            let totalShortLogin = 0;
            let totalLateByEarly = 0;
            let totalShiftBreakDuration = 0;
            let totalBreakDuration = 0;
            let totalBreakShortLogin = 0;
            const row = [
              index + 1,
              uniqueId,
              name,
              departmentName,
              teamName,
              moment(joiningDate, "YYYY-MM-DD").format("DD-MM-YYYY"),
              ...userAttendances
                .filter((item) => item !== null)
                .flatMap((a, inx) => {
                  const exstatus =
                    a.status === "Present"
                      ? a.punches?.length % 2 === 0
                        ? a?.shortLoginHDStatus === 0
                          ? "P"
                          : "HD"
                        : "PM"
                      : a.status === "Absent"
                      ? "A"
                      : a.status === "Holiday"
                      ? "H"
                      : a.status === "Weekend"
                      ? "W"
                      : a.status === "Holiday (Weekend)"
                      ? "HW"
                      : "NA";
                  if (exstatus === "HD") {
                    halfDays += 1;
                    presentDays += 0.5;
                  } else if (exstatus === "A") {
                    absentDays += 1;
                  } else if (exstatus === "PM") {
                    punchMissingDays += 1;
                  } else {
                    presentDays += 1;
                  }
                  totalShortLogin += a.lateBy;
                  totalLateByEarly += a.lateByEarly;
                  totalShiftBreakDuration += a.shiftBreakDuration;
                  totalBreakDuration += a.takenBreak;
                  totalBreakShortLogin += Math.max(
                    0,
                    a.takenBreak - a.shiftBreakDuration
                  );
                  return [
                    exstatus,
                    a.firstIn || "",
                    a.lastOut || "",
                    a.workingHrs,
                  ];
                }),
              totalShiftBreakDuration,
              totalBreakDuration,
              totalBreakShortLogin,
              totalLateByEarly,
              totalShortLogin,
              punchMissingDays,
              presentDays,
              halfDays,
              absentDays,
              shift.shiftName,
              email,
              personalEmail,
              bankAccountNumber,
              IFSCCode,
              bankName,
              accountHolderName,
            ];
            // sheet.addRow(row);
            return row;
          }
        );

        // Wait for all employee to be processed

        const attendances = await Promise.all(promises);

        return res.status(200).json({
          success: true,
          msg: ["data found"],
          data: { attendances: attendances.filter((item) => item !== null) },
        });
      } catch (error) {
        logger.error("Database error in attendances application", {
          error: error.message,
          key: 1,
        });
        const record = { success: true, msg: error.message, key: "error" };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in attendances application", {
        error: error.message,
        key: 2,
      });
      const record = { success: true, msg: error.message, key: "error" };
      return res.status(500).json(record);
    }
  },
];
const calculationProccessFunction = async (
  SITE_DB_NAME,
  ctcsp,
  proccessData,
  user,
  monthYear
) => {
  const attendanceData = await exportAttendanceFinalForProccess(
    SITE_DB_NAME,
    user,
    monthYear
  );

  if (attendanceData === "NA") {
    return "NA";
  }
  const ptEligibility = proccessData?.ptEligibility;
  const pfEligibility = proccessData?.pfEligibility;
  const esicEligibility = proccessData?.esicEligibility;
  const totalLeaveDeductionDays = attendanceData?.totalDeduction || 0;
  const totalPresentDays =
    attendanceData?.monthDays -
    (totalLeaveDeductionDays + attendanceData?.punchMissingDays / 2);

  const earnLWP = attendanceData?.lwp;
  const earnLWPAmount = round2(
    (proccessData?.grossSalary / attendanceData?.monthDays) * earnLWP
  );

  const earnEncashLeave = attendanceData?.paidLeave || 0;
  const earnEncashLeaveAmount = round2(
    (proccessData?.grossSalary / attendanceData?.monthDays) * earnEncashLeave
  );

  const earnCompOffDays = attendanceData?.compOff || 0;
  const earnCompOffDaysAmount = round2(
    (proccessData?.grossSalary / attendanceData?.monthDays) * earnCompOffDays
  );

  const earnfinalBasic = round2(
    (proccessData?.finalBasic / attendanceData?.monthDays) * totalPresentDays
  );
  const earnhra = round2(
    (proccessData?.hra / attendanceData?.monthDays) * totalPresentDays
  );
  const earnotherAllowance = round2(
    (proccessData?.otherAllowance / attendanceData?.monthDays) *
      totalPresentDays
  );
  const earngrossSalary = round2(earnfinalBasic + earnhra + earnotherAllowance);

  const earnTotalPay = earngrossSalary;
  const earnactualBasicSalary = earngrossSalary - earnhra;

  const earnepf = pfEligibility
    ? Math.min(
        (ctcsp?.pfMinBasicSalary *
          (ctcsp?.epfEmployerPfMinBasicSalaryPercentage || 13)) /
          100,
        round2(
          (earnactualBasicSalary *
            (ctcsp?.epfEmployerPfMinBasicSalaryPercentage || 13)) /
            100
        )
      )
    : 0;
  const earnemppf = pfEligibility
    ? Math.min(
        round2(
          (ctcsp?.pfMinBasicSalary *
            (ctcsp?.pfEmployeePfMinBasicSalaryPercentage || 12)) /
            100
        ),
        round2(
          (earnactualBasicSalary *
            (ctcsp?.pfEmployeePfMinBasicSalaryPercentage || 12)) /
            100
        )
      )
    : 0;
  // ESIC applies if checkbox is checked grossSalary ≤ ₹21,000

  const earnesic = esicEligibility
    ? round2((earngrossSalary * ctcsp?.esicEmployerGrossPercentage) / 100)
    : 0;
  const earnempesic = esicEligibility
    ? round2((earngrossSalary * ctcsp?.esicEmployeeGrossPercentage) / 100)
    : 0;

  const earntotalCTC = earngrossSalary + earnepf + earnesic;

  const earnIncentiveAmount = round2(attendanceData?.applyIncentiveAmount || 0);
  function parseMonthYear(str) {
    const [year, month] = str.split("-").map(Number);
    if (!month || isNaN(month) || month < 1 || month > 12) {
      return { year: 2025, month: 1 };
    }
    return { year, month };
  }

  const { month, year } = parseMonthYear(monthYear);
  const ptDeduction = ptEligibility
    ? await CommenFunction.getPTAmount(
        ctcsp,
        user,
        proccessData?.grossSalary,
        month
      )
    : 0;
  const taxableSalary = proccessData?.grossSalary * 12;
  const TDSDeductionResult =
    taxableSalary > 1275000
      ? await CommenFunction.getTDSAmount(taxableSalary, year)
      : "NA";
  const welfareDeduction = ctcsp?.welfareDeduction.find(
    (item) => item.month === month
  );
  const earnempptDeduction = ptDeduction;
  const earnempTDSDeduction =
    TDSDeductionResult !== "NA"
      ? round2(TDSDeductionResult?.taxPayable / 12)
      : 0;

  const earnempwelfareDeduction = welfareDeduction
    ? welfareDeduction?.amount
    : 0;

  const earnReimbursementAmount = round2(
    attendanceData?.applyReimbursementAmount || 0
  );
  const earnempotherDeduction = 0;
  const earnempTotalDeduction =
    earnempotherDeduction +
    earnempTDSDeduction +
    earnempptDeduction +
    earnempwelfareDeduction;
  const earnOtherAmount = 0;
  const earnNetPay =
    earngrossSalary +
    earnEncashLeaveAmount +
    earnCompOffDaysAmount -
    earnempTotalDeduction;
  const earnFinalNetPay = round2(
    earnOtherAmount + earnIncentiveAmount + earnNetPay + earnReimbursementAmount
  );

  return {
    attendanceData,
    totalLeaveDeductionDays,
    earnCompOffDays,
    earnCompOffDaysAmount,
    earnEncashLeave,
    earnEncashLeaveAmount,
    earnLWP,
    earnLWPAmount,
    earnTotalPay,
    earnfinalBasic,
    earnhra,
    earnotherAllowance,
    earngrossSalary,
    earnactualBasicSalary,
    earnpfMinBasicSalary: ctcsp?.pfMinBasicSalary,
    earnesicMinGrossSalary: ctcsp?.esicMinSalary,
    earnepfp: ctcsp?.epfEmployerPfMinBasicSalaryPercentage,
    earnepf,
    earnesicp: ctcsp?.esicEmployerGrossPercentage,
    earnesic,
    earntotalCTC,
    earnemppfp: ctcsp?.pfEmployeePfMinBasicSalaryPercentage,
    earnemppf,
    earnempesicp: ctcsp?.esicEmployeeGrossPercentage,
    earnempesic,
    earnIncentiveAmount,
    earnTotalPayWithIncentive: earnFinalNetPay,
    earnempptDeduction,
    earnempTDSDeduction,
    earnempwelfareDeduction,
    earnempotherDeduction,
    earnempTotalDeduction,
    earnNetPay,
    earnReimbursementAmount,
    earnOtherAmount,
    earnFinalNetPay,
  };
};

const exportAttendanceFinalForProccess = async (
  SITE_DB_NAME,
  userDetails,
  monthYear
) => {
  try {
    const deleteFlag = 0;
    const monthDays = new Date(
      ...monthYear.split("-").map(Number),
      0
    ).getDate();

    const userId = userDetails._id;
    let unitIds = userDetails?.unitId,
      name = userDetails?.name,
      email = userDetails?.email,
      image = userDetails?.image,
      uniqueId = userDetails?.uniqueId,
      personalEmail = userDetails?.personalEmail,
      bankName = userDetails?.bankName,
      bankAccountNumber = userDetails?.bankAccountNumber,
      IFSCCode = userDetails?.IFSCCode,
      accountHolderName = userDetails?.accountHolderName,
      departmentName = userDetails?.departmentDetails?.departmentName,
      religiousBreak = userDetails?.religiousBreak,
      joiningDate = userDetails?.joiningDate,
      holidays = userDetails?.holidays || [],
      shift = userDetails?.shiftDetails || null,
      monthlyExtraWorkingDays = shift?.monthlyExtraWorkingDays || [],
      weekEnds = shift?.weekEnds || [],
      shiftId = userDetails?.shiftId,
      relievingDate = userDetails?.relievingDate,
      monthlyExtraFreeMin = userDetails?.shiftDetails?.monthlyExtraFreeMin,
      designationName = userDetails?.designationName,
      weekWorkingDays = shift?.weekWorkingDays || [],
      shortLoginDeductions = userDetails?.shiftDetails?.shortLoginDeductions,
      unPlannedLeaveExtraDeduction =
        userDetails?.shiftDetails?.unPlannedLeaveExtraDeduction,
      plannedLeaveDeduction = 1;

    const getReimbursementsAmountByMonth =
      await CommenService.getReimbursementsAmountByMonth(
        SITE_DB_NAME,
        userId,
        monthYear
      );
    const getIncentivesAmountByMonth =
      await CommenService.getIncentivesAmountByMonth(
        SITE_DB_NAME,
        userId,
        monthYear
      );
    const getIncentivesByMonth = await CommenService.getIncentivesByMonth(
      SITE_DB_NAME,
      userId,
      "month",
      monthYear,
      0
    );
    const compoffByMonth = await CommenService.compoffByMonth(
      SITE_DB_NAME,
      userId,
      "month",
      monthYear,
      0
    );
    const leaves = await CommenService.getMyLeavesCount(
      SITE_DB_NAME,
      userId,
      "month",
      monthYear,
      0
    );
    const paidLeaves = await CommenService.getPaidLeave(
      SITE_DB_NAME,
      userId,
      monthYear
    );
    let carryForward = 0;
    let leaveEarned = 0;
    let appliedLeave = 0;
    let leaveForDeduction = 0;
    let remainingBalance = 0;
    let encashed = 0;
    let deductedPaidLeaves = 0;
    let leaveData = {};
    if (paidLeaves.length > 0) {
      leaveEarned = paidLeaves[0].leaveEarned;
      carryForward = paidLeaves[0].carryForward;
      appliedLeave = paidLeaves[0].appliedLeave;
      leaveForDeduction = paidLeaves[0].leaveForDeduction;
      remainingBalance = paidLeaves[0].remainingBalance;
      encashed = paidLeaves[0].encashed;
      deductedPaidLeaves = paidLeaves[0].deductedPaidLeaves;
      leaveData = paidLeaves[0].leaveData;
    }

    const allpolicy = await CommenService.checkExistPaidLeavePolicy(
      SITE_DB_NAME,
      userId,
      [monthYear]
    );
    const findPaildLeavePolicy = allpolicy.length > 0 ? allpolicy[0] : null;
    if (findPaildLeavePolicy) {
      shortLoginDeductions = findPaildLeavePolicy?.shortLoginDeductions;
      weekWorkingDays = findPaildLeavePolicy?.weekWorkingDays;
      weekEnds = findPaildLeavePolicy?.weekEnds;
      monthlyExtraWorkingDays = findPaildLeavePolicy?.monthlyExtraWorkingDays;
      monthlyExtraFreeMin = findPaildLeavePolicy?.monthlyExtraFreeMin;
      holidays = findPaildLeavePolicy?.holidays;
      shiftId = findPaildLeavePolicy?.shiftId;
      unPlannedLeaveExtraDeduction =
        findPaildLeavePolicy?.unPlannedLeaveExtraDeduction;
      plannedLeaveDeduction = findPaildLeavePolicy?.plannedLeaveDeduction;
    }
    const shiftIds = [shiftId];
    const [yearStr, monthStr] = monthYear.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    const isJoiningMonth =
      year === new Date(joiningDate).getFullYear() &&
      month === new Date(joiningDate).getMonth() + 1;
    const isRelievingMonth = relievingDate
      ? year ===
          new Date(relievingDate.toISOString().split("T")[0]).getFullYear() &&
        month ===
          new Date(relievingDate.toISOString().split("T")[0]).getMonth() + 1
      : false;
    const currentDate = new Date().toISOString().split("T")[0];

    const promisesAtt = Array.from({ length: monthDays }, async (_, index) => {
      const day = index + 1;
      const attendanceDate = `${monthYear}-${String(day).padStart(2, "0")}`;
      const weekDay = new Date(attendanceDate).getDay();
      const attendance = await CommenService.attendanceByDate(
        SITE_DB_NAME,
        userId,
        attendanceDate
      );

      let shiftReligiousBreakDuration = 0;
      if (religiousBreak > 0) {
        shiftReligiousBreakDuration = shift?.religiousBreakMin;
      }
      if (!attendance) {
        let status = "Absent";
        const holidayStatus = holidays.find((holiday) => {
          const holidayDate = new Date(holiday.date)
            .toISOString()
            .split("T")[0];
          return holidayDate === attendanceDate;
        });
        let dayName = moment(attendanceDate, "YYYY-MM-DD").format("dddd");
        let weekNumber = Math.ceil(day / 7);

        let isExtraWorkingDay = monthlyExtraWorkingDays.includes(
          `${weekNumber}${dayName}`
        );
        if (!holidayStatus && weekEnds.includes(dayName)) {
          status = "Weekend";
          if (isExtraWorkingDay) {
            status = "Absent";
          }
          const weekWorkingDates = getWeekDatesByNames(
            attendanceDate,
            weekWorkingDays
          );
          // const weekAttendancesStatus = await Attendance.find({
          //   userId: userId,
          //   date: { $in: weekWorkingDates },
          //   status: { $in: ["Present"] },
          // });
          const weekAttendancesStatus =
            await CommenService.getWeekAttendancesStatus(
              SITE_DB_NAME,
              userId,
              weekWorkingDates
            );

          const weekHolidays = holidays.some((holiday) => {
            const holidayDate = new Date(holiday.date)
              .toISOString()
              .split("T")[0];
            return weekWorkingDates.includes(holidayDate);
          });
          if (weekAttendancesStatus.length === 0 && !weekHolidays) {
            status = "Absent";
          }
        } else if (holidayStatus && !weekEnds.includes(dayName)) {
          status = "Holiday";
        } else if (holidayStatus && weekEnds.includes(dayName)) {
          status = `Holiday (Weekend)`;
        }
        return {
          _id: userId + uniqueId,
          userId: userId,
          unitIds: unitIds,
          uniqueId: uniqueId,
          name: name,
          image: image,
          shiftId: shiftId,
          shiftStart: shift?.startTime,
          shiftEnd: shift?.endTime,
          shiftBreakDuration: shift?.breakDuration,
          shiftReligiousBreakDuration: shiftReligiousBreakDuration,
          date: new Date(attendanceDate),
          punches: [],
          firstIn: null,
          firstInStatus: 0,
          lastOut: null,
          lastOutStatus: 0,
          workingHrs: "00:00",
          workingMin: 0,
          totalWorkingHrs: "00:00",
          totalWorkingMin: 0,
          breakDuration: 0,
          lateBy: 0,
          overTime: 0,
          status: status,
          presentStatus: "No",
          leaveStatus: "No",
          leaveType: "No",
          activeFlag: 1,
          shortLoginHDStatus: 0,
          religiousBreakDuration: shiftReligiousBreakDuration,
          religiousBreakStatus: religiousBreak,
          designationName: designationName,
          deleteFlag: deleteFlag || 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          lateByEarly: 0,
          takenBreak: 0,
        };
      } else {
        return attendance;
      }
    });
    try {
      const userAttendances = await Promise.all(promisesAtt);

      let presentDays = 0,
        halfDaysDeduction = 0,
        plannedSickDeduction = 0,
        halfDaySum = 0,
        halfDayCount = 0,
        halfDayPL = 0,
        halfDayUPL = 0,
        absent = 0,
        absentDaysDeduction = 0,
        absentDays = 0,
        absentHalfDay = 0,
        punchMissingDays = 0,
        totalShortLogin = 0,
        totalLateByEarly = 0,
        totalBreakDuration = 0,
        totalShiftBreakDuration = 0,
        totalBreakShortLogin = 0;

      let totalDeduction = 0,
        shortLoginDeduction = 0,
        unplanned = 0,
        unplannedDeduction = 0,
        planned = 0,
        sick = 0,
        maternity = 0,
        paternity = 0,
        paidLeave = leaveEarned,
        compOff = compoffByMonth?.totalCount || 0,
        incentiveEligible5Percent = getIncentivesByMonth ? "YES" : "NO";
      const pl = Number(plannedLeaveDeduction) || 0;
      const up = Number(unPlannedLeaveExtraDeduction) || 0;
      const userAttendanceResults = await Promise.all(
        userAttendances
          .filter((item) => item !== null)
          .map(async (a, inx) => {
            let exstatus =
              a.status === "Present"
                ? a.punches?.length % 2 === 0
                  ? a?.shortLoginHDStatus === 0
                    ? "P"
                    : "HD"
                  : "PM"
                : a.status === "Absent"
                ? "A"
                : a.status === "Holiday"
                ? "H"
                : a.status === "Weekend"
                ? "W"
                : a.status === "Holiday (Weekend)"
                ? "HW"
                : "NA";
            const dateStr = moment(a.date).format("YYYY-MM-DD");
            if (exstatus === "HD") {
              const leave = await CommenService.leaveByDate(
                SITE_DB_NAME,
                userId,
                dateStr
              );
              if (leave) {
                if (
                  leave.dayType !== "FullDay" &&
                  leave?.leaveType === "Unplanned"
                ) {
                  halfDaysDeduction +=
                    Math.max(pl, 0) / 2 + Math.max(up, 0) / 2;
                  presentDays += 0.5;
                  unplanned += 0.5;
                  halfDayCount += 1;
                  halfDayUPL += 1;
                } else {
                  halfDaysDeduction += Math.max(pl, 0) / 2;
                  presentDays += 0.5;
                  halfDayCount += 1;
                  halfDayPL += 1;
                  if (leave?.leaveType === "Planned") planned += 0.5;
                  else if (leave?.leaveType === "Sick") sick += 0.5;
                }
              } else {
                halfDaysDeduction += Math.max(pl, 0) / 2 + Math.max(up, 0) / 2;
                presentDays += 0.5;
                unplanned += 0.5;
                halfDayCount += 1;
                halfDayUPL += 1;
              }
            } else if (exstatus === "A") {
              const leave = await CommenService.leaveByDate(
                SITE_DB_NAME,
                userId,
                dateStr
              );
              if (leave) {
                if (
                  leave.dayType === "FullDay" &&
                  leave?.leaveType === "Unplanned"
                ) {
                  absentDaysDeduction += Math.max(pl, 0) + Math.max(up, 0);
                  unplanned += 1;
                  absent += 1;
                  unplannedDeduction += Math.max(pl, 0) + Math.max(up, 0);
                  exstatus = "UPL";
                } else {
                  absentDaysDeduction += Math.max(pl, 0);
                  absent += 1;
                  if (leave?.leaveType === "Planned") {
                    planned += 1;
                    exstatus = "PL"; // Planned leave
                  } else if (leave?.leaveType === "Sick") {
                    sick += 1;
                    exstatus = "SL"; // Sick leave
                  } else if (leave?.leaveType === "Maternity") {
                    maternity += 1;
                  } else if (leave?.leaveType === "Paternity") {
                    paternity += 1;
                  }
                }
              } else {
                if (isRelievingMonth || isJoiningMonth) {
                  absentDaysDeduction += Math.max(pl, 0);
                  planned += 1;
                  absent += 1;
                  exstatus = "PL";
                } else {
                  absentDaysDeduction += Math.max(pl, 0) + Math.max(up, 0);
                  unplanned += 1;
                  absent += 1;
                  exstatus = "UPL";
                  unplannedDeduction += Math.max(pl, 0) + Math.max(up, 0);
                }
              }
            } else if (exstatus === "PM") {
              punchMissingDays += 1;
            } else {
              presentDays += 1;
            }
            totalShortLogin += a.lateBy;
            totalLateByEarly += a.lateByEarly;
            totalBreakDuration += a.takenBreak;
            totalShiftBreakDuration += a.shiftBreakDuration;
            totalBreakShortLogin += Math.max(
              0,
              a.takenBreak - a.shiftBreakDuration
            );
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
            halfDaySum = halfDayCount / 2;
            absentHalfDay = halfDaySum + absent;
            plannedSickDeduction = planned + sick;
            shortLoginDeduction = getDeductionFromSlab(
              shortLoginDeductions,
              totalShortLogin
            );
            totalDeduction =
              Number(shortLoginDeduction) +
              Number(absentDaysDeduction) +
              Number(halfDaysDeduction);
            return { dateStr: exstatus };
          })
      );
      let incentiveAmount5Percent = 0,
        applyIncentiveAmount = getIncentivesAmountByMonth?.totalAmount || 0,
        applyReimbursementAmount =
          getReimbursementsAmountByMonth?.totalAmount || 0,
        lwpAmount = 0,
        grossSalary = 0,
        netSalary = 0;
      let lwp = totalDeduction - compOff - paidLeave;
      const row = {
        index: 1,
        uniqueId,
        name,
        departmentName,
        joiningDate: moment(joiningDate, "YYYY-MM-DD").format("DD-MM-YYYY"),
        ...userAttendanceResults,
        //===========================
        punchMissingDays,
        presentDays,
        absentHalfDay,
        totalShortLogin,
        shortLoginDeduction,
        halfDaysDeduction,
        unplannedDeduction,
        plannedSickDeduction,
        totalDeduction,
        //=====================
        paidLeave,
        compOff,
        lwp,
        incentiveEligible5Percent,
        //===========================
        incentiveAmount5Percent,
        applyIncentiveAmount,
        applyReimbursementAmount,
        lwpAmount,
        grossSalary,
        netSalary,
        email,
        personalEmail,
        bankAccountNumber,
        IFSCCode,
        bankName,
        accountHolderName,
        absent,
        halfDayUPL,
        halfDayPL,
        halfDayCount,
        unplanned,
        planned,
        sick,
        monthDays,
      };
      return row;
    } catch (error) {
      console.log(error.message);

      return "NA";
    }
  } catch (error) {
    console.log(error.message);
    return "NA";
  }
};

//======================================  add Proccess ===========================
const bulkFrozen = [
  //  validation

  body("proccessId")
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("totalCTCYearly")
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    if (!CURRENT_USER) {
      return res
        .status(200)
        .json({ success: false, msg: msg.msgUnitNotExist, proccess: [] });
    }

    if (!CURRENT_USER) {
      return res
        .status(200)
        .json({ success: false, msg: msg.msgUnitNotExist, proccess: [] });
    }
    const userIdCurrent = CURRENT_USER_ID;
    const roleNameCurrent = CURRENT_USER?.roleName;
    const unitIdsCurrent = CURRENT_USER?.unitId;

    try {
      const { dayMonthYear, Ids, type } = req.body;

      try {
        const filter =
          type === "Role-Back"
            ? { month: dayMonthYear, isFrozen: "Yes" }
            : type === "Frozen"
            ? { month: dayMonthYear, isFrozen: "No" }
            : { month: dayMonthYear, payStatus: "Unpaid" };
        if (Ids && Ids.length > 0) {
          filter._id = { $in: Ids.map((id) => id.toString()) };
        }
        const updateData =
          type === "Role-Back"
            ? {
                lastUpdatedById: userIdCurrent,
                statusById: userIdCurrent,
                status: "Initial",
                isFrozen: "No",
                payStatus: "Unpaid",
              }
            : type === "Frozen"
            ? {
                isFrozenById: userIdCurrent,
                isFrozen: "Yes",
                lastUpdatedById: userIdCurrent,
              }
            : {
                isFrozenById: userIdCurrent,
                isFrozen: "Yes",
                lastUpdatedById: userIdCurrent,
                payStatusById: userIdCurrent,
                payStatus: "Paid",
              };
        const bulkUpdateMonthlyProccess =
          await CommenService.bulkUpdateMonthlyProccess(
            SITE_DB_NAME,
            filter,
            updateData
          );
        if (bulkUpdateMonthlyProccess === "NA") {
          logger.error("Proccess last id not found", {
            error: bulkUpdateMonthlyProccess,
            key: 0,
          });
        }

        const record = {
          success: true,
          msg: msg.msgProccessAddSuccess,
          data: { proccesss: requestAddStatus },
        };
        return res.status(200).json(record);
      } catch (error) {
        logger.error("Database error in add proccesss application 1", {
          error: error.message,
        });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    } catch (error) {
      logger.error("Database error in add proccesss application 2", {
        error: error.message,
        key: 1,
      });
      const record = {
        success: false,
        msg: msg.msgServerError,
        key: error,
      };
      return res.status(500).json(record);
    }
  },
];
const redirectPage = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    const identifier = (process.env.APP_IDENTIFIER || "hrmsapp").replace(
      /:\/+$/,
      ""
    );
    const siteUrl = process.env.SITE_URL || "https://tshrms.com";
    const appName = process.env.APP_NAME || "Task Source";
    const APP_URL = process.env.APP_URL || "https://tshrms.com/api/server";

    // safe id
    const safeId = encodeURIComponent(id || "");

    // defaults
    const defaultBgColor = process.env.BACKGROUND_COLOR || "#f8f9fb";
    const defaultButtonColor = process.env.FOOTERBACKGROUND || "#007bff";
    const defaultButtonHover = process.env.BUTTON_HOVER || "#0056b3";
    const defaultBgImage =
      process.env.PLANFORM_BG_IMAGE || `${APP_URL}/logos/login-bg.jpg`;

    let pageTitle = `Complete Registration | ${appName} HRMS`;
    let heading = "Complete Your Registration";
    let subText = "Would you like to continue on the App or Website?";
    let appScheme = `${identifier}://registration/${safeId}`;
    let webLink = `${siteUrl}/registration/${safeId}`;

    if (type === "forgot") {
      pageTitle = `Reset Your Password | ${appName} HRMS`;
      heading = "Forgot Your Password?";
      subText = "You can reset your password using the App or Website.";
      appScheme = `${identifier}://forgot-password/${safeId}`;
      webLink = `${siteUrl}/resetpassword?uniqcode=${safeId}`;
    }

    // debug logs while developing

    res.render("choosePlatform", {
      pageTitle,
      heading,
      subText,
      appScheme,
      androidStore:
        process.env.PLAY_STORE_URL ||
        "https://play.google.com/store/apps/details?id=com.tasksource.hrms",
      iosStore:
        process.env.APP_STORE_URL ||
        "https://apps.apple.com/in/app/tasksource-hrms/id1234567890",
      webLink,
      // style props
      backgroundColor: defaultBgColor,
      textColor: process.env.TEXT_COLOR || "#333",
      headingColor: process.env.HEADING_COLOR || "#222",
      buttonColor: defaultButtonColor,
      buttonHover: defaultButtonHover,
      backgroundImage: defaultBgImage, // full URL
    });
  } catch (err) {
    console.error("Redirect Page Error:", err);
    res.status(500).send("Internal Server Error");
  }
};
//========================================admin controller ===================
//====================================== companies===========================
const companies = async (req, res) => {
  try {
    const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
    if (!SITE_DB_NAME) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const companies = await CommenService.getCompanies(SITE_DB_NAME);

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

const weekDays = async (req, res) => {
  try {
    const SITE_DB_NAME = req.CURRENT_SITE_DB_NAME;
    if (!SITE_DB_NAME) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const weekDays = await CommenService.getWeekDays(SITE_DB_NAME);

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
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;

    const CURRENT_ROLE_NAME = req?.CURRENT_USER?.roleName;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag } = req.query;
    try {
      const unitIds = CURRENT_USER?.unitId;

      if (!unitIds || unitIds?.length === 0) {
        const record = {
          success: true,
          msg: msg.msgDataFound,
          data: { units: [] },
        };
        return res.status(200).json(record);
      }
      const pagination = {
        pageSize: parseInt(req.query.pageSize) || 10,
        pageNumber: parseInt(req.query.pageNumber) || 1,
      };
      const search = req.query.search || "";
      const companyId = req.query.companyId || "";
      const units = await CommenService.getUnits(
        SITE_DB_NAME,
        CURRENT_ROLE_NAME,
        unitIds,
        Number(deleteFlag),
        pagination,
        search,
        companyId
      );

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
  },
];
const addUnit = [
  //  validation
  body("companyId")
    .trim()
    .exists()
    .withMessage(msg.msgCompanyIdReqired)
    .notEmpty()
    .withMessage(msg.msgCompanyIdReqired),
  body("unitName")
    .trim()
    .exists()
    .withMessage(msg.msgUnitNameReqired)
    .notEmpty()
    .withMessage(msg.msgUnitNameReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const {
        unitName,
        companyId,
        unitEmail,
        unitURL,
        unitAddress,
        latitude,
        longitude,
      } = req.body;
      const checkUnitName = await CommenService.checkUnitName(
        SITE_DB_NAME,
        unitName
      );
      if (checkUnitName !== 0) {
        const record = {
          success: false,
          msg: msg.msgUnitExist,
        };
        return res.status(200).json(record);
      }

      try {
        const data = {
          companyId,
          unitName,
          unitEmail,
          unitURL,
          unitAddress,
          latitude,
          longitude,
        };
        const unit = await CommenService.addUnit(SITE_DB_NAME, data);
        if (unit === "NA") {
          const record = {
            success: false,
            msg: msg.msgUnitAddError,
          };
          return res.status(200).json(record);
        } else {
          const addUnitINUser = await CommenService.addUnitInUser(
            SITE_DB_NAME,
            unit?._id,
            CURRENT_USER_ID,
            CURRENT_USER?.roleName
          );
          if (addUnitINUser === "NA") {
            const record = {
              success: false,
              msg: msg.msgUnitAddError,
            };
            return res.status(200).json(record);
          }
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
  },
];

const editUnit = [
  //  validation
  body("unitId")
    .trim()
    .exists()
    .withMessage(msg.msgUnitIdReqired)
    .notEmpty()
    .withMessage(msg.msgUnitIdReqired),
  body("companyId")
    .trim()
    .exists()
    .withMessage(msg.msgCompanyIdReqired)
    .notEmpty()
    .withMessage(msg.msgCompanyIdReqired),
  body("unitName")
    .trim()
    .exists()
    .withMessage(msg.msgUnitNameReqired)
    .notEmpty()
    .withMessage(msg.msgUnitNameReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const {
        unitId,
        unitName,
        companyId,
        unitEmail,
        unitURL,
        unitAddress,
        latitude,
        longitude,
      } = req.body;
      const checkUnit = await CommenService.checkUnit(SITE_DB_NAME, unitId);
      if (checkUnit === 0) {
        const record = {
          success: false,
          msg: msg.msgUnitNotExist,
        };
        return res.status(200).json(record);
      }

      try {
        const checkUnitWithName = await CommenService.checkUnitWithName(
          SITE_DB_NAME,
          unitId,
          unitName
        );
        if (checkUnitWithName !== 0) {
          const record = {
            success: false,
            msg: msg.msgUnitExist,
          };
          return res.status(200).json(record);
        }

        try {
          const data = {
            companyId,
            unitName,
            unitEmail,
            unitURL,
            unitAddress,
            latitude,
            longitude,
          };
          const unitStatus = await CommenService.editUnit(
            SITE_DB_NAME,
            unitId,
            data
          );
          if (unitStatus === "NA") {
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
  },
];

const activeDeactiveUnit = [
  //  validation
  body("unitId")
    .trim()
    .exists()
    .withMessage(msg.msgUnitIdReqired)
    .notEmpty()
    .withMessage(msg.msgUnitIdReqired),
  body("activeFlag")
    .trim()
    .exists()
    .withMessage(msg.msgActiveFlagReqired)
    .notEmpty()
    .withMessage(msg.msgActiveFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { unitId, activeFlag } = req.body;
      const checkUnit = await CommenService.checkUnit(SITE_DB_NAME, unitId);
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
        const unitStatus = await CommenService.activeDeactiveUnit(
          SITE_DB_NAME,
          unitId,
          activeDeactiveFlag
        );
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
  },
];

const deleteUnit = [
  //  validation
  query("unitId")
    .trim()
    .exists()
    .withMessage(msg.msgUnitIdReqired)
    .notEmpty()
    .withMessage(msg.msgUnitIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { unitId } = req.query;

      const checkUnit = await CommenService.checkUnit(SITE_DB_NAME, unitId);
      if (checkUnit === 0) {
        const record = {
          success: false,
          msg: msg.msgUnitNotExist,
        };
        return res.status(200).json(record);
      }

      try {
        const unitStatus = await CommenService.deleteUnit(SITE_DB_NAME, unitId);
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
  },
];

//======================================   shift===========================
const shifts = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag } = req.query;

    try {
      const unitIds = CURRENT_USER?.unitId;

      if (!unitIds || unitIds?.length === 0) {
        const record = {
          success: true,
          msg: msg.msgDataFound,
          data: { units: [] },
        };
        return res.status(200).json(record);
      }
      const pagination = {
        pageSize: parseInt(req.query.pageSize) || 10,
        pageNumber: parseInt(req.query.pageNumber) || 1,
      };

      const search = req.query.search || "";
      const shifts = await CommenService.getShifts(
        SITE_DB_NAME,
        unitIds,
        Number(deleteFlag),
        pagination,
        search
      );
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
const getOneShift = [
  //  validation
  query("shiftId")
    .trim()
    .exists()
    .withMessage(msg.msgShiftIdReqired)
    .notEmpty()
    .withMessage(msg.msgShiftIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { shiftId } = req.query;
      const checkShift = await CommenService.checkShiftOne(
        SITE_DB_NAME,
        shiftId
      );
      if (checkShift === 0) {
        const record = {
          success: false,
          msg: msg.msgShiftNotExist,
        };
        return res.status(200).json(record);
      }
      try {
        const shift = await CommenService.getOneShift(SITE_DB_NAME, checkShift);
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
  },
];
const unitShifts = [
  query("unitId")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    let { unitId, deleteFlag } = req.query;

    try {
      unitId = unitId ? (Array.isArray(unitId) ? unitId : [unitId]) : [];
      const shifts = await CommenService.getUnitShifts(
        SITE_DB_NAME,
        unitId,
        Number(deleteFlag)
      );
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
  body("unitId")
    .trim()
    .exists()
    .withMessage(msg.msgUnitIdReqired)
    .notEmpty()
    .withMessage(msg.msgUnitIdReqired),
  body("shiftName")
    .trim()
    .exists()
    .withMessage(msg.msgShiftNameReqired)
    .notEmpty()
    .withMessage(msg.msgShiftNameReqired),
  body("startTime")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("endTime")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("totalWorkingDurationInDay")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("firstHalfDayStartTime")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("firstHalfDayEndTime")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("firstHalfDuration")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("secHalfDayStartTime")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("secHalfDayEndTime")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("secHalfDuration")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("weekWorkingDays")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("ptDeduction")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("otherAndTdsDeduction")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("otherAndTdsDeduction")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
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

      const checkShiftName = await CommenService.checkShiftName(
        SITE_DB_NAME,
        shiftName
      );
      if (checkShiftName !== 0) {
        const record = {
          success: false,
          msg: msg.msgShiftExist,
        };
        return res.status(200).json(record);
      }

      try {
        const shift = await CommenService.addShift(
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
  },
];

const editShift = [
  //  validation
  body("shiftId")
    .trim()
    .exists()
    .withMessage(msg.msgShiftIdReqired)
    .notEmpty()
    .withMessage(msg.msgShiftIdReqired),
  body("unitId")
    .trim()
    .exists()
    .withMessage(msg.msgUnitIdReqired)
    .notEmpty()
    .withMessage(msg.msgUnitIdReqired),
  body("shiftName")
    .trim()
    .exists()
    .withMessage(msg.msgShiftNameReqired)
    .notEmpty()
    .withMessage(msg.msgShiftNameReqired),
  body("startTime")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("endTime")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("totalWorkingDurationInDay")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("firstHalfDayStartTime")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("firstHalfDayEndTime")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("firstHalfDuration")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("secHalfDayStartTime")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("secHalfDayEndTime")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("secHalfDuration")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("weekWorkingDays")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("ptDeduction")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("otherAndTdsDeduction")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("otherAndTdsDeduction")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
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

      const checkShift = await CommenService.checkShift(SITE_DB_NAME, shiftId);
      if (checkShift === 0) {
        const record = {
          success: false,
          msg: msg.msgShiftNotExist,
        };
        return res.status(200).json(record);
      }

      try {
        const checkShiftWithName = await CommenService.checkShiftWithName(
          SITE_DB_NAME,
          shiftId,
          shiftName
        );
        if (checkShiftWithName !== 0) {
          const record = {
            success: false,
            msg: msg.msgShiftExist,
          };
          return res.status(200).json(record);
        }

        try {
          const shiftStatus = await CommenService.editShift(
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
  },
];

const activeDeactiveShift = [
  //  validation
  body("shiftId")
    .trim()
    .exists()
    .withMessage(msg.msgShiftIdReqired)
    .notEmpty()
    .withMessage(msg.msgShiftIdReqired),
  body("activeFlag")
    .trim()
    .exists()
    .withMessage(msg.msgActiveFlagReqired)
    .notEmpty()
    .withMessage(msg.msgActiveFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { shiftId, activeFlag } = req.body;
      const checkShift = await CommenService.checkShift(SITE_DB_NAME, shiftId);
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
        const shiftStatus = await CommenService.activeDeactiveShift(
          SITE_DB_NAME,
          shiftId,
          activeDeactiveFlag
        );
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
  },
];

const deleteShift = [
  //  validation
  query("shiftId")
    .trim()
    .exists()
    .withMessage(msg.msgShiftIdReqired)
    .notEmpty()
    .withMessage(msg.msgShiftIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { shiftId } = req.query;

      const checkShift = await CommenService.checkShift(SITE_DB_NAME, shiftId);
      if (checkShift === 0) {
        const record = {
          success: false,
          msg: msg.msgShiftNotExist,
        };
        return res.status(200).json(record);
      }

      try {
        const shiftStatus = await CommenService.deleteShift(
          SITE_DB_NAME,
          shiftId
        );
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
  },
];

//====================================== department===========================

const departments = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag } = req.query;
    try {
      const pagination = {
        pageSize: parseInt(req.query.pageSize) || 10,
        pageNumber: parseInt(req.query.pageNumber) || 1,
      };

      const search = req.query.search || "";
      const departments = await CommenService.getDepartments(
        SITE_DB_NAME,
        Number(deleteFlag),
        pagination,
        search
      );

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

  body("departmentName")
    .trim()
    .exists()
    .withMessage(msg.msgDepartmentNameReqired)
    .notEmpty()
    .withMessage(msg.msgDepartmentNameReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { departmentName } = req.body;
      const checkDepartmentName = await CommenService.checkDepartmentName(
        SITE_DB_NAME,
        departmentName
      );
      if (checkDepartmentName !== 0) {
        const record = {
          success: false,
          msg: msg.msgDepartmentExist,
        };
        return res.status(200).json(record);
      }

      try {
        const department = await CommenService.addDepartment(
          SITE_DB_NAME,
          departmentName
        );
        if (department === "NA") {
          const record = {
            success: false,
            msg: msg.msgDepartmentAddError,
          };
          return res.status(200).json(record);
        }
        try {
          const { peopleId } = req.body;
          const departmentId = department?._id;
          const updatePeople = await CommenService.updateMultiPeopleAndRemove(
            SITE_DB_NAME,
            peopleId,
            departmentId
          );

          if (updatePeople === "NA") {
            const record = {
              success: false,
              msg: msg.msgUpdatePeopleError,
            };
            return res.status(200).json(record);
          }

          const departmentDetails =
            await CommenService.getMultiPeopleDepartment(
              SITE_DB_NAME,
              departmentId
            );
          const record = {
            success: true,
            msg: msg.msgDepartmentAddSuccess,
            data: {
              department: departmentDetails,
            },
          };

          return res.status(200).json(record);
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

const editDepartment = [
  //  validation

  body("departmentId")
    .trim()
    .exists()
    .withMessage(msg.msgDepartmentIdReqired)
    .notEmpty()
    .withMessage(msg.msgDepartmentIdReqired),
  body("departmentName")
    .trim()
    .exists()
    .withMessage(msg.msgDepartmentNameReqired)
    .notEmpty()
    .withMessage(msg.msgDepartmentNameReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { departmentName, departmentId } = req.body;

      const checkDepartment = await CommenService.checkDepartment(
        SITE_DB_NAME,
        departmentId
      );
      if (checkDepartment === 0) {
        const record = {
          success: false,
          msg: msg.msgDepartmentNotExist,
        };
        return res.status(200).json(record);
      }

      try {
        const checkDepartmentWithName =
          await CommenService.checkDepartmentWithName(
            SITE_DB_NAME,
            departmentId,
            departmentName
          );
        if (checkDepartmentWithName !== 0) {
          const record = {
            success: false,
            msg: msg.msgDepartmentExist,
          };
          return res.status(200).json(record);
        }

        try {
          const departmentStatus = await CommenService.editDepartment(
            SITE_DB_NAME,
            departmentId,
            departmentName
          );
          if (departmentStatus === 0) {
            const record = {
              success: false,
              msg: msg.msgDepartmentUpdateError,
            };
            return res.status(200).json(record);
          }

          try {
            const { peopleId } = req.body;
            const updatePeople = await CommenService.updateMultiPeopleAndRemove(
              SITE_DB_NAME,
              peopleId,
              departmentId
            );

            if (updatePeople === "NA") {
              const record = {
                success: false,
                msg: msg.msgUpdatePeopleError,
              };
              return res.status(200).json(record);
            }

            const departmentDetails =
              await CommenService.getMultiPeopleDepartment(
                SITE_DB_NAME,
                departmentId
              );
            const record = {
              success: true,
              msg: msg.msgDepartmentUpdateSuccess,
              data: {
                department: departmentDetails,
              },
            };

            return res.status(200).json(record);
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
  },
];

const activeDeactiveDepartment = [
  //  validation
  body("departmentId")
    .trim()
    .exists()
    .withMessage(msg.msgDepartmentIdReqired)
    .notEmpty()
    .withMessage(msg.msgDepartmentIdReqired),
  body("activeFlag")
    .trim()
    .exists()
    .withMessage(msg.msgActiveFlagReqired)
    .notEmpty()
    .withMessage(msg.msgActiveFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { departmentId, activeFlag } = req.body;
      const checkDepartment = await CommenService.checkDepartment(
        SITE_DB_NAME,
        departmentId
      );
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
        const departmentStatus = await CommenService.activeDeactiveDepartment(
          SITE_DB_NAME,
          departmentId,
          activeDeactiveFlag
        );
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
  },
];

const deleteDepartment = [
  //  validation
  query("departmentId")
    .trim()
    .exists()
    .withMessage(msg.msgDepartmentIdReqired)
    .notEmpty()
    .withMessage(msg.msgDepartmentIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { departmentId } = req.query;

      const checkDepartment = await CommenService.checkDepartment(
        SITE_DB_NAME,
        departmentId
      );
      if (checkDepartment === 0) {
        const record = {
          success: false,
          msg: msg.msgDepartmentNotExist,
        };
        return res.status(200).json(record);
      }

      try {
        const departmentStatus = await CommenService.deleteDepartment(
          SITE_DB_NAME,
          departmentId
        );
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
    const registeredById = CURRENT_USER_ID;
    const reportingManager = req.body.reportingManagerId;
    let reportingManagerId = null;
    if (reportingManager === "") {
      reportingManagerId = null;
    } else {
      reportingManagerId = reportingManager;
    }
    const approvedById = CURRENT_USER_ID;
    const checkUserEmail = await CommenService.checkUserEmail(
      SITE_DB_NAME,
      email.toLowerCase()
    );
    if (checkUserEmail !== 0) {
      const record = {
        success: false,
        msg: msg.msgEmailAlreadyExist,
      };
      return record;
    }
    const checkUserUniqueId = await CommenService.checkUserUniqueId(
      SITE_DB_NAME,
      uniqueId
    );
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
      const employee = await CommenService.addEmployee(
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
        const userDetails = await CommenService.getUserDetails(
          SITE_DB_NAME,
          employee._id
        );
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
        const mailContents = msg.mailContentAddEmployee(
          siteURL,
          process.env.FOOTERBACKGROUND,
          email,
          password
        );
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
            const responce = await MailFunctions.mailSend(
              mailEmail,
              mailFromName,
              mailSubject,
              mailBody
            );
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
  body("unitId")
    .trim()
    .exists()
    .withMessage(msg.msgUnitIdReqired)
    .notEmpty()
    .withMessage(msg.msgUnitIdReqired),
  body("companyId")
    .trim()
    .exists()
    .withMessage(msg.msgCompanyIdReqired)
    .notEmpty()
    .withMessage(msg.msgCompanyIdReqired),
  body("shiftId")
    .trim()
    .exists()
    .withMessage(msg.msgShiftIdReqired)
    .notEmpty()
    .withMessage(msg.msgShiftIdReqired),
  body("roleId")
    .trim()
    .exists()
    .withMessage(msg.msgRoleIdReqired)
    .notEmpty()
    .withMessage(msg.msgRoleIdReqired),
  body("roleName")
    .trim()
    .exists()
    .withMessage(msg.msgRoleNameReqired)
    .notEmpty()
    .withMessage(msg.msgRoleNameReqired),
  body("departmentId")
    .trim()
    .exists()
    .withMessage(msg.msgDesignationIdReqired)
    .notEmpty()
    .withMessage(msg.msgDesignationIdReqired),

  body("uniqueId")
    .trim()
    .exists()
    .withMessage(msg.msgUniqueIdReqired)
    .notEmpty()
    .withMessage(msg.msgUniqueIdReqired),
  body("designationName")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("firstName")
    .trim()
    .exists()
    .withMessage(msg.msgFirstNameReqired)
    .notEmpty()
    .withMessage(msg.msgFirstNameReqired),
  body("lastName")
    .trim()
    .exists()
    .withMessage(msg.msgLastNameReqired)
    .notEmpty()
    .withMessage(msg.msgLastNameReqired),
  body("name")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("email")
    .trim()
    .exists()
    .withMessage(msg.msgEmailReqired)
    .notEmpty()
    .withMessage(msg.msgEmailReqired),
  body("personalEmail")
    .trim()
    .exists()
    .withMessage(msg.msgEmailReqired)
    .notEmpty()
    .withMessage(msg.msgEmailReqired),
  body("mobileNumber")
    .trim()
    .exists()
    .withMessage(msg.msgMobileNumberReqired)
    .notEmpty()
    .withMessage(msg.msgMobileNumberReqired),
  body("dob")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("originalDob")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("joiningDate")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("PANNumber")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("aadharNumber")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("fatherName")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("address")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("gender")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("maritalStatus")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("city")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("state")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("pincode")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg, errors });
    }
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
      const registeredById = CURRENT_USER_ID;
      const reportingManager = req.body.reportingManagerId;
      let reportingManagerId = null;
      if (reportingManager === "") {
        reportingManagerId = null;
      } else {
        reportingManagerId = reportingManager;
      }
      const approvedById = CURRENT_USER_ID;
      const checkUserEmail = await CommenService.checkUserEmail(
        SITE_DB_NAME,
        email.toLowerCase()
      );
      if (checkUserEmail !== 0) {
        const record = {
          success: false,
          msg: msg.msgEmailAlreadyExist,
        };
        return res.status(200).json(record);
      }
      const checkUserUniqueId = await CommenService.checkUserUniqueId(
        SITE_DB_NAME,
        uniqueId
      );
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
        const employee = await CommenService.addEmployee(
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
          const userDetails = await CommenService.getUserDetails(
            SITE_DB_NAME,
            employee._id
          );
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
          const mailContents = msg.mailContentAddEmployee(
            siteURL,
            process.env.FOOTERBACKGROUND,
            email,
            password
          );
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
              const responce = await MailFunctions.mailSend(
                mailEmail,
                mailFromName,
                mailSubject,
                mailBody
              );
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
  },
];
const editEmployee = [
  //  validation
  body("employeeId")
    .trim()
    .exists()
    .withMessage(msg.msgEmployeeIdReqired)
    .notEmpty()
    .withMessage(msg.msgEmployeeIdReqired),
  body("unitId")
    .trim()
    .exists()
    .withMessage(msg.msgUnitIdReqired)
    .notEmpty()
    .withMessage(msg.msgUnitIdReqired),
  body("companyId")
    .trim()
    .exists()
    .withMessage(msg.msgCompanyIdReqired)
    .notEmpty()
    .withMessage(msg.msgCompanyIdReqired),
  body("shiftId")
    .trim()
    .exists()
    .withMessage(msg.msgShiftIdReqired)
    .notEmpty()
    .withMessage(msg.msgShiftIdReqired),
  body("roleId")
    .trim()
    .exists()
    .withMessage(msg.msgRoleIdReqired)
    .notEmpty()
    .withMessage(msg.msgRoleIdReqired),
  body("roleName")
    .trim()
    .exists()
    .withMessage(msg.msgRoleNameReqired)
    .notEmpty()
    .withMessage(msg.msgRoleNameReqired),
  body("departmentId")
    .trim()
    .exists()
    .withMessage(msg.msgDesignationIdReqired)
    .notEmpty()
    .withMessage(msg.msgDesignationIdReqired),

  body("uniqueId")
    .trim()
    .exists()
    .withMessage(msg.msgUniqueIdReqired)
    .notEmpty()
    .withMessage(msg.msgUniqueIdReqired),
  body("designationName")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("firstName")
    .trim()
    .exists()
    .withMessage(msg.msgFirstNameReqired)
    .notEmpty()
    .withMessage(msg.msgFirstNameReqired),
  body("lastName")
    .trim()
    .exists()
    .withMessage(msg.msgLastNameReqired)
    .notEmpty()
    .withMessage(msg.msgLastNameReqired),
  body("name")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("email")
    .trim()
    .exists()
    .withMessage(msg.msgEmailReqired)
    .notEmpty()
    .withMessage(msg.msgEmailReqired),
  body("personalEmail")
    .trim()
    .exists()
    .withMessage(msg.msgEmailReqired)
    .notEmpty()
    .withMessage(msg.msgEmailReqired),
  body("mobileNumber")
    .trim()
    .exists()
    .withMessage(msg.msgMobileNumberReqired)
    .notEmpty()
    .withMessage(msg.msgMobileNumberReqired),
  body("dob")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("originalDob")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("joiningDate")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("PANNumber")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("aadharNumber")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("fatherName")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("address")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("gender")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("maritalStatus")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("city")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("state")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  body("pincode")
    .trim()
    .exists()
    .withMessage(msg.msgAllFieldReqired)
    .notEmpty()
    .withMessage(msg.msgAllFieldReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg, errors });
    }
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

      const checkUserEmail = await CommenService.checkUserEmailWithId(
        SITE_DB_NAME,
        employeeId,
        email.toLowerCase()
      );
      if (checkUserEmail !== 0) {
        const record = {
          success: false,
          msg: msg.msgEmailAlreadyExist,
        };
        return res.status(200).json(record);
      }
      const checkUserUniqueId = await CommenService.checkUserUniqueIdWithId(
        SITE_DB_NAME,
        employeeId,
        uniqueId
      );
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
        const employee = await CommenService.editEmployee(
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
          const userDetails = await CommenService.getUserDetails(
            SITE_DB_NAME,
            employee._id
          );
          let languageId = "0";
          if (userDetails !== "NA") {
            languageId = userDetails.languageId;
          }

          const siteURL = process.env.SITE_URL;
          const mailEmail = email;
          const mailName = name;

          const mailSubject = msg.mailSubjectUpdateEmployee[languageId];
          const mailHeading = msg.mailHeadingUpdateEmployee[languageId];
          const headerGreeting =
            msg.mailHeaderGreetingUpdateEmployee[languageId];
          const mailContents = msg.mailContentUpdateEmployee(
            siteURL,
            process.env.FOOTERBACKGROUND
          );
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
              const responce = await MailFunctions.mailSend(
                mailEmail,
                mailFromName,
                mailSubject,
                mailBody
              );
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
  },
];

const activeDeactiveEmployee = [
  //  validation
  body("employeeId")
    .trim()
    .exists()
    .withMessage(msg.msgEmployeeIdReqired)
    .notEmpty()
    .withMessage(msg.msgEmployeeIdReqired),
  body("activeFlag")
    .trim()
    .exists()
    .withMessage(msg.msgActiveFlagReqired)
    .notEmpty()
    .withMessage(msg.msgActiveFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { employeeId, activeFlag } = req.body;
      const checkEmployee = await CommenService.checkEmployee(
        SITE_DB_NAME,
        employeeId
      );
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
        const employeeStatus = await CommenService.activeDeactiveEmployee(
          SITE_DB_NAME,
          employeeId,
          activeDeactiveFlag
        );
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
  },
];
const manualPunchStatusEmployee = [
  //  validation
  body("employeeId")
    .trim()
    .exists()
    .withMessage(msg.msgEmployeeIdReqired)
    .notEmpty()
    .withMessage(msg.msgEmployeeIdReqired),
  body("manualPunch")
    .trim()
    .exists()
    .withMessage(msg.msgActiveFlagReqired)
    .notEmpty()
    .withMessage(msg.msgActiveFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { employeeId, manualPunch } = req.body;
      const checkEmployee = await CommenService.checkEmployee(
        SITE_DB_NAME,
        employeeId
      );
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
        const employeeStatus = await CommenService.manualPunchEmployee(
          SITE_DB_NAME,
          employeeId,
          manualPunchFlag
        );
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
  },
];

const deleteEmployee = [
  //  validation
  body("employeeId")
    .trim()
    .exists()
    .withMessage(msg.msgEmployeeIdReqired)
    .notEmpty()
    .withMessage(msg.msgEmployeeIdReqired),
  body("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { employeeId, deleteFlag } = req.body;

      const checkEmployee = await CommenService.checkEmployee(
        SITE_DB_NAME,
        employeeId
      );
      if (checkEmployee === 0) {
        const record = {
          success: false,
          msg: msg.msgEmployeeNotExist,
        };
        return res.status(200).json(record);
      }

      try {
        const employeeStatus = await CommenService.deleteEmployee(
          SITE_DB_NAME,
          employeeId,
          deleteFlag
        );
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
  },
];
const approveEmployee = [
  //  validation
  body("employeeId")
    .trim()
    .exists()
    .withMessage(msg.msgEmployeeIdReqired)
    .notEmpty()
    .withMessage(msg.msgEmployeeIdReqired),
  body("approveFlag")
    .trim()
    .exists()
    .withMessage(msg.msgApproveFlagReqired)
    .notEmpty()
    .withMessage(msg.msgApproveFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { employeeId, approveFlag } = req.body;

      const checkEmployee = await CommenService.checkEmployee(
        SITE_DB_NAME,
        employeeId
      );
      if (checkEmployee === 0) {
        const record = {
          success: false,
          msg: msg.msgEmployeeNotExist,
        };
        return res.status(200).json(record);
      }

      try {
        const employeeStatus = await CommenService.approveEmployee(
          SITE_DB_NAME,
          employeeId,
          approveFlag
        );
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
  },
];

const viewEmployee = [
  //  validation
  query("employeeId")
    .trim()
    .exists()
    .withMessage(msg.msgEmployeeIdReqired)
    .notEmpty()
    .withMessage(msg.msgEmployeeIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const { employeeId } = req.query;
      const checkEmployee = await CommenService.checkEmployeeOne(
        SITE_DB_NAME,
        employeeId
      );
      if (checkEmployee === 0) {
        const record = {
          success: false,
          msg: msg.msgEmployeeNotExist,
        };
        return res.status(200).json(record);
      }
      try {
        const employee = await CommenService.viewEmployee(
          SITE_DB_NAME,
          checkEmployee
        );
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
  },
];
const employees = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag } = req.query;

    try {
      const unitIds = CURRENT_USER?.unitId;
      if (!unitIds || unitIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist });
      }
      const employees = await CommenService.getEmployees(
        SITE_DB_NAME,
        unitIds,
        Number(deleteFlag)
      );
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
const unitEmployees = [
  query("unitId")
    .trim()
    .exists()
    .withMessage(msg.msgUnitIdReqired)
    .notEmpty()
    .withMessage(msg.msgUnitIdReqired),
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgDeleteFlagReqired)
    .notEmpty()
    .withMessage(msg.msgDeleteFlagReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { unitId, deleteFlag } = req.query;
    const checkUnit = await CommenService.checkUnitView(SITE_DB_NAME, unitId);
    if (checkUnit === 0) {
      const record = {
        success: false,
        msg: msg.msgUnitNotExist,
      };
      return res.status(200).json(record);
    }

    try {
      const unit = await CommenService.getUnitOne(SITE_DB_NAME, checkUnit._id);
      if (unit === "NA") {
        const record = {
          success: true,
          msg: msg.msgDataNotFound,
          data: { unit: "NA" },
        };
        return res.status(200).json(record);
      }
      const employees = await CommenService.getUnitEmployees(
        SITE_DB_NAME,
        checkUnit._id,
        Number(deleteFlag)
      );
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
//====================================== teams===========================
const teams = [
  query("deleteFlag")
    .trim()
    .exists()
    .withMessage(msg.msgUnitIdReqired)
    .notEmpty()
    .withMessage(msg.msgUnitIdReqired),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(200)
        .json({ success: false, msg: errors.array()[0].msg });
    }
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    const { deleteFlag } = req.query;
    try {
      const unitIds = CURRENT_USER?.unitId;
      if (!unitIds || unitIds?.length === 0) {
        return res
          .status(200)
          .json({ success: false, msg: msg.msgUnitNotExist });
      }

      const teams = await CommenService.getTeams(
        SITE_DB_NAME,
        unitIds,
        Number(deleteFlag)
      );

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
//====================================== File return ===========================
module.exports = {
  roles: async (req, res) => {
    try {
      const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
      const CURRENT_USER_ID = req?.CURRENT_USER_ID;
      const CURRENT_USER = req?.CURRENT_USER;
      if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
        const record = {
          success: false,
          msg: msg.msgDBNotIdentified,
          key: 4,
        };
        return res.status(200).json(record);
      }
      const roles = await CommenService.getRoles(SITE_DB_NAME);

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
  },
  ctcsp: async (req, res) => {
    const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
    const CURRENT_USER_ID = req?.CURRENT_USER_ID;
    const CURRENT_USER = req?.CURRENT_USER;
    if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
      const record = {
        success: false,
        msg: msg.msgDBNotIdentified,
        key: 4,
      };
      return res.status(200).json(record);
    }
    try {
      const ctcsp = await CommenService.getCTCSPByState(
        SITE_DB_NAME,
        req?.query?.stateName
      );

      if (ctcsp === "NA") {
        const record = {
          success: true,
          msg: msg.msgDataNotFound,
          data: { ctcsp: null },
        };
        return res.status(200).json(record);
      }
      const record = {
        success: true,
        msg: msg.msgDataFound,
        data: { ctcsp: ctcsp },
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
  holidaysByShiftId: [
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.msgDeleteFlagReqired)
      .notEmpty()
      .withMessage(msg.msgDeleteFlagReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
      const CURRENT_USER_ID = req?.CURRENT_USER_ID;
      const CURRENT_USER = req?.CURRENT_USER;
      if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
        const record = {
          success: false,
          msg: msg.msgDBNotIdentified,
          key: 4,
        };
        return res.status(200).json(record);
      }
      const { deleteFlag, shiftId } = req.query;
      try {
        const shiftCheck = await CommenService.shiftCheck(
          SITE_DB_NAME,
          shiftId
        );

        const shiftIds = [shiftCheck?._id];
        if (!shiftIds || shiftIds?.length === 0) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgUnitNotExist });
        }

        if (!Array.isArray(shiftIds) || !shiftIds || shiftIds?.length === 0) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgShiftNotExist });
        }

        const holidays = await CommenService.getHolidays(
          SITE_DB_NAME,
          shiftIds,
          Number(deleteFlag)
        );

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
        logger.error("Database error in Holiday", { error });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],
  holidaysTemp: [
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.msgDeleteFlagReqired)
      .notEmpty()
      .withMessage(msg.msgDeleteFlagReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
      const CURRENT_USER_ID = req?.CURRENT_USER_ID;
      const CURRENT_USER = req?.CURRENT_USER;
      const { deleteFlag } = req.query;
      if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
        const record = {
          success: false,
          msg: msg.msgDBNotIdentified,
          key: 4,
        };
        return res.status(200).json(record);
      }
      try {
        const pagination = {
          pageSize: parseInt(req.query.pageSize) || 10,
          pageNumber: parseInt(req.query.pageNumber) || 1,
        };
        const search = req.query.search || "";
        const holidays = await CommenService.getHolidaysTemp(
          SITE_DB_NAME,
          Number(deleteFlag),
          pagination,
          search
        );
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
        logger.error("Database error in HolidayTemp", { error });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],
  addHolidayTemp: [
    body("holidayName")
      .trim()
      .exists()
      .withMessage(msg.msgHolidayNameReqired)
      .notEmpty()
      .withMessage(msg.msgHolidayNameReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
      const CURRENT_USER_ID = req?.CURRENT_USER_ID;
      const CURRENT_USER = req?.CURRENT_USER;
      if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
        const record = {
          success: false,
          msg: msg.msgDBNotIdentified,
          key: 4,
        };
        return res.status(200).json(record);
      }
      try {
        const { holidayName, date, compOff } = req.body;
        const checkHolidayName = await CommenService.checkHolidayNameTemp(
          SITE_DB_NAME,
          holidayName
        );
        if (checkHolidayName !== 0) {
          const record = {
            success: false,
            msg: msg.msgHolidayExist,
          };
          return res.status(200).json(record);
        }

        try {
          let image = null;
          if (!req.file) {
            const record = {
              success: false,
              msg: msg.msgImageReqired,
              key: 4,
            };
            return res.status(200).json(record);
          }
          if ("key" in req.file) {
            const filename = req.file.key;
            image = filename;
          }

          const holiday = await CommenService.addHolidayTemp(
            SITE_DB_NAME,
            holidayName,
            image,
            date,
            compOff
          );
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
          logger.error("Database error in add hoilidayTemp", { error });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in add hoilidayTemp", { error });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],
  editHolidayTemp: [
    body("holidayId")
      .trim()
      .exists()
      .withMessage(msg.msgHolidayIdReqired)
      .notEmpty()
      .withMessage(msg.msgHolidayIdReqired),
    body("holidayName")
      .trim()
      .exists()
      .withMessage(msg.msgHolidayNameReqired)
      .notEmpty()
      .withMessage(msg.msgHolidayNameReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
      const CURRENT_USER_ID = req?.CURRENT_USER_ID;
      const CURRENT_USER = req?.CURRENT_USER;
      if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
        const record = {
          success: false,
          msg: msg.msgDBNotIdentified,
          key: 4,
        };
        return res.status(200).json(record);
      }
      try {
        const { holidayName, holidayId, date, compOff } = req.body;

        const checkHoliday = await CommenService.checkHolidayTemp(
          SITE_DB_NAME,
          holidayId
        );
        if (checkHoliday === 0) {
          const record = {
            success: false,
            msg: msg.msgHolidayNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const checkHolidayWithName =
            await CommenService.checkHolidayWithNameTemp(
              SITE_DB_NAME,
              holidayId,
              holidayName
            );
          if (checkHolidayWithName !== 0) {
            const record = {
              success: false,
              msg: msg.msgHolidayExist,
            };
            return res.status(200).json(record);
          }

          try {
            let image = null;

            if (!req.file) {
              image = checkHoliday?.image;
            } else if ("key" in req.file) {
              const filename = req.file.key;
              image = filename;
            } else {
              image = null;
            }
            let removeFiles = [];
            if (req.body.removeFiles) {
              try {
                removeFiles =
                  typeof req.body.removeFiles === "string"
                    ? JSON.parse(req.body.removeFiles) // agar JSON string bheji ho
                    : req.body.removeFiles; // agar array bheja ho
              } catch (e) {
                removeFiles = [req.body.removeFiles]; // fallback
              }
            }
            const holidayStatus = await CommenService.editHolidayTemp(
              SITE_DB_NAME,
              holidayName,
              holidayId,
              image,
              date,
              compOff,
              removeFiles
            );
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
            logger.error("Database error in editHolidayTemp", { error });
            const record = {
              success: false,
              msg: msg.msgServerError,
              key: error,
            };
            return res.status(500).json(record);
          }
        } catch (error) {
          logger.error("Database error in editHolidayTemp", { error });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in editHolidayTemp", { error });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],
  deleteHolidayTemp: [
    //  validation
    query("holidayId")
      .trim()
      .exists()
      .withMessage(msg.msgHolidayIdReqired)
      .notEmpty()
      .withMessage(msg.msgHolidayIdReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
      const CURRENT_USER_ID = req?.CURRENT_USER_ID;
      const CURRENT_USER = req?.CURRENT_USER;
      if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
        const record = {
          success: false,
          msg: msg.msgDBNotIdentified,
          key: 4,
        };
        return res.status(200).json(record);
      }
      try {
        const { holidayId } = req.query;

        const checkHoliday = await CommenService.checkHolidayTemp(
          SITE_DB_NAME,
          holidayId
        );
        if (checkHoliday === 0) {
          const record = {
            success: false,
            msg: msg.msgHolidayNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const holidayStatus = await CommenService.deleteHolidayTemp(
            SITE_DB_NAME,
            holidayId
          );
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
            };
            return res.status(200).json(record);
          }
        } catch (error) {
          logger.error("Database error in deleteHolidayTemp", { error });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in deleteHolidayTemp", { error });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],
  activeDeactiveHolidayTemp: [
    //  validation
    body("holidayId")
      .trim()
      .exists()
      .withMessage(msg.msgHolidayIdReqired)
      .notEmpty()
      .withMessage(msg.msgHolidayIdReqired),
    body("activeFlag")
      .trim()
      .exists()
      .withMessage(msg.msgActiveFlagReqired)
      .notEmpty()
      .withMessage(msg.msgActiveFlagReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
      const CURRENT_USER_ID = req?.CURRENT_USER_ID;
      const CURRENT_USER = req?.CURRENT_USER;
      if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
        const record = {
          success: false,
          msg: msg.msgDBNotIdentified,
          key: 4,
        };
        return res.status(200).json(record);
      }
      try {
        const { holidayId, activeFlag } = req.body;
        const checkHoliday = await CommenService.checkHolidayTemp(
          SITE_DB_NAME,
          holidayId
        );
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
          const holidayStatus = await CommenService.activeDeactiveHolidayTemp(
            SITE_DB_NAME,
            holidayId,
            activeDeactiveFlag
          );
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
          logger.error("Database error in Holiday", { error });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in Holiday", { error });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],

  holidays: [
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.msgDeleteFlagReqired)
      .notEmpty()
      .withMessage(msg.msgDeleteFlagReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
      const CURRENT_USER_ID = req?.CURRENT_USER_ID;
      const CURRENT_USER = req?.CURRENT_USER;
      if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
        const record = {
          success: false,
          msg: msg.msgDBNotIdentified,
          key: 4,
        };
        return res.status(200).json(record);
      }
      const { deleteFlag } = req.query;
      try {
        const unitIds = CURRENT_USER?.unitId;
        if (!unitIds || unitIds?.length === 0) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgUnitNotExist });
        }
        const shiftId = CURRENT_USER?.shiftId;
        const shiftIds = [shiftId];
        if (!shiftIds || shiftIds?.length === 0) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgUnitNotExist });
        }

        if (!Array.isArray(shiftIds) || !shiftIds || shiftIds?.length === 0) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgShiftNotExist });
        }
        const holidays = await CommenService.getHolidays(
          SITE_DB_NAME,
          shiftIds,
          Number(deleteFlag)
        );

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
        logger.error("Database error in Holiday", { error });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],
  addHolidayBulk: [
    // ✅ Validate request body
    body("holidayList")
      .isArray({ min: 1 })
      .withMessage(["At least one holiday record is required"]),

    // ✅ Validate each object inside holidayList
    body("holidayList.*.holidayName")
      .trim()
      .exists()
      .withMessage(msg.msgHolidayNameReqired)
      .notEmpty()
      .withMessage(msg.msgHolidayNameReqired),

    body("holidayList.*.shiftId")
      .trim()
      .exists()
      .withMessage(msg.msgShiftIdReqired)
      .notEmpty()
      .withMessage(msg.msgShiftIdReqired),

    body("holidayList.*.date")
      .trim()
      .exists()
      .withMessage(msg.msgDateReqired)
      .notEmpty()
      .withMessage(msg.msgDateReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
      const CURRENT_USER_ID = req?.CURRENT_USER_ID;
      const CURRENT_USER = req?.CURRENT_USER;
      if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
        const record = {
          success: false,
          msg: msg.msgDBNotIdentified,
          key: 4,
        };
        return res.status(200).json(record);
      }

      const holidays = req?.body?.holidayList;

      try {
        const result = await CommenService.addHolidayBulk(
          SITE_DB_NAME,
          holidays
        );

        if (
          result &&
          (result?.insertedCount > 0 || result?.modifiedCount > 0)
        ) {
          return res.status(200).json({
            success: true,
            msg: ["Bulk holiday operation successful"],
            data: result,
          });
        } else {
          return res.status(200).json({
            success: false,
            msg: ["No records inserted or updated"],
          });
        }
      } catch (error) {
        logger.error("Error in addHolidayBulk", { error });
        return res.status(500).json({
          success: false,
          msg: msg.msgServerError,
          error: error.message,
        });
      }
    },
  ],
  holidayCompoffStatus: [
    //  validation
    body("holidayId")
      .trim()
      .exists()
      .withMessage(msg.msgHolidayIdReqired)
      .notEmpty()
      .withMessage(msg.msgHolidayIdReqired),
    body("compOff")
      .trim()
      .exists()
      .withMessage(msg.msgDeleteFlagReqired)
      .notEmpty()
      .withMessage(msg.msgDeleteFlagReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
      const CURRENT_USER_ID = req?.CURRENT_USER_ID;
      const CURRENT_USER = req?.CURRENT_USER;
      if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
        const record = {
          success: false,
          msg: msg.msgDBNotIdentified,
          key: 4,
        };
        return res.status(200).json(record);
      }
      try {
        const { holidayId, compOff } = req.body;

        const checkHoliday = await CommenService.checkHoliday(
          SITE_DB_NAME,
          holidayId
        );
        if (checkHoliday === 0) {
          const record = {
            success: false,
            msg: msg.msgHolidayNotExist,
          };
          return res.status(200).json(record);
        }

        try {
          const holidayStatus = await CommenService.holidayCompoffStatus(
            SITE_DB_NAME,
            holidayId,
            compOff
          );
          if (holidayStatus === 0) {
            const record = {
              success: false,
              msg: msg.msgHolidayDeleteError,
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
          logger.error("Database error in Holiday", { error });
          const record = {
            success: false,
            msg: msg.msgServerError,
            key: error,
          };
          return res.status(500).json(record);
        }
      } catch (error) {
        logger.error("Database error in Holiday", { error });
        const record = {
          success: false,
          msg: msg.msgServerError,
          key: error,
        };
        return res.status(500).json(record);
      }
    },
  ],

  shiftsData: [
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.msgDeleteFlagReqired)
      .notEmpty()
      .withMessage(msg.msgDeleteFlagReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
      const CURRENT_USER_ID = req?.CURRENT_USER_ID;
      const CURRENT_USER = req?.CURRENT_USER;
      if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
        const record = {
          success: false,
          msg: msg.msgDBNotIdentified,
          key: 4,
        };
        return res.status(200).json(record);
      }
      let unitIds = CURRENT_USER?.unitId;
      const roleName = CURRENT_USER?.roleName;
      if (roleName !== "Site-Owner") {
        if (!unitIds || unitIds?.length === 0) {
          return res
            .status(200)
            .json({ success: false, msg: msg.msgUnitNotExist });
        }
      } else {
        unitIds = [];
      }
      const { deleteFlag } = req.query;

      try {
        const shifts = await CommenService.shiftsDataByUnits(
          SITE_DB_NAME,
          unitIds,
          Number(deleteFlag)
        );
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
  ],
  unitDepartments: [
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.msgUnitIdReqired)
      .notEmpty()
      .withMessage(msg.msgUnitIdReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
      const CURRENT_USER_ID = req?.CURRENT_USER_ID;
      const CURRENT_USER = req?.CURRENT_USER;
      if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
        const record = {
          success: false,
          msg: msg.msgDBNotIdentified,
          key: 4,
        };
        return res.status(200).json(record);
      }
      const { deleteFlag } = req.query;
      try {
        const departments = await CommenService.getUnitDepartments(
          SITE_DB_NAME,
          Number(deleteFlag)
        );

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
  ],
  unitTeams: [
    query("unitId")
      .trim()
      .exists()
      .withMessage(msg.msgUnitIdReqired)
      .notEmpty()
      .withMessage(msg.msgUnitIdReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
      const CURRENT_USER_ID = req?.CURRENT_USER_ID;
      const CURRENT_USER = req?.CURRENT_USER;
      if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
        const record = {
          success: false,
          msg: msg.msgDBNotIdentified,
          key: 4,
        };
        return res.status(200).json(record);
      }

      const { unitId } = req.query;
      try {
        const checkUnit = await CommenService.checkUnitView(
          SITE_DB_NAME,
          unitId
        );
        if (checkUnit === 0) {
          const record = {
            success: false,
            msg: msg.msgUnitNotExist,
          };
          return res.status(200).json(record);
        }
        const teams = await CommenService.getUnitTeams(
          SITE_DB_NAME,
          checkUnit._id
        );

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
  ],
  getReportingManagerAll: [
    query("unitId")
      .trim()
      .exists()
      .withMessage(msg.msgUnitIdReqired)
      .notEmpty()
      .withMessage(msg.msgUnitIdReqired),
    query("deleteFlag")
      .trim()
      .exists()
      .withMessage(msg.msgDeleteFlagReqired)
      .notEmpty()
      .withMessage(msg.msgDeleteFlagReqired),
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res
          .status(200)
          .json({ success: false, msg: errors.array()[0].msg });
      }
      const SITE_DB_NAME = req?.CURRENT_SITE_DB_NAME;
      const CURRENT_USER_ID = req?.CURRENT_USER_ID;
      const CURRENT_USER = req?.CURRENT_USER;
      if (!SITE_DB_NAME || !CURRENT_USER_ID || !CURRENT_USER) {
        const record = {
          success: false,
          msg: msg.msgDBNotIdentified,
          key: 4,
        };
        return res.status(200).json(record);
      }

      const { unitId, deleteFlag } = req.query;
      try {
        const employees = await CommenService.getReportingManagerAll(
          SITE_DB_NAME,
          unitId,
          Number(deleteFlag)
        );
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
  ],

  attendancePunch,
  attendanceDaily,
  myattendance,
  attendances,
  exportAttendance,
  exportAttendanceBreak,
  exportAttendanceFinal,
  exportDailyAttendance,
  exportAttendanceLog,
  getUsersAll,
  leaveApply,
  editApply,
  leaves,
  myLeaves,
  deleteLeave,
  leaveApproveRejectStatus,
  cancelLeave,
  addRegularizationRequest,
  editRegularizationRequest,
  cancelRegularizationRequest,
  approveRejectStatusRegularizationRequest,
  myRegularizations,
  regularizationRequests,
  addReimbursementRequest,
  editReimbursementRequest,
  cancelReimbursementRequest,
  approveRejectStatusReimbursementRequest,
  updatePayStatusReimbursementRequest,
  myReimbursements,
  reimbursementRequests,
  addIncentiveRequest,
  editIncentiveRequest,
  cancelIncentiveRequest,
  approveRejectStatusIncentiveRequest,
  updatePayStatusIncentiveRequest,
  myIncentives,
  incentiveRequests,
  addCompoffRequest,
  editCompoffRequest,
  cancelCompoffRequest,
  approveRejectStatusCompoffRequest,
  updatePayStatusCompoffRequest,
  myCompoffs,
  compoffRequests,
  deleteCompoff,

  shiftsByUnit,
  incentivePolicys,
  shiftIncentivePolicys,
  addShiftIncentivePolicy,

  assignPaidLeavePolicy,
  assignPaidLeave,

  companies,
  weekDays,
  addUnit,
  editUnit,
  activeDeactiveUnit,
  deleteUnit,
  units,
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
  teams,
  deleteReimbursement,
  deleteIncentive,
  deleteRegularization,
  leavesForDashboard,
  sendPunchMissingMail,
  permissions,
  permission,
  dashboard,
  attAdminRequest,
  getDeviceStatuses,
  editDevice,
  activeDeactiveDevice,
  myNotification,
  myNotificationCount,
  deleteNotification,
  readNotification,
  clearNotification,
  getNotificationEmployeeAll,
  sendAnnouncement,
  uploadFile,
  registrations,
  viewRegistration,
  addRegistration,
  updateRegistration,
  editRegistration,
  uploadEmployeeCsv,
  updateEmployeeCsv,
  validateEmployee,
  redirectPage,
  exportAttendanceFinalForProccess,
  calculationProccessFunction,
  processingDataMonthly,
  processingData,
  addProccess,
  uploadProccessExcel,
};
