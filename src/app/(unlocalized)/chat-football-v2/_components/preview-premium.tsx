"use client"

interface PreviewPremiumProps {
  imageUrl: string
  onAccept: () => void
  onDecline: () => void
}

export function PreviewPremium({
  imageUrl: _imageUrl,
  onAccept,
  onDecline,
}: PreviewPremiumProps) {
  return (
    <div className="q-and-a" style={{ marginTop: "24px" }}>
      {/* Premium Section */}
      <div className="premium-section">
        <h3 className="premium-title">
          <img
            className="emoji"
            src="/football/images/gem.png"
            alt="gem"
            style={{ marginRight: "8px" }}
          />
          Desbloqueie sua versão Premium
        </h3>
        <p className="premium-offer">
          Por só <span>R$3,00</span> você leva sua arte em
          <br />
          <span>alta qualidade e sem marca d&apos;água.</span>
        </p>
        <div className="premium-btns">
          <button className="premium-buy-btn" onClick={onAccept}>
            Quero premium!
          </button>
          <button className="premium-free-btn" onClick={onDecline}>
            Prefiro grátis
          </button>
        </div>
      </div>
    </div>
  )
}
