import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "@/firebase/firebase";
import { toast } from "react-toastify";
import emailjs from "@emailjs/browser";
import { subscriptionPlans } from "@/constants/subscriptionPlans";
import { isSubscriptionPaymentAllowed } from "@/utils/isSubscriptionPaymentAllowed";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const SubscriptionPage = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleSubscribe = async (plan: "bronze" | "silver" | "gold") => {
    if (!user) {
      toast.error("Login required");
      return;
    }

    // ⛔ Time restriction
    if (!isSubscriptionPaymentAllowed()) {
      toast.error("Payments allowed only between 10–11 AM IST");
      return;
    }

    const selected = subscriptionPlans[plan];

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
      amount: selected.amount * 100,
      currency: "INR",
      name: "Internship Subscription",
      description: `${plan.toUpperCase()} Plan`,
      handler: async function (response: any) {
        // Update user plan
        await setDoc(
          doc(db, "users", user.uid),
          {
            plan,
            monthlyApplyLimit: selected.limit,
            appliedThisMonth: 0,
            subscriptionStart: Timestamp.now(),
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

        // 📧 Invoice email
        await emailjs.send(
          "service_xxx",
          "template_xxx",
          {
            to_email: user.email,
            plan: plan.toUpperCase(),
            amount: `₹${selected.amount}`,
            limit:
              selected.limit === Infinity
                ? "Unlimited"
                : `${selected.limit} applications`,
          },
          "public_key_xxx"
        );

        toast.success("Subscription activated & invoice emailed");
      },
      theme: { color: "#2563eb" },
    };

    new window.Razorpay(options).open();
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Choose Subscription</h1>

      <button
        onClick={() => handleSubscribe("bronze")}
        className="btn w-full mb-3"
      >
        Bronze ₹100 — 3 applications
      </button>

      <button
        onClick={() => handleSubscribe("silver")}
        className="btn w-full mb-3"
      >
        Silver ₹300 — 5 applications
      </button>

      <button onClick={() => handleSubscribe("gold")} className="btn w-full">
        Gold ₹1000 — Unlimited
      </button>
    </div>
  );
};

export default SubscriptionPage;
