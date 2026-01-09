import { selectuser } from "@/Feature/Userslice";
import { ExternalLink, Mail, User, Shield } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/firebase/firebase";

const ProfilePage = () => {
  const user = useSelector(selectuser);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // 🔐 Fetch login history
  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      try {
        const q = query(
          collection(db, "loginHistory"),
          where("userId", "==", user.uid),
          orderBy("loginTime", "desc")
        );

        const snapshot = await getDocs(q);
        const logs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setLoginHistory(logs);
      } catch (error) {
        console.error("Failed to fetch login history", error);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="relative h-32 bg-gradient-to-r from-blue-500 to-blue-600">
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
              {user?.photo ? (
                <img
                  src={user.photo}
                  alt={user.name}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-16 pb-8 px-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
              <div className="mt-2 flex items-center justify-center text-gray-500">
                <Mail className="h-4 w-4 mr-2" />
                <span>{user?.email}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <span className="text-blue-600 font-semibold text-2xl">0</span>
                <p className="text-blue-600 text-sm mt-1">
                  Active Applications
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <span className="text-green-600 font-semibold text-2xl">0</span>
                <p className="text-green-600 text-sm mt-1">
                  Accepted Applications
                </p>
              </div>
            </div>

            {/* Login History Section */}
            <div className="mt-10">
              <div className="flex items-center mb-4">
                <Shield className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Login History
                </h2>
              </div>

              {loadingHistory ? (
                <p className="text-gray-500">Loading login history...</p>
              ) : loginHistory.length === 0 ? (
                <p className="text-gray-500">No login records found.</p>
              ) : (
                <div className="space-y-3">
                  {loginHistory.map((log) => (
                    <div
                      key={log.id}
                      className="border rounded-lg p-4 bg-gray-50"
                    >
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-700">
                        <p>
                          <strong>Browser:</strong> {log.browser}
                        </p>
                        <p>
                          <strong>OS:</strong> {log.os}
                        </p>
                        <p>
                          <strong>Device:</strong> {log.device}
                        </p>
                        <p>
                          <strong>IP:</strong> {log.ip}
                        </p>
                        <p>
                          <strong>Status:</strong>{" "}
                          <span
                            className={
                              log.status === "success"
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {log.status}
                          </span>
                        </p>
                        <p>
                          <strong>Reason:</strong> {log.reason}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(
                          log.loginTime.seconds * 1000
                        ).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-center pt-10">
              <Link
                href="/userapplication"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Applications
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
