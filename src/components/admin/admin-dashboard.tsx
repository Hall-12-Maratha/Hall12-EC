"use client";

import { VoteTally } from "./vote-tally";
import type { Position, Vote } from "@/lib/types";
import { useVotes } from "@/hooks/use-votes";

interface AdminDashboardProps {
    positions: Position[];
    initialVotes: Vote[];
}

export function AdminDashboard({ positions, initialVotes }: AdminDashboardProps) {
  const { votes, loading } = useVotes(initialVotes);
  return (
    <VoteTally positions={positions} votes={votes} loading={loading} />
  );
}
