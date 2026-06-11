const express = require("express");
const router = express.Router();

const CommenController = require("../../controllers/hrControllers/commenController");
const Middelwares = require("../../middelwares/authMiddelware");
const uploadMiddleware = require("../../middelwares/uploadMiddleware");
const { uploadCSVMiddleware, uploadDataCsv } = require("../../middelwares/uploadCSVMiddleware");
const { uploadExcelMiddleware, uploadDataExcel } = require("../../middelwares/uploadExcelMiddleware");
const uploadOnS3Middleware = require("../../middelwares/uploadOnS3Middleware");
// const deleteOnS3Middleware = require("../../middelwares/deleteOnS3Middleware");

router.get("/companies", Middelwares.originAuth, Middelwares.siteAuth, CommenController.companies);
router.get("/roles", Middelwares.originAuth, Middelwares.siteAuth, CommenController.roles);
router.get("/ctcsp", Middelwares.originAuth, Middelwares.siteAuth, CommenController.ctcsp);

//unit-flow-apis
router.get("/units", Middelwares.originAuth, Middelwares.siteAuth, CommenController.units);
router.delete("/delete-unit", Middelwares.originAuth, Middelwares.siteAuth, CommenController.deleteUnit);
router.put("/active-deactive-unit", Middelwares.originAuth, Middelwares.siteAuth, CommenController.activeDeactiveUnit);
router.post("/add-unit", Middelwares.originAuth, Middelwares.siteAuth, CommenController.addUnit);
router.put("/edit-unit", Middelwares.originAuth, Middelwares.siteAuth, CommenController.editUnit);
router.delete("/delete-shift", Middelwares.originAuth, Middelwares.siteAuth, CommenController.deleteShift);
router.get("/unit-shifts", Middelwares.originAuth, Middelwares.siteAuth, CommenController.unitShifts);
router.get("/unitDepartments", Middelwares.originAuth, Middelwares.siteAuth, CommenController.unitDepartments);
router.get("/unitTeams", Middelwares.originAuth, Middelwares.siteAuth, CommenController.unitTeams);
router.get("/unitEmployees", Middelwares.originAuth, Middelwares.siteAuth, CommenController.unitEmployees);
//shift-flow-apis
router.put("/active-deactive-shift", Middelwares.originAuth, Middelwares.siteAuth, CommenController.activeDeactiveShift);
router.post("/add-shift", Middelwares.originAuth, Middelwares.siteAuth, CommenController.addShift);
router.put("/edit-shift", Middelwares.originAuth, Middelwares.siteAuth, CommenController.editShift);
router.get("/shifts", Middelwares.originAuth, Middelwares.siteAuth, CommenController.shifts);
router.get("/shift", Middelwares.originAuth, Middelwares.siteAuth, CommenController.getOneShift);
router.get("/shiftsData", Middelwares.originAuth, Middelwares.siteAuth, CommenController.shiftsData);
//departments-flow-apis
router.get("/departments", Middelwares.originAuth, Middelwares.siteAuth, CommenController.departments);
router.delete("/delete-department", Middelwares.originAuth, Middelwares.siteAuth, CommenController.deleteDepartment);
router.put("/active-deactive-department", Middelwares.originAuth, Middelwares.siteAuth, CommenController.activeDeactiveDepartment);
router.post("/add-department", Middelwares.originAuth, Middelwares.siteAuth, CommenController.addDepartment);
router.put("/edit-department", Middelwares.originAuth, Middelwares.siteAuth, CommenController.editDepartment);
router.get("/week-days", Middelwares.originAuth, Middelwares.siteAuth, CommenController.weekDays);
//holiday-flow-apis
router.get("/dashboard", Middelwares.originAuth, Middelwares.siteAuth, CommenController.dashboard);
router.post("/holiday-compoff-status", Middelwares.originAuth, Middelwares.siteAuth, CommenController.holidayCompoffStatus);
router.post("/add-holiday-bulk", Middelwares.originAuth, Middelwares.siteAuth, CommenController.addHolidayBulk);
router.get("/holidays", Middelwares.originAuth, Middelwares.siteAuth, CommenController.holidays);
router.get("/holidays-by-shiftId", Middelwares.originAuth, Middelwares.siteAuth, CommenController.holidaysByShiftId);
//temp-holiday-flow-apis
router.post("/add-holiday-temp", Middelwares.originAuth, Middelwares.siteAuth, uploadOnS3Middleware.single("image"), CommenController.addHolidayTemp);
router.put("/edit-holiday-temp", Middelwares.originAuth, Middelwares.siteAuth, uploadOnS3Middleware.single("image"), CommenController.editHolidayTemp);
router.delete("/delete-holiday-temp", Middelwares.originAuth, Middelwares.siteAuth, CommenController.deleteHolidayTemp);
router.get("/all-holidays-temp", Middelwares.originAuth, Middelwares.siteAuth, CommenController.holidaysTemp);
router.put("/active-deactive-holiday-temp", Middelwares.originAuth, Middelwares.siteAuth, CommenController.activeDeactiveHolidayTemp);
//leave-flow-apis
router.post("/add-leave-apply", Middelwares.originAuth, Middelwares.siteAuth, uploadOnS3Middleware.array("documents", 10), CommenController.leaveApply);
router.put("/edit-leave-apply", Middelwares.originAuth, Middelwares.siteAuth, uploadOnS3Middleware.array("documents", 10), CommenController.editApply);
router.get("/my-leaves", Middelwares.originAuth, Middelwares.siteAuth, CommenController.myLeaves);
router.put("/cancel-leave", Middelwares.originAuth, Middelwares.siteAuth, CommenController.cancelLeave);
router.put("/approve-reject-leave", Middelwares.originAuth, Middelwares.siteAuth, CommenController.leaveApproveRejectStatus);
router.get("/leaves", Middelwares.originAuth, Middelwares.siteAuth, CommenController.leaves);
router.delete("/delete-leave", Middelwares.originAuth, Middelwares.siteAuth, CommenController.deleteLeave);
//attendance-flow-apis i
router.post("/attendance-punch", Middelwares.originAuth, Middelwares.siteAuth, CommenController.attendancePunch);
router.post("/attendance-punch-app", Middelwares.originAuth, Middelwares.siteAuth, uploadOnS3Middleware.single("image"), CommenController.attendancePunch);
router.get("/attendance-daily", Middelwares.originAuth, Middelwares.siteAuth, CommenController.attendanceDaily);
router.get("/my-attendances", Middelwares.originAuth, Middelwares.siteAuth, CommenController.myattendance);
router.get("/attendances", Middelwares.originAuth, Middelwares.siteAuth, CommenController.attendances);
router.post("/attendance-att-admin-request", Middelwares.originAuth, Middelwares.siteAuth, CommenController.attAdminRequest);
router.get("/export-attendance-final", Middelwares.originAuth, Middelwares.siteAuth, CommenController.exportAttendanceFinal);
router.get("/export-attendance", Middelwares.originAuth, Middelwares.siteAuth, CommenController.exportAttendance);
router.get("/export-attendance-break", Middelwares.originAuth, Middelwares.siteAuth, CommenController.exportAttendanceBreak);
router.get("/export-export-attendance-log", Middelwares.originAuth, Middelwares.siteAuth, CommenController.exportAttendanceLog);
router.get("/export/dailyAttendance", Middelwares.originAuth, Middelwares.siteAuth, CommenController.exportDailyAttendance);
//compoff-flow-apis
router.post("/add-compoff-request", Middelwares.originAuth, Middelwares.siteAuth, uploadOnS3Middleware.array("documents", 10), CommenController.addCompoffRequest);
router.put("/edit-compoff-request", Middelwares.originAuth, Middelwares.siteAuth, uploadOnS3Middleware.array("documents", 10), CommenController.editCompoffRequest);
router.put("/cancel-compoff-request", Middelwares.originAuth, Middelwares.siteAuth, CommenController.cancelCompoffRequest);
router.put("/approve-reject-status-compoff-request", Middelwares.originAuth, Middelwares.siteAuth, CommenController.approveRejectStatusCompoffRequest);
router.put("/update-pay-status-compoff-request", Middelwares.originAuth, Middelwares.siteAuth, CommenController.updatePayStatusCompoffRequest);
router.get("/my-compoff-requests", Middelwares.originAuth, Middelwares.siteAuth, CommenController.myCompoffs);
router.get("/compoff-requests", Middelwares.originAuth, Middelwares.siteAuth, CommenController.compoffRequests);
router.delete("/delete-compoff", Middelwares.originAuth, Middelwares.siteAuth, CommenController.deleteCompoff);
//reimbursement-flow-apis
router.post("/add-reimbursement-request", Middelwares.originAuth, Middelwares.siteAuth, uploadOnS3Middleware.array("documents", 10), CommenController.addReimbursementRequest);
router.put("/edit-reimbursement-request", Middelwares.originAuth, Middelwares.siteAuth, uploadOnS3Middleware.array("documents", 10), CommenController.editReimbursementRequest);
router.put("/cancel-reimbursement-request", Middelwares.originAuth, Middelwares.siteAuth, CommenController.cancelReimbursementRequest);
router.put("/approve-reject-status-reimbursement-request", Middelwares.originAuth, Middelwares.siteAuth, CommenController.approveRejectStatusReimbursementRequest);
router.put("/update-pay-status-reimbursement-request", Middelwares.originAuth, Middelwares.siteAuth, CommenController.updatePayStatusReimbursementRequest);
router.get("/my-reimbursement-requests", Middelwares.originAuth, Middelwares.siteAuth, CommenController.myReimbursements);
router.get("/reimbursement-requests", Middelwares.originAuth, Middelwares.siteAuth, CommenController.reimbursementRequests);
router.delete("/delete-reimbursement", Middelwares.originAuth, Middelwares.siteAuth, CommenController.deleteReimbursement);
//incentive-policys-flow-api
router.get("/incentive-policys", Middelwares.originAuth, Middelwares.siteAuth, CommenController.incentivePolicys);
router.post("/add-shift-incentive-policy", Middelwares.originAuth, Middelwares.siteAuth, CommenController.addShiftIncentivePolicy);
router.get("/shift-incentive-policys", Middelwares.originAuth, Middelwares.siteAuth, CommenController.shiftIncentivePolicys);
// incentive-flow-apis
router.post("/add-incentive-request", Middelwares.originAuth, Middelwares.siteAuth, uploadOnS3Middleware.array("documents", 10), CommenController.addIncentiveRequest);
router.put("/edit-incentive-request", Middelwares.originAuth, Middelwares.siteAuth, uploadOnS3Middleware.array("documents", 10), CommenController.editIncentiveRequest);
router.put("/cancel-incentive-request", Middelwares.originAuth, Middelwares.siteAuth, CommenController.cancelIncentiveRequest);
router.put("/approve-reject-status-incentive-request", Middelwares.originAuth, Middelwares.siteAuth, CommenController.approveRejectStatusIncentiveRequest);
router.put("/update-pay-status-incentive-request", Middelwares.originAuth, Middelwares.siteAuth, CommenController.updatePayStatusIncentiveRequest);
router.get("/my-incentive-requests", Middelwares.originAuth, Middelwares.siteAuth, CommenController.myIncentives);
router.get("/incentive-requests", Middelwares.originAuth, Middelwares.siteAuth, CommenController.incentiveRequests);
router.delete("/delete-incentive", Middelwares.originAuth, Middelwares.siteAuth, CommenController.deleteIncentive);
// regularization-api-flow
router.post("/add-regularization-request", Middelwares.originAuth, Middelwares.siteAuth, uploadOnS3Middleware.array("documents", 10), CommenController.addRegularizationRequest);
router.put("/edit-regularization-request", Middelwares.originAuth, Middelwares.siteAuth, uploadOnS3Middleware.array("documents", 10), CommenController.editRegularizationRequest);
router.put("/cancel-regularization-request", Middelwares.originAuth, Middelwares.siteAuth, CommenController.cancelRegularizationRequest);
router.put("/approve-reject-status-regularization-request", Middelwares.originAuth, Middelwares.siteAuth, CommenController.approveRejectStatusRegularizationRequest);
router.get("/my-regularization-requests", Middelwares.originAuth, Middelwares.siteAuth, CommenController.myRegularizations);
router.get("/regularization-requests", Middelwares.originAuth, Middelwares.siteAuth, CommenController.regularizationRequests);
router.delete("/delete-regularization", Middelwares.originAuth, Middelwares.siteAuth, CommenController.deleteRegularization);

