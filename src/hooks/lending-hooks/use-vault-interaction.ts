import { useState, useCallback, useRef, useEffect } from 'react';
import { useSmartAccount } from '../use-smart-account';
import { parseUnits, encodeFunctionData, type Hex, formatUnits, parseEther } from 'viem';
import { useToast } from '@/components/ui/use-toast';
import { useBalances } from '../use-balances';

// --- Debounce Utility (Simple Implementation) ---
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<F>): Promise<ReturnType<F>> => {
    return new Promise((resolve) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        timeoutId = null;
        resolve(func(...args));
      }, waitFor);
    });
  };
}

// --- Constants ---
// TODO: Move sensitive keys/URLs to environment variables
const ENSO_API_URL = "https://api.enso.finance/api/v1/shortcuts/route";
const ENSO_API_KEY = "ffa0bfed-6f6e-4c9a-a53d-becf4d2d2b3e"; // Replace with secure handling
const UNIDEX_WALLET_API_URL = "https://unidexv4-api-production.up.railway.app/api/wallet";

const CHAIN_ID = 42161; // Arbitrum
const SLIPPAGE = 50; // 0.5%
const ROUTING_STRATEGY = 'router';
const USDC_ADDRESS = '0xaf88d065e77c8cc2239327c5edb3a432268e5831'; // Native USDC on Arbitrum
const USDC_DECIMALS = 6;

// Vault Token Addresses (Ensure these match use-lending-balances.ts)
const VAULT_TOKENS = {
  aave: { address: '0x724dc807b04555b71ed48a6896b6f41593b8c637' as Hex, decimals: 6 },
  compound: { address: '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf' as Hex, decimals: 6 },
  fluid: { address: '0x1A996cb54bb95462040408C06122D45D6Cdb6096' as Hex, decimals: 6 },
};

export type VaultProtocol = keyof typeof VAULT_TOKENS;
export type InteractionType = 'deposit' | 'withdraw';

