function withValidProperties(properties: Record<string, undefined | string | string[]>) {
return Object.fromEntries(
    Object.entries(properties).filter(([_, value]) => (Array.isArray(value) ? value.length > 0 : !!value))
);
}

export async function GET() {
const URL = process.env.NEXT_PUBLIC_URL as string;
return Response.json({
    "accountAssociation": {
        "header": "eyJmaWQiOjIxMTYxMSwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDBERTkzM0JkZTc4ODU2RWY5ZmM2MTMzNDYxQ0Y1NDQ2Y0I1NTlDMGMifQ",
        "payload": "eyJkb21haW4iOiJjZXJ0YWlrLWFwcC1naXQtZmVhdC1iYXNlLW1pbmktYXBwLXN1cHBvcnQtYmV2b3IudmVyY2VsLmFwcCJ9",
        "signature": "MHgzMGViNzQ5MzUzNGZlMTJjNWZmYzFhZTIwMzU5ODJkZjY3MGE2ZjlmNjM5YjMwMjZkZDgyNDA2MWQ2NzkzNmFhNDAwNDM0MGU4NWEzZjc5MmM5OGQ5ZmE5MWFhYWYwZDM3Y2NmZGNjNWY4MTY1MTgyMDc0MDQ2YTY2MzRjZDc0ODFi"
    },
    "baseBuilder": {
      "allowedAddresses": [""] // add your Base Account address here
    },
    "miniapp": {
      "version": "1",
      "name": "BevorAI",
      "homeUrl": "https://bevor.io",
      "iconUrl": "https://pbs.twimg.com/profile_images/1886423225925533696/KRveUwhh_400x400.jpg",
      "splashImageUrl": "https://pbs.twimg.com/profile_banners/1862890581896163328/1738593320/1500x500", 
      "splashBackgroundColor": "#000000",
      "webhookUrl": "",
      "subtitle": "AI Agent Smart Contract Auditor",
      "description": "BevorAI is an AI-powered smart contract auditing platform that helps teams and auditors secure code.",
      "screenshotUrls": [
        "https://bevor.io/screenshots/audit.png",
        "https://bevor.io/screenshots/team.png",
        "https://bevor.io/screenshots/analysis.png"
      ],
      "primaryCategory": "developer-tools",
      "tags": ["smart-contracts", "security", "ai", "audit"],
      "heroImageUrl": "https://pbs.twimg.com/profile_banners/1862890581896163328/1738593320/1500x500",
      "tagline": "AI-Powered Smart Contract Security",
      "ogTitle": "BevorAI - Smart Contract Auditor",
      "ogDescription": "AI-powered smart contract security platform that helps teams and auditors secure code",
      "ogImageUrl": "https://pbs.twimg.com/profile_banners/1862890581896163328/1738593320/1500x500",
      "noindex": true
    }
  }); // see the next step for the manifest_json_object
}