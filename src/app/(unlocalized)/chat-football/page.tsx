"use client"

import localFont from "next/font/local"

import { ChatInterface } from "./_components/chat-interface"

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
          <div className="main center-flex">
            <img
              className="website-logo"
              src="/football/images/logo.png"
              alt="logo"
            />
            <div className="header-text center-flex">
              <h1 className="website-title">
                de <span>craque</span>
              </h1>
              <h2 className="website-subtitle">by players.cx</h2>
            </div>
          </div>
          <img
            className="smiling-icon"
            src="/football/images/smile.png"
            alt="smile"
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
    </div>
  )
}
