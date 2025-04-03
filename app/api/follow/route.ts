import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// Follow a user
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { followingId } = await req.json();
  if (!followingId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  try {
    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: session.user.id, followingId } },
    });

    if (existingFollow) return NextResponse.json({ message: "Already following" });

    // Create follow entry
    const follow = await prisma.follow.create({
      data: {
        followerId: session.user.id,
        followingId,
      },
    });

    return NextResponse.json(follow);
  } catch (error) {
    return NextResponse.json({ error: "Failed to follow: " + error }, { status: 500 });
  }
}

// Unfollow a user
export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { followingId } = await req.json();
  if (!followingId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  try {
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId: session.user.id, followingId } },
    });

    return NextResponse.json({ message: "Unfollowed successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to unfollow: " + error }, { status: 500 });
  }
}

// Check if following
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const followingId = searchParams.get("userId");

  if (!followingId) return NextResponse.json({ error: "User ID required" }, { status: 400 });

  const isFollowing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: session.user.id, followingId } },
  });

  return NextResponse.json({ isFollowing: !!isFollowing });
}
