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
import { AlertTriangle, Trash2, X } from "lucide-react";
import { motion } from "framer-motion";

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
      <AlertDialogContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-0 shadow-2xl max-w-md mx-auto rounded-2xl overflow-hidden">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <AlertDialogHeader className="p-6 pb-4 text-center">
            {/* Warning Icon */}
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            
            <AlertDialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {title}
            </AlertDialogTitle>
            
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="p-6 pt-2 flex gap-3">
            <AlertDialogCancel 
              onClick={handleCancel} 
              disabled={isConfirmDisabled}
              className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border-0 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <X className="w-4 h-4 mr-2" />
              {cancelText}
            </AlertDialogCancel>
            
            <AlertDialogAction 
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
              className="flex-1 h-11 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-red-400 disabled:to-red-500 text-white border-0 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
}