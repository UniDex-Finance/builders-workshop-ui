'use client'

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "../../shared/Header";
import { Card } from "../../ui/card";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  Bug, 
  Shield, 
  AlertTriangle,
  TrendingUp,
  Zap,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  GitCommit,
  GitBranch,
  Rocket
} from "lucide-react";
import { changelogData, type ChangelogEntry } from "./changelog";
import { Input } from "../../ui/input";

// Add custom CSS for animations
const styles = ``;

// Badge styling based on type
const getBadgeVariant = (badge?: string) => {
  switch (badge) {
    case 'new': return 'default';
    case 'improved': return 'secondary';
    case 'fixed': return 'outline';
    case 'breaking': return 'destructive';
    case 'deprecated': return 'outline';
    case 'security': return 'destructive';
    default: return 'outline';
  }
};

// Version type colors
const getVersionTypeColor = (type: string) => {
  switch (type) {
    case 'major': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    case 'minor': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    case 'patch': return 'text-green-400 bg-green-400/10 border-green-400/20';
    case 'hotfix': return 'text-red-400 bg-red-400/10 border-red-400/20';
    default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
  }
};

// Icon for badges
const getBadgeIcon = (badge?: string) => {
  switch (badge) {
    case 'new': return <Sparkles className="w-3 h-3" />;
    case 'improved': return <TrendingUp className="w-3 h-3" />;
    case 'fixed': return <Bug className="w-3 h-3" />;
    case 'breaking': return <AlertTriangle className="w-3 h-3" />;
    case 'security': return <Shield className="w-3 h-3" />;
    default: return null;
  }
};

