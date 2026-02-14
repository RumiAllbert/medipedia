import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RoleSelect } from "./role-select";

async function getUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { authored: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="mt-6">
      <h1 className="text-3xl font-semibold tracking-tight">User Management</h1>
      <p className="mt-1 text-muted-foreground">
        {users.length} registered user{users.length !== 1 ? "s" : ""}
      </p>

      <div className="mt-6 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Articles</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.email}</TableCell>
                <TableCell>{user.name ?? "—"}</TableCell>
                <TableCell>
                  <RoleSelect userId={user.id} currentRole={user.role} />
                </TableCell>
                <TableCell className="text-right">{user._count.authored}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
