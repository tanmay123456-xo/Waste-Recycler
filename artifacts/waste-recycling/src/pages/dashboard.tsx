import { useGetUserProfile, useGetUserSubmissions } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { Coins, Leaf, Recycle, Clock, ArrowUpRight, Copy, CheckCircle2, XCircle, FileClock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export function DashboardPage() {
  const { data: profile, isLoading: isProfileLoading } = useGetUserProfile();
  const { data: submissionsData, isLoading: isSubsLoading } = useGetUserSubmissions({});
  const { toast } = useToast();

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast({ description: "Transaction hash copied to clipboard!" });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <FileClock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getWasteColor = (type: string) => {
    const colors: Record<string, string> = {
      'Plastic': 'bg-blue-100 text-blue-800 border-blue-200',
      'Paper': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Metal': 'bg-slate-100 text-slate-800 border-slate-200',
      'Glass': 'bg-teal-100 text-teal-800 border-teal-200',
      'E-waste': 'bg-purple-100 text-purple-800 border-purple-200',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (isProfileLoading || isSubsLoading) {
    return <div className="animate-pulse h-[60vh] flex items-center justify-center">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-lg">Welcome back, {profile?.name}</p>
        </div>
        <Link href="/submit">
          <Button size="lg" className="rounded-xl shadow-lg shadow-primary/20 h-12 px-6">
            <Recycle className="w-5 h-5 mr-2" /> Submit New Waste
          </Button>
        </Link>
      </div>

      {profile?.walletAddress ? (
        <div className="inline-flex items-center px-4 py-2 bg-secondary rounded-lg border border-border text-sm font-mono text-muted-foreground">
          <span className="mr-2 uppercase text-xs font-bold tracking-wider text-foreground">Wallet:</span> 
          {profile.walletAddress}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-xl flex items-center justify-between">
          <span className="text-sm font-medium">You haven't connected a wallet to receive on-chain tokens.</span>
          <Link href="/profile">
            <Button size="sm" variant="outline" className="bg-white border-yellow-300 hover:bg-yellow-100">Add Wallet</Button>
          </Link>
        </div>
      )}

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="rounded-2xl border border-border/50 shadow-lg shadow-black/5 overflow-hidden relative">
            <div className="absolute right-0 top-0 w-32 h-32 bg-primary/5 rounded-bl-full -z-10" />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Token Balance</p>
                <div className="p-2 bg-primary/10 rounded-lg text-primary"><Coins className="w-5 h-5" /></div>
              </div>
              <div className="flex items-baseline">
                <h2 className="text-5xl font-display font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-400">
                  {profile?.tokenBalance?.toLocaleString() || 0}
                </h2>
                <span className="ml-2 text-xl font-bold text-muted-foreground">RCT</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="rounded-2xl border border-border/50 shadow-lg shadow-black/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Recycled</p>
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Leaf className="w-5 h-5" /></div>
              </div>
              <div className="flex items-baseline">
                <h2 className="text-4xl font-display font-bold text-foreground">
                  {profile?.totalWasteKg?.toLocaleString() || 0}
                </h2>
                <span className="ml-2 text-lg font-medium text-muted-foreground">kg</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="rounded-2xl border border-border/50 shadow-lg shadow-black/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Verified Submissions</p>
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><ShieldCheck className="w-5 h-5" /></div>
              </div>
              <div className="flex items-baseline">
                <h2 className="text-4xl font-display font-bold text-foreground">
                  {profile?.approvedSubmissions || 0}
                </h2>
                <span className="ml-2 text-lg font-medium text-muted-foreground">/ {profile?.totalSubmissions || 0} total</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* History */}
      <div>
        <h3 className="text-2xl font-display font-bold mb-6 flex items-center">
          <Clock className="w-6 h-6 mr-2 text-primary" /> Recent Submissions
        </h3>
        
        <Card className="rounded-2xl overflow-hidden border border-border/50 shadow-xl shadow-black/5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-muted-foreground font-semibold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Weight</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Reward</th>
                  <th className="px-6 py-4 text-right">Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {submissionsData?.submissions?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center">
                        <Recycle className="w-12 h-12 mb-3 text-muted" />
                        <p>No submissions yet. Start recycling!</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  submissionsData?.submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">
                        {format(new Date(sub.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${getWasteColor(sub.wasteType)}`}>
                          {sub.wasteType}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">{sub.weightKg} kg</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2 capitalize font-medium text-muted-foreground">
                          {getStatusIcon(sub.status)}
                          <span>{sub.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">
                        {sub.tokensAwarded ? `+${sub.tokensAwarded} RCT` : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {sub.transactionHash ? (
                          <div className="flex items-center justify-end space-x-2">
                            <span className="font-mono text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                              {sub.transactionHash.substring(0, 8)}...{sub.transactionHash.substring(sub.transactionHash.length - 6)}
                            </span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleCopyHash(sub.transactionHash!)}>
                              <Copy className="w-3 h-3" />
                            </Button>
                            <a href={`https://etherscan.io/tx/${sub.transactionHash}`} target="_blank" rel="noreferrer" title="View on Block Explorer">
                              <ArrowUpRight className="w-4 h-4 text-primary hover:text-primary/80" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">Pending tx...</span>
                        )}
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
