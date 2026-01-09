import React, { useState } from "react";
import Link from "next/link";
import { auth, provider, db } from "../firebase/firebase";
import { signInWithPopup, signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import { Search } from "lucide-react";

import { useLanguage } from "@/context/LanguageContext";
import { generateOTP } from "@/utils/otpGenerator";
import { sendOtpEmail } from "@/utils/sendOtpEmail";
import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  Timestamp,
} from "firebase/firestore";

import { getLoginEnvironment } from "@/utils/getLoginEnvironment";
import { getUserIP } from "@/utils/getUserIP";
import { isMobileLoginAllowed } from "@/utils/isMobileLoginAllowed";

const Navbar = () => {
  const user = useSelector(selectuser);
  const { lang, setLang, t } = useLanguage();

  // OTP states (shared for language + chrome login)
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState("");

  /* ---------------- LOGIN LOGIC (TASK REQUIREMENT) ---------------- */

  const handlelogin = async () => {
    const env = getLoginEnvironment();
    const ip = await getUserIP();

    // ⛔ Mobile time restriction
    if (env.device === "Mobile" && !isMobileLoginAllowed()) {
      await addDoc(collection(db, "loginHistory"), {
        userId: "unknown",
        browser: env.browser,
        os: env.os,
        device: env.device,
        ip,
        status: "blocked",
        reason: "Mobile login outside 10AM–1PM",
        loginTime: Timestamp.now(),
      });

      toast.error("Mobile login allowed only between 10 AM and 1 PM");
      return;
    }

    try {
      const result = await signInWithPopup(auth, provider);
      const loggedUser = result.user;

      // 🔐 Chrome requires OTP
      if (env.browser === "Chrome") {
        const otp = generateOTP();

        await setDoc(doc(db, "emailOtps", loggedUser.uid), {
          otp,
          expiresAt: Timestamp.fromMillis(Date.now() + 5 * 60 * 1000),
          verified: false,
        });

        await sendOtpEmail(loggedUser.email!, otp);

        await addDoc(collection(db, "loginHistory"), {
          userId: loggedUser.uid,
          browser: env.browser,
          os: env.os,
          device: env.device,
          ip,
          status: "blocked",
          reason: "OTP required for Chrome login",
          loginTime: Timestamp.now(),
        });

        toast.info("OTP sent to email. Verify to complete login.");
        await signOut(auth); // block session until OTP verified
        return;
      }

      // ✅ Successful login (non-Chrome)
      await addDoc(collection(db, "loginHistory"), {
        userId: loggedUser.uid,
        browser: env.browser,
        os: env.os,
        device: env.device,
        ip,
        status: "success",
        reason: "Login allowed",
        loginTime: Timestamp.now(),
      });

      toast.success("Logged in successfully");
    } catch (error) {
      toast.error("Login failed");
    }
  };

  const handlelogout = async () => {
    await signOut(auth);
    toast.success("Logged out");
  };

  /* ---------------- LANGUAGE CHANGE (TASK 6 LOGIC) ---------------- */

  const handleLanguageChange = async (newLang: string) => {
    if (!user) {
      toast.error("Login required");
      return;
    }

    const userRef = doc(db, "users", user.uid);

    // 🔐 French requires OTP
    if (newLang === "fr" && !otpSent) {
      const otp = generateOTP();

      await setDoc(doc(db, "emailOtps", user.uid), {
        otp,
        expiresAt: Timestamp.fromMillis(Date.now() + 5 * 60 * 1000),
        verified: false,
      });

      await sendOtpEmail(user.email, otp);
      setOtpSent(true);
      toast.info("OTP sent to email for French language");
      return;
    }

    if (newLang === "fr" && otpSent) {
      const snap = await getDoc(doc(db, "emailOtps", user.uid));

      if (!snap.exists() || snap.data().otp !== otpInput) {
        toast.error("Invalid OTP");
        return;
      }
    }

    await setDoc(userRef, { language: newLang }, { merge: true });

    setLang(newLang);
    setOtpSent(false);
    setOtpInput("");
    toast.success("Language updated");
  };

  /* ---------------- UI ---------------- */

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-blue-600">
          <img src="/logo.png" alt="logo" className="h-14" />
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center space-x-8">
          <Link
            href="/internship"
            className="text-gray-700 hover:text-blue-600"
          >
            {t("internships")}
          </Link>
          <Link href="/job" className="text-gray-700 hover:text-blue-600">
            {t("jobs")}
          </Link>

          <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
            <Search size={16} className="text-gray-400" />
            <input
              className="ml-2 bg-transparent focus:outline-none text-sm"
              placeholder="Search..."
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* 🌐 Language Selector */}
          {user && (
            <div className="flex flex-col">
              <select
                value={lang}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="hi">Hindi</option>
                <option value="pt">Portuguese</option>
                <option value="zh">Chinese</option>
                <option value="fr">French</option>
              </select>

              {otpSent && (
                <input
                  className="border mt-1 px-2 py-1 text-sm"
                  placeholder="Enter OTP"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                />
              )}
            </div>
          )}

          {/* Auth */}
          {user ? (
            <>
              <Link href="/profile">
                <img
                  src={user.photo}
                  className="w-8 h-8 rounded-full"
                  alt="profile"
                />
              </Link>
              <button
                onClick={handlelogout}
                className="text-gray-700 hover:text-red-600"
              >
                {t("logout")}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handlelogin}
                className="border px-4 py-2 rounded hover:bg-gray-50"
              >
                Continue with Google
              </button>
              <Link href="/adminlogin" className="text-gray-600">
                Admin
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
