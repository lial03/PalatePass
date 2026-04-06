"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Search, Compass, Users, Star, ArrowRight } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacityHero = useTransform(scrollY, [0, 400], [1, 0]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/restaurants`); // Simple mock routing for now
  };

  return (
    <main className="w-full">
      {/* Immersive Hero Section - Using negative margins to override global layout padding and touch the top navbar */}
      <section className="relative flex min-h-[calc(100vh-1rem)] -mt-[6rem] w-full flex-col items-center justify-center overflow-hidden bg-black pt-24 text-white">
        
        {/* Parallax Background */}
        <motion.div 
          style={{ 
            y: y1
          }}
          className="absolute inset-0 z-0"
        >
          <Image 
            src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=2000&auto=format&fit=crop" 
            alt="PalatePass Header"
            fill
            priority
            className="object-cover object-center opacity-80"
          />
        </motion.div>
        
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90" />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent" />

        <motion.div 
          style={{ opacity: opacityHero }}
          className="relative z-10 flex w-full max-w-5xl flex-col items-center px-6 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <span className="mb-6 inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.25em] backdrop-blur-md">
              PalatePass
            </span>
            <h1 className="mt-6 max-w-4xl font-serif text-6xl leading-[1.1] sm:text-7xl lg:text-8xl">
              Curated Tables. <br />
              <span className="text-white/60">Trusted Tastes.</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-lg font-medium text-white/80 sm:text-xl">
              Escape the noise of anonymous reviews. Discover the city&apos;s finest plates guided purely by the people whose taste you trust.
            </p>
          </motion.div>

          {/* Omni Search Block */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="mt-12 w-full max-w-2xl"
          >
            <form 
              onSubmit={handleSearch}
              className="group relative flex items-center overflow-hidden rounded-full border border-white/20 bg-white/10 shadow-2xl backdrop-blur-xl transition-all focus-within:border-white/50 focus-within:bg-white/20 hover:bg-white/15"
            >
              <div className="pl-6 pr-3 text-white/60 group-focus-within:text-white">
                <Search className="h-6 w-6" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search a city, vibe, or restaurant..."
                className="w-full bg-transparent py-5 pr-6 text-lg text-white placeholder-white/50 outline-none"
              />
              <button 
                type="submit"
                className="absolute right-2 mr-1 rounded-full bg-accent px-8 py-3.5 font-bold text-white transition hover:bg-accent-strong"
              >
                Explore
              </button>
            </form>
            
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-medium text-white/70">
              <span>Trending:</span>
              {["Omakase", "Natural Wine", "Rooftop Dining", "Handmade Pasta"].map((tag) => (
                <Link
                  key={tag}
                  href="/restaurants"
                  className="rounded-full border border-white/20 bg-white/5 px-4 py-1.5 transition hover:bg-white/20 hover:text-white"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Bento Grid Section */}
      <section className="relative z-20 mx-auto -mt-20 max-w-7xl px-6 pb-24 sm:px-10 lg:px-12">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.15 } },
            hidden: {}
          }}
          className="grid gap-6 md:grid-cols-12"
        >
          {/* Card 1: Taste Match */}
          <motion.div 
            variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 25 } } }}
            className="group relative flex h-[28rem] flex-col justify-between overflow-hidden rounded-[2rem] border border-border/50 bg-[#161210] p-10 text-white shadow-xl md:col-span-5"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            
            <div>
              <div className="mb-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#f5dbce] backdrop-blur-md">
                <Compass className="mr-2 inline h-4 w-4" /> The Algorithm
              </div>
              <h2 className="font-serif text-4xl leading-tight">Your perfect <br/> Taste Match.</h2>
            </div>
            
            <div className="relative mt-8">
              <div className="absolute -inset-10 bg-accent/20 blur-3xl" />
              <div className="relative flex items-end gap-6 text-[#f9ecd9]">
                <p className="font-serif text-8xl leading-none">94<span className="text-5xl">%</span></p>
                <p className="max-w-[200px] pb-2 text-sm leading-relaxed text-[#e8cfba]">
                   Overlap with friends who love natural wine and handmade pasta.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Discover Real Reviews */}
          <motion.div 
            variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 25 } } }}
            className="group relative overflow-hidden rounded-[2rem] border border-border/50 bg-surface shadow-xl md:col-span-7"
          >
            <Image 
              src="https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1200&auto=format&fit=crop" 
              alt="L'Antica Pizzeria"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-black via-black/60 to-black/10" />
            
            <div className="relative flex h-[28rem] flex-col justify-end p-10 text-white">
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded-full border border-white/30 bg-black/40 px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                  Italian
                </span>
                <span className="flex items-center gap-1 rounded-full bg-white/95 px-3 py-1.5 text-[0.8rem] font-bold text-accent shadow-sm backdrop-blur">
                  <Star className="h-4 w-4 fill-accent" /> 4.9
                </span>
              </div>
              <h2 className="mb-2 font-serif text-4xl leading-tight">L&apos;Antica Pizzeria</h2>
              <p className="mb-6 max-w-md text-base text-white/80">&quot;The absolute best Neapolitan crust out of Naples. A must-visit.&quot;</p>
              
              <Link
               href="/restaurants"
               className="inline-flex items-center gap-2 font-bold uppercase tracking-widest text-accent transition hover:text-white"
              >
                Read reviews <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>

          {/* Card 3: Trust Graph */}
          <motion.div 
            variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 25 } } }}
            className="group relative overflow-hidden rounded-[2rem] border border-border/50 bg-surface-strong p-10 shadow-xl md:col-span-12 lg:col-span-12"
          >
            <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
              
              <div className="max-w-xl">
                <div className="mb-6 inline-flex rounded-full border border-border/50 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-muted backdrop-blur-md">
                  <Users className="mr-2 inline h-4 w-4" /> Trusted Circles
                </div>
                <h2 className="font-serif text-5xl leading-tight text-foreground">Follow plates, <br/> not crowds.</h2>
                <p className="mt-6 text-lg leading-relaxed text-muted">
                  The best recommendations don&apos;t come from a five-star average compiled by strangers. They come from the people whose culinary taste you actually respect.
                </p>
                <div className="mt-8 flex -space-x-4">
                  {[
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
                  ].map((img, i) => (
                    <div key={i} className="relative h-16 w-16 overflow-hidden rounded-full border-4 border-surface-strong shadow-sm transition hover:scale-110 hover:z-10">
                      <Image src={img} alt="User Avatar" fill className="object-cover" />
                    </div>
                  ))}
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-surface-strong bg-accent text-sm font-bold text-white shadow-sm">+2k</div>
                </div>
              </div>

              <div className="flex-1">
                 <div className="relative rounded-3xl border border-border bg-white/60 p-6 shadow-2xl backdrop-blur-md">
                    <p className="mb-4 font-serif text-xl italic text-foreground">&quot;If Sarah recommended this, I&apos;m booking a table tonight.&quot;</p>
                    <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-4">
                       <span className="text-sm font-bold uppercase tracking-widest text-muted">Curated Graph</span>
                       <Link href="/register" className="text-sm font-bold text-accent hover:underline">Join the Network</Link>
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>

        </motion.div>
      </section>
    </main>
  );
}
