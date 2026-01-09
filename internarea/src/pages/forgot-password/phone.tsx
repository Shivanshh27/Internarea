import { useState } from "react";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { toast } from "react-toastify";
import { generateOTP } from "@/utils/otpGenerator";

const PhoneReset = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    if (!phone) {
      toast.error("Phone number required");
      return;
    }

    setLoading(true);

    try {
      const ref = doc(db, "phoneOtps", phone);
      const snap = await getDoc(ref);

      // ⛔ Allow OTP only once per day
      if (snap.exists()) {
        const last = snap.data().createdAt.toDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (last >= today) {
          toast.warning("OTP already sent today");
          setLoading(false);
          return;
        }
      }

      const otp = generateOTP();

      await setDoc(ref, {
        otp,
        createdAt: Timestamp.now(),
      });

      // Internship-safe: show OTP instead of SMS
      setGeneratedOtp(otp);
      setStep(2);

      toast.success("OTP generated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = () => {
    if (otp === generatedOtp) {
      toast.success("OTP verified successfully");
    } else {
      toast.error("Invalid OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center text-black">
      <div className="border p-6 rounded w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Reset via Phone</h2>

        {step === 1 && (
          <>
            <input
              type="tel"
              placeholder="Enter phone number"
              className="w-full border p-2 mb-4"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <button
              onClick={sendOtp}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded w-full"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <p className="mb-2 text-sm text-gray-600">
              Demo OTP (for testing): <b>{generatedOtp}</b>
            </p>

            <input
              type="text"
              placeholder="Enter OTP"
              className="w-full border p-2 mb-4"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <button
              onClick={verifyOtp}
              className="bg-green-600 text-white px-4 py-2 rounded w-full"
            >
              Verify OTP
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PhoneReset;
