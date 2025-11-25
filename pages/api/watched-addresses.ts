import {
  getWatchedAddressesFromKV,
  addWatchedAddress,
  removeWatchedAddress,
  addEmail,
  removeEmail,
  importAddressesToKV,
  WatchedAddresses,
} from "@/lib/kv";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case "GET": {
        // Get all watched addresses
        const addresses = await getWatchedAddressesFromKV();
        return res.status(200).json(addresses);
      }

      case "POST": {
        // Add an address or email
        const { action, email, address, addresses } = req.body;

        if (!email) {
          return res.status(400).json({ error: "Email is required" });
        }

        let result;

        switch (action) {
          case "add_address":
            if (!address) {
              return res.status(400).json({ error: "Address is required" });
            }
            // Validate ethereum address format
            if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
              return res.status(400).json({ error: "Invalid Ethereum address format" });
            }
            result = await addWatchedAddress(email, address);
            break;

          case "add_email":
            result = await addEmail(email, addresses || []);
            break;

          case "import":
            // Import addresses from request body
            const importData = req.body.data as WatchedAddresses;
            if (!importData || Object.keys(importData).length === 0) {
              return res.status(400).json({ error: "No data to import" });
            }
            await importAddressesToKV(importData);
            result = await getWatchedAddressesFromKV();
            break;

          default:
            return res.status(400).json({ error: "Invalid action" });
        }

        return res.status(200).json(result);
      }

      case "DELETE": {
        // Remove an address or email
        const { action: deleteAction, email: deleteEmail, address: deleteAddress } = req.body;

        if (!deleteEmail) {
          return res.status(400).json({ error: "Email is required" });
        }

        let deleteResult;

        switch (deleteAction) {
          case "remove_address":
            if (!deleteAddress) {
              return res.status(400).json({ error: "Address is required" });
            }
            deleteResult = await removeWatchedAddress(deleteEmail, deleteAddress);
            break;

          case "remove_email":
            deleteResult = await removeEmail(deleteEmail);
            break;

          default:
            return res.status(400).json({ error: "Invalid action" });
        }

        return res.status(200).json(deleteResult);
      }

      default:
        return res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Watched addresses API error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
