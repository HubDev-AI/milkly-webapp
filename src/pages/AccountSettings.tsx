import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/Api";
import { useAuth, authClient } from "@/lib/AuthClient";
import { MilklyLogo } from "@/components/MilklyLogo";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import {
  ArrowLeft,
  Loader2,
  User,
  Download,
  Trash2,
  AlertTriangle,
  Mail,
  Moon,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useTheme } from "@/hooks/use-theme";
import { Switch } from "@/components/ui/Switch";

import { GlassCard } from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "framer-motion";

const CONFIRMATION_TEXT = "DELETE MY ACCOUNT";

export default function AccountSettings() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [confirmationInput, setConfirmationInput] = useState<string>("");

  // Export data mutation
  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const response = await api.raw("/account/data", { method: "GET" });
      if (!response.ok) {
        throw new Error("Failed to export data");
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `account-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your account data has been downloaded.",
      });
    },
    onError: () => {
      toast({
        title: "Export failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      return api.delete("/account", {
        method: "DELETE",
        body: JSON.stringify({ confirmation: CONFIRMATION_TEXT }),
      });
    },
    onSuccess: async () => {
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      // Sign out and redirect to login
      await authClient.signOut();
      navigate("/login", { replace: true });
    },
    onError: () => {
      toast({
        title: "Deletion failed",
        description: "Failed to delete your account. Please try again.",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
    },
  });

  const handleDeleteAccount = () => {
    if (confirmationInput === CONFIRMATION_TEXT) {
      deleteAccountMutation.mutate();
    }
  };

  const handleCloseDialog = () => {
    setDeleteDialogOpen(false);
    setConfirmationInput("");
  };

  const isConfirmationValid = confirmationInput === CONFIRMATION_TEXT;

  return (
    <div className="min-h-screen cream-gradient-subtle relative overflow-x-hidden pt-6 pb-20">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/3 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/40 backdrop-blur-2xl border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="group flex items-center gap-3 text-[10px] font-bold tracking-[0.3em] text-primary/60 hover:text-primary transition-all duration-300 uppercase italic"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </Link>
            <div className="h-8 w-px bg-primary/10 rotate-12" />
            <MilklyLogo size="sm" />
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-primary/10 backdrop-blur-md">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
              <span className="text-[9px] font-bold tracking-widest text-primary/70 uppercase">Security Integrity</span>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="relative z-10 px-6 max-w-5xl mx-auto mt-16 md:mt-24">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-primary/5 pb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-bold tracking-[0.4em] text-primary/70 uppercase italic">Digital Identity</span>
               <div className="h-px w-8 bg-primary/30" />
            </div>
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter text-foreground font-serif italic">
               Account <span className="text-primary/10 font-sans not-italic font-black opacity-30 select-none">/ 10</span>
            </h1>
            <p className="text-lg text-primary/60 font-medium max-w-xl leading-relaxed">
               Calibrate your core parameters. Orchestrate how you interface with the Milkly nexus.
            </p>
          </div>
          
          <div className="flex flex-col items-start md:items-end gap-3">
             <div className="text-[10px] font-bold tracking-widest text-primary/40 uppercase">Identity Manifest</div>
             <div className="px-5 py-2.5 rounded-2xl bg-primary/5 backdrop-blur-3xl border border-primary/10 shadow-lg flex items-center gap-3">
                <div className="flex -space-x-2">
                   <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-primary" />
                   </div>
                   <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center">
                      <Settings className="w-3.5 h-3.5 text-primary" />
                   </div>
                </div>
                <div className="h-6 w-px bg-primary/10" />
                <span className="text-xs font-bold text-primary tracking-tight">Active Session</span>
             </div>
          </div>
        </div>

        {isAuthLoading ? (
           <AnimatePresence>
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
             >
               <AccountSettingsSkeleton />
             </motion.div>
           </AnimatePresence>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, staggerChildren: 0.1 }}
            className="space-y-12"
          >
            {/* Profile Information Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <GlassCard className="p-8 group relative bg-white/5">
                 <div className="flex items-center gap-6 mb-10 pb-6 border-b border-primary/5">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                      <User className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-serif italic text-foreground leading-none">Identity</h3>
                      <p className="text-[10px] font-bold tracking-[0.3em] text-primary/40 uppercase mt-1">Core Profile manifest</p>
                    </div>
                 </div>
                 
                 <div className="space-y-8">
                   <div className="space-y-2">
                     <Label className="text-[10px] font-black tracking-widest text-primary/40 uppercase flex items-center gap-2">
                       <User className="h-3 w-3" />
                       Manifest Designation
                     </Label>
                     <p className="text-lg font-serif italic text-foreground px-1">
                       {user?.name || "Unidentified Entity"}
                     </p>
                   </div>
                   <div className="space-y-2">
                     <Label className="text-[10px] font-black tracking-widest text-primary/40 uppercase flex items-center gap-2">
                       <Mail className="h-3 w-3" />
                       Signal Frequency
                     </Label>
                     <p className="text-lg font-serif italic text-foreground px-1">{user?.email}</p>
                   </div>
                 </div>
               </GlassCard>

               <GlassCard className="p-8 group relative bg-white/5">
                  <div className="flex items-center gap-6 mb-10 pb-6 border-b border-primary/5">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                      <Settings className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-serif italic text-foreground leading-none">Loom</h3>
                      <p className="text-[10px] font-bold tracking-[0.3em] text-primary/40 uppercase mt-1">Interface Calibration</p>
                    </div>
                  </div>
                  
                  <div className="h-full flex flex-col justify-start pt-2">
                     <ThemeToggle />
                     
                     <div className="mt-12 p-4 rounded-xl bg-primary/5 border border-primary/5 space-y-2">
                        <div className="flex items-center gap-2 text-[9px] font-black tracking-widest text-primary/40 uppercase">
                           <Moon className="h-3 w-3" />
                           Atmospheric Note
                        </div>
                        <p className="text-[10px] text-primary/60 italic leading-relaxed">
                           Adjusting your interface luminosity affects all connected nodes within this digital ecosystem.
                        </p>
                     </div>
                  </div>
               </GlassCard>
            </div>

            {/* Export Data Card */}
            <GlassCard className="p-8 group bg-white/5">
              <div className="flex flex-col md:flex-row justify-between gap-10">
                <div className="space-y-6 flex-1">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 shadow-xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                      <Download className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-serif italic text-foreground leading-none">Manifest Extraction</h3>
                      <p className="text-[10px] font-bold tracking-[0.3em] text-primary/40 uppercase mt-1">Historical Archive Access</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-primary/70 leading-relaxed max-w-xl italic">
                    You can initiate a complete temporal snapshot of your account's digital footprint. This generates a structured JSON manifest containing your profile, architectures, and integrated signals.
                  </p>
                </div>
                
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    className="h-16 px-8 rounded-xl border-blue-500/20 bg-white/5 hover:bg-blue-500/5 font-black tracking-widest uppercase text-xs transition-all gap-3 shadow-lg shadow-blue-500/5 group"
                    onClick={() => exportDataMutation.mutate()}
                    disabled={exportDataMutation.isPending}
                  >
                    {exportDataMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Download className="h-5 w-5 group-hover:-translate-y-1 transition-transform" />
                    )}
                    Initiate Extraction
                  </Button>
                </div>
              </div>
            </GlassCard>

            {/* Danger Zone Card */}
            <GlassCard className="p-8 border-destructive/20 bg-destructive/5 group overflow-hidden relative">
               {/* Risk Shimmer */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-destructive/10 blur-[100px] -translate-y-1/2 translate-x-1/2" />
               
               <div className="flex flex-col md:flex-row justify-between gap-10 relative z-10">
                  <div className="space-y-6 flex-1">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 shadow-xl group-hover:scale-110 transition-transform duration-500">
                        <AlertTriangle className="h-7 w-7 text-destructive" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-serif italic text-destructive leading-none">Terminal Protocol</h3>
                        <p className="text-[10px] font-bold tracking-[0.3em] text-destructive/40 uppercase mt-1">Irreversible Manifest Erasure</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 space-y-1">
                          <p className="text-[10px] font-black tracking-widest text-destructive uppercase">Risk Assessment</p>
                          <p className="text-[10px] text-destructive/80 italic leading-relaxed">Systematic deletion of all digital assets, including streams and neural patterns.</p>
                       </div>
                       <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 space-y-1">
                          <p className="text-[10px] font-black tracking-widest text-destructive uppercase">Temporal Impact</p>
                          <p className="text-[10px] text-destructive/80 italic leading-relaxed">This action cannot be rolled back. Future synchronization will be impossible.</p>
                       </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Button
                      variant="destructive"
                      className="h-16 px-10 rounded-xl bg-destructive text-white hover:bg-destructive/90 shadow-2xl shadow-destructive/40 font-black tracking-widest uppercase text-xs transition-all gap-3 hover:scale-[1.02] active:scale-[0.98]"
                      onClick={() => setDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-5 w-5" />
                      Erase Identity
                    </Button>
                  </div>
               </div>
            </GlassCard>
          </motion.div>
        )}
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={handleCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <span className="block">
                This action is permanent and cannot be undone. All of your data
                will be deleted, including:
              </span>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Your profile and account information</li>
                <li>All streams and their content</li>
                <li>All newsletters and drafts</li>
                <li>Subscription and billing information</li>
                <li>All settings and preferences</li>
              </ul>
              <span className="block font-medium text-foreground">
                To confirm, type{" "}
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-destructive">
                  {CONFIRMATION_TEXT}
                </span>{" "}
                below:
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Input
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder={CONFIRMATION_TEXT}
              className="font-mono"
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAccountMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={!isConfirmationValid || deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete My Account
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
           <Moon className="h-4 w-4 text-primary/60" />
        </div>
        <div>
          <p className="text-sm font-black tracking-widest text-primary/80 uppercase">Luminosity</p>
          <p className="text-[10px] text-primary/40 font-medium italic">Synchronize theme with digital environment</p>
        </div>
      </div>
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        className="data-[state=checked]:bg-primary/80"
      />
    </div>
  );
}

function AccountSettingsSkeleton() {
  return (
    <div className="space-y-12 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
         <GlassCard className="p-8 h-64 bg-white/5"><div className="w-full h-full" /></GlassCard>
         <GlassCard className="p-8 h-64 bg-white/5"><div className="w-full h-full" /></GlassCard>
      </div>
      <GlassCard className="p-8 h-40 bg-white/5"><div className="w-full h-full" /></GlassCard>
      <GlassCard className="p-8 h-40 bg-white/5"><div className="w-full h-full" /></GlassCard>
    </div>
  );
}
