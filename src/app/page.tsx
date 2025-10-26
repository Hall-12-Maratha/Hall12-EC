import { LoginForm } from "@/components/login-form";
import { Vote, Gem } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import logo from "../assets/image.png";


export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
  <div className="w-full max-w-xl space-y-8 flex flex-col items-center justify-center text-center mx-auto">
        <div className="flex items-center gap-2 justify-center">
          {/* <Vote className="h-10 w-10 text-primary" /> */}
          <Image src={logo} alt="Maratha HEC Election Portal" width={140} height={140} />
        </div>

        <div className="flex items-center gap-2 justify-center">
          {/* <Gem className="h-10 w-10 text-primary" /> */}
          <h1 className="text-4xl font-bold tracking-tight text-foreground  font-headline">
            Maratha HEC Election Portal
          </h1>
        </div>
        <p className="text-muted-foreground text-center">
          Vote for a Change.
        </p>
        <div className="w-[80%]">
        <LoginForm />
        </div>

        <div className="text-center text-sm">
          {"Don't have an account? "}
          <Link href="/signup" className={cn(buttonVariants({ variant: "link" }), "p-0 h-auto")}>
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
