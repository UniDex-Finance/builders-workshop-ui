import { createConfig, ChainId } from "@lifi/sdk";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useSwitchChain,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { arbitrum, optimism, base, mainnet } from "wagmi/chains";
import { useSmartAccount } from "@/hooks/use-smart-account";
import { useState, useEffect } from "react";

// ABI for ERC20 allowance and approve functions
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [
      { "name": "owner", "type": "address" },
      { "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "name": "", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  }
] as const;

// Constants
const ACROSS_SPENDER = "0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE";
const DESTINATION_CHAIN = arbitrum;

// Chain-specific configurations
const CHAIN_CONFIG = {
  [arbitrum.id]: {
    name: "Arbitrum",
    chainId: arbitrum.id,
    usdcAddress: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
    needsApproval: false,
  },
  [optimism.id]: {
    name: "Optimism",
    chainId: optimism.id,
    usdcAddress: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
    needsApproval: true,
  },
  [base.id]: {
    name: "Base",
    chainId: base.id,
    usdcAddress: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    needsApproval: true,
  },
  [mainnet.id]: {
    name: "Ethereum",
    chainId: mainnet.id,
    usdcAddress: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    needsApproval: true,
  },
} as const;

// Destination token (Arbitrum USDC)
const DESTINATION_USDC = "0xaf88d065e77c8cc2239327c5edb3a432268e5831";

createConfig({
  integrator: "unidex",
  rpcUrls: {
    [ChainId.ARB]: ["https://rpc.ankr.com/arbitrum"],
    [ChainId.OPT]: ["https://rpc.ankr.com/optimism"],
    [ChainId.BSC]: ["https://rpc.ankr.com/base"],
  },
});

interface CrossChainDepositCallProps {
  amount?: string;
  onSuccess?: () => void;
  chain?: number;
  isLoading?: boolean;
  disabled?: boolean;
  quoteData?: any;
}

export function CrossChainDepositCall({
  amount = "0",
  onSuccess,
  chain,
  isLoading,
  disabled,
  quoteData,
}: CrossChainDepositCallProps) {
  const { toast } = useToast();
  const { address, chain: currentChain } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { switchChain } = useSwitchChain();
  const { smartAccount } = useSmartAccount();
  const [allowance, setAllowance] = useState<bigint>(BigInt(0));
  const [isCheckingAllowance, setIsCheckingAllowance] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const sourceChainConfig = chain ? CHAIN_CONFIG[chain as keyof typeof CHAIN_CONFIG] : undefined;
  const isSourceChainSupported = !!sourceChainConfig;
  const isOnCorrectChain = currentChain?.id === chain;
  const amountInBaseUnits = amount ? parseUnits(amount, 6) : BigInt(0);
  const needsApproval = isOnCorrectChain && sourceChainConfig?.needsApproval && amountInBaseUnits > allowance;

  // Check allowance when on supported source chain
  useEffect(() => {
    const checkAllowance = async () => {
      if (!isSourceChainSupported || !sourceChainConfig?.needsApproval || !address || !publicClient || !isOnCorrectChain) return;

      setIsCheckingAllowance(true);
      try {
        const currentAllowance = await publicClient.readContract({
          address: sourceChainConfig.usdcAddress,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, ACROSS_SPENDER],
        }) as bigint;
        
        setAllowance(currentAllowance);
        console.log('Current allowance:', formatUnits(currentAllowance, 6));
      } catch (error) {
        console.error('Error checking allowance:', error);
        toast({
          title: "Error",
          description: "Failed to check token allowance",
          variant: "destructive",
        });
      } finally {
        setIsCheckingAllowance(false);
      }
    };

    checkAllowance();
  }, [isSourceChainSupported, sourceChainConfig, address, publicClient, isOnCorrectChain, toast]);

  const handleApprove = async () => {
    if (!address || !walletClient || !publicClient || !sourceChainConfig) return;

    setIsApproving(true);
    try {
      const hash = await walletClient.writeContract({
        address: sourceChainConfig.usdcAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [ACROSS_SPENDER, amountInBaseUnits],
      });

      toast({
        title: "Approval Sent",
        description: "Please wait for the approval transaction to complete",
      });

      await publicClient.waitForTransactionReceipt({ hash });
      
      // Refresh allowance after approval
      const newAllowance = await publicClient.readContract({
        address: sourceChainConfig.usdcAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, ACROSS_SPENDER],
      }) as bigint;
      
      setAllowance(newAllowance);
      
      toast({
        title: "Success",
        description: "Token approval completed successfully",
      });
    } catch (error: any) {
      console.error('Approval error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve token",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleChainSwitch = () => {
    if (!sourceChainConfig) return;
    console.log(`Switching to ${sourceChainConfig.name}...`);
    switchChain?.({ chainId: sourceChainConfig.chainId });
  };

  const handleDeposit = async () => {
    console.log("Starting deposit process...");
    console.log("Amount:", amount);
    console.log("EOA Address:", address);
    console.log("Smart Account Address:", smartAccount?.address);
    console.log("Source Chain:", sourceChainConfig?.name);
    console.log("Destination Chain:", DESTINATION_CHAIN.name);

    if (!address || !walletClient || !publicClient || !smartAccount?.address || !sourceChainConfig) {
      toast({
        title: "Error",
        description:
          "Please connect your wallet and ensure 1CT wallet is setup",
        variant: "destructive",
      });
      return;
    }

    try {
      if (!quoteData?.transactionRequest) {
        throw new Error("No quote data available");
      }

      const { transactionRequest } = quoteData;

      console.log("Sending transaction...");
      const hash = await walletClient.sendTransaction({
        to: transactionRequest.to as `0x${string}`,
        data: transactionRequest.data as `0x${string}`,
        value: BigInt(transactionRequest.value || "0"),
      });
      console.log("Transaction hash:", hash);

      toast({
        title: "Transaction Sent",
        description: "Cross-chain deposit transaction has been sent",
      });

      console.log("Waiting for receipt...");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      console.log("Transaction receipt:", receipt);

      toast({
        title: "Success",
        description: "Cross-chain deposit completed successfully",
      });

      onSuccess?.();
    } catch (error: any) {
      console.error("Deposit error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process cross-chain deposit",
        variant: "destructive",
      });
    }
  };

  const handleClick = async () => {
    if (!sourceChainConfig) return;

    console.log("Button clicked");
    console.log("Source Chain:", sourceChainConfig.name);
    console.log("Current Chain:", currentChain?.id);
    console.log("Target Chain:", chain);

    if (!isOnCorrectChain) {
      handleChainSwitch();
    } else if (needsApproval) {
      await handleApprove();
    } else {
      await handleDeposit();
    }
  };

  const getButtonText = () => {
    if (!sourceChainConfig) return "Unsupported Chain";
    if (!isOnCorrectChain) return `Switch to ${sourceChainConfig.name}`;
    if (isLoading || isCheckingAllowance) return "Processing...";
    if (isApproving) return "Approving...";
    if (needsApproval) return "Approve USDC";
    return "Acknowledge terms and deposit";
  };

  if (!sourceChainConfig) {
    return (
      <Button 
        className="w-full h-[52px] bg-indigo-500 hover:bg-indigo-600 text-white opacity-50"
        disabled={true}
      >
        Unsupported Chain
      </Button>
    );
  }

  return (
    <Button 
      onClick={handleClick}
      className="w-full h-[52px] bg-indigo-500 hover:bg-indigo-600 text-white"
      disabled={disabled || isLoading || isCheckingAllowance || isApproving}
    >
      {getButtonText()}
    </Button>
  );
}
