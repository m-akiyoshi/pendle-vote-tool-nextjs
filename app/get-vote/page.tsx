"use client";

import LoadingIcon from "@/components/Loading";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react"; // Import Suspense

interface Vote {
  name: string;
  address: string;
  expiry: string;
  weight: string;
}

// Renamed component containing the original logic
function GetVoteClientContent() {
  const searchParams = useSearchParams();
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [error, setError] = useState("");

  // Ensure handleSubmit is defined within this component
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
  }, [searchParams]); // handleSubmit should be stable or included if it's not

  return (
    <div className="flex flex-col items-center space-y-6 py-16 px-4 md:px-16 bg-background text-foreground">
      <div className="flex flex-col gap-4 items-center w-full max-w-xl">
        <h2 className="text-2xl font-bold text-center">Get Vote info from tx hash</h2>
        <input
          type="text"
          placeholder="Enter transaction hash"
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          className="w-full px-4 py-3 rounded-md bg-gray-800 text-gray-300 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200"
        />
        <button
          onClick={() => handleSubmit()}
          disabled={loading || !txHash}
          className="w-full px-6 py-3 bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600 rounded-md font-medium disabled:bg-gray-800 disabled:text-gray-500 disabled:border-gray-700 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-gray-500"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingIcon />
              Loading...
            </span>
          ) : (
            "Get Vote Info"
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-900 border border-red-700 rounded-md text-red-300 w-full max-w-xl">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5" // Color will be inherited from text-red-300
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
        <div className="text-center py-12 w-full max-w-xl">
          <div className="inline-block w-12 h-12 border-4 border-gray-600 border-t-gray-300 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400">Loading vote information...</p>
        </div>
      )}

      {votes.length > 0 && (
        <div className="overflow-hidden rounded-md border border-gray-700 bg-gray-800 text-gray-300 w-full max-w-4xl">
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
export default function GetVotePage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen bg-background text-foreground">
        Loading page content...
      </div>
    }>
      <GetVoteClientContent />
    </Suspense>
  );
}
