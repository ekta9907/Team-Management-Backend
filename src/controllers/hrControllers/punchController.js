require("dotenv").config();
const PunchLog = require("../../models/workspaceModels/punchLogModel");
const UserLog = require("../../models/workspaceModels/userLogModel");
const RequestLog = require("../../models/workspaceModels/punchRequestLogModel"); // adjust path if needed
const RequestLogSaveAllPunchGet = require("../../models/workspaceModels/punchRequestLogSaveModel"); // adjust path if needed
const DeviceSyncCommand = require("../../models/workspaceModels/deviceSyncDataCommandModel");
const Device = require("../../models/workspaceModels/esslDeviceModel");
const axios = require("axios");
const { body, query, param, validationResult } = require("express-validator");
const getBiometricEmployeeModel = require("../../models/workspaceModels/biometricEmployeeModel");
const getUserModel = require("../../models/workspaceModels/userModel");

// Helper function to get DB name from request
const getDBName = (req) => {
  return req?.currentUser?.workspaceId?.toString() || req?.headers?.["x-workspace-id"] || "default";
};

const Getrequest = async (req, res) => {
  try {
    const { SN, INFO } = req.query;
    if (SN) {
      const existingDevice = await Device.findOne({ deviceSerialNumber: SN });
      if (!existingDevice) {
        const deviceData = {
          deviceModelId: "UnknownDevice",
          deviceName: "Auto Add By ESSL Device",
          deviceSerialNumber: SN,
          deviceModelName: "UnknownDevice",
          deviceModelNumber: "UnknownDevice",
          deviceAddress: "UnknownDevice",
          deviceIPAddress: "0.0.0.0",
          activeFlag: 1,
          deleteFlag: 0,
          lastActive: new Date(),
        };
        const newDevice = new Device(deviceData);
        await newDevice.save();
      } else {
        //existingDevice.activeFlag = 0;
        //existingDevice.activeFlag = 0;
        existingDevice.lastActive = new Date();
        await existingDevice.save();
      }
    }

    const query = req.query;
    const body = req.body;
    const queryKeys = Object.keys(query);
    const bodyKeys = Object.keys(body);
    if (queryKeys.length > 1 || bodyKeys.length > 1) {
      const logEntry = new RequestLog({
        type: "Getrequest", // or any type like 'auth', 'error', etc.
        body: req.body,
        query: req.query,
      });
      await logEntry.save();
    }
    if (SN) {
      if (SN === "CUB7250600033") {
        const now = new Date();
        const pad = (n) => (n < 10 ? "0" + n : n);
        const currentDateTime = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        const responseText = `OK
sync: true
datetime: ${currentDateTime}`;

        return res.type("text/plain").send(responseText);
      } else {
        return res.type("text/plain").send("OK");
      }
    }

    return res.type("text/plain").send("OK"); // ✅ Machine expects "OK"
  } catch (error) {
    console.error("❌ Error Saving Punch Logs:", error.message);
    return res.status(500).type("text/plain").send("ERROR");
  }
};
const SaveAllPunchGet = async (req, res) => {
  try {
    const logEntry = new RequestLogSaveAllPunchGet({
      type: "SaveAllPunchGet", // or any type like 'auth', 'error', etc.
      body: req.body,
      query: req.query,
    });
    await logEntry.save();
    if (!req.body) {
      console.error("⚠️ No Data in Body!", req);
      return res.type("text/plain").send("OK");
    }
    res.type("text/plain").send("OK"); // ✅ Machine expects "OK"
  } catch (error) {
    console.error("❌ Error Saving Punch Logs:", error);
    res.status(500).type("text/plain").send("ERROR");
  }
};
const SaveAllPunch = async (req, res) => {
  try {
    const serialNumber = req.query.SN || "UNKNOWN";
    const table = req.query.table || "UNKNOWN";
    if (!req.body) {
      console.log("⚠️ No Data in Body!");
      return res.status(500).type("text/plain").send("ERROR");
    }
    let data = req.body;
    const devices = await Device.find({
      activeFlag: 1,
      deleteFlag: 0,
    });

    const knownSerials = devices.length > 0 ? devices.map((device) => device.deviceSerialNumber) : ["QJT3244100693", "NFZ8242500952", "NFZ8240901008", "CUB7250600033"];
    if (!knownSerials.includes(serialNumber)) {
      console.error("⚠️ No serialNumber", serialNumber);
      return res.status(500).type("text/plain").send("ERROR");
    }

    // Ensure req.body is a proper string
    if (Array.isArray(data) && data.length === 1) {
      data = data[0]; // Extract the string from the array
    }

    if (typeof data !== "string") {
      data = String(data);
    }

    data = data.replace(/^"|"$/g, "").replace(/\\t/g, "\t").replace(/\\n/g, "\n");

    const logs = data
      .trim()
      .split("\n")
      .map((row) => row.split("\t").filter((cell) => cell !== ""));

    let punchLogIns = [];

    for (let log of logs) {
      const parts = log; // 🛠 Tab-separated data ko split karna
      if (parts.length < 4) {
        console.log("❌ Invalid Log Format Skipped:", log);
        continue; // Invalid entry skip kare
      }
      let punchDate = new Date(parts[1]);
      let formatted = parts[1];

      // Add 5:30 only if serialNumber matches
      if (serialNumber === "CUB7250600033") {
        punchDate = new Date(punchDate.getTime() + 5.5 * 60 * 60 * 1000); // Add 5 hours 30 mins
        const yyyy = punchDate.getFullYear();
        const mm = String(punchDate.getMonth() + 1).padStart(2, "0");
        const dd = String(punchDate.getDate()).padStart(2, "0");
        const HH = String(punchDate.getHours()).padStart(2, "0");
        const MM = String(punchDate.getMinutes()).padStart(2, "0");
        const SS = String(punchDate.getSeconds()).padStart(2, "0");
        formatted = `${yyyy}-${mm}-${dd} ${HH}:${MM}:${SS}`;
      }

      const isValidDate = !isNaN(punchDate.getTime());
      if (isValidDate && table === "ATTLOG") {
        const punchLogIn = {
          uniqueId: parts[0], // Employee ID
          serialNumber: serialNumber,
          punchDate: isValidDate ? punchDate : null, // or handle it differently
          punchDateString: formatted, // Punch Time
          table: table, // Punch Time
          deviceId: parts[2], // Device ID
          punchType: parseInt(parts[3], 10), // Punch Type (IN/OUT)
          rawData: log, // Original Raw Data
        };
        const data = {
          token: process.env.ATTN_SECRET_KEY,
          uniqueId: parts[0],
          punchDate: formatted,
          serialNumber: serialNumber,
          image: "",
          address: "",
          latitude: "",
          longitude: "",
          timeZone: "",
        };
        // if (parts[0] === "WEB47" || parts[0].startsWith("BSL")) {
        const punchResponses = await axios
          .post(process.env.PUNCH_API_AUTH, data, {
            headers: {
              "x-unique-id": parts[0] || "",
              "Content-Type": "application/json",
            },
          })
          .then((response) => response.data)
          .catch((error) => ({ error: error.message, data }));
        punchLogIn["response"] = punchResponses;
        punchLogIn["status"] = punchResponses.success;
        // }
        punchLogIns.push(punchLogIn);
      } else {
        const rawDataFormated = {
          uniqueId: parts[0], // Employee ID
          serialNumber: serialNumber,
          Date: isValidDate ? punchDate : null, // or handle it differently
          DateString: formatted, // Punch Time
          table: table, // Punch Time
          deviceId: parts[2], // Device ID
          Type: parseInt(parts[3], 10), // Punch Type (IN/OUT)
        };
        const userData = {
          rawDataFormated: rawDataFormated,
          rawData: log,
        };
        await UserLog.insertMany(userData);
      }
    }

    // 🔹 MongoDB me Bulk Insert (Agar ek se zyada logs hain)
    if (punchLogIns.length > 0) {
      const punchOutput = await PunchLog.insertMany(punchLogIns);
    }
     console.log(punchLogIns)
    res.type("text/plain").send("OK"); // ✅ Machine expects "OK"
  } catch (error) {
    console.error("❌ Error Saving Punch Logs:", error);
    res.status(500).type("text/plain").send("ERROR");
  }
};
// ==================== EMPLOYEE FUNCTIONS ====================

