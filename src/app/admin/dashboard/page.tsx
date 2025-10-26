import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { getPositionsWithCandidates, getVoteResults } from "@/lib/data";


export default async function AdminDashboardPage() {
  const positions = await getPositionsWithCandidates();
  const votes = await getVoteResults();

  // We are fetching all data here on the server and passing it to the client component.
  // This follows the pattern of using Server Components for data fetching.

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">View election results.</p>
        </div>
        <AdminDashboard 
          positions={positions} 
          initialVotes={votes}
        />
    </div>
  );
}
