"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Sidebar from "@/components/sidebar"
import { BarChart3, Users, TrendingUp, Landmark, UserCheck, Shield } from "lucide-react"

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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = () => {
    try {
      // Check if we have session in localStorage
      const adminSession = localStorage.getItem("adminSession")
      
      if (adminSession) {
        setIsAuthenticated(true)
        setLoading(false)
        return
      }
      
      // If no session, redirect to login
      router.push('/admin/login')
      setLoading(false)
    } catch (error) {
      console.error("Auth check error:", error)
      router.push('/admin/login')
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem("adminSession")
      localStorage.removeItem("adminWallet")
      
      // Redirect to login
      router.push('/admin/login')
    } catch (error) {
      console.error("Logout error:", error)
      router.push('/admin/login')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar 
        items={adminMenuItems} 
        userRole="admin" 
        userName="Admin Account" 
        onLogout={handleLogout} 
      />
      <div className="flex-1 ml-0 ">
        {children}
      </div>
    </div>
  )
}