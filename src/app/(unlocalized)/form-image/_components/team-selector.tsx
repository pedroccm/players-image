"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { TEAMS } from "@/lib/teams"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface TeamSelectorProps {
  value?: string
  onValueChange: (teamId: string) => void
  placeholder?: string
  disabled?: boolean
}

export function TeamSelector({
  value,
  onValueChange,
  placeholder = "Selecione um time...",
  disabled = false,
}: TeamSelectorProps) {
  const [open, setOpen] = useState(false)

  const selectedTeam = TEAMS.find((team) => team.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedTeam ? (
            <div className="flex items-center gap-2">
              <img
                src={selectedTeam.logoPath}
                alt={`Escudo ${selectedTeam.name}`}
                className="w-5 h-5 object-contain"
              />
              <span>{selectedTeam.name}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar time..." />
          <CommandList>
            <CommandEmpty>Nenhum time encontrado.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {TEAMS.map((team) => (
                <CommandItem
                  key={team.id}
                  value={team.name}
                  onSelect={() => {
                    onValueChange(team.id === value ? "" : team.id)
                    setOpen(false)
                  }}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <img
                      src={team.logoPath}
                      alt={`Escudo ${team.name}`}
                      className="w-5 h-5 object-contain"
                    />
                    <span>{team.name}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === team.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
