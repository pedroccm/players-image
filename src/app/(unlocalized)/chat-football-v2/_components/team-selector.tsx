"use client"

import { useState } from "react"

import { getAllTeams } from "@/lib/teams"

interface TeamSelectorProps {
  onSelect: (teamId: string) => void
  excludeTeamId?: string
}

export function TeamSelector({ onSelect, excludeTeamId }: TeamSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)

  const teams = getAllTeams()
  const filteredTeams = teams
    .filter((team) => team.id !== excludeTeamId)
    .filter((team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

  const handleTeamClick = (teamId: string) => {
    setSelectedTeam(teamId)
  }

  const handleConfirm = () => {
    if (selectedTeam) {
      onSelect(selectedTeam)
      setIsOpen(false)
    }
  }

  if (!isOpen) {
    return (
      <div className="q-and-a">
        <div className="selections">
          <div className="selection">
            <p className="selection-text">Selecione o time</p>
            <div className="selector" onClick={() => setIsOpen(true)}>
              <div className="current-selected">
                <p className="team-name">Clique para escolher</p>
              </div>
              <svg
                className="arrow-down-up"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M5.70711 16.1359C5.31659 16.5264 5.31659 17.1596 5.70711 17.5501L10.5993 22.4375C11.3805 23.2179 12.6463 23.2176 13.4271 22.4369L18.3174 17.5465C18.708 17.156 18.708 16.5228 18.3174 16.1323C17.9269 15.7418 17.2937 15.7418 16.9032 16.1323L12.7176 20.3179C12.3271 20.7085 11.6939 20.7085 11.3034 20.3179L7.12132 16.1359C6.7308 15.7454 6.09763 15.7454 5.70711 16.1359Z" />
                <path d="M18.3174 7.88675C18.708 7.49623 18.708 6.86307 18.3174 6.47254L13.4252 1.58509C12.644 0.804698 11.3783 0.805008 10.5975 1.58579L5.70711 6.47615C5.31658 6.86667 5.31658 7.49984 5.70711 7.89036C6.09763 8.28089 6.7308 8.28089 7.12132 7.89036L11.307 3.70472C11.6975 3.31419 12.3307 3.31419 12.7212 3.70472L16.9032 7.88675C17.2937 8.27728 17.9269 8.27728 18.3174 7.88675Z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "var(--grey-light)",
        zIndex: 1000,
        overflowY: "auto",
        padding: "20px",
      }}
    >
      {/* X Mark */}
      <div className="x-mark center-flex" onClick={() => setIsOpen(false)}>
        <svg
          className="cross"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 768 768"
        >
          <path d="M607.5 205.5l-178.5 178.5 178.5 178.5-45 45-178.5-178.5-178.5 178.5-45-45 178.5-178.5-178.5-178.5 45-45 178.5 178.5 178.5-178.5z"></path>
        </svg>
      </div>

      <div className="football-container" style={{ paddingTop: "60px" }}>
        {/* Search Input */}
        <input
          type="search"
          placeholder="Buscar time"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%",
            height: "56px",
            borderRadius: "30px",
            border: "1px solid var(--grey-medium)",
            padding: "0 22px",
            fontSize: "16px",
            marginBottom: "24px",
            boxShadow: "var(--shadow)",
          }}
        />

        {/* Team List */}
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {filteredTeams.map((team) => (
            <li
              key={team.id}
              onClick={() => handleTeamClick(team.id)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px",
                marginBottom: "8px",
                backgroundColor: "white",
                borderRadius: "8px",
                border:
                  selectedTeam === team.id
                    ? "2px solid var(--green)"
                    : "1px solid var(--grey-medium)",
                cursor: "pointer",
                boxShadow: "var(--shadow)",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                {team.logoPath && (
                  <img
                    src={team.logoPath}
                    alt={team.name}
                    style={{ width: "32px", height: "32px" }}
                  />
                )}
                <p
                  style={{
                    margin: 0,
                    color: "var(--main-blue)",
                    fontWeight: 500,
                  }}
                >
                  {team.name}
                </p>
              </div>
              {selectedTeam === team.id && (
                <svg
                  className="check"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 768 768"
                  style={{
                    width: "22px",
                    height: "22px",
                    fill: "white",
                    backgroundColor: "var(--green)",
                    padding: "4px",
                    borderRadius: "5px",
                  }}
                >
                  <path d="M617.376 169.376l-329.376 329.376-137.376-137.376c-12.512-12.512-32.768-12.512-45.248 0s-12.512 32.768 0 45.248l160 160c12.512 12.512 32.768 12.512 45.248 0l352-352c12.512-12.512 12.512-32.768 0-45.248s-32.768-12.512-45.248 0z"></path>
                </svg>
              )}
            </li>
          ))}
        </ul>

        {/* Footer */}
        {selectedTeam && (
          <footer
            className="footer-page center-flex"
            style={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
          >
            <button className="footer-btn center-flex" onClick={handleConfirm}>
              confirmar time
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
        )}
      </div>
    </div>
  )
}
