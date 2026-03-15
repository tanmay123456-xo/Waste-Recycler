import { useState, useEffect } from "react";
import { useGetUserProfile, useUpdateWalletAddress } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserCircle, Wallet, Loader2, Save } from "lucide-react";

export function ProfilePage() {
  const { data: profile, isLoading } = useGetUserProfile();
  const updateWallet = useUpdateWalletAddress();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [wallet, setWallet] = useState("");

  useEffect(() => {
    if (profile?.walletAddress) {
      setWallet(profile.walletAddress);
    }
  }, [profile]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateWallet.mutate(
      { data: { walletAddress: wallet } },
      {
        onSuccess: () => {
          toast({ title: "Profile Updated", description: "Wallet address has been saved successfully." });
          queryClient.invalidateQueries({ queryKey: ["/api/users/profile"] });
          queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        },
        onError: (err: any) => {
          toast({ variant: "destructive", title: "Update Failed", description: err.message });
        }
      }
    );
  };

  if (isLoading) {
    return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="w-10 h-10 text-primary animate-spin" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8">
      <div>
        <h1 className="text-4xl font-display font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mt-2 text-lg">Manage your account and blockchain connections.</p>
      </div>

      <Card className="rounded-3xl border border-border/50 shadow-xl shadow-black/5 overflow-hidden">
        <div className="bg-primary/5 p-8 flex items-center space-x-6 border-b border-border/50">
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg border border-primary/20 text-primary">
            <UserCircle className="w-16 h-16" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-display text-foreground">{profile?.name}</h2>
            <p className="text-muted-foreground font-medium">{profile?.email}</p>
            <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary uppercase tracking-wider">
              {profile?.role}
            </div>
          </div>
        </div>

        <CardContent className="p-8">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-lg font-semibold text-foreground">
                <Wallet className="w-5 h-5 text-primary" />
                <h3>Web3 Wallet Configuration</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Connect your Ethereum-compatible wallet to receive your minted RCT tokens automatically upon submission verification. Ensure it's a valid 0x address.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="wallet">Wallet Address</Label>
                <Input 
                  id="wallet" 
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  className="h-12 font-mono text-sm bg-secondary/50 rounded-xl focus:bg-white focus:ring-primary/20 focus:border-primary/50 transition-all"
                  placeholder="0x..."
                  pattern="^0x[a-fA-F0-9]{40}$"
                  title="Must be a valid Ethereum address starting with 0x"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <Button 
                type="submit" 
                disabled={updateWallet.isPending || wallet === profile?.walletAddress}
                className="h-12 px-8 rounded-xl shadow-md shadow-primary/20 transition-all hover:shadow-primary/30"
              >
                {updateWallet.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
