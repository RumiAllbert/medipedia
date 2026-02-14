import { redirect } from "next/navigation";

import { auth, signIn } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DevLogin } from "@/components/dev-login";

const isDev = process.env.NODE_ENV === "development";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center px-6 py-12">
      <div className="w-full space-y-6">
        {/* Magic link sign in */}
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Secure access
            </p>
            <CardTitle className="text-3xl">Sign in to Medipedia</CardTitle>
            <CardDescription>
              We use a magic link email to keep access secure and simple.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              action={async (formData) => {
                "use server";
                const email = String(formData.get("email") ?? "");
                await signIn("email", { email, redirectTo: "/" });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  required
                  placeholder="you@company.com"
                />
              </div>
              <Button type="submit" className="w-full">
                Send magic link
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Dev login - only shown in development */}
        {isDev && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Dev quick login
                </span>
              </div>
            </div>
            <DevLogin />
          </>
        )}
      </div>
    </main>
  );
}
