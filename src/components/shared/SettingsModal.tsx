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
import { createPortal } from "react-dom";
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

  // Simple body scroll prevention
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

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

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                onClose();
              }
            }}
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={{
              type: "spring",
              damping: 30,
              stiffness: 300,
            }}
            className={cn(
              "fixed z-[9999] bg-card border border-border shadow-2xl flex flex-col",
              isMobile 
                ? "bottom-0 left-0 right-0 rounded-t-2xl h-[85vh]" 
                : "top-0 right-0 h-screen w-[420px] max-w-[90vw]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Settings
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Customize your experience
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>

            {/* Scrollable Content */}
            <div 
              className={cn(
                "flex-1 overflow-y-scroll",
                isMobile ? "" : "scrollbar-custom"
              )}
              style={{
                WebkitOverflowScrolling: 'touch'
              }}
            >
              <div className="p-6 space-y-6">
                {/* Theme Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-1">
                      Appearance
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Choose your preferred theme
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {themeOptions.map((option, index) => (
                      <button
                        key={option.value}
                        onClick={() => handleThemeChange(index)}
                        className={cn(
                          "flex items-center gap-4 p-3 rounded-xl border-2 transition-all duration-200",
                          index === selected
                            ? "border-accent bg-accent/10 ring-2 ring-accent/20"
                            : "border-border hover:border-accent/50 hover:bg-accent/5"
                        )}
                      >
                        {/* Color Preview */}
                        <div 
                          className="w-10 h-10 rounded-lg border flex items-center justify-center relative overflow-hidden"
                          style={{ 
                            background: option.gradient,
                            borderColor: option.border
                          }}
                        >
                          {index === selected && (
                            <Check 
                              className="w-5 h-5 text-white drop-shadow-sm" 
                              style={{ color: option.badgeColor }}
                            />
                          )}
                        </div>

                        {/* Theme Info */}
                        <div className="flex-1 text-left">
                          <div className="text-sm font-medium text-foreground">
                            {option.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {option.label === 'Light' && 'Clean and minimal'}
                            {option.label === 'Dark' && 'Easy on the eyes'}
                            {option.label === 'Greenify' && 'Fresh and natural'}
                            {option.label === 'Hotline' && 'Bold and vibrant'}
                            {option.label === 'OLED' && 'Pure black theme'}
                          </div>
                        </div>

                        {/* Icon */}
                        <option.icon className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* User Experience Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-1">
                      User Experience
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Customize your interaction preferences
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/10">
                          <Bell className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <Label htmlFor="notifications" className="text-sm font-medium cursor-pointer">
                            Push Notifications
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Get notified about important updates
                          </p>
                        </div>
                      </div>
                      <Switch 
                        id="notifications" 
                        checked={notifications}
                        onCheckedChange={setNotifications}
                        className="data-[state=checked]:bg-accent"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/10">
                          <Volume2 className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <Label htmlFor="sound" className="text-sm font-medium cursor-pointer">
                            Sound Effects
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Play sounds for interactions
                          </p>
                        </div>
                      </div>
                      <Switch 
                        id="sound" 
                        checked={soundEffects}
                        onCheckedChange={setSoundEffects}
                        className="data-[state=checked]:bg-accent"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/10">
                          <Zap className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <Label htmlFor="auto-refresh" className="text-sm font-medium cursor-pointer">
                            Auto Refresh Data
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Automatically update market data
                          </p>
                        </div>
                      </div>
                      <Switch 
                        id="auto-refresh" 
                        checked={autoRefresh}
                        onCheckedChange={setAutoRefresh}
                        className="data-[state=checked]:bg-accent"
                      />
                    </div>
                  </div>
                </div>

                {/* Privacy & Security Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-1">
                      Privacy & Security
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Control your data and privacy
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/10">
                          <Eye className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <Label htmlFor="private-mode" className="text-sm font-medium cursor-pointer">
                            Private Mode
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Hide sensitive information
                          </p>
                        </div>
                      </div>
                      <Switch 
                        id="private-mode" 
                        checked={privateMode}
                        onCheckedChange={setPrivateMode}
                        className="data-[state=checked]:bg-accent"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/10">
                          <BarChart3 className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <Label htmlFor="analytics" className="text-sm font-medium cursor-pointer">
                            Usage Analytics
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Help improve the platform
                          </p>
                        </div>
                      </div>
                      <Switch 
                        id="analytics" 
                        checked={analytics}
                        onCheckedChange={setAnalytics}
                        className="data-[state=checked]:bg-accent"
                      />
                    </div>
                  </div>
                </div>

                {/* Advanced Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-foreground mb-1">
                      Advanced
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Power user features
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-accent/10">
                          <Shield className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <Label htmlFor="advanced-mode" className="text-sm font-medium cursor-pointer">
                            Advanced Mode
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Enable additional features
                          </p>
                        </div>
                      </div>
                      <Switch 
                        id="advanced-mode" 
                        checked={advancedMode}
                        onCheckedChange={setAdvancedMode}
                        className="data-[state=checked]:bg-accent"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-border pt-4 pb-2">
                  <div className="text-xs text-muted-foreground text-center">
                    Settings are automatically saved
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to render outside the header hierarchy
  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
} 