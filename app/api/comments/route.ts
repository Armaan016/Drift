import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// Get comments for a post
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get("postId");
    if (!postId) return NextResponse.json({ error: "Post ID required" }, { status: 400 });

    const comments = await prisma.comment.findMany({
        where: { postId },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, username: true, image: true } } },
    });

    console.log("Fetched comments:", comments);

    return NextResponse.json(comments);
}

// Post a new comment
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { postId, content, imageUrl, voiceUrl } = await req.json();
    if (!postId || (!content && !imageUrl && !voiceUrl)) {
        return NextResponse.json({ error: "Content, image, or voice required" }, { status: 400 });
    }

    const comment = await prisma.comment.create({
        data: {
            content: content || "",
            imageUrl,
            voiceUrl,
            postId,
            userId: session.user.id,
        },
        include: { user: { select: { id: true, username: true, image: true } } },
    });

    return NextResponse.json(comment);
}
