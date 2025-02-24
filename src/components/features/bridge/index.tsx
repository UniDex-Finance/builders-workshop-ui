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
  // Convert chain name to lowercase for consistent comparison
  const name = chainName?.toLowerCase() || '';
  
  if (name.includes('arbitrum')) {
    return ArbLogo;
  }
  if (name.includes('optimism') || name.includes('op')) {
    return OpLogo;
  }
  if (name === 'base') {
    return BaseLogo;
  }
  if (name === 'ethereum') {
    return EthLogo;
  }
  if (name === 'sonic') {
    return SonicLogo;
  }
  return EthLogo; // Fallback to Ethereum logo though this shouldn't happen with our supported chains
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
  const { switchChain } = useSwitchChain();
  const [fromNetwork, setFromNetwork] = useState<string>("base");
  const [toNetwork, setToNetwork] = useState<string>("ethereum");
  const { data: walletClient } = useWalletClient();

  const fromChain = supportedChains.find(c => c.name.toLowerCase() === fromNetwork);
  const toChain = supportedChains.find(c => c.name.toLowerCase() === toNetwork);
  const { balance: fromBalance, formattedBalance: fromFormattedBalance, refetch: refetchFromBalance } = useGetMoltenBalance(fromChain);

  const { getSendFromData } = useFindRoute({
    fromChainId: fromChain?.id,
    toChainId: toChain?.id,
    amount,
    userAddress: address
  });

  useEffect(() => {
    if (chain && isConnected) {
      setFromNetwork(chain.name.toLowerCase());
    }
  }, [chain, isConnected]);

  const availableToNetworks = getAvailableToNetworks(fromNetwork);

  useEffect(() => {
    if (fromNetwork) {
      const newToNetworks = getAvailableToNetworks(fromNetwork);
      if (newToNetworks.length > 0 && !newToNetworks.some(c => c.name.toLowerCase() === toNetwork)) {
        setToNetwork(newToNetworks[0].name.toLowerCase());
      }
    }
  }, [fromNetwork])

  useEffect(() => {
    if (fromChain) {
      refetchFromBalance();
    }
  }, [fromChain, refetchFromBalance]);

  const handleTransfer = async () => {
    if (!walletClient || !fromChain || !toChain || !address) {
      console.error("Missing required data for transfer");
      return;
    }
    const sendFromData = getSendFromData();

    if (!sendFromData) {
      console.error("Could not get sendFromData");
      return;
    }

    try {
      const { abi, address: contractAddress, functionName, args, value } = sendFromData;
      const request = {
        abi,
        address: contractAddress,
        functionName,
        args,
        value,
      }
      await walletClient.writeContract(request);

    } catch (error) {
      console.log("Bridge Error", error)
    }
  }

  const handleSwitchNetwork = () => {
    if (fromChain) {
      switchChain({ chainId: fromChain.id });
    }
  };

  const isOnCorrectChain = () => {
    return chain?.id === fromChain?.id;
  };

  const getButton = () => {
    if (!isConnected) {
      return (
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <Button
              onClick={openConnectModal}
              className="w-full h-12 bg-[var(--color-long-short-button)] hover:bg-[var(--color-long-short-button-hover)] text-white font-medium rounded"
            >
              Connect Wallet
            </Button>
          )}
        </ConnectButton.Custom>
      );
    }

    if (!isOnCorrectChain()) {
      return (
        <Button
          onClick={handleSwitchNetwork}
          className="w-full h-12 bg-[var(--color-long-short-button)] hover:bg-[var(--color-long-short-button-hover)] text-white font-medium rounded"
        >
          Switch to {fromChain?.name}
        </Button>
      );
    }

    return (
      <Button
        onClick={handleTransfer}
        className="w-full h-12 bg-[var(--color-long-short-button)] hover:bg-[var(--color-long-short-button-hover)] text-white font-medium rounded"
      >
        Bridge MOLTEN
      </Button>
    );
  };

  const fee = 0.32;
  const receiveAmount = amount ? (parseFloat(amount) * 0.999).toFixed(3) : '0.000';

  const handleRotateNetworks = () => {
    const currentFrom = fromNetwork;
    const currentTo = toNetwork;
    setFromNetwork(currentTo);
    setToNetwork(currentFrom);
    
    if (currentTo) {
      const newFromChain = supportedChains.find(c => c.name.toLowerCase() === currentTo);
      if (newFromChain) {
        switchChain({ chainId: newFromChain.id });
      }
    }
  };

  const handleMaxClick = () => {
    if (fromBalance) {
      const rawAmount = Number(fromBalance) / 1e18;
      const formattedAmount = Math.floor(rawAmount * 1e6) / 1e6;
      setAmount(formattedAmount.toString());
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex-1 flex justify-center items-start pt-16 px-4">
        <div className="max-w-md w-full space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-lg font-mono">Bridge MOLTEN</h1>

          </div>

          <div className="flex items-center space-x-4">
            <div className="flex-1 bg-[var(--deposit-card-background)] border border-[var(--deposit-card-border)] rounded p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center">
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
                      console.log("Setting fromNetwork to:", value);
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
            
            <button
              onClick={handleRotateNetworks}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--deposit-card-background)] border border-[var(--deposit-card-border)] hover:bg-[var(--deposit-card-border)] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="rotate-90"
              >
                <path d="M17 1l4 4-4 4"></path>
                <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                <path d="M7 23l-4-4 4-4"></path>
                <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
              </svg>
            </button>
            
            <div className="flex-1 bg-[var(--deposit-card-background)] border border-[var(--deposit-card-border)] rounded p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center">
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
                className="text-xs text-muted-foreground hover:text-foreground/80 px-2 py-1 rounded-md mr-2 cursor-pointer"
                onClick={handleMaxClick}
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