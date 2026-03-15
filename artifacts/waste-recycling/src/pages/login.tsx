import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLoginUser } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Leaf, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLoginUser();
  const { invalidateAuth } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { data: { email, password } },
      {
        onSuccess: () => {
          toast({ title: "Welcome back!", description: "Successfully logged in." });
          invalidateAuth();
          setLocation("/dashboard");
        },
        onError: (err: any) => {
          toast({ 
            variant: "destructive", 
            title: "Login Failed", 
            description: err.message || "Invalid credentials." 
          });
        }
      }
    );
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center relative">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1920&q=80')] bg-cover bg-center opacity-5 -z-10 rounded-3xl" />
      
      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-white/50 shadow-2xl shadow-green-900/10">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-primary/10 rounded-2xl mb-4">
            <Leaf className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-display font-bold text-foreground">Welcome Back</h2>
          <p className="text-muted-foreground mt-2 text-center">Log in to manage your recycling rewards</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input 
              id="email" 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-white/50 border-white/40 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
              placeholder="you@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input 
              id="password" 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 bg-white/50 border-white/40 focus:border-primary/50 focus:ring-primary/20 rounded-xl"
            />
          </div>

          <Button 
            type="submit" 
            disabled={login.isPending} 
            className="w-full h-12 rounded-xl text-base font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/30"
          >
            {login.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>Sign In <ArrowRight className="w-4 h-4 ml-2" /></>
            )}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Create one now
          </Link>
        </p>
      </div>
    </div>
  );
}
