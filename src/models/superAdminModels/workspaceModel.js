const mongoose = require("mongoose");
const generateDefaultWeeklySchedule = () => {
  const defaultStart = "09:00";
  const defaultEnd = "18:00";
  const breakStart = "13:00";
  const breakEnd = "14:00";

  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return days.map((day) => ({
    day,
    isWorkingDay: day !== "Sunday", // Sunday non-working
    startTime: defaultStart,
    endTime: defaultEnd,
    breakStart,
    breakEnd,
    totalHours: "08:00",
  }));
};
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
    isWorkingDay: { type: Boolean, default: true },
    totalHours: { type: String }, // format: 'HH:mm'
    startTime: { type: String }, // format: 'HH:mm'
    endTime: { type: String },
    breakStart: { type: String }, // optional
    breakEnd: { type: String }, // optional
  },
  { _id: false },
);
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
      match: [/^https?:\/\/.+/, "Invalid Website URL"], // Accept any valid website
    },
    messenger: {
      type: String,
      trim: true,
      match: [/^https?:\/\/(www\.)?m\.me\/.+$/, "Invalid Messenger URL"],
    },
    service: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  { timestamps: false, _id: false },
);
const WorkspaceSchema = new mongoose.Schema(
  {
    workapaceNumber: { type: String, required: true, trim: true },
    workspaceName: { type: String, required: true, trim: true },
    workspaceUrl: { type: String, required: true, trim: true },
    workspaceDomain: { type: String, required: true, trim: true },
    workspaceFullDomain: { type: String, required: true, trim: true },
    workspaceEmail: { type: String, required: true, trim: true },
    dbName: { type: String, required: true },
    dbUserName: { type: String, required: true },
    dbPassword: { type: String, required: true },
    dbHost: { type: String, required: true },
    workspaceCurrency: { type: String, default: "$" },
    workspaceCurrencyName: { type: String, default: "USD" },
    industryId: { type: mongoose.Schema.Types.ObjectId, ref: "Industry" },
    countryId: { type: mongoose.Schema.Types.ObjectId, ref: "Country" },
    numberOfPeopleStart: { type: Number, required: false },
    numberOfPeopleEnd: { type: Number, required: false },
    numberOfSeats: { type: Number, required: false },
    designationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
    },
    dateFormat: { type: String, default: "YYYY-MM-DD" },
    timeFormat: { type: String, default: "HH:mm A" },
    timeZone: { type: String, default: "UTC" },
    workspaceLogo: { type: String, default: null },
    workspaceFavIcon: { type: String, default: null },
    employeeRange: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    calendarStart: {
      type: String,
      default: "Monday",
      enum: ["Monday", "Sunday"],
    },
    workingDays: {
      type: [DailyScheduleSchema],
      default: generateDefaultWeeklySchedule, // ✅ yaha default lagana zaroori hai
    },
    domainResult: { type: mongoose.Schema.Types.Mixed },
    // privateNotes: { type: String ,default: null},
    // publicProfile: { type: String, default: null},
    // social: SocialLinkSchema,
    siteNameOnLoginPage: {
      type: Boolean,
      default: false,
    },
    clientsView: {
      type: Boolean,
      default: false,
    },
    dashboardMessage: {
      type: String,
      default: null,
    },
    dashboardProjectList: {
      type: String,
      enum: ["Show all projects", "Show latest projects"],
      default: "Show all projects",
    },
    canShareFiles: {
      type: Boolean,
      default: true,
    },
    canUploadFiles: {
      type: Boolean,
      default: true,
    },
    allowReactions: {
      type: Boolean,
      default: true,
    },
    allowTags: {
      type: Boolean,
      default: true,
    },
    lockEditingOfTags: {
      type: Boolean,
      default: false,
    },
    cleanPastedHTML: {
      type: Boolean,
      default: true,
    },
    newlineMode: {
      type: Boolean,
      default: false,
    },

    projectHealthLabels: {
      type: [
        {
          key: { type: String },
          value: { type: String },
          color: { type: String },
        },
      ],
      default: [
        { label: "Not set", value: "Not set", color: "bg-gray-200" },
        { key: "good", value: "Good", color: "bg-green-100" }, // green
        { key: "at_risk", value: "At Risk", color: "bg-yellow-100" }, // amber/orange
        {
          key: "needs_attention",
          value: "Needs Attention",
          color: "bg-red-100",
        }, // red
      ],
    },

    automaticLogOut: {
      type: Boolean,
      default: false,
    },
    customAutoLogout: {
      type: Number,
      default: null,
    },
    allowTeamworkBrand: {
      type: Boolean,
      default: true,
    },
    allowCrossOrigin: {
      type: Boolean,
      default: true,
    },
    allowRememberMe: {
      type: Boolean,
      default: true,
    },
    AutomaticallyBillForNewUserAccounts: {
      type: Boolean,
      default: true,
    },

    // Email Settings
    useLogoInNotifications: {
      type: Boolean,
      default: true, // Email me logo dikhana hai ya nahi
    },
    fromAddressFormat: {
      type: String,
      enum: ["firstname lastname (installationName)", "emailOnly", "custom"], // Customize as needed
      default: "firstname lastname (installationName)",
    },
    defaultEmailUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Jo default user hoga jab sender match nahi ho
      default: null,
    },
    forwardedMessageOption: {
      type: String,
      enum: [
        "treatAsNormal", // We'll treat as normal message.
        "extractOriginal", // Extract original email
      ],
      default: "treatAsNormal", // Forwarded message ko original jaisa treat karna hai ya nahi
    },
    forwardedUserFallback: {
      type: String,
      enum: [
        "treatAsNormal", // Post as forwarded user
        "discard", // Or you could add discard if you want to ignore unmatched emails
      ],
      default: "treatAsNormal",
    },
    similarMessagesOption: {
      type: String,
      enum: ["groupBySubject", "alwaysNew"], // Try to group or always post new
      default: "alwaysNew",
    },
    logFailedEmails: {
      type: [String],
      default: [], // Jab tak koi email fail nahi hoti, khali array
    },
    checkName: {
      type: Boolean,
      default: true,
    },
    activeFlag: {
      type: Number,
      enum: [0, 1],
      default: 1,
    },
    deleteFlag: {
      type: Number,
      enum: [0, 1],
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Workspace", WorkspaceSchema);
