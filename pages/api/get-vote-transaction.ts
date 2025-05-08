import { getVoteTransaction } from "@/lib/voteListener";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("API Request received:", {
    method: req.method,
    query: req.query,
    timestamp: new Date().toISOString(),
  });

  // Only allow GET requests
  if (req.method !== "GET") {
    console.log("Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { txHash } = req.query;

  if (!txHash || typeof txHash !== "string") {
    console.log("Invalid txHash:", txHash);
    return res.status(400).json({ error: "Transaction hash is required" });
  }

  try {
    console.log("Fetching vote data for txHash:", txHash);
    const voteData = await getVoteTransaction({
      alchemyApiKey: process.env.ALCHEMY_API_KEY || "",
      txHash,
    });

    if (!voteData) {
      console.log("No vote data found for txHash:", txHash);
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
