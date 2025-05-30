import PendleVotingABI from "@/lib/abi/PendleVotingControllerABI.json";
import { BigNumber } from "alchemy-sdk";
import axios from "axios";
import dotenv from "dotenv";
import { ethers, Interface } from "ethers";
import process from "process";

interface Vote {
  address: string;
  name: string;
  expiry: string;
  weight: string;
}

export type VoteData = Vote[];

dotenv.config();

const VOTING_CONTRACT =
  process.env.VOTING_CONTRACT || "0x44087E105137a5095c008AaB6a6530182821F2F0";
const ETHERSCAN_BASE_URL = process.env.ETHERSCAN_BASE_URL;

const provider = new ethers.AlchemyProvider(
  "mainnet",
  process.env.ALCHEMY_API_KEY
);

export async function getTransactionHistory({
  etherScanApiKey,
  address,
  limit = 100,
}: {
  etherScanApiKey: string;
  address: string;
  limit?: number;
}) {
  const url =
    `${ETHERSCAN_BASE_URL}?chainId=1&module=account&action=txlist` +
    `&address=${address}&startblock=0&endblock=latest&page=1&offset=${limit}` +
    `&sort=desc&apikey=${etherScanApiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "1") {
    throw new Error(`Etherscan error: ${data.message}`);
  }

  return data.result;
}

const votingContract = new ethers.Contract(
  VOTING_CONTRACT,
  PendleVotingABI,
  provider
);

const voteFunction = votingContract.interface.getFunction("vote");
if (!voteFunction) throw new Error("Vote function not found in ABI");

// Decode and format transaction details
async function decodeVote(txData: string) {
  const iface = new Interface(PendleVotingABI);

  const decoded = iface.decodeFunctionData("vote", txData);

  const url = "https://api-v2.pendle.finance/core/v1/ve-pendle/pool-metadata";
  const response = await axios.get(url);
  const poolInfo = decoded.pools.map((pool: string) =>
    response.data.find(
      (p: any) => p.address.toLowerCase() === pool.toLowerCase()
    )
  );

  return decoded.pools.map((pool: string, i: number) => ({
    address: pool,
    name: poolInfo[i].name,
    expiry: poolInfo[i].expiry, // Conver to 29 May 2025
    weight: decoded.weights[i].toString(),
  }));
}

export async function fetchLastVotedPools({
  etherScanApiKey,
  alchemyApiKey,
  address,
}: {
  etherScanApiKey: string;
  alchemyApiKey: string;
  address: string;
}): Promise<{ decoded: VoteData; hash: string } | { error: string }> {
  const provider = new ethers.AlchemyProvider("mainnet", alchemyApiKey);
  const history = await getTransactionHistory({
    etherScanApiKey,
    address,
  });

  for (const transfer of history) {
    const tx = await provider.getTransaction(transfer.hash);
    if (voteFunction?.selector && tx?.data?.startsWith(voteFunction.selector)) {
      const decoded = await decodeVote(tx.data);
      return { decoded, hash: tx.hash };
    }
  }
  return { error: "No vote transaction found" };
}

export async function copyTransaction({
  hash,
  address,
}: {
  hash: string;
  address: string;
}) {
  const voteData = await getVoteTransaction({
    alchemyApiKey: process.env.ALCHEMY_API_KEY || "",
    txHash: hash,
  });

  if (!voteData) {
    return {
      error: `Could not retrieve or decode vote data for target transaction hash: ${hash}`,
    };
  }

  const myPreviousPools = await fetchLastVotedPools({
    etherScanApiKey: process.env.ETHERSCAN_API_KEY || "",
    alchemyApiKey: process.env.ALCHEMY_API_KEY || "",
    address,
  });

  if ("error" in myPreviousPools) {
    return {
      error: "Failed to fetch your previous vote data. Cannot combine votes.",
    };
  }

  const myNonZeroPreviousPools = myPreviousPools.decoded.filter(
    (pool: Vote) => pool.weight !== "0"
  );

  const targetNonZeroPools = voteData.filter(
    (pool: Vote) => pool.weight !== "0"
  );

  const finalVoteMap: { [address: string]: bigint } = {};

  for (const pool of myNonZeroPreviousPools) {
    finalVoteMap[pool.address.toLowerCase()] = BigNumber.from(0).toBigInt();
  }

  for (const pool of targetNonZeroPools) {
    finalVoteMap[pool.address.toLowerCase()] = BigNumber.from(
      pool.weight
    ).toBigInt();
  }

  const finalAddressPools = Object.keys(finalVoteMap);
  const finalWeights = Object.values(finalVoteMap);

  const iface = new ethers.Interface(PendleVotingABI);
  return iface.encodeFunctionData("vote", [finalAddressPools, finalWeights]);
}

export async function getVoteTransaction({
  alchemyApiKey,
  txHash,
}: {
  alchemyApiKey: string;
  txHash: string;
}) {
  const provider = new ethers.AlchemyProvider("mainnet", alchemyApiKey);

  const tx = await provider.getTransaction(txHash);
  if (!tx) return;
  const decodedVotes = await decodeVote(tx.data);
  return decodedVotes;
}
