const { S3 } = require("@aws-sdk/client-s3");
const moment = require("moment");
const fs = require("fs");

// S3 Config
let accessKeyId,
  secretAccessKey,
  bucketName = "bw-project-management";

if (process.env.SERVER !== "production") {
  accessKeyId = process.env.accessKeyId;
  secretAccessKey = process.env.secretAccessKey;
  bucketName = process.env.bucketName || "bw-project-management";
} else {
  const s3Json = fs.readFileSync("/var/my-bw-auth/key.json", "utf8");
  const s3Config = JSON.parse(s3Json);
  accessKeyId = s3Config.website_s3_access_id;
  secretAccessKey = s3Config.website_s3_secret_key;
}

const s3 = new S3({
  region: process.env.region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

/**
 * Get S3 storage used (in MB/GB) for a tenant or date range.
 * @param {string|null} subdomain - (Optional) Tenant subdomain.
 * @param {string|null} startDate - (Optional) Start date in 'YYYY-MM-DD'.
 * @param {string|null} endDate - (Optional) End date in 'YYYY-MM-DD'.
 */
async function getTenantStorageSize(subdomain = null, startDate = null, endDate = null) {
  try {
    const prefix = subdomain ? `${subdomain}/` : ""; // null → all tenants
    let continuationToken;
    let totalSize = 0;

    const start = startDate ? moment(startDate) : null;
    const end = endDate ? moment(endDate) : null;

    do {
      const response = await s3.listObjectsV2({
        Bucket: bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });
      // console.log(`🧾 Found ${response.Contents.length} objects in current batch`);
      (response.Contents || []).forEach((object) => {
        const key = object.Key; // e.g., abc/20250807/images/file.jpg
        const parts = key.split("/");

        if (parts.length < 2) return;

        const dateStr = parts[1]; // 20250807
        if (!/^\d{8}$/.test(dateStr)) return;

        const fileDate = moment(dateStr, "YYYYMMDD");

        if (
          (!start && !end) || // No date filter
          (start && end && fileDate.isBetween(start, end, "day", "[]"))
        ) {
          totalSize += object.Size;
        }
      });

      continuationToken = response.IsTruncated ? response.NextContinuationToken : null;
    } while (continuationToken);

    return {
      tenant: subdomain || "All Tenants",
      from: startDate || "Start",
      to: endDate || "Now",
      sizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      sizeGB: (totalSize / (1024 * 1024 * 1024)).toFixed(2),
      totalBytes: totalSize,
    };
  } catch (error) {
    return {
      tenant: subdomain || "All Tenants",
      from: startDate || "Start",
      to: endDate || "Now",
      sizeMB: 0,
      sizeGB: 0,
      totalBytes: 0,
    };
  }
}

module.exports = { getTenantStorageSize };
