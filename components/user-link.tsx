"use client"

import Link from "next/link"

interface UserLinkProps {
  username: string
  name?: string
  className?: string
}

export function UserLink({ username, name, className = "" }: UserLinkProps) {
  if (!username || username === "anonymous") {
    return <span className={className}>Аноним</span>
  }

  return (
    <Link
      href={`/profile/${username}`}
      className={`text-blue-600 hover:text-blue-800 hover:underline ${className}`}
    >
      {username}
    </Link>
  )
} 