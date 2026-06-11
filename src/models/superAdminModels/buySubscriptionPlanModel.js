const mongoose = require("mongoose");

const BuySubscriptionPlanSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      required: true,
    },
    featureIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Feature",
        required: true,
      },
    ],
    subFeatures: [
      {
        subFeatureId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SubFeature",
          required: true,
        },
        keyName: {
          type: String,
          required: true,
        },
        value: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },
        valueType: {
          type: mongoose.Schema.Types.Mixed,
        },
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    subscriptionPlanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },
    subscriptionPlanIdType: {
      type: String,
      required: true,
      enum: ["Subscription-Plan", "Buy-Subscription-Plan"],
      default: "Subscription-Plan",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    transactionId: {
      type: String,
      required: true,
      default: null,
    },
    title: {
      type: String,
      required: true,
      enum: ["Free", "Deliver", "Grow", "Scale", "Enterprise"], // Or dynamic list
    },
    businessType: {
      type: String,
      enum: ["Individual ", "Business"],
      default: "Business",
    },
    planCategory: {
      type: String,
      required: true,
      default: "Free",
    },
    durationInDays: {
      type: Number,
      default: 7,
    },
    description: {
      type: String,
      required: true,
    },
    shortDescription: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    subTotalPrice: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    totalPrice: {
      type: Number,
      default: 0,
    },
    afterDiscountPrice: {
      type: Number,
      default: 0,
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    discountStartDate: {
      type: Date,
      default: null,
    },
    discountEndDate: {
      type: Date,
      default: null,
    },
    currency: {
      type: String,
      default: "USD",
    },
    currencySymbol: {
      type: String,
      default: "$",
    },
    url: {
      type: String,
      default: null,
    },
    users: {
      type: String,
      required: true,
      default: 1,
    },
    usersMax: {
      type: String,
      default: 1000000,
    },
    projects: {
      type: String,
      required: true,
      default: 1,
    },
    projectsMax: {
      type: String,
      required: true,
      default: 1000000,
    },
    clientsMax: {
      type: String,
      default: 1000000,
    },
    tasksMax: {
      type: String,
      default: 1000000,
    },
    numberOfSeats: {
      type: String,
      default: 1,
    },
    storage: {
      type: String,
      required: true,
      default: 1,
    },
    most_popular: {
      type: Boolean,
      default: false,
    },
    by_index: {
      type: Number,
      default: 1,
    },
    activeFlag: {
      type: Number,
      default: 1,
      enum: [0, 1],
    },
    deleteFlag: {
      type: Number,
      default: 0,
      enum: [0, 1],
    },
    activeStatus: {
      type: Number,
      default: 1,
      enum: [0, 1, 2, 3], //0=pending,1=active,2=cancel auto renew ,3-expire
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "BuySubscriptionPlan",
  BuySubscriptionPlanSchema,
);
