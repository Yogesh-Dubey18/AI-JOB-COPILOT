"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Bot, Send, Sparkles, User, RefreshCw, HelpCircle, MessageSquare } from "lucide-react";
import { useEffect, useRef, useState, useId } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
  suggestedActions?: string[];
  createdAt: Date;
}

const PRESET_PROMPTS = [
  "How can I tailor my resume for a Full Stack Developer role?",
  "Analyze this rejection reason: 'Looking for more Node.js testing experience'",
  "What are the top skills I should add to pass ATS screening?",
  "Help me draft a polite salary negotiation response."
];

export default function CareerMentorChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your AI Career Mentor. Ask me anything about tailoring your resume, optimizing your profile, preparing for interviews, or analyzing recruiter feedback. How can I help you today?",
      suggestedActions: [
        "Optimize resume",
        "Practice interview",
        "Negotiate salary"
      ],
      createdAt: new Date()
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textInputId = useId();

  const aiStatus = useQuery({ 
    queryKey: ["ai-status"], 
    queryFn: () => api.get<any>("/ai/status"), 
    retry: false 
  });

  const chatMutation = useMutation({
    mutationFn: (messageText: string) => 
      api.post<any>("/ai/chat", { 
        message: messageText,
        targetRole: "Full Stack Developer" 
      }),
    onSuccess: (data) => {
      const answer = data?.answer || "I could not generate an answer. Please try again.";
      const suggestedActions = data?.suggestedActions || [];
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: answer,
          suggestedActions,
          createdAt: new Date()
        }
      ]);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to get reply from Career Mentor.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error while processing your request. Please check your network connection and try again.",
          createdAt: new Date()
        }
      ]);
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatMutation.isPending]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || chatMutation.isPending) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, createdAt: new Date() }
    ]);
    setInput("");
    chatMutation.mutate(text);
  };

  const handleSuggestionClick = (action: string) => {
    let queryText = "";
    if (action.toLowerCase().includes("resume")) {
      queryText = "How do I optimize my resume for ATS filters?";
    } else if (action.toLowerCase().includes("interview")) {
      queryText = "What is the best way to practice for a technical interview?";
    } else if (action.toLowerCase().includes("salary")) {
      queryText = "Give me tips on negotiating my starting CTC package.";
    } else {
      queryText = action;
    }
    handleSend(queryText);
  };

  return (
    <AppShell>
      <PageHeading
        title="AI Career Mentor"
        description="Get personalized, ATS-focused mentorship, outreach advice, salary negotiation feedback, and career roadmap plans."
      />

      {aiStatus.data && (
        <div className="mb-4 flex flex-wrap gap-2 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-md border">
          <span className="font-semibold text-foreground">AI Status:</span>
          <span>Provider: {aiStatus.data.provider}</span>
          <span>·</span>
          <span>Model: {aiStatus.data.model}</span>
          <span>·</span>
          <span>Limit checks active</span>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        {/* Chat Interface Container */}
        <Card className="flex flex-col h-[600px] border shadow-md relative overflow-hidden bg-card/60 backdrop-blur-sm">
          {/* Messages Scroller */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={index}
                  className={`flex gap-3 max-w-[85%] ${
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full text-xs shadow-sm ${
                      isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  <div className="space-y-2">
                    <div
                      className={`rounded-lg px-4 py-2.5 text-sm shadow-sm leading-relaxed ${
                        isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/80 text-foreground border border-border"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Suggested Action Chips */}
                    {!isUser && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.suggestedActions.map((action, actionIdx) => (
                          <button
                            key={actionIdx}
                            type="button"
                            onClick={() => handleSuggestionClick(action)}
                            className="inline-flex items-center rounded-full border border-teal-200 bg-teal-50/50 dark:border-teal-900/30 dark:bg-teal-950/20 px-2.5 py-0.5 text-xs font-medium text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-950/40 transition duration-150"
                          >
                            <Sparkles className="mr-1 h-3 w-3" />
                            {action}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {chatMutation.isPending && (
              <div className="flex gap-3 max-w-[80%] mr-auto items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground border">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex gap-1 items-center bg-muted/60 border rounded-lg px-4 py-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Form */}
          <div className="border-t bg-muted/20 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <input
                id={textInputId}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about resume keywords, interview tips, salaries..."
                className="flex-1 h-10 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                disabled={chatMutation.isPending}
                autoComplete="off"
              />
              <Button type="submit" size="sm" disabled={!input.trim() || chatMutation.isPending}>
                {chatMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span className="sr-only">Send message</span>
              </Button>
            </form>
          </div>
        </Card>

        {/* Sidebar Info/Prompts */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span>Suggested Topics</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Click any of these common prompts to start chatting with your mentor:
              </p>
              <div className="flex flex-col gap-2">
                {PRESET_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(prompt)}
                    className="text-left text-xs text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded border border-transparent hover:border-border transition duration-150"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 font-semibold text-foreground mb-1">
                <MessageSquare className="h-4 w-4 text-primary" />
                <span>Privacy & Safety</span>
              </div>
              <p>Your mentor session is confidential. AI safety guardrails prevent sensitive data uploads, and credentials are redacted prior to processing.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
