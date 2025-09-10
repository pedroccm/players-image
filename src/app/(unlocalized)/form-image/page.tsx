import { FormInterface } from "./_components/form-interface"

export default function FormImagePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary/10 border-b px-6 py-4">
        <h1 className="text-xl font-semibold">Player.CX - Formulário</h1>
      </div>
      <div className="container mx-auto px-4 py-8">
        <FormInterface />
      </div>
    </div>
  )
}