// List Employees
const listEmployees = [
  query("search").optional().trim(),
  query("department").optional().trim(),
  query("isActive").optional().isBoolean().toBoolean(),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          msg: errors.array()[0].msg,
        });
      }

      const { search, department, isActive, page = 1, limit = 20 } = req.query;
      const DB_NAME = getDBName(req);
      const BiometricEmployee = await getBiometricEmployeeModel(DB_NAME);

      const queryObj = {
        deleteFlag: 0,
      };

      if (search) {
        queryObj.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { uniqueId: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ];
      }

      if (department) {
        queryObj.department = department;
      }

      if (isActive !== undefined) {
        queryObj.isActive = isActive;
        queryObj.activeFlag = isActive ? 1 : 0;
      }

      const skip = (page - 1) * limit;

      const employees = await BiometricEmployee.find(queryObj)
        .select("-faceData.embeddings -fingerprintData.templates")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await BiometricEmployee.countDocuments(queryObj);

      return res.status(200).json({
        success: true,
        data: employees,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error listing employees:", error);
      return res.status(500).json({
        success: false,
        msg: "Failed to fetch employees",
        error: error.message,
      });
    }
  },
];

// Get Employee by ID
const getEmployeeById = [
  param("id").notEmpty().withMessage("Employee ID is required"),
  
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          msg: errors.array()[0].msg,
        });
      }

      const { id } = req.params;
      const DB_NAME = getDBName(req);
      const BiometricEmployee = await getBiometricEmployeeModel(DB_NAME);

      let employee = await BiometricEmployee.findOne({
        $or: [{ _id: id }, { uniqueId: id }],
        deleteFlag: 0,
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          msg: "Employee not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: employee,
      });
    } catch (error) {
      console.error("Error fetching employee:", error);
      return res.status(500).json({
        success: false,
        msg: "Failed to fetch employee",
        error: error.message,
      });
    }
  },
];

