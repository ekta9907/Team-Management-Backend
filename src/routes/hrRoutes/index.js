const express = require("express");
const router = express.Router();
router.use(express.static("public"));

const superAdminRoute = require("./superAdminRoute");
const adminRoute = require("./adminRoute");
const authRoute = require("./authRoute");
const employeeRoute = require("./employeeRoute");
const commenRoute = require("./commenRoute");
const routePunch = require("./routePunch");

// Group routes
router.use("/auth", authRoute);
router.use("/superadmin", superAdminRoute);
router.use("/admin", adminRoute);
router.use("/employee", employeeRoute);
router.use("/commen", commenRoute);
router.use("/", routePunch); // Punch and biometric employee routes at root level
router.use((req, res, next) => {
  res.status(504).json({ success: false, msg: ["Index Invalid Routes!"] });
});

module.exports = router;
