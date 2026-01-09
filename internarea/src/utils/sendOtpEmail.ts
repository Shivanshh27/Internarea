import emailjs from "@emailjs/browser";

export const sendOtpEmail = async (email: string, otp: string) => {
  await emailjs.send(
    "service_xxx",
    "template_xxx",
    {
      to_email: email,
      otp,
    },
    "public_key_xxx"
  );
};
