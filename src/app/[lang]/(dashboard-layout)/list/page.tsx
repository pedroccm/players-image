import type { Metadata } from "next"

import { ListCards } from "./_components/list-cards"
import { ListStats } from "./_components/list-stats"
import { ListTable } from "./_components/list-table"

// Define metadata for the page
// More info: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
export const metadata: Metadata = {
  title: "List View",
}

export default function ListPage() {
  return (
    <section className="container space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold">Lista de Dados</h1>
        <p className="text-muted-foreground">
          Visualização de dados em diferentes formatos de lista
        </p>
      </div>

      <ListStats />
      <ListTable />
      <ListCards />
    </section>
  )
}
