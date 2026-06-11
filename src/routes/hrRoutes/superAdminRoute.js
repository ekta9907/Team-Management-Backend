const express = require("express");
const router = express.Router();

const Middelwares = require("../../middelwares/hrAuthMiddelware");
const SuperAdminController = require("../../controllers/hrControllers/superAdminController");
// ================================================= super admin route ===============================
router.get("/dashboard", Middelwares.superAdminAuth, SuperAdminController.dashboard);
router.get("/units", Middelwares.superAdminAuth, SuperAdminController.units);
router.post("/deleteUnit", Middelwares.superAdminAuth, SuperAdminController.deleteUnit);
router.post("/activeDeactiveUnit", Middelwares.superAdminAuth, SuperAdminController.activeDeactiveUnit);
router.post("/addUnit", Middelwares.superAdminAuth, SuperAdminController.addUnit);
router.post("/editUnit", Middelwares.superAdminAuth, SuperAdminController.editUnit);
router.get("/companies", Middelwares.superAdminAuth, SuperAdminController.companies);
router.get("/departments", Middelwares.superAdminAuth, SuperAdminController.departments);
router.post("/deleteDepartment", Middelwares.superAdminAuth, SuperAdminController.deleteDepartment);
router.post("/activeDeactiveDepartment", Middelwares.superAdminAuth, SuperAdminController.activeDeactiveDepartment);
router.post("/addDepartment", Middelwares.superAdminAuth, SuperAdminController.addDepartment);
router.post("/editDepartment", Middelwares.superAdminAuth, SuperAdminController.editDepartment);
router.get("/unitDepartments", Middelwares.superAdminAuth, SuperAdminController.unitDepartments);
router.get("/roles", Middelwares.superAdminAuth, SuperAdminController.roles);
router.get("/unitTeams", Middelwares.superAdminAuth, SuperAdminController.unitTeams);
router.post("/deleteShift", Middelwares.superAdminAuth, SuperAdminController.deleteShift);
router.post("/activeDeactiveShift", Middelwares.superAdminAuth, SuperAdminController.activeDeactiveShift);
router.post("/addShift", Middelwares.superAdminAuth, SuperAdminController.addShift);
router.post("/editShift", Middelwares.superAdminAuth, SuperAdminController.editShift);
router.get("/shifts", Middelwares.superAdminAuth, SuperAdminController.shifts);
router.get("/unitShifts", Middelwares.superAdminAuth, SuperAdminController.unitShifts);
router.get("/shift", Middelwares.superAdminAuth, SuperAdminController.getOneShift);
router.get("/weekDays", Middelwares.superAdminAuth, SuperAdminController.weekDays);
router.post("/addEmployee", Middelwares.superAdminAuth, SuperAdminController.addEmployee);
router.post("/editEmployee", Middelwares.superAdminAuth, SuperAdminController.editEmployee);
router.post("/deleteEmployee", Middelwares.superAdminAuth, SuperAdminController.deleteEmployee);
router.post("/approveEmployee", Middelwares.superAdminAuth, SuperAdminController.approveEmployee);
router.post("/activeDeactiveEmployee", Middelwares.superAdminAuth, SuperAdminController.activeDeactiveEmployee);
router.post("/manualPunchStatusEmployee", Middelwares.superAdminAuth, SuperAdminController.manualPunchStatusEmployee);
router.get("/employees", Middelwares.superAdminAuth, SuperAdminController.employees);
router.get("/employee", Middelwares.superAdminAuth, SuperAdminController.viewEmployee);
router.get("/unitEmployees", Middelwares.superAdminAuth, SuperAdminController.unitEmployees);
router.get("/getReportingManagerAll", Middelwares.superAdminAuth, SuperAdminController.getReportingManagerAll);
router.get("/teams", Middelwares.superAdminAuth, SuperAdminController.teams);
router.post("/deleteTeam", Middelwares.superAdminAuth, SuperAdminController.deleteTeam);
router.post("/activeDeactiveTeam", Middelwares.superAdminAuth, SuperAdminController.activeDeactiveTeam);
router.post("/addTeam", Middelwares.superAdminAuth, SuperAdminController.addTeam);
router.post("/editTeam", Middelwares.superAdminAuth, SuperAdminController.editTeam);
router.post("/deleteHoliday", Middelwares.superAdminAuth, SuperAdminController.deleteHoliday);
router.post("/activeDeactiveHoliday", Middelwares.superAdminAuth, SuperAdminController.activeDeactiveHoliday);
router.post("/addHoliday", Middelwares.superAdminAuth, SuperAdminController.addHoliday);
router.post("/editHoliday", Middelwares.superAdminAuth, SuperAdminController.editHoliday);
router.get("/holidays", Middelwares.superAdminAuth, SuperAdminController.holidays);
router.post("/editPermission", Middelwares.superAdminAuth, SuperAdminController.editPermission);
router.get("/permissions", Middelwares.superAdminAuth, SuperAdminController.permissions);
router.get("/permission", Middelwares.superAdminAuth, SuperAdminController.permission);
// ================================================= super admin route ===============================
router.use((req, res, next) => {
  res.status(504).json({ success: false, msg: ["Admin Invalid Routes!"] });
});

module.exports = router;
