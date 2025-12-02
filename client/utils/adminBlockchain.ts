declare global {
  interface Window {
    ethereum?: any
  }
}

export const connectMetaMask = async (): Promise<string> => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error("MetaMask is not installed. Please install MetaMask to continue.")
  }

  try {
    // This will trigger MetaMask popup
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    })

    if (accounts && accounts.length > 0) {
      return accounts[0]
    }
    throw new Error("No accounts found. Please unlock MetaMask.")
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error("Please connect your MetaMask wallet to continue.")
    }
    throw new Error("Failed to connect wallet: " + error.message)
  }
}

export const signMessage = async (message: string, walletAddress: string): Promise<string> => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error("MetaMask is not installed")
  }

  try {
    // This will trigger MetaMask signature popup
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, walletAddress]
    })
    return signature
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error("Message signing rejected by user")
    }
    throw new Error("Failed to sign message: " + error.message)
  }
}

export const verifyAdminWallet = async (walletAddress: string): Promise<boolean> => {
  try {
    const response = await fetch("/api/auth/verify-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress }),
    })

    const result = await response.json()
    return result.isAuthorized === true
  } catch (error) {
    console.error("Wallet verification error:", error)
    return false
  }
}