import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMetaMask } from "@/hooks/use-metamask";
import { useLogoutUser } from "@workspace/api-client-react";
import { Leaf, LogOut, Menu, User, LayoutDashboard, Send, BarChart3, Trophy, ShieldAlert, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Layout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, invalidateAuth } = useAuth();
  const logout = useLogoutUser();
  const [location] = useLocation();
  const { account, connect, isConnecting, isInstalled } = useMetaMask(isAuthenticated);

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => invalidateAuth()
    });
  };

  const navLinks = [
    { href: "/", label: "Home", icon: <Leaf className="w-4 h-4 mr-2" /> },
    { href: "/stats", label: "Statistics", icon: <BarChart3 className="w-4 h-4 mr-2" /> },
    { href: "/leaderboard", label: "Leaderboard", icon: <Trophy className="w-4 h-4 mr-2" /> },
  ];

  const authLinks = [
    { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4 mr-2" /> },
    { href: "/submit", label: "Submit Waste", icon: <Send className="w-4 h-4 mr-2" /> },
  ];

  if (user?.role === "admin") {
    authLinks.push({ href: "/admin", label: "Admin Panel", icon: <ShieldAlert className="w-4 h-4 mr-2" /> });
  }

  const allLinks = isAuthenticated ? [...navLinks, ...authLinks] : navLinks;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 -z-10 bg-background">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      </div>

      <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/60 backdrop-blur-xl shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="p-1.5 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-foreground">
                Eco<span className="text-primary">Reward</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {allLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center ${
                    location === link.href 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3 border-l border-border pl-4">
                  {/* MetaMask Button */}
                  {account ? (
                    <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-full text-xs font-mono text-orange-700">
                      <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                      {account.substring(0, 6)}...{account.substring(account.length - 4)}
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={connect}
                      disabled={isConnecting || !isInstalled}
                      className="rounded-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:border-orange-300 text-xs h-8"
                      title={!isInstalled ? "MetaMask not installed — visit metamask.io" : "Connect MetaMask wallet"}
                    >
                      <Wallet className="w-3.5 h-3.5 mr-1.5" />
                      {isConnecting ? "Connecting..." : !isInstalled ? "Install MetaMask" : "Connect Wallet"}
                    </Button>
                  )}
                  <Link href="/profile" className="flex items-center text-sm font-medium text-foreground hover:text-primary transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 text-primary border border-primary/20">
                      <User className="w-4 h-4" />
                    </div>
                    {user?.name}
                  </Link>
                  <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3 border-l border-border pl-4">
                  <Link href="/login" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                    Log in
                  </Link>
                  <Link href="/register">
                    <Button className="rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-foreground">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] sm:w-[400px] border-l-white/20 bg-white/80 backdrop-blur-xl">
                  <div className="flex flex-col space-y-6 mt-8">
                    {allLinks.map((link) => (
                      <Link 
                        key={link.href} 
                        href={link.href}
                        className={`flex items-center text-lg font-medium p-3 rounded-2xl transition-colors ${
                          location === link.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
                        }`}
                      >
                        {link.icon}
                        {link.label}
                      </Link>
                    ))}
                    
                    <div className="border-t border-border pt-6 flex flex-col space-y-4">
                      {isAuthenticated ? (
                        <>
                          <Link href="/profile" className="flex items-center text-lg font-medium text-foreground p-3 rounded-2xl hover:bg-secondary">
                            <User className="w-5 h-5 mr-3" /> Profile
                          </Link>
                          <Button variant="destructive" onClick={handleLogout} className="w-full justify-start text-lg rounded-2xl h-12">
                            <LogOut className="w-5 h-5 mr-3" /> Log Out
                          </Button>
                        </>
                      ) : (
                        <>
                          <Link href="/login">
                            <Button variant="outline" className="w-full justify-center text-lg rounded-2xl h-12 border-primary/20 hover:bg-primary/5">
                              Log in
                            </Button>
                          </Link>
                          <Link href="/register">
                            <Button className="w-full justify-center text-lg rounded-2xl h-12 shadow-lg shadow-primary/25">
                              Get Started
                            </Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-white/20 bg-white/40 backdrop-blur-md">
        <p>© {new Date().getFullYear()} EcoReward System. Empowering a sustainable future.</p>
      </footer>
    </div>
  );
}
