import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const productsData = [
  {
    id: "1",
    name: "Smartphone Premium",
    description: "Smartphone com tecnologia avançada e design moderno",
    price: "R$ 2.499,00",
    category: "Eletrônicos",
    stock: 25,
    status: "Em Estoque",
  },
  {
    id: "2",
    name: "Notebook Gamer",
    description: "Laptop para jogos com alta performance",
    price: "R$ 4.999,00",
    category: "Eletrônicos",
    stock: 8,
    status: "Baixo Estoque",
  },
  {
    id: "3",
    name: "Fones Bluetooth",
    description: "Fones sem fio com cancelamento de ruído",
    price: "R$ 299,00",
    category: "Acessórios",
    stock: 0,
    status: "Fora de Estoque",
  },
  {
    id: "4",
    name: "Tablet Pro",
    description: "Tablet profissional para trabalho e entretenimento",
    price: "R$ 1.899,00",
    category: "Eletrônicos",
    stock: 15,
    status: "Em Estoque",
  },
  {
    id: "5",
    name: "Smartwatch",
    description: "Relógio inteligente com monitoramento de saúde",
    price: "R$ 899,00",
    category: "Acessórios",
    stock: 3,
    status: "Baixo Estoque",
  },
  {
    id: "6",
    name: "Camera Digital",
    description: "Câmera profissional para fotografias de alta qualidade",
    price: "R$ 3.299,00",
    category: "Fotografia",
    stock: 12,
    status: "Em Estoque",
  },
]

export function ListCards() {
  return (
    <div>
      <h2 className="mb-4 text-xl font-semibold">Lista de Produtos</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {productsData.map((product) => (
          <Card key={product.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <Badge
                  variant={
                    product.status === "Em Estoque"
                      ? "default"
                      : product.status === "Fora de Estoque"
                        ? "destructive"
                        : "secondary"
                  }
                >
                  {product.status}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {product.category} • ID: {product.id}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="mb-4 text-sm text-muted-foreground">
                {product.description}
              </p>
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold">{product.price}</span>
                <span className="text-sm text-muted-foreground">
                  Estoque: {product.stock}
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1">
                  Ver Detalhes
                </Button>
                <Button size="sm" variant="outline">
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
