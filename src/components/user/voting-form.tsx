
"use client";

import type { Position } from "@/lib/types";
import { PositionVotingCard } from "./position-voting-card";
import { useState, useActionState, useCallback, useEffect } from "react";
import { Button } from "../ui/button";
import { useFormStatus } from "react-dom";
import { submitVotes } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "../ui/spinner";
import { useAuth } from "@/lib/hooks/use-auth";
import { AlreadyVoted } from "./already-voted";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending && <Spinner size="small" className="mr-2"/>}
        Submit All Votes
      </Button>
    );
}

export function VotingForm({ positions }: { positions: Position[] }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<Record<string, string[]>>({});
  const [state, formAction] = useActionState(submitVotes, null);
  
  // The user's `hasVoted` status from the auth context is the source of truth.
  const hasVoted = user?.hasVoted ?? false;

  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast({ title: "Success", description: state.message });
        // No need to manually set hasVoted, the auth provider will update it
      } else {
        toast({ variant: "destructive", title: "Error", description: state.message });
      }
    }
  }, [state, toast]);

  const handlePreferenceChange = useCallback((positionId: string, rankedCandidates: string[]) => {
    setPreferences(prev => ({
      ...prev,
      [positionId]: rankedCandidates
    }));
  }, []);

  if (hasVoted) {
      return <AlreadyVoted />;
  }

  if (!user) {
    // This should ideally not be reached if AuthGuard is working correctly,
    // but it's a good fallback.
    return (
        <Card>
            <CardHeader>
                <CardTitle>Authentication Required</CardTitle>
                <CardDescription>
                    You must be logged in to vote.
                </CardDescription>
            </CardHeader>
        </Card>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="votes" value={JSON.stringify(preferences)} />
      <input type="hidden" name="userId" value={user.uid} />
      
      <div className="space-y-4">
        {positions.map((position) => (
          <PositionVotingCard 
            key={position.id} 
            position={position}
            onPreferenceChange={handlePreferenceChange}
          />
        ))}
      </div>

       <Card>
        <CardHeader>
            <CardTitle>Submit Your Vote</CardTitle>
            <CardDescription>
                Please review your selections carefully. Once you submit, your vote cannot be changed.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex justify-end">
              <SubmitButton />
            </div>
        </CardContent>
       </Card>
    </form>
  );
}
