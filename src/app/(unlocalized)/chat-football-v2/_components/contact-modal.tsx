"use client"

import { useState } from "react"

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    telephone: "",
    message: "",
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implementar envio do formulário
    console.log("Form data:", formData)
    // Por enquanto, apenas fecha o modal
    onClose()
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="contact-modal-overlay">
      <div className="contact-modal-content">
        {/* X Mark Button */}
        <div className="x-mark center-flex" role="button" onClick={onClose}>
          <svg
            className="cross"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 768 768"
          >
            <path d="M607.5 205.5l-178.5 178.5 178.5 178.5-45 45-178.5-178.5-178.5 178.5-45-45 178.5-178.5-178.5-178.5 45-45 178.5 178.5 178.5-178.5z"></path>
          </svg>
        </div>

        <main>
          <div className="contact-container">
            {/* Header */}
            <header className="header-page1">
              <h1 className="main-title">
                Tá com dúvida? Quer falar com a gente?
              </h1>
              <p className="sub-title">
                É só mandar sua mensagem aqui que respondemos rapidinho.
              </p>
              <p className="instructions">
                <img
                  src="/football/images/mail.png"
                  className="emoji"
                  alt="mail"
                />
                <span className="instructions-text">
                  Pode ser feedback, sugestão, algum
                  <br />
                  problema, ou só um &ldquo;oi&rdquo;. Estamos por aqui.
                </span>
              </p>
            </header>

            {/* Form */}
            <section className="section-page1">
              <form onSubmit={handleSubmit}>
                <div className="input-container name">
                  <label htmlFor="username">Seu nome*</label>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    placeholder="Escreva aqui"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-container email">
                  <label htmlFor="email">Seu email*</label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    placeholder="Escreva aqui"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-container telephone">
                  <label htmlFor="telephone">Telefone*</label>
                  <input
                    type="tel"
                    name="telephone"
                    id="telephone"
                    placeholder="Escreva aqui"
                    value={formData.telephone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-container message">
                  <label htmlFor="message">Mensagem*</label>
                  <textarea
                    name="message"
                    id="message"
                    placeholder="Escreva aqui"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                {/* Footer */}
                <footer className="center-flex footer-page1">
                  <button type="submit" className="center-flex footer-btn">
                    Enviar
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
              </form>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
