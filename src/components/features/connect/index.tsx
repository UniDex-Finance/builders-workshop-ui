'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { ChevronLeft } from 'lucide-react'
import { Button } from "../../ui/button"
import { useConnect, Connector, useAccount } from 'wagmi'
import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { useSmartAccount } from '@/hooks/use-smart-account'
import { useToast } from '@/hooks/use-toast'
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon'
import { useRouter } from 'next/navigation'

export function ConnectDashboard() {
  const { openConnectModal } = useConnectModal()
  const { connect, connectors } = useConnect()
  const { theme } = useTheme()
  const { address: eoaAddress, isConnected } = useAccount()
  const router = useRouter()
  const { 
    smartAccount, 
    setupSessionKey, 
    isSigningSessionKey, 
    predictedAddress 
  } = useSmartAccount()
  const { toast } = useToast()
  
  // Add step state to control which UI to show
  const [step, setStep] = useState<'connect' | 'setup' | 'dashboard'>('connect')
  // Add loading state to prevent flashing of wrong UI
  const [isLoading, setIsLoading] = useState(true)

  // Debug available connectors
  useEffect(() => {
    console.log('Available connectors:', connectors.map(c => ({ id: c.id, name: c.name })))
  }, [connectors])

  // Skip directly to appropriate step based on connection status (run once on mount)
  useEffect(() => {
    console.log('Checking connection status on mount:')
    
    // Add a small delay to ensure all providers have initialized
    const timer = setTimeout(() => {
      console.log('isConnected:', isConnected)
      console.log('eoaAddress:', eoaAddress)
      console.log('smartAccount address:', smartAccount?.address)
      
      // If connected with EOA and smart account, direct user to dashboard
      if (isConnected && smartAccount?.address) {
        setStep('dashboard')
        console.log('Setting step to dashboard - wallet and trading account connected')
      }
      // If connected with EOA but no smart account, direct user to create smart account
      else if (isConnected && !smartAccount?.address) {
        setStep('setup')
        console.log('Setting step to setup - wallet connected but needs trading account')
      } else {
        setStep('connect')
        console.log('Setting step to connect - no wallet connected')
      }
      
      setIsLoading(false)
    }, 1000) // 1 second delay to ensure all providers have loaded
    
    return () => clearTimeout(timer)
  }, []) // Empty array means run only once on mount

  // Also watch for changes in connection state
  useEffect(() => {
    if (isLoading) return // Skip if initial loading is still happening
    
    console.log('Connection state changed:')
    console.log('isConnected:', isConnected)
    console.log('smartAccount address:', smartAccount?.address)
    
    if (isConnected && smartAccount?.address) {
      setStep('dashboard')
    } else if (isConnected && !smartAccount?.address) {
      setStep('setup')
    } else if (!isConnected) {
      setStep('connect')
    }
  }, [isConnected, smartAccount?.address, isLoading])

  // Find specific connectors - use correct IDs
  const metaMaskConnector = connectors.find(c => c.id === 'metaMask')
  const coinbaseWalletConnector = connectors.find(c => c.id === 'coinbaseWallet')
  const walletConnectConnector = connectors.find(c => c.id === 'walletConnect')
  const injectedConnector = connectors.find(c => c.id === 'injected')

  // Handler to connect with a specific connector
  const connectWithConnector = (connector: Connector | undefined, fallbackToModal = true) => {
    if (connector) {
      connect({ connector })
    } else if (fallbackToModal) {
      // Fallback to the modal if connector not found or wallet not installed
      openConnectModal?.()
    }
  }

  const handleSetupSmartAccount = async () => {
    try {
      await setupSessionKey();
      setStep('dashboard');
      toast({
        title: "Success",
        description: "Trading account successfully created",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to setup trading account",
        variant: "destructive",
      });
    }
  };

  // Extract wallet options for cleaner rendering - reordered as requested
  const walletOptions = [
    {
      name: 'Browser Wallet',
      // Using the modal for Browser Wallet to show all options
      connector: undefined,
      icon: '/static/images/protocols/browserwallet.svg',
      action: openConnectModal
    },
    {
      name: 'MetaMask',
      connector: metaMaskConnector,
      icon: '/static/images/protocols/metamask.svg'
    },
    {
      name: 'WalletConnect',
      connector: walletConnectConnector,
      icon: '/static/images/protocols/walletconnect.svg'
    },
    {
      name: 'Coinbase Wallet',
      connector: coinbaseWalletConnector,
      icon: '/static/images/protocols/coinbasewallet.svg'
    },
    {
      name: 'Rabby Wallet',
      // Rabby may use injected connector if available
      connector: injectedConnector,
      icon: '/static/images/protocols/rabby.png'
    }
  ]

  // Render the wallet connection UI based on the step state
  const renderConnectionUI = () => {
    if (step === 'connect') {
      // Step 1: Not connected - show wallet options
      return (
        <div className="space-y-2">
          {walletOptions.map((option) => (
            <Button 
              key={option.name}
              variant="outline" 
              className="w-full justify-start py-3 pl-4 text-sm bg-[#1a1a1a] hover:bg-[#3e2370] border-0 text-foreground hover:text-white rounded-xl transition-colors"
              onClick={() => {
                console.log(`Connecting to ${option.name}...`);
                // Use custom action if provided, otherwise use standard connector logic
                if (option.action) {
                  option.action();
                } else {
                  connectWithConnector(option.connector);
                }
              }}
            >
              <div className="w-7 h-7 mr-3 flex items-center justify-center">
                <Image 
                  src={option.icon}
                  alt={option.name}
                  width={24} 
                  height={24} 
                />
              </div>
              {option.name}
            </Button>
          ))}
        </div>
      )
    } else if (step === 'setup') {
      // Step 2: Connected but no smart account - show setup UI
      return (
        <div className="space-y-4">
          {eoaAddress && (
            <div className="flex items-start space-x-3 p-3 bg-[#1a1a1a] rounded-xl">
              <div className="mt-1">
                <Jazzicon diameter={24} seed={jsNumberForAddress(eoaAddress)} />
              </div>
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">Connected Wallet</div>
                <div className="font-mono text-sm">
                  {`${eoaAddress.slice(0, 6)}...${eoaAddress.slice(-4)}`}
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="text-sm text-foreground mb-1">
              Now, let's get you signed up by generating a <span className="text-[#8062f1]">trading account</span> linked to your wallet.
            </div>
            <p className="text-xs text-muted-foreground">
              This will generate a unique smart wallet only you have custody over & logging you in to UniDex.
            </p>
            {predictedAddress && (
              <div className="text-xs text-muted-foreground">
                Your trading account address will be: <span className="font-mono">{`${predictedAddress.slice(0, 6)}...${predictedAddress.slice(-4)}`}</span>
              </div>
            )}
          </div>
          
          <Button 
            className="w-full bg-[#8062f1] hover:bg-[#6c4fe0] text-white py-3 rounded-xl transition-colors"
            onClick={handleSetupSmartAccount}
            disabled={isSigningSessionKey}
          >
            {isSigningSessionKey ? (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white rounded-full animate-spin border-t-transparent" />
                Setting up...
              </div>
            ) : (
              "Create Trading Account"
            )}
          </Button>
        </div>
      )
    } else {
      // Step 3: Everything set up - show success and redirect buttons with more cinematic design
      return (
        <div className="space-y-6">
          {/* Success message with emphasis */}
          <div className="text-center space-y-3 mb-4">
            <div className="text-2xl font-medium text-white">
              Your <span className="text-[#8062f1]">trading account</span> is now ready to use!
            </div>
            <p className="text-sm text-gray-400">
              Pick your own adventure with UniDex
            </p>
          </div>
          
          <div className="grid gap-4">
            <Link href="/" className="block w-full">
              <div className="relative h-32 group overflow-hidden rounded-xl border border-[#2c2c2c] hover:border-[#8062f1] transition-all hover:shadow-lg hover:shadow-[#8062f1]/10">
                <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a] from-40% via-[#1a1a1a]/90 via-60% to-transparent to-85% z-10"></div>
                <div className="absolute right-0 top-0 h-full w-3/5 opacity-40 group-hover:opacity-70 transition-opacity">
                  <Image 
                    src="/static/images/trading-chart.png" 
                    alt="Trading"
                    fill
                    className="object-cover object-right"
                  />
                </div>
                <div className="absolute inset-0 flex items-center z-20">
                  <div className="p-6 max-w-[60%]">
                    <div className="text-xl font-medium text-white group-hover:text-[#8062f1] transition-colors">Trade Perps</div>
                    <div className="text-sm text-gray-400 mt-1">Leverage perpetual futures trading</div>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link href="/proswaps" className="block w-full">
              <div className="relative h-32 group overflow-hidden rounded-xl border border-[#2c2c2c] hover:border-[#8062f1] transition-all hover:shadow-lg hover:shadow-[#8062f1]/10">
                <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a] from-40% via-[#1a1a1a]/90 via-60% to-transparent to-85% z-10"></div>
                <div className="absolute right-0 top-0 h-full w-3/5 opacity-40 group-hover:opacity-70 transition-opacity">
                  <Image 
                    src="/static/images/swap-tokens.png" 
                    alt="Swap Tokens"
                    fill
                    className="object-cover object-right"
                  />
                </div>
                <div className="absolute inset-0 flex items-center z-20">
                  <div className="p-6 max-w-[60%]">
                    <div className="text-xl font-medium text-white group-hover:text-[#8062f1] transition-colors">Swap Tokens</div>
                    <div className="text-sm text-gray-400 mt-1">Exchange tokens with low fees</div>
                  </div>
                </div>
              </div>
            </Link>
            
            <Link href="/usdm" className="block w-full">
              <div className="relative h-32 group overflow-hidden rounded-xl border border-[#2c2c2c] hover:border-[#8062f1] transition-all hover:shadow-lg hover:shadow-[#8062f1]/10">
                <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a1a] from-40% via-[#1a1a1a]/90 via-60% to-transparent to-85% z-10"></div>
                <div className="absolute right-0 top-0 h-full w-3/5 opacity-40 group-hover:opacity-70 transition-opacity">
                  <Image 
                    src="/static/images/market-make.png" 
                    alt="Market Make"
                    fill
                    className="object-cover object-right"
                  />
                </div>
                <div className="absolute inset-0 flex items-center z-20">
                  <div className="p-6 max-w-[60%]">
                    <div className="text-xl font-medium text-white group-hover:text-[#8062f1] transition-colors">Market Make</div>
                    <div className="text-sm text-gray-400 mt-1">Provide liquidity and earn rewards</div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      )
    }
  }

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-2 border-[#8062f1] rounded-full animate-spin border-t-transparent" />
          <div className="mt-4 text-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Full width content */}
      <div className="w-full bg-background flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-6">
          <div className="flex flex-col items-center">
            {/* Updated logo with theme support */}
            <div className="mb-8 flex justify-center">
              {/* Desktop Logo */}
              <div className="hidden md:block">
                <Image 
                  src={theme === 'light' ? '/static/images/logo-large-dark.png' : '/static/images/logo-large.png'} 
                  alt="UniDex Logo" 
                  width={140} 
                  height={42}
                  priority
                  className="object-contain"
                />
              </div>
              {/* Mobile Logo */}
              <div className="block md:hidden">
                <Image 
                  src={theme === 'light' ? '/static/images/logo-small-dark.png' : '/static/images/logo-small.png'} 
                  alt="UniDex Logo" 
                  width={40} 
                  height={40}
                  priority
                  className="object-contain"
                />
              </div>
            </div>
            
            {/* Wallet options in container style */}
            <div className="bg-[#252525] rounded-xl p-4 w-full max-w-[400px] border border-[#252525] mx-auto">
              <div className="text-xs text-foreground mb-3 text-center">
                {step === 'connect' 
                  ? <span>Connect a <span className="text-[#8062f1]">browser wallet</span> to continue.</span>
                  : step === 'setup' 
                    ? <span>Create your <span className="text-[#8062f1]">trading account</span> to start using UniDex.</span>
                    : null
                }
              </div>
              
              {renderConnectionUI()}
            </div>
          </div>

          {/* Back button moved to bottom of content area */}
          <div className="flex justify-center my-4">
            <Link href="/" className="flex items-center text-foreground opacity-80 hover:opacity-100 space-x-2 transition">
              <ChevronLeft size={16} />
              <span>Back to app</span>
            </Link>
          </div>

          <div className="text-center text-sm text-gray-500">
            © 2025 UniDex Exchange
          </div>
        </div>
      </div>
    </div>
  )
} 