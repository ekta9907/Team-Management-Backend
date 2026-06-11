const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

const BiometricEmployeeSchema = new mongoose.Schema(
  {
    // Common identifier with User model
    uniqueId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    
    // Basic Employee Info
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    image: {
      type: String, // URL or base64
      default: "",
    },
    rfidCard: {
      type: String,
      trim: true,
      default: "",
    },
    
    // Face Data
    faceData: {
      embeddings: {
        type: [[Number]], // Array of arrays of numbers (face embeddings)
        default: [],
      },
      enrolledAt: {
        type: Date,
        default: null,
      },
      quality: {
        type: Number,
        default: 0,
        min: 0,
        max: 1,
      },
      livenessScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 1,
      },
    },
    
    // Fingerprint Data
    fingerprintData: {
      templates: {
        type: [String], // Array of base64 encoded templates
        default: [],
      },
      deviceType: {
        type: String,
        default: "",
      },
      enrolledAt: {
        type: Date,
        default: null,
      },
      quality: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
    
    // Status flags
    isActive: {
      type: Boolean,
      default: true,
    },
    activeFlag: {
      type: Number,
      default: 1,
    },
    deleteFlag: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Indexes for better query performance
BiometricEmployeeSchema.index({ uniqueId: 1 });
BiometricEmployeeSchema.index({ email: 1 });
BiometricEmployeeSchema.index({ isActive: 1, deleteFlag: 1 });

// Export the model
module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.BiometricEmployee) {
    return dbConnection.models.BiometricEmployee;
  }
  return dbConnection.model("BiometricEmployee", BiometricEmployeeSchema);
};

