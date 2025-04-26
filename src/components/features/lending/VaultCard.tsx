"use client";

import type React from "react";
import Image from "next/image"; // Import Next.js Image component
import { Card, CardContent } from "../../ui/card";
import { CircleDollarSign } from 'lucide-react'; // Keep for default
import { Skeleton } from "@/components/ui/skeleton";

// Mapping variants to icons and colors
const protocolVariants = {
  aave: {
    color: "#B6509E",
    icon: <Image src="/static/images/protocols/aave.webp" alt="Aave logo" width={62} height={62} className="rounded-full" />,
  },
  compound: {
    color: "#00D395",
    icon: <Image src="/static/images/protocols/comp.png" alt="Compound logo" width={62} height={62} className="rounded-full" />,
  },
  fluid: {
    color: "#007AFF",
    icon: <Image src="/static/images/protocols/fluid.svg" alt="Fluid logo" width={62} height={62} className="rounded-full" />,
  },
  default: {
    color: "#8062f1", // Default purple from original code
    icon: <CircleDollarSign className="w-6 h-6 text-white" />, // Default icon
  }
};

interface VaultCardProps {
  protocol: string;
  apy: string;
  depositedBalance: string;
  variant?: keyof typeof protocolVariants;
  onClick?: () => void;
  isLoading?: boolean; // Add isLoading prop
}

export function VaultCard({
  protocol,
  apy,
  depositedBalance,
  variant = "default",
  onClick,
  isLoading = false, // Default to false
}: VaultCardProps) {
  const { color, icon: protocolLogo } = protocolVariants[variant] || protocolVariants.default;

  return (
    <Card
      className="w-full bg-card border border-border overflow-hidden relative pl-12 cursor-pointer transition-all duration-300 group rounded-lg shadow-sm"
      onClick={onClick}
    >
      {/* Background Glow Effect - Adapted for theme */}
      <div
        className="absolute left-0 top-0 bottom-0 w-24 overflow-hidden"
        style={{
          background: `radial-gradient(circle at left, ${color}30 0%, transparent 85%)`,
          // backdropFilter: "blur(10px)", // Consider removing or reducing blur if performance is an issue
          // WebkitBackdropFilter: "blur(10px)",
        }}
      />
      {/* Protocol Icon Container */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
        <div
          className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full overflow-hidden"
          style={{
            boxShadow: `0 0 15px ${color}60`,
          }}
        >
          {protocolLogo}
        </div>
      </div>
      {/* Hover Outline Effect - Use outline to cover default border on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"
        style={{
          outline: `1px solid ${color}`,
          outlineOffset: '-1px',
          pointerEvents: "none",
        }}
      />
      <CardContent className="p-3 md:p-4 pl-6 md:pl-8">
        <div className="flex justify-between items-center w-full">
          <div className="flex flex-col">
            <div className="font-semibold text-foreground text-base md:text-lg">{protocol}</div>
            <div className="text-sm font-medium" style={{ color }}>
              {isLoading ? (
                <Skeleton className="h-4 w-16 mt-1" />
              ) : (
                `Up to ${apy} APR`
              )}
            </div>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Currently Deposited</div>
            <div className="font-semibold text-foreground text-base md:text-lg">
              {isLoading ? (
                 <Skeleton className="h-5 w-20 mt-1" />
              ) : (
                depositedBalance
              )}
            </div>
          </div>
          <div>{/* Placeholder for potential right-side content */}</div>
        </div>
      </CardContent>
    </Card>
  );
} 