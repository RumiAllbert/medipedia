import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { hasRole } from "@/lib/auth/roles";
import { Breadcrumb } from "@/components/breadcrumb";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || !hasRole(session.user.role, Role.CONTRIBUTOR)) {
    redirect("/signin");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Dashboard" }]} />
      {children}
    </div>
  );
}
