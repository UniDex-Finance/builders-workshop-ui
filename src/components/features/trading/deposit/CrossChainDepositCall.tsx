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
import { optimism } from "wagmi/chains";
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
const OPTIMISM_USDC = "0x0b2c639c533813f4aa9d7837caf62653d097ff85";

createConfig({
  integrator: "unidex",
  rpcUrls: {
    [ChainId.ARB]: ["https://rpc.ankr.com/arbitrum"],
    [ChainId.OPT]: ["https://rpc.ankr.com/optimism"],
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
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { switchChain } = useSwitchChain();
  const { smartAccount } = useSmartAccount();
  const [allowance, setAllowance] = useState<bigint>(BigInt(0));
  const [isCheckingAllowance, setIsCheckingAllowance] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const isOnOptimism = chain === optimism.id;
  const amountInBaseUnits = amount ? parseUnits(amount, 6) : BigInt(0);
  const needsApproval = isOnOptimism && amountInBaseUnits > allowance;

  // Check allowance when on Optimism
  useEffect(() => {
    const checkAllowance = async () => {
      if (!isOnOptimism || !address || !publicClient) return;

      setIsCheckingAllowance(true);
      try {
        const currentAllowance = await publicClient.readContract({
          address: OPTIMISM_USDC,
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
  }, [isOnOptimism, address, publicClient, toast]);

  const handleApprove = async () => {
    if (!address || !walletClient || !publicClient) return;

    setIsApproving(true);
    try {
      const hash = await walletClient.writeContract({
        address: OPTIMISM_USDC,
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
        address: OPTIMISM_USDC,
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
    console.log("Switching to Optimism...");
    switchChain?.({ chainId: optimism.id });
  };

  const handleDeposit = async () => {
    console.log("Starting deposit process...");
    console.log("Amount:", amount);
    console.log("EOA Address:", address);
    console.log("Smart Account Address:", smartAccount?.address);
    console.log("Wallet Client:", !!walletClient);
    console.log("Public Client:", !!publicClient);

    if (!address || !walletClient || !publicClient || !smartAccount?.address) {
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
    console.log("Button clicked");
    console.log("Is on Optimism:", isOnOptimism);

    if (!isOnOptimism) {
      handleChainSwitch();
    } else if (needsApproval) {
      await handleApprove();
    } else {
      await handleDeposit();
    }
  };

  const getButtonText = () => {
    if (!isOnOptimism) return "Switch to Optimism";
    if (isLoading || isCheckingAllowance) return "Processing...";
    if (isApproving) return "Approving...";
    if (needsApproval) return "Approve USDC";
    return "Acknowledge terms and deposit";
  };

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
