import { useGetStatsOverview, useGetWasteTypeStats, useGetMonthlyStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { Loader2 } from "lucide-react";

export function StatsPage() {
  const { data: overview, isLoading: load1 } = useGetStatsOverview();
  const { data: wasteTypes, isLoading: load2 } = useGetWasteTypeStats();
  const { data: monthlyStats, isLoading: load3 } = useGetMonthlyStats();

  if (load1 || load2 || load3) {
    return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;
  }

  const COLORS = ['#3b82f6', '#eab308', '#64748b', '#14b8a6', '#a855f7'];

  return (
    <div className="space-y-10 py-8">
      <div>
        <h1 className="text-4xl font-display font-bold">Network Statistics</h1>
        <p className="text-muted-foreground mt-2 text-lg">Public transparency of the EcoReward platform.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <StatCard title="Total Recycled" value={`${overview?.totalWasteKg?.toLocaleString()} kg`} />
        <StatCard title="Tokens Issued" value={`${overview?.totalTokensIssued?.toLocaleString()} RCT`} />
        <StatCard title="Total Submissions" value={overview?.totalSubmissions?.toLocaleString() || '0'} />
        <StatCard title="Active Participants" value={overview?.totalUsers?.toLocaleString() || '0'} />
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="rounded-3xl border border-border/50 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle>Waste by Category (Kg)</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={wasteTypes || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="totalKg"
                  nameKey="wasteType"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(wasteTypes || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/50 shadow-lg shadow-black/5">
          <CardHeader>
            <CardTitle>Monthly Recycling Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyStats || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Bar dataKey="totalKg" name="Recycled (Kg)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string, value: string }) {
  return (
    <Card className="rounded-2xl border border-border/50 shadow-sm">
      <CardContent className="p-6">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">{title}</p>
        <h3 className="text-3xl font-display font-bold text-foreground">{value}</h3>
      </CardContent>
    </Card>
  );
}
