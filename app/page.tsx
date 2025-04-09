'use client';

import { signIn, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/home');
    }
  }, [session, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white flex flex-col">
      {/* Nav Bar */}
      <nav className="w-full p-4 flex justify-between items-center bg-black bg-opacity-30 backdrop-blur-md">
        <h1 className="text-3xl font-bold tracking-tight text-white">Drift</h1>
        <button
          onClick={() => signIn('github')}
          className="bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-lg text-sm"
        >
          Sign In with GitHub
        </button>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col md:flex-row items-center justify-between px-6 md:px-20 py-12">
        <div className="max-w-xl">
          <h2 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
            Welcome to <span className="text-blue-500">Drift</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-6">
            A lightweight social app to share thoughts, connect with others, and explore the world in short, spontaneous bursts.
          </p>
          <ul className="text-gray-400 list-disc pl-5 space-y-2 mb-8">
            <li>Create and share posts instantly</li>
            <li>Comment, like, and interact with others</li>
            <li>Follow users you vibe with</li>
            <li>Simple, elegant, and distraction-free</li>
          </ul>
          <button
            onClick={() => signIn('github')}
            // Make Get Started button appear in the middle
            className="bg-blue-500 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-semibold transition">
            Get Started
          </button>
        </div>

        {/* Right-side Illustration */}
        <div className="hidden md:block">
          <Image
            src="/illustration.png"
            alt="Drift Illustration"
            width={500}
            height={500}
            className="drop-shadow-2xl"
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-gray-500 text-sm">
        © {new Date().getFullYear()} Drift — made with ☕ & code
      </footer>
    </div>
  );
}
