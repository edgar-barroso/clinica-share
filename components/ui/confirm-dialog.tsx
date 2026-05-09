"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Variant = "default" | "destructive" | "warning";

interface BaseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  onConfirm: () => void | Promise<void>;
}

interface PromptProps extends BaseProps {
  prompt: {
    label: string;
    placeholder?: string;
    required?: boolean;
    minLength?: number;
    helper?: string;
  };
  onConfirmWithValue: (value: string) => void | Promise<void>;
}

type Props = BaseProps | PromptProps;

function isPrompt(p: Props): p is PromptProps {
  return "prompt" in p && p.prompt !== undefined;
}

export function ConfirmDialog(props: Props) {
  if (!props.open) return null;
  return <ConfirmDialogInner {...props} />;
}

function ConfirmDialogInner(props: Props) {
  const {
    onOpenChange,
    title,
    description,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    variant = "default",
  } = props;

  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onOpenChange, submitting]);

  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  async function handleConfirm() {
    if (isPrompt(props)) {
      const trimmed = value.trim();
      const min = props.prompt.minLength ?? (props.prompt.required ? 3 : 0);
      if (trimmed.length < min) return;
      setSubmitting(true);
      try {
        await props.onConfirmWithValue(trimmed);
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setSubmitting(true);
    try {
      await props.onConfirm();
    } finally {
      setSubmitting(false);
    }
  }

  const confirmDisabled =
    submitting ||
    (isPrompt(props) &&
      value.trim().length < (props.prompt.minLength ?? (props.prompt.required ? 3 : 0)));

  const accentClass =
    variant === "destructive"
      ? "bg-destructive/10 text-destructive"
      : variant === "warning"
        ? "bg-warning/10 text-warning"
        : "bg-primary/10 text-primary";

  const confirmBtnClass =
    variant === "destructive"
      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
      : variant === "warning"
        ? "bg-warning text-warning-foreground hover:bg-warning/90"
        : "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={() => !submitting && onOpenChange(false)}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`flex size-10 items-center justify-center rounded-xl ${accentClass}`}
            >
              <AlertTriangle size={18} />
            </div>
            <div className="min-w-0">
              <h2 id="confirm-dialog-title" className="text-base font-semibold">
                {title}
              </h2>
              {description && (
                <div className="mt-1 text-sm text-muted-foreground">
                  {description}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => !submitting && onOpenChange(false)}
            aria-label="Fechar"
            disabled={submitting}
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {isPrompt(props) && (
          <div className="mb-4 space-y-1.5">
            <Label htmlFor="confirm-prompt">{props.prompt.label}</Label>
            <Input
              id="confirm-prompt"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={props.prompt.placeholder}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !confirmDisabled) {
                  e.preventDefault();
                  void handleConfirm();
                }
              }}
            />
            {props.prompt.helper && (
              <p className="text-xs text-muted-foreground">
                {props.prompt.helper}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            ref={cancelRef}
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            className={`flex-1 ${confirmBtnClass}`}
            onClick={handleConfirm}
            disabled={confirmDisabled}
          >
            {submitting ? "Processando…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
