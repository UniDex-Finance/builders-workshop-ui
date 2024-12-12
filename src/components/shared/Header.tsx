import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from 'next/image';
import { Button } from "../ui/button";
import Link from "next/link";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownSection, DropdownItem, Modal, ModalContent, useDisclosure } from "@nextui-org/react";
import { Menu, ChevronDown, Wallet, Coins, DollarSign, PiggyBank, Users2, MessageCircle, Send, Twitter, X } from "lucide-react";
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
} from "@/components/ui/sheet"

export function Header() {
  const {isOpen, onOpen, onClose} = useDisclosure();

  return (
    <header className="flex items-center px-4 h-14">
      <div className="flex items-center space-x-4">
        <Link href="/" className="hover:opacity-80">
          {/* Desktop Logo */}
          <div className="hidden md:block">
            <Image
              src="/static/images/logo-large.png"
              alt="UniDex Logo"
              width={100}
              height={32}
              priority
            />
          </div>
          {/* Mobile Logo */}
          <div className="block md:hidden">
            <Image
              src="/static/images/logo-small.png"
              alt="UniDex Logo"
              width={32}
              height={32}
              priority
            />
          </div>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="items-center hidden space-x-4 md:flex">
          <Link href="/">
            <Button variant="ghost">Trade</Button>
          </Link>
          <Dropdown>
            <DropdownTrigger>
              <Button variant="ghost" className="gap-1">
                Earn <ChevronDown size={16} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu 
              aria-label="Earn options"
              className="w-[240px]"
              itemClasses={{
                base: "gap-4",
                title: "text-sm",
                description: "text-xs text-default-400"
              }}
            >
              <DropdownSection title="Earn with MOLTEN" showDivider>
                <DropdownItem
                  key="molten-staking"
                  description="Stake MOLTEN for rewards"
                  startContent={<Coins className="w-4 h-4" />}
                  onClick={() => window.location.href = "/staking"}
                >
                  Stake MOLTEN
                </DropdownItem>
              </DropdownSection>
              
              <DropdownSection title="Earn with USD.m" showDivider>
                <DropdownItem
                  key="mint-usdm"
                  description="Market make for traders and earn yield"
                  startContent={<DollarSign className="w-4 h-4" />}
                  onClick={() => window.location.href = "/usdm"}
                >
                  Mint USD.m
                </DropdownItem>
                <DropdownItem
                  key="usdm-staking"
                  description="Stake USD.m for rewards"
                  startContent={<PiggyBank className="w-4 h-4" />}
                  onClick={() => window.location.href = "/usdm-staking"}
                >
                  Stake USD.m
                </DropdownItem>
              </DropdownSection>

              <DropdownSection title="Earn by Referring">
                <DropdownItem
                  key="referrals"
                  description="Onboard traders, earn in real-time"
                  startContent={<Users2 className="w-4 h-4" />}
                  onClick={() => window.location.href = "/referrals"}
                >
                  Refer Traders
                </DropdownItem>
              </DropdownSection>
            </DropdownMenu>
          </Dropdown>
          <Dropdown>
            <DropdownTrigger>
              <Button variant="ghost" className="gap-1">
                Socials <ChevronDown size={16} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu 
              aria-label="Social links"
              className="w-[240px]"
              itemClasses={{
                base: "gap-4",
                title: "text-sm",
                description: "text-xs text-default-400"
              }}
            >
              <DropdownItem
                key="discord"
                description="DAO, traders, and memes"
                startContent={<MessageCircle className="w-4 h-4" />}
                onClick={() => window.open("https://discord.gg/W2TByeuD7R", "_blank")}
              >
                Discord
              </DropdownItem>
              <DropdownItem
                key="telegram"
                description="Chill & good vibes only"
                startContent={<Send className="w-4 h-4" />}
                onClick={() => window.open("https://t.me/unidexfinance", "_blank")}
              >
                Telegram
              </DropdownItem>
              <DropdownItem
                key="twitter"
                description="Stay up to date on news"
                startContent={<Twitter className="w-4 h-4" />}
                onClick={() => window.open("https://x.com/UniDexFinance", "_blank")}
              >
                Twitter
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <Dropdown>
            <DropdownTrigger>
              <Button variant="ghost" className="gap-1">
                More <ChevronDown size={16} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu 
              aria-label="More actions"
              className="w-[240px]"
              itemClasses={{
                base: "gap-4",
                title: "text-sm",
                description: "text-xs text-default-400"
              }}
            >
              <DropdownItem
                key="help"
                description="Get help and support"
                startContent={<FontAwesomeIcon icon={faQuestionCircle} />}
                onClick={() => window.open("https://discord.gg/W2TByeuD7R", "_blank")}
              >
                Help & Support
              </DropdownItem>
              <DropdownItem
                key="documentation"
                description="Read the documentation"
                startContent={<FontAwesomeIcon icon={faBook} />}
                onClick={() => window.open("https://docs.unidex.exchange/introduction", "_blank")}
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
                onClick={() => window.open("https://dune.com/supakawaiidesu/unidex-molten-stats", "_blank")}
              >
                Stats
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu size={20} />
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
                      width={100}
                      height={32}
                      priority
                    />
                  </Link>
                </SheetHeader>

                {/* Navigation Items */}
                <div className="flex-1 p-2">
                  <div className="space-y-2">
                    {/* Trade */}
                    <Button 
                      variant="ghost" 
                      className="justify-start w-full" 
                      onClick={() => window.location.href = "/"}
                    >
                      Trade
                    </Button>

                    {/* Earn Section */}
                    <div className="space-y-1">
                      <div className="px-3 py-2 text-xs font-semibold text-foreground-500">
                        Earn with MOLTEN
                      </div>
                      <Button
                        variant="ghost"
                        className="justify-start w-full gap-2"
                        onClick={() => window.location.href = "/staking"}
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
                        className="justify-start w-full gap-2"
                        onClick={() => window.location.href = "/usdm"}
                      >
                        <DollarSign className="w-4 h-4" />
                        Mint USD.m
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start w-full gap-2"
                        onClick={() => window.location.href = "/usdm-staking"}
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
                        className="justify-start w-full gap-2"
                        onClick={() => window.location.href = "/referrals"}
                      >
                        <Users2 className="w-4 h-4" />
                        Refer Traders
                      </Button>
                    </div>

                    {/* Social Links */}
                    <div className="space-y-1">
                      <div className="px-3 py-2 text-xs font-semibold text-foreground-500">
                        Social Links
                      </div>
                      <Button
                        variant="ghost"
                        className="justify-start w-full gap-2"
                        onClick={() => window.open("https://discord.gg/W2TByeuD7R", "_blank")}
                      >
                        <MessageCircle className="w-4 h-4" />
                        Discord
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start w-full gap-2"
                        onClick={() => window.open("https://t.me/unidexfinance", "_blank")}
                      >
                        <Send className="w-4 h-4" />
                        Telegram
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start w-full gap-2"
                        onClick={() => window.open("https://x.com/UniDexFinance", "_blank")}
                      >
                        <Twitter className="w-4 h-4" />
                        Twitter
                      </Button>
                    </div>

                    {/* More Section */}
                    <div className="space-y-1">
                      <div className="px-3 py-2 text-xs font-semibold text-foreground-500">
                        More
                      </div>
                      <Button
                        variant="ghost"
                        className="justify-start w-full gap-2"
                        onClick={() => window.open("https://discord.gg/W2TByeuD7R", "_blank")}
                      >
                        <FontAwesomeIcon icon={faQuestionCircle} className="w-4 h-4" />
                        Help & Support
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start w-full gap-2"
                        onClick={() => window.open("https://docs.unidex.exchange/introduction", "_blank")}
                      >
                        <FontAwesomeIcon icon={faBook} className="w-4 h-4" />
                        Documentation
                      </Button>
                      <Button
                        variant="ghost"
                        className="justify-start w-full gap-2"
                        onClick={() => window.open("https://dune.com/supakawaiidesu/unidex-molten-stats", "_blank")}
                      >
                        <FontAwesomeIcon icon={faChartLine} className="w-4 h-4" />
                        Stats
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="flex items-center ml-auto space-x-2">
        <AccountSummary 
          buttonText="Deposit / Withdraw" 
          className="h-9"
        />
        
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
                  'aria-hidden': true,
                  'style': {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <>
                        <Button 
                          onClick={openConnectModal} 
                          variant="outline"
                          className="hidden sm:inline-flex h-9 px-3 bg-[#1f1f29] hover:bg-[#1f1f29]/90 [&>*]:text-white [&>*]:font-normal [&>*]:!important"
                        >
                          Connect
                        </Button>
                        <Button 
                          onClick={openConnectModal} 
                          variant="outline"
                          size="icon"
                          className="sm:hidden h-9 w-9 bg-[#1f1f29] hover:bg-[#1f1f29]/90 [&>*]:text-white [&>*]:font-normal [&>*]:!important flex items-center justify-center"
                        >
                          <Wallet className="w-5 h-5 text-white" />
                        </Button>
                      </>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <Button 
                        onClick={openChainModal}
                        variant="destructive"
                        className="h-9 px-3 bg-[#1f1f29] hover:bg-[#1f1f29]/90 [&>*]:text-white [&>*]:font-normal [&>*]:!important"
                      >
                        Wrong Network
                      </Button>
                    );
                  }

                  return (
                    <div className="flex gap-2">
                      <Button
                        onClick={openAccountModal}
                        variant="outline"
                        className="hidden sm:inline-flex h-9 px-3 bg-[#1f1f29] hover:bg-[#1f1f29]/90 [&>*]:text-white [&>*]:font-normal [&>*]:!important"
                      >
                        {account.displayName}
                      </Button>
                      <Button
                        onClick={openAccountModal}
                        variant="outline"
                        size="icon"
                        className="sm:hidden h-9 w-9 bg-[#1f1f29] hover:bg-[#1f1f29]/90 [&>*]:text-white [&>*]:font-normal [&>*]:!important flex items-center justify-center"
                      >
                        <Wallet className="w-5 h-5 text-white" />
                      </Button>
                    </div>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  );
}
