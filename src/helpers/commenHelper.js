const crypto = require("crypto");
const algorithm = "aes-256-cbc";
const key = crypto.createHash("sha256").update("sameasfrontend").digest();
const bcrypt = require("bcrypt");
const moment = require("moment");
const encoded = async (str) => Buffer.from(String(str)).toString("base64");
const decoded = async (str) =>
  parseInt(Buffer.from(str, "base64").toString("utf-8"));
const axios = require("axios");
const currentDate = async (format = "YYYY-MM-DD HH:mm:ss") => {
  return moment().format(format);
};
const dateFormat = async (date = moment(), format = "YYYY-MM-DD HH:mm:ss") => {
  return moment(date).format(format);
};
const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

const hashPassword = async (password) => {
  const salt = 10;
  return bcrypt.hash(password, salt);
};
const comparePassword = async (password, dbPassword) => {
  return bcrypt.compareSync(password, dbPassword);
};

const generateRandomString = async (length) => {
  const string = "0123456789";
  var result = "";
  for (var i = length; i > 0; --i)
    result += string[Math.floor(Math.random() * string.length)];
  return result;
};

const generateRandomPassword = async (length) => {
  const string = "0123456789ABCDEFGHIJKLMNOPQRstuvwxyz";
  var result = "";
  for (var i = length; i > 0; --i)
    result += string[Math.floor(Math.random() * string.length)];
  return result;
};

const generateOtp = async (length) => {
  const string = "0123456789";
  var result = "";
  for (var i = length; i > 0; --i) {
    result += string[Math.floor(Math.random() * string.length)];
  }
  return result;
};
const timeAgo = async (date) => {
  const diffInSeconds = Math.floor((new Date() - new Date(date)) / 1000);

  const years = Math.floor(diffInSeconds / (365 * 24 * 60 * 60));
  if (years >= 1) return `${years} year${years > 1 ? "s" : ""} ago`;

  const months = Math.floor(diffInSeconds / (30 * 24 * 60 * 60));
  if (months >= 1) return `${months} month${months > 1 ? "s" : ""} ago`;

  const days = Math.floor(diffInSeconds / (24 * 60 * 60));
  if (days >= 1) return `${days} day${days > 1 ? "s" : ""} ago`;

  const hours = Math.floor(diffInSeconds / (60 * 60));
  if (hours >= 1) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes >= 1) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;

  return `${diffInSeconds} second${diffInSeconds !== 1 ? "s" : ""} ago`;
};

const formatTime = async (timeField) => {
  return {
    $cond: {
      if: { $gte: [{ $hour: `$${timeField}` }, 12] }, // Check if hour is >= 12 (PM)
      then: {
        $concat: [
          { $toString: { $mod: [{ $hour: `$${timeField}` }, 12] } }, // Convert to 12-hour format
          ":",
          {
            $cond: {
              if: { $gte: [{ $minute: `$${timeField}` }, 10] },
              then: { $toString: { $minute: `$${timeField}` } },
              else: {
                $concat: ["0", { $toString: { $minute: `$${timeField}` } }],
              },
            },
          },
          " PM",
        ],
      },
      else: {
        $concat: [
          { $toString: { $mod: [{ $hour: `$${timeField}` }, 12] } }, // Convert to 12-hour format
          ":",
          {
            $cond: {
              if: { $gte: [{ $minute: `$${timeField}` }, 10] },
              then: { $toString: { $minute: `$${timeField}` } },
              else: {
                $concat: ["0", { $toString: { $minute: `$${timeField}` } }],
              },
            },
          },
          " AM",
        ],
      },
    },
  };
};
const validateRequiredFields = (req, res, fields) => {
  for (const field of fields) {
    if (!(field in req.body)) {
      return res
        .status(400)
        .json({ success: false, msg: `Key '${field}' is missing`, key: field });
    }
    if (
      req.body[field] === null ||
      req.body[field] === undefined ||
      req.body[field] === "" ||
      (typeof req.body[field] !== "string" &&
        String(req.body[field]).trim() === "")
    ) {
      return res
        .status(400)
        .json({ success: false, msg: `${field} cannot be empty`, key: field });
    }
  }
  return null; // All good
};
const API_TOKEN = "I3TLarek-R4xXVFHLR0IuhKUCG2pUfFCt1lF5-QJ";
const ZONE_ID = "9434d4af4d313a41ddf1dcd2f8e6abf3";
const BASE_URL = `https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records`;
const PUBLIC_IP = "34.220.72.206";
// 4️ create new DNS record
const createRecord = async (subdomain) => {
  const data = {
    type: "A",
    name: subdomain,
    content: PUBLIC_IP,
    ttl: 120,
    proxied: true,
  };

  try {
    // 1. Check if record exists
    const getResp = await axios.get(`${BASE_URL}?type=A&name=${subdomain}`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    });

    if (getResp.data?.result?.length > 0) {
      const existingRecord = getResp.data.result[0];
      console.log("DNS record already exists:", existingRecord);
      return { result: existingRecord, success: true, existing: true };
    }

    const resp = await axios.post(BASE_URL, data, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    console.log("DNS record response:", resp.data);
    return resp.data;
  } catch (err) {
    console.error(
      "Error creating DNS record:",
      err.response?.data || err.message,
    );
  }
};
// 4️ get existing DNS record list
const listDns = async (name = "", type = "", page = 1, per_page = 100) => {
  const params = { page, per_page };
  if (name) params.name = name;
  if (type) params.type = type;
  try {
    const resp = await axios.get(BASE_URL, {
      params,
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (resp.data?.success) {
      return resp.data;
    } else {
      return "NA";
    }
  } catch (err) {
    console.error("API error:", err.response?.data || err.message);
    throw err;
  }
};
// 4️ get existing DNS record
const getDns = async (recordId) => {
  try {
    const resp = await axios.get(`${BASE_URL}/${recordId}`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      validateStatus: (status) => status < 500,
    });

    return resp.data?.success ? resp.data : null;
  } catch (err) {
    console.error("getDns error:", err.response?.data || err.message);
    throw err;
  }
};

// 4️ Update existing DNS record
const updateDns = async (recordId, { name, content, ttl, proxied }) => {
  try {
    const resp = await axios.patch(
      `${BASE_URL}/${recordId}`,
      { name, content, ttl, proxied },
      {
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          "Content-Type": "application/json",
        },
        validateStatus: (status) => status < 500,
      },
    );

    return resp.data?.success ? resp.data : "NA";
  } catch (err) {
    console.error("updateDns error:", err.response?.data || err.message);
    throw err;
  }
};

