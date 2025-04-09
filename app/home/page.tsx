"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

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
    const [postsLoading, setPostsLoading] = useState(true);
    const [usersLoading, setUsersLoading] = useState(true);

    const router = useRouter();

    // Fetch posts and comments
    useEffect(() => {
        async function fetchPosts() {
            setPostsLoading(true);
            const res = await fetch("/api/posts");
            const data = await res.json();
            if (!Array.isArray(data)) return;

            const postsWithComments = await Promise.all(
                data.map(async (post: Post) => {
                    const commentRes = await fetch(`/api/comments?postId=${post.id}`);
                    const comments: Comment[] = await commentRes.json();
                    return { ...post, comments };
                })
            );
            setPosts(postsWithComments);
            setPostsLoading(false);
        }
        fetchPosts();
    }, []);

    // Fetch users to show on the sidebar
    useEffect(() => {
        async function fetchOtherUsers() {
            setUsersLoading(true);
            const res = await fetch("/api/users");
            const users: User[] = await res.json();
            setOtherUsers(users.filter((user) => user.id !== session?.user.id));
            setUsersLoading(false);
        }
        if (session) fetchOtherUsers();
    }, [session]);


    // Fetch following
    useEffect(() => {
        async function fetchFollowing() {
            if (!session?.user.id) return;

            const res = await fetch(`/api/following?userId=${session.user.id}`);
            const followingList: { id: string }[] = await res.json();
            setFollowing(followingList.map((user) => user.id));
        }
        if (session) fetchFollowing();
    }, [session]);

    async function followUser(userId: string) {
        setFollowing([...following, userId]);
        const res = await fetch("/api/follow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ followingId: userId }),
        });
        if (!res.ok) setFollowing(following.filter((id) => id !== userId));
    }

    async function unfollowUser(userId: string) {
        setFollowing(following.filter((id) => id !== userId));
        const res = await fetch("/api/follow", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ followingId: userId }),
        });
        if (!res.ok) setFollowing([...following, userId]);
    }

    const calculateTimeAgo = (createdAt: string) => {
        const diff = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 3600));
        return `${diff} hour${diff !== 1 ? "s" : ""} ago`;
    };

    const toggleComments = (postId: string) => {
        setPosts((prev) =>
            prev.map((post) =>
                post.id === postId ? { ...post, showComments: !post.showComments } : post
            )
        );
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">

            {/* Navbar */}
            <nav className="flex justify-between items-center px-6 py-4 bg-blue-600 shadow-md sticky top-0 z-50 rounded-b-lg mx-4 mt-2">
                <h1 className="text-2xl font-semibold tracking-wide text-white">Drift</h1>
                <button
                    onClick={async () => {
                        await signOut({ redirect: false });
                        router.push("/");
                    }}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full transition-all duration-200 text-white font-medium"
                >
                    Log Out
                </button>
            </nav>


            {/* Page Body */}
            <div className="flex flex-grow px-4 py-6">

                {/* Left Navigation Panel */}
                <aside className="w-60 bg-gray-800 p-4 rounded-lg mr-4 h-fit sticky top-20">
                    <nav className="flex flex-col gap-4 text-white">
                        <Link href="/home" className="hover:text-blue-400">🏠 Home</Link>
                        <Link href="/explore" className="hover:text-blue-400">🔍 Explore</Link>
                        <Link href="/settings" className="hover:text-blue-400">⚙️ Settings</Link>
                        <Link href="/notifications" className="hover:text-blue-400">🔔 Notifications</Link>
                        <Link href="/messages" className="hover:text-blue-400">💬 Messages</Link>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-grow max-w-3xl">
                    {postsLoading ? (
                        Array.from({ length: 3 }).map((_, idx) => (
                            <div key={idx} className="bg-gray-800 p-4 rounded-lg mb-4 animate-pulse">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 bg-gray-700 rounded-full" />
                                    <div className="w-32 h-4 bg-gray-700 rounded" />
                                </div>
                                <div className="w-full h-4 bg-gray-700 rounded mb-2" />
                                <div className="w-1/2 h-4 bg-gray-700 rounded" />
                            </div>
                        ))
                    ) : (
                        posts.map((post) => (
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
                                <p className="text-sm text-gray-400 mt-1">{calculateTimeAgo(post.createdAt)}</p>
                                <button
                                    onClick={() => toggleComments(post.id)}
                                    className="mt-2 text-blue-500 hover:text-blue-700"
                                >
                                    {post.showComments ? "Hide Comments" : "Show Comments"}
                                </button>

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
                        ))
                    )}
                </main>

                {/* Right Sidebar: Other Users */}
                <aside className="w-80 bg-gray-800 p-4 rounded-lg ml-4 h-fit sticky top-20">
                    <h3 className="text-lg font-bold mb-4">Other Users:</h3>
                    {usersLoading ? (
                        Array.from({ length: 3 }).map((_, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 border-b border-gray-700 animate-pulse">
                                <div className="w-10 h-10 bg-gray-700 rounded-full" />
                                <div className="w-24 h-4 bg-gray-700 rounded" />
                                <div className="w-16 h-6 bg-gray-700 rounded ml-auto" />
                            </div>
                        ))
                    ) : otherUsers.length > 0 ? (
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
                                    <p className="font-bold hover:underline">{user.username}</p>
                                </Link>
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
                </aside>
            </div>
        </div>
    );
}
