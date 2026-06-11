const express = require("express");
const router = express.Router();
router.use(express.static("public"));
const superAdminAuthRoute = require("./superAdminRoutes/authRoute");
const superAdminCommenRoute = require("./superAdminRoutes/commenRoute");
const workspaceAuthRoute = require("./workspaceRoutes/authRoute");
const workspaceCommenRoute = require("./workspaceRoutes/commenRoute");
const websiteAuthRoute = require("./websiteRoutes/authRoute");
const websiteCommenRoute = require("./websiteRoutes/commenRoute");
const hrCommenRoute = require("./hrRoutes/commenRoute");

// Super Admin Group routes
router.use("/superadmin/auth", superAdminAuthRoute);
router.use("/superadmin/commen", superAdminCommenRoute);
// Workspace Group routes
router.use("/workspace/auth", workspaceAuthRoute);
router.use("/workspace/commen", workspaceCommenRoute);
// Website Group Routes
router.use("/website/auth", websiteAuthRoute);
router.use("/website/commen", websiteCommenRoute);
router.use("/hr/commen", hrCommenRoute);
router.use((req, res, next) => {
  res.status(504).json({ success: false, msg: ["Index Invalid Routes!"] });
});

module.exports = router;
