import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const tableData = [
  {
    id: "1",
    name: "João Silva",
    email: "joao.silva@email.com",
    status: "Ativo",
    role: "Administrador",
    lastLogin: "2024-01-15",
  },
  {
    id: "2",
    name: "Maria Santos",
    email: "maria.santos@email.com",
    status: "Ativo",
    role: "Editor",
    lastLogin: "2024-01-14",
  },
  {
    id: "3",
    name: "Pedro Oliveira",
    email: "pedro.oliveira@email.com",
    status: "Inativo",
    role: "Visualizador",
    lastLogin: "2024-01-10",
  },
  {
    id: "4",
    name: "Ana Costa",
    email: "ana.costa@email.com",
    status: "Ativo",
    role: "Editor",
    lastLogin: "2024-01-15",
  },
  {
    id: "5",
    name: "Carlos Ferreira",
    email: "carlos.ferreira@email.com",
    status: "Pendente",
    role: "Visualizador",
    lastLogin: "2024-01-12",
  },
]

export function ListTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Usuários</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último Login</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      user.status === "Ativo"
                        ? "default"
                        : user.status === "Inativo"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell>{user.lastLogin}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
