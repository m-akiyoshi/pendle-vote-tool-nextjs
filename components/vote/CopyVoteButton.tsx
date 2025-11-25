"use client";

import { Button } from "@/components/ui";
import { Send } from "lucide-react";

interface CopyVoteButtonProps {
  onCopy: () => void;
  disabled: boolean;
  loading: boolean;
  hasWallet: boolean;
}

export function CopyVoteButton({
  onCopy,
  disabled,
  loading,
  hasWallet,
}: CopyVoteButtonProps) {
  return (
    <Button
      variant="secondary"
      onClick={onCopy}
      disabled={disabled}
      loading={loading}
      loadingText="Sending..."
      className="w-full"
    >
      <Send className="w-4 h-4 mr-2" />
      {hasWallet
        ? "Copy & Send Vote Transaction"
        : "Connect wallet to copy transaction"}
    </Button>
  );
}
