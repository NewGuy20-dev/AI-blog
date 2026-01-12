import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Clean up expired lockdown challenges every 5 minutes
crons.interval(
  "cleanup expired challenges",
  { minutes: 5 },
  internal.security.cleanupExpiredChallenges
);

export default crons;
