"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface CustomSliderProps {
  min?: number
  max?: number
  step?: number
  defaultValue?: number
  onChange?: (value: number) => void
  className?: string
}

export default function CustomSlider({
  min = 0,
  max = 100,
  step = 1,
  defaultValue = 0,
  onChange,
  className,
}: CustomSliderProps) {
  const [value, setValue] = useState(defaultValue)
  const [isDragging, setIsDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  const percentage = ((value - min) / (max - min)) * 100

  // Generate tick marks
  const tickCount = 10
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const tickPercentage = (i / tickCount) * 100
    const isKeyTick = tickPercentage === 25 || tickPercentage === 50 || tickPercentage === 75
    return { percentage: tickPercentage, isKey: isKeyTick }
  })

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return

    const rect = trackRef.current.getBoundingClientRect()
    const clickPosition = e.clientX - rect.left
    const newPercentage = (clickPosition / rect.width) * 100
    const newValue = Math.round((newPercentage / 100) * (max - min) + min)

    setValue(Math.max(min, Math.min(max, newValue)))
    onChange?.(Math.max(min, Math.min(max, newValue)))
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !trackRef.current) return

    const rect = trackRef.current.getBoundingClientRect()
    const movePosition = e.clientX - rect.left
    const newPercentage = (movePosition / rect.width) * 100
    const newValue = Math.round((newPercentage / 100) * (max - min) + min)

    setValue(Math.max(min, Math.min(max, newValue)))
    onChange?.(Math.max(min, Math.min(max, newValue)))
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  return (
    <div className={cn("w-full max-w-md mx-auto mb-6", className)}>
      <div
        ref={trackRef}
        className="relative h-2.5 bg-muted/50 rounded-full cursor-pointer"
        onClick={handleTrackClick}
        onMouseDown={handleMouseDown}
      >
        {/* Ticks */}
        {ticks.map((tick, i) => (
          <div
            key={i}
            className={cn("absolute top-0 w-px h-1.5 -translate-x-1/2", tick.isKey ? "bg-white" : "bg-gray-600")}
            style={{ left: `${tick.percentage}%`, top: "calc(50% - 0.75px)" }}
          />
        ))}

        {/* Progress Track */}
        <div
          className="absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-full bg-white"
          style={{
            width: `${percentage}%`,
            boxShadow: "0 0 8px 1px rgba(255, 255, 255, 0.7)",
          }}
        />

        {/* Percentage Label - smaller font */}
        <div
          className="absolute top-full mt-1 text-white text-xs font-medium"
          style={{
            left: percentage === 0 ? "0%" : `${percentage}%`,
            transform: percentage === 0 ? "none" : "translateX(-50%)",
            textAlign: percentage === 0 ? "left" : "center",
          }}
        >
          {Math.round(percentage)}%
        </div>
      </div>
    </div>
  )
}

