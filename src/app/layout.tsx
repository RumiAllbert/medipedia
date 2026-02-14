import type { Metadata } from "next";
import Link from "next/link";
import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";
import { Home, BookOpen, Globe, PenTool, Shield, LogOut, LogIn } from "lucide-react";
import { Role } from "@prisma/client";

import { auth, signOut } from "@/lib/auth";
import { hasRole } from "@/lib/auth/roles";
import { CommandSearchButton, CommandSearchProvider } from "@/components/command-search";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNav } from "@/components/mobile-nav";
import { Toaster } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import "./globals.css";

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const bodyFont = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Medipedia",
  description: "A safety-first health encyclopedia powered by Lumi with council scoring",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const user = session?.user;
  const isContributor = hasRole(user?.role, Role.CONTRIBUTOR);
  const isAdmin = hasRole(user?.role, Role.ADMIN);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${bodyFont.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CommandSearchProvider>
            <div className="min-h-screen bg-background">
              <div className="mx-auto grid min-h-screen w-full max-w-[1400px] md:grid-cols-[260px_1fr]">
                {/* Desktop sidebar */}
                <aside className="hidden border-r bg-card/75 p-6 backdrop-blur md:flex md:flex-col">
                  <Link className="block text-3xl font-semibold tracking-tight" href="/">
                    Medipedia
                  </Link>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Evidence-first
                  </p>

                  <nav className="mt-8 flex flex-col gap-1 text-sm">
                    <Link
                      href="/"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Home className="h-4 w-4" />
                      Articles
                    </Link>
                    <Link
                      href="/topics"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <BookOpen className="h-4 w-4" />
                      Topics
                    </Link>
                    <Link
                      href="/orbis"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                    >
                      <Globe className="h-4 w-4" />
                      Orbis
                    </Link>
                    {isContributor && (
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <PenTool className="h-4 w-4" />
                        Dashboard
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                      >
                        <Shield className="h-4 w-4" />
                        Admin
                      </Link>
                    )}
                  </nav>

                  <div className="mt-6">
                    <CommandSearchButton />
                  </div>

                  <Separator className="my-6" />

                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                  </div>

                  <div className="mt-auto pt-6">
                    <div className="rounded-xl border bg-card p-4">
                      {user ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {(user.email?.[0] ?? "U").toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{user.email}</p>
                              <p className="text-xs text-muted-foreground">{user.role}</p>
                            </div>
                          </div>
                          <form
                            action={async () => {
                              "use server";
                              await signOut({ redirectTo: "/" });
                            }}
                          >
                            <Button
                              type="submit"
                              variant="outline"
                              size="sm"
                              className="w-full gap-2"
                            >
                              <LogOut className="h-3.5 w-3.5" />
                              Sign out
                            </Button>
                          </form>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            Sign in to generate topics and review drafts.
                          </p>
                          <Button asChild size="sm" className="w-full gap-2">
                            <Link href="/signin">
                              <LogIn className="h-3.5 w-3.5" />
                              Sign in
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </aside>

                {/* Main content */}
                <div className="flex min-h-screen flex-col">
                  <header className="sticky top-0 z-50 border-b bg-background/95 px-4 py-3 backdrop-blur md:hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <MobileNav
                          isContributor={isContributor}
                          isAdmin={isAdmin}
                          isSignedIn={!!user}
                        />
                        <Link href="/" className="text-2xl font-semibold tracking-tight">
                          Medipedia
                        </Link>
                      </div>
                      <CommandSearchButton />
                    </div>
                  </header>

                  <main className="flex-1">{children}</main>

                  <footer className="border-t px-6 py-5 text-xs text-muted-foreground">
                    Educational content only. If symptoms are severe or worsening, seek
                    professional care.
                  </footer>
                </div>
              </div>
            </div>
            <Toaster />
          </CommandSearchProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
