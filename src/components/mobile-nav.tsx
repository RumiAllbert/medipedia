"use client";

import Link from "next/link";
import { Menu, Home, BookOpen, Globe, Info, NotebookPen, ShieldCheck, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";

type MobileNavProps = {
  isContributor: boolean;
  isAdmin: boolean;
  isSignedIn: boolean;
};

export function MobileNav({ isContributor, isAdmin, isSignedIn }: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle className="text-left text-2xl font-semibold tracking-tight">
            Medipedia
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-2">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Home className="h-4 w-4" />
            Articles
          </Link>
          <Link
            href="/topics"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <BookOpen className="h-4 w-4" />
            Topics
          </Link>
          <Link
            href="/orbis"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Globe className="h-4 w-4" />
            Orbis
          </Link>
          <Link
            href="/about"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Info className="h-4 w-4" />
            About
          </Link>
          {isContributor && (
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <NotebookPen className="h-4 w-4" />
              Dashboard
            </Link>
          )}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <ShieldCheck className="h-4 w-4" />
              Admin
            </Link>
          )}
          {!isSignedIn && (
            <Link
              href="/signin"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </Link>
          )}
          <div className="mt-4 px-3">
            <ThemeToggle />
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
