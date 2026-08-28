import { LEGAL_UPDATED_AT, type LegalDocKind } from "./catalog";

export type LegalBlock =
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "note"; text: string };

export type LegalSection = {
  id: string;
  title: string;
  blocks: LegalBlock[];
};

export type LegalDocument = {
  title: string;
  updatedAt: string;
  summary: string;
  sections: LegalSection[];
};

const CONTACT_EMAIL = "admin@kontme.com";
const SITE = "https://www.kontme.com";
const PRIVACY_URL = `${SITE}/privacy-policy`;
const TERMS_URL = `${SITE}/terms`;
const DELETION_EMAIL = CONTACT_EMAIL;

const kontTerms: LegalDocument = {
  title: "Terms of Use",
  updatedAt: LEGAL_UPDATED_AT,
  summary:
    "These Terms of Use govern access to KONT — a workspace for drafting, scheduling, and publishing content to accounts you connect.",
  sections: [
    {
      id: "agreement",
      title: "1. Agreement",
      blocks: [
        {
          type: "p",
          text: `These Terms of Use (“Terms”) are a contract between you and KONT (“KONT”, “we”, “us”) for use of ${SITE} and related apps and services (the “Service”). By creating an account or using the Service, you agree to these Terms and to our Privacy Policy at ${PRIVACY_URL}.`,
        },
        {
          type: "p",
          text: "If you use KONT on behalf of an organization, you represent that you have authority to bind that organization, and “you” includes that organization.",
        },
      ],
    },
    {
      id: "eligibility",
      title: "2. Eligibility and accounts",
      blocks: [
        {
          type: "p",
          text: "You must be at least 13 years old, or the higher minimum age required in your country, to use KONT. You are responsible for your account credentials and for activity under your account. Notify us promptly at the contact email below if you suspect unauthorized access.",
        },
        {
          type: "ul",
          items: [
            "Provide accurate registration information and keep it up to date.",
            "Do not share your password or sell access to your account.",
            "You may disconnect any third-party account at any time from Studio → Platforms.",
            `To close your KONT account, email ${DELETION_EMAIL} from the address on the account. There is no in-app delete button today.`,
          ],
        },
      ],
    },
    {
      id: "service",
      title: "3. The Service",
      blocks: [
        {
          type: "p",
          text: "KONT is a workspace where you draft, schedule, and publish content, keep a public link page, and connect destination accounts through official APIs. What is live today:",
        },
        {
          type: "ul",
          items: [
            "Publish to Facebook Pages and Instagram professional accounts linked to a Page.",
            "Upload and publish video to YouTube.",
            "Import image and video files you pick from Google Drive.",
            "Connect a Telegram bot you control, using a bot token you paste.",
            "Create drafts, schedules, and a public link-in-bio page at a handle you choose.",
          ],
        },
        {
          type: "note",
          text: "TikTok, Pinterest, LinkedIn, Discord, email, Notion, Dropbox, Inbox, comments, insights, and analytics tiles may appear in Studio. Those destinations and surfaces are not live API products. We do not process their platform data until Connect (or that feature) is actually offered and this page is updated. KONT is not affiliated with, endorsed by, or sponsored by Meta, Google, TikTok, ByteDance, Telegram, or any other third-party platform. We use their APIs as an independent client.",
        },
      ],
    },
    {
      id: "your-content",
      title: "4. Your content",
      blocks: [
        {
          type: "p",
          text: "You retain ownership of content you upload or create in KONT (“Your Content”). You grant KONT a limited license to host, process, transmit, and display Your Content solely to operate the Service — including publishing to platforms you select.",
        },
        {
          type: "ul",
          items: [
            "You are responsible for Your Content and for complying with each destination’s terms and community guidelines.",
            "You represent that you have all rights needed to publish Your Content, and that it does not violate law or those guidelines.",
            "We do not claim ownership of Your Content or of content that already exists on connected platforms.",
            "Content already published to a destination stays on that destination if you disconnect or delete KONT, unless you delete it there.",
          ],
        },
      ],
    },
    {
      id: "integrations",
      title: "5. Third-party integrations",
      blocks: [
        {
          type: "p",
          text: "When you connect a service, you authorize KONT to access that account through official OAuth, login, or equivalent APIs, using only the permissions you approve. Each connection is optional. We access data only to operate the features you actually use.",
        },
        {
          type: "ul",
          items: [
            "We do not sell your data or use connected-account data to advertise to you.",
            "Revoking access in KONT or in the platform’s security settings stops further API calls from KONT.",
            "Third-party platforms may change, limit, or revoke API access. We are not responsible for their outages or policy changes.",
            "If you connect YouTube or Google Drive, you also agree to the YouTube Terms of Service (https://www.youtube.com/t/terms) and the Google Privacy Policy (https://policies.google.com/privacy). KONT’s use of YouTube API Services complies with the YouTube API Services Developer Policies (https://developers.google.com/youtube/terms/developer-policies).",
            "If you connect Facebook Pages or Instagram professional accounts, you also agree to Meta’s terms for those products. KONT’s use of information received from Meta APIs follows Meta Platform Terms, including Limited Use.",
            "When TikTok Login is offered and you connect it, you also agree to TikTok’s Terms of Service and Community Guidelines (https://www.tiktok.com/community-guidelines). KONT’s use of TikTok APIs will follow TikTok’s Developer Terms. Until Connect is live, we do not receive TikTok API data.",
            "If you connect Telegram, you supply a bot token for a bot you control. You are responsible for that bot’s configuration and for complying with Telegram’s terms.",
          ],
        },
      ],
    },
    {
      id: "acceptable-use",
      title: "6. Acceptable use",
      blocks: [
        {
          type: "p",
          text: "You agree not to misuse the Service. Prohibited conduct includes:",
        },
        {
          type: "ul",
          items: [
            "Violating law, these Terms, or a connected platform’s terms or community guidelines (including Meta Community Standards, YouTube Community Guidelines, and TikTok Community Guidelines when you use those destinations).",
            "Uploading malware, scraping the Service, or attempting unauthorized access.",
            "Impersonating others or publishing content you do not have the right to use.",
            "Using KONT to spam, harass, or operate undisclosed automated engagement.",
          ],
        },
      ],
    },
    {
      id: "ip",
      title: "7. KONT intellectual property",
      blocks: [
        {
          type: "p",
          text: "The Service, including its design, software, and trademarks, is owned by KONT or its licensors. You may not copy, reverse engineer, or resell the Service except as allowed by law or a written agreement with us.",
        },
      ],
    },
    {
      id: "disclaimers",
      title: "8. Disclaimers and liability",
      blocks: [
        {
          type: "p",
          text: "The Service is provided “as is”. We do not warrant uninterrupted or error-free operation, or that publishing to a third-party platform will always succeed. To the fullest extent permitted by law, KONT is not liable for indirect, incidental, or consequential damages, or for actions taken on third-party platforms using credentials you authorized.",
        },
      ],
    },
    {
      id: "termination",
      title: "9. Suspension and termination",
      blocks: [
        {
          type: "p",
          text: `You may stop using KONT at any time and request deletion of your account by emailing ${DELETION_EMAIL}. We may suspend or terminate access if you materially breach these Terms or if required by a platform or by law. After termination we delete or anonymize personal data as described in the Privacy Policy, except where we must retain it.`,
        },
      ],
    },
    {
      id: "changes",
      title: "10. Changes",
      blocks: [
        {
          type: "p",
          text: "We may update these Terms. The “Last updated” date will change, and material updates will be posted on this page. Continued use after an update means you accept the revised Terms.",
        },
      ],
    },
    {
      id: "contact",
      title: "11. Contact",
      blocks: [
        {
          type: "p",
          text: `Questions about these Terms: ${CONTACT_EMAIL} · ${TERMS_URL}`,
        },
      ],
    },
  ],
};

