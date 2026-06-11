require("dotenv").config();
const { S3, DeleteObjectsCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const logger = require("../helpers/loggerHelper");

let bucketName = "bw-project-management";
let accessKeyId, secretAccessKey;
if (process.env.SERVER !== "production") {
  console.log("env s3 config (dev)");
  accessKeyId = process.env.accessKeyId;
  secretAccessKey = process.env.secretAccessKey;
  bucketName = process.env.bucketName || bucketName;
} else {
  const s3Json = fs.readFileSync("/var/my-bw-auth/key.json", "utf8");
  const s3Config = JSON.parse(s3Json);
  accessKeyId = s3Config.website_s3_access_id;
  secretAccessKey = s3Config.website_s3_secret_key;
}
const s3 = new S3({
  region: process.env.region,
  credentials: { accessKeyId, secretAccessKey },
});

const deleteOnS3Middleware = async (keys) => {
  try {
    if (!keys) return { success: false, msg: ["No key provided"] };
    const keyArray = typeof keys === "string" ? [keys] : keys;
    if (!Array.isArray(keyArray) || keyArray.length === 0) {
      return { success: false, msg: ["Invalid key format"] };
    }
    const params = {
      Bucket: bucketName,
      Delete: {
        Objects: keyArray.map((k) => ({ Key: k })),
      },
    };
    const result = await s3.send(new DeleteObjectsCommand(params));
    const errors = result?.Errors || [];
    if (errors.length > 0) {
      logger.error("S3 Delete Errors:", { error: errors });
      return {
        success: false,
        msg: ["Some files failed to delete"],
        errors: errors.map((e) => ({
          key: e.Key,
          code: e.Code,
          message: e.Message,
        })),
      };
    }
    const deleted = result?.Deleted?.map((d) => d.Key) || [];
    logger.info("S3 Delete Success:", { deleted });
    return {
      success: true,
      msg: ["Files Deleted Successfully"],
      deleted,
    };
  } catch (error) {
    logger.error("S3 Delete Error", { error: error.message });
    return { success: false, msg: [error.message] };
  }
};
// (async () => {
//   await deleteOnS3Middleware(
//     "/WN-391987/20251114/images/1763122246352-154.png"
//   );
// })();

module.exports = deleteOnS3Middleware;