// Create Employee
const createEmployee = [
  body("uniqueId").notEmpty().trim().withMessage("Unique ID is required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("name").notEmpty().trim().withMessage("Name is required"),
  body("phone").optional().trim(),
  body("department").optional().trim(),
  body("designation").optional().trim(),
  body("image").optional().trim(),
  body("rfidCard").optional().trim(),
  body("isActive").optional().isBoolean().toBoolean(),
  
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          msg: errors.array()[0].msg,
        });
      }

      const { uniqueId, email, name, phone, department, designation, image, rfidCard, isActive = true } = req.body;
      const DB_NAME = getDBName(req);
      const BiometricEmployee = await getBiometricEmployeeModel(DB_NAME);
      const User = await getUserModel(DB_NAME);

      const existingEmployee = await BiometricEmployee.findOne({
        $or: [{ uniqueId }, { email }],
        deleteFlag: 0,
      });

      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          msg: "Employee with this uniqueId or email already exists",
        });
      }

      const existingUser = await User.findOne({ uniqueId, deleteFlag: 0 });
      if (!existingUser) {
        console.warn(`Warning: User with uniqueId ${uniqueId} not found in User model`);
      }

      const newEmployee = new BiometricEmployee({
        uniqueId,
        email,
        name,
        phone: phone || "",
        department: department || "",
        designation: designation || "",
        image: image || "",
        rfidCard: rfidCard || "",
        isActive,
        activeFlag: isActive ? 1 : 0,
        faceData: {
          embeddings: [],
          enrolledAt: null,
          quality: 0,
          livenessScore: 0,
        },
        fingerprintData: {
          templates: [],
          deviceType: "",
          enrolledAt: null,
          quality: 0,
        },
      });

      await newEmployee.save();

      return res.status(201).json({
        success: true,
        data: newEmployee,
        message: "Employee created successfully",
      });
    } catch (error) {
      console.error("Error creating employee:", error);
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
          success: false,
          msg: `Employee with this ${field} already exists`,
        });
      }

      return res.status(500).json({
        success: false,
        msg: "Failed to create employee",
        error: error.message,
      });
    }
  },
];

