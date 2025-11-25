"use client";

import { Card, CardContent, Input, Button, Alert } from "@/components/ui";
import { ethers } from "ethers";
import { ExternalLink, Wallet, Search, Copy, Check, Send } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

interface Vote {
  name: string;
  address: string;
  expiry: string;
  weight: string;
}

const VOTING_CONTRACT_ADDRESS = "0x44087E105137a5095c008AaB6a6530182821F2F0";

function LatestVoteClientContent() {
  const searchParams = useSearchParams();

  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [sentTxHash, setSentTxHash] = useState<string | null>(null);
  const [isSendingTx, setIsSendingTx] = useState(false);

  const handleSubmitHash = async (hash: string = txHash) => {
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
    const hashFromParams = searchParams.get("txHash");
    if (hashFromParams) {
      setTxHash(hashFromParams);
      handleSubmitHash(hashFromParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const connectWallet = async () => {
    setError("");
    setSigner(null);
    setConnectedAddress(null);
    if (typeof (window as any).ethereum !== "undefined") {
      try {
        await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });
        const provider = new ethers.BrowserProvider((window as any).ethereum);

        const network = await provider.getNetwork();
        if (network.chainId !== BigInt(1)) {
          setError("Please switch to Ethereum Mainnet in your wallet.");
          return;
        }

        const walletSigner = await provider.getSigner();
        setSigner(walletSigner);
        setConnectedAddress(await walletSigner.getAddress());
      } catch (e) {
        console.error("Wallet connection error:", e);
        setError(e instanceof Error ? e.message : "Failed to connect wallet.");
        setSigner(null);
        setConnectedAddress(null);
      }
    } else {
      setError("MetaMask is not installed. Please install it to continue.");
    }
  };

  const handleSubmit = async () => {
    if (!address) {
      setError("Please enter a valid address");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/get-latest-vote-tx-from-address?address=${address}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch vote info");
      }
      const data = await response.json();
      setVotes(data.decoded);
      setTxHash(data.hash);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch vote info"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!signer) {
      setError("Please connect your wallet first.");
      return;
    }

    try {
      const network = await signer.provider?.getNetwork();
      if (network?.chainId !== BigInt(1)) {
        setError(
          "Please switch to Ethereum Mainnet in your wallet to send the transaction."
        );
        setIsSendingTx(false);
        return;
      }
    } catch (e) {
      console.error("Error getting network information:", e);
      setError(
        "Could not verify network. Please ensure your wallet is connected to Ethereum Mainnet."
      );
      setIsSendingTx(false);
      return;
    }

    if (!txHash) {
      setError(
        "You need to have fetched a transaction hash to copy its vote data."
      );
      return;
    }

    setIsSendingTx(true);
    setError("");
    setSentTxHash(null);
    try {
      const response = await fetch("/api/copy-vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hash: txHash, address: connectedAddress }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to get encoded vote data from API."
        );
      }

      if (!data.encodedData) {
        throw new Error("API did not return encodedData.");
      }

      const transactionParameters = {
        to: VOTING_CONTRACT_ADDRESS,
        data: data.encodedData,
      };

      const txResponse = await signer.sendTransaction(transactionParameters);
      setSentTxHash(txResponse.hash);
      await txResponse.wait();
    } catch (e) {
      console.error("Failed to copy and send vote transaction:", e);
      setError(
        e instanceof Error ? e.message : "Failed to send vote transaction."
      );
      setSentTxHash(null);
    } finally {
      setIsSendingTx(false);
    }
  };

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
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm text-neutral-500">
            <a href="/" className="hover:text-neutral-300 transition-colors">
              Home
            </a>
            <span>/</span>
            <span className="text-neutral-300">Latest Vote</span>
          </nav>

          {/* Wallet Connection */}
          {!connectedAddress ? (
            <Button variant="outline" size="sm" onClick={connectWallet}>
              <Wallet className="w-4 h-4 mr-2" />
              Connect Wallet
            </Button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-neutral-300 font-mono">
                {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-neutral-100 mb-3">
            Latest Vote Lookup
          </h1>
          <p className="text-neutral-400 max-w-lg mx-auto">
            Enter a wallet address to view their most recent Pendle vote
            transaction and optionally copy it to your own wallet.
          </p>
        </div>

        {/* Search Card */}
        <Card className="mb-8">
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Enter wallet address (0x...)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !address}
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
                  <Button
                    variant="secondary"
                    onClick={handleCopy}
                    disabled={isSendingTx || !txHash || !signer}
                    loading={isSendingTx}
                    loadingText="Sending..."
                    className="w-full"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {signer
                      ? "Copy & Send Vote Transaction"
                      : "Connect wallet to copy transaction"}
                  </Button>
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
            <p className="text-neutral-500">Fetching latest vote...</p>
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
        {!loading && !isSendingTx && votes.length === 0 && address === "" && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-neutral-900 mb-4">
              <Search className="w-8 h-8 text-neutral-600" />
            </div>
            <p className="text-neutral-500">
              Enter a wallet address above to get started
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function LatestVotePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen bg-neutral-950">
          <div className="w-8 h-8 border-2 border-neutral-700 border-t-neutral-300 rounded-full animate-spin" />
        </div>
      }
    >
      <LatestVoteClientContent />
    </Suspense>
  );
}
