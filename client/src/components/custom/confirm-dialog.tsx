import { useConfirmDialogState } from "@/contexts/ConfirmContext";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";

export function ConfirmDialog() {
  // Get the state and handlers from the context
  const { options, isOpen, onConfirm, onCancel } = useConfirmDialogState();

  if (!options) {
    return null;
  }

  const { title, description, confirmText, cancelText } = options;

  return (
    // Note: We use onOpenChange to handle clicks outside the dialog
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            {cancelText || "Tidak"}
          </AlertDialogCancel>
          <AlertDialogAction 
            className={options.variant === 'destructive' ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            onClick={onConfirm}
          >
            {confirmText || "Ya"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}