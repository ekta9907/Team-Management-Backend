const mongoose = require('mongoose');
const SITE_DB = require("../../configs/sitedbConfig");

const DeductionAndLeaveRuleSchema = new mongoose.Schema({
    policyRuleName:{type:String,required: true,default:'Policy'},
    shortLoginDeductions: [{

        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        start: {
          type: Number,  
          required: true,
        },
        end: {
          type: Number,  
          required: true,
        },
        deduction: {
          type: Number,  
          required: true,
        }
      }],
     
      unPlannedLeaveExtraDeduction:{type:Number,default:0.25},
      plannedLeaveApplyBeforeDays:{type:Number,default:1},
      sickLeavePaidUnpaidStatus:{type:Number,enum:[0,1],default:1},
      sickLeavePaidUnpaidStatus:{type:Number,enum:[0,1],default:1},
      leaveAmountCalMonthDaysStatus:{type:Number,enum:[0,1],default:1},
      totalAnnualPaidLeave:{type:Number,default:1},
      eachMonthPaidLeave:{type:Number,default:1},
      paidLeaveDay:{type:Number,default:1},
      skipPaidLeaveMonth:{type:[String],enum:['November','December']},
      carryForwordPaidLeaveStatus:{type:Number,default:1,enum:[0,1]},
      joiningDatePaidLeaveDeductions: [{
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        start: {
          type: Number,  
          required: true,
        },
        end: {
          type: Number,  
          required: true,
        },
        deduction: {
          type: Number,  
          required: true,
        }
      }],
      afterTwoYearExtraPaidLeave:{type:Number,default:0},
      initialThreeMonthPaidLeaveStatus:{type:Number,default:1,enum:[0,1]}, // 0 =no paid leave given 1= paid leave given
      maternityLeave:{type:Number,default:0}, 
      paternityLeave:{type:Number,default:0}, 
      weekOnceLeaveUnplanned:{type:Number,default:0,enum:[0,1]}, // 0 = only once day deduction in week  1= full week deduction

      activeFlag: { type: Number, default: 1 },
      deleteFlag: { type: Number, default: 0 }
    },{ timestamps: true });


module.exports = async (DB_NAME) => {
  const dbConnection = await SITE_DB(DB_NAME);
  if (dbConnection.models.DeductionAndLeaveRule) {
    return dbConnection.models.DeductionAndLeaveRule;
  }
  return dbConnection.model("DeductionAndLeaveRule", DeductionAndLeaveRuleSchema);
};