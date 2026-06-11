const mongoose = require("mongoose");

const SubscriptionPlanSchema = new mongoose.Schema(
  {
    featureIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Feature",
        required: true,
      },
    ],
    subFeatures: [
      {
        featureId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Feature",
          required: true,
        },
        subFeatureId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "SubFeature",
          required: true,
        },

        value: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },
        keyName: {
          type: String,
          required: true,
        },
        valueType: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },
      },
    ],
    url: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      required: true,
      // enum: ["Free", "Deliver", "Grow", "Scale", "Enterprise"], // Or dynamic list
      default: "Free",
    },
    businessType: {
      type: String,
      enum: ["Individual ", "Business"],
      default: "Business",
      required: true,
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
    users: {
      type: Number,
      required: true,
      default: 1,
    },
    projects: {
      type: Number,
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
    showFlag: {
      type: Number,
      default: 0,
      enum: [0, 1],
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
  },
  { timestamps: true },
);
SubscriptionPlanSchema.virtual("afterDiscountPrice").get(function () {
  const now = new Date();

  const isInDiscountPeriod =
    this.discountStartDate &&
    this.discountEndDate &&
    now >= this.discountStartDate &&
    now <= this.discountEndDate;

  if (isInDiscountPeriod && this.discountPercentage > 0) {
    return (this.price - (this.price * this.discountPercentage) / 100).toFixed(
      2,
    );
  }

  return this.price;
});
SubscriptionPlanSchema.set("toObject", { virtuals: true });
SubscriptionPlanSchema.set("toJSON", { virtuals: true });
module.exports = mongoose.model("SubscriptionPlan", SubscriptionPlanSchema);
