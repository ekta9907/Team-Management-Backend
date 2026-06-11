const mongoose = require("mongoose");

/* ----------------------------- Social Links ----------------------------- */
const SocialLinkSchema = new mongoose.Schema(
  {
    twitter: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?twitter\.com\/.+$/, "Invalid Twitter URL"],
    },
    linkedin: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?linkedin\.com\/.+$/, "Invalid LinkedIn URL"],
    },
    facebook: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?facebook\.com\/.+$/, "Invalid Facebook URL"],
    },
    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, "Invalid Website URL"],
    },
    messenger: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?m\.me\/.+$/, "Invalid Messenger URL"],
    },
    service: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { _id: false }
);

/* ---------------------------- Daily Schedule ---------------------------- */
const DailyScheduleSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      required: true,
    },
    isWorkingDay: { type: Boolean, default: true },
    totalHours: { type: Number, default: 8 },
    startTime: { type: String },
    endTime: { type: String },
    breakStart: { type: String },
    breakEnd: { type: String },
  },
  { _id: false }
);

/* ----------------------------- User Schema ------------------------------ */
const UserSchema = new mongoose.Schema(
  {
    /* ---------- Login & Auth ---------- */
    loginType: { type: String, enum: ["app", "web", "google"], default: "web" },
    loginTypeFirst: {
      type: String,
      enum: ["app", "web", "google"],
      default: "web",
    },
    notificationStatus: { type: Number, default: 1 },
    socialId: { type: String, default: null },
    otp: { type: Number, default: null },
    otpVerify: { type: Number, enum: [0, 1], default: 0 },
    twoFactorAuth: {
      secret: { type: String, default: null },
      tempSecret: { type: String, default: null },
      tempSecretExpiresAt: { type: Date, default: null },
    },

    /* ---------- Organizational Info ---------- */
    workspaceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    unitId: [{ type: mongoose.Schema.Types.ObjectId, ref: "Unit" }],
    shiftId: { type: mongoose.Schema.Types.ObjectId, ref: "Shift" },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    roleName: { type: String, required: true },
    teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    designationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
      default: null,
    },
    designationName: { type: String, default: null },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
      default: null,
    },
    reportingManagerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    registeredById: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedById: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    /* ---------- Access & Permissions ---------- */
    accessLevel: [
      {
        lable: { type: String },
        levelName: { type: String },
        permissions: { type: [String], default: [] },
      },
    ],
    accessPreferenceLevel: [],

    /* ---------- Personal Details ---------- */
    name: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    uniqueId: { type: String, required: true, unique: true },
    empId: { type: String, unique: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    personalEmail: { type: String, trim: true },
    password: { type: String, default: null },
    showPassword: { type: String, default: null },
    phoneCode: { type: String, default: "+91" },
    mobileNumber: { type: String, trim: true },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      default: "Other",
    },
    dob: { type: Date, default: null },
    originalDob: { type: Date, default: null },
    fatherName: { type: String },
    motherName: { type: String },
    spouseName: { type: String, default: null },
    maritalStatus: {
      type: String,
      enum: ["Single", "Married"],
      default: "Single",
    },
    bloodGroup: { type: String, default: null },
    religion: { type: String, default: null },
    physicallyChallenged: { type: Number, default: 0, enum: [0, 1] },

    /* ---------- Contact & Address ---------- */
    address: { type: String, default: null },
    addressProof: { type: String, default: null },
    city: { type: String },
    state: { type: String },
    country: { type: String, default: "India" },
    countryName: { type: String, default: "India" },
    countryId: { type: String, default: null },
    countryCode: { type: String, default: null },
    pincode: { type: String, default: null },
    landMark: { type: String, default: null },
    pAddress: { type: String, default: null },
    pCity: { type: String, default: null },
    pState: { type: String, default: null },
    pCountryName: { type: String, default: "India" },
    pPincode: { type: String, default: null },
    privateNotes: { type: String },
    publicProfile: { type: String },

    /* ---------- Employment ---------- */
    joiningDate: { type: Date, default: null },
    relievingDate: { type: Date, default: null },
    relievingStatus: { type: Number, default: 0, enum: [0, 1] },
    jobTitle: { type: String, default: null },
    image: { type: String, default: null },
    officialNumber: { type: String, default: null },
    emergencyContactNumber: { type: String, default: null },

    /* ---------- HRMS / Payroll ---------- */
    salary: { type: Number, default: 0 },
    yearCTC: { type: Number, default: 0 },
    CTCStatus: { type: Number, default: 0 },
    pfEligibleStatus: { type: Number, default: 0, enum: [0, 1] },
    UAN: { type: String },
    pfNumber: { type: String },
    eSICNumber: { type: String },
    pFJoiningDate: { type: Date, default: null },
    pFExitDate: { type: Date, default: null },
    epsEligibleStatus: { type: Number, default: 0, enum: [0, 1] },
    ePSJoiningDate: { type: Date, default: null },
    ePSExitDate: { type: Date, default: null },
    ptStatus: { type: Number, default: 0, enum: [0, 1] },
    lwfEligibleStatus: { type: Number, default: 0, enum: [0, 1] },
    hPSEligibleStatus: { type: Number, default: 0, enum: [0, 1] },
    UPI: { type: String },
    aadhaarEnrollmentNumber: { type: String },
    aadharNumber: { type: String, default: null },
    aadharImage: { type: String, default: null },
    PANNumber: { type: String, default: null },
    PANImage: { type: String, default: null },

    /* ---------- Banking ---------- */
    bankName: { type: String, default: null },
    bankAccountNumber: { type: String, default: null },
    IFSCCode: { type: String, default: null },
    accountHolderName: { type: String, default: null },
    bankStatus: { type: Number, default: 0, enum: [0, 1] },

    /* ---------- System Flags ---------- */
    activeFlag: { type: Number, default: 1, enum: [0, 1] },
    approveFlag: { type: Number, default: 1, enum: [0, 1, 2] },
    deleteFlag: { type: Number, default: 0, enum: [0, 1] },
    deleteReason: { type: String, default: null },
    manualPunch: { type: Number, default: 0, enum: [0, 1] },
    showBirthAny: { type: Number, default: 0, enum: [0, 1] },
    profileComplete: { type: Number, default: 0, enum: [0, 1] },
    playerId: { type: String, default: "123456" },

    /* ---------- Documents ---------- */
    documentStatus: { type: Number, default: 0, enum: [0, 1] },
    documents: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        documentName: { type: String, default: null },
        documentFile: [],
        organizationName: { type: String, default: null },
        start: { type: Date, default: null },
        end: { type: Date, default: null },
        document: { type: String, default: null },
      },
    ],

    /* ---------- Preferences ---------- */
    languageId: { type: Number, default: 0 },
    dateFormat: { type: String, default: "YYYY-MM-DD" },
    timeFormat: { type: String, default: "HH:mm A" },
    timeZone: { type: String, default: "UTC" },
    calendarStart: {
      type: String,
      default: "Monday",
      enum: ["Monday", "Sunday"],
    },
    workingHours: { type: [DailyScheduleSchema], default: [] },
    social: SocialLinkSchema,
    billableRate: { type: Number, default: 0 },
    billableCost: { type: Number, default: 0 },

    /* ---------- Device Info ---------- */
    deviceType: { type: String, default: null },
    lastLoginTime: { type: Date, default: null },
  },
  { timestamps: true }
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

/* ---------- Export ---------- */
module.exports = mongoose.model("User", UserSchema);
