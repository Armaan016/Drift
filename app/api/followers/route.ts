import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
  
    if (!userId) return NextResponse.json({ error: "User ID required" }, { status: 400 });
  
    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: { follower: true },
    });
  
    return NextResponse.json(followers.map(f => f.follower));
  }
  