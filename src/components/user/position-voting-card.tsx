"use client";

import type { Position } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useState, useEffect } from "react";
import Image from "next/image";
// UI button and arrow controls removed — single-choice radio UI used instead

interface PositionVotingCardProps {
    position: Position;
    onPreferenceChange: (positionId: string, rankedCandidates: string[]) => void;
}

export function PositionVotingCard({ position, onPreferenceChange }: PositionVotingCardProps) {
    // For single-choice polling we'll store the selected candidate ID
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

    useEffect(() => {
        // notify parent when selection changes; keep API-compatible by sending an array
        if (selectedCandidateId) {
            onPreferenceChange(position.id, [selectedCandidateId]);
        } else {
            // if none selected, send empty array
            onPreferenceChange(position.id, []);
        }
    }, [selectedCandidateId, position.id, onPreferenceChange]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{position.title}</CardTitle>
            </CardHeader>
            <CardContent>
                {position.candidates.length > 0 ? (
                    <ul className="space-y-2">
                        {position.candidates.map((candidate) => (
                            <li key={candidate.id} className="flex items-center justify-between gap-4 rounded-md border bg-card p-3 shadow-sm">
                                <label className="flex items-center gap-4 w-full cursor-pointer">
                                    <input
                                        type="radio"
                                        name={`position-${position.id}`}
                                        value={candidate.id}
                                        checked={selectedCandidateId === candidate.id}
                                        onChange={() => setSelectedCandidateId(candidate.id)}
                                        className="radio mr-2"
                                        aria-label={`Select ${candidate.name}`}
                                    />
                                    <div className="flex items-center gap-4">
                                        <Image 
                                            src={candidate.imageUrl}
                                            alt={candidate.name}
                                            width={90}
                                            height={90}
                                            data-ai-hint="person avatar"
                                        />
                                        <p className="font-medium">{candidate.name}</p>
                                    </div>
                                </label>
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
