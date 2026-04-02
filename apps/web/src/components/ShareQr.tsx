"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const QRCodeCanvas = dynamic(
  () => import("qrcode.react").then((mod) => mod.QRCodeCanvas),
  { ssr: false },
);

type ShareQrProps = {
  title: string;
  description: string;
  path: string;
};

export function ShareQr({ title, description, path }: ShareQrProps) {
  const [copied, setCopied] = useState(false);
  const absoluteUrl =
    typeof window === "undefined"
      ? path
      : new URL(path, window.location.origin).toString();

  async function handleCopy() {
    const shareUrl = new URL(path, window.location.origin).toString();
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="rounded-3xl border border-border bg-white/80 p-5">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-6 text-muted">{description}</p>

      <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="rounded-2xl border border-border bg-white p-3 shadow-[0_10px_30px_rgba(70,32,13,0.08)]">
          <QRCodeCanvas value={absoluteUrl} size={168} includeMargin />
        </div>

        <div className="space-y-3 text-sm">
          <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-muted break-all">
            {path}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full bg-accent px-4 py-2 font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
          >
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}