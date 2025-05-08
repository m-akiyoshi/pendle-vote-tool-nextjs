import { copyTransaction } from "@/lib/voteListener";
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

  if (req.method !== "POST") {
    console.log("Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { hash } = req.query;

  if (!hash || typeof hash !== "string") {
    console.log("Invalid hash:", hash);
    return res.status(400).json({ error: "Hash is required" });
  }

  try {
    const voteData = await copyTransaction(hash);

    if (!voteData) {
      return res.status(404).json({
        error: "Transaction not found or not a valid vote transaction",
      });
    }

    console.log("Successfully fetched vote data:", voteData);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in getVoteTransaction:", error);
    return res.status(500).json({ error: "Failed to fetch vote transaction" });
  }
}
