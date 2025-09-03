"use client";

import Image from "next/image";

export default function Header() {
  return (
    <header className="w-full bg-[#1c1c1c] text-gray-200 py-3 px-4 border-b border-gray-800">
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 font-semibold text-lg">
          {/* ✅ Logo dipanggil dari /public/logo.png */}
          <Image
            src="/logo.png"
            alt="Logo Tanjung AI"
            width={32}
            height={32}
            priority
          />
          <span className="text-emerald-500">Tanjung AI</span>
        </div>
      </div>
    </header>
  );
}
