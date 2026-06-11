const multer = require("multer");
const path = require("path");
const fs = require("fs");
const csv = require("csv-parser");
const msg = require("../helpers/hrLanguageMessageHelper");

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    let type = file.mimetype.split("/");
    let folderName = "csvFiles";
    req["folderName"] = folderName;
    callback(null, path.join("public", folderName) + "/");
  },
  filename: function (req, file, callback) {
    const nameFile = Date.now() + "-" + Math.round(Math.random() * 1000) + path.extname(file.originalname);
    console.log("success pass from upload middleware");
    callback(null, nameFile);
  },
});

const fileFilter = function (req, file, callback) {
  const allowedTypes = ["text/csv", "application/csv"];
  if (allowedTypes.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(new Error("Invalid file type" + file.mimetype), false);
  }
};
const uploadCSVMiddleware = multer({
  storage: storage,
  limit: { fileSize: 100 * 1024 * 1024 },
  fileFilter: fileFilter,
});

const uploadDataCsv = async (req, res, next) => {
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => results.push(data))
    .on("end", () => {
      fs.unlinkSync(req.file.path);
      req.body = results;
      if (!req.body) {
        const record = { success: false, msg: msg.msgUploadFileError, key: 3 };
        return res.status(200).json(record);
      }
      next();
    })
    .on("error", (error) => {
      console.log("error", error.message);
      const record = { success: false, msg: [error.message], key: 3 };
      return res.status(200).json(record);
    });
};

module.exports = { uploadCSVMiddleware, uploadDataCsv };
