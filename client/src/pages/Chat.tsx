import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Search, MessageSquare, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Chat() {
  const { user } = useAuth();
  const empresaId = 1; // ID da empresa fixo para o exemplo
  const [selectedConv, setSelectedConv] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: conversations, refetch: refetchConvs } = trpc.chat.listConversations.useQuery({ empresaId });
  const { data: messages, refetch: refetchMessages } = trpc.chat.listMessages.useQuery(
    { conversationId: selectedConv! },
    { enabled: !!selectedConv, refetchInterval: 3000 } // Polling simples a cada 3s
  );
  const { data: allUsers } = trpc.dashboard.listUsers.useQuery({});

  // Mutations
  const sendMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessage("");
      refetchMessages();
      refetchConvs();
    }
  });

  const createConvMutation = trpc.chat.getOrCreateDirectConversation.useMutation({
    onSuccess: (data) => {
      setSelectedConv(data.id);
      refetchConvs();
    }
  });

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedConv) return;
    sendMutation.mutate({ conversationId: selectedConv, content: message });
  };

  const handleStartChat = (targetUserId: number) => {
    createConvMutation.mutate({ empresaId, targetUserId });
  };

  const currentConv = conversations?.find(c => c.id === selectedConv);

  return (
    <div className="flex h-[calc(100vh-120px)] bg-background border rounded-xl overflow-hidden shadow-sm">
      {/* Lista de Conversas */}
      <div className="w-80 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b bg-background">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Chat Interno
          </h2>
          <div className="relative mt-3">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar usuários..." className="pl-8 h-9" />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1 tracking-wider">Conversas Recentes</p>
            {conversations?.map(conv => (
              <button
                key={conv.id}
                onClick={() => setSelectedConv(conv.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                  selectedConv === conv.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                )}
              >
                <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                  <AvatarFallback className="bg-primary/5 text-primary">
                    {conv.isGroup ? <Users className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {conv.isGroup ? conv.name : (conv as any).otherUserName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">Clique para ver mensagens</p>
                </div>
              </button>
            ))}

            <p className="text-[10px] font-bold text-muted-foreground uppercase px-2 py-1 mt-4 tracking-wider">Todos os Usuários</p>
            {allUsers?.filter(u => u.id !== user?.id).map(u => (
              <button
                key={u.id}
                onClick={() => handleStartChat(u.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-[10px]">{u.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium truncate">{u.name}</p>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Janela de Chat */}
      <div className="flex-1 flex flex-col bg-background">
        {selectedConv ? (
          <>
            {/* Header do Chat */}
            <div className="p-4 border-b flex items-center justify-between bg-background/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 border shadow-sm">
                  <AvatarFallback className="bg-primary/5 text-primary">
                    {currentConv?.isGroup ? <Users className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-sm">
                    {currentConv?.isGroup ? currentConv.name : (currentConv as any).otherUserName}
                  </h3>
                  <p className="text-[10px] text-green-500 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Online agora
                  </p>
                </div>
              </div>
            </div>

            {/* Mensagens */}
            <ScrollArea className="flex-1 p-4 bg-muted/10">
              <div className="space-y-4">
                {messages?.slice().reverse().map(msg => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col max-w-[75%]",
                      msg.senderId === user?.id ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <div
                      className={cn(
                        "p-3 rounded-2xl text-sm shadow-sm",
                        msg.senderId === user?.id 
                          ? "bg-primary text-primary-foreground rounded-tr-none" 
                          : "bg-card text-foreground rounded-tl-none border"
                      )}
                    >
                      <p className="leading-relaxed">{msg.content}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-1 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t bg-background">
              <form onSubmit={handleSend} className="flex gap-2 max-w-4xl mx-auto">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escreva sua mensagem..."
                  className="flex-1 h-11 bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary"
                />
                <Button type="submit" size="icon" className="h-11 w-11 rounded-full shadow-lg" disabled={sendMutation.isPending}>
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageSquare className="h-10 w-10 opacity-20" />
            </div>
            <p className="font-medium">Selecione uma conversa para começar</p>
            <p className="text-sm opacity-60">Escolha um usuário na lista ao lado</p>
          </div>
        )}
      </div>
    </div>
  );
}
