"use client";
import LoadingIcon from "@/components/Loading";
import { ethers } from "ethers";
import { LinkIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Vote {
  name: string;
  address: string;
  expiry: string;
  weight: string;
}

const VOTING_CONTRACT_ADDRESS = "0x44087E105137a5095c008AaB6a6530182821F2F0";

export default function GetLastTXFromAddress() {
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

  useEffect(() => {
    console.log("searchParams", searchParams);
    if (!searchParams) return;
    const hash = searchParams.get("txHash");
    if (hash) {
      setTxHash(hash);
      handleSubmitHash(hash);
    }
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
      console.log("Transaction sent, hash:", txResponse.hash);
      await txResponse.wait();
      console.log("Transaction mined");
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
    <div className="flex flex-col items-center space-y-6 py-16">
      <div className="flex flex-col gap-6 items-center text-center mx-auto">
        <h2 className="text-2xl font-bold">Get last vote info from address</h2>
        {!connectedAddress ? (
          <button
            onClick={connectWallet}
            className="px-6 py-3 bg-blue-300 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Connect Wallet
          </button>
        ) : (
          <div className="text-gray-800 p-2 bg-gray-200 border border-green-300 rounded-md">
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
            className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={loading || !address}
              className="px-6 py-3 bg-blue-500 text-white font-medium disabled:bg-opacity-50 cursor-pointer rounded-lg disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md w-full"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <LoadingIcon />
                  Loading...
                </span>
              ) : (
                "Get Last Vote Tx From Address"
              )}
            </button>
            {votes.length > 0 && (
              <button
                className="px-6 py-3 bg-blue-700 text-white font-medium disabled:bg-gray-600 cursor-pointer rounded-lg disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:bg-opacity-60 hover:shadow-md w-full"
                onClick={handleCopy}
                disabled={isSendingTx || !txHash || !signer}
              >
                {isSendingTx ? (
                  <span className="flex items-center gap-2">
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
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
          <div className="inline-block w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading vote information...</p>
        </div>
      )}

      {isSendingTx && (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">
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
            className="font-mono cursor-pointer bg-gray-600 p-2 px-4 rounded-md"
          >
            {txHash}
          </p>
          <a href={`https://etherscan.io/tx/${txHash}`} target="_blank">
            <LinkIcon className="w-6 h-6" />
          </a>
        </div>
      )}

      {sentTxHash && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
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
              className="font-mono underline hover:text-green-900"
            >
              {sentTxHash.substring(0, 10)}...
            </a>
          </div>
        </div>
      )}

      {votes.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Address
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Expiry
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Weight
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {votes.map((vote, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                      {vote.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-mono">
                      {vote.address}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(vote.expiry).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
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
