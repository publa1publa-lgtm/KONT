import { LEGAL_UPDATED_AT, type LegalDocKind, type LegalServiceId } from "./catalog";

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

const CONTACT_EMAIL = "support@kontme.com";
const SITE = "https://www.kontme.com";

const kontTerms: LegalDocument = {
  title: "Terms of Use",
  updatedAt: LEGAL_UPDATED_AT,
  summary:
    "These Terms of Use govern access to KONT — a workspace for planning, publishing, and managing content across connected social and productivity services.",
  sections: [
    {
      id: "agreement",
      title: "1. Agreement",
      blocks: [
        {
          type: "p",
          text: `These Terms of Use (“Terms”) are a contract between you and KONT (“KONT”, “we”, “us”) for use of ${SITE} and related apps, APIs, and services (the “Service”). By creating an account or using the Service, you agree to these Terms and to our Privacy Policy.`,
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
          text: "You must be at least 13 years old (or the minimum age required in your country) to use KONT. You are responsible for your account credentials and for activity under your account. Notify us promptly at the contact email below if you suspect unauthorized access.",
        },
        {
          type: "ul",
          items: [
            "Provide accurate registration information and keep it up to date.",
            "Do not share your password or sell access to your account.",
            "You may disconnect any third-party account at any time from Studio settings.",
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
          text: "KONT lets you draft, schedule, publish, and review content, and connect official platform APIs (for example TikTok, Instagram, YouTube, Facebook, Pinterest, LinkedIn, Telegram, and Discord). Features may change as we improve the product. Some capabilities depend on permissions you grant on each platform.",
        },
        {
          type: "note",
          text: "KONT is not affiliated with, endorsed by, or sponsored by TikTok, ByteDance, Meta, Google, Pinterest, LinkedIn, Telegram, Discord, or any other third-party platform except as an independent API client.",
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
            "You are responsible for Your Content and for complying with each destination platform’s rules.",
            "You represent that you have all rights needed to publish Your Content.",
            "We do not claim ownership of Your Content or of content that already exists on connected platforms.",
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
          text: "When you connect a service, you authorize KONT to access that account through official OAuth or equivalent APIs, using only the permissions you approve. Each connection is optional. Platform-specific terms in this Legal center describe the data and actions for that service.",
        },
        {
          type: "ul",
          items: [
            "We access data only to provide features you use (publish, schedule, inbox, analytics).",
            "We do not sell your data or use connected-account data to advertise to you.",
            "Revoking access in KONT or in the platform’s security settings stops further API calls.",
            "Third-party platforms may change, limit, or revoke API access; we are not responsible for their outages or policy changes.",
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
            "Violating law, these Terms, or a connected platform’s terms or community guidelines.",
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
          text: "You may stop using KONT and delete your account at any time. We may suspend or terminate access if you materially breach these Terms or if required by a platform or by law. After termination we delete or anonymize personal data as described in the Privacy Policy, except where we must retain it.",
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
          text: `Questions about these Terms: ${CONTACT_EMAIL} · ${SITE}`,
        },
      ],
    },
  ],
};

const kontPrivacy: LegalDocument = {
  title: "Privacy Policy",
  updatedAt: "May 31, 2026",
  summary:
    "How KONT collects, uses, and protects personal information when you use the platform and connect third-party services.",
  sections: [
    {
      id: "intro",
      title: "1. Introduction",
      blocks: [
        {
          type: "p",
          text: `Welcome to KONT (“we”, “us”, or “our”). We are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our platform at ${SITE}.`,
        },
        {
          type: "p",
          text: "By using KONT, you agree to the collection and use of information in accordance with this policy. We may update this policy from time to time and will notify you of any significant changes.",
        },
      ],
    },
    {
      id: "collect",
      title: "2. Information we collect",
      blocks: [
        {
          type: "p",
          text: "We collect the following information when you register and use our platform:",
        },
        {
          type: "ul",
          items: [
            "Name (if provided)",
            "Email address",
            "Social and productivity profile information accessed via official APIs (for example TikTok, Instagram, YouTube, Facebook, Pinterest, LinkedIn, Telegram, Discord)",
            "Content you create, upload, or schedule through KONT",
            "Technical data such as device, browser, and basic usage events needed to operate the Service",
          ],
        },
      ],
    },
    {
      id: "use",
      title: "3. How we use your information",
      blocks: [
        {
          type: "p",
          text: "We use the information we collect to:",
        },
        {
          type: "ul",
          items: [
            "Create and manage your account",
            "Schedule and publish content to connected platforms",
            "Show inbox, comments, and analytics you request",
            "Send platform-related emails (account notices and product updates)",
            "Improve and maintain the Service",
          ],
        },
        {
          type: "p",
          text: "We do not use your data for advertising purposes. We do not sell your data to third parties.",
        },
      ],
    },
    {
      id: "integrations",
      title: "4. Social integrations and permissions",
      blocks: [
        {
          type: "p",
          text: "KONT integrates with third-party platforms via their official APIs. When you connect an account, you see a permissions screen that lists the access we request. Select a service on the left for platform-specific details.",
        },
        {
          type: "p",
          text: "You are in control:",
        },
        {
          type: "ul",
          items: [
            "All permissions are shown before a connection is made.",
            "You may decline optional permissions; some features may then be unavailable.",
            "You can disconnect accounts at any time from Studio settings or from the platform’s own security page.",
            "We access only data you authorize and handle it under each platform’s developer terms.",
          ],
        },
      ],
    },
    {
      id: "email",
      title: "5. Email communications",
      blocks: [
        {
          type: "p",
          text: `By creating an account, you agree to receive emails related to your account and platform activity. You may opt out of non-essential emails by contacting ${CONTACT_EMAIL}.`,
        },
      ],
    },
    {
      id: "security",
      title: "6. Data storage and security",
      blocks: [
        {
          type: "p",
          text: "We take reasonable measures to protect your personal information from unauthorized access, loss, or misuse. Tokens and credentials are stored securely and accessed only by authorized systems needed to operate the Service.",
        },
      ],
    },
    {
      id: "cookies",
      title: "7. Cookies and analytics",
      blocks: [
        {
          type: "p",
          text: "We may use cookies to keep you signed in and to improve the product. If we add analytics tools, this policy will be updated.",
        },
      ],
    },
    {
      id: "rights",
      title: "8. Your rights",
      blocks: [
        {
          type: "p",
          text: "You have the right to:",
        },
        {
          type: "ul",
          items: [
            "Access the personal data we hold about you",
            "Request correction or deletion of your data",
            "Withdraw consent and disconnect integrations at any time",
          ],
        },
        {
          type: "p",
          text: `To exercise these rights, contact hello@kontme.com or ${CONTACT_EMAIL}.`,
        },
      ],
    },
    {
      id: "children",
      title: "9. Children’s privacy",
      blocks: [
        {
          type: "p",
          text: "The Service is not intended for children under 13. We do not knowingly collect personal information from children.",
        },
      ],
    },
    {
      id: "changes",
      title: "10. Changes to this policy",
      blocks: [
        {
          type: "p",
          text: "We may update this Privacy Policy at any time. Changes will be posted on this page with an updated date. Continued use after changes constitutes acceptance of the new policy.",
        },
      ],
    },
    {
      id: "contact",
      title: "11. Contact us",
      blocks: [
        {
          type: "p",
          text: `Email: ${CONTACT_EMAIL} · Website: ${SITE}`,
        },
      ],
    },
  ],
};

function platformTerms(input: {
  name: string;
  intro: string;
  actions: string[];
  data: string[];
  extra?: LegalSection[];
}): LegalDocument {
  return {
    title: `Terms of Use — ${input.name}`,
    updatedAt: LEGAL_UPDATED_AT,
    summary: input.intro,
    sections: [
      {
        id: "scope",
        title: "1. Scope",
        blocks: [
          {
            type: "p",
            text: `${input.intro} These terms supplement the KONT Terms of Use. If you connect ${input.name}, you also agree to ${input.name}’s own terms, community guidelines, and developer policies.`,
          },
        ],
      },
      {
        id: "what-we-do",
        title: "2. What KONT does on your behalf",
        blocks: [
          {
            type: "p",
            text: `After you authorize the connection, KONT may perform only the actions you enable:`,
          },
          { type: "ul", items: input.actions },
        ],
      },
      {
        id: "data",
        title: "3. Data we access",
        blocks: [
          {
            type: "p",
            text: `Depending on the permissions you grant, KONT may receive:`,
          },
          { type: "ul", items: input.data },
          {
            type: "p",
            text: `We use this information solely to operate KONT features you request. We do not sell ${input.name} data, do not use it to build advertising profiles, and do not share it with unrelated third parties.`,
          },
        ],
      },
      {
        id: "control",
        title: "4. Your control",
        blocks: [
          {
            type: "ul",
            items: [
              `You choose which permissions to grant during connect.`,
              `You can disconnect ${input.name} in KONT Studio at any time.`,
              `You can also revoke KONT from ${input.name}’s account or security settings.`,
              "After disconnect, we stop new API calls and delete or anonymize stored tokens.",
            ],
          },
        ],
      },
      {
        id: "your-duties",
        title: "5. Your responsibilities",
        blocks: [
          {
            type: "p",
            text: `You are responsible for content published to ${input.name} through KONT and for complying with ${input.name} rules. KONT does not pre-approve your posts and is not liable for enforcement actions taken by ${input.name}.`,
          },
        ],
      },
      ...(input.extra ?? []),
      {
        id: "contact",
        title: `${input.extra?.length ? "7" : "6"}. Contact`,
        blocks: [
          {
            type: "p",
            text: `Questions about this ${input.name} integration: ${CONTACT_EMAIL}`,
          },
        ],
      },
    ],
  };
}

function platformPrivacy(name: string, specifics: string[]): LegalDocument {
  return {
    title: `Privacy — ${name}`,
    updatedAt: LEGAL_UPDATED_AT,
    summary: `How KONT handles ${name} data when you connect that account.`,
    sections: [
      {
        id: "use",
        title: "1. How we use this data",
        blocks: [
          {
            type: "p",
            text: `When you connect ${name}, KONT processes account and content data only to provide the workspace features you use (connect, publish, schedule, inbox, and analytics).`,
          },
          { type: "ul", items: specifics },
        ],
      },
      {
        id: "sharing",
        title: "2. Sharing",
        blocks: [
          {
            type: "p",
            text: `We do not sell ${name} data. We do not share it with advertisers. Processors that host KONT infrastructure may store encrypted tokens and content you upload, solely to run the Service.`,
          },
        ],
      },
      {
        id: "retention",
        title: "3. Retention and deletion",
        blocks: [
          {
            type: "p",
            text: `OAuth tokens are kept only while the account stays connected. Disconnecting ${name} or deleting your KONT account removes those tokens. You may also request deletion at ${CONTACT_EMAIL}. Drafts and scheduled posts you created in KONT are stored until you delete them or close your account.`,
          },
        ],
      },
      {
        id: "more",
        title: "4. Full policy",
        blocks: [
          {
            type: "p",
            text: "The KONT Privacy Policy (select KONT → Privacy Policy) applies to all services, including this one.",
          },
        ],
      },
    ],
  };
}

const TERMS: Record<LegalServiceId, LegalDocument> = {
  kont: kontTerms,
  tiktok: platformTerms({
    name: "TikTok",
    intro:
      "KONT connects to TikTok through official TikTok for Developers APIs so you can authorize your account and publish videos from the workspace.",
    actions: [
      "Read basic profile information needed to identify the connected account.",
      "Upload and publish videos you create or schedule in KONT.",
      "Manage or remove posts that were created through KONT, if you grant that permission.",
      "Read post-level analytics you choose to enable.",
    ],
    data: [
      "Account identifiers (such as open_id) and display name / avatar if provided by TikTok.",
      "Publish status and identifiers of videos created through KONT.",
      "Analytics metrics you authorize (views, engagement) for those posts.",
    ],
    extra: [
      {
        id: "tiktok-dev",
        title: "6. TikTok developer terms",
        blocks: [
          {
            type: "p",
            text: "Use of the TikTok integration is also subject to the TikTok Developer Terms of Service, TikTok Commercial Terms of Service (if applicable), and TikTok Community Guidelines. KONT uses TikTok APIs only as an authorized client. We do not independently operate TikTok and cannot override TikTok moderation, ranking, or account decisions.",
          },
          {
            type: "note",
            text: "You can review TikTok’s own legal documents at developers.tiktok.com and www.tiktok.com/legal.",
          },
        ],
      },
    ],
  }),
  instagram: platformTerms({
    name: "Instagram",
    intro:
      "KONT connects to Instagram through official Meta APIs so you can publish Reels and posts and, if enabled, manage comments and insights.",
    actions: [
      "Identify Instagram professional accounts you authorize.",
      "Publish Reels and posts you create in KONT.",
      "Read and reply to comments on content posted through KONT, if granted.",
      "Read insights for that content, if granted.",
    ],
    data: [
      "Instagram user or Page identifiers, username, and profile picture.",
      "Media you upload through KONT and resulting media IDs.",
      "Comments and insight metrics you authorize.",
    ],
  }),
  youtube: platformTerms({
    name: "YouTube",
    intro:
      "KONT uses YouTube API Services to upload videos to channels you authorize and to read channel data needed for publishing.",
    actions: [
      "Identify the YouTube channel you connect.",
      "Upload videos and set titles, descriptions, tags, and schedules you provide.",
      "Read channel and video metadata required to confirm a successful publish.",
      "Read analytics if you grant that Google scope.",
    ],
    data: [
      "Google account / channel identifiers and channel title.",
      "Video files and metadata you submit through KONT.",
      "Upload status and video IDs returned by YouTube.",
    ],
    extra: [
      {
        id: "yt-api",
        title: "6. YouTube API Services",
        blocks: [
          {
            type: "p",
            text: "By using the YouTube connection, you agree to the YouTube Terms of Service (https://www.youtube.com/t/terms) and Google Privacy Policy (https://policies.google.com/privacy). KONT’s use of information received from YouTube APIs complies with the YouTube API Services Developer Policies.",
          },
          {
            type: "p",
            text: "You can revoke KONT’s access to your Google Account at any time from Google’s security settings: https://myaccount.google.com/permissions",
          },
        ],
      },
    ],
  }),
  facebook: platformTerms({
    name: "Facebook",
    intro:
      "KONT connects to Facebook Pages you manage through official Meta APIs for publishing and optional insights.",
    actions: [
      "List Pages you administer so you can choose where to publish.",
      "Create and manage posts on selected Pages.",
      "Read engagement and insights if you grant those permissions.",
    ],
    data: [
      "Page IDs, names, and roles you authorize.",
      "Post content you submit through KONT and resulting post IDs.",
      "Engagement and insight metrics you authorize.",
    ],
  }),
  pinterest: platformTerms({
    name: "Pinterest",
    intro:
      "KONT connects to Pinterest through official APIs so you can publish Pins to boards you manage.",
    actions: [
      "List boards and sections you choose to share.",
      "Create Pins from content you prepare in KONT.",
      "Read Pin and board performance metrics if granted.",
    ],
    data: [
      "Pinterest user and board identifiers.",
      "Pin media and descriptions you submit.",
      "Analytics you authorize.",
    ],
  }),
  linkedin: platformTerms({
    name: "LinkedIn",
    intro:
      "KONT connects to LinkedIn so you can publish as a member or to organization Pages you administer.",
    actions: [
      "Identify the member or organization Page you authorize.",
      "Create and manage posts on your behalf.",
      "Read organization content and analytics if granted.",
    ],
    data: [
      "LinkedIn member or organization identifiers and display names.",
      "Post content you submit through KONT.",
      "Analytics you authorize.",
    ],
  }),
  telegram: platformTerms({
    name: "Telegram",
    intro:
      "KONT can send messages and receive inbox updates through a Telegram bot you configure.",
    actions: [
      "Send messages to chats where your bot is allowed.",
      "Receive inbound updates for the unified inbox if you enable webhooks.",
    ],
    data: [
      "Bot token you provide (stored securely, used only to call Telegram Bot API).",
      "Chat identifiers and message content needed for send/receive features you enable.",
    ],
  }),
  discord: platformTerms({
    name: "Discord",
    intro:
      "KONT can post automation messages to a Discord channel through a webhook you configure.",
    actions: [
      "Post messages to the channel bound to your webhook.",
    ],
    data: [
      "Webhook URL you provide.",
      "Message content you choose to send from automations.",
    ],
  }),
};

const PRIVACY: Record<LegalServiceId, LegalDocument> = {
  kont: kontPrivacy,
  tiktok: platformPrivacy("TikTok", [
    "Profile identifiers and avatar are used to label the connected account in Studio.",
    "Video files you upload are sent to TikTok only when you publish or schedule a post.",
    "Analytics, if granted, are shown in KONT and not resold.",
  ]),
  instagram: platformPrivacy("Instagram", [
    "Account and media IDs are used to publish and to show status in the calendar.",
    "Comments and insights stay inside KONT inbox/analytics unless you copy them elsewhere.",
  ]),
  youtube: platformPrivacy("YouTube", [
    "Channel identity is used to select the destination for uploads.",
    "Video files and metadata are sent to YouTube API Services only when you publish.",
    "You may revoke access in your Google Account permissions at any time.",
  ]),
  facebook: platformPrivacy("Facebook", [
    "Page list and roles are used so you can pick a destination Page.",
    "Post content is sent to Meta APIs only when you publish.",
  ]),
  pinterest: platformPrivacy("Pinterest", [
    "Board lists are used so you can choose where a Pin is created.",
    "Pin media is uploaded only when you publish.",
  ]),
  linkedin: platformPrivacy("LinkedIn", [
    "Member or organization identity is used to post as the account you select.",
    "Post content is sent to LinkedIn only when you publish.",
  ]),
  telegram: platformPrivacy("Telegram", [
    "Bot tokens are stored only to call Telegram on your behalf.",
    "Inbound messages appear in Inbox only if you enable that permission.",
  ]),
  discord: platformPrivacy("Discord", [
    "Webhook URLs are used only to deliver messages you configure.",
    "We do not read your Discord server beyond what the webhook allows.",
  ]),
};

export function getLegalDocument(service: LegalServiceId, doc: LegalDocKind): LegalDocument {
  return doc === "privacy" ? PRIVACY[service] : TERMS[service];
}
