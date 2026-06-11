require("dotenv").config();
const { body, validationResult } = require("express-validator");
const getBiometricEmployeeModel = require("../../models/workspaceModels/biometricEmployeeModel");

// Helper function to get DB name from request
const getDBName = (req) => {
  return req?.currentUser?.workspaceId?.toString() || req?.headers?.["x-workspace-id"] || "default";
};

// Helper function to calculate face embeddings (placeholder - integrate with actual face recognition library)
const calculateFaceEmbeddings = async (frames) => {
  // TODO: Integrate with actual face recognition library (e.g., face-api.js, face_recognition, etc.)
  // This is a placeholder that returns mock embeddings
  // In production, you would:
  // 1. Load face detection model
  // 2. Detect faces in each frame
  // 3. Extract face embeddings
  // 4. Return average embeddings
  
  const mockEmbeddings = [];
  for (let i = 0; i < frames.length; i++) {
    // Mock embedding vector (128 dimensions typical for face recognition)
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
  // TODO: Integrate with actual liveness detection
  // This is a placeholder that returns a mock score
  return Math.random() * 0.2 + 0.8; // Random score between 0.8 and 1.0
};

// ==================== Enroll Face ====================
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

      // Calculate face embeddings from frames
      const embeddings = await calculateFaceEmbeddings(frames);
      
      // Detect liveness
      const livenessScore = await detectLiveness(frames);
      
      // Calculate average quality (placeholder - should be based on actual face detection quality)
      const quality = Math.min(0.95, livenessScore + Math.random() * 0.05);

      // Update employee face data
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

// ==================== Verify Face ====================
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

      // Calculate embedding for the provided frame
      const queryEmbedding = await calculateFaceEmbeddings([frame]);
      const queryVector = queryEmbedding[0];

      // Detect liveness
      const livenessScore = await detectLiveness([frame]);

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

        if (!employee.faceData.embeddings || employee.faceData.embeddings.length === 0) {
          return res.status(400).json({
            success: false,
            msg: "Employee face not enrolled",
          });
        }

        // Calculate similarity with stored embeddings
        let maxSimilarity = 0;
        for (const storedEmbedding of employee.faceData.embeddings) {
          const similarity = cosineSimilarity(queryVector, storedEmbedding);
          maxSimilarity = Math.max(maxSimilarity, similarity);
        }

        const match = maxSimilarity >= 0.7; // Threshold for face match (adjust as needed)
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
        // Search all employees
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

        const match = bestSimilarity >= 0.7; // Threshold for face match

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

module.exports = {
  enrollFace,
  verifyFace,
};

