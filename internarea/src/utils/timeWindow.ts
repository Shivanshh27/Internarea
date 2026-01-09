export const isPaymentAllowedNow = () => {
  const now = new Date();

  // Convert to IST
  const istTime = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const hours = istTime.getHours();

  // Allow ONLY between 10:00 to 10:59 AM IST
  return hours === 10;
};
