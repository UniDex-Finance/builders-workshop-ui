"use client"

import * as React from "react"
import { ChevronDown } from 'lucide-react'
import { useWalletClient, useAccount, useSwitchChain } from 'wagmi'
import { parseUnits } from 'viem'
import { useUsdm } from "@/hooks/usdmHooks/use-usdm"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUsdcPrice } from "@/hooks/use-usdc-price"
import { type Balances } from "@/hooks/use-balances"
import Image from "next/image"
import USDCIcon from "@/../../public/static/images/tokens/USDC.svg"
import ArbLogo from "@/../../public/static/images/chain-logos/arb.svg"
import OpLogo from "@/../../public/static/images/chain-logos/op.svg"
import BaseLogo from "@/../../public/static/images/chain-logos/base.svg"
import EthLogo from "@/../../public/static/images/chain-logos/eth.svg"
import { useSquidCrossChainMint } from "@/hooks/usdmHooks/squid-crosschain-mint"

interface ActionsCardProps {
  isStaking: boolean
  setIsStaking: (value: boolean) => void
  balances: Balances | null
  isLoading: boolean
  refetchBalances: () => Promise<void>
}

const CHAIN_ASSETS = [
  {
    id: "arbitrum-usdc",
    chain: "arbitrum",
    name: "USD Coin",
    displayName: "Arbitrum USD Coin (USDC)",
    address: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
    icon: ArbLogo,
    tokenIcon: USDCIcon,
  },
  {
    id: "optimism-usdc",
    chain: "optimism",
    name: "USD Coin",
    displayName: "Optimism USD Coin (USDC)",
    address: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
    icon: OpLogo,
    tokenIcon: USDCIcon,
  },
  {
    id: "base-usdc",
    chain: "base",
    name: "USD Coin",
    displayName: "Base USD Coin (USDC)",
    address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    icon: BaseLogo,
    tokenIcon: USDCIcon,
  },
  {
    id: "ethereum-usdc",
    chain: "ethereum",
    name: "USD Coin",
    displayName: "Ethereum USD Coin (USDC)",
    address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    icon: EthLogo,
    tokenIcon: USDCIcon,
  },
] as const

