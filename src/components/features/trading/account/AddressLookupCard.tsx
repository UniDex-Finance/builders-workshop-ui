import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getKernelAddressFromECDSA } from "@zerodev/ecdsa-validator";
import { getValidatorAddress } from "@zerodev/ecdsa-validator";
import { getContract, createPublicClient, http } from 'viem';
import { arbitrum } from 'viem/chains';
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { KERNEL_V3_1 } from "@zerodev/sdk/constants";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const publicClient = createPublicClient({
  chain: arbitrum,
  transport: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC || "https://arb1.arbitrum.io/rpc"),
});

interface AddressLookupCardProps {
  isExpanded: boolean;
  onClose: () => void;
}

export function AddressLookupCard({ isExpanded, onClose }: AddressLookupCardProps) {
  const [mode, setMode] = useState<"wallet" | "agent">("wallet");
  const [inputAddress, setInputAddress] = useState("");
  const [resultAddress, setResultAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupAddress = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!inputAddress) return;
    
    setIsLoading(true);
    setError(null);
    setResultAddress(null);

    try {
      if (mode === "wallet") {
        // Looking up wallet from smart account
        const ecdsaValidatorContract = getContract({
          abi: [
            {
              type: "function",
              name: "ecdsaValidatorStorage",
              inputs: [{ name: "", type: "address", internalType: "address" }],
              outputs: [{ name: "owner", type: "address", internalType: "address" }],
              stateMutability: "view",
            },
          ],
          address: getValidatorAddress(ENTRYPOINT_ADDRESS_V07, KERNEL_V3_1),
          client: publicClient,
        });

        const owner = await ecdsaValidatorContract.read.ecdsaValidatorStorage([
          inputAddress as `0x${string}`,
        ]);
        setResultAddress(owner as string);
      } else {
        // Looking up smart account from wallet
        const smartAccountAddress = await getKernelAddressFromECDSA({
          eoaAddress: inputAddress as `0x${string}`,
          entryPointAddress: ENTRYPOINT_ADDRESS_V07,
          kernelVersion: KERNEL_V3_1,
          index: 0n,
          publicClient
        });
        setResultAddress(smartAccountAddress);
      }
    } catch (err) {
      setError("Failed to lookup address. Please make sure the address is valid.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (value: string) => {
    setMode(value as "wallet" | "agent");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setInputAddress(e.target.value);
  };

  if (!isExpanded) return null;

  return (
    <Card className="p-4 space-y-4 bg-zinc-900/50 border-zinc-800" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <Tabs 
          value={mode} 
          onValueChange={handleModeChange}
          className="w-full"
        >
          <TabsList 
            className="grid w-full grid-cols-2"
            onClick={(e) => e.stopPropagation()}
          >
            <TabsTrigger 
              value="wallet"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              Find Wallet
            </TabsTrigger>
            <TabsTrigger 
              value="agent"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            >
              Find Trading
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
        <Input
          placeholder={`Enter ${mode === "wallet" ? 'trading' : 'wallet'} address`}
          value={inputAddress}
          onChange={handleInputChange}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        />
        <Button 
          onClick={lookupAddress}
          disabled={isLoading || !inputAddress}
          className="w-full"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
        >
          {isLoading ? "Looking up..." : "Lookup"}
        </Button>
      </div>

      {error && (
        <div className="text-red-400 text-sm" onClick={(e) => e.stopPropagation()}>
          {error}
        </div>
      )}

      {resultAddress && (
        <div className="p-3 rounded-md bg-zinc-900 border border-zinc-800" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm text-zinc-400">
            {mode === "wallet" ? "Wallet" : "Trading"} Address:
          </p>
          <p className="font-mono text-sm mt-1">
            {resultAddress}
          </p>
        </div>
      )}
    </Card>
  );
} 