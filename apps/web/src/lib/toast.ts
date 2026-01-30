import { useToast } from "@/hooks/use-toast";

export function useToastNotifications() {
  const { toast } = useToast();

  return {
    success: (message: string, description?: string) =>
      toast({
        title: "✓ Successo",
        description: description || message,
        variant: "default",
        duration: 3000,
      }),

    error: (message: string, description?: string) =>
      toast({
        title: "✗ Errore",
        description: description || message,
        variant: "destructive",
        duration: 4000,
      }),

    info: (message: string, description?: string) =>
      toast({
        title: "ℹ Informazione",
        description: description || message,
        variant: "default",
        duration: 3000,
      }),

    warning: (message: string, description?: string) =>
      toast({
        title: "⚠ Attenzione",
        description: description || message,
        variant: "default",
        duration: 3500,
      }),
  };
}
