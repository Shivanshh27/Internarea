import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/firebase/firebase";
import { toast } from "react-toastify";
import { generateOTP } from "@/utils/otpGenerator";
import { sendOtpEmail } from "@/utils/sendOtpEmail";

declare global {
  interface Window {
    Razorpay: any;
  }
}

const ResumePage = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Resume form
  const [name, setName] = useState("");
  const [qualification, setQualification] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");

  // OTP
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        toast.error("Please login first");
        setLoading(false);
        return;
      }

      setUser(u);

      const userRef = doc(db, "users", u.uid);
      const snap = await getDoc(userRef);

      if (!snap.exists()) {
        await setDoc(userRef, {
          name: u.displayName || "",
          email: u.email || "",
          plan: "free",
          hasResume: false,
          resumeId: null,
          createdAt: Timestamp.now(),
        });
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 🔹 Send OTP
  const sendOtp = async () => {
    if (!user?.email) {
      toast.error("Email not found");
      return;
    }

    const otp = generateOTP();

    await setDoc(doc(db, "emailOtps", user.uid), {
      otp,
      verified: false,
      expiresAt: Timestamp.fromMillis(Date.now() + 5 * 60 * 1000),
    });

    await sendOtpEmail(user.email, otp);
    setOtpSent(true);

    toast.success("OTP sent to email");
  };

  // 🔹 Verify OTP
  const verifyOtp = async () => {
    const ref = doc(db, "emailOtps", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      toast.error("OTP expired");
      return false;
    }

    const data = snap.data();

    if (data.otp !== otpInput) {
      toast.error("Invalid OTP");
      return false;
    }

    if (data.expiresAt.toMillis() < Date.now()) {
      toast.error("OTP expired");
      return false;
    }

    await updateDoc(ref, { verified: true });
    toast.success("OTP verified");
    return true;
  };

  // 🔹 Razorpay + Resume creation
  const openPayment = async () => {
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
      amount: 50 * 100,
      currency: "INR",
      name: "Resume Builder",
      description: "Resume Generation Fee",
      handler: async () => {
        await createResume();
      },
      theme: { color: "#2563eb" },
    };

    new window.Razorpay(options).open();
  };

  // 🔹 Final flow handler
  const handleResumeFlow = async () => {
    if (!name || !qualification || !experience || !skills) {
      toast.error("Please fill all fields");
      return;
    }

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.data()?.plan === "free") {
      toast.error("Upgrade plan to generate resume");
      return;
    }

    if (!otpSent) {
      await sendOtp();
      return;
    }

    const valid = await verifyOtp();
    if (!valid) return;

    await openPayment();
  };

  // 🔹 Create resume
  const createResume = async () => {
    const resumeRef = await addDoc(collection(db, "resumes"), {
      userId: user.uid,
      name,
      qualification,
      experience,
      skills,
      createdAt: Timestamp.now(),
    });

    await updateDoc(doc(db, "users", user.uid), {
      hasResume: true,
      resumeId: resumeRef.id,
    });

    toast.success("Resume created successfully");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Resume Builder</h1>

      <input
        className="border p-2 w-full mb-2"
        placeholder="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="border p-2 w-full mb-2"
        placeholder="Qualification"
        value={qualification}
        onChange={(e) => setQualification(e.target.value)}
      />
      <input
        className="border p-2 w-full mb-2"
        placeholder="Experience"
        value={experience}
        onChange={(e) => setExperience(e.target.value)}
      />
      <input
        className="border p-2 w-full mb-2"
        placeholder="Skills"
        value={skills}
        onChange={(e) => setSkills(e.target.value)}
      />

      {otpSent && (
        <input
          className="border p-2 w-full mb-2"
          placeholder="Enter OTP"
          value={otpInput}
          onChange={(e) => setOtpInput(e.target.value)}
        />
      )}

      <button
        onClick={handleResumeFlow}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {!otpSent ? "Send OTP" : "Verify OTP & Pay ₹50"}
      </button>
    </div>
  );
};

export default ResumePage;
