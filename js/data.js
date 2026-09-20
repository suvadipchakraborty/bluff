/* ThagaShield — Scam Rule Engine Data
   Each scam has: id, name, hi (hindi name), emoji, severity (base risk tier),
   channels[], actions[], keywords[], story (modus operandi), signs[], steps[] (action plan)
   Matching weights: channel=2, action=4, keyword=3
*/

const SCAMS = [
  {
    id: "digital-arrest",
    name: "The Digital Arrest Hustle",
    hi: "डिजिटल अरेस्ट ठगी",
    emoji: "🚨",
    channels: ["call", "whatsapp"],
    actions: ["video-call-police", "asked-money-now", "threatened-arrest"],
    keywords: ["cbi", "customs", "digital-arrest", "parcel", "aadhaar", "police"],
    story: "A caller poses as CBI, Customs or Police and claims a parcel in your name contains drugs, or your Aadhaar is linked to money laundering. They pull you onto a video call — often with a fake 'police station' backdrop — and keep you on the line so you can't think or call anyone else. This is called a 'digital arrest'. There is no such thing in Indian law. No agency ever arrests you over video call or demands money to 'clear your name'.",
    signs: [
      "Told to stay on video call and not hang up or contact anyone",
      "Told your Aadhaar or parcel is linked to a crime",
      "Asked to transfer a 'security deposit' or 'verification fee'",
      "Shown a fake ID card or police uniform on screen"
    ],
    steps: [
      "Hang up immediately. No real police force conducts arrests over video call.",
      "Do not transfer any money, no matter how urgent it sounds.",
      "Verify by calling the actual department's official number — never one the caller gives you.",
      "If you already paid, note the transaction ID and call 1930 right away."
    ]
  },
  {
    id: "task-scam",
    name: "The Fake Task, Real Trap",
    hi: "टास्क जॉब ठगी",
    emoji: "🎯",
    channels: ["whatsapp", "telegram", "sms"],
    actions: ["job-offer", "small-payout-first", "asked-deposit"],
    keywords: ["task", "telegram", "commission", "part-time", "like-videos", "rating"],
    story: "A message offers easy money for liking YouTube videos or rating hotels. The first few tasks actually pay ₹150–₹500 into your account — just enough to earn your trust. You're then moved to a 'premium' Telegram group where 'higher commission' tasks require you to deposit money first. That deposit disappears, along with the group admin.",
    signs: [
      "Unknown number offering a part-time job with no interview",
      "Small real payouts in the first 1–2 tasks",
      "Later tasks ask you to add funds before you can 'withdraw'",
      "Everything happens inside a Telegram or WhatsApp group"
    ],
    steps: [
      "Stop immediately — legitimate jobs never ask you to pay to earn.",
      "Leave the Telegram/WhatsApp group and block the contact.",
      "Do not deposit any 'unlocking' or 'commission' amount, however small.",
      "If money is already gone, screenshot the chat and report on cybercrime.gov.in."
    ]
  },
  {
    id: "reverse-qr",
    name: "The Reverse QR Trick",
    hi: "उल्टा QR कोड घोटाला",
    emoji: "📷",
    channels: ["call", "whatsapp", "sms"],
    actions: ["asked-scan-qr", "olx-buyer"],
    keywords: ["qr-scan", "buyer", "olx", "upi", "advance"],
    story: "Someone messages as a buyer on OLX, Facebook Marketplace or a rental listing and agrees to pay online. They say 'I'm sending a QR code — scan it to receive the payment.' A QR code can only ever be scanned to send money, never to receive it. Scanning their code and entering your UPI PIN authorises a payment out of your account.",
    signs: [
      "A 'buyer' insists on scanning a QR code to pay you",
      "Pressure to scan quickly, sometimes with a fake screenshot of 'payment sent'",
      "Asked to enter your UPI PIN to 'receive' money"
    ],
    steps: [
      "Never scan a QR code or enter your UPI PIN to receive money — only to pay.",
      "To receive payment, simply share your UPI ID; no scanning or PIN needed.",
      "If you scanned and lost money, call 1930 within the first hour — banks can sometimes freeze the transfer."
    ]
  },
  {
    id: "boss-impersonation",
    name: "The Fake Boss Message",
    hi: "बॉस बनकर ठगी",
    emoji: "🕴️",
    channels: ["whatsapp", "sms"],
    actions: ["boss-request", "gift-card", "urgent-transfer"],
    keywords: ["boss", "director", "ceo", "gift-card", "rtgs", "urgent"],
    story: "An unknown number sets its display photo to your company's CEO or director and messages you directly, claiming to be 'in a meeting' and unable to call. They ask you to urgently buy Apple gift cards or make an RTGS transfer to close a 'deal'. The urgency and authority in the message are designed to stop you from double-checking.",
    signs: [
      "Message from an unlisted number using a senior colleague's name or photo",
      "Claims to be busy or unreachable by call",
      "Asks for gift cards or an urgent bank transfer",
      "Insists on secrecy or speed"
    ],
    steps: [
      "Call the person directly on their known number before doing anything.",
      "Company finance requests never go through personal WhatsApp with gift cards.",
      "Report the number to your IT/security team so others are warned too."
    ]
  },
  {
    id: "apk-bill",
    name: "The Fake Bill APK",
    hi: "बिजली बिल APK ठगी",
    emoji: "⚡",
    channels: ["sms", "whatsapp"],
    actions: ["apk-download", "threat-disconnect"],
    keywords: ["electricity", "challan", "apk", "disconnect", "kyc"],
    story: "An SMS warns that your electricity will be cut tonight at 9 PM for an unpaid bill, or that a traffic challan is pending — with a link to download an app or 'pay now'. The link installs a malicious .apk file that reads your SMS (including OTPs) and drains your bank account, or leads to a fake payment page that steals your card details.",
    signs: [
      "Urgent deadline like 'tonight at 9 PM'",
      "A link to an .apk file instead of an official app store",
      "Sender ID looks close to but not exactly your utility board's name"
    ],
    steps: [
      "Never install an APK sent via SMS or WhatsApp link — only use official app stores.",
      "Check your bill directly on your utility's official app or website.",
      "If you already installed it, put your phone on airplane mode, then uninstall the app and inform your bank."
    ]
  },
  {
    id: "loan-app",
    name: "The Predatory Loan App",
    hi: "फर्जी लोन ऐप ठगी",
    emoji: "📱",
    channels: ["app", "sms"],
    actions: ["loan-app-install", "contact-access", "morphed-photo-threat"],
    keywords: ["loan", "morph", "harassment", "contacts"],
    story: "An unverified 'instant loan' app is installed outside the app store or with excessive permissions. It quietly copies your entire contact list. Even after the loan is repaid, recovery agents morph your photos into obscene images and threaten to send them to your family and contacts unless you pay more.",
    signs: [
      "Loan approved in minutes with no documents, from an unfamiliar app",
      "App asked for contacts, gallery or SMS permission to 'verify'",
      "Threats to share edited photos with your contacts"
    ],
    steps: [
      "Uninstall the app and revoke its permissions immediately in phone settings.",
      "Do not pay extortion demands — paying rarely stops the threats.",
      "Report to cybercrime.gov.in under 'Harassment' and inform close family in advance so a morphed image won't shock them.",
      "Check if the app was even RBI-registered — most predatory apps are not."
    ]
  },
  {
    id: "pig-butchering",
    name: "The Slow-Burn Crypto Romance",
    hi: "क्रिप्टो रोमांस ठगी",
    emoji: "💔",
    channels: ["whatsapp", "telegram"],
    actions: ["wrong-number-start", "romantic-chat", "crypto-investment"],
    keywords: ["crypto", "investment", "wrong-number", "trading"],
    story: "It starts innocently: 'Hi, is this the tour guide?' — a wrong number on WhatsApp. Over weeks, a warm, flirty friendship builds. Eventually your new 'friend' mentions a crypto trading platform that's making them great returns. Early withdrawals work — to build trust — before large deposits vanish along with the platform and the 'friend'.",
    signs: [
      "Relationship built slowly over weeks before any money is mentioned",
      "Eventually steers the conversation toward a crypto or trading app",
      "Platform shows impressive but withdrawal gets blocked once you invest big",
      "Refuses to ever video call or meet"
    ],
    steps: [
      "Be cautious of any 'wrong number' contact that turns into a long-term friendship.",
      "Never invest through a platform recommended by someone you've only met online.",
      "Verify any trading platform is SEBI-registered before depositing money.",
      "If you've invested, stop immediately and report at cybercrime.gov.in."
    ]
  },
  {
    id: "kbc-lottery",
    name: "The KBC Lottery Call",
    hi: "केबीसी लॉटरी ठगी",
    emoji: "🎰",
    channels: ["call", "sms", "whatsapp"],
    actions: ["prize-claim", "asked-money-now", "asked-otp"],
    keywords: ["lottery", "kbc", "prize", "winner", "lucky-draw"],
    story: "A call or message announces you've won a huge cash prize from KBC, a lucky draw, or a lottery you never entered — often 'verified' by a fake RBI or lottery-department letter. To 'release' the prize, you're asked to pay a processing fee, GST, or share an OTP. There is no prize; the fee is the entire scam.",
    signs: [
      "You've 'won' a contest you never entered",
      "Asked to pay a fee or tax before receiving the prize",
      "Asked to share an OTP to 'verify' your bank account",
      "Uses official-sounding names like RBI or the show's brand without real affiliation"
    ],
    steps: [
      "Real prizes never require you to pay money first — treat any such demand as a scam.",
      "Never share an OTP with anyone, no matter what they claim it's for.",
      "Block the number and do not click any link they send.",
      "Report the number on cybercrime.gov.in or via the Chakshu portal (sancharsaathi.gov.in)."
    ]
  },
  {
    id: "sim-kyc",
    name: "The SIM Block / KYC Update Call",
    hi: "सिम केवाईसी ठगी",
    emoji: "📶",
    channels: ["call", "sms"],
    actions: ["asked-otp", "threat-disconnect", "apk-download"],
    keywords: ["sim", "kyc", "otp", "disconnect", "telecom"],
    story: "A caller claiming to be from your telecom operator says your SIM will be deactivated in a few hours unless you 'update KYC' immediately — either by sharing an OTP, pressing a code on your keypad, or installing a 'verification' app. Pressing certain codes can actually forward your calls to the scammer, and sharing the OTP hands over control of banking apps linked to your number.",
    signs: [
      "Threat that your SIM will be blocked within hours",
      "Asked to share an OTP or press a specific code (like one starting with *401#)",
      "Asked to install a remote-access or 'KYC verification' app"
    ],
    steps: [
      "Telecom KYC is never done over a call asking for OTP — hang up.",
      "Never dial call-forwarding codes given to you by an unknown caller.",
      "Visit your telecom operator's store or official app if you're unsure about your SIM status.",
      "If you shared an OTP, immediately check your bank app for unauthorised logins and call your bank's helpline."
    ]
  }
];

