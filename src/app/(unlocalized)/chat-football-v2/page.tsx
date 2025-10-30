"use client"

import { useState } from "react"
import localFont from "next/font/local"

import { ChatInterface } from "./_components/chat-interface"
import { ContactModal } from "./_components/contact-modal"

import "./football.css"

const agharti = localFont({
  src: [
    {
      path: "./fonts/Agharti-RegularSemiCondensed.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Agharti-BoldSemiCondensed.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/Agharti-BlackSemiCondensed.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-agharti",
})

export default function ChatFootballPage() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)

  return (
    <div className={`${agharti.variable} football-wrapper`}>
      {/* Top Corners */}
      <div className="top-corners">
        <div className="corner top-left"></div>
        <div className="corner top-right"></div>
      </div>

      <div className="football-container">
        {/* Header */}
        <header className="page-header center-flex">
          <img
            className="logo-de-craque"
            src="/football/images/logo_de_craque.png"
            alt="de craque by players.cx"
          />
          <img
            className="smiling-icon"
            src="/football/images/smile.png"
            alt="smile"
            onClick={() => setIsContactModalOpen(true)}
            style={{ cursor: "pointer" }}
          />
        </header>

        {/* Chat Interface */}
        <ChatInterface />
      </div>

      {/* Bottom Corners */}
      <div className="bottom-corners">
        <div className="corner bottom-right"></div>
        <div className="corner bottom-left"></div>
      </div>

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </div>
  )
}
