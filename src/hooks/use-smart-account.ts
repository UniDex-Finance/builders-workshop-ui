import { useCallback, useEffect, useState } from 'react';
import { useWalletClient, useAccount } from 'wagmi';
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { KERNEL_V3_1, getEntryPoint } from "@zerodev/sdk/constants";
import { createKernelAccount, createKernelAccountClient, createZeroDevPaymasterClient  } from "@zerodev/sdk";
import { http, createPublicClient, fallback } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { toECDSASigner } from "@zerodev/permissions/signers";
import {
  deserializePermissionAccount,
  serializePermissionAccount,
  toPermissionValidator
} from "@zerodev/permissions";
import { toSudoPolicy } from "@zerodev/permissions/policies";
import { arbitrum } from 'viem/chains';
import { ensureArbitrumNetwork } from './use-network-switch';
import { getValidatorAddress } from "@zerodev/ecdsa-validator";
import { getContract } from "viem";

const bundlerRpcUrl = process.env.NEXT_PUBLIC_BUNDLER_RPC_URL;
const PAYMASTER_RPC = process.env.NEXT_PUBLIC_PAYMASTER_RPC;
const ARBITRUM_RPC = process.env.NEXT_PUBLIC_ARBITRUM_RPC || "https://arb1.arbitrum.io/rpc";

// Create a dedicated Arbitrum public client
const arbitrumPublicClient = createPublicClient({
  chain: arbitrum,
  transport: fallback([
    http(ARBITRUM_RPC),                 // Try ENV variable first
    http('https://rpc.ankr.com/arbitrum'), // Fallback 1
    http('https://arb1.arbitrum.io/rpc')  // Fallback 2 (original default)
  ])
});

