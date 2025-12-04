import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Smartphone, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Loader2,
  Wifi,
  WifiOff
} from "lucide-react";
import { toast } from "sonner";

export type ConnectionStatus = "disconnected" | "connecting" | "scanning" | "connected" | "error";

interface WhatsAppConnectionProps {
  status: ConnectionStatus;
  qrCode: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onRefreshQR: () => void;
}

export function WhatsAppConnection({ 
  status, 
  qrCode, 
  onConnect, 
  onDisconnect, 
  onRefreshQR 
}: WhatsAppConnectionProps) {
  const getStatusInfo = () => {
    switch (status) {
      case "disconnected":
        return {
          icon: <WifiOff className="h-5 w-5" />,
          text: "WhatsApp Desconectado",
          color: "text-muted-foreground",
          bgColor: "bg-muted/50"
        };
      case "connecting":
        return {
          icon: <Loader2 className="h-5 w-5 animate-spin" />,
          text: "Conectando...",
          color: "text-warning",
          bgColor: "bg-warning/10"
        };
      case "scanning":
        return {
          icon: <QrCode className="h-5 w-5" />,
          text: "Aguardando leitura do QR Code",
          color: "text-primary",
          bgColor: "bg-primary/10"
        };
      case "connected":
        return {
          icon: <CheckCircle2 className="h-5 w-5" />,
          text: "WhatsApp Conectado",
          color: "text-success",
          bgColor: "bg-success/10"
        };
      case "error":
        return {
          icon: <XCircle className="h-5 w-5" />,
          text: "Erro na conexão",
          color: "text-destructive",
          bgColor: "bg-destructive/10"
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className="p-6 bg-card border-border">
      {/* Status Badge */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${statusInfo.bgColor} ${statusInfo.color} mb-6`}>
        {statusInfo.icon}
        <span className="text-sm font-medium">{statusInfo.text}</span>
      </div>

      {/* Disconnected State */}
      {status === "disconnected" && (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-secondary/50 flex items-center justify-center">
            <Smartphone className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Conecte seu WhatsApp
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Para enviar mensagens automaticamente, conecte sua conta do WhatsApp
            </p>
          </div>
          <Button 
            onClick={onConnect} 
            variant="whatsapp" 
            size="lg"
            className="w-full"
          >
            <Wifi className="h-5 w-5 mr-2" />
            Conectar meu WhatsApp
          </Button>
        </div>
      )}

      {/* Connecting State */}
      {status === "connecting" && (
        <div className="text-center space-y-4 py-8">
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground">
            Iniciando conexão com WhatsApp...
          </p>
        </div>
      )}

      {/* QR Code State */}
      {status === "scanning" && (
        <div className="text-center space-y-4">
          <div className="bg-white p-4 rounded-xl inline-block mx-auto">
            {qrCode ? (
              <img 
                src={qrCode} 
                alt="QR Code WhatsApp" 
                className="w-48 h-48"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-secondary/20 rounded-lg">
                <QrCode className="h-20 w-20 text-muted-foreground/30" />
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Escaneie o QR Code
            </h3>
            <ol className="text-sm text-muted-foreground text-left max-w-xs mx-auto space-y-1">
              <li>1. Abra o WhatsApp no seu celular</li>
              <li>2. Toque em <strong>Mais opções</strong> ou <strong>Configurações</strong></li>
              <li>3. Toque em <strong>Aparelhos conectados</strong></li>
              <li>4. Toque em <strong>Conectar um aparelho</strong></li>
              <li>5. Escaneie este QR Code</li>
            </ol>
          </div>

          <div className="flex gap-3 justify-center">
            <Button 
              onClick={onRefreshQR} 
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar QR Code
            </Button>
            <Button 
              onClick={onDisconnect} 
              variant="ghost"
              size="sm"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Connected State */}
      {status === "connected" && (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-success" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              WhatsApp Conectado!
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Você pode enviar mensagens automaticamente agora
            </p>
          </div>
          <Button 
            onClick={onDisconnect} 
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <WifiOff className="h-4 w-4 mr-2" />
            Desconectar
          </Button>
        </div>
      )}

      {/* Error State */}
      {status === "error" && (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Erro na Conexão
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Não foi possível conectar ao WhatsApp. Tente novamente.
            </p>
          </div>
          <Button 
            onClick={onConnect} 
            variant="gradient"
            size="lg"
            className="w-full"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      )}
    </Card>
  );
}
