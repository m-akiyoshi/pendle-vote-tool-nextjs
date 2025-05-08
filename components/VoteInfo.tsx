import { useState } from "react";

interface Vote {
  name: string;
  address: string;
  expiry: string;
  weight: string;
}

export default function VoteInfo() {
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!txHash) {
      setError("Please enter a transaction hash");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/get-vote-transaction?txHash=${txHash}`
      );
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 items-center">
        <input
          type="text"
          placeholder="Enter transaction hash"
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !txHash}
          className="px-6 py-3 bg-black text-white font-medium disabled:bg-opacity-50 cursor-pointer rounded-lg disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md w-full"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Loading...
            </span>
          ) : (
            "Get Vote Info"
          )}
        </button>
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
