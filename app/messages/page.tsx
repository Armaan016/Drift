'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react'; // 👈 Use this instead of getServerSession

interface User {
    id: string;
    username: string;
    image: string | null;
}

interface Message {
    id: string;
    content: string;
    createdAt: string;
}

interface Conversation {
    id: string;
    participants: User[];
    messages: Message[];
    updatedAt: string;
}

export default function MessagesPage() {
    const { data: session, status } = useSession(); // 👈 This gives us the current user
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status !== 'authenticated') return;

        async function fetchConversations() {
            try {
                const res = await fetch('/api/messages');
                const data = await res.json();

                if (Array.isArray(data)) {
                    setConversations(data);
                } else {
                    setConversations([]); 
                    console.log('Unexpected data from /api/messages:', data);
                }
            } catch (err) {
                console.error('Failed to fetch conversations', err);
                setConversations([]);
            } finally {
                setLoading(false);
            }
        }

        fetchConversations();
    }, [status]);

    if (status === 'loading') {
        return <div className="p-6 text-white">Checking who you are...</div>;
    }

    if (status !== 'authenticated') {
        return <div className="p-6 text-white">You need to sign in to view your messages.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <h1 className="text-3xl font-bold mb-4">📨 Messages</h1>

            {loading ? (
                <p>Loading your conversations...</p>
            ) : conversations.length === 0 ? (
                <p className="text-gray-400">No messages yet. Go start a convo with someone!</p>
            ) : (
                <ul className="space-y-4">
                    {conversations.map((conv) => {
                        const latestMessage = conv.messages[0];
                        const otherUsers = conv.participants.filter(
                            (p) => p.id !== session.user.id
                        );

                        return (
                            <li key={conv.id} className="bg-gray-800 p-4 rounded-lg flex items-center justify-between hover:bg-gray-700 transition">
                                <Link href={`/messages/${conv.id}`} className="flex items-center gap-4 flex-grow">
                                    <Image
                                        src={otherUsers[0]?.image || '/default-avatar.webp'}
                                        alt={otherUsers[0]?.username || 'User'}
                                        width={40}
                                        height={40}
                                        className="rounded-full"
                                    />
                                    <div>
                                        <p className="font-semibold">{otherUsers[0]?.username || 'Unknown User'}</p>
                                        <p className="text-gray-400 text-sm truncate max-w-sm">{latestMessage?.content || 'No messages yet'}</p>
                                    </div>
                                </Link>
                                <span className="text-gray-500 text-xs whitespace-nowrap">
                                    {new Date(conv.updatedAt).toLocaleTimeString()}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}
