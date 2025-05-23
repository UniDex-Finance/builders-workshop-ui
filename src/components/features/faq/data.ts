// All FAQ data and categories
import {
  Wallet,
  TrendingUp,
  Shield,
  HelpCircle,
  Zap,
} from "lucide-react";
import { FAQItem, Category } from "./types";

export const faqData: FAQItem[] = [
  // Getting Started
  {
    id: "what-is-unidex",
    question: "What is UniDex Exchange?",
    answer:
      "UniDex is a decentralized perp & spot aggregator that provides access to multiple DEXs and trading protocols from a single interface. We aggregate liquidity from various sources to give you the best possible trading experience with optimal pricing and minimal slippage.",
    category: "getting-started",
    tags: ["platform", "aggregator", "defi"],
    hasVisual: true,
    isPopular: true,
    visualAssets: [
      {
        type: 'image',
        src: '/static/images/faq/home-featured-image.png',
        alt: 'UniDex Exchange platform overview'
      }
    ]
  },
  {
    id: "how-to-get-started",
    question: "How do I get started trading on UniDex?",
    answer:
      "Getting started on UniDex is straightforward:\n1. [link:/connect]Head to the /connect page[/link] for a guided onboarding experience.\n2. Connect your preferred Web3 wallet (e.g., MetaMask, Rabby).\n3. Sign the prompted transaction to generate and access your trading account.\n4. Deposit funds into your trading account to prepare for trading.\n5. Execute your first trade or swap using your deposited funds.",
    category: "getting-started",
    tags: ["tutorial", "wallet", "setup", "onboarding"],
    hasVisual: true,
    isPopular: true,
    visualAssets: [
      {
        type: 'gif',
        src: '/static/images/faq/gettingstarted.gif',
        alt: 'Getting started with UniDex step-by-step guide'
      }
    ]
  },
  {
    id: "supported-currencies",
    question: "What currencies can I trade with?",
    answer: "For perpetual trading, UniDex currently supports USDC and USDC-based lending tokens (e.g., aUSDC). Lending tokens are treated as 1 USDC for trading purposes because they can be converted in the same transaction. \nFor swaps, you can trade any ERC20 token to any other ERC20 token.",
    category: "getting-started",
    tags: ["currencies", "tokens", "supported"],
    hasVisual: false,
  },

  // Deposits & Withdrawals
  {
    id: "how-to-deposit",
    question: "How do I deposit funds?",
    answer:
      "Depositing funds on UniDex:\n1. Connect your wallet\n2. Click 'Deposit' in the top navigation\n3. Select your token and network\n4. Enter the amount you want to deposit\n5. Confirm the transaction in your wallet\n6. Wait for blockchain confirmation\n\nYour funds will appear in your account balance once confirmed.",
    category: "deposits-withdrawals",
    tags: ["deposit", "wallet", "funds"],
    hasVisual: true,
    isPopular: true,
    visualAssets: [
      {
        type: 'gif',
        src: '/static/images/faq/deposit.gif',
        alt: 'How to deposit funds on UniDex'
      }
    ]
  },
  {
    id: "how-to-withdraw",
    question: "How do I withdraw my funds?",
    answer: "To withdraw your funds:\n1. Click the 'Withdraw' button at the top of the page.\n2. From the account summary shown, select the 'Withdraw' option.\n3. Choose which wallet you are withdrawing from (either a margin wallet for a specific protocol or your main trading account).\n4. Enter the amount you wish to withdraw.\n5. Click the 'Withdraw' button to confirm the transaction.",
    category: "deposits-withdrawals",
    tags: ["withdraw", "funds", "wallet"],
    hasVisual: true,
    isPopular: true,
    visualAssets: [
      {
        type: 'gif',
        src: '/static/images/faq/withdraw.gif',
        alt: 'How to withdraw funds from UniDex'
      }
    ]
  },
  {
    id: "withdrawal-fees",
    question: "What are the withdrawal fees?",
    answer: "UniDex does not charge withdrawal fees. The only cost associated with withdrawing funds is the network gas fee, which UniDex sponsors for you.",
    category: "deposits-withdrawals",
    tags: ["fees", "withdrawal", "costs"],
    hasVisual: false,
  },

  // Trading
  {
    id: "place-market-order",
    question: "How do I place a market order?",
    answer: "To place a market order:\n1. Ensure you have sufficient funds deposited.\n2. Select the trading pair you want in the top left corner.\n3. Set your desired leverage amount.\n4. Enter either the 'Size' (your total exposure after leverage) or the 'Margin' (the amount of USDC collateralizing the trade, which is the amount lost upon liquidation).\n5. Click the TP/SL? icon if you wish to add Take Profit or Stop Loss orders.\n6. Click either 'Place Market Long' or 'Place Market Short'. Your trade will be settled within a few seconds.",
    category: "trading",
    tags: ["market order", "trading", "execution"],
    hasVisual: true,
    isPopular: true,
    visualAssets: [
      {
        type: 'gif',
        src: '/static/images/faq/marketorder.gif',
        alt: 'How to place a market order on UniDex'
      }
    ]
  },
  {
    id: "place-limit-order",
    question: "How do I place a limit order?",
    answer: "To place a limit order:\n1. Ensure you have sufficient funds deposited.\n2. Select the trading pair you want in the top left corner.\n3. Click the order type box and select 'Limit'.\n4. The market price box will change to 'Limit Price'. Enter your desired execution price here.\n5. Set your desired leverage amount.\n6. Enter either the 'Size' (your total exposure after leverage) or the 'Margin' (the amount of USDC collateralizing the trade, which is the amount lost upon liquidation).\n7. Click the TP/SL? icon if you wish to add Take Profit or Stop Loss orders.\n8. Click either 'Place Limit Long' or 'Place Limit Short'. Your order will be placed and will execute if the market reaches your specified limit price.",
    category: "trading",
    tags: ["limit order", "trading", "price"],
    hasVisual: true,
    visualAssets: [
      {
        type: 'gif',
        src: '/static/images/faq/limitorder.gif',
        alt: 'How to place a limit order on UniDex'
      }
    ]
  },
  {
    id: "aggregator-benefits",
    question: "What is the UniDex aggregator and how does it benefit me?",
    answer:
      "The UniDex aggregator is our core technology that:\n• Scans multiple DEXs simultaneously for the best prices\n• Automatically routes your trades for optimal execution\n• Reduces slippage by splitting large orders across venues\n• Saves on gas fees through intelligent routing\n• Provides deeper liquidity than any single DEX\n\nThis means you get better prices and lower costs compared to trading on individual DEXs.",
    category: "trading",
    tags: ["aggregator", "benefits", "routing"],
    hasVisual: true,
    isPopular: true,
  },

  // Security & Safety
  {
    id: "platform-security",
    question: "How secure is UniDex?",
    answer: "UniDex prioritizes your security with a non-custodial architecture, meaning you always control your funds. Our native pools are audited by third parties, and our unique aggregation method uses an in-house SDK, avoiding risks from external contracts. We only aggregate with carefully vetted protocols and limit token approvals to the exact trade amount for added safety. We also employ multi-sig wallets, regular monitoring, and bug bounties.",
    category: "security",
    tags: ["security", "audits", "safety", "non-custodial"],
    hasVisual: false,
}
,
];

export const categories: Category[] = [
  {
    id: "all",
    label: "All Topics",
    icon: HelpCircle,
    tags: [],
  },
  {
    id: "getting-started",
    label: "Getting Started",
    icon: Zap,
    tags: [
      { id: "platform", label: "Platform Basics" },
      { id: "setup", label: "Account Setup" },
      { id: "currencies", label: "Supported Assets" },
    ],
  },
  {
    id: "deposits-withdrawals",
    label: "Funds Management",
    icon: Wallet,
    tags: [
      { id: "deposit", label: "Deposits" },
      { id: "withdraw", label: "Withdrawals" },
      { id: "fees", label: "Fees & Costs" },
    ],
  },
  {
    id: "trading",
    label: "Trading",
    icon: TrendingUp,
    tags: [
      { id: "market order", label: "Market Orders" },
      { id: "limit order", label: "Limit Orders" },
      { id: "aggregator", label: "Aggregator Benefits" },
    ],
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    tags: [
      { id: "security", label: "Platform Security" },
      { id: "wallet", label: "Wallet Safety" },
      { id: "best practices", label: "Best Practices" },
    ],
  },
]; 