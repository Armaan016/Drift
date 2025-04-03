import { NextAuthOptions } from "next-auth";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();

interface GitHubProfile {
  id: number;
  login: string;
  avatar_url: string;
  email?: string;
}


export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  debug: true,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        return { id: "1", name: "User", email: credentials?.email };
      },
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: { strategy: "jwt" },

  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "github") {
        const githubProfile = profile as GitHubProfile;
        if (!githubProfile) return false;

        const email = githubProfile.email ?? `github-${githubProfile.id}`;
        const image = githubProfile.avatar_url; // ✅ Ensure this is used

        let existingUser = await prisma.user.findUnique({
          where: { email },
          include: { accounts: true },
        });

        if (existingUser) {
          // 🔴 Fix: Update image if it's missing or outdated
          if (!existingUser.image || existingUser.image !== image) {
            console.log("Updating existing user image...");
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { image },
            });
          }
        } else {
          console.log("Creating new user...");
          existingUser = await prisma.user.create({
            data: {
              email,
              username: githubProfile.login,
              image, // ✅ Store image properly
              accounts: {
                create: {
                  type: "oauth",
                  provider: "github",
                  providerAccountId: githubProfile.id.toString(),
                },
              },
            },
            include: { accounts: true },
          });
        }

        // Check if GitHub account is linked
        const existingAccount = await prisma.account.findFirst({
          where: {
            provider: "github",
            providerAccountId: githubProfile.id.toString(),
          },
        });

        if (!existingAccount) {
          console.log("Creating new account...");
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              type: "oauth",
              provider: "github",
              providerAccountId: githubProfile.id.toString(),
            },
          });
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        token.id = user.id;
        token.username = dbUser?.username ?? user.email?.split("@")[0]; // ✅ Get username from DB
        token.image = dbUser?.image ?? ""; // ✅ Get image from DB
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.image = token.image as string;
      }
      return session;
    },
  }

};

export default authOptions;
