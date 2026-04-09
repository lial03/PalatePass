"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";

export function NavBar() {
  const { user, logout, ready } = useAuth();
  const router = useRouter();

  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 60);
  });

  const isCompact = scrolled && !hovered;

  function handleLogout() {
    logout();
    router.push("/");
  }

  const navLinksNode = (
    <div className="flex items-center gap-6 text-sm font-medium whitespace-nowrap">
      <Link href="/restaurants" className="text-muted transition-colors duration-200 hover:text-foreground focus-gentle rounded-md px-1">
        Restaurants
      </Link>
      {ready && user && (
        <Link href="/feed" className="text-muted transition-colors duration-200 hover:text-foreground focus-gentle rounded-md px-1">
          Feed
        </Link>
      )}
      {!ready ? null : user ? (
        <>
          <Link href={`/users/${user.id}`} className="text-muted transition-colors duration-200 hover:text-foreground focus-gentle rounded-md px-1">
            Profile
          </Link>
          <Link href="/settings" className="text-muted transition-colors duration-200 hover:text-foreground focus-gentle rounded-md px-1">
            Settings
          </Link>
          <button onClick={handleLogout} className="rounded-full border border-border px-4 py-1.5 transition-colors duration-200 hover:bg-surface-strong/80 hover:text-accent focus-gentle cursor-pointer">
            Log out
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className="text-muted transition-colors duration-200 hover:text-foreground focus-gentle rounded-md px-1">
            Log in
          </Link>
          <Link href="/register" className="rounded-full bg-accent px-5 py-2 text-white shadow-md shadow-accent/20 transition-all duration-300 hover:bg-accent-strong hover:shadow-lg hover:shadow-accent/30 focus-gentle cursor-pointer">
            Sign up
          </Link>
        </>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Stable Nav */}
      <nav className="md:hidden fixed left-0 right-0 top-4 z-50 mx-auto px-4">
        <div className="flex items-center justify-between overflow-x-auto rounded-full border border-glass-border bg-glass-bg px-5 py-3 shadow-premium backdrop-blur-md">
          <Link href="/" className="font-serif text-xl font-bold tracking-tight text-foreground pr-4 shrink-0">
            PalatePass
          </Link>
          {navLinksNode}
        </div>
      </nav>

      {/* Desktop Dynamic Island Nav */}
      <motion.nav 
        className="hidden md:flex fixed left-0 right-0 z-50 mx-auto px-4 justify-center"
        initial={false}
        animate={{ top: isCompact ? "1.5rem" : "2rem" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <motion.div
           onMouseEnter={() => setHovered(true)}
           onMouseLeave={() => setHovered(false)}
           animate={{
             width: isCompact ? "180px" : "1024px",
             backgroundColor: isCompact ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)"
           }}
           transition={{ type: "spring", stiffness: 350, damping: 25 }}
           className="relative flex items-center justify-between rounded-full border border-white/40 px-6 py-3 shadow-premium backdrop-blur-xl overflow-hidden"
        >
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-foreground transition-colors z-10 shrink-0">
            PalatePass
          </Link>

          <motion.div 
            animate={{ 
              opacity: isCompact ? 0 : 1, 
              y: isCompact ? -10 : 0,
              filter: isCompact ? "blur(4px)" : "blur(0px)" 
            }}
            transition={{ duration: 0.2 }}
            className={`flex items-center gap-6 text-sm font-medium whitespace-nowrap ${isCompact ? "pointer-events-none" : ""}`}
          >
            {navLinksNode}
          </motion.div>
        </motion.div>
      </motion.nav>
    </>
  );
}