// 5️ Delete a DNS record
const deleteDns = async (recordId) => {
  try {
    const resp = await axios.delete(`${BASE_URL}/${recordId}`, {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        "Content-Type": "application/json",
      },
      validateStatus: (status) => status < 500,
    });
    return resp.data?.success ? resp.data : "NA";
  } catch (err) {
    console.error("deleteDns error:", err.response?.data || err.message);
    throw err;
  }
};

const abbreviationSmart = async (input) => {
  try {
    if (typeof input !== "string" || !input.trim()) return "";

    const parts = input
      .trim()
      .replace(/[\-_.]+/g, " ")
      .split(/\s+/)
      .filter(Boolean);

    if (parts.length === 1) {
      const word = parts[0];
      if (word.length === 1) return word[0].toUpperCase();
      return (word[0] + word[word.length - 1]).toUpperCase(); // first + last letter
    }

    const first = parts[0][0] || "";
    const last = parts[parts.length - 1][0] || "";
    return (first + last).toUpperCase();
  } catch (error) {
    console.error("deleteDns error:", err.response?.data || err.message);
    throw err;
  }
};

//  Format bytes to human-readable string
const formatFileSize = (bytes) => {
  try {
    if (!bytes) return "0 B";
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
  } catch (err) {
    console.error("formatFileSize error:", err.response?.data || err.message);
    throw err;
  }
};

//  Map file extensions to descriptive names
const getFileTypeDescription = (ext, mimetype) => {
  try {
    const lowerExt = (ext || "").toLowerCase();
    const lowerMime = (mimetype || "").toLowerCase();

    const map = {
      // Images
      jpg: { type: "image", label: "JPEG Image" },
      jpeg: { type: "image", label: "JPEG Image" },
      png: { type: "image", label: "PNG Image" },
      gif: { type: "image", label: "GIF Image" },
      webp: { type: "image", label: "WebP Image" },

      // Documents
      pdf: { type: "pdf", label: "PDF Document" },

      // Word
      doc: { type: "word", label: "Microsoft Word Document (.doc)" },
      docx: { type: "word", label: "Microsoft Word Document (.docx)" },

      // Excel
      xls: { type: "excel", label: "Microsoft Excel Worksheet (.xls)" },
      xlsx: { type: "excel", label: "Microsoft Excel Worksheet (.xlsx)" },
      csv: { type: "excel", label: "CSV File" },

      // PowerPoint
      ppt: { type: "presentation", label: "Microsoft PowerPoint (.ppt)" },
      pptx: { type: "presentation", label: "Microsoft PowerPoint (.pptx)" },

      // Media
      mp4: { type: "video", label: "MP4 Video" },
      mp3: { type: "audio", label: "MP3 Audio" },

      // Archive
      zip: { type: "archive", label: "ZIP Archive" },
      rar: { type: "archive", label: "RAR Archive" },
      "7z": { type: "archive", label: "7z Archive" },

      // Executable
      exe: { type: "executable", label: "Windows Executable (.exe)" },

      // Code
      js: { type: "code", label: "JavaScript File" },
      ts: { type: "code", label: "TypeScript File" },
      json: { type: "code", label: "JSON File" },
      html: { type: "code", label: "HTML File" },
      css: { type: "code", label: "CSS File" },

      // Text
      txt: { type: "text", label: "Text File" },
      md: { type: "text", label: "Markdown File" },
    };

    // ✅ Extension based match (BEST)
    if (map[lowerExt]) {
      return map[lowerExt];
    }

    // ✅ Fallback: mimetype based detection
    if (lowerMime.startsWith("image/")) {
      return { type: "image", label: "Image File" };
    }

    if (lowerMime.startsWith("video/")) {
      return { type: "video", label: "Video File" };
    }

    if (lowerMime.startsWith("audio/")) {
      return { type: "audio", label: "Audio File" };
    }

    if (lowerMime === "application/pdf") {
      return { type: "pdf", label: "PDF Document" };
    }

    // ✅ Final fallback
    return { type: "other", label: "Unknown File Type" };
  } catch (err) {
    console.error(
      "getFileTypeDescription error:",
      err?.response?.data || err.message,
    );
    return { type: "other", label: "Unknown File Type" };
  }
};

