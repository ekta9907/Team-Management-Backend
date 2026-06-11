require("dotenv").config();
const { body, query, param, validationResult } = require("express-validator");
const getBiometricEmployeeModel = require("../../models/workspaceModels/biometricEmployeeModel");
const getUserModel = require("../../models/workspaceModels/userModel");

// Helper function to get DB name from request
const getDBName = (req) => {
  return req?.currentUser?.workspaceId?.toString() || req?.headers?.["x-workspace-id"] || "default";
};

// ==================== List Employees ====================
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

      // Build query
      const query = {
        deleteFlag: 0,
      };

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { uniqueId: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ];
      }

      if (department) {
        query.department = department;
      }

      if (isActive !== undefined) {
        query.isActive = isActive;
        query.activeFlag = isActive ? 1 : 0;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Fetch employees
      const employees = await BiometricEmployee.find(query)
        .select("-faceData.embeddings -fingerprintData.templates") // Don't send embeddings/templates in list
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await BiometricEmployee.countDocuments(query);

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

// ==================== Get Employee by ID ====================
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

      // Try to find by _id or uniqueId
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

// ==================== Create Employee ====================
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

      // Check if employee with same uniqueId or email already exists
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

      // Check if user with same uniqueId exists (optional validation)
      const existingUser = await User.findOne({ uniqueId, deleteFlag: 0 });
      if (!existingUser) {
        console.warn(`Warning: User with uniqueId ${uniqueId} not found in User model`);
      }

      // Create new employee
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
      
      // Handle duplicate key error
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

// ==================== Update Employee ====================
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

      // Find employee
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

      // Update fields
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

// ==================== Delete Employee ====================
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

      // Soft delete
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

module.exports = {
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};

