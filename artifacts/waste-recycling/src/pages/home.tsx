import { Link } from "wouter";
import { motion } from "framer-motion";
import { useGetStatsOverview } from "@workspace/api-client-react";
import { ArrowRight, Leaf, ShieldCheck, Coins, Globe2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HomePage() {
  const { data: stats } = useGetStatsOverview();

  return (
    <div className="flex flex-col space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-24 pb-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col space-y-8"
          >
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm w-fit border border-primary/20">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              Live on the Eco-Network
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-extrabold tracking-tight leading-[1.1]">
              Turn your waste into <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">
                Digital Wealth
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-[90%] leading-relaxed">
              Join the revolution in sustainable waste management. Submit verified recycling proof, earn ETH on the blockchain, and help heal the planet.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 rounded-full text-base shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all">
                  Start Earning
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/stats">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 rounded-full text-base border-primary/20 hover:bg-primary/5">
                  View Network Stats
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-emerald-300/20 rounded-[3rem] blur-3xl -z-10" />
            <img 
              src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
              alt="Eco Friendly Concept" 
              className="w-full object-cover rounded-[2.5rem] shadow-2xl shadow-green-900/10 border border-white/40"
            />
            
            {/* Floating badge */}
            <motion.div 
              animate={{ y: [0, -10, 0] }} 
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 bg-white/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/40 flex items-center space-x-4"
            >
              <div className="p-3 bg-primary/10 rounded-xl">
                <Leaf className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Reward Rate</p>
                <p className="text-xl font-bold text-foreground">1 kg = 0.0001 ETH</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Global Impact Stats */}
      <section className="bg-card/50 backdrop-blur-md border border-border/50 rounded-3xl p-8 md:p-12 shadow-xl shadow-black/5">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold font-display">Our Global Impact</h2>
          <p className="text-muted-foreground mt-2">Together, we are making a measurable difference.</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatBox label="Total Waste Recycled" value={`${stats?.totalWasteKg?.toLocaleString() || '0'} kg`} icon={<Globe2 className="w-5 h-5" />} />
          <StatBox label="ETH Distributed" value={`${(stats?.totalTokensIssued || 0).toFixed(4)} ETH`} icon={<Coins className="w-5 h-5" />} />
          <StatBox label="Active Recyclers" value={stats?.totalUsers?.toLocaleString() || '0'} icon={<Users className="w-5 h-5" />} />
          <StatBox label="Verified Submissions" value={stats?.totalSubmissions?.toLocaleString() || '0'} icon={<ShieldCheck className="w-5 h-5" />} />
        </div>
      </section>
    </div>
  );
}

function StatBox({ label, value, icon }: { label: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center p-6 bg-white/60 rounded-2xl border border-white/40 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-3 bg-primary/10 text-primary rounded-xl mb-4">
        {icon}
      </div>
      <h3 className="text-3xl font-bold text-foreground mb-1">{value}</h3>
      <p className="text-sm font-medium text-muted-foreground text-center uppercase tracking-wider">{label}</p>
    </div>
  );
}
