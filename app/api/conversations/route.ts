import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse, NextRequest } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const userId = session.user.id;

    const conversations = await prisma.conversation.findMany({
        where: {
            participants: {
                some: { id: userId }
            }
        },
        include: {
            messages: {
                orderBy: { createdAt: "desc" },
                take: 1
            },
            participants: true
        },
        orderBy: { updatedAt: "desc" }
    });

    return NextResponse.json(conversations);
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

    const { userId } = await req.json();
    const currentUserId = session.user.id;

    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    // Check if a conversation already exists between the two
    let conversation = await prisma.conversation.findFirst({
        where: {
            AND: [
                { participants: { some: { id: currentUserId } } },
                { participants: { some: { id: userId } } },
            ],
        },
    });

    if (!conversation) {
        // Create new conversation
        conversation = await prisma.conversation.create({
            data: {
                participants: {
                    connect: [{ id: currentUserId }, { id: userId }],
                },
            },
        });
    }

    return NextResponse.json({ conversationId: conversation.id });
}
