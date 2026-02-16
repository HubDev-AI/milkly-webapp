import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "@/lib/AuthClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useToast } from "@/hooks/useToast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { Loader2, ArrowRight, Sparkles } from "lucide-react";
import { MilklyLogo } from "@/components/MilklyLogo";
import { GlassCard } from "@/components/ui/GlassCard"; // IMPORTED
import { motion } from "framer-motion"; // IMPORTED

export default function Login() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { handleAuthError } = useErrorHandler();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: normalizedEmail,
        type: "sign-in",
      });

      if (result.error) {
        handleAuthError(
          result.error as { status?: number; code?: string; message?: string },
          "Failed to send verification code"
        );
        return;
      }

      // Navigate to OTP verification page
      navigate("/verify-otp", { state: { email: normalizedEmail } });
    } catch (error) {
      handleAuthError(
        error as { status?: number; code?: string; message?: string },
        "Failed to send verification code"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center cream-gradient safe-area-top safe-area-bottom relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] opacity-30" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-orange-400/20 rounded-full blur-[120px] opacity-30" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <GlassCard className="p-8 md:p-10 border-white/20 shadow-2xl backdrop-blur-xl">
            {/* Logo and branding */}
            <div className="mb-8 flex flex-col items-center justify-center space-y-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                  <MilklyLogo size="lg" className="items-center scale-125" />
              </motion.div>
            </div>

            {/* Login form */}
            <motion.form 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 0.5 }}
                onSubmit={handleSubmit} 
                className="space-y-6"
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  Email Address
                </Label>
                <div className="relative group">
                    <Input
                      id="email"
                      type="email"
                      placeholder="editor@milkly.app"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="h-12 px-4 bg-white/50 dark:bg-black/20 border-black/5 dark:border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all text-base rounded-xl backdrop-blur-sm"
                      autoComplete="email"
                      autoFocus
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500" />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-sm font-bold uppercase tracking-widest rounded-xl shadow-lg hover:shadow-primary/20 transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <span className="flex items-center gap-2">
                    Enter Workspace <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </motion.form>

            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 0.6 }}
                className="mt-8 pt-6 border-t border-black/5 dark:border-white/5 text-center"
            >
                <p className="text-xs text-muted-foreground/60 flex items-center justify-center gap-2">
                    <Sparkles className="w-3 h-3 text-primary/50" />
                    <span>Secure Passwordless Entry</span>
                    <Sparkles className="w-3 h-3 text-primary/50" />
                </p>
            </motion.div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
