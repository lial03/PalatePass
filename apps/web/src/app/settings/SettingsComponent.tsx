"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { User, Mail, FileText, Camera, Loader2, CheckCircle2, ChevronLeft } from "lucide-react";
import Script from "next/script";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

declare global {
  interface Window {
    cloudinary: {
      createUploadWidget: (
        options: Record<string, unknown>,
        callback: (error: Error | null, result: { event: string; info: { secure_url: string } }) => void
      ) => { open: () => void };
    };
  }
}

export default function SettingsPage() {
  const { user, ready, refreshUser } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !user) {
      router.push("/login");
    }
    if (user) {
      setDisplayName(user.displayName || "");
      setBio(user.bio || "");
      setAvatarUrl(user.avatarUrl || "");
    }
  }, [user, ready, router]);

  const handleUpload = () => {
    if (!window.cloudinary) return;

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "demo",
        uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "palatepass_unsigned",
        multiple: false,
        resourceType: "image",
        cropping: true,
        croppingAspectRatio: 1,
        showSkipCropButton: false,
      },
      (error, result) => {
        if (!error && result && result.event === "success") {
          setAvatarUrl(result.info.secure_url);
        }
      }
    );
    widget.open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      await api.users.updateMe({ displayName, bio, avatarUrl });
      await refreshUser();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <>
      <Script src="https://upload-widget.cloudinary.com/global/all.js" strategy="lazyOnload" />
      <main className="min-h-screen bg-background pt-24 pb-20">
        <div className="mx-auto max-w-2xl px-6">
          <button 
            onClick={() => router.back()} 
            className="mb-8 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted transition hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          <header className="mb-10">
            <h1 className="font-serif text-5xl text-foreground">Settings</h1>
            <p className="mt-3 text-lg text-muted">Customize your public profile and account preferences.</p>
          </header>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2.5rem] border border-border/50 bg-white p-8 shadow-[0_20px_50px_rgba(0,0,0,0.03)] sm:p-12 backdrop-blur-sm"
          >
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Profile Picture */}
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <div className="relative group cursor-pointer" onClick={handleUpload}>
                  <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-[2rem] border-4 border-surface-strong bg-surface shadow-xl">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="Avatar Preview" fill className="object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-surface-strong text-muted">
                        <User className="h-12 w-12" />
                        </div>
                    )}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center rounded-[2rem] bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="text-white h-8 w-8" />
                  </div>
                </div>
                <div className="text-center sm:text-left">
                    <h3 className="text-lg font-bold">Profile Picture</h3>
                    <p className="mt-1 text-sm text-muted">Tap the image to upload a new portrait. Recommended size: 400x400px.</p>
                    <button 
                        type="button" 
                        onClick={handleUpload}
                        className="mt-3 text-sm font-bold text-accent hover:underline"
                    >
                        Change Photo
                    </button>
                </div>
              </div>

              <div className="grid gap-6">
                {/* Display Name */}
                <div className="space-y-2">
                  <label className="ml-2 text-xs font-bold uppercase tracking-widest text-muted">Display Name</label>
                  <div className="group relative flex items-center rounded-2xl border border-border/80 bg-surface px-4 transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/10">
                    <User className="h-5 w-5 text-muted transition-colors group-focus-within:text-accent" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="w-full bg-transparent px-3 py-4 text-sm outline-none placeholder-muted/50"
                      required
                    />
                  </div>
                </div>

                {/* Email (Read Only for now) */}
                <div className="space-y-2 opacity-60">
                  <label className="ml-2 text-xs font-bold uppercase tracking-widest text-muted">Email Address</label>
                  <div className="flex items-center rounded-2xl border border-border/80 bg-surface/50 px-4">
                    <Mail className="h-5 w-5 text-muted" />
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full bg-transparent px-3 py-4 text-sm outline-none"
                    />
                  </div>
                  <p className="ml-2 text-[10px] text-muted uppercase tracking-tighter">Contact support to change email</p>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <label className="ml-2 text-xs font-bold uppercase tracking-widest text-muted">Bio</label>
                  <div className="group relative flex rounded-2xl border border-border/80 bg-surface p-4 transition-all focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/10">
                    <FileText className="mr-3 mt-1 h-5 w-5 shrink-0 text-muted transition-colors group-focus-within:text-accent" />
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about your culinary lens..."
                      className="min-h-[120px] w-full bg-transparent text-sm outline-none placeholder-muted/50"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600 shadow-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 rounded-2xl border border-green-100 bg-green-50 p-4 text-sm font-bold text-green-700 shadow-sm">
                  <CheckCircle2 className="h-5 w-5" /> Changes saved successfully!
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-accent py-4 text-base font-bold tracking-wide text-white shadow-xl shadow-accent/20 transition hover:bg-accent-strong disabled:bg-accent/50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Profile Changes"}
              </button>
            </form>
          </motion.div>
        </div>
      </main>
    </>
  );
}