export function useSmartAccount() {
  const { data: walletClient } = useWalletClient();
  const { chain } = useAccount();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [smartAccount, setSmartAccount] = useState<any>(null);
  const [kernelClient, setKernelClient] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSigningSessionKey, setIsSigningSessionKey] = useState(false);
  const [sessionKeyAddress, setSessionKeyAddress] = useState<string | null>(null);
  const [isNetworkSwitching, setIsNetworkSwitching] = useState(false);
  const [predictedAddress, setPredictedAddress] = useState<string | null>(null);

  // Use Arbitrum chain and client regardless of connected chain
  const getChainConfig = useCallback(() => {
    return {
      chain: arbitrum,
      publicClient: arbitrumPublicClient
    };
  }, []);

  useEffect(() => {
    if (smartAccount?.address && !isInitialized) {
      setIsInitialized(true);
    }
  }, [smartAccount?.address, isInitialized]);

  const triggerReload = useCallback(() => {
    sessionStorage.setItem('sessionKeyJustCreated', 'true');
    window.location.reload();
  }, []);

  const updateAccountState = useCallback((kernelAccount: any, client: any) => {
    Promise.all([
      new Promise(resolve => {
        setSmartAccount(kernelAccount);
        resolve(null);
      }),
      new Promise(resolve => {
        setKernelClient(client);
        resolve(null);
      }),
      new Promise(resolve => {
        setSessionKeyAddress(kernelAccount.address);
        resolve(null);
      }),
      new Promise(resolve => {
        setIsInitialized(true);
        resolve(null);
      }),
      new Promise(resolve => {
        setIsInitializing(false);
        resolve(null);
      })
    ]);
  }, []);

  const initializeFromStoredSession = useCallback(async () => {
    const { publicClient } = getChainConfig();

    setIsInitializing(true);
    const storedSessionKey = localStorage.getItem('sessionKey');

    const justCreated = sessionStorage.getItem('sessionKeyJustCreated');
    if (justCreated) {
      sessionStorage.removeItem('sessionKeyJustCreated');
    }

    if (storedSessionKey) {
      try {
        const kernelAccount = await deserializePermissionAccount(
          publicClient,
          getEntryPoint("0.7"),
          KERNEL_V3_1,
          storedSessionKey
        );


        const kernelPaymaster = createZeroDevPaymasterClient({
          chain: arbitrum,
          transport: http(PAYMASTER_RPC),
        });

        const client = createKernelAccountClient({
          account: kernelAccount,
          chain: arbitrum,
          client: publicClient,
          bundlerTransport: http(bundlerRpcUrl),
          paymaster: {
            getPaymasterData(userOperation) {
              return kernelPaymaster.sponsorUserOperation({ userOperation })
            }
          }
        });

        // Make sure we wait for state updates to complete
        await Promise.all([
          new Promise<void>(resolve => {
            setSmartAccount(kernelAccount);
            resolve();
          }),
          new Promise<void>(resolve => {
            setKernelClient(client);
            resolve();
          }),
          new Promise<void>(resolve => {
            setSessionKeyAddress(kernelAccount.address);
            resolve();
          }),
          new Promise<void>(resolve => {
            setIsInitialized(true);
            resolve();
          })
        ]);

        if (justCreated) {
          window.dispatchEvent(new CustomEvent('showSuccessToast', {
            detail: { message: '1CT Account successfully created' }
          }));
        }

        return true;
      } catch (err) {
        console.error('Failed to initialize from stored session:', err);
        localStorage.removeItem('sessionKey');
        setIsInitialized(false);
        return false;
      } finally {
        setIsInitializing(false);
      }
    }
    setIsInitializing(false);
    setIsInitialized(false);
    return false;
  }, [getChainConfig]);

  // Run initialization immediately when the component mounts
  useEffect(() => {
    const initialize = async () => {
      if (!isInitialized && !isInitializing) {
        await initializeFromStoredSession();
      }
    };
    initialize();
  }, [initializeFromStoredSession, isInitialized, isInitializing]);

  // Make sure we catch when wallet changes
  useEffect(() => {
    if (walletClient && !isInitialized && !isInitializing) {
      initializeFromStoredSession();
    }
  }, [walletClient, isInitialized, isInitializing, initializeFromStoredSession]);

  const setupSessionKey = useCallback(async () => {
    if (!walletClient || !bundlerRpcUrl) return;
    const { publicClient } = getChainConfig();

    try {
      setIsSigningSessionKey(true);
      setError(null);
      setIsNetworkSwitching(true);

      const networkSwitch = await ensureArbitrumNetwork(chain?.id, walletClient);
      if (!networkSwitch.success) {
        throw new Error(networkSwitch.error || 'Failed to switch network');
      }

      setIsNetworkSwitching(false);

      const sessionPrivateKey = generatePrivateKey();
      const privKeyAccount = privateKeyToAccount(sessionPrivateKey);

      const sessionKeySigner = await toECDSASigner({
        signer: privKeyAccount,
      });

      const smartAccountSigner = walletClient;

      const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
        signer: smartAccountSigner,
        entryPoint: getEntryPoint("0.7"),
        kernelVersion: KERNEL_V3_1
      });

      const kernelAccount = await createKernelAccount(publicClient, {
        plugins: {
          sudo: ecdsaValidator,
          regular: await toPermissionValidator(publicClient, {
            entryPoint: getEntryPoint("0.7"),
            signer: sessionKeySigner,
            policies: [toSudoPolicy({})],
            kernelVersion: KERNEL_V3_1
          })
        },
        entryPoint: getEntryPoint("0.7"),
        kernelVersion: KERNEL_V3_1
      });

      const serializedSessionKey = await serializePermissionAccount(
        kernelAccount,
        sessionPrivateKey
      );
      localStorage.setItem('sessionKey', serializedSessionKey);

      const kernelPaymaster = createZeroDevPaymasterClient({
        chain: arbitrum,
        transport: http(PAYMASTER_RPC),
      });

      const client = createKernelAccountClient({
        account: kernelAccount,
        chain: arbitrum,
        client: publicClient,
        bundlerTransport: http(bundlerRpcUrl),
        paymaster: {
          getPaymasterData(userOperation) {
            return kernelPaymaster.sponsorUserOperation({ userOperation })
          }
        }
      });

      updateAccountState(kernelAccount, client);
      triggerReload();

    } catch (err) {
      console.error('Session key setup error:', err);
      setError(err instanceof Error ? err : new Error('Failed to setup session key'));
      setIsInitialized(false);
    } finally {
      setIsSigningSessionKey(false);
      setIsNetworkSwitching(false);
    }
  }, [walletClient, getChainConfig, updateAccountState, triggerReload, chain?.id]);

  // Keep the original single initialization effect
  useEffect(() => {
    initializeFromStoredSession();
  }, [initializeFromStoredSession]);

  const revokeCurrentSession = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Clear all stored data
      localStorage.removeItem('sessionKey');
      sessionStorage.clear();
      
      // Reset state
      setSmartAccount(null);
      setKernelClient(null);
      setSessionKeyAddress(null);
      setIsInitialized(false);
      
      // Force page refresh
      window.location.reload();
      
      return true;
    } catch (err) {
      console.error('Failed to revoke session:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const predictSmartAccountAddress = useCallback(async () => {
    if (!walletClient) return null;
    const { publicClient } = getChainConfig();

    try {
      const smartAccountSigner = walletClient;
      
      const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
        signer: smartAccountSigner,
        entryPoint: getEntryPoint("0.7"),
        kernelVersion: KERNEL_V3_1
      });

      const kernelAccount = await createKernelAccount(publicClient, {
        plugins: {
          sudo: ecdsaValidator
        },
        entryPoint: getEntryPoint("0.7"),
        kernelVersion: KERNEL_V3_1
      });

      return kernelAccount.address;
    } catch (err) {
      console.error('Failed to predict address:', err);
      return null;
    }
  }, [walletClient, getChainConfig]);

  useEffect(() => {
    if (walletClient && !smartAccount) {
      predictSmartAccountAddress().then(address => {
        setPredictedAddress(address);
      });
    }
  }, [walletClient, smartAccount, predictSmartAccountAddress]);

  return {
    smartAccount,
    kernelClient,
    isLoading,
    error,
    setupSessionKey,
    isSigningSessionKey,
    sessionKeyAddress,
    isInitialized,
    isInitializing,
    isNetworkSwitching,
    revokeCurrentSession,
    predictedAddress
  };
}