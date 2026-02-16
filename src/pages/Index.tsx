const Index = () => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden cream-gradient">
      {/* Ambient background glow effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/3 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-glow-pulse" />
        <div className="absolute bottom-1/3 right-1/4 h-72 w-72 rounded-full bg-accent/10 blur-3xl animate-glow-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md mx-6">
        <div className="liquid-glass-overlay p-8 sm:p-12 text-center">
          <h1
            className="font-syne text-3xl sm:text-4xl font-bold leading-tight animate-shimmer-sweep"
            style={{
              background: "linear-gradient(90deg, hsl(var(--foreground)) 0%, hsl(var(--foreground)) 35%, hsl(var(--primary)) 45%, hsl(var(--accent)) 55%, hsl(var(--foreground)) 65%, hsl(var(--foreground)) 100%)",
              backgroundSize: "200% 100%",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            Milkly
          </h1>

          <p className="mt-6 text-base sm:text-lg text-muted-foreground font-syne leading-relaxed">
            Milk the internet for your best content.
          </p>
          
          <div className="mt-10">
            <p className="text-sm text-muted-foreground animate-pulse">
              Claude is putting the final touches...
            </p>
          </div>
        </div>
      </div>

      {/* Subtle grid pattern overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  );
};

export default Index;
