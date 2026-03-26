import { useGetLeaderboard } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Trophy, Medal, Loader2, Crown } from "lucide-react";
import { motion } from "framer-motion";

export function LeaderboardPage() {
  const { data: leaderboard, isLoading } = useGetLeaderboard({ limit: 50 });

  if (isLoading) {
    return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;
  }

  const getRankBadge = (rank: number) => {
    switch(rank) {
      case 1: return <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center shadow-inner border border-yellow-300"><Crown className="w-5 h-5 text-yellow-600" /></div>;
      case 2: return <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shadow-inner border border-slate-300"><Medal className="w-5 h-5 text-slate-500" /></div>;
      case 3: return <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shadow-inner border border-orange-200"><Medal className="w-5 h-5 text-orange-700" /></div>;
      default: return <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-bold">{rank}</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full text-primary mb-2">
          <Trophy className="w-12 h-12" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold">Top Recyclers</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Honoring the champions of sustainability. These individuals are making the biggest impact on our network.
        </p>
      </div>

      <Card className="rounded-3xl overflow-hidden border border-border/50 shadow-2xl shadow-green-900/5 bg-white/80 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-primary/5 text-primary font-semibold text-sm">
              <tr>
                <th className="px-6 py-5 w-24 text-center">Rank</th>
                <th className="px-6 py-5">Hero</th>
                <th className="px-6 py-5 text-right">ETH Earned</th>
                <th className="px-6 py-5 text-right hidden sm:table-cell">Total Recycled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {leaderboard?.map((entry, index) => (
                <motion.tr 
                  key={entry.userId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-primary/5 transition-colors group"
                >
                  <td className="px-6 py-4 flex justify-center">
                    {getRankBadge(entry.rank)}
                  </td>
                  <td className="px-6 py-4 font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                    {entry.name}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-display font-bold text-emerald-600 text-xl">
                      {entry.tokenBalance.toFixed(4)} <span className="text-sm font-medium">ETH</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right hidden sm:table-cell text-muted-foreground font-medium">
                    {entry.totalWasteKg.toLocaleString()} kg
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
