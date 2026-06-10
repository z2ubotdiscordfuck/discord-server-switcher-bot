export interface MarketplacePreset {
  name: string;
  color: number;
  trustpilotUrl: string;
  customerServiceUrl: string;
  serverName: string;
}

export const PRESETS: Record<string, MarketplacePreset> = {
  playerauctions: {
    name: "PlayerAuctions",
    color: 0x2563eb,
    trustpilotUrl: "https://www.trustpilot.com/review/playerauctions.com",
    customerServiceUrl: "https://support.playerauctions.com/hc/en-us",
    serverName: "PlayerAuctions Marketplace",
  },
  g2g: {
    name: "G2G",
    color: 0x16a34a,
    trustpilotUrl: "https://www.trustpilot.com/review/www.g2g.com",
    customerServiceUrl: "https://support.g2g.com/en/support/solutions",
    serverName: "G2G Marketplace",
  },
  eldorado: {
    name: "Eldorado",
    color: 0xd97706,
    trustpilotUrl: "https://www.trustpilot.com/review/eldorado.gg",
    customerServiceUrl: "https://www.eldorado.gg/contact-us",
    serverName: "Eldorado Marketplace",
  },
  gameboost: {
    name: "GameBoost",
    color: 0x7c3aed,
    trustpilotUrl: "https://www.trustpilot.com/review/gameboost.com",
    customerServiceUrl: "https://gameboost.com/help",
    serverName: "GameBoost Marketplace",
  },
  brxxks: {
    name: "BRXXKS",
    color: 0xdc2626,
    trustpilotUrl: "",
    customerServiceUrl: "",
    serverName: "BRXXKS Marketplace",
  },
  dan7eh: {
    name: "Dan7eh",
    color: 0x0891b2,
    trustpilotUrl: "",
    customerServiceUrl: "",
    serverName: "Dan7eh Marketplace",
  },
};

export const CHANNEL_IDS = [
  "1480663792634429582",
  "1513910363651834008",
  "1506332518046236732",
  "1480663795478036510",
  "1502296974882504716",
  "1506334143544430672",
  "1506334264096981064",
  "1480663797545828384",
  "1507279278922793082",
  "1502341530369658880",
  "1502297109213351966",
  "1513910976355766323",
];

export const CHANNEL_NAMES: Record<string, string> = {
  "1480663792634429582": "rules",
  "1513910363651834008": "reaction-roles",
  "1506332518046236732": "scam-awareness",
  "1480663795478036510": "about",
  "1502296974882504716": "trustpilot",
  "1506334143544430672": "faq",
  "1506334264096981064": "support",
  "1480663797545828384": "tos",
  "1507279278922793082": "middleman-tos",
  "1502341530369658880": "automm",
  "1502297109213351966": "marketplace-tos",
  "1513910976355766323": "verification",
};

export const REACTION_ROLE_IDS = [
  "1481037005554192565",
  "1506486376789704805",
  "1506486466274922546",
];

export const ADMIN_USER_ID = "imechoplay";
