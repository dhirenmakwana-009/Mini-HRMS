import "dotenv/config";
import connectDb from "../src/utils/db.js";
import { Attendance } from "../models/attendance.model.js";
import { Organization } from "../models/organization.model.js";
import { policyFor, statusForSeconds } from "../src/utils/attendance.js";

await connectDb();
const organizations = await Organization.find().lean();
const policies = new Map(organizations.map((organization) => [organization._id.toString(), policyFor(organization)]));
const records = await Attendance.find({ policySnapshot: { $exists: false } });
for (const record of records) {
  const policy = policies.get(record.organization.toString());
  record.policySnapshot = policy;
  if (record.status === "completed") record.attendanceStatus = statusForSeconds(record.totalWorkedSeconds || 0, policy);
  else if (record.status === "working") record.attendanceStatus = "in_progress";
  await record.save();
}
console.log(`Backfilled ${records.length} attendance record(s).`);
process.exit(0);
