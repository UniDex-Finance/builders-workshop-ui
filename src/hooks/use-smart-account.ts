import { useCallback, useEffect, useState } from 'react';
import { useWalletClient, useAccount } from 'wagmi';
import { signerToEcdsaValidator } from "@zerodev/ecdsa-validator";
import { KERNEL_V3_1 } from "@zerodev/sdk/constants";
import { createKernelAccount, createKernelAccountClient, createZeroDevPaymasterClient  } from "@zerodev/sdk";
import { ENTRYPOINT_ADDRESS_V07 } from "permissionless";
import { walletClientToSmartAccountSigner } from 'permissionless';
import { http, createPublicClient} from 'viem';
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

const bundlerRpcUrl = process.env.NEXT_PUBLIC_BUNDLER_RPC_URL;
const PAYMASTER_RPC = process.env.NEXT_PUBLIC_PAYMASTER_RPC;
const ARBITRUM_RPC = process.env.NEXT_PUBLIC_ARBITRUM_RPC || "https://arb1.arbitrum.io/rpc";

// Create a dedicated Arbitrum public client
const arbitrumPublicClient = createPublicClient({
  chain: arbitrum,
  transport: http(ARBITRUM_RPC)
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
        console.log('Found stored session, attempting to initialize...'); // Debug log
        const kernelAccount = await deserializePermissionAccount(
          publicClient,
          ENTRYPOINT_ADDRESS_V07,
          KERNEL_V3_1,
          storedSessionKey
        );

        console.log('Kernel account deserialized:', kernelAccount.address); // Debug log

        const kernelPaymaster = createZeroDevPaymasterClient({
          chain: arbitrum,
          entryPoint: ENTRYPOINT_ADDRESS_V07,
          transport: http(PAYMASTER_RPC),
        });

        const client = createKernelAccountClient({
          account: kernelAccount,
          entryPoint: ENTRYPOINT_ADDRESS_V07,
          chain: arbitrum,
          bundlerTransport: http(bundlerRpcUrl),
          middleware: {
            sponsorUserOperation: kernelPaymaster.sponsorUserOperation,
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

        console.log('Session initialization complete'); // Debug log
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

      // Ensure we're on Arbitrum network before proceeding
      const networkSwitch = await ensureArbitrumNetwork(chain?.id, walletClient);
      if (!networkSwitch.success) {
        throw new Error(networkSwitch.error || 'Failed to switch network');
      }

      setIsNetworkSwitching(false);

      // Rest of the existing setupSessionKey code
      const sessionPrivateKey = generatePrivateKey();
      const privKeyAccount = privateKeyToAccount(sessionPrivateKey);

      const sessionKeySigner = await toECDSASigner({
        signer: privKeyAccount,
      });

      const smartAccountSigner = walletClientToSmartAccountSigner(walletClient);

      const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
        signer: smartAccountSigner,
        entryPoint: ENTRYPOINT_ADDRESS_V07,
        kernelVersion: KERNEL_V3_1
      });

      const kernelAccount = await createKernelAccount(publicClient, {
        plugins: {
          sudo: ecdsaValidator,
          regular: await toPermissionValidator(publicClient, {
            entryPoint: ENTRYPOINT_ADDRESS_V07,
            signer: sessionKeySigner,
            policies: [toSudoPolicy({})],
            kernelVersion: KERNEL_V3_1
          })
        },
        entryPoint: ENTRYPOINT_ADDRESS_V07,
        kernelVersion: KERNEL_V3_1
      });

      const serializedSessionKey = await serializePermissionAccount(
        kernelAccount,
        sessionPrivateKey
      );
      localStorage.setItem('sessionKey', serializedSessionKey);

      const kernelPaymaster = createZeroDevPaymasterClient({
        chain: arbitrum,
        entryPoint: ENTRYPOINT_ADDRESS_V07,
        transport: http(PAYMASTER_RPC),
      });

      const client = createKernelAccountClient({
        account: kernelAccount,
        entryPoint: ENTRYPOINT_ADDRESS_V07,
        chain: arbitrum,
        bundlerTransport: http(bundlerRpcUrl),
        middleware: {
          sponsorUserOperation: kernelPaymaster.sponsorUserOperation,
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
    revokeCurrentSession
  };
}