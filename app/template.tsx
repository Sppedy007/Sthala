"use client"

import { MotionConfig } from "framer-motion"

// Re-mounts on every navigation. The fade is pure CSS so content stays visible before hydration.
// MotionConfig "user" disables transform animations when reduced motion is preferred.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="page-enter">{children}</div>
    </MotionConfig>
  )
}
