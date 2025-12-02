"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Vote, Shield, User, Loader2, CheckCircle, FileText, AlertCircle, ImageOff } from "lucide-react"
import { Badge } from "@/components/ui/badge"

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
      <DialogContent className="sm:max-w-md p-4">
        {/* Header - Compact */}
        <DialogHeader className="space-y-1 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <Vote className="w-4 h-4 text-primary" />
            </div>
            <DialogTitle className="text-lg">Confirm Your Vote</DialogTitle>
          </div>
          <DialogDescription className="text-sm">
            Review your selection before confirming
          </DialogDescription>
        </DialogHeader>

        {/* Main Content - No scroll */}
        <div className="space-y-3">
          {/* Warning Alert - Compact */}
          <Alert className="bg-blue-50 border-blue-200 py-2 px-3">
            <AlertCircle className="w-3 h-3 text-blue-600" />
            <AlertDescription className="text-blue-700 text-xs">
              You'll need to approve in MetaMask next
            </AlertDescription>
          </Alert>

          {/* Voter and Election Info - Side by side */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="w-3 h-3" />
                <span>Voter ID</span>
              </div>
              <p className="font-medium text-sm truncate" title={voter?.voterId}>
                {voter?.voterId}
              </p>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Election</div>
              <p className="font-medium text-sm truncate" title={election?.name}>
                {election?.name}
              </p>
            </div>
          </div>

          {/* Selected Candidate - Compact with Party Icon */}
          {candidate && (
            <div className="border border-green-200 rounded-md p-3 bg-green-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-sm text-green-800">Your Vote</span>
                </div>
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 px-2 py-0.5">
                  <CheckCircle className="w-3 h-3 mr-1" />
                </Badge>
              </div>
              
              <div className="space-y-2">
                {/* Candidate Name */}
                <p className="font-medium text-sm">{candidate.name}</p>
                
                {/* Position and Party with Icon */}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {candidate.position}
                  </Badge>
                  
                  {/* Party with Icon */}
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full overflow-hidden border border-border bg-white">
                      {candidate.party?.iconUrl ? (
                        <img 
                          src={candidate.party.iconUrl} 
                          alt={`${candidate.party.name} icon`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const img = e.currentTarget;
                            img.style.display = 'none';
                            const parent = img.parentElement;
                            if (parent) {
                              const existingFallback = parent.querySelector('.party-icon-fallback');
                              if (existingFallback) return;
                              
                              const fallback = document.createElement('div');
                              fallback.className = 'party-icon-fallback w-full h-full flex items-center justify-center bg-muted';
                              fallback.innerHTML = `<Shield class="w-2 h-2 text-muted-foreground" />`;
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <Shield className="w-2 h-2 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-green-700">{candidate.party.name}</span>
                  </div>
                </div>

                {/* Candidate Image (Optional) */}
                {candidate.imageUrl && (
                  <div className="pt-1 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden border border-green-200 bg-white">
                      <img 
                        src={candidate.imageUrl} 
                        alt={candidate.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const img = e.currentTarget;
                          img.style.display = 'none';
                          const parent = img.parentElement;
                          if (parent) {
                            const existingFallback = parent.querySelector('.candidate-image-fallback');
                            if (existingFallback) return;
                            
                            const fallback = document.createElement('div');
                            fallback.className = 'candidate-image-fallback w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10';
                            fallback.innerHTML = `<User class="w-3 h-3 text-muted-foreground" />`;
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">Candidate photo</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Security Info - Compact */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground p-2 border border-border rounded-md">
            <Shield className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>This vote will be permanently recorded on the blockchain</span>
          </div>
        </div>

        {/* Action Buttons - Compact */}
        <div className="flex gap-2 pt-3 border-t">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading}
            className="flex-1 text-sm h-9"
            size="sm"
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm} 
            disabled={isLoading}
            className="flex-1 bg-primary text-sm h-9"
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Vote className="w-3 h-3 mr-1.5" />
                Confirm Vote
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}