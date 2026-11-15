import Modal from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isPending?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

// In-page confirmation for destructive actions (no window.confirm).
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  isPending = false,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-base-content/80">{message}</p>
      {error && (
        <div role="alert" className="alert alert-error alert-soft mt-4 text-sm">
          {error}
        </div>
      )}
      <div className="modal-action">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isPending}>
          Cancel
        </button>
        <button type="button" className="btn btn-error" onClick={onConfirm} disabled={isPending}>
          {isPending && <span className="loading loading-spinner loading-sm" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