// Question option pools shown in the triage flow
const CHANNELS = [
  { id: "call", label: "Phone call", hi: "फोन कॉल" },
  { id: "whatsapp", label: "WhatsApp", hi: "व्हाट्सऐप" },
  { id: "sms", label: "SMS", hi: "एसएमएस" },
  { id: "telegram", label: "Telegram", hi: "टेलीग्राम" },
  { id: "app", label: "An app I installed", hi: "इंस्टॉल किया ऐप" },
  { id: "social", label: "Social media / OLX", hi: "सोशल मीडिया / OLX" }
];

const ACTIONS = [
  { id: "video-call-police", label: "Put me on video call, claiming to be police/CBI/customs" },
  { id: "threatened-arrest", label: "Threatened arrest or legal action" },
  { id: "asked-money-now", label: "Demanded money urgently" },
  { id: "job-offer", label: "Offered an easy part-time job" },
  { id: "small-payout-first", label: "Paid me a small amount first" },
  { id: "asked-deposit", label: "Asked me to deposit money to 'unlock' more" },
  { id: "asked-scan-qr", label: "Asked me to scan a QR code to 'receive' money" },
  { id: "olx-buyer", label: "Claimed to be a buyer on OLX/Marketplace" },
  { id: "boss-request", label: "Pretended to be my boss/senior" },
  { id: "gift-card", label: "Asked me to buy gift cards" },
  { id: "urgent-transfer", label: "Asked for an urgent bank transfer" },
  { id: "apk-download", label: "Sent a link to download an app/APK" },
  { id: "threat-disconnect", label: "Threatened to disconnect my service" },
  { id: "loan-app-install", label: "I installed an instant loan app" },
  { id: "contact-access", label: "The app accessed my contacts/photos" },
  { id: "morphed-photo-threat", label: "Threatened with morphed/edited photos" },
  { id: "wrong-number-start", label: "Started as a 'wrong number' chat" },
  { id: "romantic-chat", label: "Built a friendly or romantic relationship" },
  { id: "crypto-investment", label: "Recommended a crypto/trading platform" },
  { id: "prize-claim", label: "Told me I won a prize or lottery" },
  { id: "asked-otp", label: "Asked me to share an OTP" }
];

