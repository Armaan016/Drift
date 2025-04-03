"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";

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

export default function Home() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [otherUsers, setOtherUsers] = useState<User[]>([]);
  const [following, setFollowing] = useState<string[]>([]);

  // Fetch posts and comments
  useEffect(() => {
    async function fetchPosts() {
      const res = await fetch("/api/posts");
      const data = await res.json();

      // Fetch comments for each post
      const postsWithComments = await Promise.all(
        data.map(async (post: Post) => {
          const commentRes = await fetch(`/api/comments?postId=${post.id}`);
          const comments: Comment[] = await commentRes.json();
          return { ...post, comments };
        })
      );
      setPosts(postsWithComments);
    }
    fetchPosts();
  }, []);

  // Fetch users to show on the sidebar
  useEffect(() => {
    async function fetchOtherUsers() {
      const res = await fetch("/api/users");
      const users: User[] = await res.json();
      setOtherUsers(users.filter((user) => user.id !== session?.user.id)); // Exclude the logged-in user
    }
    if (session) fetchOtherUsers();
  }, [session]);

  // Fetch users that the current user is following
  useEffect(() => {
    async function fetchFollowing() {
      if (!session?.user.id) return;

      const res = await fetch(`/api/following?userId=${session.user.id}`);
      const followingList: { id: string }[] = await res.json();
      setFollowing(followingList.map((user) => user.id));
    }
    if (session) fetchFollowing();
  }, [session]);

  // Follow user
  async function followUser(userId: string) {
    if (following.includes(userId)) return; // Already following

    setFollowing([...following, userId]); // Optimistic update

    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followingId: userId }),
    });

    if (!res.ok) {
      alert("Failed to follow user.");
      setFollowing(following.filter((id) => id !== userId)); // Revert on failure
    }
  }

  // Unfollow user
  async function unfollowUser(userId: string) {
    setFollowing(following.filter((id) => id !== userId)); // Optimistic update

    const res = await fetch("/api/follow", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followingId: userId }),
    });

    if (!res.ok) {
      alert("Failed to unfollow user.");
      setFollowing([...following, userId]); // Revert on failure
    }
  }

  // Calculate time ago in hours
  const calculateTimeAgo = (createdAt: string) => {
    const postDate = new Date(createdAt);
    const now = new Date();
    const diffInMs = now.getTime() - postDate.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 3600));
    return `${diffInHours} hours ago`;
  };

  // Toggle comments visibility
  const toggleComments = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? { ...post, showComments: !post.showComments }
          : post
      )
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-white p-4">
      {/* Main Content (Posts) */}
      <div className="w-full max-w-3xl mx-auto">
        {posts.map((post) => (
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
                <p className="font-bold cursor-pointer hover:underline">{post.user.username}</p>
              </Link>
            </div>
            <p>{post.content}</p>

            {/* Time Ago */}
            <p className="text-sm text-gray-400">{calculateTimeAgo(post.createdAt)}</p>

            {/* Show/Hide Comments Button */}
            <button
              onClick={() => toggleComments(post.id)}
              className="mt-2 text-blue-500 hover:text-blue-700"
            >
              {post.showComments ? "Hide Comments" : "Show Comments"}
            </button>

            {/* Show Comments if toggled */}
            {post.showComments && (
              <div className="mt-4">
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
                  <p>No comments yet.</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sidebar (Other Users) */}
      <div className="w-80 fixed top-4 right-4 bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-bold mb-4">Other Users:</h3>
        {otherUsers.length > 0 ? (
          otherUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-2 border-b border-gray-700">
              <Link href={`/profile/${user.id}`}>
                <Image
                  src={user.image || "/default-avatar.webp"}
                  alt={user.username}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              </Link>
              <Link href={`/profile/${user.id}`}>
                <p className="font-bold cursor-pointer hover:underline">{user.username}</p>
              </Link>
              {/* Follow/Unfollow Button */}
              {following.includes(user.id) ? (
                <button
                  onClick={() => unfollowUser(user.id)}
                  className="p-2 rounded-lg text-sm bg-red-500 hover:bg-red-700"
                >
                  Unfollow
                </button>
              ) : (
                <button
                  onClick={() => followUser(user.id)}
                  className="p-2 rounded-lg text-sm bg-blue-500 hover:bg-blue-700"
                >
                  Follow
                </button>
              )}
            </div>
          ))
        ) : (
          <p>No other users found.</p>
        )}
      </div>
    </div>
  );
}
