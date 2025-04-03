"use client";
import { useState, useEffect } from "react";
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

interface ProfileProps {
  user: User;
}

export default function Profile({ user }: ProfileProps) {
  const [posts, setPosts] = useState<Post[]>([]);

  // Fetch posts and comments for this user
  useEffect(() => {
    async function fetchPosts() {
      const res = await fetch(`/api/posts?userId=${user.id}`);
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
  }, [user.id]);

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
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-4">
          <Image
            src={user.image || "/default-avatar.webp"}
            alt={user.username}
            width={40}
            height={40}
            className="rounded-full"
          />
          <p className="font-bold">{user.username}</p>
        </div>

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
    </div>
  );
}
