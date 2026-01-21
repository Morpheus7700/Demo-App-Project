import { Moon, Sun } from "lucide-react"
import { useTheme } from "./ThemeProvider"
import { cn } from "../lib/utils"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "p-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
        className
      )}
      aria-label="Toggle theme"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-orange-500" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 dark:text-blue-400" style={{ top: 'inherit', left: 'inherit' }} />
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
