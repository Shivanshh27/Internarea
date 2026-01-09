import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "@/firebase/firebase";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { toast } from "react-toastify";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (!email) {
      toast.error("Email is required");
      return;
    }

    setLoading(true);

    try {
      const resetRef = doc(db, "passwordResets", email);
      const resetSnap = await getDoc(resetRef);

      // ⛔ Allow only once per day
      if (resetSnap.exists()) {
        const lastRequest = resetSnap.data().lastRequested.toDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (lastRequest >= today) {
          toast.warning("Password reset already requested today");
          setLoading(false);
          return;
        }
      }

      // ✅ Send reset email
      await sendPasswordResetEmail(auth, email);

      // ✅ Store reset request timestamp
      await setDoc(resetRef, {
        lastRequested: Timestamp.now(),
      });

      toast.success("Password reset email sent");
      setEmail("");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center text-black">
      <div className="border p-6 rounded w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Forgot Password</h2>

        <input
          type="email"
          placeholder="Enter your email"
          className="w-full border p-2 mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleReset}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          {loading ? "Sending..." : "Send Reset Email"}
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
