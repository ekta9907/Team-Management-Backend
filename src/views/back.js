async CheckServer(SITE_DB_NAME) {
    const { exec } = require("child_process");

    try {
      const admin = mongoose.connection.db.admin();
      const pingResult = await admin.ping();

      if (pingResult.ok === 1) {
        console.log("✅ MongoDB connection is healthy");
        return true;
      } else {
        exec("sudo systemctl restart mongod", (error, stdout, stderr) => {
          if (error) {
            console.error(`Error restarting MongoDB: ${error.message}`);
            return;
          }
          if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
          console.log("✅ MongoDB restarted successfully");
        });

        console.error("❌ Error MongoDB connection is:", error.message);
        throw error;
      }
    } catch (error) {
      exec("sudo systemctl restart mongod", (error, stdout, stderr) => {
        if (error) {
          console.error(`Error restarting MongoDB: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`stderr: ${stderr}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.log("✅ MongoDB restarted successfully");
      });
      console.error("❌ Error MongoDB connection is:", error.message);
      throw error;
    }
  },