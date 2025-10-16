"use client"

import { useState } from "react"

interface BackgroundGalleryProps {
  backgrounds: string[]
  onSelect: (backgroundUrl: string) => void
  onGenerateMore?: () => void
  isGenerating?: boolean
  generationProgress?: number
}

export function BackgroundGallery({
  backgrounds,
  onSelect,
  onGenerateMore,
  isGenerating = false,
  generationProgress = 0,
}: BackgroundGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  const handleCardClick = (index: number) => {
    setSelectedIndex(index)
  }

  const handleCheckClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    setSelectedIndex(index)
    onSelect(backgrounds[index])
  }

  const handleScaleClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    setViewerIndex(index)
    setIsViewerOpen(true)
  }

  const handleViewerNext = () => {
    setViewerIndex((prev) => (prev + 1) % backgrounds.length)
  }

  const handleViewerPrev = () => {
    setViewerIndex((prev) => (prev === 0 ? backgrounds.length - 1 : prev - 1))
  }

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      handleViewerNext()
    } else if (isRightSwipe) {
      handleViewerPrev()
    }
  }

  if (isViewerOpen) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.95)",
          zIndex: 2000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* X Mark */}
        <div
          className="x-mark center-flex"
          onClick={() => setIsViewerOpen(false)}
          style={{ top: "28px", right: "28px", borderColor: "white" }}
        >
          <svg
            className="cross"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 768 768"
            style={{ fill: "white" }}
          >
            <path d="M607.5 205.5l-178.5 178.5 178.5 178.5-45 45-178.5-178.5-178.5 178.5-45-45 178.5-178.5-178.5-178.5 45-45 178.5 178.5 178.5-178.5z"></path>
          </svg>
        </div>

        {/* Image */}
        <div
          style={{
            maxWidth: "90%",
            maxHeight: "80%",
            position: "relative",
            touchAction: "pan-y",
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <img
            src={backgrounds[viewerIndex]}
            alt="Background preview"
            style={{
              maxWidth: "100%",
              maxHeight: "80vh",
              borderRadius: "8px",
              userSelect: "none",
            }}
          />

          {/* Navigation Arrows */}
          <svg
            onClick={handleViewerPrev}
            style={{
              position: "absolute",
              left: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "48px",
              height: "48px",
              cursor: "pointer",
              fill: "white",
              filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))",
            }}
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 768 768"
          >
            <path d="M736 384c0-97.184-39.424-185.248-103.104-248.896s-151.712-103.104-248.896-103.104-185.248 39.424-248.896 103.104-103.104 151.712-103.104 248.896 39.424 185.248 103.104 248.896 151.712 103.104 248.896 103.104 185.248-39.424 248.896-103.104 103.104-151.712 103.104-248.896zM672 384c0 79.552-32.192 151.488-84.352 203.648s-124.096 84.352-203.648 84.352-151.488-32.192-203.648-84.352-84.352-124.096-84.352-203.648 32.192-151.488 84.352-203.648 124.096-84.352 203.648-84.352 151.488 32.192 203.648 84.352 84.352 124.096 84.352 203.648zM512 352h-178.752l73.376-73.376c12.512-12.512 12.512-32.768 0-45.248s-32.768-12.512-45.248 0l-128 128c-3.072 3.072-5.376 6.592-6.944 10.368-1.632 3.904-2.432 8.096-2.432 12.256 0 8.192 3.136 16.384 9.376 22.624l128 128c12.512 12.512 32.768 12.512 45.248 0s12.512-32.768 0-45.248l-73.376-73.376h178.752c17.664 0 32-14.336 32-32s-14.336-32-32-32z"></path>
          </svg>

          <svg
            onClick={handleViewerNext}
            style={{
              position: "absolute",
              right: "16px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "48px",
              height: "48px",
              cursor: "pointer",
              fill: "white",
              filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3))",
            }}
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 768 768"
          >
            <path d="M736 384c0-97.184-39.424-185.248-103.104-248.896s-151.712-103.104-248.896-103.104-185.248 39.424-248.896 103.104-103.104 151.712-103.104 248.896 39.424 185.248 103.104 248.896 151.712 103.104 248.896 103.104 185.248-39.424 248.896-103.104 103.104-151.712 103.104-248.896zM672 384c0 79.552-32.192 151.488-84.352 203.648s-124.096 84.352-203.648 84.352-151.488-32.192-203.648-84.352-84.352-124.096-84.352-203.648 32.192-151.488 84.352-203.648 124.096-84.352 203.648-84.352 151.488 32.192 203.648 84.352 84.352 124.096 84.352 203.648zM256 416h178.752l-73.376 73.376c-12.512 12.512-12.512 32.768 0 45.248s32.768 12.512 45.248 0l128-128c2.944-2.944 5.312-6.464 6.944-10.368 3.232-7.84 3.232-16.672 0-24.512-1.568-3.776-3.872-7.296-6.944-10.368l-128-128c-12.512-12.512-32.768-12.512-45.248 0s-12.512 32.768 0 45.248l73.376 73.376h-178.752c-17.664 0-32 14.336-32 32s14.336 32 32 32z"></path>
          </svg>
        </div>

        {/* Footer */}
        <footer
          className="footer-page center-flex"
          style={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
        >
          <button
            className="footer-btn center-flex"
            onClick={() => {
              onSelect(backgrounds[viewerIndex])
              setIsViewerOpen(false)
            }}
          >
            quero esse fundo
            <svg
              className="arrow-right"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 640"
            >
              <path d="M517.504 288l-194.272-194.272 45.248-45.248 271.52 271.52-271.52 271.52-45.248-45.248 194.272-194.272h-517.504v-64z"></path>
            </svg>
          </button>
        </footer>
      </div>
    )
  }

  return (
    <div className="gallery">
      <div className="gallery-selection">
        {backgrounds.map((bg, index) => (
          <div
            key={index}
            className={`gallery-card ${selectedIndex === index ? "active-card" : ""}`}
            onClick={() => handleCardClick(index)}
          >
            <div
              className="gallery-image"
              style={{ backgroundImage: `url(${bg})` }}
            >
              <svg
                className="check-floating"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 768 768"
              >
                <path d="M617.376 169.376l-329.376 329.376-137.376-137.376c-12.512-12.512-32.768-12.512-45.248 0s-12.512 32.768 0 45.248l160 160c12.512 12.512 32.768 12.512 45.248 0l352-352c12.512-12.512 12.512-32.768 0-45.248s-32.768-12.512-45.248 0z"></path>
              </svg>
            </div>
            <div className="options center-flex">
              <div
                className="scale center-flex"
                onClick={(e) => handleScaleClick(e, index)}
              >
                <img
                  className="scale-arrows"
                  src="/football/images/scale.png"
                  alt="scale"
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
              <svg
                className="check"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 768 768"
                onClick={(e) => handleCheckClick(e, index)}
              >
                <path d="M617.376 169.376l-329.376 329.376-137.376-137.376c-12.512-12.512-32.768-12.512-45.248 0s-12.512 32.768 0 45.248l160 160c12.512 12.512 32.768 12.512 45.248 0l352-352c12.512-12.512 12.512-32.768 0-45.248s-32.768-12.512-45.248 0z"></path>
              </svg>
            </div>
          </div>
        ))}
      </div>

      {onGenerateMore && (
        <>
          <button
            className="generation-btn"
            onClick={onGenerateMore}
            disabled={isGenerating}
            style={{ position: "relative", overflow: "hidden" }}
          >
            {/* Progress bar background */}
            {isGenerating && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "100%",
                  width: `${generationProgress}%`,
                  backgroundColor: "rgba(16, 185, 129, 0.2)",
                  transition: "width 0.3s ease",
                  zIndex: 0,
                }}
              />
            )}
            <span style={{ position: "relative", zIndex: 1 }}>
              {isGenerating
                ? `Gerando... ${Math.round(generationProgress)}%`
                : "Gerar mais um fundo"}
            </span>
          </button>
        </>
      )}
    </div>
  )
}
