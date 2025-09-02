import { ChatInterface } from "./_components/chat-interface"

export default function ChatImagePage() {
  return (
    <div className="h-screen flex flex-col">
      <div className="bg-primary/10 border-b px-6 py-4">
        <h1 className="text-xl font-semibold">Player.CX</h1>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  )
}