// Update Employee
const updateEmployee = [
  param("id").notEmpty().withMessage("Employee ID is required"),
  body("email").optional().isEmail().normalizeEmail(),
  body("name").optional().trim(),
  body("phone").optional().trim(),
  body("department").optional().trim(),
  body("designation").optional().trim(),
  body("image").optional().trim(),
  body("rfidCard").optional().trim(),
  body("isActive").optional().isBoolean().toBoolean(),
  
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          msg: errors.array()[0].msg,
        });
      }

      const { id } = req.params;
      const updateData = req.body;
      const DB_NAME = getDBName(req);
      const BiometricEmployee = await getBiometricEmployeeModel(DB_NAME);

      let employee = await BiometricEmployee.findOne({
        $or: [{ _id: id }, { uniqueId: id }],
        deleteFlag: 0,
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          msg: "Employee not found",
        });
      }

      if (updateData.email !== undefined) employee.email = updateData.email;
      if (updateData.name !== undefined) employee.name = updateData.name;
      if (updateData.phone !== undefined) employee.phone = updateData.phone;
      if (updateData.department !== undefined) employee.department = updateData.department;
      if (updateData.designation !== undefined) employee.designation = updateData.designation;
      if (updateData.image !== undefined) employee.image = updateData.image;
      if (updateData.rfidCard !== undefined) employee.rfidCard = updateData.rfidCard;
      if (updateData.isActive !== undefined) {
        employee.isActive = updateData.isActive;
        employee.activeFlag = updateData.isActive ? 1 : 0;
      }

      await employee.save();

      return res.status(200).json({
        success: true,
        data: employee,
        message: "Employee updated successfully",
      });
    } catch (error) {
      console.error("Error updating employee:", error);
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
          success: false,
          msg: `Employee with this ${field} already exists`,
        });
      }

      return res.status(500).json({
        success: false,
        msg: "Failed to update employee",
        error: error.message,
      });
    }
  },
];

// Delete Employee
const deleteEmployee = [
  param("id").notEmpty().withMessage("Employee ID is required"),
  
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          msg: errors.array()[0].msg,
        });
      }

      const { id } = req.params;
      const DB_NAME = getDBName(req);
      const BiometricEmployee = await getBiometricEmployeeModel(DB_NAME);

      const employee = await BiometricEmployee.findOne({
        $or: [{ _id: id }, { uniqueId: id }],
        deleteFlag: 0,
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          msg: "Employee not found",
        });
      }

      employee.deleteFlag = 1;
      employee.isActive = false;
      employee.activeFlag = 0;
      await employee.save();

      return res.status(200).json({
        success: true,
        message: "Employee deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting employee:", error);
      return res.status(500).json({
        success: false,
        msg: "Failed to delete employee",
        error: error.message,
      });
    }
  },
];

// ==================== FACE FUNCTIONS ====================

// Helper function to calculate face embeddings (placeholder)
const calculateFaceEmbeddings = async (frames) => {
  const mockEmbeddings = [];
  for (let i = 0; i < frames.length; i++) {
    const embedding = Array.from({ length: 128 }, () => Math.random() * 0.1 - 0.05);
    mockEmbeddings.push(embedding);
  }
  return mockEmbeddings;
};

// Helper function to calculate cosine similarity
const cosineSimilarity = (vecA, vecB) => {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Helper function to detect liveness (placeholder)
const detectLiveness = async (frames) => {
  return Math.random() * 0.2 + 0.8;
};

// Enroll Face
const enrollFace = [
  body("employeeId").notEmpty().withMessage("Employee ID is required"),
  body("frames")
    .isArray({ min: 1 })
    .withMessage("At least one frame is required")
    .custom((frames) => {
      if (!frames.every((frame) => typeof frame === "string" && frame.startsWith("data:image"))) {
        throw new Error("All frames must be base64 encoded images");
      }
      return true;
    }),
  
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          msg: errors.array()[0].msg,
        });
      }

      const { employeeId, frames } = req.body;
      const DB_NAME = getDBName(req);
      const BiometricEmployee = await getBiometricEmployeeModel(DB_NAME);

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

      const embeddings = await calculateFaceEmbeddings(frames);
      const livenessScore = await detectLiveness(frames);
      const quality = Math.min(0.95, livenessScore + Math.random() * 0.05);

      employee.faceData = {
        embeddings: embeddings,
        enrolledAt: new Date(),
        quality: quality,
        livenessScore: livenessScore,
      };

      await employee.save();

      return res.status(200).json({
        success: true,
        data: {
          embeddings: embeddings,
          enrolledAt: employee.faceData.enrolledAt,
          quality: employee.faceData.quality,
          livenessScore: employee.faceData.livenessScore,
        },
        message: "Face enrolled successfully",
      });
    } catch (error) {
      console.error("Error enrolling face:", error);
      return res.status(500).json({
        success: false,
        msg: "Failed to enroll face",
        error: error.message,
      });
    }
  },
];

