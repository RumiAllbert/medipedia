import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role } from "@prisma/client";
import NextAuth, { type NextAuthConfig } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import nodemailer from "nodemailer";

import { prisma } from "@/lib/prisma";

function renderVerificationEmail(url: string) {
  return `
    <div style="font-family: ui-sans-serif, -apple-system, Segoe UI, sans-serif; line-height: 1.5; color: #111827;">
      <h2 style="margin: 0 0 12px;">Sign in to Medipedia</h2>
      <p style="margin: 0 0 18px;">Use the secure magic link below. This link expires in 10 minutes.</p>
      <a href="${url}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 10px; font-weight: 600;">
        Sign in
      </a>
      <p style="margin-top: 18px; font-size: 13px; color: #6b7280;">
        If you did not request this, you can ignore this email.
      </p>
    </div>
  `;
}

const emailProvider = EmailProvider({
  from: process.env.EMAIL_FROM ?? "Medipedia <no-reply@medipedia.local>",
  maxAge: 10 * 60,
  server: process.env.EMAIL_SERVER ?? "smtp://localhost:1025",
  async sendVerificationRequest({ identifier, url, provider }) {
    if (!process.env.EMAIL_SERVER) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[auth] Magic link for ${identifier}: ${url}`);
      }
      return;
    }

    const transport = nodemailer.createTransport(provider.server);
    await transport.sendMail({
      to: identifier,
      from: provider.from,
      subject: "Your Medipedia sign-in link",
      text: `Sign in to Medipedia: ${url}`,
      html: renderVerificationEmail(url),
    });
  },
});

export const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "development" ? "medipedia-dev-secret-change-me" : undefined);

const config: NextAuthConfig = {
  secret: authSecret,
  adapter: PrismaAdapter(prisma) as NextAuthConfig["adapter"],
  providers: [emailProvider],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      if (user && "role" in user) {
        token.role = (user.role as Role | undefined) ?? Role.READER;
      }
      if (!token.role) {
        token.role = Role.READER;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as Role | undefined) ?? Role.READER;
      }
      return session;
    },
  },
};

export const { auth, handlers, signIn, signOut } = NextAuth(config);
