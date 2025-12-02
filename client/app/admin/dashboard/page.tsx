"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users,Landmark,UserCheck, BarChart3,TrendingUp, CheckCircle, Plus, UserPlus, Users2, PieChart, LogOut, User, Wallet } from "lucide-react"
 
interface DashboardStats {
  activeElections: number
  totalVoters: number
  registeredCandidates: number
  totalVotesCast: number
  recentElections: Array<{
    id: string
    name: string
    status: string
    created: string
  }>
}

const adminMenuItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: "Elections",
    href: "/admin/elections",
    icon: <Landmark className="w-5 h-5" />,
    children: [
      { label: "Create Election", href: "/admin/create-election", icon: null },
      { label: "View Elections", href: "/admin/elections", icon: null },
    ],
  },
  {
    label: "Parties & Candidates",
    href: "/admin/parties",
    icon: <Users className="w-5 h-5" />,
    children: [
      { label: "Manage Parties", href: "/admin/parties", icon: null },
      { label: "Manage Candidates", href: "/admin/candidates", icon: null },
    ],
  },
  {
    label: "Voter Registry",
    href: "/voter/register",
    icon: <UserCheck className="w-5 h-5" />,
  },
  {
    label: "Vote Results",
    href: "/admin/results",
    icon: <TrendingUp className="w-5 h-5" />,
  },
]

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
    };
  }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkWalletConnection()
    fetchStats()
  }, [])
  

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' })
        if (accounts.length > 0) {
          setWalletAddress(accounts[0])
          setIsConnected(true)
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error)
      }
    }
  }

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert("Please install MetaMask to connect your wallet")
      return
    }

    setIsConnecting(true)
    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0])
        setIsConnected(true)
      }
    } catch (error: any) {
      if (error.code === 4001) {
        alert("Please connect your MetaMask wallet to continue.")
      } else {
        alert("Failed to connect wallet. Please try again.")
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = () => {
    setWalletAddress("")
    setIsConnected(false)
    // You might want to call your backend logout API here
    // await fetch("/api/auth/logout", { method: "POST" })
  }

  const handleLogout = () => {
    disconnectWallet()
    router.push("/admin/login")
  }

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/dashboard")
      if (!response.ok) throw new Error("Failed to fetch stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: "Create New Election",
      description: "Set up a new voting election",
      icon: Plus,
      onClick: () => router.push("/admin/create-election"),
      color: "bg-blue-500"
    },
    {
      title: "Manage Voters",
      description: "View and manage registered voters",
      icon: Users2,
      onClick: () => router.push("/admin/manage-voters"),
      color: "bg-green-500"
    },
    {
      title: "Add Party & Candidates",
      description: "Register political parties and candidates",
      icon: UserPlus,
      onClick: () => router.push("/admin/manage-parties"),
      color: "bg-purple-500"
    },
    {
      title: "View Vote Results",
      description: "See election results and analytics",
      icon: PieChart,
      onClick: () => router.push("/admin/results"),
      color: "bg-orange-500"
    }
  ]

  const formatWalletAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  if (loading) return <div className="p-6">Loading dashboard...</div>
  if (!stats) return <div className="p-6">Failed to load dashboard</div>

  const statsCards = [
    { label: "Active Elections", value: stats.activeElections, icon: Landmark },
    { label: "Total Voters", value: stats.totalVoters, icon: Users },
    { label: "Registered Candidates", value: stats.registeredCandidates, icon: CheckCircle },
    { label: "Total Votes Cast", value: stats.totalVotesCast, icon: BarChart3 },
  ]

  return (
      <div className="flex">
          <Sidebar items={adminMenuItems} userRole="admin" userName="Admin Account" onLogout={handleLogout} />
          <div className="flex-1 md:ml-0">
              <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Landmark className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">VoteChain Admin</h1>
            </div>
            
            <div className="flex items-center gap-4">
              {isConnected ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-lg">
                    <Wallet className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-foreground">
                      connected:{formatWalletAddress(walletAddress)}
                    </span>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">
            {isConnected 
              ? `Welcome! Managing elections with wallet: ${formatWalletAddress(walletAddress)}`
              : "Welcome to the Blockchain Voting System Admin Panel"
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <Card key={idx} className="border-border hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Recent Elections</CardTitle>
              <CardDescription>Your latest election activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentElections.length > 0 ? (
                  stats.recentElections.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border-b border-border pb-3 last:border-0"
                    >
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">Created {item.created}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.status === "Active" 
                            ? "bg-green-100 text-green-800" 
                            : item.status === "Completed"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Landmark className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No elections created yet</p>
                    <button 
                      onClick={() => router.push("/admin/create-election")}
                      className="text-primary hover:underline mt-2"
                    >
                      Create your first election
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your voting system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <button
                    key={index}
                    onClick={action.onClick}
                    className="w-full p-4 text-left border border-border rounded-lg hover:bg-secondary transition-colors flex items-center gap-3"
                  >
                    <div className={`p-2 rounded-lg ${action.color}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{action.title}</p>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
          </div>
        </div>
  
  )
}