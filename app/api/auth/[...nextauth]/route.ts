import NextAuth, { NextAuthOptions, Session } from "next-auth";
import { JWT } from "next-auth/jwt";
import GithubProvider from "next-auth/providers/github";
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
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true, // Allow linking accounts with the same email
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "github") {
        const githubProfile = profile as GitHubProfile;
        if (!githubProfile) return false;

        const email = githubProfile.email ?? `github-${githubProfile.id}`;

        // Check if a user already exists with this email
        let existingUser = await prisma.user.findUnique({
          where: { email },
          include: { accounts: true }, // Include accounts to check linkage
        });

        const providerAccountId = githubProfile.id.toString();

        if (existingUser) {
          // Check if the GitHub account is already linked
          const existingAccount = existingUser.accounts.find(
            (acc) => acc.provider === "github" && acc.providerAccountId === providerAccountId
          );

          if (!existingAccount) {
            // Link the GitHub account to the existing user
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: "oauth",
                provider: "github",
                providerAccountId,
              },
            });
          }
        } else {
          // Create a new user and link the GitHub account
          existingUser = await prisma.user.create({
            data: {
              email,
              username: githubProfile.login,
              image: githubProfile.avatar_url,
              accounts: {
                create: {
                  type: "oauth",
                  provider: "github",
                  providerAccountId,
                },
              },
            },
            include: { accounts: true },
          });
        }
      }

      return true; // Allow sign-in
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username ?? user.email?.split("@")[0];
        token.image = user.image ?? "";
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.image = token.image as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };