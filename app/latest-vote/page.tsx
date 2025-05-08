"use client";
import LoadingIcon from "@/components/Loading";
import { LinkIcon } from "lucide-react";
import { useState } from "react";

interface Vote {
  name: string;
  address: string;
  expiry: string;
  weight: string;
}

export default function GetLastTXFromAddress() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [txHash, setTxHash] = useState("");
  const [error, setError] = useState("");

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

  return (
    <div className="flex flex-col items-center space-y-6 py-16">
      <div className="flex flex-col gap-6 items-center text-center mx-auto">
        <h2 className="text-2xl font-bold">Get last vote info from address</h2>
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
                className="px-6 py-3 bg-gray-700 text-white font-medium disabled:bg-opacity-50 cursor-pointer rounded-lg disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md w-full"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(votes));
                }}
              >
                Copy vote tx
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

      {loading && !error && (
        <div className="text-center py-12">
          <div className="inline-block w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading vote information...</p>
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
