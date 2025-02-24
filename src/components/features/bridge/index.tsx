"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from "@/components/shared/Header"
import { Badge } from "@/components/ui/badge"
import { useAccount, useConfig, useWalletClient, useSwitchChain } from 'wagmi'
import { arbitrum, base, mainnet, optimism } from 'wagmi/chains';
import { useGetMoltenBalance } from "@/hooks/bridge-hooks/use-get-molten-balance";
import { sonic } from "@/wagmi";
import { useFindRoute } from "@/hooks/bridge-hooks/use-find-route"
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Image from "next/image";
import ArbLogo from "@/../../public/static/images/chain-logos/arb.svg"
import OpLogo from "@/../../public/static/images/chain-logos/op.svg"
import BaseLogo from "@/../../public/static/images/chain-logos/base.svg"
import EthLogo from "@/../../public/static/images/chain-logos/eth.svg"
import SonicLogo from "@/../../public/static/images/chain-logos/sonic.svg"

const supportedChains = [mainnet, arbitrum, optimism, base, sonic];

const getChainLogo = (chainName: string | undefined) => {
  switch (chainName) {
    case "arbitrum":
      return ArbLogo;
    case "optimism":
      return OpLogo;
    case "base":
      return BaseLogo;
    case "ethereum":
      return EthLogo;
    case "sonic":
      return SonicLogo;
    default:
      return null; // Or a default placeholder logo
  }
};

const getAvailableToNetworks = (fromNetwork: string | undefined) => {
  if (!fromNetwork) {
    return supportedChains;
  }

  return supportedChains.filter(chain => chain.name.toLowerCase() !== fromNetwork.toLowerCase());
};

