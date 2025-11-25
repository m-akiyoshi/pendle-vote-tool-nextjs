"use client";

import { Card, CardContent, Input, Button, Alert } from "@/components/ui";
import { VoteResults, WalletButton, CopyVoteButton, Vote } from "@/components/vote";
import { useVoteCopy } from "@/hooks/useVoteCopy";
import { ExternalLink, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function GetVoteClientContent() {
  const searchParams = useSearchParams();
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [fetchError, setFetchError] = useState("");

  const {
    connectedAddress,
    sentTxHash,
    isSendingTx,
    error: walletError,
    connectWallet,
    copyAndSendVote,
    clearError,
    signer,
  } = useVoteCopy();

  const handleSubmit = async (hash: string = txHash) => {
    if (!hash) {
      setFetchError("Please enter a transaction hash");
      return;
    }

    setLoading(true);
    setFetchError("");
    clearError();
    try {
      const response = await fetch(`/api/get-vote-transaction?txHash=${hash}`);
      if (!response.ok) {
        throw new Error("Failed to fetch vote info");
      }
      const data = await response.json();
      setVotes(data);
    } catch (error) {
      setFetchError(
        error instanceof Error ? error.message : "Failed to fetch vote info"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchParams) return;
    const hash = searchParams.get("txHash");
    if (hash) {
      setTxHash(hash);
      handleSubmit(hash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleCopyVote = () => {
    copyAndSendVote(txHash);
  };

  const error = fetchError || walletError;

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm text-neutral-500">
            <Link href="/" className="hover:text-neutral-300 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-neutral-300">Get Vote</span>
          </nav>

          {/* Wallet Connection */}
          <WalletButton
            connectedAddress={connectedAddress}
            onConnect={connectWallet}
          />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-neutral-100 mb-3">
            Vote Transaction Lookup
          </h1>
          <p className="text-neutral-400 max-w-lg mx-auto">
            Enter a Pendle vote transaction hash to view the detailed voting
            information and optionally copy it to your own wallet.
          </p>
        </div>

        {/* Search Card */}
        <Card className="mb-8">
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="0x..."
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  />
                </div>
                <Button
                  onClick={() => handleSubmit()}
                  disabled={loading || !txHash}
                  loading={loading}
                  loadingText="Fetching..."
                  className="sm:w-auto w-full"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Lookup
                </Button>
              </div>

              {votes.length > 0 && (
                <div className="pt-3 border-t border-neutral-800">
                  <CopyVoteButton
                    onCopy={handleCopyVote}
                    disabled={isSendingTx || !txHash || !signer}
                    loading={isSendingTx}
                    hasWallet={!!signer}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" className="mb-8">
            {error}
          </Alert>
        )}

        {/* Success Alert */}
        {sentTxHash && (
          <Alert variant="success" className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span>Transaction sent successfully!</span>
              <a
                href={`https://etherscan.io/tx/${sentTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-green-400 hover:text-green-300 underline inline-flex items-center gap-1"
              >
                {sentTxHash.slice(0, 10)}...
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-10 h-10 border-2 border-neutral-700 border-t-neutral-300 rounded-full animate-spin mb-4" />
            <p className="text-neutral-500">Fetching vote information...</p>
          </div>
        )}

        {/* Sending Transaction State */}
        {isSendingTx && (
          <div className="text-center py-16">
            <div className="inline-block w-10 h-10 border-2 border-neutral-700 border-t-neutral-300 rounded-full animate-spin mb-4" />
            <p className="text-neutral-500">
              Sending transaction, please confirm in your wallet...
            </p>
          </div>
        )}

        {/* Results */}
        {!loading && !isSendingTx && votes.length > 0 && (
          <VoteResults votes={votes} txHash={txHash} />
        )}

        {/* Empty State */}
        {!loading && !isSendingTx && !error && votes.length === 0 && txHash === "" && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-900 mb-4">
              <Search className="w-8 h-8 text-neutral-600" />
            </div>
            <p className="text-neutral-500">
              Enter a transaction hash above to get started
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function GetVotePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen bg-neutral-950">
          <div className="w-8 h-8 border-2 border-neutral-700 border-t-neutral-300 rounded-full animate-spin" />
        </div>
      }
    >
      <GetVoteClientContent />
    </Suspense>
  );
}
