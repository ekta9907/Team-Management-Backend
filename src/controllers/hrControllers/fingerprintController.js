require("dotenv").config();
const { body, validationResult } = require("express-validator");
const getBiometricEmployeeModel = require("../../models/workspaceModels/biometricEmployeeModel");

// Helper function to get DB name from request
const getDBName = (req) => {
  return req?.currentUser?.workspaceId?.toString() || req?.headers?.["x-workspace-id"] || "default";
};

// Helper function to match fingerprint templates (placeholder - integrate with actual fingerprint library)
const matchFingerprintTemplates = (template1, template2) => {
  // TODO: Integrate with actual fingerprint matching library
  // This is a placeholder that does simple string comparison
  // In production, you would use a fingerprint matching SDK like:
  // - Mantra SDK for Mantra devices
  // - Secugen SDK for Secugen devices
  // - Other vendor-specific SDKs
  
  // For now, return a mock similarity score
  // In reality, fingerprint templates are binary data that need specialized matching
  if (template1 === template2) {
    return 1.0; // Exact match
  }
  
  // Simple similarity based on string length and common characters
  const len1 = template1.length;
  const len2 = template2.length;
  const maxLen = Math.max(len1, len2);
  const minLen = Math.min(len1, len2);
  
  if (maxLen === 0) return 0;
  
  // Calculate a simple similarity score
  let matches = 0;
  for (let i = 0; i < minLen; i++) {
    if (template1[i] === template2[i]) {
      matches++;
    }
  }
  
  return matches / maxLen;
};

// ==================== Enroll Fingerprint ====================
const enrollFingerprint = [
  body("employeeId").notEmpty().withMessage("Employee ID is required"),
  body("template").notEmpty().withMessage("Fingerprint template is required"),
  body("deviceType").optional().trim(),
  body("quality").optional().isInt({ min: 0, max: 100 }).toInt(),
  
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          msg: errors.array()[0].msg,
        });
      }

      const { employeeId, template, deviceType = "", quality = 85 } = req.body;
      const DB_NAME = getDBName(req);
      const BiometricEmployee = await getBiometricEmployeeModel(DB_NAME);

      // Find employee
      const employee = await BiometricEmployee.findOne({
        $or: [{ _id: employeeId }, { uniqueId: employeeId }],
        deleteFlag: 0,
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          msg: "Employee not found",
        });
      }

      // Add template to existing templates
      const templates = employee.fingerprintData.templates || [];
      templates.push(template);

      // Update employee fingerprint data
      employee.fingerprintData = {
        templates: templates,
        deviceType: deviceType || employee.fingerprintData.deviceType || "",
        enrolledAt: new Date(),
        quality: quality,
      };

      await employee.save();

      return res.status(200).json({
        success: true,
        data: {
          templates: templates,
          deviceType: employee.fingerprintData.deviceType,
          enrolledAt: employee.fingerprintData.enrolledAt,
          quality: employee.fingerprintData.quality,
        },
        message: "Fingerprint enrolled successfully",
      });
    } catch (error) {
      console.error("Error enrolling fingerprint:", error);
      return res.status(500).json({
        success: false,
        msg: "Failed to enroll fingerprint",
        error: error.message,
      });
    }
  },
];

// ==================== Verify Fingerprint ====================
const verifyFingerprint = [
  body("template").notEmpty().withMessage("Fingerprint template is required"),
  body("employeeId").optional().trim(),
  
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          msg: errors.array()[0].msg,
        });
      }

      const { template, employeeId } = req.body;
      const DB_NAME = getDBName(req);
      const BiometricEmployee = await getBiometricEmployeeModel(DB_NAME);

      // If employeeId is provided, verify against that specific employee
      if (employeeId) {
        const employee = await BiometricEmployee.findOne({
          $or: [{ _id: employeeId }, { uniqueId: employeeId }],
          deleteFlag: 0,
        });

        if (!employee) {
          return res.status(404).json({
            success: false,
            msg: "Employee not found",
          });
        }

        if (!employee.fingerprintData.templates || employee.fingerprintData.templates.length === 0) {
          return res.status(400).json({
            success: false,
            msg: "Employee fingerprint not enrolled",
          });
        }

        // Match against stored templates
        let maxSimilarity = 0;
        for (const storedTemplate of employee.fingerprintData.templates) {
          const similarity = matchFingerprintTemplates(template, storedTemplate);
          maxSimilarity = Math.max(maxSimilarity, similarity);
        }

        const match = maxSimilarity >= 0.7; // Threshold for fingerprint match (adjust as needed)
        const confidence = Math.min(1.0, maxSimilarity);

        return res.status(200).json({
          success: true,
          data: {
            match: match,
            employeeId: employee._id.toString(),
            uniqueId: employee.uniqueId,
            employee: {
              id: employee._id.toString(),
              uniqueId: employee.uniqueId,
              name: employee.name,
              email: employee.email,
              department: employee.department,
              designation: employee.designation,
            },
            confidence: confidence,
          },
        });
      } else {
        // Search all employees
        const employees = await BiometricEmployee.find({
          deleteFlag: 0,
          "fingerprintData.templates": { $exists: true, $ne: [] },
        });

        let bestMatch = null;
        let bestSimilarity = 0;

        for (const employee of employees) {
          if (!employee.fingerprintData.templates || employee.fingerprintData.templates.length === 0) {
            continue;
          }

          for (const storedTemplate of employee.fingerprintData.templates) {
            const similarity = matchFingerprintTemplates(template, storedTemplate);
            if (similarity > bestSimilarity) {
              bestSimilarity = similarity;
              bestMatch = employee;
            }
          }
        }

        const match = bestSimilarity >= 0.7; // Threshold for fingerprint match

        if (match && bestMatch) {
          return res.status(200).json({
            success: true,
            data: {
              match: true,
              employeeId: bestMatch._id.toString(),
              uniqueId: bestMatch.uniqueId,
              employee: {
                id: bestMatch._id.toString(),
                uniqueId: bestMatch.uniqueId,
                name: bestMatch.name,
                email: bestMatch.email,
                department: bestMatch.department,
                designation: bestMatch.designation,
              },
              confidence: Math.min(1.0, bestSimilarity),
            },
          });
        } else {
          return res.status(200).json({
            success: true,
            data: {
              match: false,
              confidence: bestSimilarity,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error verifying fingerprint:", error);
      return res.status(500).json({
        success: false,
        msg: "Failed to verify fingerprint",
        error: error.message,
      });
      }
  },
];

module.exports = {
  enrollFingerprint,
  verifyFingerprint,
};

