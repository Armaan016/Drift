import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// 🚀 Create a new post
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    console.log("❌ No session found! User is unauthorized.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("✅ Creating post for user:", session.user.id); // Debug log ✅

  const { content } = await req.json();
  if (!content) {
    console.log("❌ No content provided.");
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  try {
    const post = await prisma.post.create({
      data: {
        content,
        userId: session.user.id,
      },
      include: { user: true },
    });

    console.log("✅ Post created successfully:", post);
    return NextResponse.json(post);
  } catch (error) {
    console.error("❌ Error creating post:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}

// 🚀 Get posts from followed users
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url || "");
  const explore = url.searchParams.get("explore");

  console.log("📡 Explore mode:", explore === "true");

  let posts;

  if (explore === "true") {
    // Fetch all posts, optionally excluding the current user's own posts
    posts = await prisma.post.findMany({
      where: {
        userId: {
          // not: session.user.id, // 👈 Remove this line if you want your own posts too
        },
      },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    console.log("🧭 Explore posts fetched:", posts.length);
  } else {
    // Home feed: posts from followed users
    const following = await prisma.follow.findMany({
      where: { followerId: session.user.id },
      select: { followingId: true },
    });

    const followingIds = following.map(f => f.followingId);
    console.log("User follows:", followingIds);

    posts = await prisma.post.findMany({
      where: { userId: { in: followingIds } },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    console.log("🏠 Home posts fetched:", posts.length);
  }

  return NextResponse.json(posts);
}

