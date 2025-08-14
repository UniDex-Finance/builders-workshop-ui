import { useCallback } from 'react';
import { moltenAbi } from '@/lib/abi/molten';
import { Address, parseUnits, formatUnits } from 'viem';

const MOLTEN_CONTRACT_ADDRESS = "0x66E535e8D2ebf13F49F3D49e5c50395a97C137b1";

interface ChainIdToBridgeId {
  [key: number]: number | undefined;
}

const chainIdToBridgeId: ChainIdToBridgeId = {
    42161: 110, // Arbitrum
    10: 111, // Optimism
    8453: 184,  // Base
    1: 101,   // Mainnet
    146: 332, // Sonic
};


interface UseFindRouteProps {
    fromChainId?: number;
    toChainId?: number;
    amount?: string;
    userAddress?: Address;
}

export const useFindRoute = ({ fromChainId, toChainId, amount, userAddress }: UseFindRouteProps) => {

    const getSendFromArgs = useCallback(() => {
        if (!fromChainId || !toChainId || !amount || !userAddress) {
            return undefined;
        }

        const destinationBridgeId = chainIdToBridgeId[toChainId];
        if (!destinationBridgeId) {
            console.error(`No bridge ID found for chain ID: ${toChainId}`);
            return undefined;
        }
        const parsedAmount = parseUnits(amount as `${number}`, 18);
        // Apply 0.25% slippage. 1 - 0.0025 = 0.9975
        const minAmount = BigInt(parsedAmount) * BigInt(9975) / BigInt(10000);

        const _callParams = {
            refundAddress: userAddress,
            zroPaymentAddress: "0x0000000000000000000000000000000000000000" as Address,
            adapterParams: "0x000100000000000000000000000000000000000000000000000000000000000186a0"
        };

        // Construct _toAddress by removing "0x" and padding.
        const toAddress = `0x000000000000000000000000${userAddress.slice(2)}`;


        return [
            userAddress,        // address _from
            destinationBridgeId,    // uint16 _dstChainId
            toAddress,        // bytes32 _toAddress
            parsedAmount,       // uint256 _amount
            minAmount,       // uint256 _minAmount
            _callParams          // _callParams
        ] as const;

    }, [fromChainId, toChainId, amount, userAddress]);


    const getSendFromData = useCallback(() => {
        const args = getSendFromArgs();
        if (!args) {
            return undefined;
        }

        let value = 0n; // Initialize value as a BigInt
        if (fromChainId) {
            switch (fromChainId) {
                case 42161: // Arbitrum
                value = parseUnits("0.0006", 18);
                break;
                case 10:    // Optimism
                value = parseUnits("0.00022", 18);
                break;
                case 8453:  // Base
                    value = parseUnits("0.00022", 18);
                    break;
                case 146:   // Sonic
                    value = parseUnits("3", 18);
                    break;
                case 1:     // Mainnet
                    value = parseUnits("0.0018", 18);
                    break;
                default:
                    value = 0n; // Default to 0 if no match
            }
        }
        return {
            abi: moltenAbi,
            address: MOLTEN_CONTRACT_ADDRESS,
            functionName: 'sendFrom',
            args,
            value: value, // Add the value here
        } as const;

    }, [getSendFromArgs, fromChainId]); // Add fromChainId as a dependency

    return { getSendFromData, getSendFromArgs };
};
