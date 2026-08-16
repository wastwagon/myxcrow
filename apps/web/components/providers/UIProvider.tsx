import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertDialog } from '@/components/ui/AlertDialog';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { isLightAppSurface } from '@/lib/app-chrome';
import { form } from '@/lib/form-classes';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export interface PromptOptions {
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  submitLabel?: string;
  cancelLabel?: string;
}

interface UIContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
}

const UIContext = createContext<UIContextValue | null>(null);

export function useConfirm() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useConfirm must be used within UIProvider');
  return ctx.confirm;
}

export function usePrompt() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('usePrompt must be used within UIProvider');
  return ctx.prompt;
}

type ConfirmState = ConfirmOptions & {
  open: boolean;
  resolve: (value: boolean) => void;
};

type PromptState = PromptOptions & {
  open: boolean;
  value: string;
  resolve: (value: string | null) => void;
};

export function UIProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [promptState, setPromptState] = useState<PromptState | null>(null);
  const confirmQueue = useRef<ConfirmState[]>([]);
  const promptQueue = useRef<PromptState[]>([]);

  const flushConfirm = useCallback(() => {
    if (confirmState?.open) return;
    const next = confirmQueue.current.shift();
    if (next) setConfirmState({ ...next, open: true });
  }, [confirmState?.open]);

  const flushPrompt = useCallback(() => {
    if (promptState?.open) return;
    const next = promptQueue.current.shift();
    if (next) setPromptState({ ...next, open: true });
  }, [promptState?.open]);

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        const item: ConfirmState = { ...options, open: false, resolve };
        if (!confirmState?.open && confirmQueue.current.length === 0) {
          setConfirmState({ ...item, open: true });
        } else {
          confirmQueue.current.push(item);
        }
      }),
    [confirmState?.open]
  );

  const prompt = useCallback(
    (options: PromptOptions) =>
      new Promise<string | null>((resolve) => {
        const item: PromptState = {
          ...options,
          open: false,
          value: options.defaultValue ?? '',
          resolve,
        };
        if (!promptState?.open && promptQueue.current.length === 0) {
          setPromptState({ ...item, open: true });
        } else {
          promptQueue.current.push(item);
        }
      }),
    [promptState?.open]
  );

  const closeConfirm = (result: boolean) => {
    confirmState?.resolve(result);
    setConfirmState(null);
    setTimeout(flushConfirm, 0);
  };

  const closePrompt = (result: string | null) => {
    promptState?.resolve(result);
    setPromptState(null);
    setTimeout(flushPrompt, 0);
  };

  const value = useMemo(() => ({ confirm, prompt }), [confirm, prompt]);
  const light = isLightAppSurface();

  return (
    <UIContext.Provider value={value}>
      {children}
      {confirmState?.open && (
        <AlertDialog
          open
          tone={light ? 'light' : 'dark'}
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          destructive={confirmState.destructive}
          onConfirm={() => closeConfirm(true)}
          onCancel={() => closeConfirm(false)}
        />
      )}
      {promptState?.open && (
        <Sheet
          open
          tone={light ? 'light' : 'dark'}
          onClose={() => closePrompt(null)}
          title={promptState.title}
          footer={
            <div className="flex flex-col gap-2 pb-2">
              <Button
                fullWidth
                variant={light ? 'maroon' : 'filled'}
                onClick={() => closePrompt(promptState.value.trim())}
              >
                {promptState.submitLabel ?? 'Continue'}
              </Button>
              <Button fullWidth variant={light ? 'outline' : 'plain'} onClick={() => closePrompt(null)}>
                {promptState.cancelLabel ?? 'Cancel'}
              </Button>
            </div>
          }
        >
          {promptState.message && (
            <p
              className={
                light
                  ? 'mb-4 text-[15px] text-[rgba(60,60,67,0.6)]'
                  : 'mb-4 text-ios-subhead text-label-secondary'
              }
            >
              {promptState.message}
            </p>
          )}
          <input
            type="text"
            autoFocus
            value={promptState.value}
            onChange={(e) =>
              setPromptState((s) => (s ? { ...s, value: e.target.value } : s))
            }
            placeholder={promptState.placeholder}
            className={light ? form.input : 'w-full min-h-[48px] px-4 py-3 rounded-[12px] bg-white/5 border border-white/20 text-label-primary placeholder:text-label-tertiary focus:ring-2 focus:ring-brand-gold focus:border-brand-gold/50 outline-none'}
            onKeyDown={(e) => {
              if (e.key === 'Enter') closePrompt(promptState.value.trim());
            }}
          />
        </Sheet>
      )}
    </UIContext.Provider>
  );
}
