"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { loginUser } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Spinner } from "./ui/spinner";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Spinner size="small" /> : <LogIn />}
      Log In
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(loginUser, null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (state?.error) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: state.error,
      });
    }
    // Narrow state for TypeScript so we can safely access email/password
    const s = state as unknown as { email?: string; password?: string } | undefined;
    if (s?.email && s?.password) {
      const handleLogin = async () => {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, s.email!, s.password!);
          const user = userCredential.user;
          const userDoc = await getDoc(doc(db, "users", user.uid));

          if (userDoc.exists()) {
            const userData = userDoc.data();
            toast({
              title: "Login Successful",
              description: `Welcome back, ${userData.role}!`
            });
            if (userData.role === 'admin') {
              router.push('/admin/dashboard');
            } else {
              router.push('/user/dashboard');
            }
          } else {
             toast({
              variant: "destructive",
              title: "Login Failed",
              description: "User role not found.",
            });
            auth.signOut();
          }
        } catch (error: any) {
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: error.message,
          });
        }
      }
      handleLogin();
    }
  }, [state, toast, router]);

  return (
    <Card>
      <form action={formAction}>
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">IITK Email</Label>
            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
          </div>
  
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
