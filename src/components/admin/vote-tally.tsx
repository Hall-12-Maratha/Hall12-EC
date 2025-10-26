"use client";

import { useMemo } from "react";
import type { Position, Vote } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "../ui/skeleton";
import type { ChartConfig } from "@/components/ui/chart";

interface VoteTallyProps {
  positions: Position[];
  votes: Vote[];
  loading: boolean;
}

// Borda Count implementation: if there are N candidates, a 1st preference vote gets N points,
// 2nd gets N-1, and so on. A last place vote gets 1 point.
function calculateBordaScores(votes: Vote[], positionId: string, candidateIds: string[]) {
    const scores: Record<string, number> = {};
    const numCandidates = candidateIds.length;
    candidateIds.forEach(id => scores[id] = 0);

    const positionVotes = votes.filter(v => v.positionId === positionId);

    positionVotes.forEach(vote => {
        vote.preferences.forEach((candidateId, index) => {
            if (scores[candidateId] !== undefined) {
                scores[candidateId] += (numCandidates - index);
            }
        });
    });

    return scores;
}


export function VoteTally({ positions, votes, loading }: VoteTallyProps) {
  const voteDataByPosition = useMemo(() => {
    return positions.map(position => {
        const candidateIds = position.candidates.map(c => c.id);
        const scores = calculateBordaScores(votes, position.id, candidateIds);
        
        const chartData = position.candidates.map(candidate => ({
            name: candidate.name,
            score: scores[candidate.id] || 0,
        })).sort((a, b) => b.score - a.score);

        const chartConfig = {
            score: {
                label: "Score",
                color: "hsl(var(--primary))",
            }
        } satisfies ChartConfig;


        return {
            ...position,
            chartData,
            chartConfig,
        }
    });
  }, [positions, votes]);

  if (loading) {
    return (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {positions.map(position => (
                <Card key={position.id}>
                    <CardHeader>
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-3/4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-[300px] w-full" />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
  }

  if (votes.length === 0) {
    return (
        <div className="flex h-[calc(100vh-15rem)] items-center justify-center rounded-lg border border-dashed shadow-sm">
            <div className="flex flex-col items-center gap-2 text-center">
                <h3 className="text-2xl font-bold tracking-tight">No votes yet</h3>
                <p className="text-sm text-muted-foreground">Results will be shown here once votes are cast.</p>
            </div>
        </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      {voteDataByPosition.map((positionData) => (
        <Card key={positionData.id}>
          <CardHeader>
            <CardTitle>{positionData.title}</CardTitle>
            <CardDescription>Results based on Borda Count method.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={positionData.chartConfig} className="min-h-[300px] w-full">
                <BarChart data={positionData.chartData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="score" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{fill: 'hsl(var(--muted))'}} content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="score" fill="var(--color-score)" radius={4} name="Score"/>
                </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
