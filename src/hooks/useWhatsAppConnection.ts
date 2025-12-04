import { useState, useCallback } from "react";
import { ConnectionStatus } from "@/components/WhatsAppConnection";
import { toast } from "sonner";

const STORAGE_KEY = "whatsapp-connection-status";

interface UseWhatsAppConnectionReturn {
  status: ConnectionStatus;
  qrCode: string | null;
  connect: () => void;
  disconnect: () => void;
  refreshQR: () => void;
}

export function useWhatsAppConnection(): UseWhatsAppConnectionReturn {
  const [status, setStatus] = useState<ConnectionStatus>(() => {
    // Check if there's a saved connection status
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "connected" ? "connected" : "disconnected";
  });
  const [qrCode, setQrCode] = useState<string | null>(null);

  const connect = useCallback(async () => {
    setStatus("connecting");
    
    // TODO: Replace this with actual backend API call
    // Example: const response = await fetch('/api/whatsapp/connect');
    
    // Simulate connection delay
    setTimeout(() => {
      setStatus("scanning");
      // Generate a placeholder QR code
      // In production, this would come from the backend (Baileys/whatsapp-web.js)
      setQrCode(generatePlaceholderQR());
      toast.info("Escaneie o QR Code com seu WhatsApp");
    }, 1500);

    // Simulate successful connection after QR scan
    // TODO: In production, this would be triggered by WebSocket event from backend
    setTimeout(() => {
      setStatus("connected");
      setQrCode(null);
      localStorage.setItem(STORAGE_KEY, "connected");
      toast.success("WhatsApp conectado com sucesso!");
    }, 15000); // 15 seconds to simulate user scanning
  }, []);

  const disconnect = useCallback(() => {
    // TODO: Replace with actual backend API call
    // Example: await fetch('/api/whatsapp/disconnect', { method: 'POST' });
    
    setStatus("disconnected");
    setQrCode(null);
    localStorage.removeItem(STORAGE_KEY);
    toast.info("WhatsApp desconectado");
  }, []);

  const refreshQR = useCallback(() => {
    if (status === "scanning") {
      // TODO: Replace with actual backend API call to get new QR
      // Example: const response = await fetch('/api/whatsapp/refresh-qr');
      
      setQrCode(generatePlaceholderQR());
      toast.info("QR Code atualizado");
    }
  }, [status]);

  return {
    status,
    qrCode,
    connect,
    disconnect,
    refreshQR,
  };
}

// Placeholder QR code generator - replace with actual QR from backend
function generatePlaceholderQR(): string {
  // This creates a simple data URL for a placeholder QR code
  // In production, the QR code string would come from Baileys/whatsapp-web.js
  const canvas = document.createElement("canvas");
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext("2d");
  
  if (ctx) {
    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 200, 200);
    
    // Draw QR-like pattern (placeholder)
    ctx.fillStyle = "#000000";
    const size = 8;
    for (let y = 0; y < 25; y++) {
      for (let x = 0; x < 25; x++) {
        // Create finder patterns (corners)
        const isFinderPattern = 
          (x < 7 && y < 7) || 
          (x >= 18 && y < 7) || 
          (x < 7 && y >= 18);
        
        if (isFinderPattern) {
          const isOuter = x === 0 || x === 6 || y === 0 || y === 6 ||
                         x === 18 || x === 24 || y === 18 || y === 24;
          const isInner = (x >= 2 && x <= 4 && y >= 2 && y <= 4) ||
                         (x >= 20 && x <= 22 && y >= 2 && y <= 4) ||
                         (x >= 2 && x <= 4 && y >= 20 && y <= 22);
          if (isOuter || isInner) {
            ctx.fillRect(x * size, y * size, size, size);
          }
        } else if (Math.random() > 0.5) {
          ctx.fillRect(x * size, y * size, size, size);
        }
      }
    }
  }
  
  return canvas.toDataURL();
}
