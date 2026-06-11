const express = require("express");
const router = express.Router();
const path = require("path");
const Middelwares = require("../../middelwares/hrAuthMiddelware");
const EmployeeController = require("../../controllers/hrControllers/employeeController");

router.use((req, res, next) => {
  res.status(504).json({ success: false, msg: ["Employee Invalid Routes!"] });
});

module.exports = router;
