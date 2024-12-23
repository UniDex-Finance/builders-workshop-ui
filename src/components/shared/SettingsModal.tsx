"use client";

import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon, SunIcon, MoonIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState(0);

  // Handle initial theme setup after mount
  useEffect(() => {
    setMounted(true);
    console.log('Current theme:', theme);
    switch (theme) {
      case 'dark':
        setSelected(1);
        break;
      case 'greenify':
        setSelected(2);
        break;
      default:
        setSelected(0);
    }
  }, [theme]);

  const themeOptions = [
    { label: "Light", icon: SunIcon, value: 'light' },
    { label: "Dark", icon: MoonIcon, value: 'dark' },
    { label: "Greenify", icon: SunIcon, value: 'greenify' },
  ];

  const handleThemeChange = (index: number) => {
    const newTheme = themeOptions[index].value;
    console.log('Switching to theme:', newTheme);
    setSelected(index);
    setTheme(newTheme);
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          animate={{
            height: 180,
            width: 280,
            opacity: 1,
          }}
          initial={{
            height: 52,
            width: 52,
            opacity: 0,
          }}
          exit={{
            height: 52,
            width: 52,
            opacity: 0,
          }}
          className={cn(
            "fixed top-16 right-4 z-50 overflow-hidden rounded-2xl bg-card border border-border shadow-lg",
          )}
          transition={{
            type: "spring",
            duration: 0.6,
            bounce: 0.2,
          }}
        >
          <motion.div
            animate={{ opacity: 1 }}
            initial={{ opacity: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-4 p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Theme Settings ({theme})
              </span>
              <button
                className="transition-colors duration-300 transform-gpu text-muted-foreground hover:text-foreground"
                onClick={onClose}
                type="button"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {themeOptions.map((item, index) => (
                <button
                  className={cn(
                    "inline-flex w-full transform-gpu items-center justify-center gap-2 rounded-md px-3 py-2 transition-colors duration-300",
                    index === selected
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )}
                  key={item.label}
                  onClick={() => handleThemeChange(index)}
                  type="button"
                >
                  <item.icon className="size-5" />
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 