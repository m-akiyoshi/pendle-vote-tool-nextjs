"use client";

import { Button } from "@/components/ui";
import { Wallet } from "lucide-react";

interface WalletButtonProps {
  connectedAddress: string | null;
  onConnect: () => void;
}

export function WalletButton({ connectedAddress, onConnect }: WalletButtonProps) {
  if (connectedAddress) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-sm text-neutral-300 font-mono">
          {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
        </span>
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={onConnect}>
      <Wallet className="w-4 h-4 mr-2" />
      Connect Wallet
    </Button>
  );
}
