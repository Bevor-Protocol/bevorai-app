import { TerminalStep } from "./enums";

export const stepText = {
  [TerminalStep.INITIAL]: "audit method",
  [TerminalStep.INPUT_ADDRESS]: "audit address",
  [TerminalStep.INPUT_PASTE]: "paste audit",
  [TerminalStep.INPUT_UPLOAD]: "upload contract file",
  [TerminalStep.INPUT_FOLDER]: "upload contracts folder",
  [TerminalStep.AUDIT_TYPE]: "audit type",
  [TerminalStep.RESULTS]: "results",
  [TerminalStep.INPUT_AGENT]: "Input Agent",
  [TerminalStep.SCOPE_DEFINITION]: "scope",
};

export const iconSizeMapper: Record<string, Record<string, string>> = {
  xs: {
    desktop: "20px",
    mobile: "20px",
  },
  sm: {
    desktop: "25px",
    mobile: "25px",
  },
  md: {
    desktop: "30px",
    mobile: "25px",
  },
  lg: {
    desktop: "75px",
    mobile: "60px",
  },
  xl: {
    desktop: "90px",
    mobile: "75px",
  },
  xxl: {
    desktop: "120px",
    mobile: "90px",
  },
};

export const ChainPresets: Record<number, string> = {
  // Base
  8453: "/base.svg",
  // Sepolia
  11155111: "/base.svg",
  // Localhost
  1337: "/unknown.svg",
  // anvil
  31337: "/unknown.svg",
  // Default
  99999: "/unknown.svg",
};

export const NetworkToNameMapper = {
  eth: "ETH Mainnet",
  bsc: "Binance Smart Chain",
  polygon: "Polygon",
  base: "Base",
  eth_sepolia: "ETH Sepolia testnet",
  bsc_test: "Binance testnet",
  polygon_amoy: "Polygon testnet",
  base_sepolia: "Base Sepolia testnet",
};

export const BlockExplorerMapper = {
  eth: "https://etherscan.io",
  bsc: "https://bscscan.com",
  polygon: "https://polygonscan.com",
  base: "https://basescan.org",
  eth_sepolia: "https://sepolia.etherscan.io",
  bsc_test: "https://testnet.bscscan.com",
  polygon_amoy: "https://amoy.polygonscan.com",
  base_sepolia: "https://sepolia.basescan.org",
};

// CSS custom properties for use with Tailwind
export const severityColorMap = {
  critical: "var(--color-critical)",
  high: "var(--color-high)",
  medium: "var(--color-medium)",
  low: "var(--color-low)",
};
