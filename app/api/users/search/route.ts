import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query || query.trim() === "") {
        return NextResponse.json([]);
    }

    const users = await prisma.user.findMany({
        where: {
            username: {
                contains: query,
                mode: "insensitive",
            },
            NOT: {
                id: session.user.id, // exclude yourself
            }
        },
        select: {
            id: true,
            username: true,
            image: true,
        },
        take: 5,
    });

    return NextResponse.json(users);
}