// ---------------------------
// Data to encrypt
// ---------------------------

async function encrypt(text) {
  const value = text.toString(); // Ensure string
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(value, "utf8", "base64");
  encrypted += cipher.final("base64");
  return iv.toString("base64") + ":" + encrypted;
}

async function decrypt(data) {
  const [ivBase64, encryptedText] = data.split(":");
  const iv = Buffer.from(ivBase64, "base64");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedText, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

async function encryptData(dataObj) {
  const encryptedObj = {};
  for (const [key, value] of Object.entries(dataObj)) {
    if (value) {
      encryptedObj[key] = await encrypt(value);
    } else {
      encryptedObj[key] = value;
    }
  }
  return encryptedObj;
}

async function decryptData(encryptedObj) {
  const decryptedObj = {};
  for (const [field, value] of Object.entries(encryptedObj)) {
    if (value) {
      const decryptedValue = await decrypt(value);
      const sanitized = decryptedValue.replace(/,/g, "");
      const numberValue = parseFloat(sanitized);
      decryptedObj[field] = isNaN(numberValue) ? decryptedValue : numberValue;
    } else {
      decryptedObj[field] = value;
    }
  }
  return decryptedObj;
}
// Selective Encrypt
async function encryptDataByKey(dataObj, keysToEncrypt = []) {
  const encryptedObj = {};
  for (const [field, value] of Object.entries(dataObj)) {
    if (keysToEncrypt.includes(field)) {
      encryptedObj[field] = await encrypt(value);
    } else {
      encryptedObj[field] = value; // untouched
    }
  }
  return encryptedObj;
}

async function decryptDataByKey(encryptedObj, keysToDecrypt = []) {
  const decryptedObj = {};
  for (const [field, value] of Object.entries(encryptedObj)) {
    if (
      keysToDecrypt.includes(field) &&
      value &&
      typeof value === "string" &&
      value !== "0"
    ) {
      const decryptedValue = await decrypt(value);
      const sanitized = decryptedValue.replace(/,/g, "");
      const numberValue = parseFloat(sanitized);
      decryptedObj[field] = isNaN(numberValue) ? decryptedValue : numberValue;
    } else {
      decryptedObj[field] = value; // untouched
    }
  }
  return decryptedObj;
}

// Encrypt array of objects
async function encryptDataArr(dataArray, keysToEncrypt = []) {
  return await dataArray.map(async (dataObj) => {
    const encryptedObj = {};
    for (const [field, value] of Object.entries(dataObj)) {
      if (keysToEncrypt.includes(field) && value) {
        encryptedObj[field] = await encrypt(value);
      } else {
        encryptedObj[field] = value; // untouched
      }
    }
    return encryptedObj;
  });
}

// Decrypt array of objects
async function decryptDataArr(encryptedArray, keysToDecrypt = []) {
  return await encryptedArray.map(async (encryptedObj) => {
    const decryptedObj = {};
    for (const [field, value] of Object.entries(encryptedObj)) {
      if (
        keysToDecrypt.includes(field) &&
        value &&
        typeof value === "string" &&
        value !== "0"
      ) {
        const decryptedValue = await decrypt(value);
        const sanitized = decryptedValue.replace(/,/g, "");
        const numberValue = parseFloat(sanitized);
        decryptedObj[field] = isNaN(numberValue) ? decryptedValue : numberValue;
      } else {
        decryptedObj[field] = value; // untouched
      }
    }
    return decryptedObj;
  });
}
async function getFiscalYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (month >= 4) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
}
async function getPTDeductionForYear(doc, fiscalYear, state) {
  // Step 1: Yearly search
  const yearlyYear = doc.ptDeductionYearly?.find(
    (y) => y.fiscalYear === fiscalYear,
  );
  if (yearlyYear) {
    const ptState = yearlyYear.ptDeduction.find((p) => p.state === state);
    if (ptState) {
      return ptState; // उस साल और state का PT मिला
    }
  }
  // Step 2: Fallback to direct ptDeduction
  return doc.ptDeduction.find((p) => p.state === state);
}

