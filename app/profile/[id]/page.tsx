"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

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

  const handleMessage = async () => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = `/messages/${data.conversationId}`;
      } else {
        console.error('Failed to start conversation');
      }
    } catch (err) {
      console.error('Error starting conversation:', err);
    }
  };

  if (error) return notFound();
  if (!user) return <p className="text-white">Loading...</p>;

  return (
    <div className="flex bg-gray-900 text-white min-h-screen">
      {/* Sidebar Navbar */}
      <aside className="w-64 bg-gray-800 p-6 h-screen sticky top-0 flex flex-col gap-6">
        <h1 className="text-2xl font-bold mb-4">Menu</h1>
        <nav className="flex flex-col gap-4 text-white">
          <Link href="/home" className="hover:text-blue-400">🏠 Home</Link>
          <Link href="/explore" className="hover:text-blue-400">🔍 Explore</Link>
          <Link href="/notifications" className="hover:text-blue-400">🔔 Notifications</Link>
          <Link href="/messages" className="hover:text-blue-400">💬 Messages</Link>
          <Link href="/settings" className="hover:text-blue-400">⚙️ Settings</Link>
        </nav>
      </aside>

      {/* Profile Content */}
      <main className="flex-1 p-8 flex justify-center">
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Image
                src={user.image || "/default-avatar.webp"}
                alt={user.username}
                width={60}
                height={60}
                className="rounded-full"
              />
              <p className="text-2xl font-semibold">{user.username}</p>
            </div>

            <button
              onClick={handleFollowToggle}
              className={`px-5 py-2 rounded text-sm font-semibold transition ${isFollowing
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
            <button
              onClick={handleMessage}
              className="px-5 py-2 rounded text-sm font-semibold transition bg-green-600 hover:bg-green-700"
            >
              Message
            </button>

          </div>

          {posts.length === 0 ? (
            <div className="text-center text-gray-400 mt-10">
              <p className="text-lg">Looks like this user hasn&apos;t posted anything yet 💤</p>
            </div>
          ) : (
            posts.map((post: Post) => (
              <div key={post.id} className="bg-gray-800 p-5 rounded-lg mb-6 shadow-md">
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
                <p className="text-sm text-gray-300">{post.content}</p>
                <button
                  onClick={() =>
                    setPosts((prev) =>
                      prev.map((p) =>
                        p.id === post.id ? { ...p, showComments: !p.showComments } : p
                      )
                    )
                  }
                  className="mt-2 text-blue-400 hover:text-blue-600"
                >
                  {post.showComments ? "Hide Comments" : "Show Comments"}
                </button>

                {post.showComments && (
                  <div className="mt-4 space-y-3">
                    {post.comments.length > 0 ? (
                      post.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 items-start p-2">
                          <Image
                            src={comment.user.image || "/default-avatar.webp"}
                            alt={comment.user.username}
                            width={30}
                            height={30}
                            className="rounded-full"
                          />
                          <div>
                            <p className="font-bold">{comment.user.username}</p>
                            <p>{comment.content}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-400">No comments yet.</p>
                    )}

                    {/* Add Comment Form */}
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const input = form.elements.namedItem("comment") as HTMLInputElement;
                        const newComment = input.value.trim();
                        if (!newComment) return;

                        const res = await fetch("/api/comments", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ postId: post.id, content: newComment }),
                        });

                        if (res.ok) {
                          const comment = await res.json();
                          setPosts((prev) =>
                            prev.map((p) =>
                              p.id === post.id
                                ? { ...p, comments: [...p.comments, comment] }
                                : p
                            )
                          );
                          input.value = "";
                        }
                      }}
                      className="flex items-center gap-2 mt-2"
                    >
                      <input
                        type="text"
                        name="comment"
                        placeholder="Write a comment..."
                        className="flex-grow p-2 rounded bg-gray-700 text-white"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                      >
                        Post
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
