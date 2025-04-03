"use client"; // This tells Next.js this is a Client Component

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
            <Card className="w-[350px] p-4">
                <CardHeader>
                    <h2 className="text-center text-xl font-bold">Sign In</h2>
                </CardHeader>
                <CardContent>
                    <Button className="w-full bg-white text-black" onClick={() => signIn("github", { callbackUrl: "/" })}>
                        Sign in with GitHub
                    </Button>


                </CardContent>
            </Card>
        </div>
    );
}
