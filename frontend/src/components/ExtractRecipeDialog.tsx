import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import type { RecipeStatus } from "@/api/streamRecipe";
import { RecipeNotFoundError } from "@/hooks/useExtractRecipe";

type Props = {
  open: boolean;
  statuses: RecipeStatus[];
  error: Error | null;
  onCancel: () => void;
  onClose: () => void;
};

/**
 * The popup while a recipe is being fetched: a spinner with what the API is doing right now,
 * the steps already done, and a Cancel button. If it fails, it shows why instead.
 */
export function ExtractRecipeDialog({ open, statuses, error, onCancel, onClose }: Props) {
  const current = statuses.at(-1);
  const done = statuses.slice(0, -1);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && (error ? onClose() : onCancel())}>
      <DialogContent showCloseButton={Boolean(error)} onInteractOutside={(e) => !error && e.preventDefault()}>
        {error ? (
          <>
            <DialogHeader>
              <DialogTitle>Couldn't get the recipe</DialogTitle>
              <DialogDescription>{error.message}</DialogDescription>
            </DialogHeader>
            {error instanceof RecipeNotFoundError && error.attempts.length > 1 ? (
              <ul className="text-muted-foreground list-disc pl-5 text-sm">
                {error.attempts.map((attempt) => (
                  <li key={attempt.method}>{attempt.reason}</li>
                ))}
              </ul>
            ) : null}
            <DialogFooter>
              <Button onClick={onClose}>Close</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Getting the recipe</DialogTitle>
              <DialogDescription>Videos can take up to 30 seconds.</DialogDescription>
            </DialogHeader>
            <ul className="flex flex-col gap-2 text-sm" aria-live="polite">
              {done.map((status, i) => (
                <li key={`${status.step}-${i}`} className="text-muted-foreground flex items-center gap-2">
                  <CheckIcon className="size-4" />
                  {status.message}
                </li>
              ))}
              <li className="flex items-center gap-2 font-medium">
                <Spinner />
                {current?.message ?? "Starting..."}
              </li>
            </ul>
            <DialogFooter>
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
