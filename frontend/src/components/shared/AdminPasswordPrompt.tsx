import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

export type AdminPasswordPromptMode = "view" | "edit";

interface AdminPasswordPromptProps {
  open: boolean;
  mode: AdminPasswordPromptMode;
  isLoading?: boolean;
  error?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (password: string) => void;
}

export function AdminPasswordPrompt({
  open,
  mode,
  isLoading,
  error,
  onOpenChange,
  onConfirm,
}: AdminPasswordPromptProps) {
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!open) {
      setPassword("");
    }
  }, [open]);

  const title = mode === "edit" ? "Confirm admin password to edit" : "Confirm admin password to view";
  const description =
    mode === "edit"
      ? "Enter your admin password to unlock the password field for editing."
      : "Enter your admin password to reveal the stored password placeholder.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="space-y-1">
            <Label htmlFor="admin-password">Admin password</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => onConfirm(password)}
            disabled={isLoading || !password}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
