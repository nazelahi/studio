
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LockKeyhole } from "lucide-react";

interface PasscodeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
}

const CORRECT_PASSCODE = "1234";

export function PasscodeDialog({ isOpen, onOpenChange, onSuccess }: PasscodeDialogProps) {
  const [passcode, setPasscode] = React.useState("");
  const [error, setError] = React.useState("");
  const { toast } = useToast();

  const handleVerify = () => {
    if (passcode === CORRECT_PASSCODE) {
      setError("");
      toast({
        title: "Unlocked",
        description: "You now have access to edit and delete actions.",
      });
      onSuccess();
      onOpenChange(false);
      setPasscode("");
    } else {
      setError("Incorrect passcode. Please try again.");
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setPasscode("");
      setError("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                <LockKeyhole className="h-6 w-6 text-primary" />
            </div>
          <DialogTitle className="text-center">Enter Passcode to Continue</DialogTitle>
          <DialogDescription className="text-center">
            This action requires a passcode for security reasons.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="passcode" className="sr-only">
              Passcode
            </Label>
            <Input
              id="passcode"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="****"
              className="text-center text-lg tracking-widest"
              onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
            />
          </div>
          {error && <p className="text-sm text-center text-destructive">{error}</p>}
        </div>
        <DialogFooter className="sm:justify-center">
          <Button type="button" onClick={handleVerify}>
            Unlock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