export function BridgeDashboard() {
  const [amount, setAmount] = useState("")
  const { chain } = useAccount();
  const { address, isConnected } = useAccount();
  const { chains } = useConfig();
  const [fromNetwork, setFromNetwork] = useState<string | undefined>(chain?.name.toLowerCase());
  const [toNetwork, setToNetwork] = useState<string | undefined>(getAvailableToNetworks(chain?.name.toLowerCase())[0]?.name.toLowerCase());
  const { data: walletClient } = useWalletClient();
  const { switchChain } = useSwitchChain();

  const fromChain = supportedChains.find(c => c.name.toLowerCase() === fromNetwork);
  const toChain = supportedChains.find(c => c.name.toLowerCase() === toNetwork);
  const { balance: fromBalance, formattedBalance: fromFormattedBalance, refetch: refetchFromBalance } = useGetMoltenBalance(fromChain);

  const { getSendFromData } = useFindRoute({
    fromChainId: fromChain?.id,
    toChainId: toChain?.id,
    amount,
    userAddress: address
  });

  // Update fromNetwork when connected chain changes
  useEffect(() => {
    if (chain) {
      setFromNetwork(chain.name.toLowerCase());
    }
  }, [chain]);

  const availableToNetworks = getAvailableToNetworks(fromNetwork);

  useEffect(() => {
    if (fromNetwork) {
      const newToNetworks = getAvailableToNetworks(fromNetwork);
      if (newToNetworks.length > 0 && !newToNetworks.some(c => c.name.toLowerCase() === toNetwork)) {
        setToNetwork(newToNetworks[0].name.toLowerCase());
      }
    }
  }, [fromNetwork])

  // Refetch balance when fromNetwork changes
  useEffect(() => {
    if (fromChain) {
      refetchFromBalance();
    }
  }, [fromChain, refetchFromBalance]);

  const handleTransfer = async () => {
    if (!walletClient) {
      return;
    }
    const sendFromData = getSendFromData();

    if (!sendFromData) {
      console.error("Could not get sendFromData");
      return;
    }

    try {
      const { abi, address, functionName, args, value } = sendFromData;
      const request = {
        abi,
        address,
        functionName,
        args,
        value,
      }
      await walletClient.writeContract(request);

    } catch (error) {
      console.log("Bridge Error", error)
    }
  }

  const getButton = () => {
    if (!isConnected) {
      return (
        <ConnectButton />
      )
    }

    return (
      <Button onClick={handleTransfer} className="w-full h-12 bg-[var(--color-long-short-button)] hover:bg-[var(--color-long-short-button-hover)] text-white font-medium rounded">Transfer</Button>
    )
  }

  // Calculate Fee and Receive Amount
  const fee = 0.32;
  const receiveAmount = amount ? (parseFloat(amount) * 0.999).toFixed(3) : '0.000';

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex-1 flex justify-center items-start pt-16 px-4">
        <div className="max-w-md w-full space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-lg font-mono">Bridge MOLTEN</h1>
            <div className="text-sm font-mono">
              Gas Price: <span className="text-green-500">0</span>
            </div>
          </div>

          {/* Network Selector - Flex Layout */}
          <div className="flex space-x-4">
            <div className="flex-1 bg-[var(--deposit-card-background)] border border-[var(--deposit-card-border)] rounded p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  {getChainLogo(fromNetwork) ? (
                    <Image
                      src={getChainLogo(fromNetwork)}
                      alt={fromNetwork || "Network"}
                      width={24}
                      height={24}
                    />
                  ) : (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">From</span>
                  <Select
                    value={fromNetwork}
                    onValueChange={(value) => {
                      setFromNetwork(value);
                    }}
                  >
                    <SelectTrigger className="w-full bg-transparent border-0 p-0 h-auto text-foreground shadow-none">
                      <SelectValue>
                        {supportedChains.find(c => c.name.toLowerCase() === fromNetwork)?.name || "Select Network"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {supportedChains.map((chain) => (
                        <SelectItem key={chain.id} value={chain.name.toLowerCase()}>
                          <div className="flex items-center gap-2">
                            <Image
                              src={getChainLogo(chain.name.toLowerCase())}
                              alt={chain.name}
                              width={24}
                              height={24}
                            />
                            {chain.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-[var(--deposit-card-background)] border border-[var(--deposit-card-border)] rounded p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#d1ff1a] rounded-full flex items-center justify-center">
                  {getChainLogo(toNetwork) ? (
                    <Image
                      src={getChainLogo(toNetwork)}
                      alt={toNetwork || "Network"}
                      width={24}
                      height={24}
                    />
                  ) : (
                    <span className="text-black font-bold">M</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">To</span>
                  <Select
                    value={toNetwork}
                    onValueChange={(value) => setToNetwork(value)}
                  >
                    <SelectTrigger className="w-full bg-transparent border-0 p-0 h-auto text-foreground shadow-none">
                      <SelectValue>
                        {availableToNetworks.find(c => c.name.toLowerCase() === toNetwork)?.name || "Select Network"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableToNetworks.map((chain) => (
                        <SelectItem key={chain.id} value={chain.name.toLowerCase()}>
                          <div className="flex items-center gap-2">
                            <Image
                              src={getChainLogo(chain.name.toLowerCase())}
                              alt={chain.name}
                              width={24}
                              height={24}
                            />
                            {chain.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-[var(--deposit-card-border)] rounded p-4">
            <div className="flex items-center">
              <Badge
                variant="outline"
                className="text-xs text-muted-foreground hover:text-foreground/80 px-2 py-1 rounded-md mr-2"
              >
                Max
              </Badge>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-transparent border-0 text-2xl p-0 focus:outline-none focus:ring-0 font-mono text-foreground placeholder:text-muted-foreground"
              />
              <div className="ml-auto text-right">
                <div className="text-xs text-muted-foreground">Balance</div>
                <div className="text-sm font-mono">{fromFormattedBalance}</div>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gas on destination</span>
              <span className="text-blue-400 cursor-pointer">Add</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">You will receive</span>
              <span>{receiveAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Relayer Gas Fee</span>
              <span>${fee}</span>
            </div>
          </div>
          {getButton()}
        </div>
      </div>
    </div>
  )
}