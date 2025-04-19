import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import { useTheme } from "next-themes";
import { Button } from "../ui/button";
import Link from "next/link";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem } from "@nextui-org/react";
import { Menu, ChevronDown, Wallet, Coins, DollarSign, PiggyBank, Users2, MessageCircle, Send, Twitter, X, Settings, UnfoldHorizontal, BarChart2  } from "lucide-react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { 
  faQuestionCircle, 
  faBook, 
  faComments, 
  faBug, 
  faChartLine 
} from '@fortawesome/free-solid-svg-icons';
import { AccountSummary } from "../features/trading/account/AccountSummary";
import { getUsersnapApi } from "../../lib/usersnap";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SettingsModal } from "./SettingsModal";
import { useState } from "react";

export function Header() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { theme, setTheme } = useTheme()

  return (
    <header className="flex items-center justify-between px-4 mb-1 md:px-6 h-[50px]">
      <div className="flex items-center space-x-3 h-full translate-y-[2px]">
        <Link href="/" className="hover:opacity-80 flex items-center h-full">
          {/* Desktop Logo */}
          <div className="hidden md:flex items-center">
            <Image
              src={theme === 'light' ? '/static/images/logo-large-dark.png' : '/static/images/logo-large.png'}
              alt="UniDex Logo"
              width={90}
              height={28}
              priority
              className="object-contain"
            />
          </div>
          {/* Mobile Logo */}
          <div className="flex md:hidden items-center">
            <Image
              src={theme === 'light' ? '/static/images/logo-small-dark.png' : '/static/images/logo-small.png'}
              alt="UniDex Logo"
              width={28}
              height={28}
              priority
              className="object-contain"
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="h-full hidden space-x-3 md:flex items-center">
          <Link href="/" className="flex items-center h-full">
            <Button variant="ghost" size="sm" className="text-sm font-normal h-8 flex items-center justify-center">Trade</Button>
          </Link>
          <Link href="/leaderboard" className="flex items-center h-full">
            <Button variant="ghost" size="sm" className="text-sm font-normal h-8 flex items-center justify-center">Leaderboard</Button>
          </Link>
          <Dropdown>
            <DropdownTrigger>
              <Button variant="ghost" size="sm" className="text-sm font-normal gap-1 h-8 flex items-center justify-center">
                Earn <ChevronDown size={14} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Earn options"
              className="w-[240px]"
              itemClasses={{
                base: "gap-4",
                title: "text-sm",
                description: "text-xs text-default-400",
              }}
            >
              <DropdownSection title="Earn with MOLTEN" showDivider>
                <DropdownItem
                  key="molten-staking"
                  description="Stake MOLTEN for rewards"
                  startContent={<Coins className="w-4 h-4" />}
                  onClick={() => (window.location.href = "/staking")}
                >
                  Stake MOLTEN
                </DropdownItem>
              </DropdownSection>

              <DropdownSection title="Earn with USD.m" showDivider>
                <DropdownItem
                  key="mint-usdm"
                  description="Market make for traders and earn yield"
                  startContent={<DollarSign className="w-4 h-4" />}
                  onClick={() => (window.location.href = "/usdm")}
                >
                  Mint USD.m
                </DropdownItem>
                <DropdownItem
                  key="usdm-staking"
                  description="Stake USD.m for rewards"
                  startContent={<PiggyBank className="w-4 h-4" />}
                  onClick={() => (window.location.href = "/usdm-staking")}
                >
                  Stake USD.m
                </DropdownItem>
              </DropdownSection>

              <DropdownSection title="Earn by Referring">
                <DropdownItem
                  key="referrals"
                  description="Onboard traders, earn in real-time"
                  startContent={<Users2 className="w-4 h-4" />}
                  onClick={() => (window.location.href = "/referrals")}
                >
                  Refer Traders
                </DropdownItem>
              </DropdownSection>
            </DropdownMenu>
          </Dropdown>
          <Dropdown>
            <DropdownTrigger>
              <Button variant="ghost" size="sm" className="text-sm font-normal gap-1 h-8 flex items-center justify-center">
                Trade Tools <ChevronDown size={14} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Trade tools options"
              className="w-[240px]"
              itemClasses={{
                base: "gap-4",
                title: "text-sm",
                description: "text-xs text-default-400",
              }}
            >
              <DropdownItem
                key="funding-arb"
                description="Explore funding rate arbitrage opportunities"
                startContent={<BarChart2 className="w-4 h-4" />}
                onClick={() => (window.location.href = "/funding-arb")}
              >
                Funding Arbitrage
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <Dropdown>
            <DropdownTrigger>
              <Button variant="ghost" size="sm" className="text-sm font-normal gap-1 h-8 flex items-center justify-center">
                More <ChevronDown size={14} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="More actions"
              className="w-[240px]"
              itemClasses={{
                base: "gap-4",
                title: "text-sm",
                description: "text-xs text-default-400",
              }}
            >
              <DropdownItem
                key="help"
                description="Get help and support"
                startContent={<FontAwesomeIcon icon={faQuestionCircle} />}
                onClick={() =>
                  window.open("https://discord.gg/W2TByeuD7R", "_blank")
                }
              >
                Help & Support
              </DropdownItem>
              <DropdownItem
                key="documentation"
                description="Read the documentation"
                startContent={<FontAwesomeIcon icon={faBook} />}
                onClick={() =>
                  window.open(
                    "https://docs.unidex.exchange/introduction",
                    "_blank"
                  )
                }
              >
                Documentation
              </DropdownItem>
              <DropdownItem
                key="feedback"
                description="Provide your feedback"
                startContent={<FontAwesomeIcon icon={faComments} />}
                onClick={() => {
                  const api = getUsersnapApi();
                  if (api) {
                    api.logEvent("feedback-button-clicked");
                  }
                }}
              >
                Give Feedback
              </DropdownItem>
              <DropdownItem
                key="bug-bounty"
                description="Participate in our bug bounty program"
                startContent={<FontAwesomeIcon icon={faBug} />}
                onClick={() => {
                  const api = getUsersnapApi();
                  if (api) {
                    api.logEvent("survey-button-clicked");
                  }
                }}
              >
                Bug Bounty
              </DropdownItem>
              <DropdownItem
                key="stats"
                description="View the latest stats"
                startContent={<FontAwesomeIcon icon={faChartLine} />}
                onClick={() =>
                  window.open(
                    "https://dune.com/supakawaiidesu/unidex-molten-stats",
                    "_blank"
                  )
                }
              >
                Stats
              </DropdownItem>
              <DropdownItem
                key="bridge"
                description="Bridge your MOLTEN to other chains"
                startContent={<UnfoldHorizontal className="w-4 h-4" />}
                onClick={() => (window.location.href = "/bridge")}
              >
                Bridge
              </DropdownItem>
              <DropdownSection title="Social Links" showDivider>
                 <DropdownItem
                   key="discord"
                   description="DAO, traders, and memes"
                   startContent={<MessageCircle className="w-4 h-4" />}
                   onClick={() =>
                     window.open("https://discord.gg/W2TByeuD7R", "_blank")
                   }
                 >
                   Discord
                 </DropdownItem>
                 <DropdownItem
                   key="telegram"
                   description="Chill & good vibes only"
                   startContent={<Send className="w-4 h-4" />}
                   onClick={() =>
                     window.open("https://t.me/unidexfinance", "_blank")
                   }
                 >
                   Telegram
                 </DropdownItem>
                 <DropdownItem
                   key="twitter"
                   description="Stay up to date on news"
                   startContent={<Twitter className="w-4 h-4" />}
                   onClick={() =>
                     window.open("https://x.com/UniDexFinance", "_blank")
                   }
                 >
                   Twitter
                 </DropdownItem>
              </DropdownSection>
            </DropdownMenu>
          </Dropdown>
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center h-full">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex items-center justify-center">
                <Menu size={19} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <div className="flex flex-col h-full overflow-y-auto">
                {/* Logo Section */}
                <SheetHeader className="p-4 border-b border-divider">
                  <Link href="/">
                    <Image
                      src="/static/images/logo-large.png"
                      alt="UniDex Logo"
                      width={90}
                      height={28}
                      priority
                      className="object-contain"
                    />
                  </Link>
                </SheetHeader>

                {/* Navigation Items */}
                <div className="flex-1 p-2">
                  <div className="space-y-2">
                    {/* Trade */}
                    <Button
                      variant="ghost"
                      className="justify-start w-full text-sm h-8 bg-muted/50 hover:bg-muted/70"
                      onClick={() => (window.location.href = "/")}
                    >
                      Trade
                    </Button>

                    {/* Leaderboard */}
                    <Button
                      variant="ghost"
                      className="justify-start w-full text-sm h-8 bg-muted/50 hover:bg-muted/70"
                      onClick={() => (window.location.href = "/leaderboard")}
                    >
                      Leaderboard
                    </Button>

                    {/* Earn Section */}
                    <div className="space-y-1">
                      <div className="px-3 py-2 text-xs font-semibold text-foreground-500">
                        Earn with MOLTEN
                      </div>
                      <Button
                        variant="ghost"
                        className="justify-start w-full gap-2 text-sm h-8 bg-muted/50 hover:bg-muted/70"
                        onClick={() => (window.location.href = "/staking")}
                      >
                        <Coins className="w-4 h-4" />
                        Stake MOLTEN
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <div className="px-3 py-2 text-xs font-semibold text-foreground-500">
                        Earn with USD.m
                      </div>
                      <Button
                        variant="ghost"
                        className="justify-start w-full gap-2 text-sm h-8 bg-muted/50 hover:bg-muted/70"
                        onClick={() => (window.location.href = "/usdm")}
                      >
                        <DollarSign className="w-4 h-4" />
                        Mint USD.m
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start w-full gap-2 text-sm h-8 bg-muted/50 hover:bg-muted/70"
                        onClick={() => (window.location.href = "/usdm-staking")}
                      >
                        <PiggyBank className="w-4 h-4" />
                        Stake USD.m
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <div className="px-3 py-2 text-xs font-semibold text-foreground-500">
                        Earn by Referring
                      </div>
                      <Button
                        variant="ghost"
                        className="justify-start w-full gap-2 text-sm h-8 bg-muted/50 hover:bg-muted/70"
                        onClick={() => (window.location.href = "/referrals")}
                      >
                        <Users2 className="w-4 h-4" />
                        Refer Traders
                      </Button>
                    </div>

                    {/* Added Funding Arbitrage Section for Mobile */}
                    <div className="space-y-1">
                      <div className="px-3 py-2 text-xs font-semibold text-foreground-500">
                        Trade Tools
                      </div>
                      <Button
                        variant="ghost"
                        className="justify-start w-full gap-2 text-sm h-8 bg-muted/50 hover:bg-muted/70"
                        onClick={() => (window.location.href = "/funding-arb")}
                      >
                        <BarChart2 className="w-4 h-4" />
                        Funding Arbitrage
                      </Button>
                    </div>

                    {/* More Section */}
                    <div className="space-y-1">
                      <div className="px-3 py-2 text-xs font-semibold text-foreground-500">
                        More
                      </div>
                      <Button
                        variant="ghost"
                        className="justify-start w-full gap-2 text-sm h-8 bg-muted/50 hover:bg-muted/70"
                        onClick={() =>
                          window.open("https://discord.gg/W2TByeuD7R", "_blank")
                        }
                      >
                        <FontAwesomeIcon
                          icon={faQuestionCircle}
                          className="w-4 h-4"
                        />
                        Help & Support
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start w-full gap-2 text-sm h-8 bg-muted/50 hover:bg-muted/70"
                        onClick={() =>
                          window.open(
                            "https://docs.unidex.exchange/introduction",
                            "_blank"
                          )
                        }
                      >
                        <FontAwesomeIcon icon={faBook} className="w-4 h-4" />
                        Documentation
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start w-full gap-2 text-sm h-8 bg-muted/50 hover:bg-muted/70"
                        onClick={() =>
                          window.open(
                            "https://dune.com/supakawaiidesu/unidex-molten-stats",
                            "_blank"
                          )
                        }
                      >
                        <FontAwesomeIcon
                          icon={faChartLine}
                          className="w-4 h-4"
                        />
                        Stats
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start w-full gap-2 text-sm h-8 bg-muted/50 hover:bg-muted/70"
                        onClick={() => (window.location.href = "/bridge")}
                      >
                        <UnfoldHorizontal className="w-4 h-4" />
                        Bridge
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start w-full gap-2 text-sm h-8 bg-muted/50 hover:bg-muted/70"
                        onClick={() =>
                          window.open("https://discord.gg/W2TByeuD7R", "_blank")
                        }
                      >
                        <MessageCircle className="w-4 h-4" />
                        Discord
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start w-full gap-2 text-sm h-8 bg-muted/50 hover:bg-muted/70"
                        onClick={() =>
                          window.open("https://t.me/unidexfinance", "_blank")
                        }
                      >
                        <Send className="w-4 h-4" />
                        Telegram
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start w-full gap-2 text-sm h-8 bg-muted/50 hover:bg-muted/70"
                        onClick={() =>
                          window.open("https://x.com/UniDexFinance", "_blank")
                        }
                      >
                        <Twitter className="w-4 h-4" />
                        Twitter
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex items-center space-x-2 h-full translate-y-[2px]">
        <AccountSummary buttonText="Deposit / Withdraw" className="h-8 text-sm bg-muted/50 hover:bg-muted/70" />

        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            mounted,
          }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            return (
              <div
                {...(!ready && {
                  "aria-hidden": true,
                  style: {
                    opacity: 0,
                    pointerEvents: "none",
                    userSelect: "none",
                  },
                })}
                className="flex items-center h-full"
              >
                {(() => {
                  if (!connected) {
                    return (
                      <>
                        {/* Only show on desktop */}
                        <div className="hidden md:block">
                          <Button
                            onClick={openConnectModal}
                            variant="outline"
                            className="h-8 px-3 bg-muted/50 hover:bg-muted/70 [&>*]:text-white [&>*]:font-normal [&>*]:!important text-sm flex items-center justify-center"
                          >
                            Connect
                          </Button>
                        </div>
                        {/* Only show on mobile */}
                        <div className="block md:hidden">
                          <Button
                            onClick={openConnectModal}
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-muted/50 hover:bg-muted/70 [&>*]:text-white [&>*]:font-normal [&>*]:!important flex items-center justify-center"
                          >
                            <Wallet className="w-4 h-4 text-white" />
                          </Button>
                        </div>
                      </>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <Button
                        onClick={openChainModal}
                        variant="destructive"
                        className="h-8 px-3 bg-muted/50 hover:bg-muted/70 [&>*]:text-white [&>*]:font-normal [&>*]:!important text-sm flex items-center justify-center"
                      >
                        Wrong Network
                      </Button>
                    );
                  }

                  return (
                    <div className="flex gap-2 items-center h-full">
                      {/* Only show on desktop */}
                      <div className="hidden md:block">
                        <Button
                          onClick={openAccountModal}
                          variant="outline"
                          className="h-8 px-3 bg-muted/50 hover:bg-muted/70 [&>*]:text-white [&>*]:font-normal [&>*]:!important text-sm flex items-center justify-center"
                        >
                          {account.displayName}
                        </Button>
                      </div>
                      {/* Only show on mobile */}
                      <div className="block md:hidden">
                        <Button
                          onClick={openAccountModal}
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 bg-muted/50 hover:bg-muted/70 [&>*]:text-white [&>*]:font-normal [&>*]:!important flex items-center justify-center"
                        >
                          <Wallet className="w-4 h-4 text-white" />
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-muted/50 hover:bg-muted/70 [&>*]:text-white [&>*]:font-normal [&>*]:!important flex items-center justify-center"
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        >
          {theme === 'light' ? <Settings className="w-4 h-4" stroke="black" /> : <Settings className="w-4 h-4" />}
        </Button>

        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      </div>
    </header>
  );
}
