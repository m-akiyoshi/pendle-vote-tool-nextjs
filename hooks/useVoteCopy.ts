import { useState } from "react";
import { ethers } from "ethers";

const VOTING_CONTRACT_ADDRESS = "0x44087E105137a5095c008AaB6a6530182821F2F0";

export function useVoteCopy() {
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [sentTxHash, setSentTxHash] = useState<string | null>(null);
  const [isSendingTx, setIsSendingTx] = useState(false);
  const [error, setError] = useState("");

  const connectWallet = async () => {
    setError("");
    setSigner(null);
    setConnectedAddress(null);

    if (typeof (window as any).ethereum === "undefined") {
      setError("MetaMask is not installed. Please install it to continue.");
      return;
    }

    try {
      await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });
      const provider = new ethers.BrowserProvider((window as any).ethereum);

      const network = await provider.getNetwork();
      if (network.chainId !== BigInt(1)) {
        setError("Please switch to Ethereum Mainnet in your wallet.");
        return;
      }

      const walletSigner = await provider.getSigner();
      setSigner(walletSigner);
      setConnectedAddress(await walletSigner.getAddress());
    } catch (e) {
      console.error("Wallet connection error:", e);
      setError(e instanceof Error ? e.message : "Failed to connect wallet.");
      setSigner(null);
      setConnectedAddress(null);
    }
  };

  const copyAndSendVote = async (txHash: string) => {
    if (!signer) {
      setError("Please connect your wallet first.");
      return;
    }

    if (!txHash) {
      setError("Transaction hash is required to copy vote data.");
      return;
    }

    // Verify network
    try {
      const network = await signer.provider?.getNetwork();
      if (network?.chainId !== BigInt(1)) {
        setError(
          "Please switch to Ethereum Mainnet in your wallet to send the transaction."
        );
        return;
      }
    } catch (e) {
      console.error("Error getting network information:", e);
      setError(
        "Could not verify network. Please ensure your wallet is connected to Ethereum Mainnet."
      );
      return;
    }

    setIsSendingTx(true);
    setError("");
    setSentTxHash(null);

    try {
      const response = await fetch("/api/copy-vote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hash: txHash, address: connectedAddress }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get encoded vote data from API.");
      }

      if (!data.encodedData) {
        throw new Error("API did not return encodedData.");
      }

      const transactionParameters = {
        to: VOTING_CONTRACT_ADDRESS,
        data: data.encodedData,
      };

      const txResponse = await signer.sendTransaction(transactionParameters);
      setSentTxHash(txResponse.hash);
      await txResponse.wait();
    } catch (e) {
      console.error("Failed to copy and send vote transaction:", e);
      setError(
        e instanceof Error ? e.message : "Failed to send vote transaction."
      );
      setSentTxHash(null);
    } finally {
      setIsSendingTx(false);
    }
  };

  const clearError = () => setError("");

  return {
    // State
    signer,
    connectedAddress,
    sentTxHash,
    isSendingTx,
    error,
    // Actions
    connectWallet,
    copyAndSendVote,
    clearError,
    setError,
  };
}
