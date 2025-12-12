"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"

interface BaseDrawerProps {
  children: ReactNode
  contentHeight?: number
}

export function BaseDrawer({ children, contentHeight = 200 }: BaseDrawerProps) {
  const [isOpen, setIsOpen] = useState(true)

  const handleHeight = 32
  const openHeight = contentHeight + handleHeight
  const closedHeight = handleHeight

  const currentHeight = isOpen ? openHeight : closedHeight

  const handleToggle = () => {
    setIsOpen((prev) => !prev)
  }

  return (
    <div
      className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-md rounded-t-2xl border-t border-white/10 shadow-2xl transition-[height] duration-200 ease-out"
      style={{ height: currentHeight }}
    >
      <button onClick={handleToggle} className="flex items-center justify-center w-full h-8 cursor-pointer">
        {isOpen ? <ChevronDown className="h-5 w-5 text-white/60" /> : <ChevronUp className="h-5 w-5 text-white/60" />}
      </button>

      {/* Content */}
      <div
        className="overflow-hidden transition-opacity duration-200 ease-out"
        style={{
          height: contentHeight,
          opacity: isOpen ? 1 : 0,
        }}
      >
        {children}
      </div>
    </div>
  )
}
