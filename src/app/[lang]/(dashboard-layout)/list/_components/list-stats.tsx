import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const statsData = [
  {
    title: "Total de Itens",
    value: "1,234",
    description: "+12% em relação ao mês passado",
  },
  {
    title: "Itens Ativos",
    value: "956",
    description: "+5% em relação ao mês passado",
  },
  {
    title: "Itens Pendentes",
    value: "278",
    description: "-2% em relação ao mês passado",
  },
  {
    title: "Taxa de Conversão",
    value: "78%",
    description: "+8% em relação ao mês passado",
  },
]

export function ListStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