export function ActionsCard({ 
  balances
}: ActionsCardProps) {
  const [amount, setAmount] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(true)
  const [action, setAction] = React.useState<'mint' | 'burn'>('mint')
  const [selectedAsset, setSelectedAsset] = React.useState("arbitrum-usdc")
  const [approvalState, setApprovalState] = React.useState<{ needsApproval: boolean } | null>(null)
  
  // Add effect to handle action changes
  React.useEffect(() => {
    if (action === 'burn') {
      setSelectedAsset("arbitrum-usdc")
    }
  }, [action])

  const { data: walletClient } = useWalletClient()
  const { 
    usdmData,
    approveUsdc,
    approveUsdm,
    mint,
    burn,
    refetch
  } = useUsdm()
  const { price: usdcPrice } = useUsdcPrice()
  const { chain } = useAccount()
  const { switchChain } = useSwitchChain()
  const { checkApproval, getCrossChainMintTransaction } = useSquidCrossChainMint()

  // Add effect to check approval state for cross-chain minting
  React.useEffect(() => {
    const checkApprovalState = async () => {
      if (!walletClient || !chain || !amount || action !== 'mint' || chain.id === 42161) {
        setApprovalState(null)
        return
      }

      const selectedChainAsset = CHAIN_ASSETS.find(asset => asset.id === selectedAsset)
      if (!selectedChainAsset) {
        setApprovalState(null)
        return
      }

      try {
        const result = await checkApproval(
          walletClient.account.address,
          chain.id.toString(),
          selectedChainAsset.address,
          amount
        )
        setApprovalState(result)
      } catch (error) {
        console.error('Error checking approval:', error)
        setApprovalState(null)
      }
    }
    checkApprovalState()
  }, [amount, chain, selectedAsset, walletClient, action])

  const selectedChainAsset = CHAIN_ASSETS.find(asset => asset.id === selectedAsset)

  const getRequiredChainId = () => {
    if (action === 'burn') return 42161; // Arbitrum
    
    switch (selectedAsset) {
      case "arbitrum-usdc":
        return 42161; // Arbitrum
      case "optimism-usdc":
        return 10; // Optimism
      case "base-usdc":
        return 8453; // Base
      case "ethereum-usdc":
        return 1; // Ethereum
      default:
        return 42161;
    }
  }

  const isOnCorrectChain = () => {
    return chain?.id === getRequiredChainId();
  }

  const handleNetworkSwitch = async () => {
    if (switchChain) {
      await switchChain({ chainId: getRequiredChainId() })
    }
  }

  const handleAssetChange = async (value: string) => {
    setSelectedAsset(value)
    
    // Find the required chain ID for the new asset
    const newChainId = (() => {
      if (value === "arbitrum-usdc") return 42161
      if (value === "optimism-usdc") return 10
      if (value === "base-usdc") return 8453
      if (value === "ethereum-usdc") return 1
      return 42161
    })()
    
    // If we're not on the correct chain, trigger the switch
    if (chain?.id !== newChainId && switchChain) {
      try {
        await switchChain({ chainId: newChainId })
      } catch (error) {
        console.error('Failed to switch chain:', error)
      }
    }
  }

  const handleTransaction = async () => {
    if (!isOnCorrectChain()) {
      return handleNetworkSwitch()
    }

    if (!walletClient || !amount || !chain || !usdmData) return

    try {
      if (action === 'mint') {
        const parsedAmount = parseUnits(amount, 6) // USDC has 6 decimals

        // If we're on Arbitrum, use the normal minting flow
        if (chain.id === 42161) {
          if (parsedAmount > usdmData.usdcAllowance) {
            const approvalRequest = await approveUsdc(parsedAmount)
            if (approvalRequest) {
              await walletClient.writeContract(approvalRequest)
              await new Promise(r => setTimeout(r, 2000))
              await refetch()
            }
            return
          }
          
          const mintRequest = await mint(parsedAmount)
          if (mintRequest) {
            await walletClient.writeContract(mintRequest)
            setAmount("")
          }
        } else {
          // Cross-chain minting flow
          const selectedChainAsset = CHAIN_ASSETS.find(asset => asset.id === selectedAsset)
          if (!selectedChainAsset) throw new Error('Invalid asset selected')

          // Check if we need to approve the token for Squid
          const approvalCheck = await checkApproval(
            walletClient.account.address,
            chain.id.toString(),
            selectedChainAsset.address,
            amount
          )

          if (approvalCheck.needsApproval) {
            if (!approvalCheck.approvalData) throw new Error('Missing approval data')
            
            await walletClient.writeContract(approvalCheck.approvalData)
            await new Promise(r => setTimeout(r, 2000))
            
            // Verify approval went through and update state
            const verifyCheck = await checkApproval(
              walletClient.account.address,
              chain.id.toString(),
              selectedChainAsset.address,
              amount
            )
            setApprovalState(verifyCheck)
            if (verifyCheck.needsApproval) {
              throw new Error('Approval failed')
            }
            return
          }

          // Get the cross-chain transaction data
          const crossChainTx = await getCrossChainMintTransaction(
            walletClient.account.address,
            chain.id.toString(),
            selectedChainAsset.address,
            amount
          )

          if (!crossChainTx.transactionRequest || !crossChainTx.transactionRequest.target || !crossChainTx.transactionRequest.data) {
            throw new Error('Invalid transaction request from Squid')
          }

          // Execute the cross-chain transaction using the raw transaction request
          const tx = {
            account: walletClient.account,
            to: crossChainTx.transactionRequest.target as `0x${string}`,
            data: crossChainTx.transactionRequest.data as `0x${string}`,
            value: crossChainTx.transactionRequest.value ? BigInt(crossChainTx.transactionRequest.value) : BigInt(0),
            chainId: chain.id,
            gas: crossChainTx.transactionRequest.gasLimit ? BigInt(crossChainTx.transactionRequest.gasLimit) : undefined,
            maxFeePerGas: crossChainTx.transactionRequest.maxFeePerGas ? BigInt(crossChainTx.transactionRequest.maxFeePerGas) : undefined,
            maxPriorityFeePerGas: crossChainTx.transactionRequest.maxPriorityFeePerGas ? BigInt(crossChainTx.transactionRequest.maxPriorityFeePerGas) : undefined,
          }
          await walletClient.sendTransaction(tx)
          setAmount("")
        }
      } else {
        // Burning flow remains unchanged as it's only available on Arbitrum
        const approvalAmount = parseUnits(amount, 18)
        const burnAmount = parseUnits(amount, 18)

        if (approvalAmount > usdmData.usdmAllowance) {
          const approvalRequest = await approveUsdm(approvalAmount)
          if (approvalRequest) {
            await walletClient.writeContract(approvalRequest)
            await new Promise(r => setTimeout(r, 2000))
            await refetch()
          }
          return
        }
        
        const burnRequest = await burn(burnAmount)
        if (burnRequest) {
          await walletClient.writeContract(burnRequest)
          setAmount("")
        }
      }
    } catch (error) {
      console.error('Transaction failed:', error)
    }
  }

  const needsApproval = () => {
    if (!amount || !chain || !walletClient) return false
    try {
      if (action === 'mint') {
        // If we're on Arbitrum, use the normal minting flow
        if (chain.id === 42161) {
          if (!usdmData) return false
          const parsedAmount = parseUnits(amount, 6)
          return parsedAmount > usdmData.usdcAllowance
        } else {
          // For cross-chain minting, use the cached approval state
          return approvalState?.needsApproval ?? false
        }
      } else {
        // Burning flow remains unchanged
        if (!usdmData) return false
        const parsedAmount = parseUnits(amount, 18)
        return parsedAmount > usdmData.usdmAllowance
      }
    } catch {
      return false
    }
  }

  const hasInsufficientBalance = () => {
    if (!amount || amount === '0') return false
    try {
      if (action === 'mint') {
        const parsedAmount = parseUnits(amount, 6)
        if (!balances) return true;
        
        let relevantBalance: bigint;
        switch (selectedAsset) {
          case "arbitrum-usdc":
            relevantBalance = balances.eoaUsdcBalance;
            break;
          case "optimism-usdc":
            relevantBalance = balances.eoaOptimismUsdcBalance;
            break;
          case "base-usdc":
            relevantBalance = balances.eoaBaseUsdcBalance;
            break;
          case "ethereum-usdc":
            relevantBalance = balances.eoaEthUsdcBalance;
            break;
          default:
            return true;
        }
        return parsedAmount > relevantBalance;
      } else {
        // Use 18 decimals when checking USD.m balance
        const parsedAmount = parseUnits(amount, 18)
        return parsedAmount > (usdmData?.usdmBalance || BigInt(0))
      }
    } catch {
      return false
    }
  }

  const canSubmit = () => {
    if (!amount || amount === '0') return false
    return !hasInsufficientBalance()
  }

  // Update the button text based on action and approval status
  const getButtonText = () => {
    if (!amount) {
      return 'Input Amount'
    }
    if (hasInsufficientBalance()) {
      return 'Insufficient Balance'
    }
    if (!isOnCorrectChain()) {
      const networkName = selectedChainAsset?.chain || 'Arbitrum'
      return `Switch to ${networkName}`
    }
    if (needsApproval()) {
      return action === 'mint' ? 'Approve USDC' : 'Approve USD.m'
    }
    return action === 'mint' ? 'Mint USD.m' : 'Redeem USD.m'
  }

  // Fix: Update getAvailableBalance to use correct balance
  const getAvailableBalance = () => {
    if (action === 'mint') {
      if (!balances) return 'Available Balance: 0.0000 USDC';
      switch (selectedAsset) {
        case "arbitrum-usdc":
          return `Available Balance: ${balances.formattedEoaUsdcBalance} USDC`;
        case "optimism-usdc":
          return `Available Balance: ${balances.formattedEoaOptimismUsdcBalance} USDC`;
        case "base-usdc":
          return `Available Balance: ${balances.formattedEoaBaseUsdcBalance} USDC`;
        case "ethereum-usdc":
          return `Available Balance: ${balances.formattedEoaEthUsdcBalance} USDC`;
        default:
          return 'Available Balance: 0.0000 USDC';
      }
    }
    return `Available Balance: ${usdmData?.displayUsdmBalance || '0.00'} USD.m`
  }

  // Update handleMaxClick to use correct balance
  const handleMaxClick = () => {
    if (action === 'mint') {
      if (!balances) return;
      switch (selectedAsset) {
        case "arbitrum-usdc":
          setAmount(balances.formattedEoaUsdcBalance);
          break;
        case "optimism-usdc":
          setAmount(balances.formattedEoaOptimismUsdcBalance);
          break;
        case "base-usdc":
          setAmount(balances.formattedEoaBaseUsdcBalance);
          break;
        case "ethereum-usdc":
          setAmount(balances.formattedEoaEthUsdcBalance);
          break;
      }
    } else {
      setAmount(usdmData?.displayUsdmBalance || '0')
    }
  }

  // Update handlePercentageClick to use correct balance
  const handlePercentageClick = (percentage: number) => {
    if (action === 'mint') {
      if (!balances) return;
      let baseBalance: string;
      switch (selectedAsset) {
        case "arbitrum-usdc":
          baseBalance = balances.formattedEoaUsdcBalance;
          break;
        case "optimism-usdc":
          baseBalance = balances.formattedEoaOptimismUsdcBalance;
          break;
        case "base-usdc":
          baseBalance = balances.formattedEoaBaseUsdcBalance;
          break;
        case "ethereum-usdc":
          baseBalance = balances.formattedEoaEthUsdcBalance;
          break;
        default:
          baseBalance = '0';
      }
      const value = (Number(baseBalance) * percentage).toFixed(6);
      setAmount(value);
    } else {
      const value = (Number(usdmData?.formattedUsdmBalance || 0) * percentage).toFixed(6);
      setAmount(value);
    }
  }

  const calculateUsdValue = (inputAmount: string) => {
    if (!inputAmount) return '0.00'
    
    // Use USDC price when minting, USD.m price when burning
    const price = action === 'mint' 
      ? usdcPrice 
      : Number(usdmData?.formattedUsdmPrice || 0)
      
    const usdValue = Number(inputAmount) * price
    return usdValue.toFixed(2)
  }

  // Update calculate output amount to account for fees
  const calculateOutputAmount = (inputAmount: string) => {
    if (!inputAmount || !usdmData) return '0.00'
    try {
      const input = Number(inputAmount)
      const fee = input * 0.0025 // 0.25% fee
      const amountAfterFees = input - fee
      const usdmPrice = Number(usdmData.formattedUsdmPrice)

      if (action === 'mint') {
        // When minting: (USDC amount - fees) / USDM price
        // Example: 9.975 USDC / 1.03847 = 9.6054 USDM
        return (amountAfterFees / usdmPrice).toFixed(6)
      } else {
        // When burning: (USDM amount - fees) * USDM price
        // Example: If burning 10 USDM with 1.03847 price
        // 9.975 USDM * 1.03847 = 10.35873 USDC
        return (amountAfterFees * usdmPrice).toFixed(6)
      }
    } catch {
      return '0.00'
    }
  }

  // Update the fee calculation to show 2 decimal places
  const calculateFees = (inputAmount: string) => {
    if (!inputAmount) return '0.00'
    try {
      const input = Number(inputAmount)
      const fee = input * 0.0025 // 0.25%
      return fee.toFixed(2) // Changed from toFixed(6) to toFixed(2)
    } catch {
      return '0.00'
    }
  }

  const getEstimatedTime = () => {
    if (action === 'burn' || selectedAsset === "arbitrum-usdc") {
      return "0.1 Seconds"
    }
    return "20 Seconds"
  }

  return (
    <Card className="bg-[#16161D] border-[#1b1b22]">
      <CardHeader className="pt-3 pb-0 sm:pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base sm:text-lg">
              {action === 'mint' ? (
                <>Mint USD.m from<span className="mr-1" /></>
              ) : (
                'Redeem USD.m'
              )}
            </CardTitle>
            {action === 'mint' && (
              <Select 
                value={selectedAsset.split('-')[0]} 
                onValueChange={(chain) => handleAssetChange(`${chain}-usdc`)}
              >
                <SelectTrigger className="w-[140px] h-[30px] bg-[#272734] border-0 focus:ring-0">
                  <SelectValue>
                    {selectedChainAsset && (
                      <div className="flex items-center gap-2">
                        <Image 
                          src={selectedChainAsset.icon}
                          alt={selectedChainAsset.chain}
                          width={16}
                          height={16}
                        />
                        <span className="capitalize">{selectedChainAsset.chain}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#272734] border-zinc-800">
                  {CHAIN_ASSETS.map((asset) => (
                    <SelectItem key={asset.chain} value={asset.chain}>
                      <div className="flex items-center gap-2">
                        <Image 
                          src={asset.icon}
                          alt={asset.chain}
                          width={16}
                          height={16}
                        />
                        <span className="capitalize">{asset.chain}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex gap-1 sm:gap-2">
            <Button 
              variant="ghost" 
              className={`text-[#A0AEC0] hover:text-white text-sm px-2 sm:px-4 ${action === 'mint' ? 'bg-[#272734]' : ''}`}
              onClick={() => setAction('mint')}
            >
              Mint
            </Button>
            <Button 
              variant="ghost" 
              className={`text-[#A0AEC0] hover:text-white text-sm px-2 sm:px-4 ${action === 'burn' ? 'bg-[#272734]' : ''}`}
              onClick={() => setAction('burn')}
            >
              Redeem
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row">
            <Select 
              value={action === 'burn' ? "arbitrum-usdc" : selectedAsset} 
              onValueChange={() => {}}
            >
              <SelectTrigger className="w-full md:w-[210px] h-[42px] bg-[#272734] border-0 focus:ring-0">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <Image 
                      src={USDCIcon}
                      alt="USDC"
                      width={20}
                      height={20}
                    />
                    <span>USD Coin (USDC)</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#272734] border-zinc-800">
                <SelectItem value="arbitrum-usdc">
                  <div className="flex items-center gap-2">
                    <Image 
                      src={USDCIcon}
                      alt="USDC"
                      width={20}
                      height={20}
                    />
                    <span>USD Coin (USDC)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1">
              <Input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-[42px] bg-[#272734] border-0 text-lg pr-20"
                placeholder="0.00"
              />
              <div className="absolute text-[#A0AEC0] -translate-y-1/2 right-3 top-1/2">
                ~${calculateUsdValue(amount)}
              </div>
            </div>
          </div>

          <div className="text-sm text-[#A0AEC0]">
            {getAvailableBalance()}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {["25", "50", "75", "100"].map((percent) => (
              <Button
                key={percent}
                variant="outline"
                className="bg-[#272734] border-0 hover:bg-[#373745]"
                onClick={() => handlePercentageClick(Number(percent) / 100)}
              >
                {percent}%
              </Button>
            ))}
          </div>

          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 sm:p-4 bg-[#272734] rounded-lg text-sm">
              <span className="text-[#A0AEC0]">Summary</span>
              <ChevronDown className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="bg-[#272734] rounded-lg mt-px p-3 sm:p-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-[#A0AEC0]">Balance</span>
                  <div className="flex items-center gap-2">
                    <span>0.00</span>
                    <span className="text-[#A0AEC0]">→</span>
                    <span>{amount ? calculateOutputAmount(amount) : '0.00'}</span>
                    <span className="text-[#A0AEC0]">{action === 'mint' ? 'USD.m' : 'USDC'}</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-[#A0AEC0]">Fees (0.25%)</span>
                  <div className="flex items-center gap-2">
                    <span>{amount ? calculateFees(amount) : '0.00'}</span>
                    <span className="text-[#A0AEC0]">{action === 'mint' ? 'USDC' : 'USD.m'}</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-[#A0AEC0]">Estimated Time</span>
                  <div className="flex items-center gap-2">
                    <span>{getEstimatedTime()}</span>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Button 
            className="w-full h-12 sm:h-14 bg-[#7C5CFF] hover:bg-[#6B4FE0] text-sm sm:text-base text-white"
            onClick={handleTransaction}
            disabled={!canSubmit()}
          >
            {getButtonText()}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}