import { useAdminGetSubmissions, useApproveSubmission, useRejectSubmission, useAdminGetStats } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ShieldAlert, Check, X, Loader2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminPage() {
  const { data: submissionsData, isLoading: loadSubs } = useAdminGetSubmissions({ status: "pending" });
  const { data: stats, isLoading: loadStats } = useAdminGetStats();
  
  const approve = useApproveSubmission();
  const reject = useRejectSubmission();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleAction = (id: number, action: 'approve' | 'reject') => {
    const mutation = action === 'approve' ? approve : reject;
    mutation.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: `Submission ${action}d successfully.` });
          queryClient.invalidateQueries({ queryKey: ["/api/admin/submissions"] });
          queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Action Failed", description: err.message });
        }
      }
    );
  };

  if (loadSubs || loadStats) {
    return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 py-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-3 bg-red-100 text-red-600 rounded-xl">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-4xl font-display font-bold">Admin Portal</h1>
          <p className="text-muted-foreground text-lg">Verify submissions and monitor system health.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <AdminStat title="Pending Verifications" value={stats?.pendingSubmissions || 0} highlight />
        <AdminStat title="Total Users" value={stats?.totalUsers || 0} />
        <AdminStat title="Tokens Issued" value={stats?.totalTokensIssued || 0} />
        <AdminStat title="Total Weight (kg)" value={stats?.totalWasteKg || 0} />
      </div>

      <div>
        <h3 className="text-2xl font-bold mb-4 font-display">Pending Submissions</h3>
        <Card className="rounded-3xl overflow-hidden border border-border/50 shadow-xl shadow-black/5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground font-semibold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Center ID</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Weight</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {submissionsData?.submissions?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <Search className="w-10 h-10 mx-auto mb-3 text-muted" />
                      <p>No pending submissions. All caught up!</p>
                    </td>
                  </tr>
                ) : (
                  submissionsData?.submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{sub.userName || `User #${sub.userId}`}</td>
                      <td className="px-6 py-4 text-muted-foreground">{format(new Date(sub.createdAt), "MMM d, HH:mm")}</td>
                      <td className="px-6 py-4 font-mono text-xs">{sub.recyclingCenterId}</td>
                      <td className="px-6 py-4">
                        <span className="bg-secondary px-2 py-1 rounded-md text-xs font-semibold">{sub.wasteType}</span>
                      </td>
                      <td className="px-6 py-4 font-bold">{sub.weightKg} kg</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            size="sm" 
                            className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                            disabled={approve.isPending || reject.isPending}
                            onClick={() => handleAction(sub.id, 'approve')}
                          >
                            <Check className="w-4 h-4 mr-1" /> Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            disabled={approve.isPending || reject.isPending}
                            onClick={() => handleAction(sub.id, 'reject')}
                          >
                            <X className="w-4 h-4 mr-1" /> Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function AdminStat({ title, value, highlight = false }: { title: string, value: number, highlight?: boolean }) {
  return (
    <div className={`p-6 rounded-2xl border ${highlight ? 'bg-red-50 border-red-200' : 'bg-card border-border'} shadow-sm`}>
      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${highlight ? 'text-red-600' : 'text-muted-foreground'}`}>{title}</p>
      <p className={`text-3xl font-display font-bold ${highlight ? 'text-red-700' : 'text-foreground'}`}>{value.toLocaleString()}</p>
    </div>
  );
}
