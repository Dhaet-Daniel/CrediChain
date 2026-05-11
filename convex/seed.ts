import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("credentials").first();
    if (existing) return;

    const credentials = [
      {
        studentName: "John Doe",
        institution: "University of Excellence",
        degree: "B.Sc. Computer Science",
        issueDate: "2023-05-20",
        hash: "0x7a8b9c1d2e3f4g5h6i7j8k9l0m1n2o3p",
        status: "active" as const,
      },
      {
        studentName: "Jane Smith",
        institution: "Global Institute of Technology",
        degree: "M.A. Digital Arts",
        issueDate: "2022-11-15",
        hash: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p",
        status: "active" as const,
      },
      {
        studentName: "Robert Johnson",
        institution: "State University",
        degree: "B.A. Economics",
        issueDate: "2021-06-10",
        hash: "0xdeadbeef1234567890abcdef12345678",
        status: "active" as const,
      }
    ];

    for (const cred of credentials) {
      await ctx.db.insert("credentials", cred);
    }
  },
});
