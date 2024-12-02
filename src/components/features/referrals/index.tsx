'use client'

import { useState } from "react"
import Link from "next/link"
import { Twitter } from 'lucide-react'
import { Header } from "../../shared/Header"
import { Button } from "../../ui/button"
import { Card } from "../../ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table"
import { useReferrals } from "../../../hooks/use-referrals"
import { CreateReferralCodeDialog } from "./CreateReferralCodeDialog"

export function ReferralDashboard() {
  const [createOpen, setCreateOpen] = useState(false)

  const {
    referralData,
    isLoading,
    copySuccess,
    copyReferralUrl,
    generateTweet,
  } = useReferrals()

  const handleCreateOpen = () => setCreateOpen(!createOpen)

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <div className="min-h-screen bg-[#0b0b0e] text-white p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Referral Rebates</h1>
            <p className="text-gray-400">
              By referring traders with your referral code, you can earn a percentage of their trading fees.{" "}
              <Link href="https://docs.unidex.exchange/Leverage-Trading/Referrals" className="text-indigo-400 hover:underline">
                Click to learn more
              </Link>
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="overflow-hidden border border-[#1b1b22] flex flex-col">
              <div className="p-6 space-y-4 bg-[#22222e]">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-4xl font-bold text-white">{referralData?.referralRebate ?? 0}%</div>
                    <div className="text-sm text-gray-400">Your Rebate Rate</div>
                  </div>
                  <div className="w-8 h-8 bg-indigo-400 rounded-full" />
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-[#1b1b22]">
                  <div>
                    <div className="font-semibold text-white">Tier {referralData?.tier ?? 0}</div>
                    <div className="text-sm text-gray-400">Your Tier</div>
                  </div>
                  <Button variant="link" className="text-indigo-400">
                    Tier System
                  </Button>
                </div>
              </div>
              <div className="p-6 bg-[#16161d] text-sm text-gray-400 flex-grow">
                <p className="m-0">
                  A Tier {referralData?.tier ?? 0} status will grant you a {referralData?.referralRebate ?? 0}% rebate on your referee's trading fees; the referral rebates are
                  sent in real time to your margin wallet. The data on this page updates every 4 hours.
                </p>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="p-6 bg-[#16161d] border border-[#1b1b22]">
                <div className="text-4xl font-bold text-white">
                  ${referralData?.totalReferredVolume.toLocaleString('en', { minimumFractionDigits: 2 }) ?? '0.00'}
                </div>
                <div className="text-sm text-gray-400">Referral Total Trading Volume</div>
              </Card>
              
              <Card className="p-6 bg-[#16161d] border border-[#1b1b22]">
                <div className="text-4xl font-bold text-white">
                  ${referralData?.totalRebatesPaid.toLocaleString('en', { minimumFractionDigits: 2 }) ?? '0.00'}
                </div>
                <div className="text-sm text-gray-400">Your Total Earned Referral Rebates</div>
              </Card>
              
              <Card className="p-6 bg-[#16161d] border border-[#1b1b22]">
                <div className="text-4xl font-bold text-white">
                  {referralData?.totalReferredTrades.toLocaleString('en', { minimumFractionDigits: 0 }) ?? '0'}
                </div>
                <div className="text-sm text-gray-400">Total Trades Done by Referred Users</div>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Referral Codes</h2>
              <Button variant="secondary" onClick={handleCreateOpen}>Create</Button>
            </div>
            <p className="text-sm text-gray-400">
              You can create multiple referral codes to attract traders.
            </p>
            
            <Card className="bg-[#16161d] border border-[#1b1b22]">
              <Table className="border-[#1b1b22]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-400">Referral Codes</TableHead>
                    <TableHead className="text-gray-400">Total Volume</TableHead>
                    <TableHead className="text-gray-400">Total Earned Rebates</TableHead>
                    <TableHead className="text-right text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referralData && (
                    <TableRow>
                      <TableCell className="text-white">{referralData.referralCode}</TableCell>
                      <TableCell className="text-white">
                        ${referralData.totalReferredVolume.toLocaleString('en', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-white">
                        ${referralData.totalRebatesPaid.toLocaleString('en', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="secondary" size="sm" className="mr-2" onClick={copyReferralUrl}>
                          {copySuccess || 'Referral URL'}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={generateTweet}>
                          <Twitter className="w-4 h-4" />
                          <span className="ml-2">Tweet</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </div>
      </div>

      <CreateReferralCodeDialog isOpen={createOpen} onClose={handleCreateOpen} />
    </div>
  )
}
