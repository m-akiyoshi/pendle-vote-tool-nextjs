// src/listen-and-email.ts
import * as dotenv from "dotenv";
import { ethers } from "ethers";
import nodemailer from "nodemailer";

dotenv.config();

// ─── CONFIGURATION ──────────────────────────────────────────────────────────────
const WS_URL = process.env.ALCHEMY_WS_URL!; // e.g. wss://eth-mainnet.g.alchemy.com/v2/yourKey
const WATCH_FROM = process.env.WATCH_FROM!.toLowerCase(); // the wallet you want to monitor
const VOTING_ADDRESS =
  "0x44087E105137a5095c008AaB6a6530182821F2F0".toLowerCase();
const ABI = require("../abi/PendleVotingControllerABI.json");
const EMAIL_HOST = process.env.EMAIL_HOST!; // e.g. smtp.gmail.com
const EMAIL_PORT = Number(process.env.EMAIL_PORT!); // e.g. 587
const EMAIL_USER = process.env.EMAIL_USER!;
const EMAIL_PASS = process.env.EMAIL_PASS!;
const EMAIL_TO = (process.env.EMAIL_TO || "").split(","); // comma-separated

// ─── SETUP PROVIDER & INTERFACE ────────────────────────────────────────────────
const provider = new ethers.WebSocketProvider(WS_URL);
const iface = new ethers.Interface(ABI);
const voteSig = iface?.getFunction("vote")?.selector;

// ─── SETUP EMAIL TRANSPORT ──────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // true for 465, false for other ports
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

// ─── LISTENER ───────────────────────────────────────────────────────────────────
provider.on("pending", async (hash: string) => {
  try {
    const tx = await provider.getTransaction(hash);
    if (
      !tx ||
      tx.from?.toLowerCase() !== WATCH_FROM ||
      tx.to?.toLowerCase() !== VOTING_ADDRESS
    )
      return;

    // check selector
    if (tx.data.slice(0, 10) !== voteSig) return;

    // decode
    const [pools, weights]: [string[], bigint[]] = iface.decodeFunctionData(
      "vote",
      tx.data
    );

    // format email
    const body = `
New vote by ${WATCH_FROM}  
TxHash: ${hash}

Pools:
${pools.join("\n")}

Weights:
${weights.map((w) => w.toString()).join("\n")}
    `;

    // send
    await transporter.sendMail({
      from: `"Pendle Watcher" <${EMAIL_USER}>`,
      to: EMAIL_TO,
      subject: `🗳️ New vote by ${WATCH_FROM}`,
      text: body,
    });

    console.log("✉️  Email sent for vote tx", hash);
  } catch (err) {
    console.error("Listener error:", err);
  }
});

// ─── START ─────────────────────────────────────────────────────────────────────
console.log(`👂  Listening for votes from ${WATCH_FROM}...`);
