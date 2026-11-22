// Profit is computed on the backend from seller-entered costs. It is null when
// the seller hasn't entered enough cost data; we never show an estimate.

export type ProfitGoalProgress = {
  // Share of the goal reached, clamped to [0, 100] so losses and overshoot
  // still render as a valid ring
  percentage: number;
  remaining: number;
};

export function profitGoalProgress(
  profit: number,
  goalAmount: number | null | undefined,
): ProfitGoalProgress {
  const goal = goalAmount && goalAmount > 0 ? goalAmount : 0;
  const percentage =
    goal > 0 ? Math.min(Math.max((profit / goal) * 100, 0), 100) : 0;
  return { percentage, remaining: Math.max(goal - profit, 0) };
}

export function formatMoney(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}
