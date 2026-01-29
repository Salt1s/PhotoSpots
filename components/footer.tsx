"use client"

import { Github, Mail, MessageCircle } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 md:justify-end md:space-x-4 max-w-[1400px] mx-auto">
        <div className="flex items-center space-x-4">
          <Link 
            href="https://t.me/sa1tis" 
            target="_blank"
            className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            <span>@sa1tis</span>
          </Link>
          <Link 
            href="mailto:alekseibaruzdin@gmail.com"
            className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Mail className="h-4 w-4" />
            <span>alekseibaruzdin@gmail.com</span>
          </Link>
          <Link 
            href="https://github.com/Salt1s"
            target="_blank"
            className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="h-4 w-4" />
            <span>@Salt1s</span>
          </Link>
        </div>
      </div>
    </footer>
  )
} 