import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("credentials").order("desc").collect();
  },
});

export const getByHash = query({
  args: { hash: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("credentials")
      .withIndex("by_hash", (q) => q.eq("hash", args.hash))
      .first();
  },
});
