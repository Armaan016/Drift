import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

    console.log("Fetching profile for userId:", userId);
    // Fetch user details
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, image: true },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Fetch user's posts, now including comments and comment users
    const posts = await prisma.post.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
            user: { select: { id: true, username: true, image: true } },
            comments: {
                orderBy: { createdAt: "asc" },
                include: { user: { select: { id: true, username: true, image: true } } },
            },
        },
    });

    // Check if logged-in user follows this profile
    const isFollowing = !!(await prisma.follow.findFirst({
        where: { followerId: session.user.id, followingId: userId },
    }));

    return NextResponse.json({ user, posts, isFollowing });
}
