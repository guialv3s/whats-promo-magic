import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductData } from "@/types/product";
import { generateWhatsAppMessage, createWhatsAppUrl } from "@/utils/messageGenerator";
import { 
  Copy, 
  Send, 
  Check, 
  ExternalLink,
  Image as ImageIcon,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MessagePreviewProps {
  data: ProductData;
  onSave?: () => void;
}

export function MessagePreview({ data, onSave }: MessagePreviewProps) {
  const [copied, setCopied] = useState(false);
  const message = generateWhatsAppMessage(data);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("Mensagem copiada para a área de transferência!");
      setTimeout(() => setCopied(false), 2000);
      onSave?.();
    } catch (error) {
      toast.error("Erro ao copiar mensagem");
    }
  };

  const handleWhatsAppSend = () => {
    const url = createWhatsAppUrl(message);
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");
    
    // Check if popup was blocked
    if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
      toast.error("Popup bloqueado! Clique em 'Copiar Mensagem' e cole manualmente no WhatsApp.", {
        duration: 5000,
        action: {
          label: "Copiar",
          onClick: () => handleCopy(),
        },
      });
      return;
    }
    
    onSave?.();
    toast.success("WhatsApp aberto em nova aba!");
  };

  const calculateDiscount = () => {
    const original = parseFloat(data.originalPrice.replace(/\./g, "").replace(",", "."));
    const discount = parseFloat(data.discountPrice.replace(/\./g, "").replace(",", "."));
    if (original && discount) {
      const percentage = Math.round(((original - discount) / original) * 100);
      return percentage;
    }
    return 0;
  };

  const discountPercentage = calculateDiscount();

  return (
    <div className="space-y-6">
      {/* Preview Card - WhatsApp Style */}
      <Card className="overflow-hidden gradient-card border-border">
        {/* Image Preview */}
        {data.productImage && (
          <div className="relative aspect-video bg-secondary/50 flex items-center justify-center">
            <img 
              src={data.productImage} 
              alt={data.name}
              className="w-24 h-24 object-contain"
            />
            <div className="absolute top-2 right-2 bg-destructive text-foreground text-xs font-bold px-2 py-1 rounded-full">
              -{discountPercentage}%
            </div>
          </div>
        )}

        {!data.productImage && (
          <div className="aspect-video bg-secondary/30 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Imagem do produto</p>
            </div>
          </div>
        )}

        {/* Message Content */}
        <div className="p-4 space-y-3 bg-[hsl(222_47%_12%)]">
          {/* Product Name Header */}
          <div className="bg-primary/20 border-l-4 border-primary p-3 rounded-r-lg">
            <h3 className="font-bold text-foreground">{data.name}</h3>
            {data.storeName && (
              <p className="text-sm text-muted-foreground mt-1">
                Visite a página e encontre todos os produtos de {data.storeName}
              </p>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-1">
            <p className="text-muted-foreground line-through text-sm">
              De R$ {data.originalPrice}
            </p>
            <p className="text-lg font-bold text-foreground">
              Por R$ {data.discountPrice}
              {data.hasCoupon && data.couponName && (
                <span className="text-primary"> com o cupom {data.couponName}</span>
              )}
            </p>
          </div>

          {/* Coupon Alert */}
          {data.hasCoupon && data.couponName && (
            <div className="bg-warning/20 text-warning font-bold text-sm p-2 rounded-lg text-center animate-pulse-soft">
              🔥 CUPOM COM USO LIMITADO, CORRA!
            </div>
          )}

          {/* Link */}
          <div className="pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground mb-1">Link do produto ⬇️</p>
            <a 
              href={data.productLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary text-sm hover:underline flex items-center gap-1 break-all"
            >
              {data.productLink}
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
            </a>
          </div>

          {/* Scheduled Time */}
          {data.scheduledTime && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
              <Clock className="h-4 w-4" />
              <span>
                Agendado para: {format(data.scheduledTime, "PPP 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Raw Message Preview */}
      <Card className="p-4 bg-card border-border">
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Mensagem formatada:</h4>
        <pre className="text-sm text-foreground whitespace-pre-wrap font-mono bg-secondary/30 p-3 rounded-lg overflow-x-auto">
          {message}
        </pre>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          onClick={handleCopy}
          variant="gradient"
          size="xl"
          className="w-full"
        >
          {copied ? (
            <>
              <Check className="h-5 w-5" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="h-5 w-5" />
              Copiar Mensagem
            </>
          )}
        </Button>

        <Button
          onClick={handleWhatsAppSend}
          variant="whatsapp"
          size="xl"
          className="w-full"
        >
          <Send className="h-5 w-5" />
          Enviar pelo WhatsApp
        </Button>
      </div>
    </div>
  );
}
