import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Delete",
  cancelText = "Cancel",
  isConfirmDisabled = false
}) {
  const handleConfirm = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('ConfirmationDialog - handleConfirm called');
    onConfirm();
  };

  const handleCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('ConfirmationDialog - handleCancel called');
    onClose();
  };

  const handleOpenChange = (open) => {
    console.log('ConfirmationDialog - openChange:', open);
    if (!open) {
      onClose();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="bg-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-slate-900">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-600">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isConfirmDisabled}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}