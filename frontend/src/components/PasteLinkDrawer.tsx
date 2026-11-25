import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SketchIcon, type SketchGeometry } from "sketchicon";
import {
  Alert02Icon,
  Globe02Icon,
  InstagramIcon,
  Link04Icon,
  Tick02Icon,
  TiktokIcon,
  YoutubeIcon,
} from "@sketchicon/hugeicons";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Spinner } from "@/components/ui/spinner";
import { useAppForm } from "@/hooks/useAppForm";
import { RecipeNotFoundError, useExtractRecipe } from "@/hooks/useExtractRecipe";
import type { RecipeSource } from "@/types/recipe";
import { detectSource, normalizeUrlInput } from "@/utils";
import { RecipeLinkSchema, type RecipeLinkValues } from "@/validators/recipeLink.validator";

/** How hand-drawn the icons look: 0 = clean, 1.5 = default, ~3 = very wobbly. */
const ICON_ROUGHNESS = 3;

/** The card's colour: same as "Paste a link" in the "+" menu, so it feels like that button opened up. */
const CARD_COLOR = "bg-doodle-lilac";

/** How each kind of link is shown once it's detected. */
const SOURCES: Record<RecipeSource, { label: string; icon: SketchGeometry; color: string }> = {
  tiktok: { label: "TikTok", icon: TiktokIcon, color: "bg-doodle-sky" },
  instagram: { label: "Instagram", icon: InstagramIcon, color: "bg-doodle-pink" },
  youtube: { label: "YouTube", icon: YoutubeIcon, color: "bg-doodle-lemon" },
  website: { label: "Recipe website", icon: Globe02Icon, color: "bg-doodle-mint" },
};

/**
 * "Paste a link" as a doodle card that slides up from the bottom (shadcn Drawer).
 * Paste any link (or share text with a link in it): it shows what it detected (TikTok, Instagram,
 * YouTube or a website), then "Get recipe" shows each step in the same card and opens the saved
 * recipe when it's done. Drag the card down (or tap outside) to close it; that also cancels.
 */
