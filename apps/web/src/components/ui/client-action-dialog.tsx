'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { useToastNotifications } from '@/lib/toast';

export interface DialogConfig {
  isOpen: boolean;
  title: string;
  description?: string;
  content?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
  isDangerous?: boolean; // For delete confirmations
}

interface ClientActionDialogProps extends DialogConfig {
  onOpenChange: (open: boolean) => void;
}

export function ClientActionDialog({
  isOpen,
  title,
  description,
  content,
  confirmText = 'Confirma',
  cancelText = 'Annulla',
  onConfirm,
  onCancel,
  isDangerous = false,
  onOpenChange,
}: ClientActionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToastNotifications();

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm();
      success('Operazione completata!');
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore sconosciuto';
      error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {content && <div className="py-4">{content}</div>}

        <DialogFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={isDangerous ? 'primary' : 'primary'}
            onClick={handleConfirm}
            disabled={isLoading}
            className={isDangerous ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {isLoading ? 'Elaborazione...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