export function ChangelogDashboard() {
  const [expandedVersions, setExpandedVersions] = useState<string[]>(() => {
    // Ensure latest version is expanded by default
    return changelogData.length > 0 ? [changelogData[0].id] : [];
  });
  const [selectedType, setSelectedType] = useState<string>('all');

  // Filter changelog based on type only (removed search)
  const filteredChangelog = useMemo(() => {
    return changelogData.filter(entry => {
      const matchesType = selectedType === 'all' || entry.type === selectedType;
      return matchesType;
    });
  }, [selectedType]);

  const toggleVersion = (versionId: string) => {
    setExpandedVersions(prev => 
      prev.includes(versionId) 
        ? prev.filter(id => id !== versionId)
        : [...prev, versionId]
    );
  };

  const latestVersion = changelogData[0];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <style jsx>{styles}</style>
      <Header />
      <div className="min-h-screen bg-background text-foreground">
        {/* Hero Section with Latest Version */}
        <div className="bg-gradient-to-b from-primary/4 via-primary/2 to-primary/1 relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/2 to-transparent"></div>
          
          <div className="max-w-6xl mx-auto px-6 pt-12 pb-8 relative">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-500 rounded-lg blur-md opacity-75"></div>
                  <div className="relative p-3 rounded-lg bg-primary/15 border border-primary/30 shadow-lg shadow-primary/10 backdrop-blur-sm">
                    <Rocket className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">Changelog</h1>
                  <p className="text-gray-400">Track all updates and improvements to UniDex</p>
                </div>
              </div>

              {/* Latest Version Highlight - Enhanced Design */}
              {latestVersion && (
                <div className="relative group">
                  {/* Much Smaller Border Glow */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/15 via-blue-500/15 to-purple-500/15 rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                  
                  <Card className="relative p-8 bg-gradient-to-br from-[#1e1e20] via-[#1a1a1c] to-[#16161a] border border-primary/20 shadow-xl shadow-primary/5 backdrop-blur-sm animate-subtle-glow">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <span className={`px-4 py-2 rounded-full text-sm font-medium border shadow-lg ${getVersionTypeColor(latestVersion.type)}`}>
                              {latestVersion.type.toUpperCase()}
                            </span>
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/15 to-blue-500/15 blur"></div>
                          </div>
                          <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                            v{latestVersion.version}
                          </h2>
                          <div className="relative">
                            <Badge variant="secondary" className="gap-1 bg-gradient-to-r from-primary/20 to-blue-500/20 text-primary border-primary/30 shadow-lg">
                              <Sparkles className="w-3 h-3" />
                              Latest
                            </Badge>
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-full blur -z-10"></div>
                          </div>
                        </div>
                        <p className="text-gray-300 flex items-center gap-2 text-lg">
                          <Calendar className="w-5 h-5 text-primary" />
                          {new Date(latestVersion.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        {latestVersion.title && (
                          <p className="text-gray-100 font-medium text-lg">{latestVersion.title}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-3">
                        <Button 
                          variant="outline"
                          onClick={() => toggleVersion(latestVersion.id)}
                          className="gap-2 bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/40 text-primary hover:from-primary/20 hover:to-blue-500/20 hover:border-primary/60 shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <GitCommit className="w-4 h-4" />
                          {expandedVersions.includes(latestVersion.id) ? 'Hide Changes' : 'View Changes'}
                        </Button>
                        <p className="text-xs text-gray-500 text-center">Featured Release</p>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedVersions.includes(latestVersion.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-[#2a2a32] bg-[#1a1a1c] mt-6 -mx-8 -mb-8 rounded-b-lg"
                        >
                          <div className="p-6 space-y-6">
                            {latestVersion.categories.map((category, catIndex) => (
                              <div key={catIndex}>
                                <div className="flex items-center gap-2 mb-3">
                                  {category.icon && <span className="text-xl">{category.icon}</span>}
                                  <h4 className="font-semibold text-gray-200">{category.name}</h4>
                                </div>
                                <ul className="space-y-2">
                                  {category.changes.map((change, changeIndex) => (
                                    <motion.li
                                      key={changeIndex}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: changeIndex * 0.05 }}
                                      className="flex items-start gap-3"
                                    >
                                      <span className="text-gray-500 mt-0.5">•</span>
                                      <div className="flex-1 flex items-start gap-2">
                                        <span className="text-gray-300 text-sm">{change.text}</span>
                                        {change.badge && (
                                          <Badge 
                                            variant={getBadgeVariant(change.badge)} 
                                            className="gap-1 text-xs"
                                          >
                                            {getBadgeIcon(change.badge)}
                                            {change.badge}
                                          </Badge>
                                        )}
                                      </div>
                                    </motion.li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </div>
              )}
            </motion.div>
          </div>
        </div>

        {/* Transition Section */}
        <div className="bg-gradient-to-b from-primary/1 to-background h-8"></div>

        {/* Content Section */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Version History */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent flex-1"></div>
              <h3 className="text-lg font-semibold text-gray-300 flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-primary" />
                Release History
              </h3>
              <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent flex-1"></div>
            </div>

            {/* Filter Options - Always Visible */}
            <Card className="p-4 bg-[#1e1e20]/80 backdrop-blur-sm border border-[#1b1b22] hover:border-primary/30 transition-all duration-300 shadow-lg mb-8">
              <p className="text-sm text-gray-400 mb-3">Filter by release type:</p>
              <div className="flex flex-wrap gap-2">
                {['all', 'major', 'minor', 'patch', 'hotfix', 'backend'].map(type => (
                  <Button
                    key={type}
                    variant={selectedType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType(type)}
                    className="capitalize hover:shadow-lg transition-all duration-300"
                  >
                    {type === 'all' ? 'All Releases' : type}
                  </Button>
                ))}
              </div>
            </Card>
            
            {filteredChangelog.slice(1).map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="overflow-hidden bg-[#1e1e20] border border-[#1b1b22] hover:border-[#2a2a32] transition-colors">
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => toggleVersion(entry.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg border ${getVersionTypeColor(entry.type)}`}>
                          <GitBranch className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-semibold">v{entry.version}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getVersionTypeColor(entry.type)}`}>
                              {entry.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                            <Clock className="w-3 h-3" />
                            {new Date(entry.date).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                        expandedVersions.includes(entry.id) ? 'rotate-180' : ''
                      }`} />
                    </div>
                    {entry.title && (
                      <p className="mt-3 text-gray-300 font-medium">{entry.title}</p>
                    )}
                    {entry.description && (
                      <p className="mt-1 text-sm text-gray-400">{entry.description}</p>
                    )}
                  </div>

                  <AnimatePresence>
                    {expandedVersions.includes(entry.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-[#2a2a32] bg-[#1a1a1c]"
                      >
                        <div className="p-6 space-y-6">
                          {entry.categories.map((category, catIndex) => (
                            <div key={catIndex}>
                              <div className="flex items-center gap-2 mb-3">
                                {category.icon && <span className="text-xl">{category.icon}</span>}
                                <h4 className="font-semibold text-gray-200">{category.name}</h4>
                              </div>
                              <ul className="space-y-2">
                                {category.changes.map((change, changeIndex) => (
                                  <motion.li
                                    key={changeIndex}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: changeIndex * 0.05 }}
                                    className="flex items-start gap-3"
                                  >
                                    <span className="text-gray-500 mt-0.5">•</span>
                                    <div className="flex-1 flex items-start gap-2">
                                      <span className="text-gray-300 text-sm">{change.text}</span>
                                      {change.badge && (
                                        <Badge 
                                          variant={getBadgeVariant(change.badge)} 
                                          className="gap-1 text-xs"
                                        >
                                          {getBadgeIcon(change.badge)}
                                          {change.badge}
                                        </Badge>
                                      )}
                                    </div>
                                  </motion.li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredChangelog.length === 0 && (
            <Card className="p-12 text-center bg-[#1e1e20] border border-[#1b1b22]">
              <p className="text-gray-400">No updates found matching your search.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 