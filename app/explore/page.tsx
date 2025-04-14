"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import PageHeader from "../components/PageHeader";

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

export default function ExplorePage() {
    // const { data: session } = useSession();
    const [posts, setPosts] = useState<Post[]>([]);
    // const [otherUsers, setOtherUsers] = useState<User[]>([]);
    // const [following, setFollowing] = useState<string[]>([]);
    const [postsLoading, setPostsLoading] = useState(true);
    // const [usersLoading, setUsersLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const fetchUsers = async () => {
            if (searchTerm.trim() === "") {
                setFilteredUsers([]);
                return;
            }

            setSearchLoading(true);
            const res = await fetch(`/api/users/search?query=${encodeURIComponent(searchTerm)}`);

            const users = await res.json();
            console.log('Users fetched:', users);
            setSearchLoading(false);
            setFilteredUsers(users);
        };

        const debounce = setTimeout(fetchUsers, 300); // debounce to avoid spam

        return () => clearTimeout(debounce);
    }, [searchTerm]);


    // Fetch posts and comments
    useEffect(() => {
        async function fetchPosts() {
            setPostsLoading(true);
            const res = await fetch("/api/posts?explore=true");
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

    const calculateTimeAgo = (createdAt: string) => {
        const now = new Date().getTime();
        const created = new Date(createdAt).getTime();
        const diffInMs = now - created;

        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const days = Math.floor(diffInHours / 24);
        const hours = diffInHours % 24;

        let result = "";

        if (days > 0) {
            result += `${days} day${days !== 1 ? "s" : ""}`;
        }

        if (hours > 0 || days === 0) {
            if (result) result += " ";
            result += `${hours} hour${hours !== 1 ? "s" : ""}`;
        }

        return result + " ago";
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
                <aside className="w-64 bg-gray-800 p-6 min-h-full sticky top-[80px] flex flex-col gap-6 shadow-lg">

                    <h1 className="text-3xl font-extrabold mb-2 text-white">Menu</h1>
                    <hr className="border-gray-700 mb-4" />

                    <nav className="flex flex-col gap-4 text-white text-lg">
                        <Link
                            href="/home"
                            className={`py-2 px-3 rounded-lg transition-colors duration-200 hover:bg-blue-700 hover:text-white ${pathname === "/home" ? "bg-blue-600 text-white font-semibold" : ""
                                }`}
                        >
                            🏠 Home
                        </Link>
                        <Link
                            href="/explore"
                            className={`py-2 px-3 rounded-lg transition-colors duration-200 hover:bg-blue-700 hover:text-white ${pathname === "/explore" ? "bg-blue-600 text-white font-semibold" : ""
                                }`}
                        >
                            🔍 Explore
                        </Link>
                        <Link
                            href="/notifications"
                            className={`py-2 px-3 rounded-lg transition-colors duration-200 hover:bg-blue-700 hover:text-white ${pathname === "/notifications" ? "bg-blue-600 text-white font-semibold" : ""
                                }`}
                        >
                            🔔 Notifications
                        </Link>
                        <Link
                            href="/messages"
                            className={`py-2 px-3 rounded-lg transition-colors duration-200 hover:bg-blue-700 hover:text-white ${pathname === "/messages" ? "bg-blue-600 text-white font-semibold" : ""
                                }`}
                        >
                            💬 Messages
                        </Link>
                        <Link
                            href="/settings"
                            className={`py-2 px-3 rounded-lg transition-colors duration-200 hover:bg-blue-700 hover:text-white ${pathname === "/settings" ? "bg-blue-600 text-white font-semibold" : ""
                                }`}
                        >
                            ⚙️ Settings
                        </Link>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-grow max-w-4xl mx-auto px-4">

                    <PageHeader title="Explore" icon="🔍" />
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
                                            <p className="text-gray-400">No comments yet. Be the first to say something!</p>
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
                </main>

                {/* Right Sidebar */}
                <aside className="w-64 bg-gray-800 p-4 rounded-lg ml-4 h-fit sticky top-20">
                    <h2 className="text-lg font-semibold mb-2 text-white">Find New People</h2>
                    <input
                        type="text"
                        placeholder="Search username..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 mb-4 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
                    />
                    {searchLoading ? (
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
                        <ul className="space-y-2">
                            {filteredUsers.map(user => (
                                <li key={user.id} className="flex items-center gap-3">
                                    <Image
                                        src={user.image || "/default-avatar.webp"}
                                        alt={user.username}
                                        width={30}
                                        height={30}
                                        className="rounded-full"
                                    />
                                    <Link href={`../profile/${user.id}`} className="text-white hover:underline">
                                        {user.username}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}

                </aside>

            </div>
        </div>
    );
}
