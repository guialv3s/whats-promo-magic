import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageHistoryItem } from "@/types/product";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Edit, 
  Copy, 
  Trash2, 
  History,
  ChevronRight,
  Tag
} from "lucide-react";
import { toast } from "sonner";

interface MessageHistoryProps {
  history: MessageHistoryItem[];
  onEdit: (item: MessageHistoryItem) => void;
  onDuplicate: (item: MessageHistoryItem) => void;
  onDelete: (id: string) => void;
}

export function MessageHistory({ history, onEdit, onDuplicate, onDelete }: MessageHistoryProps) {
  const handleCopyMessage = async (message: string) => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Mensagem copiada!");
    } catch (error) {
      toast.error("Erro ao copiar");
    }
  };

  if (history.length === 0) {
    return (
      <Card className="p-8 text-center bg-card border-border">
        <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">
          Nenhuma mensagem criada ainda
        </h3>
        <p className="text-sm text-muted-foreground/70">
          As mensagens que você criar aparecerão aqui
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item, index) => (
        <Card 
          key={item.id} 
          className="p-4 bg-card border-border hover:border-primary/30 transition-all duration-200 animate-fade-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-foreground truncate">{item.name}</h4>
                {item.hasCoupon && item.couponName && (
                  <span className="flex items-center gap-1 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                    <Tag className="h-3 w-3" />
                    {item.couponName}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="line-through">R$ {item.originalPrice}</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-success font-medium">R$ {item.discountPrice}</span>
              </div>
              <p className="text-xs text-muted-foreground/70 mt-2">
                Criado em {format(new Date(item.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopyMessage(item.generatedMessage)}
                title="Copiar mensagem"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(item)}
                title="Editar"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDuplicate(item)}
                title="Duplicar"
              >
                <Copy className="h-4 w-4 rotate-90" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(item.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
