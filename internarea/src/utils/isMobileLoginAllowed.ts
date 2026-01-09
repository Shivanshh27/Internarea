export const isMobileLoginAllowed = () => {
  const now = new Date();
  const hours = now.getHours();

  return hours >= 10 && hours < 13; // 10 AM – 1 PM IST
};
