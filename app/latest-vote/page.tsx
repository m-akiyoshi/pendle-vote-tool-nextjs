"use client";
import LoadingIcon from "@/components/Loading";
import { ethers } from "ethers";
import { LinkIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react"; // Import Suspense

interface Vote {
  name: string;
  address: string;
  expiry: string;
  weight: string;
}

const VOTING_CONTRACT_ADDRESS = "0x44087E105137a5095c008AaB6a6530182821F2F0";

// Renamed component containing the original logic
function LatestVoteClientContent() {
  const searchParams = useSearchParams();

  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [sentTxHash, setSentTxHash] = useState<string | null>(null);
  const [isSendingTx, setIsSendingTx] = useState(false);

  // handleSubmitHash needs to be defined before being used in useEffect
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
    // console.log("searchParams in LatestVoteClientContent", searchParams); // Keep for debugging if needed
    if (!searchParams) return;
    const hashFromParams = searchParams.get("txHash");
    if (hashFromParams) {
      setTxHash(hashFromParams);
      handleSubmitHash(hashFromParams); // Call the locally defined handleSubmitHash
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Add handleSubmitHash to deps if it's not stable and defined outside. If defined inside, it's fine.

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
      // console.log("Transaction sent, hash:", txResponse.hash); // Keep for debugging
      await txResponse.wait();
      // console.log("Transaction mined"); // Keep for debugging
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

  return (
    <div className="flex flex-col items-center space-y-6 py-16 bg-background text-foreground">
      <div className="flex flex-col gap-6 items-center text-center mx-auto">
        <h2 className="text-2xl font-bold">Get last vote info from address</h2>
        {!connectedAddress ? (
          <button
            onClick={connectWallet}
            className="px-6 py-3 bg-white text-black hover:bg-gray-200 rounded-md font-medium transition-all duration-200"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="text-gray-300 bg-gray-800 border border-gray-700 p-2 rounded-md">
            Connected: {connectedAddress.substring(0, 6)}...
            {connectedAddress.substring(connectedAddress.length - 4)}
          </div>
        )}
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Enter wallet address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-3 rounded-md bg-gray-800 text-gray-300 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={loading || !address}
              className="px-6 py-3 bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600 font-medium rounded-md disabled:bg-gray-800 disabled:text-gray-500 disabled:border-gray-700 disabled:cursor-not-allowed transition-all duration-200 w-full focus:outline-none focus:ring-1 focus:ring-gray-500"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingIcon />
                  Loading...
                </span>
              ) : (
                "Get Last Vote Tx From Address"
              )}
            </button>
            {votes.length > 0 && (
              <button
                className="px-6 py-3 bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600 font-medium rounded-md disabled:bg-gray-800 disabled:text-gray-500 disabled:border-gray-700 disabled:cursor-not-allowed transition-all duration-200 w-full focus:outline-none focus:ring-1 focus:ring-gray-500"
                onClick={handleCopy}
                disabled={isSendingTx || !txHash || !signer}
              >
                {isSendingTx ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingIcon />
                    Sending Tx...
                  </span>
                ) : signer ? (
                  "Copy & Send Vote Tx"
                ) : (
                  "Connect Wallet to copy transaction"
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900 border border-red-700 rounded-md text-red-300">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {error}
          </div>
        </div>
      )}

      {loading && !error && !isSendingTx && (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-4 border-gray-600 border-t-gray-300 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">Loading vote information...</p>
        </div>
      )}

      {isSendingTx && (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-4 border-gray-600 border-t-gray-300 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">
            Sending transaction, please check your wallet...
          </p>
        </div>
      )}

      {txHash && (
        <div className="flex items-center gap-2">
          <p className="font-semibold">Transaction hash: </p>
          <p
            onClick={() => {
              navigator.clipboard.writeText(txHash);
            }}
            className="font-mono cursor-pointer bg-gray-800 p-2 px-4 rounded-md text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-500"
          >
            {txHash}
          </p>
          <a href={`https://etherscan.io/tx/${txHash}`} target="_blank">
            <LinkIcon className="w-6 h-6 text-gray-400 hover:text-gray-300" />
          </a>
        </div>
      )}

      {sentTxHash && (
        <div className="mt-4 p-4 bg-green-900 border border-green-700 rounded-md text-green-300">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Transaction successfully sent! Hash: </span>
            <a
              href={`https://etherscan.io/tx/${sentTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono underline hover:text-green-500"
            >
              {sentTxHash.substring(0, 10)}...
            </a>
          </div>
        </div>
      )}

      {votes.length > 0 && (
        <div className="overflow-hidden rounded-md border border-gray-700 bg-gray-800 text-gray-300">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-700">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Address
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Expiry
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                    Weight
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {votes.map((vote, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-600 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 text-sm text-gray-300 whitespace-nowrap">
                      {vote.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 font-mono">
                      {vote.address}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {new Date(vote.expiry).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300 font-medium">
                      {((Number(vote.weight) / 1e18) * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// New default export for the page
export default function LatestVotePage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-background text-foreground">
        Loading page content...
      </div>
    }>
      <LatestVoteClientContent />
    </Suspense>
  );
}