// Minimal ERC20 ABI for approve
const ERC20_ABI_MINIMAL = [
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

interface EnsoRouteResponse {
  gas: string;
  amountOut: string;
  tx: {
    from: Hex;
    to: Hex;
    data: Hex;
    value: string; // String representation of Wei value
  };
  // Potentially other fields
}

interface UseVaultInteractionProps {
  protocol: VaultProtocol;
}

interface VaultInteractionReturn {
  deposit: (amount: string) => Promise<void>;
  withdraw: (amount: string) => Promise<void>;
  fetchQuote: (amount: string, type: InteractionType) => Promise<void>;
  isLoading: boolean;
  isQuoteLoading: boolean;
  isError: boolean;
  error: string | null;
  quoteAmountOut: string | null;
}

interface TransactionCall {
    to: Hex;
    data: Hex;
    value: bigint;
}

export function useVaultInteraction({ protocol }: UseVaultInteractionProps): VaultInteractionReturn {
  const { smartAccount, kernelClient, isInitialized: isSmartAccountInitialized } = useSmartAccount();
  const { toast } = useToast();
  const { balances } = useBalances("arbitrum");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isQuoteLoading, setIsQuoteLoading] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [quoteAmountOut, setQuoteAmountOut] = useState<string | null>(null);

  const lastQuoteResponseRef = useRef<EnsoRouteResponse | null>(null);

  const getVaultToken = useCallback(() => {
    return VAULT_TOKENS[protocol];
  }, [protocol]);

  const fetchEnsoRoute = useCallback(async (
    amountInWei: bigint,
    tokenIn: Hex,
    tokenOut: Hex
  ): Promise<EnsoRouteResponse | null> => {
    if (!smartAccount?.address || !isSmartAccountInitialized) {
      console.warn("Smart account not ready for Enso fetch");
      return null;
    }

    const params = new URLSearchParams({
      chainId: CHAIN_ID.toString(),
      fromAddress: smartAccount.address,
      slippage: SLIPPAGE.toString(),
      routingStrategy: ROUTING_STRATEGY,
      amountIn: amountInWei.toString(),
      tokenIn: tokenIn,
      tokenOut: tokenOut,
    });
    const url = `${ENSO_API_URL}?${params.toString()}`;
    console.log("Fetching Enso route:", url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${ENSO_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
       console.log("Enso response status:", response.status);

      if (!response.ok) {
         const errorBody = await response.text();
         console.error("Enso API Error Body:", errorBody);
         throw new Error(`Enso API error! Status: ${response.status}.`);
      }

      const result: EnsoRouteResponse = await response.json();
       console.log("Enso API Success Response:", result);

      if (!result || !result.tx || !result.tx.to || !result.tx.data || !result.amountOut) {
         throw new Error("Invalid Enso API response structure");
      }

      const finalResult: EnsoRouteResponse = {
          ...result,
          tx: {
              ...result.tx,
              from: result.tx.from as Hex,
              to: result.tx.to as Hex,
              data: result.tx.data as Hex,
          }
      };
      return finalResult;

    } catch (err: any) {
      console.error("Failed to fetch Enso route:", err);
      throw err;
    }
  }, [smartAccount?.address, isSmartAccountInitialized]);

  const fetchQuote = useCallback(async (amount: string, type: InteractionType) => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        setQuoteAmountOut(null);
        lastQuoteResponseRef.current = null;
        return;
    }

    setIsQuoteLoading(true);
    setQuoteAmountOut(null);
    lastQuoteResponseRef.current = null;

    const vaultToken = getVaultToken();
    if (!vaultToken) {
        setIsQuoteLoading(false);
        return;
    }

    try {
        let amountInWei: bigint;
        let tokenIn: Hex;
        let tokenOut: Hex;
        let outputDecimals: number;

        if (type === 'deposit') {
            amountInWei = parseUnits(amount, USDC_DECIMALS);
            tokenIn = USDC_ADDRESS as Hex;
            tokenOut = vaultToken.address;
            outputDecimals = vaultToken.decimals;
        } else {
            amountInWei = parseUnits(amount, vaultToken.decimals);
            tokenIn = vaultToken.address;
            tokenOut = USDC_ADDRESS as Hex;
            outputDecimals = USDC_DECIMALS;
        }

        const routeResponse = await fetchEnsoRoute(amountInWei, tokenIn, tokenOut);

        if (routeResponse && routeResponse.amountOut) {
            const formattedAmount = formatUnits(BigInt(routeResponse.amountOut), outputDecimals);
            const roundedAmount = parseFloat(formattedAmount).toFixed(type === 'deposit' ? 6 : 2);
            setQuoteAmountOut(roundedAmount);
            lastQuoteResponseRef.current = routeResponse;
        } else {
            setQuoteAmountOut(null);
        }

    } catch (err: any) {
        console.error(`Failed to fetch ${type} quote:`, err);
        setQuoteAmountOut(null);
    } finally {
        setIsQuoteLoading(false);
    }
  }, [getVaultToken, fetchEnsoRoute]);

  const deposit = useCallback(async (amount: string) => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    if (!kernelClient || !smartAccount?.address || !balances) {
        toast({ title: "Error", description: "Smart account or balances not ready.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    const vaultToken = getVaultToken();
    if (!vaultToken) {
       toast({ title: "Error", description: `Unsupported protocol: ${protocol}`, variant: "destructive" });
       setIsLoading(false);
       return;
    }
     if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        toast({ title: "Error", description: "Invalid deposit amount.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
      const amountInWei = parseUnits(amount, USDC_DECIMALS);
      const usdcBalance = balances.usdcBalance;
      const musdBalance = balances.musdBalance;

      let shortfall = 0n;
      let withdrawalCall: TransactionCall | null = null;

      if (amountInWei > usdcBalance) {
          shortfall = amountInWei - usdcBalance;
          console.log("Deposit shortfall:", formatUnits(shortfall, USDC_DECIMALS), "USDC");

          const musdValueInUsdcWei = parseUnits(formatUnits(musdBalance, 18), USDC_DECIMALS);

          if (musdValueInUsdcWei >= shortfall) {
              console.log("Margin balance is sufficient. Preparing withdrawal...");
              toast({ title: "Preparing Deposit", description: "Insufficient USDC, preparing withdrawal from margin..." });

              const withdrawalResponse = await fetch(UNIDEX_WALLET_API_URL, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                      type: "withdraw",
                      tokenAddress: USDC_ADDRESS,
                      amount: formatUnits(shortfall, USDC_DECIMALS),
                      userAddress: smartAccount.address,
                  }),
              });

              if (!withdrawalResponse.ok) {
                  const errorBody = await withdrawalResponse.text();
                  console.error("Margin withdrawal API error:", errorBody);
                  throw new Error(`Failed to prepare margin withdrawal: ${withdrawalResponse.statusText}`);
              }

              const withdrawalData = await withdrawalResponse.json();
              if (!withdrawalData.vaultAddress || !withdrawalData.calldata) {
                  throw new Error("Invalid margin withdrawal API response");
              }
              withdrawalCall = {
                  to: withdrawalData.vaultAddress as Hex,
                  data: withdrawalData.calldata as Hex,
                  value: 0n
              };
              console.log("Margin withdrawal prepared:", withdrawalCall);
          } else {
              throw new Error(`Insufficient balance. Need ${formatUnits(shortfall, USDC_DECIMALS)} more USDC.`);
          }
      } else {
           console.log("USDC balance is sufficient for deposit.");
      }

      toast({ title: "Preparing Deposit", description: "Fetching transaction route..." });
      const routeResponse = await fetchEnsoRoute(
        amountInWei,
        USDC_ADDRESS as Hex,
        vaultToken.address
      );

      if (!routeResponse || !routeResponse.tx) {
        throw new Error("Failed to get deposit transaction data from Enso.");
      }

      const approveCalldata = encodeFunctionData({
            abi: ERC20_ABI_MINIMAL,
            functionName: "approve",
            args: [routeResponse.tx.to, amountInWei],
       });
      const depositTxData = {
          to: routeResponse.tx.to,
          data: routeResponse.tx.data,
          value: BigInt(routeResponse.tx.value || '0'),
      };

      toast({ title: "Confirm Transaction", description: "Please approve USDC spending and deposit." });

      const calls: TransactionCall[] = [];
      if (withdrawalCall) {
          calls.push(withdrawalCall);
      }
      calls.push({ to: USDC_ADDRESS as Hex, data: approveCalldata, value: 0n });
      calls.push(depositTxData);

      console.log("Sending transactions:", calls);

      const userOpHash = await kernelClient.sendTransaction({ calls });

      toast({ title: "Processing Deposit", description: `Transaction submitted: ${userOpHash}. Waiting...` });
      toast({ title: "Deposit Success", description: "Your USDC has been deposited." });

    } catch (err: any) {
      console.error("Deposit Transaction Error:", err);
      const message = err.message || "Failed to send deposit transaction.";
      setError(message);
      setIsError(true);
      toast({ title: "Deposit Failed", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [getVaultToken, fetchEnsoRoute, protocol, smartAccount, kernelClient, toast, balances]);

  const withdraw = useCallback(async (amount: string) => {
    setIsLoading(true);
    setIsError(false);
    setError(null);

    if (!kernelClient || !smartAccount?.address) {
        toast({ title: "Error", description: "Smart account not ready.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    const vaultToken = getVaultToken();
    if (!vaultToken) {
       toast({ title: "Error", description: `Unsupported protocol: ${protocol}`, variant: "destructive" });
       setIsLoading(false);
       return;
    }
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        toast({ title: "Error", description: "Invalid withdrawal amount.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
      const amountInWei = parseUnits(amount, vaultToken.decimals);

      toast({ title: "Preparing Withdrawal", description: "Fetching transaction route..." });
      const routeResponse = await fetchEnsoRoute(
        amountInWei,
        vaultToken.address,
        USDC_ADDRESS as Hex
      );

      if (!routeResponse || !routeResponse.tx) {
        throw new Error("Failed to get withdrawal transaction data from Enso.");
      }

      const approveCalldata = encodeFunctionData({
            abi: ERC20_ABI_MINIMAL,
            functionName: "approve",
            args: [routeResponse.tx.to, amountInWei],
       });
       const withdrawTxData = {
           to: routeResponse.tx.to,
           data: routeResponse.tx.data,
           value: BigInt(routeResponse.tx.value || '0'),
       };

      toast({ title: "Confirm Transaction", description: `Approve ${protocol.toUpperCase()} spending & withdraw.` });

      const userOpHash = await kernelClient.sendTransaction({
          calls: [
              { to: vaultToken.address, data: approveCalldata, value: 0n },
              withdrawTxData,
          ],
      });

      toast({ title: "Processing Withdrawal", description: `Transaction submitted: ${userOpHash}. Waiting...` });
      toast({ title: "Withdrawal Success", description: "Your USDC has been withdrawn." });

    } catch (err: any) {
      console.error("Withdrawal Transaction Error:", err);
      const message = err.message || "Failed to send withdrawal transaction.";
      setError(message);
      setIsError(true);
      toast({ title: "Withdrawal Failed", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [getVaultToken, fetchEnsoRoute, protocol, smartAccount, kernelClient, toast]);

  return {
    deposit,
    withdraw,
    fetchQuote,
    isLoading,
    isQuoteLoading,
    isError,
    error,
    quoteAmountOut,
  };
}
