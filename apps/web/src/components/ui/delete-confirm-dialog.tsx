'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { AlertCircle } from 'lucide-react';
import { useToastNotifications } from '@/lib/toast';

interface DeleteConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  itemName?: string;
  isLoading?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  open,
  title,
  description,
  itemName,
  isLoading = false,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { success, error } = useToastNotifications();

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
      success(`${itemName || 'Elemento'} eliminato con successo`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore durante l\'eliminazione';
      error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isDeleting || isLoading}
          >
            Annulla
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting || isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? 'Eliminazione...' : 'Elimina'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
