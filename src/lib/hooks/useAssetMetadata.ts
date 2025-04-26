import { useState, useEffect } from 'react';

interface AssetMetadata {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated?: boolean;
}

export function useAssetMetadata() {
  const [metadata, setMetadata] = useState<AssetMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchMetadata() {
      try {
        setLoading(true);
        const response = await fetch('https://api.hyperliquid.xyz/info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ type: 'meta' }) // Corrected body
        });

        if (!response.ok) {
          throw new Error('Failed to fetch asset metadata');
        }

        const data = await response.json();
        if (data && data.universe) {
          setMetadata(data.universe);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Error fetching asset metadata:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }

    fetchMetadata();
  }, []);

  const getAssetMetadata = (assetName: string): AssetMetadata | undefined => {
    return metadata.find(asset => asset.name === assetName);
  };

  return { metadata, loading, error, getAssetMetadata };
} 