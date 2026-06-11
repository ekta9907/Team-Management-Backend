const express = require("express");
const router = express.Router();

const Middelwares = require("../../middelwares/hrAuthMiddelware");
const AdminController = require("../../controllers/hrControllers/adminController");
// ================================================= super admin route ===============================
router.get("/dashboard", Middelwares.adminAuth, AdminController.dashboard);
router.get("/units", Middelwares.auth, AdminController.units);
router.post("/deleteUnit", Middelwares.adminAuth, AdminController.deleteUnit);
router.post("/activeDeactiveUnit", Middelwares.adminAuth, AdminController.activeDeactiveUnit);
router.post("/addUnit", Middelwares.adminAuth, AdminController.addUnit);
router.post("/editUnit", Middelwares.adminAuth, AdminController.editUnit);
router.post("/deleteShift", Middelwares.adminAuth, AdminController.deleteShift);
router.post("/activeDeactiveShift", Middelwares.adminAuth, AdminController.activeDeactiveShift);
router.post("/addShift", Middelwares.adminAuth, AdminController.addShift);
router.post("/editShift", Middelwares.adminAuth, AdminController.editShift);
router.get("/shifts", Middelwares.adminAuth, AdminController.shifts);
router.get("/unitShifts", Middelwares.auth, AdminController.unitShifts);
router.get("/shift", Middelwares.adminAuth, AdminController.getOneShift);

router.get("/companies", Middelwares.adminAuth, AdminController.companies);
router.get("/departments", Middelwares.adminAuth, AdminController.departments);
router.post("/deleteDepartment", Middelwares.adminAuth, AdminController.deleteDepartment);
router.post("/activeDeactiveDepartment", Middelwares.adminAuth, AdminController.activeDeactiveDepartment);
router.post("/addDepartment", Middelwares.adminAuth, AdminController.addDepartment);
router.post("/editDepartment", Middelwares.adminAuth, AdminController.editDepartment);
router.get("/unitDepartments", Middelwares.auth, AdminController.unitDepartments);
router.get("/roles", Middelwares.auth, AdminController.roles);
router.get("/unitTeams", Middelwares.auth, AdminController.unitTeams);

router.get("/weekDays", Middelwares.auth, AdminController.weekDays);
router.post("/addEmployee", Middelwares.auth, AdminController.addEmployee);
router.post("/editEmployee", Middelwares.auth, AdminController.editEmployee);
router.post("/deleteEmployee", Middelwares.auth, AdminController.deleteEmployee);
router.post("/approveEmployee", Middelwares.auth, AdminController.approveEmployee);
router.post("/activeDeactiveEmployee", Middelwares.auth, AdminController.activeDeactiveEmployee);
router.post("/manualPunchStatusEmployee", Middelwares.auth, AdminController.manualPunchStatusEmployee);
router.get("/employees", Middelwares.auth, AdminController.employees);
router.get("/employee", Middelwares.auth, AdminController.viewEmployee);
router.get("/unitEmployees", Middelwares.auth, AdminController.unitEmployees);
router.get("/getReportingManagerAll", Middelwares.auth, AdminController.getReportingManagerAll);
router.get("/teams", Middelwares.adminAuth, AdminController.teams);
router.post("/deleteTeam", Middelwares.adminAuth, AdminController.deleteTeam);
router.post("/activeDeactiveTeam", Middelwares.adminAuth, AdminController.activeDeactiveTeam);
router.post("/addTeam", Middelwares.adminAuth, AdminController.addTeam);
router.post("/editTeam", Middelwares.adminAuth, AdminController.editTeam);
router.post("/deleteHoliday", Middelwares.adminAuth, AdminController.deleteHoliday);
router.post("/activeDeactiveHoliday", Middelwares.adminAuth, AdminController.activeDeactiveHoliday);
router.post("/addHoliday", Middelwares.adminAuth, AdminController.addHoliday);
router.post("/editHoliday", Middelwares.adminAuth, AdminController.editHoliday);
router.get("/holidays", Middelwares.adminAuth, AdminController.holidays);
router.post("/editPermission", Middelwares.adminAuth, AdminController.editPermission);
router.get("/permissions", Middelwares.auth, AdminController.permissions);
router.get("/permission", Middelwares.adminAuth, AdminController.permission);
// ================================================= super admin route ===============================
router.use((req, res, next) => {
  res.status(504).json({ success: false, msg: ["Admin Invalid Routes!"] });
});

module.exports = router;
