import { useTheme } from "@/hooks/use-theme";
import { useLocation } from "react-router-dom";
import { Moon, Sun } from "lucide-react";

const AUTH_PATHS = ["/login", "/verify-otp"];

export const DevThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    const { pathname } = useLocation();

    if (!AUTH_PATHS.includes(pathname)) return null;

    return (
        <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-2 bg-red-500 text-white rounded-full shadow-xl font-mono text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2"
            title="Dev Theme Toggle (Remove before deploy)"
        >
            {theme === 'dark' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
    );
};
