import { SignupForm } from "@/components/signup-form";
import { Gem } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center space-y-2 text-center">
            <div className="flex items-center gap-2">
                <Gem className="h-10 w-10 text-primary" />
                <h1 className="text-4xl font-bold tracking-tight text-foreground font-headline">
                    Create Account
                </h1>
            </div>
          <p className="text-muted-foreground">
            Join VoteChain to cast your vote securely.
          </p>
        </div>
        <SignupForm />
         <div className="text-center text-sm">
          {"Already have an account? "}
          <Link href="/" className={cn(buttonVariants({ variant: "link" }), "p-0 h-auto")}>
            Log In
          </Link>
        </div>
      </div>
    </main>
  );
}
