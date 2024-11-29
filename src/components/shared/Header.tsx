import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import { Button } from "../ui/button";
import DepositBox from "../features/trading/deposit";
import Link from "next/link";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import { Menu, ChevronDown, Wallet } from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faQuestionCircle,
  faBook,
  faComments,
  faBug,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";

export function Header() {
  return (
    <header className="flex items-center px-4 md:px-6 h-14 pt-2 md:pt-3 mb-1">
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
          <Link href="/swaps">
            <Button variant="ghost">Swaps</Button>
          </Link>
          <Link href="/staking">
            <Button variant="ghost">Stake</Button>
          </Link>
          <Link href="/usdm">
            <Button variant="ghost">USD.m</Button>
          </Link>
          <Link href="/referrals">
            <Button variant="ghost">Referrals</Button>
          </Link>
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
                description: "text-xs text-default-400",
              }}
            >
              <DropdownItem
                key="help"
                description="Get help and support"
                startContent={<FontAwesomeIcon icon={faQuestionCircle} />}
                onClick={() =>
                  window.open("https://samplelink.com/help", "_blank")
                }
              >
                Help & Support
              </DropdownItem>
              <DropdownItem
                key="documentation"
                description="Read the documentation"
                startContent={<FontAwesomeIcon icon={faBook} />}
                onClick={() =>
                  window.open("https://samplelink.com/documentation", "_blank")
                }
              >
                Documentation
              </DropdownItem>
              <DropdownItem
                key="feedback"
                description="Provide your feedback"
                startContent={<FontAwesomeIcon icon={faComments} />}
                onClick={() =>
                  window.open("https://samplelink.com/feedback", "_blank")
                }
              >
                Give Feedback
              </DropdownItem>
              <DropdownItem
                key="bug-bounty"
                description="Participate in our bug bounty program"
                startContent={<FontAwesomeIcon icon={faBug} />}
                onClick={() =>
                  window.open("https://samplelink.com/bug-bounty", "_blank")
                }
              >
                Bug Bounty
              </DropdownItem>
              <DropdownItem
                key="stats"
                description="View the latest stats"
                startContent={<FontAwesomeIcon icon={faChartLine} />}
                onClick={() =>
                  window.open("https://samplelink.com/stats", "_blank")
                }
              >
                Stats
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </nav>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Dropdown>
            <DropdownTrigger>
              <Button variant="ghost" size="icon">
                <Menu size={20} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Mobile navigation"
              className="w-[240px]"
              itemClasses={{
                base: "gap-4",
                title: "text-sm",
                description: "text-xs text-default-400",
              }}
            >
              <DropdownItem onClick={() => (window.location.href = "/staking")}>
                Stake
              </DropdownItem>
              <DropdownItem onClick={() => (window.location.href = "/")}>
                Trade
              </DropdownItem>
              <DropdownItem onClick={() => (window.location.href = "/swaps")}>
                Swaps
              </DropdownItem>
              <DropdownItem onClick={() => (window.location.href = "/usdm")}>
                USD.m
              </DropdownItem>
              <DropdownItem
                key="help"
                description="Get help and support"
                onClick={() =>
                  window.open("https://samplelink.com/help", "_blank")
                }
              >
                Help & Support
              </DropdownItem>
              <DropdownItem
                key="documentation"
                description="Read the documentation"
                onClick={() =>
                  window.open("https://samplelink.com/documentation", "_blank")
                }
              >
                Documentation
              </DropdownItem>
              <DropdownItem
                key="feedback"
                description="Provide your feedback"
                onClick={() =>
                  window.open("https://samplelink.com/feedback", "_blank")
                }
              >
                Give Feedback
              </DropdownItem>
              <DropdownItem
                key="bug-bounty"
                description="Participate in our bug bounty program"
                onClick={() =>
                  window.open("https://samplelink.com/bug-bounty", "_blank")
                }
              >
                Bug Bounty
              </DropdownItem>
              <DropdownItem
                key="stats"
                description="View the latest stats"
                onClick={() =>
                  window.open("https://samplelink.com/stats", "_blank")
                }
              >
                Stats
              </DropdownItem>
              <DropdownItem
                onClick={() => (window.location.href = "/referral")}
              >
                Referrals
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      <div className="flex items-center ml-auto space-x-2">
        <DepositBox />

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
