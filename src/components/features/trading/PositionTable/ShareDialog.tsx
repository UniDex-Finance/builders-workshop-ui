'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent } from "../../../ui/dialog"
import { Button } from "../../../ui/button"
import { Copy, Download, Twitter } from 'lucide-react'
import { Position } from "../../../../hooks/use-positions"
import domtoimage from 'dom-to-image'
import { usePrices } from "../../../../lib/websocket-price-context";

interface ShareDialogProps {
  isOpen: boolean
  onClose: () => void
  position: Position
}

export function ShareDialog({ isOpen, onClose, position }: ShareDialogProps) {
  const [copySuccess, setCopySuccess] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const { prices } = usePrices();
  const basePair = position.market.split("/")[0].toLowerCase();
  const currentPrice = prices[basePair]?.price;

  const calculateFinalPnl = () => {
    const pnlWithoutFees = parseFloat(position.pnl.replace(/[^0-9.-]/g, ""));
    const totalFees =
      parseFloat(position.fees.positionFee) +
      parseFloat(position.fees.borrowFee) +
      parseFloat(position.fees.fundingFee);
    return (pnlWithoutFees - totalFees).toFixed(2);
  };

  const calculateLeverage = () => {
    const sizeValue = parseFloat(position.size.replace(/[^0-9.-]/g, ""));
    const marginValue = parseFloat(position.margin.replace(/[^0-9.-]/g, ""));
    return (sizeValue / marginValue).toFixed(1);
  };

  const formatPnL = (value: string | number) => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return numValue >= 0
      ? `$${numValue.toFixed(2)}`
      : `-$${Math.abs(numValue).toFixed(2)}`;
  };

  const handleCopy = () => {
    const tradeDetails = `${position.market} ${position.isLong ? 'LONG' : 'SHORT'}
Entry: ${position.entryPrice}
Size: ${position.size}
PnL: ${position.pnl}`
    
    navigator.clipboard.writeText(tradeDetails)
      .then(() => {
        setCopySuccess(true)
        setTimeout(() => setCopySuccess(false), 2000)
      })
      .catch(err => console.error('Failed to copy: ', err))
  }

  const handleDownload = () => {
    if (!cardRef.current) return

    const targetEl = cardRef.current
    const scale = 3

    const style = {
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      width: '570px',
      height: '335px'
    }

    const param = {
      height: 335 * scale,
      width: 570 * scale,
      quality: 1,
      style
    }

    domtoimage.toJpeg(targetEl, param).then(dataUrl => {
      const link = document.createElement('a')
      link.download = 'my-trade.jpeg'
      link.href = dataUrl
      link.click()
    })
  }

  const handleShare = () => {
    const tweetText = `I'm currently ${position.isLong ? 'longing' : 'shorting'} ${position.market} through @UniDexFinance's perp aggregator 🌋`
    const encodedTweet = encodeURIComponent(tweetText)
    window.open(`https://twitter.com/intent/tweet?text=${encodedTweet}`, '_blank')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose} modal={true}>
      <DialogContent 
        className="sm:max-w-[650px] bg-zinc-900 border-zinc-700 text-white p-8" 
        onPointerDownOutside={() => onClose()}
      >
        <div 
          ref={cardRef}
          style={{ backgroundImage: `url(/static/images/pnl-card-background${position.isLong ? '' : '-short'}.png)` }}
          className="relative w-[570px] h-[335px] mx-auto mb-4 rounded-lg overflow-hidden bg-cover bg-no-repeat bg-blend-overlay"
        >
          <div className="absolute inset-0 flex flex-col justify-between p-8">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
              <img 
  src="/static/images/logo-large.png" 
  alt="Logo" 
  className="h-auto w-36"
/>
              </div>
            </div>

            {/* Trade Details */}
            <div className="flex items-end justify-between">
              <div className="space-y-10">
                <div className="flex items-center space-x-4">
                  <span className={`text-lg font-medium ${position.isLong ? 'text-long' : 'text-short'}`}>
                    {position.isLong ? 'LONG' : 'SHORT'}
                  </span>
                  <span className="text-lg font-medium">{position.market}</span>
                  <span className="text-lg font-medium">{calculateLeverage()}X</span>
                </div>
                <div className="space-y-2">
                  <div className={`text-3xl ${Number(calculateFinalPnl()) >= 0 ? 'text-long' : 'text-short'}`}>
                    {Number(calculateFinalPnl()) >= 0 ? '+' : ''}{calculateFinalPnl()}%
                  </div>
                  <div className="flex items-center space-x-4 text-base">
                    <div>Entry: ${position.entryPrice}</div>
                    <div>Mark: ${currentPrice?.toFixed(2) || "..."}</div>
                  </div>
                </div>
                <div className="text-base text-blue-400">
                  leverage.unidex.exchange
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            className="flex-1 bg-blue-600 border-none hover:bg-blue-700" 
            onClick={handleCopy}
          >
            <Copy className="w-4 h-4 mr-2" />
            {copySuccess ? 'Copied!' : 'Copy'}
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 bg-blue-600 border-none hover:bg-blue-700" 
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 bg-blue-600 border-none hover:bg-blue-700" 
            onClick={handleShare}
          >
            <Twitter className="w-4 h-4 mr-2" />
            Tweet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}