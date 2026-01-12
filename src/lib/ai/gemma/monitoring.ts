import { GenerationMetrics } from "./generator";

interface QuotaState {
  dailyRequests: number;
  lastResetDate: string;
}

let quotaState: QuotaState = {
  dailyRequests: 0,
  lastResetDate: new Date().toDateString(),
};

const DAILY_LIMIT = 14400;

export function trackApiCall(): { allowed: boolean; remaining: number } {
  const today = new Date().toDateString();
  if (quotaState.lastResetDate !== today) {
    quotaState = { dailyRequests: 0, lastResetDate: today };
  }

  if (quotaState.dailyRequests >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  quotaState.dailyRequests++;
  return { allowed: true, remaining: DAILY_LIMIT - quotaState.dailyRequests };
}

export function getQuotaStatus() {
  return {
    used: quotaState.dailyRequests,
    remaining: DAILY_LIMIT - quotaState.dailyRequests,
    limit: DAILY_LIMIT,
  };
}

export function logGeneration(topic: string, metrics: GenerationMetrics, success: boolean) {
  if (process.env.NODE_ENV === 'development') {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      event: "blog_generation",
      topic,
      success,
      ...metrics,
      quota: getQuotaStatus(),
    }));
  }
}
