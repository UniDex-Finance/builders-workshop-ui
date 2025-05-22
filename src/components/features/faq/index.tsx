'use client'

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, ChevronDown, ChevronRight, Wallet, TrendingUp, CreditCard, Shield, HelpCircle, Zap, ChevronUp } from "lucide-react"
import { Header } from "../../shared/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card"
import { Input } from "../../ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../ui/collapsible"
import { Badge } from "../../ui/badge"

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  tags: string[]
  hasVisual?: boolean
  isPopular?: boolean
}

const faqData: FAQItem[] = [
  // Getting Started
  {
    id: "what-is-unidex",
    question: "What is UniDex Exchange?",
    answer: "UniDex is a decentralized trading aggregator that provides access to multiple DEXs and trading protocols from a single interface. We aggregate liquidity from various sources to give you the best possible trading experience with optimal pricing and minimal slippage.",
    category: "getting-started",
    tags: ["platform", "aggregator", "defi"],
    hasVisual: true,
    isPopular: true
  },
  {
    id: "how-to-get-started",
    question: "How do I get started trading on UniDex?",
    answer: "Getting started is simple:\n1. Connect your Web3 wallet (MetaMask, WalletConnect, etc.)\n2. Ensure you have the required base currency (ETH, USDC, etc.)\n3. Choose your trading pair\n4. Start with small amounts to familiarize yourself with the platform\n5. Explore our aggregated liquidity for the best prices",
    category: "getting-started",
    tags: ["tutorial", "wallet", "setup"],
    hasVisual: true,
    isPopular: true
  },
  {
    id: "supported-currencies",
    question: "What currencies can I trade with?",
    answer: "UniDex supports a wide range of cryptocurrencies including:\n• Major tokens: ETH, BTC, USDC, USDT\n• DeFi tokens: UNI, AAVE, COMP\n• Layer 2 tokens on supported networks\n• Popular memecoins and emerging tokens\n\nWe continuously add new tokens based on liquidity and community demand.",
    category: "getting-started",
    tags: ["currencies", "tokens", "supported"],
    hasVisual: true
  },

  // Deposits & Withdrawals
  {
    id: "how-to-deposit",
    question: "How do I deposit funds?",
    answer: "Depositing funds on UniDex:\n1. Connect your wallet\n2. Click 'Deposit' in the top navigation\n3. Select your token and network\n4. Enter the amount you want to deposit\n5. Confirm the transaction in your wallet\n6. Wait for blockchain confirmation\n\nYour funds will appear in your account balance once confirmed.",
    category: "deposits-withdrawals",
    tags: ["deposit", "wallet", "funds"],
    hasVisual: true,
    isPopular: true
  },
  {
    id: "how-to-withdraw",
    question: "How do I withdraw my funds?",
    answer: "To withdraw your funds:\n1. Go to your account balance\n2. Click 'Withdraw' next to the token you want to withdraw\n3. Enter the withdrawal amount\n4. Specify your destination address (or use connected wallet)\n5. Review withdrawal fees and processing time\n6. Confirm the transaction\n\nWithdrawals are processed on-chain and subject to network confirmation times.",
    category: "deposits-withdrawals",
    tags: ["withdraw", "funds", "wallet"],
    hasVisual: true,
    isPopular: true
  },
  {
    id: "withdrawal-fees",
    question: "What are the withdrawal fees?",
    answer: "Withdrawal fees on UniDex consist of:\n• Network gas fees (varies by blockchain congestion)\n• Protocol fees (typically 0.1-0.3%)\n• Bridge fees (for cross-chain withdrawals)\n\nFees are displayed before you confirm any withdrawal transaction. We always aim to minimize costs while ensuring security.",
    category: "deposits-withdrawals",
    tags: ["fees", "withdrawal", "costs"],
    hasVisual: false
  },

  // Trading
  {
    id: "place-market-order",
    question: "How do I place a market order?",
    answer: "Placing a market order:\n1. Select your trading pair (e.g., ETH/USDC)\n2. Choose 'Market' order type\n3. Enter the amount you want to buy/sell\n4. Review the estimated price and slippage\n5. Click 'Buy' or 'Sell'\n6. Confirm the transaction in your wallet\n\nMarket orders execute immediately at the best available price from our aggregated liquidity.",
    category: "trading",
    tags: ["market order", "trading", "execution"],
    hasVisual: true,
    isPopular: true
  },
  {
    id: "place-limit-order",
    question: "How do I place a limit order?",
    answer: "Setting up a limit order:\n1. Select your trading pair\n2. Choose 'Limit' order type\n3. Set your desired price\n4. Enter the quantity\n5. Choose order duration (GTC, IOC, etc.)\n6. Review and submit your order\n\nLimit orders will execute automatically when the market reaches your specified price.",
    category: "trading",
    tags: ["limit order", "trading", "price"],
    hasVisual: true
  },
  {
    id: "aggregator-benefits",
    question: "What is the UniDex aggregator and how does it benefit me?",
    answer: "The UniDex aggregator is our core technology that:\n• Scans multiple DEXs simultaneously for the best prices\n• Automatically routes your trades for optimal execution\n• Reduces slippage by splitting large orders across venues\n• Saves on gas fees through intelligent routing\n• Provides deeper liquidity than any single DEX\n\nThis means you get better prices and lower costs compared to trading on individual DEXs.",
    category: "trading",
    tags: ["aggregator", "benefits", "routing"],
    hasVisual: true,
    isPopular: true
  },

  // Security & Safety
  {
    id: "platform-security",
    question: "How secure is UniDex?",
    answer: "UniDex prioritizes security through:\n• Smart contract audits by leading security firms\n• Non-custodial architecture (you control your keys)\n• Multi-signature wallet protections\n• Regular security monitoring and updates\n• Bug bounty programs\n• Transparent on-chain operations\n\nWe never hold your funds - all trades execute directly from your wallet.",
    category: "security",
    tags: ["security", "audits", "safety"],
    hasVisual: true
  },
  {
    id: "wallet-safety",
    question: "How do I keep my wallet safe?",
    answer: "Best practices for wallet security:\n• Never share your private keys or seed phrase\n• Use hardware wallets for large amounts\n• Verify contract addresses before transactions\n• Enable transaction previews in your wallet\n• Regularly update your wallet software\n• Use official UniDex URLs only\n• Be cautious of phishing attempts",
    category: "security",
    tags: ["wallet", "safety", "best practices"],
    hasVisual: false
  }
]

