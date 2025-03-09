'use client'

import React, { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

const NewVersionNotification = () => {
  const [showUpdateAlert, setShowUpdateAlert] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') return;

    const checkForNewVersion = async () => {
      try {
        const currentBuildId = (document.querySelector('meta[name="build-id"]') as HTMLMetaElement)?.content
        
        const response = await fetch('/api/build-id')
        const { buildId: latestBuildId } = await response.json()

        if (currentBuildId && latestBuildId && currentBuildId !== latestBuildId) {
          setShowUpdateAlert(true)
        }
      } catch (error) {
        console.error('Failed to check for updates:', error)
      }
    }

    checkForNewVersion()
    const interval = setInterval(checkForNewVersion, 30 * 1000)

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    window.location.reload()
  }

  if (!showUpdateAlert) return null;

  return (
    <motion.div 
      className="fixed z-50 max-w-sm bottom-4 right-4"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Alert className="border border-[#7142cf]/20 bg-[#171717] shadow-lg shadow-[#7142cf]/10 backdrop-blur-sm transition-all duration-300 hover:border-[#7142cf]/30">
        <div className="flex flex-col space-y-4">
          <AlertTitle className="text-lg font-semibold text-white">
            New Version Available
          </AlertTitle>
          <AlertDescription className="space-y-3">
            <p className="text-gray-400">
             A new update is avaliable containing new features, bug fixes, and improvements.
            </p>
            <Button 
              onClick={handleRefresh} 
              className="w-full px-4 py-2 bg-[#7142cf] text-white rounded-lg font-medium
                         transition-all duration-200 hover:bg-[#7142cf]/90 hover:shadow-md
                         hover:shadow-[#7142cf]/20 active:transform active:scale-[0.98]
                         bg-gradient-to-r from-[#7142cf] to-[#7142cf]/80"
            >
              <motion.div 
                className="flex items-center justify-center space-x-2"
                whileTap={{ scale: 0.95 }}
              >
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.span>
                <span>Refresh Now</span>
              </motion.div>
            </Button>
          </AlertDescription>
        </div>
      </Alert>
    </motion.div>
  )
}

export default NewVersionNotification