async function getPTAmount(doc, user, grossSalary, month) {
  const fiscalYear = await getFiscalYear();
  // Step 1: Get PT entry for the year and state
  const state = user?.unitName === "Bhusawal Office" ? "MH" : "MP";
  const ptEntry = await getPTDeductionForYear(doc, fiscalYear, state);
  if (!ptEntry) return 0; // No PT defined

  // Step 2: Calculate PT amount
  if (state === "MH") {
    // Maharashtra has gender-based slabs
    const genderKey = user?.gender?.toLowerCase();
    const slabs = ptEntry.slabs?.[genderKey] || [];
    for (const slab of slabs) {
      const min = slab.minGross ?? 0;
      const max = slab.maxGross ?? Infinity;
      if (grossSalary >= min && grossSalary <= max) {
        return ptEntry?.month === month
          ? slab.ptLastMonth || 0
          : slab.ptAmount || 0;
      }
    }
    return 0; // No matching slab
  } else {
    // Other states
    const slab = ptEntry.slabs.find((slab) => {
      const min = slab.minGross ?? 0;
      const max = slab.maxGross ?? Infinity;
      return grossSalary >= min && grossSalary <= max;
    });
    return ptEntry?.month === month
      ? slab.ptLastMonth || 0
      : slab.ptAmount || 0;
  }
}
async function getTDSAmount(TaxableSalary, Year) {
  try {
    const axios = require("axios");

    const fields = {
      AgeGroup: "NotSenior",
      TaxableSalary: TaxableSalary,
      Year: Year,
    };
    const response = await axios.post(
      "https://cleartax.in/f/itr/tax_calculator_results/",
      fields,
      {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
      },
    );

    if (response.status === 200) {
      return response?.data?.newBudgetNewRegime;
    } else {
      return "NA";
    }
  } catch (error) {
    console.log("errors", error.message);
    return "NA";
  }
}

async function calculateTokenExpiry({
  automaticLogOut,
  customAutoLogout,
  rememberMe,
}) {
  // fallback env
  const expiresInDefault = process.env.JWT_EXPIRES_IN || "12h"; // string
  const expiresInRemember = process.env.JWT_REMEMBER_ME_EXPIRES_IN || "30d"; // string

  if (automaticLogOut === true) {
    // customAutoLogout priority
    if (customAutoLogout && Number(customAutoLogout) > 0) {
      return Number(customAutoLogout) * 60; // convert minutes → seconds
    }

    if (rememberMe === true || rememberMe === "true") {
      return expiresInRemember;
    }

    return expiresInDefault;
  }

  // automaticLogOut = false
  if (rememberMe === true || rememberMe === "true") {
    return expiresInRemember;
  }

  return expiresInDefault;
}

async function getPermanentDeleteBeforeDate(days = 30, timeZone) {
  try {
    const tz = timeZone && moment.tz.zone(timeZone) ? timeZone : "UTC"; // safe fallback

    const beforeDate = moment().tz(tz).subtract(days, "days").toDate();

    return beforeDate;
  } catch (error) {
    console.error("Error in getPermanentDeleteBeforeDate:", error.message);
    return "NA";
  }
}

// async function getPermanentDeleteBeforeDate(days = 30) {
//   try {
//     const ms = days * 24 * 60 * 60 * 1000;
//     const beforeDate = new Date(Date.now() - ms);
//     return beforeDate;
//   } catch (error) {
//     console.error("Error in getPermanentDeleteBeforeDate:", error.message);
//     return "NA";
//   }
// }

module.exports = {
  validateRequiredFields,
  generateOtp,
  generateRandomPassword,
  generateRandomString,
  capitalizeFirstLetter,
  hashPassword,
  comparePassword,
  dateFormat,
  currentDate,
  encoded,
  decoded,
  formatTime,
  timeAgo,
  createRecord,
  listDns,
  getDns,
  updateDns,
  deleteDns,
  abbreviationSmart,
  formatFileSize,
  getFileTypeDescription,
  encrypt,
  decrypt,
  encryptData,
  decryptData,
  encryptDataByKey,
  decryptDataByKey,
  encryptDataArr,
  decryptDataArr,
  getFiscalYear,
  getPTAmount,
  getPTDeductionForYear,
  getTDSAmount,
  calculateTokenExpiry,
  getPermanentDeleteBeforeDate,
};
