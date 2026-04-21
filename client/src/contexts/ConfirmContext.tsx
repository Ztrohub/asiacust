import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";

type ConfirmDialogOptions = {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
};

type ConfirmContextType = {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
  isOpen: boolean;
  options: ConfirmDialogOptions | null;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmDialogOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // We need to store the promise's resolve function
  const [resolvePromise, setResolvePromise] = useState<
    ((value: boolean) => void) | null
  >(null);

  // hardware back close dialog
  const isBackEvent = useRef(false);

  useEffect(() => {
    if (isOpen) {
      window.history.pushState({dialogOpen : true}, '', window.location.href);

      const onPopState = () => {
        isBackEvent.current = true;
        handleCancel(); // Treat back button as "Cancel"
      };

      window.addEventListener('popstate', onPopState);

      return () => {
        window.removeEventListener('popstate', onPopState);
        if (!isBackEvent.current) {
          window.history.back();
        }
        isBackEvent.current = false;
      };
    }
  }, [isOpen]);

  // This is the function components will call
  const confirm = useCallback((options: ConfirmDialogOptions) => {
    return new Promise<boolean>((resolve) => {
      setOptions(options);
      setIsOpen(true);

      // Store the resolve function to be called later
      setResolvePromise(() => resolve);
    });

  }, []); // Empty dependency array, this function never changes

  const handleConfirm = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(true); // Resolve the promise with 'true'
    }

    setIsOpen(false);
    setOptions(null);
    setResolvePromise(null);
  }, [resolvePromise]);

  const handleCancel = useCallback(() => {
    if (resolvePromise) {
      resolvePromise(false); // Resolve the promise with 'false'
    }

    setIsOpen(false);
    setOptions(null);
    setResolvePromise(null);

  }, [resolvePromise]);

  // The value provided to consuming components
  const value = {
    confirm,
    isOpen,
    options,
    onConfirm: handleConfirm,
    onCancel: handleCancel,
  };

  return (
    <ConfirmContext.Provider value={value}>
      {children}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (context === undefined) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }

  return context.confirm;
}

export function useConfirmDialogState() {
  const context = useContext(ConfirmContext);

  if (context === undefined) {
    throw new Error('useConfirmDialogState must be used within a ConfirmProvider');
  }

  return context;
}