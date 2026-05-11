import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  credentials: defineTable({
    studentName: v.string(),
    institution: v.string(),
    degree: v.string(),
    issueDate: v.string(),
    hash: v.string(), // The "blockchain" hash
    status: v.union(v.literal("active"), v.literal("revoked")),
    metadata: v.optional(v.any()),
  }).index("by_student", ["studentName"])
    .index("by_hash", ["hash"]),
  
  verifications: defineTable({
    credentialId: v.id("credentials"),
    verifierName: v.string(),
    timestamp: v.number(),
    result: v.boolean(),
  }).index("by_credential", ["credentialId"]),
});
