import { doc, setDoc, Timestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth, db } from "@/firebase/firebase";
import { toast } from "react-toastify";
import { isPaymentAllowedNow } from "@/utils/timeWindow";
import emailjs from "@emailjs/browser";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const plans = {
  bronze: { amount: 100, limit: 3 },
  silver: { amount: 300, limit: 5 },
  gold: { amount: 1000, limit: Infinity },
};

const Subscribe = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handlePay = (plan: "bronze" | "silver" | "gold") => {
    if (!user) {
      toast.error("Login required");
      return;
    }

    // ⛔ Time restriction
    if (!isPaymentAllowedNow()) {
      toast.error("Payments allowed only between 10–11 AM IST");
      return;
    }

    const selected = plans[plan];

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
      amount: selected.amount * 100,
      currency: "INR",
      name: "Internship Subscription",
      description: `${plan.toUpperCase()} Plan`,
      handler: async function (response: any) {
        // Save user subscription
        await setDoc(
          doc(db, "users", user.uid),
          {
            plan,
            applyLimit: selected.limit,
            appliedCount: 0,
            isPremium: true,
            subscribedAt: Timestamp.now(),
          },
          { merge: true }
        );

        // Save payment
        await setDoc(doc(db, "payments", response.razorpay_payment_id), {
          userId: user.uid,
          plan,
          amount: selected.amount,
          status: "success",
          createdAt: Timestamp.now(),
        });

        // 📧 Send invoice email
        emailjs.send(
          "service_xxx",
          "template_xxx",
          {
            to_email: user.email,
            plan: plan.toUpperCase(),
            amount: `₹${selected.amount}`,
            limit: selected.limit === Infinity ? "Unlimited" : selected.limit,
          },
          "public_key_xxx"
        );

        toast.success("Payment successful. Invoice sent to email.");
      },
      theme: { color: "#2563eb" },
    };

    new window.Razorpay(options).open();
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Choose Plan</h1>

      <button onClick={() => handlePay("bronze")} className="btn">
        Bronze ₹100 — 3 applies
      </button>

      <button onClick={() => handlePay("silver")} className="btn mt-2">
        Silver ₹300 — 5 applies
      </button>

      <button onClick={() => handlePay("gold")} className="btn mt-2">
        Gold ₹1000 — Unlimited
      </button>
    </div>
  );
};

export default Subscribe;
