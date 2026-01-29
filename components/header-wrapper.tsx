"use client"

import Header from "@/components/header"
import { useAuth } from "@/contexts/auth-context"

export function HeaderWrapper() {
  const { isAuthenticated } = useAuth()
  return <Header isAuthenticated={isAuthenticated} />
} 