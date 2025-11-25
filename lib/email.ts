import axios from "axios";

interface Vote {
  address: string;
  name: string;
  expiry: string;
  weight: string;
}

interface SendEmailParams {
  to: string;
  subject: string;
  htmlBody: string;
}

interface EmailResult {
  success: boolean;
  emailId?: string;
  requestId?: string;
  error?: string;
}

export async function sendEmail({
  to,
  subject,
  htmlBody,
}: SendEmailParams): Promise<EmailResult> {
  const apiKey = process.env.SMTP2GO_API_KEY;
  const sender = process.env.EMAIL_FROM;

  if (!apiKey || !sender) {
    throw new Error("Missing SMTP2GO_API_KEY or EMAIL_FROM environment variable");
  }

  try {
    const response = await axios.post(
      "https://api.smtp2go.com/v3/email/send",
      {
        sender,
        to: [to],
        subject,
        html_body: htmlBody,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Smtp2go-Api-Key": apiKey,
          accept: "application/json",
        },
      }
    );

    if (response.status === 200 && response.data.data.succeeded > 0) {
      return {
        success: true,
        emailId: response.data.data.email_id,
        requestId: response.data.request_id,
      };
    } else {
      return {
        success: false,
        error: `Email failed: ${JSON.stringify(response.data.data.failures)}`,
      };
    }
  } catch (error: any) {
    if (error.response) {
      return {
        success: false,
        error: `SMTP2GO API error: ${error.response.data.data?.error || error.message}`,
      };
    }
    return {
      success: false,
      error: error.message,
    };
  }
}

export function createVoteEmailContent({
  from,
  txHash,
  poolInfo,
}: {
  from: string;
  txHash: string;
  poolInfo: Vote[];
}): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://pendle-vote-tool-g738.vercel.app";

  let tableRows = "";
  for (const pool of poolInfo) {
    const weightPercent = ((Number(pool.weight) / 1e18) * 100).toFixed(2);
    const expiryDate = pool.expiry
      ? new Date(pool.expiry).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "N/A";

    tableRows += `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${pool.name || "Unknown"}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${weightPercent}%</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">${expiryDate}</td>
      </tr>`;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="background-color: #0a0a0a; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Vote Detected</h1>
          </div>

          <div style="padding: 24px;">
            <div style="margin-bottom: 20px;">
              <p style="margin: 0 0 8px 0; color: #666;">
                <strong style="color: #333;">From:</strong>
              </p>
              <a href="https://etherscan.io/address/${from}" style="color: #0066cc; text-decoration: none; font-family: monospace; font-size: 14px; word-break: break-all;">
                ${from}
              </a>
            </div>

            <div style="margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0; color: #666;">
                <strong style="color: #333;">Transaction:</strong>
              </p>
              <a href="https://etherscan.io/tx/${txHash}" style="color: #0066cc; text-decoration: none; font-family: monospace; font-size: 14px; word-break: break-all;">
                ${txHash}
              </a>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #333; border-bottom: 2px solid #e5e5e5;">Pool Name</th>
                  <th style="padding: 12px; text-align: right; font-weight: 600; color: #333; border-bottom: 2px solid #e5e5e5;">Weight</th>
                  <th style="padding: 12px; text-align: left; font-weight: 600; color: #333; border-bottom: 2px solid #e5e5e5;">Expiry</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>

            <div style="text-align: center;">
              <a href="${baseUrl}/get-vote?txHash=${txHash}"
                 style="display: inline-block; padding: 12px 24px; background-color: #0a0a0a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">
                View & Copy Vote
              </a>
            </div>
          </div>

          <div style="background-color: #f5f5f5; padding: 16px; text-align: center;">
            <p style="margin: 0; color: #666; font-size: 12px;">
              Pendle Vote Watcher
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}
