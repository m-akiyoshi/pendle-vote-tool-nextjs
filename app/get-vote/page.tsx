"use client";

import { Card, CardContent, Input, Button, Alert } from "@/components/ui";
import { ExternalLink, Search, Copy, Check } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

interface Vote {
  name: string;
  address: string;
  expiry: string;
  weight: string;
}

function GetVoteClientContent() {
  const searchParams = useSearchParams();
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (hash: string = txHash) => {
    if (!hash) {
      setError("Please enter a transaction hash");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/get-vote-transaction?txHash=${hash}`);
      if (!response.ok) {
        throw new Error("Failed to fetch vote info");
      }
      const data = await response.json();
      setVotes(data);
    } catch (error) {
      setError(
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

  const handleCopyHash = async () => {
    await navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalWeight = votes.reduce(
    (sum, vote) => sum + Number(vote.weight) / 1e18,
    0
  );

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <nav className="flex items-center gap-2 text-sm text-neutral-500">
            <a href="/" className="hover:text-neutral-300 transition-colors">
              Home
            </a>
            <span>/</span>
            <span className="text-neutral-300">Get Vote</span>
          </nav>
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
            information and weight distribution.
          </p>
        </div>

        {/* Search Card */}
        <Card className="mb-8">
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" className="mb-8">
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-10 h-10 border-2 border-neutral-700 border-t-neutral-300 rounded-full animate-spin mb-4" />
            <p className="text-neutral-500">Fetching vote information...</p>
          </div>
        )}

        {/* Results */}
        {!loading && votes.length > 0 && (
          <div className="space-y-6">
            {/* Transaction Info */}
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm text-neutral-500 flex-shrink-0">
                      Transaction:
                    </span>
                    <code className="text-sm text-neutral-300 font-mono truncate">
                      {txHash}
                    </code>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={handleCopyHash}
                      className="p-2 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
                      title="Copy hash"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <a
                      href={`https://etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
                      title="View on Etherscan"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="text-center py-6">
                  <p className="text-3xl font-semibold text-neutral-100">
                    {votes.length}
                  </p>
                  <p className="text-sm text-neutral-500 mt-1">Total Pools</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="text-center py-6">
                  <p className="text-3xl font-semibold text-neutral-100">
                    {(totalWeight * 100).toFixed(2)}%
                  </p>
                  <p className="text-sm text-neutral-500 mt-1">Total Weight</p>
                </CardContent>
              </Card>
            </div>

            {/* Vote Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-900/50">
                      <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Pool
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Expiry
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Weight
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800">
                    {votes.map((vote, index) => (
                      <tr
                        key={index}
                        className="hover:bg-neutral-800/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-neutral-200">
                            {vote.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-xs text-neutral-400 font-mono">
                            {vote.address.slice(0, 6)}...{vote.address.slice(-4)}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-neutral-400">
                            {new Date(vote.expiry).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-medium text-neutral-200">
                            {((Number(vote.weight) / 1e18) * 100).toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && votes.length === 0 && txHash === "" && (
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