const kontPrivacy: LegalDocument = {
  title: "Privacy Policy",
  updatedAt: LEGAL_UPDATED_AT,
  summary:
    "How KONT collects, uses, stores, and deletes personal data when you use the workspace and connect publishing accounts.",
  sections: [
    {
      id: "intro",
      title: "1. Who we are",
      blocks: [
        {
          type: "p",
          text: `This Privacy Policy applies to KONT (“KONT”, “we”, “us”) at ${SITE}. It covers the website, Studio, your public link page, and data we receive when you connect a third-party account.`,
        },
        {
          type: "p",
          text: `Questions, access requests, and deletion requests: ${CONTACT_EMAIL}. Canonical policy URL: ${PRIVACY_URL}.`,
        },
      ],
    },
    {
      id: "scope",
      title: "2. What this policy covers — and what is not live yet",
      blocks: [
        {
          type: "p",
          text: "KONT is a workspace for drafting, scheduling, and publishing content. When you connect a platform, we use that connection to identify the destination account and to publish or import only what you submit. We do not operate a CRM, inbox, or ads product.",
        },
        {
          type: "note",
          text: "Studio may show tiles such as TikTok, Pinterest, LinkedIn, Discord, Inbox, comments, insights, and analytics. Those are placeholders on our roadmap. We do not currently read messages, comments, insights, followers, or personal feeds from connected platforms, and we do not receive TikTok API data until TikTok Connect is live. If we enable a new category of data, we will ask for the matching permissions and update this policy first.",
        },
      ],
    },
    {
      id: "collect",
      title: "3. Information we collect",
      blocks: [
        {
          type: "p",
          text: "Account data you give us:",
        },
        {
          type: "ul",
          items: [
            "First name, last name, email address, and optional login name",
            "Password (stored hashed, never in plain text)",
            "Locale, timezone, and whether you opted in to marketing email",
            "Email verification status needed to keep the account secure",
          ],
        },
        {
          type: "p",
          text: "Content and pages you create in KONT:",
        },
        {
          type: "ul",
          items: [
            "Drafts, captions, media files you upload, schedules, calendar events you create in KONT, and publish status",
            "Which destination accounts you selected for a post",
            "If you create a public link page: handle, title, bio, and the links you publish at /u/{handle}",
          ],
        },
        {
          type: "p",
          text: "Technical data needed to run the site:",
        },
        {
          type: "ul",
          items: [
            "Session cookies to keep you signed in",
            "IP address, browser user-agent, and basic request logs for security and debugging, retained only as long as needed for those purposes",
          ],
        },
        {
          type: "p",
          text: "When you connect a platform (only if you choose to):",
        },
        {
          type: "ul",
          items: [
            "Account identifiers needed to label the destination in Studio (for example a Page name, Instagram username, YouTube channel, Telegram bot username, or — when TikTok Connect is live — the TikTok account you authorize)",
            "Access tokens or a Telegram bot token you paste, stored encrypted, used only to call that platform on your behalf",
            "The caption, media, and destination you submit when you publish or import",
            "Post, video, or file ids and status returned after a publish or import you started",
          ],
        },
      ],
    },
    {
      id: "use",
      title: "4. How we use information",
      blocks: [
        {
          type: "ul",
          items: [
            "Create and authenticate your KONT account, including email verification",
            "Show connected destinations in Studio → Platforms",
            "Publish, schedule, or import the content you submit to the accounts you select",
            "Show your public link page if you create one",
            "Send transactional email (sign-in, security, and notices required to operate the account)",
            "Send marketing email only if you opted in",
            "Secure the Service (abuse prevention, debugging, and audit logs of connect / disconnect / publish)",
          ],
        },
        {
          type: "p",
          text: "We do not sell personal data. We do not use connected-account data to advertise, build ad profiles, retarget people, train general-purpose AI models, or make decisions about credit, housing, or employment. Hosting and email processors may store encrypted tokens and post payloads solely to operate KONT. We do not transfer that data to other apps for their independent use.",
        },
        {
          type: "p",
          text: "KONT’s use of information received from Meta APIs complies with Meta Platform Terms, including Limited Use: we use that data only to provide the user-facing features you turn on in KONT.",
        },
        {
          type: "p",
          text: "KONT’s use and transfer to any other app of information received from Google APIs will adhere to the Google API Services User Data Policy (https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements.",
        },
      ],
    },
    {
      id: "connected",
      title: "5. Connected platforms",
      blocks: [
        {
          type: "p",
          text: "You see a permissions screen before a connection is made. We receive only what you grant, and only to run the features you turn on. Same rules for every destination:",
        },
        {
          type: "ul",
          items: [
            "Facebook Pages and Instagram professional: who logged in, Pages you manage, the Instagram professional account linked to a Page, encrypted tokens, and post or media ids after you publish. Used only to list destinations and publish content you submit. We do not load comments, DMs, or insights into Studio.",
            "YouTube and Google Drive: Google identity needed for the connection, YouTube channel identity, videos and metadata you upload, and names and contents of Drive files you pick to import. We list image and video files you can access so you can choose one; we download only the file you select. We do not read Gmail. We do not currently pull YouTube Analytics into Studio, and we do not sync Google Calendar or Sheets even if those items appear in Studio.",
            "TikTok: not live today — we do not receive TikTok API data until you complete TikTok Login. When that connection is offered, we will receive identity needed to label the account, encrypted tokens, and the caption and video you submit, plus ids and status after that publish. We will not read TikTok DMs, followers, or For You feed.",
            "Telegram: you paste a bot token you control and optionally a chat id. We verify the bot, store the token encrypted, and use it only to send messages you initiate. We do not read your personal Telegram chats.",
            "Other destinations shown in Studio (including Pinterest, LinkedIn, Discord, and similar): no API data until a real connection exists. A Coming soon or demo tile does not mean we already process that platform.",
          ],
        },
        {
          type: "p",
          text: "YouTube also requires the YouTube Terms of Service (https://www.youtube.com/t/terms) and Google Privacy Policy (https://policies.google.com/privacy). Disconnect in Studio → Platforms, or in the platform’s own security settings: Facebook (https://www.facebook.com/settings?tab=applications), Google (https://myaccount.google.com/permissions), and — when TikTok Connect is live — TikTok’s in-app connected-apps settings.",
        },
      ],
    },
    {
      id: "sharing",
      title: "6. Sharing",
      blocks: [
        {
          type: "p",
          text: "We share data only as needed to run KONT:",
        },
        {
          type: "ul",
          items: [
            "A destination platform, when you publish or import — the caption, media, and account you chose",
            "Infrastructure processors (hosting, database, email delivery) acting on our instructions",
            "Authorities if required by law",
          ],
        },
        {
          type: "p",
          text: "We do not sell, rent, or broker personal information. We do not share connected-platform data with advertisers, data brokers, or independent AI training services.",
        },
      ],
    },
    {
      id: "retention",
      title: "7. Retention",
      blocks: [
        {
          type: "ul",
          items: [
            "KONT account data: until you request deletion, plus a short period needed to complete deletion and keep security logs",
            "Connected-platform tokens (and Telegram bot tokens): only while that connection stays active; disconnect or deletion removes them",
            "Drafts, media, schedules, calendar events, and link-page content: until you delete them or we delete the account",
            "Publish ids and status: kept with the post record so you can see what already went out",
          ],
        },
      ],
    },
    {
      id: "deletion",
      title: "8. How to delete your data",
      blocks: [
        {
          type: "p",
          text: "This section is the user-data deletion process for KONT, including data received from Meta, Google, and (when connected) TikTok.",
        },
        {
          type: "ul",
          items: [
            "Disconnect a platform in Studio → Platforms. KONT then revokes the grant where the provider allows it and deletes stored tokens for that connection.",
            "Remove KONT from that platform’s own apps and security settings (Facebook Apps and Websites, Google Third-party access, TikTok connected apps when available). That stops new API access even if you have not opened KONT.",
            `Request deletion of your KONT account and remaining personal data by emailing ${DELETION_EMAIL} from the address on the account. Write “Delete my KONT account” and include the email on the account. We will delete or irreversibly anonymize that data within 30 days, except records we must keep for security, dispute, or legal reasons (for example a short audit trail that a publish occurred).`,
          ],
        },
        {
          type: "note",
          text: "Posts, Reels, videos, and messages already published to Facebook, Instagram, YouTube, Telegram, TikTok, or another destination live on those platforms. Deleting KONT data does not remove content that is already there — delete those posts on the destination if you want them gone.",
        },
      ],
    },
    {
      id: "rights",
      title: "9. Your rights",
      blocks: [
        {
          type: "p",
          text: `Depending on where you live (including the EEA/UK and similar regimes), you may request access, correction, deletion, restriction, or a copy of your personal data, and object to certain processing. Email ${CONTACT_EMAIL}. We may need to verify that the request comes from the account holder.`,
        },
      ],
    },
    {
      id: "children",
      title: "10. Children",
      blocks: [
        {
          type: "p",
          text: "KONT is not directed at children under 13, or the higher age required in your country. We do not knowingly collect personal data from children. If you believe we have, contact us and we will delete it.",
        },
      ],
    },
    {
      id: "cookies",
      title: "11. Cookies",
      blocks: [
        {
          type: "p",
          text: "We use essential cookies and similar storage to keep you signed in and to protect the session. We do not currently run third-party advertising cookies. If we add product analytics, this section will name the tool and the data.",
        },
      ],
    },
    {
      id: "international",
      title: "12. International processing",
      blocks: [
        {
          type: "p",
          text: "KONT and its processors may process data in the United States and other countries where our infrastructure runs. Destination platforms also process data under their own terms when you connect them.",
        },
      ],
    },
    {
      id: "changes",
      title: "13. Changes",
      blocks: [
        {
          type: "p",
          text: "We will post updates on this page and change the “Last updated” date. If we start processing new categories of connected-platform data (for example comments, inbox, TikTok Login, or insights), we will update this policy before those permissions go live.",
        },
      ],
    },
    {
      id: "contact",
      title: "14. Contact",
      blocks: [
        {
          type: "p",
          text: `Email: ${CONTACT_EMAIL} · Website: ${SITE} · Privacy Policy: ${PRIVACY_URL} · Terms of Use: ${TERMS_URL}`,
        },
      ],
    },
  ],
};

export function getLegalDocument(doc: LegalDocKind): LegalDocument {
  return doc === "privacy" ? kontPrivacy : kontTerms;
}
