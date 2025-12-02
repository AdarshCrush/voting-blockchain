"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Shield, Wallet, Loader2, ExternalLink } from "lucide-react"

interface WalletConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  walletAddress: string
  isLoading: boolean
}

export default function WalletConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  walletAddress,
  isLoading
}: WalletConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" />
            Confirm Wallet Address
          </DialogTitle>
          <DialogDescription>
            Please confirm your wallet address to proceed with admin login.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <Shield className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              You need to verify your wallet ownership to access the admin panel.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Connected Wallet:</span>
                <Wallet className="w-4 h-4 text-green-600" />
              </div>
              <code className="text-sm font-mono break-all bg-background p-2 rounded border">
                {walletAddress}
              </code>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="w-4 h-4 text-yellow-600" />
                <span className="font-semibold text-yellow-800">Next Step</span>
              </div>
              <p className="text-yellow-700 text-sm">
                After confirming, MetaMask will open to sign a verification message.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>This verifies you own the wallet and are authorized to access the admin panel.</span>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Confirm Wallet
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}