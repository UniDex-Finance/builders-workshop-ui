'use client'

import { useState } from "react"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { useReferrals } from "../../../hooks/use-referrals"
import { useReferralSubmit } from "../../../hooks/use-referral-submit"
import { useToast } from "../../../hooks/use-toast"

interface CreateReferralCodeDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateReferralCodeDialog({ isOpen, onClose }: CreateReferralCodeDialogProps) {
  const [codeEntered, setCodeEntered] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { submitReferralCode, error } = useReferrals()
  const { submitCodeToContract } = useReferralSubmit()
  const { toast } = useToast()

  const handleSubmitCode = async () => {
    if (!codeEntered) return

    try {
      setIsSubmitting(true)
      const data = await submitReferralCode(codeEntered)
      if (data) {
        await submitCodeToContract(data.contractAddress, data.calldata)
        onClose()
        setCodeEntered('')
        toast({
          title: "Success",
          description: "Referral code submitted successfully",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to submit referral code",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
        <div className="relative w-[380px] mx-auto max-w-[380px] border border-[#1b1b22] rounded-lg">
          <div className="border-0 shadow-lg relative flex flex-col w-full text-white bg-[#16161d] rounded-lg z-50">
            <div className="flex items-center justify-between p-4 border-b border-[#1b1b22]">
              <div className="text-sm font-medium">Create Referral Code</div>
              <Button
                className="p-1.5 h-auto text-gray-400 hover:text-gray-300 bg-transparent hover:bg-[#22222e] border-none outline-none hover:outline-none ring-0 focus:ring-0"
                onClick={onClose}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-4 h-4"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            <div className="w-full p-4 space-y-3">
              <div className="space-y-3">
                <Input
                  className="h-10 bg-[#22222e] border-[#1b1b22] text-sm"
                  type="text"
                  value={codeEntered}
                  placeholder="Enter Code"
                  onChange={(e) => setCodeEntered(e.target.value)}
                  disabled={isSubmitting}
                />
                <div className="text-xs text-gray-400 bg-[#22222e] p-3 rounded border border-[#1b1b22]">
                  Codes are case-sensitive and assigned on a first-come, first-served basis. If you believe your desired code is already claimed, please contact our team.
                </div>
              </div>
              {error && <p className="text-sm text-short">{error}</p>}
              <Button
                className="bg-gradient-to-r from-[#8f42fd] to-[#5a57ff] w-full h-10 text-sm font-medium border-none focus:outline-none hover:outline-none ring-0 focus:ring-0 hover:opacity-90 transition-opacity"
                disabled={!codeEntered || isSubmitting}
                onClick={handleSubmitCode}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Code'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
    </>
  )
}
