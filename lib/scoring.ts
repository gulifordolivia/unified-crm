import { daysSince, daysUntil } from "@/lib/dates";

type AgentLeadScoreInput = {
  budget: number;
  intent: "Buyer" | "Seller" | "Investor";
  lastContactedAt: string;
  nextActionAt: string;
  stage: string;
};

type PreforeclosureScoreInput = {
  distressLevel: "Moderate" | "High" | "Critical";
  filingDate: string;
  auctionDate: string;
  estimatedEquity: number;
  outreachStatus: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function scoreAgentLead(input: AgentLeadScoreInput) {
  const stageWeight =
    {
      New: 14,
      Qualified: 22,
      Touring: 28,
      Negotiating: 35,
      Nurture: 10,
    }[input.stage] ?? 12;

  const intentWeight =
    {
      Buyer: 20,
      Seller: 24,
      Investor: 18,
    }[input.intent] ?? 16;

  const budgetWeight = Math.min(22, input.budget / 25000);
  const recencyPenalty = daysSince(input.lastContactedAt) * 3;
  const urgencyBoost = Math.max(0, 12 - Math.max(0, daysUntil(input.nextActionAt)));

  return clamp(stageWeight + intentWeight + budgetWeight + urgencyBoost - recencyPenalty);
}

export function scorePreforeclosureLead(input: PreforeclosureScoreInput) {
  const distressWeight =
    {
      Moderate: 26,
      High: 34,
      Critical: 42,
    }[input.distressLevel] ?? 24;

  const auctionUrgency = Math.max(0, 24 - Math.max(0, daysUntil(input.auctionDate)) * 2);
  const filingFreshness = Math.max(0, 18 - daysSince(input.filingDate));
  const equityWeight = Math.min(24, input.estimatedEquity / 10000);
  const outreachPenalty = input.outreachStatus === "Needs Skip Trace" ? 10 : 0;

  return clamp(distressWeight + auctionUrgency + filingFreshness + equityWeight - outreachPenalty);
}

export function scoreToPriority(score: number) {
  if (score >= 85) {
    return "Immediate";
  }

  if (score >= 70) {
    return "High";
  }

  if (score >= 50) {
    return "Active";
  }

  return "Monitor";
}
