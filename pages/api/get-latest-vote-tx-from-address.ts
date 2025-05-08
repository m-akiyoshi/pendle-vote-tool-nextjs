import { fetchLastVotedPools } from "@/lib/voteListener";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("API Request received:", {
    method: req.method,
    query: req.query,
    timestamp: new Date().toISOString(),
  });

  if (req.method !== "GET") {
    console.log("Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { address } = req.query;

  if (!address || typeof address !== "string") {
    console.log("Invalid address:", address);
    return res.status(400).json({ error: "Address is required" });
  }

  try {
    const voteData = await fetchLastVotedPools({
      etherScanApiKey: process.env.ETHERSCAN_API_KEY || "",
      alchemyApiKey: process.env.ALCHEMY_API_KEY || "",
      address,
    });

    if (!voteData) {
      console.log("No vote data found for txHash:", address);
      return res.status(404).json({
        error: "Transaction not found or not a valid vote transaction",
      });
    }

    console.log("Successfully fetched vote data:", voteData);
    return res.status(200).json(voteData);
  } catch (error) {
    console.error("Error in getVoteTransaction:", error);
    return res.status(500).json({ error: "Failed to fetch vote transaction" });
  }
}
