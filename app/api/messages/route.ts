import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    // const userId = session.user.id;
    const conversationId = req.nextUrl.searchParams.get("conversationId");
    if (!conversationId) return NextResponse.json({ error: "Missing conversationId" }, { status: 400 });

    const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: "asc" },
        include: {
            sender: true
        }
    });

    return NextResponse.json(messages);
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const userId = session.user.id;
    const { conversationId, content } = await req.json();

    if (!conversationId || !content) {
        return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const message = await prisma.message.create({
        data: {
            conversationId,
            senderId: userId,
            content
        }
    });

    await prisma.conversation.update({
        where: { id: conversationId },
        data: {
            updatedAt: new Date()
        }
    });

    return NextResponse.json(message);
}