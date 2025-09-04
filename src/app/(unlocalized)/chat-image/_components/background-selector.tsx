"use client"

import { useState } from "react"
import Image from "next/image"

interface BackgroundSelectorProps {
  backgrounds: string[]
  onSelect: (backgroundUrl: string) => void
}

export function BackgroundSelector({
  backgrounds,
  onSelect,
}: BackgroundSelectorProps) {
  const [selectedBackground, setSelectedBackground] = useState<string>("")

  const handleSelect = (backgroundUrl: string) => {
    setSelectedBackground(backgroundUrl)
    onSelect(backgroundUrl)
  }

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-4 text-center">
        Escolha o fundo para sua imagem:
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {backgrounds.map((bg, index) => (
          <div
            key={bg}
            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
              selectedBackground === bg
                ? "border-blue-500 ring-2 ring-blue-200"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => handleSelect(bg)}
          >
            <Image
              src={bg}
              alt={`Background ${index + 1}`}
              width={120}
              height={80}
              className="w-full h-20 object-cover"
              unoptimized
            />
            {selectedBackground === bg && (
              <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {selectedBackground && (
        <p className="text-sm text-gray-600 text-center mt-3">
          Fundo selecionado! Clique em &ldquo;Continuar&rdquo; para
          prosseguir.
        </p>
      )}
    </div>
  )
}