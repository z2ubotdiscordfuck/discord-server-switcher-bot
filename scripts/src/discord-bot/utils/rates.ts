const COINGECKO_IDS: Record<string, string> = {
  btc: "bitcoin",
  eth: "ethereum",
  ltc: "litecoin",
  sol: "solana",
  usdt_erc20: "tether",
  usdc_erc20: "usd-coin",
  usdt_sol: "tether",
  usdc_sol: "usd-coin",
};

const STABLECOINS = new Set(["usdt_erc20", "usdc_erc20", "usdt_sol", "usdc_sol"]);

export interface RateResult {
  rateUsd: number;
  cryptoAmount: string;
  displayRate: string;
}

export async function fetchCryptoRate(currency: string, usdAmount: number): Promise<RateResult> {
  if (currency === "paypal") {
    return { rateUsd: 1, cryptoAmount: usdAmount.toFixed(2), displayRate: "1 USD = 1 USD (PayPal)" };
  }

  if (STABLECOINS.has(currency)) {
    return {
      rateUsd: 1,
      cryptoAmount: usdAmount.toFixed(2),
      displayRate: `1 ${currency.split("_")[0].toUpperCase()} ≈ $1.00 USD`,
    };
  }

  const coinId = COINGECKO_IDS[currency];
  if (!coinId) return { rateUsd: 0, cryptoAmount: "N/A", displayRate: "Rate unavailable" };

  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as Record<string, { usd: number }>;
    const rateUsd = data[coinId]?.usd ?? 0;
    if (!rateUsd) throw new Error("Rate not found");

    const cryptoAmount = (usdAmount / rateUsd).toFixed(8).replace(/\.?0+$/, "");
    const displayRate = `1 ${currency.toUpperCase().split("_")[0]} = $${rateUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;

    return { rateUsd, cryptoAmount, displayRate };
  } catch {
    return { rateUsd: 0, cryptoAmount: "N/A", displayRate: "Rate fetch failed — contact staff" };
  }
}

export function getCurrencyLabel(currency: string): string {
  const labels: Record<string, string> = {
    btc: "BTC",
    paypal: "PayPal (PP)",
    eth: "ETH",
    ltc: "LTC",
    sol: "SOL",
    usdt_erc20: "USDT (ERC-20)",
    usdc_erc20: "USDC (ERC-20)",
    usdt_sol: "USDT (SOL)",
    usdc_sol: "USDC (SOL)",
  };
  return labels[currency] ?? currency.toUpperCase();
}

export function getCurrencyEmoji(currency: string): string {
  const emojis: Record<string, string> = {
    btc: "<:echobtc:1513916482294120640>",
    paypal: "<:echpaypal:1513916484802445332>",
    eth: "<:echoeth:1513916818962649108>",
    ltc: "<:echoltc:1513916480427786311>",
    sol: "<:echosol:1513916493803552798>",
    usdt_erc20: "<:echousdt:1513916491328655410>",
    usdc_erc20: "<:echousdc:1513916486627102976>",
    usdt_sol: "<:echousdt:1513916491328655410>",
    usdc_sol: "<:echousdc:1513916486627102976>",
  };
  return emojis[currency] ?? "";
}

export function getBlockchainName(currency: string): string {
  const chains: Record<string, string> = {
    btc: "Bitcoin Network",
    eth: "Ethereum Network",
    ltc: "Litecoin Network",
    sol: "Solana Network",
    usdt_erc20: "Ethereum Network (ERC-20)",
    usdc_erc20: "Ethereum Network (ERC-20)",
    usdt_sol: "Solana Network (SPL)",
    usdc_sol: "Solana Network (SPL)",
    paypal: "PayPal",
  };
  return chains[currency] ?? "Blockchain Network";
}
