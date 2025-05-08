import { copyTransaction } from "@/lib/voteListener";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("API Request received:", {
    method: req.method,
    body: req.body,
    timestamp: new Date().toISOString(),
  });

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { hash, address } = req.body;

  if (
    !hash ||
    typeof hash !== "string" ||
    !address ||
    typeof address !== "string"
  ) {
    return res
      .status(400)
      .json({ error: "Hash and address are required in the request body" });
  }

  try {
    const encodedData = await copyTransaction({ hash, address });

    if (!encodedData) {
      return res.status(404).json({
        error: "Transaction not found or not a valid vote transaction",
      });
    }

    return res.status(200).json({ encodedData, success: true });
  } catch (error) {
    console.error("Error in getVoteTransaction:", error);
    return res.status(500).json({ error: "Failed to fetch vote transaction" });
  }
}