// Verify Face
const verifyFace = [
  body("frame")
    .notEmpty()
    .withMessage("Frame is required")
    .custom((frame) => {
      if (typeof frame !== "string" || !frame.startsWith("data:image")) {
        throw new Error("Frame must be a base64 encoded image");
      }
      return true;
    }),
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

      const { frame, employeeId } = req.body;
      const DB_NAME = getDBName(req);
      const BiometricEmployee = await getBiometricEmployeeModel(DB_NAME);

      const queryEmbedding = await calculateFaceEmbeddings([frame]);
      const queryVector = queryEmbedding[0];
      const livenessScore = await detectLiveness([frame]);

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

        if (!employee.faceData.embeddings || employee.faceData.embeddings.length === 0) {
          return res.status(400).json({
            success: false,
            msg: "Employee face not enrolled",
          });
        }

        let maxSimilarity = 0;
        for (const storedEmbedding of employee.faceData.embeddings) {
          const similarity = cosineSimilarity(queryVector, storedEmbedding);
          maxSimilarity = Math.max(maxSimilarity, similarity);
        }

        const match = maxSimilarity >= 0.7;
        const confidence = Math.min(1.0, maxSimilarity);

        return res.status(200).json({
          success: true,
          data: {
            match: match,
            employeeId: employee._id.toString(),
            uniqueId: employee.uniqueId,
            confidence: confidence,
            livenessScore: livenessScore,
          },
        });
      } else {
        const employees = await BiometricEmployee.find({
          deleteFlag: 0,
          "faceData.embeddings": { $exists: true, $ne: [] },
        });

        let bestMatch = null;
        let bestSimilarity = 0;

        for (const employee of employees) {
          if (!employee.faceData.embeddings || employee.faceData.embeddings.length === 0) {
            continue;
          }

          for (const storedEmbedding of employee.faceData.embeddings) {
            const similarity = cosineSimilarity(queryVector, storedEmbedding);
            if (similarity > bestSimilarity) {
              bestSimilarity = similarity;
              bestMatch = employee;
            }
          }
        }

        const match = bestSimilarity >= 0.7;

        if (match && bestMatch) {
          return res.status(200).json({
            success: true,
            data: {
              match: true,
              employeeId: bestMatch._id.toString(),
              uniqueId: bestMatch.uniqueId,
              confidence: Math.min(1.0, bestSimilarity),
              livenessScore: livenessScore,
            },
          });
        } else {
          return res.status(200).json({
            success: true,
            data: {
              match: false,
              confidence: bestSimilarity,
              livenessScore: livenessScore,
            },
          });
        }
      }
    } catch (error) {
      console.error("Error verifying face:", error);
      return res.status(500).json({
        success: false,
        msg: "Failed to verify face",
        error: error.message,
      });
    }
  },
];

// ==================== FINGERPRINT FUNCTIONS ====================

// Helper function to match fingerprint templates (placeholder)
const matchFingerprintTemplates = (template1, template2) => {
  if (template1 === template2) {
    return 1.0;
  }
  
  const len1 = template1.length;
  const len2 = template2.length;
  const maxLen = Math.max(len1, len2);
  const minLen = Math.min(len1, len2);
  
  if (maxLen === 0) return 0;
  
  let matches = 0;
  for (let i = 0; i < minLen; i++) {
    if (template1[i] === template2[i]) {
      matches++;
    }
  }
  
  return matches / maxLen;
};

// Enroll Fingerprint
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

      const templates = employee.fingerprintData.templates || [];
      templates.push(template);

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

// Verify Fingerprint
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

        let maxSimilarity = 0;
        for (const storedTemplate of employee.fingerprintData.templates) {
          const similarity = matchFingerprintTemplates(template, storedTemplate);
          maxSimilarity = Math.max(maxSimilarity, similarity);
        }

        const match = maxSimilarity >= 0.7;
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

        const match = bestSimilarity >= 0.7;

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
  // Punch functions
  SaveAllPunch,
  SaveAllPunchGet,
  Getrequest,
  // Employee functions
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  // Face functions
  enrollFace,
  verifyFace,
  // Fingerprint functions
  enrollFingerprint,
  verifyFingerprint,
};