router.get("/getUsersAll", Middelwares.originAuth, Middelwares.siteAuth, CommenController.getUsersAll);

router.get("/getUsersAll", Middelwares.originAuth, Middelwares.siteAuth, CommenController.getUsersAll);

router.get("/registration", Middelwares.originAuth, CommenController.viewRegistration);
router.post("/updateRegistration", Middelwares.originAuth, CommenController.updateRegistration);

router.get("/myNotification", Middelwares.originAuth, Middelwares.siteAuth, CommenController.myNotification);
router.get("/myNotificationCount", Middelwares.originAuth, Middelwares.siteAuth, CommenController.myNotificationCount);
router.post("/deleteNotification", Middelwares.originAuth, Middelwares.siteAuth, CommenController.deleteNotification);
router.post("/readNotification", Middelwares.originAuth, Middelwares.siteAuth, CommenController.readNotification);
router.post("/clearNotification", Middelwares.originAuth, Middelwares.siteAuth, CommenController.clearNotification);
router.get("/getNotificationEmployeeAll", Middelwares.originAuth, Middelwares.siteAuth, CommenController.getNotificationEmployeeAll);
router.post("/sendAnnouncement", Middelwares.originAuth, Middelwares.siteAuth, CommenController.sendAnnouncement);

router.post("/addEmployee", Middelwares.originAuth, Middelwares.siteAuth, CommenController.addEmployee);
router.post("/editEmployee", Middelwares.originAuth, Middelwares.siteAuth, CommenController.editEmployee);
router.post("/deleteEmployee", Middelwares.originAuth, Middelwares.siteAuth, CommenController.deleteEmployee);
router.post("/approveEmployee", Middelwares.originAuth, Middelwares.siteAuth, CommenController.approveEmployee);
router.post("/activeDeactiveEmployee", Middelwares.originAuth, Middelwares.siteAuth, CommenController.activeDeactiveEmployee);
router.post("/manualPunchStatusEmployee", Middelwares.originAuth, Middelwares.siteAuth, CommenController.manualPunchStatusEmployee);
router.get("/employees", Middelwares.originAuth, Middelwares.siteAuth, CommenController.employees);
router.get("/employee", Middelwares.originAuth, Middelwares.siteAuth, CommenController.viewEmployee);
router.get("/teams", Middelwares.originAuth, Middelwares.siteAuth, CommenController.teams);
router.get("/permission", Middelwares.originAuth, Middelwares.siteAuth, CommenController.permission);

