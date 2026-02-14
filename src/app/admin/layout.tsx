import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { Users, Globe, AlertTriangle, LayoutDashboard, Bot } from "lucide-react";

import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth/roles";
import { Breadcrumb } from "@/components/breadcrumb";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || !hasRole(session.user.role, Role.ADMIN)) {
    redirect("/");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Admin" }]} />

      <div className="mt-6 flex gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin">
            <LayoutDashboard className="mr-2 h-3.5 w-3.5" />
            Overview
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/users">
            <Users className="mr-2 h-3.5 w-3.5" />
            Users
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/sources">
            <Globe className="mr-2 h-3.5 w-3.5" />
            Sources
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/alerts">
            <AlertTriangle className="mr-2 h-3.5 w-3.5" />
            Alerts
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/jobs">
            <Bot className="mr-2 h-3.5 w-3.5" />
            Jobs
          </Link>
        </Button>
      </div>

      {children}
    </div>
  );
}
