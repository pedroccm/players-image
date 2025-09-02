import type { Metadata } from "next"

import { CustomersFilters } from "./_components/customers-filters"
import { CustomersStats } from "./_components/customers-stats"
import { CustomersTable } from "./_components/customers-table"

export const metadata: Metadata = {
  title: "Customers List",
  description: "Manage and view all customers in your system",
}

export default function CustomersListPage() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage and view all customers in your system
          </p>
        </div>
      </div>

      <CustomersStats />

      <div className="space-y-4">
        <CustomersFilters />
        <CustomersTable />
      </div>
    </div>
  )
}
