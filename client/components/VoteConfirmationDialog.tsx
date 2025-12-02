"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Vote, Shield, User, BadgeInfo, Loader2, ExternalLink } from "lucide-react"

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  voter: any
  candidate: any
  election: any
  isLoading: boolean
}

export default function VoteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  voter,
  candidate,
  election,
  isLoading
}: ConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Vote className="w-6 h-6 text-primary" />
            Confirm Your Vote
          </DialogTitle>
          <DialogDescription>
            Please review your vote before confirming. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="bg-blue-50 border-blue-200">
            <BadgeInfo className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              After confirming, you will need to approve the transaction in MetaMask.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="font-medium">Voter ID:</span>
              <span className="font-mono text-sm">{voter?.voterId}</span>
            </div>

            <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="font-medium">Election:</span>
              <span>{election?.name}</span>
            </div>

            {candidate && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-800">Selected Candidate</span>
                </div>
                <div className="space-y-1">
                  <p className="font-medium">{candidate.name}</p>
                  <p className="text-sm text-green-700">{candidate.position}</p>
                  <p className="text-sm text-green-600">{candidate.party.name}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <ExternalLink className="w-4 h-4 text-yellow-600" />
              <span className="font-semibold text-yellow-800">Next Step</span>
            </div>
            <p className="text-yellow-700 text-sm">
              After clicking "Confirm & Vote", MetaMask will open to confirm the transaction.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Your vote will be recorded on the blockchain</span>
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
                Waiting for MetaMask...
              </>
            ) : (
              <>
                <Vote className="w-4 h-4 mr-2" />
                Confirm & Vote
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}