import React, { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExternalLink } from 'lucide-react';
import { useChainId } from 'wagmi';

export function Footer() {
  const chainId = useChainId();
  const [buildId, setBuildId] = useState<string>('');

  useEffect(() => {
    const metaBuildId = (document.querySelector('meta[name="build-id"]') as HTMLMetaElement)?.content;
    setBuildId(metaBuildId || 'development');
  }, []);

  const chainName =
    {
      42161: 'Arbitrum',
      10: 'Optimism',
      11155111: 'Sepolia',
    }[chainId] ?? 'Not Connected';

  return (
    <footer className='fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between h-10 px-4 border-t bg-background border-border'>
      <div className='flex items-center space-x-3'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className='bg-green-500 text-white text-xs px-2 py-0.5 rounded flex items-center'>
                <span className='mr-1.5 h-1.5 w-1.5 rounded-full bg-white animate-pulse' />
                Operational
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className='text-sm'>All systems operational</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <a
          href='https://discord.gg/W2TByeuD7R'
          target='_blank'
          rel='noopener noreferrer'
          className='flex items-center text-sm text-muted-foreground hover:text-primary'
        >
          <span className='hidden sm:inline'>Help & Support</span>
          <span className='sm:hidden'>Get Support</span>
          <ExternalLink className='w-3 h-3 ml-1' />
        </a>
      </div>

      <div className='flex items-center space-x-3'>
        <div className='hidden text-sm sm:block text-muted-foreground'>{chainName}</div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className='text-sm text-muted-foreground'>v1.0.0</span>
            </TooltipTrigger>
            <TooltipContent>
              <p className='text-sm'>Build: {buildId}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </footer>
  );
}
