import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScheduledMessage } from "@/services/api";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
    Clock,
    CheckCircle2,
    XCircle,
    Calendar,
    Trash2,
    Send,
    AlertCircle,
    RefreshCw,
    MessageSquare
} from "lucide-react";

interface ScheduledMessagesListProps {
    messages: ScheduledMessage[];
    isLoading: boolean;
    onCancel: (id: string) => void;
    onRefresh: () => void;
}

export function ScheduledMessagesList({
    messages,
    isLoading,
    onCancel,
    onRefresh
}: ScheduledMessagesListProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case "scheduled":
                return (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        <Clock className="h-3 w-3 mr-1" />
                        Agendada
                    </Badge>
                );
            case "sent":
                return (
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Enviada
                    </Badge>
                );
            case "failed":
                return (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                        <XCircle className="h-3 w-3 mr-1" />
                        Falhou
                    </Badge>
                );
            case "cancelled":
                return (
                    <Badge variant="outline" className="bg-muted text-muted-foreground">
                        <XCircle className="h-3 w-3 mr-1" />
                        Cancelada
                    </Badge>
                );
            case "expired":
                return (
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Expirada
                    </Badge>
                );
            default:
                return null;
        }
    };

    const scheduledMessages = messages.filter(m => m.status === "scheduled");
    const pastMessages = messages.filter(m => m.status !== "scheduled");

    if (messages.length === 0) {
        return (
            <Card className="p-8 text-center bg-card border-border">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                    Nenhuma mensagem agendada
                </h3>
                <p className="text-sm text-muted-foreground">
                    Crie uma mensagem e agende para um horário específico
                </p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">
                        Mensagens Agendadas
                    </h3>
                    {scheduledMessages.length > 0 && (
                        <Badge variant="secondary">
                            {scheduledMessages.length} pendente{scheduledMessages.length !== 1 ? 's' : ''}
                        </Badge>
                    )}
                </div>
                <Button
                    onClick={onRefresh}
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                    {/* Pending Messages */}
                    {scheduledMessages.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Aguardando envio
                            </h4>
                            {scheduledMessages.map((message) => (
                                <MessageCard
                                    key={message.id}
                                    message={message}
                                    onCancel={onCancel}
                                    getStatusBadge={getStatusBadge}
                                />
                            ))}
                        </div>
                    )}

                    {/* Past Messages */}
                    {pastMessages.length > 0 && (
                        <div className="space-y-3 mt-6">
                            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Histórico
                            </h4>
                            {pastMessages.map((message) => (
                                <MessageCard
                                    key={message.id}
                                    message={message}
                                    onCancel={onCancel}
                                    getStatusBadge={getStatusBadge}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

interface MessageCardProps {
    message: ScheduledMessage;
    onCancel: (id: string) => void;
    getStatusBadge: (status: string) => React.ReactNode;
}

function MessageCard({ message, onCancel, getStatusBadge }: MessageCardProps) {
    const scheduledTime = new Date(message.scheduledTime);
    const isScheduled = message.status === "scheduled";
    const isPastTime = isPast(scheduledTime);

    return (
        <Card className="p-4 bg-card/50 border-border hover:bg-card transition-colors">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {/* Group name */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-foreground truncate">
                            {message.groupName || "Grupo"}
                        </span>
                        {getStatusBadge(message.status)}
                    </div>

                    {/* Message preview */}
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {message.message.substring(0, 100)}...
                    </p>

                    {/* Time info */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(scheduledTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>

                        {isScheduled && !isPastTime && (
                            <span className="text-primary">
                                {formatDistanceToNow(scheduledTime, {
                                    addSuffix: true,
                                    locale: ptBR
                                })}
                            </span>
                        )}

                        {message.sentAt && (
                            <span className="flex items-center gap-1 text-success">
                                <Send className="h-3 w-3" />
                                Enviada {format(new Date(message.sentAt), "HH:mm", { locale: ptBR })}
                            </span>
                        )}
                    </div>

                    {/* Error message */}
                    {message.error && (
                        <p className="text-xs text-destructive mt-2">
                            Erro: {message.error}
                        </p>
                    )}
                </div>

                {/* Actions */}
                {isScheduled && (
                    <Button
                        onClick={() => onCancel(message.id)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </Card>
    );
}
