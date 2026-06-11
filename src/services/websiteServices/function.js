const workspaceModel = require("../../models/superAdminModels/workspaceModel");
module.exports = {
  //===========================workspace
  async WORKSPACENUMBER(workspaceId) {
    try {
      const existing = await workspaceModel.findOne({
        _id: workspaceId,
        deleteFlag: 0,
      });
      if (existing) {
        return existing;
      } else {
        return "NA";
      }
    } catch (error) {
      console.error("Error in WORKSPACENUMBER:", error);
      throw error;
    }
  },
};
