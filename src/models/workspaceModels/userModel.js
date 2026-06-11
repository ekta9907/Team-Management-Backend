const mongoose = require("mongoose");
const SITE_DB = require("../../configs/sitedbConfig");

/* ----------------------------- Social Links ----------------------------- */
const SocialLinkSchema = new mongoose.Schema(
  {
    twitter: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?twitter\.com\/.+$/, "Invalid Twitter URL"],
    }, // optional
    linkedin: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?linkedin\.com\/.+$/, "Invalid LinkedIn URL"],
    }, // optional
    facebook: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?facebook\.com\/.+$/, "Invalid Facebook URL"],
    }, // optional
    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, "Invalid Website URL"],
    }, // optional
    messenger: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?m\.me\/.+$/, "Invalid Messenger URL"],
    }, // optional
    service: { type: String, trim: true, maxlength: 500, default: "" }, // optional
  },
  { _id: false },
);

/* ---------------------------- Daily Schedule ---------------------------- */
const DailyScheduleSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      required: true,
    },
    isWorkingDay: { type: Boolean, default: true }, // optional
    totalHours: { type: Number, default: 8 }, // optional
    startTime: { type: String }, // optional
    endTime: { type: String }, // optional
    breakStart: { type: String }, // optional
    breakEnd: { type: String }, // optional
  },
  { _id: false },
);

