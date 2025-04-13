"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
// import Navbar from "@/components/Navbar";

interface User {
  id: string;
  username: string;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  user: User;
}

interface Post {
  id: string;
  content: string;
  user: User;
  createdAt: string;
  comments: Comment[];
  showComments?: boolean;
}

export default function ProfilePage() {
  const { id: userId } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/profile?userId=${userId}`);
        if (!res.ok) throw new Error("Failed to fetch");

        const data = await res.json();
        setUser(data.user);
        setPosts(data.posts);
        setIsFollowing(data.isFollowing);
      } catch (err) {
        setError(true);
        console.error("Error fetching profile data:", err);
      }
    }

    fetchData();
  }, [userId]);

  const handleFollowToggle = async () => {
    try {
      const res = await fetch("/api/follow", {
        method: isFollowing ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ followingId: userId }),
      });

      if (res.ok) {
        setIsFollowing((prev) => !prev);
      } else {
        console.error("Failed to toggle follow state");
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };

  if (error) return notFound();
  if (!user) return <p className="text-white">Loading...</p>;

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <aside className="w-60 bg-gray-800 p-4 rounded-lg mr-4 h-fit sticky top-20">
        <nav className="flex flex-col gap-4 text-white">
          <Link href="/home" className="hover:text-blue-400">🏠 Home</Link>
          <Link href="/explore" className="hover:text-blue-400">🔍 Explore</Link>
          <Link href="/settings" className="hover:text-blue-400">⚙️ Settings</Link>
          <Link href="/notifications" className="hover:text-blue-400">🔔 Notifications</Link>
          <Link href="/messages" className="hover:text-blue-400">💬 Messages</Link>
        </nav>
      </aside>
      
      <div className="flex flex-col items-center p-4">
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Image
                src={user.image || "/default-avatar.webp"}
                alt={user.username}
                width={40}
                height={40}
                className="rounded-full"
              />
              <p className="font-bold text-lg">{user.username}</p>
            </div>

            {/* Follow/Unfollow Button */}
            <button
              onClick={handleFollowToggle}
              className={`px-4 py-2 rounded text-sm font-semibold transition ${isFollowing
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          </div>

          {posts.map((post: Post) => (
            <div key={post.id} className="bg-gray-800 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-3 mb-2">
                <Link href={`/profile/${post.user.id}`}>
                  <Image
                    src={post.user.image || "/default-avatar.webp"}
                    alt="User"
                    width={30}
                    height={30}
                    className="rounded-full cursor-pointer hover:opacity-80"
                  />
                </Link>
                <Link href={`/profile/${post.user.id}`}>
                  <p className="font-bold cursor-pointer hover:underline">
                    {post.user.username}
                  </p>
                </Link>
              </div>
              <p>{post.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
