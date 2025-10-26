"use client";

import type { Position } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "../ui/button";
import { ArrowDown, ArrowUp } from "lucide-react";

interface PositionVotingCardProps {
    position: Position;
    onPreferenceChange: (positionId: string, rankedCandidates: string[]) => void;
}

export function PositionVotingCard({ position, onPreferenceChange }: PositionVotingCardProps) {
    const [rankedCandidates, setRankedCandidates] = useState(position.candidates);

    useEffect(() => {
        onPreferenceChange(position.id, rankedCandidates.map(c => c.id));
    }, [rankedCandidates, position.id, onPreferenceChange]);

    const moveCandidate = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === rankedCandidates.length - 1) return;
        
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        const newRankedCandidates = [...rankedCandidates];
        const temp = newRankedCandidates[index];
        newRankedCandidates[index] = newRankedCandidates[newIndex];
        newRankedCandidates[newIndex] = temp;
        
        setRankedCandidates(newRankedCandidates);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{position.title}</CardTitle>
            </CardHeader>
            <CardContent>
                {rankedCandidates.length > 0 ? (
                    <ul className="space-y-2">
                        {rankedCandidates.map((candidate, index) => (
                            <li key={candidate.id} className="flex items-center justify-between gap-4 rounded-md border bg-card p-3 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <span className="text-xl font-bold text-primary w-6 text-center">{index + 1}</span>
                                    <Image 
                                        src={candidate.imageUrl}
                                        alt={candidate.name}
                                        width={90}
                                        height={90}
                                        data-ai-hint="person avatar"
                                    />
                                    <p className="font-medium">{candidate.name}</p>
                                </div>
                                <div className="flex gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => moveCandidate(index, 'up')}
                                        disabled={index === 0}
                                        aria-label={`Move ${candidate.name} up`}
                                    >
                                        <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => moveCandidate(index, 'down')}
                                        disabled={index === rankedCandidates.length - 1}
                                        aria-label={`Move ${candidate.name} down`}
                                    >
                                        <ArrowDown className="h-4 w-4" />
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground">No candidates for this position.</p>
                )}
            </CardContent>
        </Card>
    );
}
