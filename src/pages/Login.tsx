import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Lock, LogIn } from "lucide-react";

export default function Login() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem("rotiq-auth-token", data.token);
      }
      utils.auth.me.setData(undefined, data.user);
      toast.success("Login realizado com sucesso!");
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao fazer login");
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      utils.auth.me.setData(undefined, data.user);
      toast.success("Cadastro realizado com sucesso!");
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (isLogin) {
      loginMutation.mutate({ email, password });
    } else {
      if (!name) {
        toast.error("Preencha todos os campos");
        return;
      }
      registerMutation.mutate({ email, password, name, companyCode });
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-primary mb-4">
            <LogIn className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Rotiq</h1>
          <p className="text-slate-400 mt-2">Sistema de Gestão de Frota</p>
        </div>

        {/* Card */}
        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl text-white">
              {isLogin ? "Entrar" : "Criar Conta"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Faça login para acessar o sistema"
                : "Crie uma conta para começar"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name field - only for register */}
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200">
                      Nome
                    </label>
                    <Input
                      type="text"
                      placeholder="Seu nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoading}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200">
                      Código da Empresa (ID ou Convite)
                    </label>
                    <Input
                      type="text"
                      placeholder="Ex: 1 ou CODIGO123"
                      value={companyCode}
                      onChange={(e) => setCompanyCode(e.target.value)}
                      disabled={isLoading}
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                    />
                  </div>
                </>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-semibold h-10"
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    {isLogin ? "Entrando..." : "Cadastrando..."}
                  </>
                ) : (
                  isLogin ? "Entrar" : "Criar Conta"
                )}
              </Button>

              {/* Toggle between login and register */}
              <div className="text-center text-sm text-slate-400">
                {isLogin ? "Não tem conta? " : "Já tem conta? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setEmail("");
                    setPassword("");
                    setName("");
                  }}
                  disabled={isLoading}
                  className="text-primary hover:text-primary/90 font-semibold transition-colors"
                >
                  {isLogin ? "Cadastre-se" : "Faça login"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Demo credentials hint */}
        <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
          <p className="text-xs text-slate-400 text-center">
            <span className="font-semibold text-slate-300">Demo:</span> Use qualquer email e senha com 6+ caracteres
          </p>
        </div>
      </div>
    </div>
  );
}