const KEYWORDS = [
  "cbi", "customs", "digital-arrest", "parcel", "aadhaar", "police",
  "task", "telegram", "commission", "part-time",
  "qr-scan", "buyer", "olx", "upi",
  "boss", "director", "gift-card", "rtgs",
  "electricity", "challan", "apk", "kyc",
  "loan", "morph", "harassment",
  "crypto", "investment", "trading",
  "lottery", "kbc", "prize",
  "sim", "otp"
];

const KEYWORD_LABELS = {
  "cbi": "CBI", "customs": "Customs", "digital-arrest": "Digital Arrest", "parcel": "Parcel",
  "aadhaar": "Aadhaar", "police": "Police", "task": "Task", "telegram": "Telegram",
  "commission": "Commission", "part-time": "Part-time job", "qr-scan": "QR Scan", "buyer": "Buyer",
  "olx": "OLX", "upi": "UPI", "boss": "Boss/Director", "director": "Director",
  "gift-card": "Gift Card", "rtgs": "RTGS", "electricity": "Electricity Bill", "challan": "Challan",
  "apk": "APK File", "kyc": "KYC Update", "loan": "Loan App", "morph": "Morphed Photo",
  "harassment": "Harassment", "crypto": "Crypto", "investment": "Investment", "trading": "Trading",
  "lottery": "Lottery", "kbc": "KBC", "prize": "Prize/Winner", "sim": "SIM Card", "otp": "OTP"
};
