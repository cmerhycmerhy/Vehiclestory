"use client";

import { useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ShareScreen({
  vehicleName,
  nickname,
  coverPhotoUrl,
  albumUrl,
}: {
  vehicleName: string;
  nickname: string | null;
  coverPhotoUrl: string | null;
  albumUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [cardDownloaded, setCardDownloaded] = useState(false);

  const shareText = `${vehicleName}${nickname ? ` — ${nickname}` : ""}: check out its story on VehicleStory.`;

  async function handleCopyLink() {
    setError(null);
    try {
      await navigator.clipboard.writeText(albumUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy the link — please copy it manually.");
    }
  }

  function handleFacebookShare() {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(albumUrl)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function handleTwitterShare() {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(albumUrl)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  function handleWhatsAppShare() {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`${shareText} ${albumUrl}`)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ title: vehicleName, text: shareText, url: albumUrl });
    } catch {
      // User cancelled — not an error.
    }
  }

  async function handleDownloadQR() {
    setError(null);
    setIsGeneratingQR(true);
    try {
      const canvas = document.createElement("canvas");
      await QRCode.toCanvas(canvas, albumUrl, {
        width: 512,
        margin: 2,
        color: { dark: "#031e49", light: "#f5f5f5" },
      });
      canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, "vehiclestory-qr.png");
      });
    } catch {
      setError("Could not generate QR code. Please try again.");
    } finally {
      setIsGeneratingQR(false);
    }
  }

  async function handleDownloadStoryCard() {
    setError(null);
    setCardDownloaded(false);
    setIsGeneratingCard(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      ctx.fillStyle = "#031e49";
      ctx.fillRect(0, 0, 1080, 1920);

      const photoAreaHeight = 1400;

      if (coverPhotoUrl) {
        const img = await loadImage(coverPhotoUrl);
        const scale = Math.max(1080 / img.width, photoAreaHeight / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (1080 - w) / 2;
        const y = (photoAreaHeight - h) / 2;
        ctx.drawImage(img, x, y, w, h);

        const gradient = ctx.createLinearGradient(
          0,
          photoAreaHeight - 400,
          0,
          photoAreaHeight,
        );
        gradient.addColorStop(0, "rgba(3,30,73,0)");
        gradient.addColorStop(1, "rgba(3,30,73,1)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, photoAreaHeight - 400, 1080, 400);
      }

      ctx.textAlign = "center";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 64px Arial";
      ctx.fillText(vehicleName, 540, 1460, 1000);

      if (nickname) {
        ctx.fillStyle = "#b28706";
        ctx.font = "italic 44px Arial";
        ctx.fillText(nickname, 540, 1530, 1000);
      }

      ctx.fillStyle = "#b28706";
      ctx.font = "bold 40px Arial";
      ctx.fillText("VehicleStory", 540, 1750);

      ctx.fillStyle = "#dcdcdd";
      ctx.font = "28px Arial";
      ctx.fillText(albumUrl.replace(/^https?:\/\//, ""), 540, 1800, 1000);

      canvas.toBlob((blob) => {
        if (blob) {
          downloadBlob(blob, "vehiclestory-story-card.png");
          setCardDownloaded(true);
        }
      });
    } catch {
      setError("Could not generate the story card. Please try again.");
    } finally {
      setIsGeneratingCard(false);
    }
  }

  return (
    <div className="w-full max-w-xl text-center">
      {coverPhotoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverPhotoUrl}
          alt=""
          className="mx-auto h-64 w-full rounded-lg object-cover"
        />
      )}

      <h1 className="mt-6 text-3xl font-bold tracking-tight">
        Your car&apos;s story is live.
      </h1>
      <p className="mt-2 text-brandgrey">{vehicleName}</p>

      <div className="mt-6 flex items-center gap-2 rounded-md border border-brandgrey/30 bg-offwhite px-4 py-2.5 text-navy">
        <span className="flex-1 truncate text-left text-sm">{albumUrl}</span>
        <button
          type="button"
          onClick={handleCopyLink}
          className="shrink-0 rounded bg-navy px-3 py-1 text-xs font-semibold text-white hover:opacity-90"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>

      {/* Instagram has no web share-intent API — the only way to get a post
          onto Instagram from a website is to hand the user a ready-made
          image and have them post it from the app themselves. This button
          is that handoff, so it gets its own prominent, clearly-branded
          section rather than hiding in the generic share grid below. */}
      <div className="mt-6 rounded-lg border border-transparent bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] p-[1.5px]">
        <div className="rounded-[calc(0.5rem-1.5px)] bg-navy px-5 py-4">
          <p className="font-semibold text-white">Share to Instagram</p>
          <p className="mt-1 text-sm text-brandgrey">
            Downloads a Story-ready image (1080×1920). Open Instagram and
            post it from your camera roll — Instagram doesn&apos;t allow
            posting directly from a website.
          </p>
          <button
            type="button"
            onClick={handleDownloadStoryCard}
            disabled={isGeneratingCard}
            className="mt-3 w-full rounded-md bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {isGeneratingCard ? "Generating…" : "Download Instagram Story image"}
          </button>
          {cardDownloaded && (
            <p className="mt-2 text-sm text-gold">
              Downloaded — open Instagram to post it.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={handleFacebookShare}
          className="rounded-md border border-brandgrey/30 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
        >
          Facebook
        </button>
        <button
          type="button"
          onClick={handleTwitterShare}
          className="rounded-md border border-brandgrey/30 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
        >
          X / Twitter
        </button>
        <button
          type="button"
          onClick={handleWhatsAppShare}
          className="rounded-md border border-brandgrey/30 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
        >
          WhatsApp
        </button>
        {typeof navigator !== "undefined" && !!navigator.share && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="rounded-md border border-brandgrey/30 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5"
          >
            More…
          </button>
        )}
        <button
          type="button"
          onClick={handleDownloadQR}
          disabled={isGeneratingQR}
          className="rounded-md border border-brandgrey/30 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/5 disabled:opacity-50"
        >
          {isGeneratingQR ? "Generating…" : "QR code"}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red">{error}</p>}

      <Link
        href={albumUrl.replace(/^https?:\/\/[^/]+/, "")}
        className="mt-8 inline-block rounded-md bg-red px-6 py-2.5 font-semibold text-white transition hover:opacity-90"
      >
        View your album
      </Link>
    </div>
  );
}
