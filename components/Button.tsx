"use client";

import type { ButtonHTMLAttributes } from "react";

export function Button({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`rounded-xl bg-brand-navy px-6 py-4 text-lg font-semibold text-white active:opacity-80 disabled:opacity-50 ${className}`}
    />
  );
}
