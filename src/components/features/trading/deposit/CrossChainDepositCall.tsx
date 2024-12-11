import { createConfig, ChainId } from "@lifi/sdk";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  useAccount,
  usePublicClient,
  useWalletClient,
  useSwitchChain,
} from "wagmi";
import { parseUnits } from "viem";
import { optimism } from "wagmi/chains";
import { useSmartAccount } from "@/hooks/use-smart-account";

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

  const isOnOptimism = chain === optimism.id;

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

    if (isOnOptimism) {
      await handleDeposit();
    } else {
      handleChainSwitch();
    }
  };

  return (
    <Button 
      onClick={handleClick}
      className="w-full h-[52px] bg-indigo-500 hover:bg-indigo-600 text-white"
      disabled={disabled || isLoading}
    >
      {!isOnOptimism 
        ? "Switch to Optimism" 
        : isLoading 
          ? "Processing..." 
          : "Acknowledge terms and deposit"
      }
    </Button>
  );
}
