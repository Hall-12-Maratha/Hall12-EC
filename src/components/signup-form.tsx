
"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { createUser } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Spinner } from "./ui/spinner";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { errorEmitter } from "@/lib/error-emitter";
import { FirestorePermissionError } from "@/lib/errors";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Spinner size="small" /> : <UserPlus />}
      Sign Up
    </Button>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState(createUser, null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (state?.error) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: state.error,
      });
    }
     // Narrow state for TypeScript so we can safely access email/password
     const s = state as unknown as { email?: string; password?: string } | undefined;
     if (s?.email && s?.password) {
      const handleSignup = async () => {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, s.email!, s.password!);
          const user = userCredential.user;
          const userDocRef = doc(db, "users", user.uid);
          const userData = {
            uid: user.uid,
            email: user.email,
            role: "user", // Default role for new sign-ups
            hasVoted: false,
          };

          // Create a user document in Firestore
          await setDoc(userDocRef, userData);

          toast({
            title: "Sign Up Successful",
            description: "Welcome! You can now log in.",
          });
          router.push("/");
        } catch (error: any) {
            if (error.code === 'permission-denied') {
        const permissionError = new FirestorePermissionError({
          path: `users/${(auth.currentUser?.uid ?? 'unknown')}`,
          operation: 'create',
          requestResourceData: { email: s?.email, role: 'user', hasVoted: false },
        });
                errorEmitter.emit('permission-error', permissionError);
            } else {
                let errorMessage = error.message;
                if (error.code === 'auth/email-already-in-use') {
                    errorMessage = "This email is already in use. Please log in or use a different email.";
                }
                toast({
                    variant: "destructive",
                    title: "Sign Up Failed",
                    description: errorMessage,
                });
            }
        }
      };
      handleSignup();
    }
  }, [state, toast, router]);

  return (
    <Card>
      <form action={formAction}>
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
          </div>
  
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required minLength={6} />
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
