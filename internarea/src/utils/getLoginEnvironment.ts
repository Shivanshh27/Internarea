export const getLoginEnvironment = () => {
  const ua = navigator.userAgent;

  let browser = "Unknown";
  if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari")) browser = "Safari";

  let os = "Unknown";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone")) os = "iOS";
  else if (ua.includes("Mac")) os = "macOS";

  let device = "Desktop";
  if (/Android|iPhone|iPad/i.test(ua)) device = "Mobile";

  return { browser, os, device };
};
