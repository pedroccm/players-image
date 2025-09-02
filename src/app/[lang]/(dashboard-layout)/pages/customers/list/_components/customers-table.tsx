"use client"

import { useState } from "react"
import { Edit, Eye, MoreHorizontal, Trash2 } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  status: "active" | "inactive" | "pending"
  totalOrders: number
  totalSpent: number
  joinDate: string
  avatar?: string
}

const mockCustomers: Customer[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    status: "active",
    totalOrders: 12,
    totalSpent: 2450.5,
    joinDate: "2024-01-15",
    avatar: "/avatars/01.png",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    phone: "+1 (555) 987-6543",
    status: "active",
    totalOrders: 8,
    totalSpent: 1320.75,
    joinDate: "2024-02-20",
    avatar: "/avatars/02.png",
  },
  {
    id: "3",
    name: "Mike Wilson",
    email: "mike.wilson@example.com",
    phone: "+1 (555) 456-7890",
    status: "inactive",
    totalOrders: 3,
    totalSpent: 890.25,
    joinDate: "2024-03-10",
  },
  {
    id: "4",
    name: "Emily Brown",
    email: "emily.brown@example.com",
    phone: "+1 (555) 321-0987",
    status: "pending",
    totalOrders: 0,
    totalSpent: 0,
    joinDate: "2024-08-25",
    avatar: "/avatars/04.png",
  },
  {
    id: "5",
    name: "David Miller",
    email: "david.miller@example.com",
    phone: "+1 (555) 654-3210",
    status: "active",
    totalOrders: 15,
    totalSpent: 3200.8,
    joinDate: "2023-11-30",
  },
  {
    id: "6",
    name: "Lisa Anderson",
    email: "lisa.anderson@example.com",
    phone: "+1 (555) 789-0123",
    status: "active",
    totalOrders: 6,
    totalSpent: 1580.4,
    joinDate: "2024-04-18",
    avatar: "/avatars/06.png",
  },
]

export function CustomersTable() {
  const [customers] = useState<Customer[]>(mockCustomers)

  const getStatusColor = (status: Customer["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 hover:bg-green-200"
      case "inactive":
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200"
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date))
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Orders</TableHead>
            <TableHead>Total Spent</TableHead>
            <TableHead>Join Date</TableHead>
            <TableHead className="w-[50px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={customer.avatar} alt={customer.name} />
                    <AvatarFallback>
                      {customer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {customer.email}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={getStatusColor(customer.status)}>
                  {customer.status.charAt(0).toUpperCase() +
                    customer.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {customer.phone}
              </TableCell>
              <TableCell>{customer.totalOrders}</TableCell>
              <TableCell className="font-medium">
                {formatCurrency(customer.totalSpent)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(customer.joinDate)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Customer
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Customer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
