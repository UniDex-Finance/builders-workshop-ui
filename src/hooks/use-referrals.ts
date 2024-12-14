import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useToast } from './use-toast'

type ReferralData = {
  address: string
  referralCode: string
  hasReferralCode: boolean
  totalReferredVolume: number
  totalReferredTrades: number
  totalRebatesPaid: number
  tier: number
  traderRebate: number
  referralRebate: number
}

const REFERRAL_API_URL = 'https://unidexv4-api-production.up.railway.app/api/referrals'

export function useReferrals() {
  const { address } = useAccount()
  const { toast } = useToast()
  const [referralData, setReferralData] = useState<ReferralData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copySuccess, setCopySuccess] = useState<string | null>(null)

  const fetchReferralData = async () => {
    if (!address) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(REFERRAL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'getAddressInfo',
          userAddress: address,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch referral data')
      }

      const data = await response.json()
      setReferralData(data)
    } catch (err) {
      setError('Failed to fetch referral data')
      toast({
        title: 'Error',
        description: 'Failed to fetch referral data',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const submitReferralCode = async (code: string) => {
    if (!address) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(REFERRAL_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'claimCode',
          code,
          userAddress: address,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit referral code')
      }

      const data = await response.json()
      return data
    } catch (err) {
      setError('Failed to submit referral code')
      toast({
        title: 'Error',
        description: 'Failed to submit referral code',
        variant: 'destructive',
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const copyReferralUrl = () => {
    if (referralData?.referralCode) {
      const referralUrl = `https://leverage.unidex.exchange/?ref=${referralData.referralCode}`
      navigator.clipboard
        .writeText(referralUrl)
        .then(() => {
          setCopySuccess('Copied Link')
          toast({
            title: 'Success',
            description: 'Referral link copied to clipboard',
          })
          setTimeout(() => setCopySuccess(null), 3000)
        })
        .catch(() => {
          toast({
            title: 'Error',
            description: 'Failed to copy referral link',
            variant: 'destructive',
          })
        })
    }
  }

  const generateTweet = () => {
    if (referralData?.referralCode) {
      const tweetText = encodeURIComponent(
        `I'm currently using Builders Workshop!\n\nJoin me using my referral link 👇\nhhttps://leverage.unidex.exchange/?ref=${referralData.referralCode}`
      )
      window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank')
    }
  }

  useEffect(() => {
    if (address) {
      fetchReferralData()
    }
  }, [address])

  return {
    referralData,
    isLoading,
    error,
    copySuccess,
    submitReferralCode,
    copyReferralUrl,
    generateTweet,
    refreshData: fetchReferralData,
  }
}
