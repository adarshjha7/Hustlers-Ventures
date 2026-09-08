export interface PayoutStatus {
  status: "upcoming" | "processing";
  label: string;
  displayDate: string;
  dateObj: Date;
  daysLeft: number;
  message: string;
}

export const getPayoutStatus = (lastPayoutDateStr: string | null): PayoutStatus => {
  const now = new Date();
  const currentYear = now.getFullYear();

  const cycles = [
    new Date(currentYear, 0, 15),
    new Date(currentYear, 3, 15),
    new Date(currentYear, 6, 15),
    new Date(currentYear, 9, 15),
    new Date(currentYear - 1, 9, 15),
  ].sort((a, b) => a.getTime() - b.getTime());

  const passedCycles = cycles.filter(
    (d) => d.getTime() <= now.getTime() + 86400000 * 5
  );
  const mostRecentCycle = passedCycles[passedCycles.length - 1];

  let nextCycle = cycles.find((d) => d > now);
  if (!nextCycle) nextCycle = new Date(currentYear + 1, 0, 15);

  const lastDbDate = lastPayoutDateStr ? new Date(lastPayoutDateStr) : new Date(0);

  const isPaidInCycleMonth =
    lastDbDate.getMonth() === mostRecentCycle.getMonth() &&
    lastDbDate.getFullYear() === mostRecentCycle.getFullYear();

  const isPaid =
    isPaidInCycleMonth || lastDbDate.getTime() >= mostRecentCycle.getTime();

  if (!isPaid) {
    // If we're past the cycle date, show the 7-day grace period end as the expected date
    const gracePeriodEnd = new Date(mostRecentCycle);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);
    const isDelayed = now > mostRecentCycle;

    return {
      status: "processing",
      label: "Awaiting Payout",
      dateObj: isDelayed ? gracePeriodEnd : mostRecentCycle,
      displayDate: (isDelayed ? gracePeriodEnd : mostRecentCycle).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      daysLeft: 0,
      message: isDelayed ? "Expected by " + gracePeriodEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Disbursement in progress",
    };
  } else {
    return {
      status: "upcoming",
      label: "Next Payout",
      dateObj: nextCycle,
      displayDate: nextCycle.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      daysLeft: Math.ceil(
        (nextCycle.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      ),
      message: "Direct bank transfer",
    };
  }
};

export interface PayoutBannerInfo {
  show: boolean;
  expectedByLabel: string; // e.g. "22 April 2026"
  cycleLabel: string;      // e.g. "Apr 2026"
  cycleKey: string;        // e.g. "Apr_2026" - used as localStorage key suffix
}

/**
 * Returns whether to show a payout delay banner.
 * Shows when: today is past the 15th of a cycle month, the investor has no payment
 * recorded for that cycle yet, AND today is still within the 7-day grace window.
 * Auto-hides once a payment is recorded in Supabase OR after the grace period expires.
 */
export const getPayoutDelayBanner = (latestPaymentDateStr: string | null): PayoutBannerInfo => {
  const now = new Date();
  const currentYear = now.getFullYear();

  const cycles = [
    new Date(currentYear - 1, 9, 15), // Oct prev year (edge case)
    new Date(currentYear, 0, 15),     // Jan 15
    new Date(currentYear, 3, 15),     // Apr 15
    new Date(currentYear, 6, 15),     // Jul 15
    new Date(currentYear, 9, 15),     // Oct 15
  ].sort((a, b) => a.getTime() - b.getTime());

  // Most recent cycle that has already passed
  const mostRecentCycle = [...cycles].reverse().find(d => d <= now);
  if (!mostRecentCycle) return { show: false, expectedByLabel: '', cycleLabel: '', cycleKey: '' };

  // Grace window: cycle date + 7 days
  const gracePeriodEnd = new Date(mostRecentCycle);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 7);

  // Check if investor already received a payment this cycle month
  const lastDbDate = latestPaymentDateStr ? new Date(latestPaymentDateStr) : new Date(0);
  const isPaid =
    lastDbDate.getMonth() === mostRecentCycle.getMonth() &&
    lastDbDate.getFullYear() === mostRecentCycle.getFullYear();

  const show = !isPaid && now <= gracePeriodEnd;

  const cycleLabel = mostRecentCycle.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  const cycleKey = cycleLabel.replace(' ', '_'); // "Apr_2026"
  const expectedByLabel = gracePeriodEnd.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return { show, expectedByLabel, cycleLabel, cycleKey };
};

export const getNextPayoutDetails = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const payouts = [
    new Date(currentYear, 0, 15),
    new Date(currentYear, 3, 15),
    new Date(currentYear, 6, 15),
    new Date(currentYear, 9, 15),
  ];
  let nextDate = payouts.find((d) => d > now);
  if (!nextDate) nextDate = new Date(currentYear + 1, 0, 15);
  return {
    label: nextDate.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    }),
  };
};
