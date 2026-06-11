const cron = require("node-cron");
const {
  autoPermanentDeleteController,
} = require("../controllers/workspaceControllers/commenController");
const logger = require("../helpers/loggerHelper");
const workspaceModel = require("../models/superAdminModels/workspaceModel");

// Daily at 3 AM
cron.schedule("0 3 * * *", async () => {
  try {
    const workspaces = await workspaceModel.find(
      { deleteFlag: 0 },
      { dbName: 1, timeZone: 1 },
    );

    if (!workspaces || workspaces.length === 0) {
      return;
    }

    await Promise.allSettled(
      workspaces.map((ws) =>
        autoPermanentDeleteController(ws.dbName, ws.timeZone),
      ),
    );
  } catch (error) {
    logger.error("CRON: Auto permanent delete failed", {
      error: error.message,
      source: "projectAutoDelete.cron.js",
    });
  }
});
