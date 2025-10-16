// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * Reuse PrismaClient in dev to avoid multiple connections
 */
let prisma;
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.__prisma) global.__prisma = new PrismaClient();
  prisma = global.__prisma;
}

/**
 * Google env fallback (support either naming)
 */
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_SECRET;

console.log("NEXTAUTH_DEBUG:", process.env.NEXTAUTH_DEBUG === "true");
console.log("Using Google client id present:", !!GOOGLE_CLIENT_ID);

/**
 * NextAuth options
 */
export const authOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  // Using JWT strategy here (keeps behavior consistent with your previous code).
  // You can switch to 'database' if you want server-side sessions saved in Session table.
  session: { strategy: "jwt" },

  pages: {
    signIn: "/sign-in",
  },

  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("no creds found");
            return null;
          }

          // Note: your Prisma schema stores the hashed password in `password`
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });
          if (!user || !user.password) {
            console.log("no user found");
            return null;
          }
          const valid = await bcrypt.compare(credentials.password, user.password);
          if (!valid) return null;

          // Minimal user object returned to NextAuth
          return { id: user.id, name: user.name, email: user.email, role: user.role };
        } catch (err) {
          console.error("[nextauth][authorize] error:", err);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    /**
     * signIn: ensure Google users are created/linked properly
     * This prevents OAuthAccountNotLinked and also ensures new Google users
     * appear in your Prisma DB with role = USER (not SUPER).
     */
    async signIn({ user, account, profile }) {
      try {
        // Only special-case Google (oauth) flows
        if (account?.provider === "google" && user?.email) {
          console.log("[nextauth] Google signIn for:", user.email);

          // 1) Find existing user by email
          let dbUser = await prisma.user.findUnique({ where: { email: user.email } });

          // 2) If no user, create one (explicitly) with role USER
          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                name: user.name ?? profile?.name ?? null,
                email: user.email,
                image: user.image ?? profile?.picture ?? null,
                role: "USER", // ensure oauth-created users are regular users
              },
            });
            console.log("[nextauth] Created user:", dbUser.id);
          } else {
            // Make sure role exists (safety)
            if (!dbUser.role) {
              await prisma.user.update({ where: { id: dbUser.id }, data: { role: "USER" } });
            }
          }

          // 3) Ensure Account row exists and points to dbUser
          const existingAccount = await prisma.account.findFirst({
            where: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          });

          if (!existingAccount) {
            await prisma.account.create({
              data: {
                userId: dbUser.id,
                type: account.type ?? "oauth",
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token ?? null,
                access_token: account.access_token ?? null,
                expires_at: account.expires_at ? Number(account.expires_at) : null,
                token_type: account.token_type ?? null,
                scope: account.scope ?? null,
                id_token: account.id_token ?? null,
                session_state: account.session_state ?? null,
              },
            });
            console.log("[nextauth] Created Account link for userId:", dbUser.id);
          } else if (existingAccount.userId !== dbUser.id) {
            // This is unexpected — log so you can inspect
            console.warn("[nextauth] Account exists but linked to different userId:", existingAccount.userId, "expected", dbUser.id);
          }

          // Good to go
          return true;
        }

        // For non-google providers (credentials etc.) allow default
        return true;
      } catch (err) {
        console.error("[nextauth][signIn] error:", err);
        // Returning false denies sign in. We return false if something goes wrong.
        return false;
      }
    },

    /**
     * jwt: attach id and role to token
     */
    async jwt({ token, user }) {
      try {
        if (user) {
          // On initial sign in, NextAuth may pass `user` (from authorize or adapter)
          token.sub = user.id ?? token.sub;
          token.role = user.role ?? token.role ?? "USER";
        }

        // If no role yet and token.sub present, fetch from DB
        if (!token.role && token.sub) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: { role: true },
          });
          if (dbUser) token.role = dbUser.role;
        }
      } catch (err) {
        console.error("[nextauth][jwt] error:", err);
      }
      return token;
    },

    /**
     * session: expose id and role on session.user
     */
    async session({ session, token, user }) {
      try {
        session.user = session.user || {};
        session.user.id = token.sub;
        session.user.role = token.role ?? "USER";
      } catch (err) {
        console.error("[nextauth][session] error:", err);
      }
      return session;
    },
  },

  // Helpful for debugging during development (set NEXTAUTH_DEBUG=true in .env)
  debug: process.env.NEXTAUTH_DEBUG === "true",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
