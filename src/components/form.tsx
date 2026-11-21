"use client";

import { useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { idle, type ActionState } from "@/actions/state";

type FormAction = (state: ActionState, form: FormData) => Promise<ActionState>;

export function ActionForm({
  action,
  children,
  className,
  resetOnSave,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
  resetOnSave?: boolean;
}) {
  const [state, formAction] = useActionState(action, idle);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSave && state.saved) ref.current?.reset();
  }, [state, resetOnSave]);
  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      <FormMessage state={state} />
    </form>
  );
}

export function FormMessage({ state }: { state: ActionState }) {
  return (
    <p className={state.error ? "message message-error" : "message"} role="status" aria-live="polite">
      {state.error ?? state.saved}
    </p>
  );
}

export function SubmitButton({
  children,
  variant = "primary",
}: {
  children: ReactNode;
  variant?: "primary" | "quiet" | "danger";
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`button button-${variant}`} disabled={pending}>
      {children}
    </button>
  );
}

/** A button that runs one action straight away, for changes that are easy to undo. */
export function ActionButton({
  action,
  children,
  variant = "quiet",
}: {
  action: () => Promise<ActionState>;
  children: ReactNode;
  variant?: "primary" | "quiet" | "danger";
}) {
  const [state, formAction] = useActionState(() => action(), idle);
  return (
    <form action={formAction} className="inline-action">
      <SubmitButton variant={variant}>{children}</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}

/** Names what will be lost before doing it. Pass `typeToConfirm` for what can't be undone. */
export function ConfirmButton({
  label,
  title,
  body,
  action,
  typeToConfirm,
}: {
  label: string;
  title: string;
  body: string;
  action: FormAction;
  typeToConfirm?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, formAction] = useActionState(action, idle);
  const [typed, setTyped] = useState("");
  const armed = !typeToConfirm || typed.trim().toLowerCase() === typeToConfirm.toLowerCase();

  useEffect(() => {
    if (state.saved) dialog.current?.close();
  }, [state]);

  return (
    <>
      <button type="button" className="button button-danger" onClick={() => dialog.current?.showModal()}>
        {label}
      </button>
      <dialog ref={dialog} className="confirm">
        <h2>{title}</h2>
        <p>{body}</p>
        <form action={formAction}>
          {typeToConfirm && (
            <label className="field">
              <span>Type {typeToConfirm} to confirm</span>
              <input
                name="confirm"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                spellCheck={false}
              />
            </label>
          )}
          <div className="actions">
            {armed ? <SubmitButton variant="danger">{label}</SubmitButton> : (
              <button type="button" className="button button-danger" disabled>{label}</button>
            )}
            <button type="button" className="button button-quiet" onClick={() => dialog.current?.close()}>
              Cancel
            </button>
          </div>
          <FormMessage state={state} />
        </form>
      </dialog>
    </>
  );
}
