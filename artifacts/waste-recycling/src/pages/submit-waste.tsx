import { useState } from "react";
import { useSubmitWaste, getGetStatsOverviewQueryKey, getGetWasteTypeStatsQueryKey, getGetMonthlyStatsQueryKey, getGetUserProfileQueryKey, getGetUserSubmissionsQueryKey, getGetLeaderboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, Info, UploadCloud } from "lucide-react";
import type { SubmitWasteRequestWasteType } from "@workspace/api-client-react";

export function SubmitWastePage() {
  const [wasteType, setWasteType] = useState<SubmitWasteRequestWasteType>("Plastic");
  const [weightKg, setWeightKg] = useState<string>("");
  const [centerId, setCenterId] = useState("RC-001");
  const [notes, setNotes] = useState("");
  
  const submit = useSubmitWaste();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!weightKg || isNaN(Number(weightKg)) || Number(weightKg) <= 0) {
      toast({ variant: "destructive", title: "Invalid Weight", description: "Please enter a valid weight in kg." });
      return;
    }

    submit.mutate(
      { 
        data: { 
          wasteType, 
          weightKg: Number(weightKg), 
          recyclingCenterId: centerId,
          notes: notes || undefined
        } 
      },
      {
        onSuccess: () => {
          const estimatedTokens = Number(weightKg) * 10;

          // Immediately refresh stats so the new submission shows up
          queryClient.invalidateQueries({ queryKey: getGetStatsOverviewQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetWasteTypeStatsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetMonthlyStatsQueryKey() });

          toast({ 
            title: "Submitted! Processing on blockchain...", 
            description: `Approx. ${estimatedTokens} RCT will be credited in ~5 seconds.`,
          });

          setLocation("/dashboard");

          // After 5s the backend has auto-approved — refresh dashboard + leaderboard
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: getGetUserProfileQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetUserSubmissionsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetLeaderboardQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetStatsOverviewQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetWasteTypeStatsQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetMonthlyStatsQueryKey() });
          }, 5000);
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Error", description: err.message });
        }
      }
    );
  };

  const centers = [
    { id: "RC-001", name: "Downtown Eco Hub" },
    { id: "RC-002", name: "West Side Recycling" },
    { id: "RC-003", name: "North District Facility" }
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      <div>
        <h1 className="text-4xl font-display font-bold">Submit Waste</h1>
        <p className="text-muted-foreground mt-2 text-lg">Log your recycling activity to earn tokens.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card className="rounded-3xl border border-border/50 shadow-xl shadow-black/5 overflow-hidden">
            <div className="bg-primary/5 p-6 border-b border-border/50">
              <div className="flex items-start space-x-3 text-primary">
                <Info className="w-5 h-5 mt-0.5 shrink-0" />
                <p className="text-sm font-medium leading-relaxed text-primary/90">
                  Ensure you drop off your waste at one of our verified centers. Your submission will be cross-referenced with center logs before tokens are issued to your wallet.
                </p>
              </div>
            </div>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-3">
                  <Label className="text-base">Waste Category</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {["Plastic", "Paper", "Metal", "Glass", "E-waste"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setWasteType(type as any)}
                        className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                          wasteType === type 
                            ? "border-primary bg-primary/10 text-primary shadow-sm" 
                            : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-secondary"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-base">Weight (kg)</Label>
                    <div className="relative">
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        min="0.1"
                        required
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        className="h-12 pl-4 pr-12 text-lg rounded-xl focus:ring-primary/20 focus:border-primary/50"
                        placeholder="0.0"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-muted-foreground font-medium">
                        kg
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="center" className="text-base">Drop-off Center</Label>
                    <div className="relative">
                      <select
                        id="center"
                        value={centerId}
                        onChange={(e) => setCenterId(e.target.value)}
                        className="w-full h-12 pl-4 pr-10 text-base rounded-xl border-2 border-border bg-card text-foreground focus:outline-none focus:ring-4 focus:ring-primary/20 focus:border-primary/50 appearance-none transition-all"
                      >
                        {centers.map(c => (
                          <option key={c.id} value={c.id}>{c.id} - {c.name}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-muted-foreground">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-base">Additional Notes (Optional)</Label>
                  <Input
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-12 rounded-xl focus:ring-primary/20 focus:border-primary/50"
                    placeholder="e.g., Mostly PET bottles"
                  />
                </div>

                <div className="pt-4 border-t border-border">
                  <Button 
                    type="submit" 
                    disabled={submit.isPending} 
                    className="w-full h-14 rounded-xl text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
                  >
                    {submit.isPending ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>Submit Entry <ArrowRight className="w-5 h-5 ml-2" /></>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <Card className="rounded-3xl border border-border/50 bg-gradient-to-br from-emerald-600 to-primary text-white shadow-xl shadow-primary/20">
            <CardHeader>
              <CardTitle className="text-white text-xl">Reward Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 border-y border-white/20 my-2">
                <span className="text-sm font-medium text-emerald-100 uppercase tracking-wider block mb-1">Estimated Reward</span>
                <span className="text-5xl font-display font-bold">
                  {weightKg && !isNaN(Number(weightKg)) ? (Number(weightKg) * 10).toFixed(0) : 0}
                </span>
                <span className="text-xl ml-2 font-bold text-emerald-200">RCT</span>
              </div>
              <p className="text-sm text-center text-emerald-100 mt-4 leading-relaxed">
                Standard rate applies: 10 RCT tokens per 1 kg of verified recycled waste.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-border/50 border-dashed bg-secondary/50">
            <CardContent className="p-6 text-center">
              <UploadCloud className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h4 className="font-semibold mb-1">Photo Verification</h4>
              <p className="text-sm text-muted-foreground">Photo upload coming in v2. Keep your paper receipts for now!</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
