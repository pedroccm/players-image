import { Clock, UserCheck, UserX, Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
}

function StatsCard({ title, value, description, icon, trend }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <p className="text-xs mt-1">
            <span
              className={trend.isPositive ? "text-green-600" : "text-red-600"}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </span>
            {" from last month"}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function CustomersStats() {
  const stats = [
    {
      title: "Total Customers",
      value: "2,345",
      description: "Active customer accounts",
      icon: <Users className="h-4 w-4" />,
      trend: {
        value: 12.5,
        isPositive: true,
      },
    },
    {
      title: "Active Customers",
      value: "1,984",
      description: "Customers with recent activity",
      icon: <UserCheck className="h-4 w-4" />,
      trend: {
        value: 8.2,
        isPositive: true,
      },
    },
    {
      title: "Inactive Customers",
      value: "298",
      description: "Customers with no recent activity",
      icon: <UserX className="h-4 w-4" />,
      trend: {
        value: -5.1,
        isPositive: false,
      },
    },
    {
      title: "Pending Approval",
      value: "63",
      description: "Customers awaiting verification",
      icon: <Clock className="h-4 w-4" />,
      trend: {
        value: 15.7,
        isPositive: true,
      },
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatsCard
          key={index}
          title={stat.title}
          value={stat.value}
          description={stat.description}
          icon={stat.icon}
          trend={stat.trend}
        />
      ))}
    </div>
  )
}