export function PasteLinkDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const extract = useExtractRecipe();

  const close = () => {
    if (extract.isPending) extract.cancel();
    else extract.reset();
    onOpenChange(false);
  };

  // After success the recipe page opens (useExtractRecipe navigates); this closes the card behind it
  const { isSuccess, reset } = extract;
  useEffect(() => {
    if (!open || !isSuccess) return;
    reset();
    onOpenChange(false);
  }, [open, isSuccess, reset, onOpenChange]);

  return (
    <Drawer open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DrawerContent className={`${CARD_COLOR} text-ink`}>
        <div className="mx-auto flex w-full max-w-md flex-col gap-4 overflow-y-auto px-4 pt-3 pb-8">
          {/* Header: same row as the list cards */}
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-paper">
              <SketchIcon icon={Link04Icon} size={22} roughness={ICON_ROUGHNESS} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <DrawerTitle className="font-heading text-xl leading-tight font-semibold text-ink">Paste a link</DrawerTitle>
              <DrawerDescription className="text-xs font-semibold text-ink/70">
                TikTok, Instagram, YouTube or any recipe website
              </DrawerDescription>
            </div>
          </div>

          {extract.error ? (
            <ErrorPanel error={extract.error} onRetry={extract.reset} />
          ) : extract.isPending || extract.isSuccess ? (
            <ProgressPanel statuses={extract.statuses.map((s) => s.message)} onCancel={extract.cancel} />
          ) : (
            <LinkForm onSubmit={(url) => extract.start(url)} />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

const defaultValues: RecipeLinkValues = { url: "" };

/** The link box, the "detected" chip, and the submit button, on a white card. */
function LinkForm({ onSubmit }: { onSubmit: (url: string) => void }) {
  const form = useAppForm({
    defaultValues,
    validators: { onSubmit: RecipeLinkSchema },
    onSubmit: ({ value }) => onSubmit(normalizeUrlInput(value.url) ?? value.url.trim()),
  });

  /** Fill the box from the clipboard. Some browsers ask first, or don't allow it: then nothing happens. */
  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) form.setFieldValue("url", text);
    } catch {
      // Not allowed: the user can still paste into the box themselves
    }
  };

  return (
    <form
      noValidate
      className="flex flex-col gap-3 rounded-2xl border-2 border-ink bg-paper p-4 shadow-doodle"
      onSubmit={(event) => {
        event.preventDefault();
        form.handleSubmit();
      }}
    >
      <div className="flex items-start gap-2">
        <form.AppField name="url">
          {(field) => (
            <field.TextField
              label="Recipe, TikTok, Instagram or YouTube link"
              hideLabel
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              autoFocus
              placeholder="Paste a link here"
              className="flex flex-1 flex-col gap-1"
            />
          )}
        </form.AppField>
        <Button type="button" variant="outline" onClick={pasteFromClipboard}>
          Paste
        </Button>
      </div>

      {/* What the link is: pops in as soon as it's recognised, changes as you edit */}
      <form.Subscribe selector={(state) => detectSource(state.values.url)}>
        {(source) => (
          <div className="flex min-h-8 items-center" aria-live="polite">
            <AnimatePresence mode="popLayout" initial={false}>
              {source ? (
                <motion.span
                  key={source}
                  initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
                  animate={{ opacity: 1, scale: 1, rotate: -2 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ type: "spring", visualDuration: 0.3, bounce: 0.45 }}
                  className={`inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1 text-xs font-bold ${SOURCES[source].color}`}
                >
                  <SketchIcon icon={SOURCES[source].icon} size={16} roughness={ICON_ROUGHNESS} aria-hidden />
                  {SOURCES[source].label} link
                </motion.span>
              ) : (
                <motion.span
                  key="none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs font-semibold text-ink/60"
                >
                  We'll recognise the link as you paste it
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        )}
      </form.Subscribe>

      <form.AppForm>
        <form.SubmitButton label="Get recipe" pendingLabel="Getting recipe..." size="lg" block />
      </form.AppForm>
    </form>
  );
}

/** While the recipe is being fetched: the steps done so far, the current one, and Cancel. */
function ProgressPanel({ statuses, onCancel }: { statuses: string[]; onCancel: () => void }) {
  const current = statuses.at(-1);
  const done = statuses.slice(0, -1);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-ink bg-paper p-4 shadow-doodle">
      <p className="font-heading text-lg font-semibold">Getting the recipe</p>
      <ul className="flex flex-col gap-2 text-sm" aria-live="polite">
        {done.map((message, i) => (
          <motion.li
            key={`${message}-${i}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-ink/60"
          >
            <SketchIcon icon={Tick02Icon} size={16} aria-hidden />
            {message}
          </motion.li>
        ))}
        <li className="flex items-center gap-2 font-semibold">
          <Spinner />
          {current ?? "Starting..."}
        </li>
      </ul>
      <p className="text-xs font-semibold text-ink/60">Videos can take up to 30 seconds.</p>
      <Button variant="outline" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

/** It didn't work: why, and a button to try another link. */
function ErrorPanel({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border-2 border-ink bg-paper p-4 shadow-doodle">
      <p className="flex items-center gap-2 font-heading text-lg font-semibold">
        <SketchIcon icon={Alert02Icon} size={20} roughness={ICON_ROUGHNESS} aria-hidden />
        Couldn't get the recipe
      </p>
      <p className="text-sm">{error.message}</p>
      {error instanceof RecipeNotFoundError && error.attempts.length > 1 ? (
        <ul className="list-disc pl-5 text-sm text-ink/70">
          {error.attempts.map((attempt) => (
            <li key={attempt.method}>{attempt.reason}</li>
          ))}
        </ul>
      ) : null}
      <Button onClick={onRetry}>Try another link</Button>
    </div>
  );
}
