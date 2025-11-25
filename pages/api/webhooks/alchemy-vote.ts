import { getEmailsForVoterFromKV } from "@/lib/kv";
import { createVoteEmailContent, sendEmail } from "@/lib/email";
import { getVoteTransaction } from "@/lib/voteListener";
import { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

const VOTING_CONTRACT = "0x44087E105137a5095c008AaB6a6530182821F2F0".toLowerCase();

// Alchemy Custom Webhook (GraphQL) payload types
interface AlchemyGraphQLWebhook {
  webhookId: string;
  id: string;
  createdAt: string;
  type: string;
  event: {
    data: {
      block: {
        hash: string;
        number: number;
        timestamp: number;
        logs: AlchemyLog[];
      };
    };
    sequenceNumber: string;
    network: string;
  };
}

interface AlchemyLog {
  data: string;
  topics: string[];
  index: number;
  account: {
    address: string;
  };
  transaction: {
    hash: string;
    nonce: number;
    index: number;
    from: { address: string };
    to: { address: string };
    value: string;
    status: number;
  };
}

// Helper to extract unique transactions from logs
function extractTransactionsFromLogs(logs: AlchemyLog[]): { hash: string; from: string; to: string }[] {
  const seen = new Set<string>();
  const transactions: { hash: string; from: string; to: string }[] = [];

  for (const log of logs) {
    const txHash = log.transaction?.hash;
    if (txHash && !seen.has(txHash)) {
      seen.add(txHash);
      transactions.push({
        hash: txHash,
        from: log.transaction.from?.address || "",
        to: log.transaction.to?.address || "",
      });
    }
  }

  return transactions;
}

// Verify Alchemy webhook signature
function isValidSignature(
  body: string,
  signature: string,
  signingKey: string
): boolean {
  const hmac = crypto.createHmac("sha256", signingKey);
  hmac.update(body, "utf8");
  const digest = hmac.digest("hex");
  return signature === digest;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify webhook signature if signing key is configured
  const signingKey = process.env.ALCHEMY_WEBHOOK_SIGNING_KEY;
  if (signingKey) {
    const signature = req.headers["x-alchemy-signature"] as string;
    const rawBody = JSON.stringify(req.body);

    if (!signature || !isValidSignature(rawBody, signature, signingKey)) {
      console.error("Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }
  }

  try {
    const webhookEvent: AlchemyGraphQLWebhook = req.body;

    // Extract transactions from the GraphQL webhook logs
    const logs = webhookEvent.event?.data?.block?.logs || [];
    const transactions = extractTransactionsFromLogs(logs);

    console.log("Received Alchemy webhook:", {
      type: webhookEvent.type,
      id: webhookEvent.id,
      blockNumber: webhookEvent.event?.data?.block?.number,
      logsCount: logs.length,
      uniqueTransactions: transactions.length,
    });

    if (transactions.length === 0) {
      console.log("No transactions found in webhook payload");
      return res.status(200).json({ success: true, processed: 0 });
    }

    let processedCount = 0;

    for (const tx of transactions) {
      // Check if this is a transaction to the Pendle voting contract
      if (tx.to?.toLowerCase() !== VOTING_CONTRACT) {
        console.log(`Skipping - not to voting contract: ${tx.to}`);
        continue;
      }

      const txHash = tx.hash;
      const fromAddress = tx.from;

      console.log(`Processing vote transaction: ${txHash} from ${fromAddress}`);

      // Find which emails should be notified (from KV store)
      const recipients = await getEmailsForVoterFromKV(fromAddress);

      if (recipients.length === 0) {
        console.log(`No watchers for address: ${fromAddress}`);
        continue;
      }

      // Fetch and decode the vote transaction
      const voteData = await getVoteTransaction({
        alchemyApiKey: process.env.ALCHEMY_API_KEY || "",
        txHash,
      });

      if (!voteData || voteData.length === 0) {
        console.error(`Could not decode vote data for tx: ${txHash}`);
        continue;
      }

      console.log(`Vote decoded: ${voteData.length} pools`);

      // Create email content
      const htmlContent = createVoteEmailContent({
        from: fromAddress,
        txHash,
        poolInfo: voteData,
      });

      // Send emails to all watchers
      for (const { email, index } of recipients) {
        try {
          const result = await sendEmail({
            to: email,
            subject: `New Vote by Watched Address: ${fromAddress.slice(0, 6)}...${fromAddress.slice(-4)} (#${index} in your list)`,
            htmlBody: htmlContent,
          });

          if (result.success) {
            console.log(`Email sent to ${email} (ID: ${result.emailId})`);
          } else {
            console.error(`Failed to send email to ${email}: ${result.error}`);
          }
        } catch (error) {
          console.error(`Error sending email to ${email}:`, error);
        }
      }

      processedCount++;
    }

    return res.status(200).json({ success: true, processed: processedCount });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Disable body parsing to get raw body for signature verification
export const config = {
  api: {
    bodyParser: true,
  },
};
