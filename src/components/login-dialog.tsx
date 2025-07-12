
"use client";

import * as React from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/icons";
import { LoaderCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface LoginDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function LoginDialog({ isOpen, onOpenChange }: LoginDialogProps) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        throw new Error(error);
      }
      toast({ title: "Login Successful", description: "You are now signed in." });
      onOpenChange(false); // Close dialog on success
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    toast({
        title: "Sign Up Unavailable",
        description: "Please contact an administrator to create an account.",
    });
  };

  React.useEffect(() => {
    if (!isOpen) {
        setEmail('');
        setPassword('');
        setLoading(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
            <div className="flex flex-col items-center text-center mb-4">
               <Logo className="h-12 w-12 mx-auto text-primary" />
               <DialogTitle className="text-3xl font-bold mt-2">RentFlow</DialogTitle>
               <DialogDescription className="text-muted-foreground">Admin Login</DialogDescription>
            </div>
        </DialogHeader>

        {loading ? (
            <div className="flex justify-center items-center h-48">
                <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : (
            <>
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-dialog">Email</Label>
                <Input
                  id="email-dialog"
                  type="email"
                  placeholder="admin@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-dialog">Password</Label>
                <Input
                  id="password-dialog"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
                Don't have an account?{" "}
                <button onClick={handleSignUp} className="underline text-primary">
                    Contact Admin
                </button>
            </div>
            </>
        )}
      </DialogContent>
    </Dialog>
  );
}
