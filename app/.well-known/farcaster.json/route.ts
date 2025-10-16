function withValidProperties(properties: Record<string, undefined | string | string[]>) {
return Object.fromEntries(
    Object.entries(properties).filter(([_, value]) => (Array.isArray(value) ? value.length > 0 : !!value))
);
}

export async function GET() {
const URL = process.env.NEXT_PUBLIC_URL as string;
return Response.json({
    "accountAssociation": {  // these will be added in step 5
      "header": "",
      "payload": "",
      "signature": ""
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