"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    if (status === "loading") return <p>Loading...</p>;
    if (!session) {
        router.push("/");
        return null;
    }

    return <div>Welcome to your dashboard, {session.user?.name}!</div>;
}
