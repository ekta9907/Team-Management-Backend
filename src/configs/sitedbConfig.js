const mongoose = require("mongoose");
const connections = {};
const SITE_DB = (dbName) => {
  return new Promise((resolve, reject) => {
    if (connections[dbName]) {
      return resolve(connections[dbName]);
    }

    const db_status = process.env.NODE_ENV === "development" ? "development" : "production";
    const baseUri = db_status === "production" ? process.env.DB_URL_SITE_PROD : process.env.DB_URL_SITE;
    const fullUri = `${baseUri}${dbName}?authSource=admin`;

    const connection = mongoose.createConnection(fullUri);

    connection.on("connected", () => {
      console.log(`MongoDB connected to ${dbName}`);
      connections[dbName] = connection;
      resolve(connection);
    });

    connection.on("error", (error) => {
      console.error(`Connection to ${dbName} failed:`, error.message);
      reject(error);
    });
  });
};

module.exports = SITE_DB;