router.post("/custom", Middelwares.getAppAuth);
router.post("/proccess", Middelwares.appAuth, CommenController.processingData);
router.post("/addProccess", Middelwares.appAuth, CommenController.addProccess);
router.post("/uploadProccessExcel", Middelwares.appAuth, uploadExcelMiddleware.single("file"), uploadDataExcel, CommenController.uploadProccessExcel);
router.post("/monthlyProccesss", Middelwares.appAuth, CommenController.processingDataMonthly);

router.get("/redirect/:id", CommenController.redirectPage, async (req, res) => {
  const { id } = req.params;
  const { type } = req.query; // ✅ fixed — .type हटाया

  // Default (Registration)
  let pageTitle = "Complete Registration | Task Source HRMS";
  let heading = "Complete Your Registration";
  let subText = "Would you like to continue on the App or Website?";
  let appScheme = `hrmsapp://registration/${id}`;
  let webLink = `https://tshrms.com/registration/${id}`;

  // ✅ If "forgot" type
  if (type === "forgot") {
    pageTitle = "Reset Your Password | Task Source HRMS";
    heading = "Forgot Your Password?";
    subText = "You can reset your password using the App or Website.";
    appScheme = `hrmsapp://forgot-password/${id}`;
    webLink = `https://tshrms.com/forgot-password/${id}`;
  }

  // Render EJS view
  res.render("choosePlatform", {
    pageTitle,
    heading,
    subText,
    appScheme,
    androidStore: "https://play.google.com/store/apps/details?id=com.hrmsapp",
    iosStore: "https://apps.apple.com/in/app/hrmsapp/id1234567890",
    webLink,
    backgroundColor: "#f8f9fb",
    textColor: "#333",
    headingColor: "#333",
    buttonColor: "#007bff",
    buttonHover: "#0056b3",
  });
});
router.use((req, res, next) => {
  res.status(504).json({ success: false, msg: ["Commen Invalid Routes!"] });
});

module.exports = router;
