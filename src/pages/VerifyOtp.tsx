import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { authClient } from "@/lib/AuthClient";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/useToast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/InputOtp";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from "framer-motion";

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [autoSubmitEnabled, setAutoSubmitEnabled] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { handleAuthError } = useErrorHandler();

  // Get email from navigation state
  const email = (location.state as { email?: string })?.email;

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate("/login", { replace: true });
    }
  }, [email, navigate]);

  // Handle resend cooldown
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  async function handleVerify() {
    if (otp.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    try {
      // Use signIn.emailOtp as specified
      const result = await authClient.signIn.emailOtp({
        email: email!,
        otp,
      });

      if (result.error) {
        handleAuthError(
          result.error as { status?: number; code?: string; message?: string },
          "Invalid verification code"
        );
        setOtp("");
        setAutoSubmitEnabled(false);
        setIsVerifying(false);
        return;
      }

      toast({
        title: "Welcome to Milkly!",
        description: "You are now signed in.",
      });

      navigate("/", { replace: true });
    } catch (error) {
      handleAuthError(
        error as { status?: number; code?: string; message?: string },
        "Invalid code. Please try again."
      );
      setOtp("");
      setAutoSubmitEnabled(false);
    } finally {
      setIsVerifying(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;

    setIsResending(true);

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email: email!,
        type: "sign-in",
      });

      if (result.error) {
        handleAuthError(
          result.error as { status?: number; code?: string; message?: string },
          "Failed to resend code"
        );
        setIsResending(false);
        return;
      }

      toast({
        title: "Code sent",
        description: "A new verification code has been sent to your email.",
      });

      setResendCooldown(60); // 60 second cooldown
    } catch (error) {
      handleAuthError(
        error as { status?: number; code?: string; message?: string },
        "Please try again later."
      );
    } finally {
      setIsResending(false);
    }
  }

  // Auto-submit when OTP is complete (disabled after a failed attempt)
  useEffect(() => {
    if (otp.length === 6 && !isVerifying && autoSubmitEnabled) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only trigger on otp change
  }, [otp]);

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center cream-gradient safe-area-top safe-area-bottom relative overflow-hidden">
      {/* Decorative Background Elements (Consistent with Login) */}
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
        {/* Back button - top left of page */}
        <div className="fixed top-6 left-6 z-50">
            <Link to="/login">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
            </Link>
        </div>

        <GlassCard className="p-8 md:p-10 border-white/20 shadow-2xl backdrop-blur-xl">
            {/* Logo */}
            <div className="mb-8 text-center">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4 border border-primary/20"
              >
                <Mail className="h-8 w-8 text-primary" />
              </motion.div>
              <h1 className="text-3xl font-serif text-foreground font-medium mb-2">Check your email</h1>
              <p className="text-muted-foreground text-sm max-w-[280px] mx-auto leading-relaxed">
                We sent a 6-digit code to
                <br />
                <span className="font-bold text-foreground font-mono bg-primary/5 px-2 py-0.5 rounded text-xs select-all">{email}</span>
              </p>
            </div>

            {/* OTP Input */}
            <div className="flex flex-col items-center space-y-8">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  disabled={isVerifying}
                >
                  <InputOTPGroup className="gap-3">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot
                        key={index}
                        index={index}
                        className="w-10 h-14 sm:w-12 sm:h-16 text-2xl font-serif bg-white/50 dark:bg-black/20 border-black/5 dark:border-white/10 rounded-xl focus:ring-2 ring-primary/50 transition-all shadow-inner"
                        />
                    ))}
                  </InputOTPGroup>
                </InputOTP>

                <Button
                  onClick={handleVerify}
                  disabled={otp.length !== 6 || isVerifying}
                  className="w-full h-12 text-sm font-bold uppercase tracking-widest rounded-xl shadow-lg hover:shadow-primary/20 transition-all duration-300"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify Code"
                  )}
                </Button>

                <div className="text-center pt-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Did not receive the code?
                  </p>
                  <button
                      onClick={handleResend}
                      disabled={resendCooldown > 0 || isResending}
                      className="mt-2 text-primary text-sm font-bold hover:underline disabled:opacity-50 disabled:no-underline transition-all"
                    >
                      {isResending
                        ? "Sending..."
                        : resendCooldown > 0
                          ? `Resend in ${resendCooldown}s`
                          : "Resend Code"}
                    </button>
                </div>
            </div>
        </GlassCard>
      </motion.div>

      {/* Footer */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-6 left-0 right-0 text-center pointer-events-none"
      >
        <p className="text-[10px] text-muted-foreground/40 uppercase tracking-widest">
            Secure Verification
        </p>
      </motion.div>
    </div>
  );
}
