import { useAuth, authClient } from "@/lib/AuthClient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { LogOut, CreditCard, Settings, Link2, ImageIcon, Layout } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/useToast";
import { useQuery } from "@tanstack/react-query";
import { useSubscription, useStorageStatus } from "@/hooks";
import { api } from "@/lib/Api";
import { queryKeys } from "@/lib/QueryKeys";
import type { Stream } from "../../../milkly-backend/src/types";

import { motion } from "framer-motion";

export function UserMenu() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canUseLinkedStreams } = useSubscription();
  const { data: storageStatus } = useStorageStatus();
  const isStorageConfigured = storageStatus?.configured ?? false;

  // Check if user has enough streams for linked streams
  const { data: streamsResponse } = useQuery({
    queryKey: queryKeys.streams.list({ page: 1, limit: 2 }),
    queryFn: () => api.paginated<Stream>("/streams?page=1&limit=2"),
    enabled: canUseLinkedStreams,
  });

  const hasEnoughStreamsForLinking = (streamsResponse?.pagination?.total ?? 0) >= 2;
  const showLinkedStreams = canUseLinkedStreams && hasEnoughStreamsForLinking;

  async function handleSignOut() {
    try {
      await authClient.signOut();
      navigate("/login", { replace: true });
    } catch {
      toast({
        title: "Sign out failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  }

  if (!user) return null;

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.charAt(0).toUpperCase() ?? "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="relative group outline-none">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="relative w-11 h-11 flex items-center justify-center"
          >
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 rounded-full" />
            
            {/* Primary Squircle Frame */}
            <div className="absolute inset-0 rounded-[14px] bg-white/10 backdrop-blur-3xl border border-white/20 shadow-xl group-hover:border-primary/40 group-hover:bg-white/15 transition-all duration-500 overflow-hidden">
               {/* Animated Shimmer Effect */}
               <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
            
            {/* Inset Layer for Depth */}
            <div className="absolute inset-1.5 rounded-[10px] bg-black/5 border border-white/5 shadow-inner" />
            
            {/* Content Layer */}
            <div className="relative z-10 w-full h-full flex items-center justify-center p-2">
              {user.image ? (
                <div className="w-full h-full rounded-lg border border-white/10 overflow-hidden shadow-md">
                  <img src={user.image} alt={user.name || ""} className="w-full h-full object-cover" />
                </div>
              ) : (
                <span className="text-primary text-lg font-black font-['Bebas_Neue'] tracking-tighter leading-none pt-0.5">
                  {initials}
                </span>
              )}
            </div>

            {/* Status Indicator - Hidden as requested */}
            {/* <div className="absolute -top-1 -right-1 z-20 flex items-center justify-center">
              <div className="relative h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"></span>
                 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-background shadow-[0_0_10px_rgba(16,185,129,0.6)]"></span>
              </div>
            </div> */}
          </motion.div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 bg-white/20 backdrop-blur-2xl border-primary/10 rounded-2xl p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <DropdownMenuLabel className="px-4 py-4 mb-2 bg-primary/5 rounded-xl border border-primary/5">
          <div className="flex flex-col space-y-1">
            <p className="text-xs font-black tracking-widest text-primary/40 uppercase">Designation</p>
            <p className="text-sm font-serif italic text-foreground leading-none">{user.name ?? "User"}</p>
            <p className="text-[10px] text-primary/30 font-medium italic mt-1">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        
        <div className="space-y-1 px-1">
          {showLinkedStreams ? (
            <DropdownMenuItem asChild className="group focus:bg-primary/10 rounded-xl transition-all duration-300">
              <Link to="/linked-streams" className="flex items-center gap-3 px-3 py-3 cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10 group-focus:scale-110 group-focus:bg-primary/10 transition-all">
                   <Link2 className="h-4 w-4 text-primary/70" />
                </div>
                <span className="text-xs font-bold tracking-tight text-primary/80">Linked Streams</span>
              </Link>
            </DropdownMenuItem>
          ) : null}
          
          {isStorageConfigured ? (
            <DropdownMenuItem asChild className="group focus:bg-primary/10 rounded-xl transition-all duration-300">
              <Link to="/media" className="flex items-center gap-3 px-3 py-3 cursor-pointer">
                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10 group-focus:scale-110 group-focus:bg-primary/10 transition-all">
                   <ImageIcon className="h-4 w-4 text-primary/70" />
                </div>
                <span className="text-xs font-bold tracking-tight text-primary/80">Media Library</span>
              </Link>
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuItem asChild className="group focus:bg-primary/10 rounded-xl transition-all duration-300">
            <Link to="/templates" className="flex items-center gap-3 px-3 py-3 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10 group-focus:scale-110 group-focus:bg-primary/10 transition-all">
                 <Layout className="h-4 w-4 text-primary/70" />
              </div>
              <span className="text-xs font-bold tracking-tight text-primary/80">Templates</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="group focus:bg-primary/10 rounded-xl transition-all duration-300">
            <Link to="/subscription" className="flex items-center gap-3 px-3 py-3 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10 group-focus:scale-110 group-focus:bg-primary/10 transition-all">
                 <CreditCard className="h-4 w-4 text-primary/70" />
              </div>
              <span className="text-xs font-bold tracking-tight text-primary/80">Subscription</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="group focus:bg-primary/10 rounded-xl transition-all duration-300">
            <Link to="/settings" className="flex items-center gap-3 px-3 py-3 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/10 group-focus:scale-110 group-focus:bg-primary/10 transition-all">
                 <Settings className="h-4 w-4 text-primary/70" />
              </div>
              <span className="text-xs font-bold tracking-tight text-primary/80">Settings</span>
            </Link>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="bg-primary/5 my-2" />
        
        <div className="px-1">
          <DropdownMenuItem 
            onClick={handleSignOut} 
            className="group flex items-center gap-3 px-3 py-3 focus:bg-destructive/10 text-destructive rounded-xl transition-all duration-300 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-destructive/5 flex items-center justify-center border border-destructive/10 group-focus:scale-110 transition-all">
               <LogOut className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold tracking-tight">Sign out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
