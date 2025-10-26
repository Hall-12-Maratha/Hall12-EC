import { getUser, getPositionsWithCandidates } from "@/lib/data";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { VotingForm } from "@/components/user/voting-form";
import { AlreadyVoted } from "@/components/user/already-voted";
import { auth } from "@/lib/firebase";
import { getAuth } from "firebase/auth";

// This is a workaround to get the user on the server.
// In a real app, you'd have a more robust session management system.
async function getCurrentUser() {
    // This is not a reliable way to get user in server components with client-side auth.
    // For this demonstration, we'll assume the user is available via a hook on the client
    // and pass the UID from there. A proper implementation would use server-side sessions.
    // We pass a dummy value and rely on client-side fetching.
    return null;
}

export default async function UserDashboardPage() {
    // Due to the limitation of Firebase Client SDK in Server Components,
    // we fetch user data on the client. But we still need to fetch positions.
    const positions = await getPositionsWithCandidates();

    // The logic to show AlreadyVoted or VotingForm will now be inside a client component
    // that has access to the user's `hasVoted` status via the useAuth hook.
    
    if (positions.length === 0) {
        return (
            <div className="flex h-[calc(100vh-10rem)] items-center justify-center rounded-lg border border-dashed shadow-sm">
                <div className="flex flex-col items-center gap-2 text-center">
                    <h3 className="text-2xl font-bold tracking-tight">No elections are active.</h3>
                    <p className="text-sm text-muted-foreground">Please check back later.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Cast Your Vote</h1>
                <p className="text-muted-foreground">Rank candidates in order of preference for each position.</p>
            </div>
            <VotingForm positions={positions} />
        </div>
    );
}
