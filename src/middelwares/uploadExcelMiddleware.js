const multer = require("multer");
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");
const msg = require("../helpers/hrLanguageMessageHelper");

// Storage setup
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    let folderName = "excelFiles";
    req["folderName"] = folderName;
    callback(null, path.join("public", folderName) + "/");
  },
  filename: function (req, file, callback) {
    const nameFile = Date.now() + "-" + Math.round(Math.random() * 1000) + path.extname(file.originalname);
    console.log("Excel file upload success");
    callback(null, nameFile);
  },
});

// Allow only Excel files
const fileFilter = function (req, file, callback) {
  const allowedTypes = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];
  if (allowedTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error("Invalid file type: " + file.mimetype), false);
  }
};

const uploadExcelMiddleware = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: fileFilter,
});

// Parse Excel
const uploadDataExcel = async (req, res, next) => {
  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const headers = [
      { key: "sNo", label: "S. No" },
      { key: "uniqueId", label: "Employee No." },
      { key: "pfEligibility", label: "PF Eligible" },
      { key: "esicEligibility", label: "ESIC Eligible" },
      { key: "ptEligibility", label: "PT Eligible" },
      { key: "salaryGiveByCompany", label: "Gross" },
      { key: "finalBasic", label: "Basic" },
      { key: "hra", label: "HRA" },
      { key: "otherAllowance", label: "Other Allowances" },
      // { key: "grossSalary", label: "Gross Salary" },
      // { key: "actualBasicSalary", label: "Actual Basic" },
      { key: "epf", label: "EPF" },
      { key: "esic", label: "ESIC" },
      { key: "totalCTC", label: "Total CTC" },
      { key: "emppf", label: "Employee PF" },
      { key: "empesic", label: "Employee ESIC" },
      { key: "startDate", label: "Effected Date" },
      { key: "remarks", label: "Remark" },
      { key: "status", label: "Status" },
    ];
    fs.unlinkSync(req.file.path); // delete after processing
    const parsedData = sheetData.map((row) => {
      const newRow = {};
      const labelToKeyMap = headers.reduce((acc, h) => {
        acc[h.label] = h.key;
        return acc;
      }, {});

      for (const [label, value] of Object.entries(row)) {
        const dbKey = labelToKeyMap[label.trim()];
        if (dbKey) {
          newRow[dbKey] = value;
        }
      }
      return newRow;
    });
    req.body = parsedData;

    if (!req.body || req.body.length === 0) {
      const record = { success: false, msg: msg.msgUploadFileError, key: 3 };
      return res.status(200).json(record);
    }

    next();
  } catch (error) {
    console.log("Excel parse error:", error.message);
    const record = { success: false, msg: [error.message], key: 3 };
    return res.status(200).json(record);
  }
};

module.exports = { uploadExcelMiddleware, uploadDataExcel };
