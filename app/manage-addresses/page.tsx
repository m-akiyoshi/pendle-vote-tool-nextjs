"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface WatchedAddresses {
  [email: string]: string[];
}

export default function ManageAddressesPage() {
  const [addresses, setAddresses] = useState<WatchedAddresses>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [selectedEmail, setSelectedEmail] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [isAddingEmail, setIsAddingEmail] = useState(false);

  // Fetch addresses on mount
  useEffect(() => {
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    try {
      setLoading(true);
      const response = await fetch("/api/watched-addresses");
      if (!response.ok) throw new Error("Failed to fetch addresses");
      const data = await response.json();
      setAddresses(data);
      // Set default selected email
      const emails = Object.keys(data);
      if (emails.length > 0 && !selectedEmail) {
        setSelectedEmail(emails[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch addresses");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEmail || !newAddress) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/watched-addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_address",
          email: selectedEmail,
          address: newAddress,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add address");
      }

      const data = await response.json();
      setAddresses(data);
      setNewAddress("");
      setSuccess("Address added successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add address");
    }
  }

  async function handleRemoveAddress(email: string, address: string) {
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/watched-addresses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove_address",
          email,
          address,
        }),
      });

      if (!response.ok) throw new Error("Failed to remove address");

      const data = await response.json();
      setAddresses(data);
      setSuccess("Address removed successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove address");
    }
  }

  async function handleAddEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/watched-addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_email",
          email: newEmail,
        }),
      });

      if (!response.ok) throw new Error("Failed to add email");

      const data = await response.json();
      setAddresses(data);
      setSelectedEmail(newEmail);
      setNewEmail("");
      setIsAddingEmail(false);
      setSuccess("Email added successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add email");
    }
  }

  async function handleRemoveEmail(email: string) {
    if (!confirm(`Are you sure you want to remove ${email} and all its watched addresses?`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/watched-addresses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remove_email",
          email,
        }),
      });

      if (!response.ok) throw new Error("Failed to remove email");

      const data = await response.json();
      setAddresses(data);
      const emails = Object.keys(data);
      setSelectedEmail(emails.length > 0 ? emails[0] : "");
      setSuccess("Email removed successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove email");
    }
  }

  const emails = Object.keys(addresses);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Header */}
      <header className="border-b border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="text-neutral-300">Pendle Vote Tools</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/get-vote" className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors">
              Get Vote
            </Link>
            <Link href="/latest-vote" className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors">
              Latest Vote
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-neutral-100 mb-2">
            Manage Watched Addresses
          </h1>
          <p className="text-neutral-400">
            Add or remove wallet addresses to receive email notifications when they vote.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400">
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-neutral-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Email Selection */}
            <div className="lg:col-span-1">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-neutral-300">Email Accounts</h2>
                  <button
                    onClick={() => setIsAddingEmail(true)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    + Add Email
                  </button>
                </div>

                {isAddingEmail && (
                  <form onSubmit={handleAddEmail} className="mb-4">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded text-xs font-medium"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingEmail(false);
                          setNewEmail("");
                        }}
                        className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-1">
                  {emails.length === 0 ? (
                    <p className="text-sm text-neutral-500 py-2">No emails configured</p>
                  ) : (
                    emails.map((email) => (
                      <div
                        key={email}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedEmail === email
                            ? "bg-neutral-800 text-neutral-100"
                            : "hover:bg-neutral-800/50 text-neutral-400"
                        }`}
                        onClick={() => setSelectedEmail(email)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{email}</p>
                          <p className="text-xs text-neutral-500">
                            {addresses[email]?.length || 0} addresses
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveEmail(email);
                          }}
                          className="p-1 text-neutral-500 hover:text-red-400 transition-colors"
                          title="Remove email"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>

              </div>
            </div>

            {/* Address Management */}
            <div className="lg:col-span-2">
              <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
                <h2 className="text-sm font-medium text-neutral-300 mb-4">
                  Watched Addresses for {selectedEmail || "..."}
                </h2>

                {selectedEmail && (
                  <>
                    {/* Add Address Form */}
                    <form onSubmit={handleAddAddress} className="mb-6">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newAddress}
                          onChange={(e) => setNewAddress(e.target.value)}
                          placeholder="0x..."
                          className="flex-1 px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-neutral-600 font-mono"
                        />
                        <button
                          type="submit"
                          disabled={!newAddress}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 disabled:text-neutral-500 rounded-lg text-sm font-medium transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </form>

                    {/* Address List */}
                    <div className="space-y-2">
                      {addresses[selectedEmail]?.length === 0 ? (
                        <p className="text-sm text-neutral-500 py-4 text-center">
                          No addresses being watched
                        </p>
                      ) : (
                        addresses[selectedEmail]?.map((address, index) => (
                          <div
                            key={address}
                            className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg group"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-neutral-500 w-6">#{index + 1}</span>
                              <code className="text-sm text-neutral-300 font-mono">
                                {address}
                              </code>
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={`https://etherscan.io/address/${address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-neutral-500 hover:text-neutral-300 transition-colors"
                                title="View on Etherscan"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                              <button
                                onClick={() => handleRemoveAddress(selectedEmail, address)}
                                className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                title="Remove address"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}

                {!selectedEmail && (
                  <p className="text-sm text-neutral-500 py-8 text-center">
                    Select an email account to manage its watched addresses
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
