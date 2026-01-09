export const isSubscriptionPaymentAllowed = (): boolean => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);

  const hour = ist.getUTCHours();
  const minute = ist.getUTCMinutes();

  // Allowed: 10:00 AM ≤ time < 11:00 AM IST
  if (hour === 10) return true;
  if (hour === 11 && minute === 0) return false;

  return false;
};
