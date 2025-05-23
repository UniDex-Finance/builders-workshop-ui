"use client";

import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { 
  XIcon, 
  SunIcon, 
  MoonIcon, 
  Bell, 
  Volume2, 
  Eye, 
  Zap, 
  Shield, 
  BarChart3,
  Check
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState(0);
  const isMobile = useIsMobile();

  // Mock settings state
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(false);
  const [privateMode, setPrivateMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  // Handle initial theme setup after mount
  useEffect(() => {
    setMounted(true);
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
        break;
      default:
        setSelected(0);
    }
  }, [theme]);

  const themeOptions = [
    { 
      label: "Light", 
      icon: SunIcon, 
      value: 'light',
      gradient: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
      badgeColor: '#1e293b',
      badgeBg: '#f1f5f9',
      border: '#e2e8f0'
    },
    { 
      label: "Dark", 
      icon: MoonIcon, 
      value: 'dark',
      gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      badgeColor: '#f1f5f9',
      badgeBg: '#1e293b',
      border: '#334155'
    },
    { 
      label: "Greenify", 
      icon: SunIcon, 
      value: 'greenify',
      gradient: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #10b981 100%)',
      badgeColor: '#ecfdf5',
      badgeBg: '#064e3b',
      border: '#059669'
    },
    { 
      label: "Hotline", 
      icon: MoonIcon, 
      value: 'hotline',
      gradient: 'linear-gradient(135deg, #701a75 0%, #be185d 50%, #ec4899 100%)',
      badgeColor: '#fdf2f8',
      badgeBg: '#701a75',
      border: '#be185d'
    },
    { 
      label: "OLED", 
      icon: MoonIcon, 
      value: 'oled',
      gradient: 'linear-gradient(135deg, #000000 0%, #111111 50%, #1a1a1a 100%)',
      badgeColor: '#ffffff',
      badgeBg: '#000000',
      border: '#333333'
    },
  ];

  const handleThemeChange = (index: number) => {
    const newTheme = themeOptions[index].value;
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
            height: 480,
            width: isMobile ? '90vw' : 380,
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
            "fixed z-[100] overflow-hidden rounded-2xl bg-card border border-border shadow-lg",
            isMobile ? "top-4 left-1/2 -translate-x-1/2" : "top-16 right-4"
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
            className="flex flex-col h-full"
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
            <div className="flex-1 overflow-y-auto scrollbar-custom">
              <div className="p-4 space-y-4">
                {/* Theme Section - Visual Grid */}
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-muted-foreground">
                    APPEARANCE
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {themeOptions.map((option, index) => (
                      <button
                        key={option.value}
                        onClick={() => handleThemeChange(index)}
                        className={cn(
                          "flex items-center gap-3 p-2.5 rounded-lg border-2 transition-all duration-200 hover:scale-[1.02]",
                          index === selected
                            ? "border-accent bg-accent/10"
                            : "border-border hover:border-accent/50"
                        )}
                      >
                        {/* Color Preview Square */}
                        <div 
                          className="w-8 h-8 rounded-md border flex items-center justify-center relative overflow-hidden"
                          style={{ 
                            background: option.gradient,
                            borderColor: option.border
                          }}
                        >
                          {index === selected && (
                            <Check 
                              className="w-4 h-4 text-white drop-shadow-sm" 
                              style={{ color: option.badgeColor }}
                            />
                          )}
                        </div>

                        {/* Theme Info */}
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium text-foreground">
                            {option.label}
                          </div>
                        </div>

                        {/* Theme Badge */}
                        <div 
                          className="px-2 py-1 rounded-md text-xs font-medium border"
                          style={{ 
                            backgroundColor: option.badgeBg,
                            color: option.badgeColor,
                            borderColor: option.border
                          }}
                        >
                          <option.icon className="w-3 h-3 inline mr-1" />
                          {option.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* User Experience Section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-muted-foreground">
                    USER EXPERIENCE
                  </h3>
                  
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="notifications" className="text-sm font-medium cursor-pointer">
                          Push Notifications
                        </Label>
                      </div>
                      <Switch 
                        id="notifications" 
                        checked={notifications}
                        onCheckedChange={setNotifications}
                        className="data-[state=checked]:bg-[var(--main-accent)]"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="sound" className="text-sm font-medium cursor-pointer">
                          Sound Effects
                        </Label>
                      </div>
                      <Switch 
                        id="sound" 
                        checked={soundEffects}
                        onCheckedChange={setSoundEffects}
                        className="data-[state=checked]:bg-[var(--main-accent)]"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="auto-refresh" className="text-sm font-medium cursor-pointer">
                          Auto Refresh Data
                        </Label>
                      </div>
                      <Switch 
                        id="auto-refresh" 
                        checked={autoRefresh}
                        onCheckedChange={setAutoRefresh}
                        className="data-[state=checked]:bg-[var(--main-accent)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Privacy & Security Section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-muted-foreground">
                    PRIVACY & SECURITY
                  </h3>
                  
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="private-mode" className="text-sm font-medium cursor-pointer">
                          Private Mode
                        </Label>
                      </div>
                      <Switch 
                        id="private-mode" 
                        checked={privateMode}
                        onCheckedChange={setPrivateMode}
                        className="data-[state=checked]:bg-[var(--main-accent)]"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="analytics" className="text-sm font-medium cursor-pointer">
                          Usage Analytics
                        </Label>
                      </div>
                      <Switch 
                        id="analytics" 
                        checked={analytics}
                        onCheckedChange={setAnalytics}
                        className="data-[state=checked]:bg-[var(--main-accent)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Advanced Section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-muted-foreground">
                    ADVANCED
                  </h3>
                  
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="advanced-mode" className="text-sm font-medium cursor-pointer">
                          Advanced Mode
                        </Label>
                      </div>
                      <Switch 
                        id="advanced-mode" 
                        checked={advancedMode}
                        onCheckedChange={setAdvancedMode}
                        className="data-[state=checked]:bg-[var(--main-accent)]"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="pt-2 mt-4 border-t border-border">
                  <div className="text-xs text-muted-foreground">
                    Settings are automatically saved.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 