const categories = [
  { 
    id: "all", 
    label: "All Topics", 
    icon: HelpCircle,
    tags: []
  },
  { 
    id: "getting-started", 
    label: "Getting Started", 
    icon: Zap,
    tags: [
      { id: "platform", label: "Platform Basics" },
      { id: "setup", label: "Account Setup" },
      { id: "currencies", label: "Supported Assets" }
    ]
  },
  { 
    id: "deposits-withdrawals", 
    label: "Funds Management", 
    icon: Wallet,
    tags: [
      { id: "deposit", label: "Deposits" },
      { id: "withdraw", label: "Withdrawals" },
      { id: "fees", label: "Fees & Costs" }
    ]
  },
  { 
    id: "trading", 
    label: "Trading", 
    icon: TrendingUp,
    tags: [
      { id: "market order", label: "Market Orders" },
      { id: "limit order", label: "Limit Orders" },
      { id: "aggregator", label: "Aggregator Benefits" }
    ]
  },
  { 
    id: "security", 
    label: "Security", 
    icon: Shield,
    tags: [
      { id: "security", label: "Platform Security" },
      { id: "wallet", label: "Wallet Safety" },
      { id: "best practices", label: "Best Practices" }
    ]
  }
]

export function FAQDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [openItems, setOpenItems] = useState<string[]>([])
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["getting-started"])

  const filteredFAQs = faqData.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = activeCategory === "all" || item.category === activeCategory
    const matchesTag = !activeTag || item.tags.some(tag => tag.toLowerCase().includes(activeTag.toLowerCase()))
    
    return matchesSearch && matchesCategory && matchesTag
  })

  const toggleItem = (itemId: string) => {
    setOpenItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const selectCategory = (categoryId: string) => {
    setActiveCategory(categoryId)
    setActiveTag(null)
    if (categoryId !== "all" && !expandedCategories.includes(categoryId)) {
      setExpandedCategories(prev => [...prev, categoryId])
    }
  }

  const selectTag = (categoryId: string, tagId: string) => {
    setActiveCategory(categoryId)
    setActiveTag(tagId)
  }

  const getActiveTitle = () => {
    if (activeTag) {
      const category = categories.find(cat => cat.id === activeCategory)
      const tag = category?.tags.find(t => t.id === activeTag)
      return tag ? `${category?.label} → ${tag.label}` : "Help Center"
    }
    const category = categories.find(cat => cat.id === activeCategory)
    return category?.label || "Help Center"
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex flex-1 bg-background text-foreground">
        {/* Left Sidebar Navigation */}
        <div className="w-80 bg-card/30 border-r border-border/50 flex flex-col">
          {/* Search Bar */}
          <div className="p-6 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search help articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 text-sm bg-background/50"
              />
            </div>
          </div>

          {/* Navigation Categories */}
          <div className="flex-1 p-4 space-y-2 overflow-y-auto">
            {categories.map((category) => {
              const Icon = category.icon
              const isExpanded = expandedCategories.includes(category.id)
              const isActive = activeCategory === category.id && !activeTag
              
              return (
                <div key={category.id}>
                  <div className="flex items-center">
                    <button
                      onClick={() => selectCategory(category.id)}
                      className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive 
                          ? 'bg-primary/20 text-primary border border-primary/30' 
                          : 'hover:bg-card/50 text-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{category.label}</span>
                    </button>
                    
                    {category.tags.length > 0 && (
                      <button
                        onClick={() => toggleCategory(category.id)}
                        className="p-1 ml-1 rounded-md hover:bg-card/50 transition-colors"
                      >
                        <ChevronDown 
                          className={`w-3 h-3 text-muted-foreground transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`} 
                        />
                      </button>
                    )}
                  </div>

                  {/* Sub-tags */}
                  {category.tags.length > 0 && (
                    <Collapsible open={isExpanded}>
                      <CollapsibleContent>
                        <div className="ml-7 mt-1 space-y-1">
                          {category.tags.map((tag) => {
                            const isTagActive = activeCategory === category.id && activeTag === tag.id
                            
                            return (
                              <button
                                key={tag.id}
                                onClick={() => selectTag(category.id, tag.id)}
                                className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-all ${
                                  isTagActive
                                    ? 'bg-primary/15 text-primary border border-primary/20'
                                    : 'hover:bg-card/40 text-muted-foreground hover:text-foreground'
                                }`}
                              >
                                {tag.label}
                              </button>
                            )
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              )
            })}
          </div>

          {/* Popular Badge */}
          <div className="p-4 border-t border-border/50">
            <div className="text-xs text-muted-foreground mb-2">Quick Access</div>
            <div className="flex flex-wrap gap-1">
              {faqData.filter(item => item.isPopular).slice(0, 3).map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className="text-xs px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                >
                  {item.question.split(' ').slice(0, 3).join(' ')}...
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-8 py-8">
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {getActiveTitle()}
                </h1>
                <p className="text-muted-foreground">
                  {activeTag 
                    ? `Focused help for ${categories.find(c => c.id === activeCategory)?.tags.find(t => t.id === activeTag)?.label?.toLowerCase()}`
                    : activeCategory === "all" 
                      ? "Everything you need to know about trading on UniDex"
                      : `Learn about ${categories.find(c => c.id === activeCategory)?.label?.toLowerCase()}`
                  }
                </p>
              </div>
            </motion.div>

            {/* Popular Questions Banner (only show when viewing all) */}
            {activeCategory === "all" && !searchTerm && !activeTag && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
              >
                <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-400" />
                      Popular Questions
                    </CardTitle>
                    <CardDescription>
                      The most frequently asked questions to get you started quickly
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {faqData.filter(item => item.isPopular).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => toggleItem(item.id)}
                          className="text-left p-3 rounded-lg bg-card/50 hover:bg-card/80 transition-all border border-border/30 hover:border-border/50"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{item.question}</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* FAQ Content */}
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {filteredFAQs.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Card className="p-12 text-center bg-card/30">
                      <div className="space-y-4">
                        <div className="text-6xl opacity-20">🔍</div>
                        <h3 className="text-xl font-semibold">No results found</h3>
                        <p className="text-muted-foreground">
                          Try adjusting your search terms or browse our categories on the left.
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid gap-4"
                  >
                    {filteredFAQs.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="bg-card/50 border-border/50 hover:bg-card/80 transition-all">
                          <Collapsible 
                            open={openItems.includes(item.id)}
                            onOpenChange={() => toggleItem(item.id)}
                          >
                            <CollapsibleTrigger className="w-full">
                              <CardHeader className="text-left hover:bg-card/30 transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-start gap-4">
                                    <div className="space-y-2 flex-1">
                                      <div className="flex items-center gap-2">
                                        <CardTitle className="text-lg">{item.question}</CardTitle>
                                        {item.isPopular && (
                                          <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-400">
                                            Popular
                                          </Badge>
                                        )}
                                        {item.hasVisual && (
                                          <Badge variant="outline" className="text-xs">
                                            📸 Visual Guide
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {item.tags.map(tag => (
                                          <Badge key={tag} variant="outline" className="text-xs">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <ChevronDown 
                                    className={`w-5 h-5 text-muted-foreground transition-transform ${
                                      openItems.includes(item.id) ? 'rotate-180' : ''
                                    }`} 
                                  />
                                </div>
                              </CardHeader>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent>
                              <CardContent className="pt-0">
                                {item.hasVisual && (
                                  <div className="mb-6 p-6 bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-lg border border-border/30">
                                    <div className="flex items-center justify-center h-48 bg-slate-800/50 rounded-lg border-2 border-dashed border-border/30">
                                      <div className="text-center space-y-2">
                                        <div className="text-4xl opacity-50">🎥</div>
                                        <p className="text-sm text-muted-foreground">
                                          Interactive guide or screenshot will go here
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="prose prose-invert max-w-none">
                                  <div className="whitespace-pre-line text-foreground leading-relaxed">
                                    {item.answer}
                                  </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-border/30">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                      Was this helpful?
                                    </p>
                                    <div className="flex gap-2">
                                      <button className="text-xs px-3 py-1 rounded-md bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">
                                        👍 Yes
                                      </button>
                                      <button className="text-xs px-3 py-1 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                                        👎 No
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          </Collapsible>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Contact Section */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-16"
            >
              <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-500/20">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Still need help?</CardTitle>
                  <CardDescription className="text-lg">
                    Our community and support team are here to help you succeed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto">
                        <span className="text-2xl">💬</span>
                      </div>
                      <h3 className="font-semibold">Discord Community</h3>
                      <p className="text-sm text-muted-foreground">Join our active community for real-time help</p>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto">
                        <span className="text-2xl">📧</span>
                      </div>
                      <h3 className="font-semibold">Email Support</h3>
                      <p className="text-sm text-muted-foreground">Get personalized help from our team</p>
                    </div>
                    <div className="text-center space-y-2">
                      <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto">
                        <span className="text-2xl">📚</span>
                      </div>
                      <h3 className="font-semibold">Documentation</h3>
                      <p className="text-sm text-muted-foreground">Detailed technical guides and API docs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
} 