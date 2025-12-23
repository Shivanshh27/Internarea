import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/firebase/firebase";
import { toast } from "react-toastify";

const PostForm = () => {
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // ✅ Wait for Firebase Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  const handlePost = async () => {
    if (!user) {
      toast.error("Please login first");
      return;
    }

    if (!mediaUrl) {
      toast.error("Media URL is required");
      return;
    }

    setLoading(true);

    try {
      const uid = user.uid;
      console.log("UID:", uid);
      console.log("Project:", db.app.options.projectId);

      // 🔥 AUTO-CREATE USER PROFILE IF MISSING
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName || "User",
          friendsCount: 2, // default
          createdAt: Timestamp.now(),
        });
      }

      const finalUserSnap = await getDoc(userRef);
      const friendsCount = finalUserSnap.data()?.friendsCount || 0;

      // ✅ Determine daily post limit
      let maxPosts = 1;
      if (friendsCount === 2) maxPosts = 2;
      if (friendsCount > 10) maxPosts = Infinity;

      // ✅ Count today's posts
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const q = query(
        collection(db, "posts"),
        where("userId", "==", uid),
        where("createdAt", ">=", Timestamp.fromDate(startOfDay))
      );

      const snapshot = await getDocs(q);

      if (snapshot.size >= maxPosts) {
        toast.error("Daily post limit reached");
        setLoading(false);
        return;
      }

      // ✅ Create post
      await addDoc(collection(db, "posts"), {
        userId: uid,
        caption,
        mediaUrl,
        createdAt: Timestamp.now(),
        likesCount: 0,
      });

      toast.success("Post created successfully");
      setCaption("");
      setMediaUrl("");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border p-4 rounded mb-4 text-black" >
      <input
        type="text"
        placeholder="Caption"
        className="w-full border p-2 mb-2"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />

      <input
        type="text"
        placeholder="Image / Video URL"
        className="w-full border p-2 mb-2"
        value={mediaUrl}
        onChange={(e) => setMediaUrl(e.target.value)}
      />

      <button
        onClick={handlePost}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        {loading ? "Posting..." : "Post"}
      </button>
    </div>
  );
};

export default PostForm;