/* ----------------------------- User Schema ------------------------------ */
const UserSchema = new mongoose.Schema(
  {
    /* ---------- Login & Auth ---------- */
    loginType: { type: String, enum: ["app", "web", "google"], default: "web" }, // optional
    loginTypeFirst: {
      type: String,
      enum: ["app", "web", "google"],
      default: "web",
    }, // optional
    notificationStatus: { type: Number, default: 1 }, // optional
    socialId: { type: String, default: null }, // optional
    otp: { type: Number, default: null }, // optional
    otpVerify: { type: Number, enum: [0, 1], default: 0 }, // optional
    twoFactorAuth: {
      secret: { type: String, default: null }, // optional
      tempSecret: { type: String, default: null }, // optional
      tempSecretExpiresAt: { type: Date, default: null }, // optional
    }, // optional

    /* ---------- Organizational Info ---------- */
    workspaceId: { type: mongoose.Schema.Types.ObjectId, default: null }, // optional
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" }, // optional
    unitId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Unit" }], // optional
    shiftId: { type: mongoose.Schema.Types.ObjectId, ref: "Shift" }, // optional
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    }, // required
    roleName: { type: String, required: true }, // required
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" }, // optional
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" }, // optional
    designationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
      default: null,
    }, // optional
    designationName: { type: String, default: null }, // optional
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
      default: null,
    }, // optional
    reportingManagerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    }, // optional
    registeredById: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional
    approvedById: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional
    privateNotes: { type: String },
    publicProfile: { type: String },

    /* ---------- Access & Permissions ---------- */
    accessLevel: [
      {
        lable: { type: String }, // optional
        levelName: { type: String }, // optional
        permissions: { type: [String], default: [] }, // optional
      },
    ],
    accessPreferenceLevel: [], // optional

    /* ---------- Personal Details ---------- */
    name: { type: String, required: true }, // required
    firstName: { type: String, required: true, trim: true }, // required
    lastName: { type: String, required: true, trim: true }, // required
    uniqueId: { type: String, required: true, unique: true }, // required
    empId: { type: String, unique: true }, // optional
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    }, // required
    personalEmail: { type: String, trim: true }, // optional
    password: { type: String, default: null }, // optional
    showPassword: { type: String, default: null }, // optional
    rememberMe: { type: Boolean, default: false }, // optional
    phoneCode: { type: String, default: "+91" }, // optional
    mobileNumber: { type: String, trim: true }, // optional
    officePhone: { type: String, trim: true }, // optional
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Other",
    }, // optional
    dob: { type: Date, default: null }, // optional
    originalDob: { type: Date, default: null }, // optional
    fatherName: { type: String }, // optional
    motherName: { type: String }, // optional
    spouseName: { type: String, default: null }, // optional
    maritalStatus: {
      type: String,
      enum: ["Single", "Married"],
      default: "Single",
    }, // optional
    bloodGroup: { type: String, default: null }, // optional
    religion: { type: String, default: null }, // optional
    physicallyChallenged: { type: Number, default: 0, enum: [0, 1] }, // optional

    /* ---------- Contact & Address ---------- */
    address: { type: String, default: null }, // optional
    addressProof: { type: String, default: null }, // optional
    city: { type: String }, // optional
    state: { type: String }, // optional
    country: { type: String, default: "India" }, // optional
    countryName: { type: String, default: "India" }, // optional
    countryId: { type: String, default: null }, // optional
    countryCode: { type: String, default: null }, // optional
    pincode: { type: String, default: null }, // optional
    landMark: { type: String, default: null }, // optional
    pAddress: { type: String, default: null }, // optional
    pCity: { type: String, default: null }, // optional
    pState: { type: String, default: null }, // optional
    pCountry: { type: String, default: "India" }, // optional
    pPincode: { type: String, default: null }, // optional
    pLandMark: { type: String, default: null }, // optional

    /* ---------- Employment ---------- */
    joiningDate: { type: Date, default: null }, // optional
    relievingDate: { type: Date, default: null }, // optional
    relievingStatus: { type: Number, default: 0, enum: [0, 1] }, // optional
    jobTitle: { type: String, default: null }, // optional
    image: { type: String, default: null }, // optional
    officialNumber: { type: String, default: null }, // optional
    emergencyContactNumber: { type: String, default: null }, // optional

    /* ---------- HRMS / Payroll ---------- */
    salary: { type: Number, default: 0 }, // optional
    yearCTC: { type: Number, default: 0 }, // optional
    CTCStatus: { type: Number, default: 0 }, // optional
    pfEligibleStatus: { type: Number, default: 0, enum: [0, 1] }, // optional
    UAN: { type: String }, // optional
    pfNumber: { type: String }, // optional
    eSICNumber: { type: String }, // optional
    pFJoiningDate: { type: Date, default: null }, // optional
    pFExitDate: { type: Date, default: null }, // optional
    epsEligibleStatus: { type: Number, default: 0, enum: [0, 1] }, // optional
    ePSJoiningDate: { type: Date, default: null }, // optional
    ePSExitDate: { type: Date, default: null }, // optional
    ptStatus: { type: Number, default: 0, enum: [0, 1] }, // optional
    lwfEligibleStatus: { type: Number, default: 0, enum: [0, 1] }, // optional
    hPSEligibleStatus: { type: Number, default: 0, enum: [0, 1] }, // optional
    UPI: { type: String }, // optional
    aadhaarEnrollmentNumber: { type: String }, // optional
    aadharNumber: { type: String, default: null }, // optional
    aadharImage: { type: String, default: null }, // optional
    PANNumber: { type: String, default: null }, // optional
    PANImage: { type: String, default: null }, // optional

    /* ---------- Banking ---------- */
    bankName: { type: String, default: null }, // optional
    bankAccountNumber: { type: String, default: null }, // optional
    IFSCCode: { type: String, default: null }, // optional
    accountHolderName: { type: String, default: null }, // optional
    bankStatus: { type: Number, default: 0, enum: [0, 1] }, // optional

    /* ---------- System Flags ---------- */
    activeFlag: { type: Number, default: 1, enum: [0, 1] }, // optional
    approveFlag: { type: Number, default: 1, enum: [0, 1, 2] }, // optional
    deleteFlag: { type: Number, default: 0, enum: [0, 1] }, // optional
    deleteReason: { type: String, default: null }, // optional
    manualPunch: { type: Number, default: 0, enum: [0, 1] }, // optional
    showBirthAny: { type: Number, default: 0, enum: [0, 1] }, // optional
    profileComplete: { type: Number, default: 0, enum: [0, 1] }, // optional
    playerId: { type: String, default: "123456" }, // optional

    /* ---------- Documents ---------- */
    documentStatus: { type: Number, default: 0, enum: [0, 1] }, // optional
    documents: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // optional
        documentName: { type: String, default: null }, // optional
        documentFile: [], // optional
        organizationName: { type: String, default: null }, // optional
        start: { type: Date, default: null }, // optional
        end: { type: Date, default: null }, // optional
        document: { type: String, default: null }, // optional
      },
    ],

    /* ---------- Preferences ---------- */
    languageId: { type: Number, default: 0 }, // optional
    dateFormat: { type: String, default: "YYYY-MM-DD" }, // optional
    timeFormat: { type: String, default: "HH:mm A" }, // optional
    timeZone: { type: String, default: "UTC" }, // optional
    calendarStart: {
      type: String,
      default: "Monday",
      enum: ["Monday", "Sunday"],
    }, // optional
    workingHours: { type: [DailyScheduleSchema], default: [] }, // optional
    social: SocialLinkSchema, // optional
    billableRate: { type: Number, default: 0 }, // optional
    billableCost: { type: Number, default: 0 }, // optional

    /* ---------- Device Info ---------- */
    deviceType: { type: String, default: null }, // optional
    lastLoginTime: { type: Date, default: null }, // optional
  },
  { timestamps: true },
);

/* ---------- Format documents on JSON output ---------- */
UserSchema.set("toJSON", {
  transform: (doc, ret) => {
    if (ret.documents) {
      ret.documents.forEach((d) => {
        d.start = d.start ? d.start.toISOString().split("T")[0] : null;
        d.end = d.end ? d.end.toISOString().split("T")[0] : null;
      });
    }
    return ret;
  },
});

module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.User) {
    return dbConnection.models.User;
  }
  return dbConnection.model("User", UserSchema);
};
