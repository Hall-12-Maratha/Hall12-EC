"use client";

import { VoteTally } from "./vote-tally";
import type { Position, Vote } from "@/lib/types";
import { useVotes } from "@/hooks/use-votes";
import { useActionState } from "react";
import { setElectionState } from "@/lib/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import type { ElectionState } from "@/lib/types";
import { useFormStatus } from "react-dom";

interface AdminDashboardProps {
    positions: Position[];
    initialVotes: Vote[];
    initialElectionState?: ElectionState | null;
}

export function AdminDashboard({ positions, initialVotes, initialElectionState }: AdminDashboardProps) {
  const { votes, loading } = useVotes(initialVotes);
  const { toast } = useToast();
  const [state, formAction] = useActionState(setElectionState, null);
  const { pending } = useFormStatus();

  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast({ title: "Success", description: state.message });
      } else {
        toast({ variant: "destructive", title: "Error", description: state.message });
      }
    }
  }, [state, toast]);

  const election = initialElectionState ?? { active: false };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Election Control</CardTitle>
          <CardDescription>Admin controls to start or stop voting.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Status: {election.active ? <span className="text-green-600">Active</span> : <span className="text-amber-600">Inactive</span>}</p>
              {election.startAt && <p className="text-sm text-muted-foreground">Started: {new Date(election.startAt).toLocaleString()}</p>}
              {election.endAt && <p className="text-sm text-muted-foreground">Ended: {new Date(election.endAt).toLocaleString()}</p>}
            </div>

            <div>
              {election.active ? (
                <form action={formAction}>
                  <input type="hidden" name="action" value="stop" />
                  <Button type="submit" disabled={pending} variant="destructive">{pending ? 'Processing...' : 'Stop Election'}</Button>
                </form>
              ) : (
                <form action={formAction}>
                  <input type="hidden" name="action" value="start" />
                  <Button type="submit" disabled={pending}>{pending ? 'Processing...' : 'Start Election'}</Button>
                </form>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <VoteTally positions={positions} votes={votes} loading={loading} />
    </div>
  );
}
