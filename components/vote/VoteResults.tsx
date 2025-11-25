"use client";

import { Card, CardContent } from "@/components/ui";
import { ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";

export interface Vote {
  name: string;
  address: string;
  expiry: string;
  weight: string;
}

interface VoteResultsProps {
  votes: Vote[];
  txHash: string;
}

export function VoteResults({ votes, txHash }: VoteResultsProps) {
  const [copied, setCopied] = useState(false);

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
  );
}
