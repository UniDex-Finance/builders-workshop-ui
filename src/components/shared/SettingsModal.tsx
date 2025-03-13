"use client";

import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { XIcon, SunIcon, MoonIcon, LeafIcon, ZapIcon, CircleDotIcon } from "lucide-react";
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
    // console.log('Current theme:', theme);
    switch (theme) {
      case 'dark':
        setSelected(1);
        break;
      case 'greenify':
        setSelected(2);
        break;
      case 'hotline':
        setSelected(3);
        break;
      case 'oled':
        setSelected(4);
      default:
        setSelected(0);
    }
  }, [theme]);

  const themeOptions = [
    { label: "Light", icon: SunIcon, value: 'light' },
    { label: "Dark", icon: MoonIcon, value: 'dark' },
    { label: "Greenify", icon: LeafIcon, value: 'greenify' },
    { label: "Hotline", icon: ZapIcon, value: 'hotline' },
    { label: "OLED", icon: CircleDotIcon, value: 'oled' },
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
            height: "auto",
            width: 380,
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
            "fixed top-16 right-4 z-[100] overflow-hidden rounded-2xl bg-card border border-border shadow-lg",
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
            className="flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="text-base font-medium text-foreground">
                Settings
              </span>
              <button
                className="transition-colors duration-300 transform-gpu text-muted-foreground hover:text-foreground"
                onClick={onClose}
                type="button"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto scrollbar-custom">
              <div className="p-4 space-y-4">
                {/* Theme Section */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Theme
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {themeOptions.map((item, index) => (
                      <button
                        className={cn(
                          "inline-flex transform-gpu items-center justify-center gap-2 rounded-md px-3 py-2 text-sm transition-colors duration-300",
                          index === selected
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                        )}
                        key={item.label}
                        onClick={() => handleThemeChange(index)}
                        type="button"
                      >
                        <item.icon className="size-4" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Future sections can be added here */}
                {/* Example:
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Other Settings
                  </h3>
                  <div className="...">
                    // Content
                  </div>
                </div>
                */}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 