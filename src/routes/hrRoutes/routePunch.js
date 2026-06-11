const express = require("express");
const router = express.Router();
router.use(express.static("public"));
const PunchController = require("../../controllers/hrControllers/punchController");
const Middelwares = require("../../middelwares/hrAuthMiddelware");

// ==================== PUNCH ROUTES ====================
router.post("/punchs", express.text(), PunchController.SaveAllPunch);
router.get("/punchs", express.text(), PunchController.SaveAllPunchGet);
router.get("/getpunchs", express.text(), PunchController.Getrequest);

router.post("/cdata.aspx", express.text(), PunchController.SaveAllPunch);
router.get("/cdata.aspx", express.text(), PunchController.SaveAllPunchGet);
router.get("/getrequest.aspx", express.text(), PunchController.Getrequest);

// ==================== EMPLOYEE CRUD ROUTES ====================
router.get("/employees", Middelwares.auth, PunchController.listEmployees);
router.get("/employees/:id", Middelwares.auth, PunchController.getEmployeeById);
router.post("/employees", Middelwares.auth, PunchController.createEmployee);
router.put("/employees/:id", Middelwares.auth, PunchController.updateEmployee);
router.delete("/employees/:id", Middelwares.auth, PunchController.deleteEmployee);

// ==================== FACE ROUTES ====================
router.post("/face/enroll", Middelwares.auth, PunchController.enrollFace);
router.post("/face/verify", Middelwares.auth, PunchController.verifyFace);

// ==================== FINGERPRINT ROUTES ====================
router.post("/fingerprint/enroll", Middelwares.auth, PunchController.enrollFingerprint);
router.post("/fingerprint/verify", Middelwares.auth, PunchController.verifyFingerprint);

router.use((req, res, next) => {
  res.status(504).json({ success: false, msg: ["routePunch Invalid Routes!"] });
});
module.exports = router;
