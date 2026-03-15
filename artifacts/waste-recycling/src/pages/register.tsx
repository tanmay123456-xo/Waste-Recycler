import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useRegisterUser, useLoginUser } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  
  const register = useRegisterUser();
  const login = useLoginUser();
  const { invalidateAuth } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate(
      { data: { name, email, password, walletAddress: walletAddress || null } },
      {
        onSuccess: () => {
          // Auto login after register
          login.mutate(
            { data: { email, password } },
            {
              onSuccess: () => {
                toast({ title: "Account created!", description: "Welcome to EcoReward." });
                invalidateAuth();
                setLocation("/dashboard");
              }
            }
          );
        },
        onError: (err: any) => {
          toast({ 
            variant: "destructive", 
            title: "Registration Failed", 
            description: err.message || "Please check your inputs." 
          });
        }
      }
    );
  };

  const isPending = register.isPending || login.isPending;

  return (
    <div className="min-h-[80vh] flex items-center justify-center relative py-12">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=1920&q=80')] bg-cover bg-center opacity-5 -z-10 rounded-3xl" />
      
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-white/50 shadow-2xl shadow-green-900/10">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-primary/10 rounded-2xl mb-4 relative">
            <Leaf className="w-8 h-8 text-primary" />
            <Sparkles className="w-4 h-4 text-emerald-400 absolute -top-1 -right-1" />
          </div>
          <h2 className="text-3xl font-display font-bold text-foreground">Join the Movement</h2>
          <p className="text-muted-foreground mt-2 text-center">Start earning rewards for recycling</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              required 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 bg-white/50 border-white/40 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
              placeholder="Jane Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input 
              id="email" 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 bg-white/50 border-white/40 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
              placeholder="jane@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password (min 6 chars)</Label>
            <Input 
              id="password" 
              type="password" 
              required 
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 bg-white/50 border-white/40 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="walletAddress">Wallet Address (Optional)</Label>
            <Input 
              id="walletAddress" 
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="h-11 bg-white/50 border-white/40 focus:border-primary/50 focus:ring-primary/20 rounded-xl font-mono text-sm"
              placeholder="0x..."
            />
            <p className="text-xs text-muted-foreground">You can add your Ethereum wallet later to receive on-chain tokens.</p>
          </div>

          <Button 
            type="submit" 
            disabled={isPending} 
            className="w-full h-12 mt-2 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
          >
            {isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
