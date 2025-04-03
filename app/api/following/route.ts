import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        const following = await prisma.follow.findMany({
            where: { followerId: userId },
            include: { following: true },
        });

        return NextResponse.json(following.map(f => f.following));
    } catch (error) {
        console.error("Error fetching following list:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
