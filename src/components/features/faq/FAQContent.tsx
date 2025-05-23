// Main FAQ content display component
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../ui/collapsible";
import { Badge } from "../../ui/badge";
import { FAQItem } from "./types";

interface FAQContentProps {
  filteredFAQs: FAQItem[];
  openItems: string[];
  onToggleItem: (itemId: string) => void;
  onToggleAndScrollToItem: (itemId: string) => void;
  activeCategory: string;
  searchTerm: string;
  activeTag: string | null;
  popularFAQs: FAQItem[];
}

// Helper function to parse the answer string and replace link placeholders
const renderAnswerWithLinks = (answer: string) => {
  const parts = answer.split(/(\[link:.*?].*?\[\/link])/g);
  return parts.map((part, index) => {
    const match = part.match(/\[link:(.*?)](.*?)\[\/link]/);
    if (match) {
      const href = match[1];
      const text = match[2];
      return (
        <a
          key={index}
          href={href}
          className="text-blue-400 hover:text-blue-300 underline"
          target="_blank" // Optional: open in new tab
          rel="noopener noreferrer" // Optional: security for new tab
        >
          {text}
        </a>
      );
    }
    return part;
  });
};

export function FAQContent({
  filteredFAQs,
  openItems,
  onToggleItem,
  onToggleAndScrollToItem,
  activeCategory,
  searchTerm,
  activeTag,
  popularFAQs,
}: FAQContentProps) {
  return (
    <>
      {/* Popular Questions Banner */}
      {activeCategory === "all" && !searchTerm && !activeTag && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Popular Questions
              </CardTitle>
              <CardDescription>
                The most frequently asked questions to get you started quickly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {popularFAQs.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onToggleAndScrollToItem(item.id)}
                    className="text-left p-3 rounded-lg bg-card/50 hover:bg-card/80 transition-all border border-border/30 hover:border-border/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {item.question}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* FAQ Items */}
      <div className="space-y-6">
        <AnimatePresence mode="wait">
          {filteredFAQs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="p-12 text-center bg-muted/20 border-border/60">
                <div className="space-y-4">
                  <div className="text-6xl opacity-20">🔍</div>
                  <h3 className="text-xl font-semibold">No results found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search terms or browse our categories on
                    the left.
                  </p>
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-4"
            >
              {filteredFAQs.map((item, index) => (
                <motion.div
                  key={item.id}
                  id={`faq-item-${item.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-muted/25 border-border/60 hover:bg-muted/35 hover:border-border/75 transition-all duration-200 shadow-sm hover:shadow-md">
                    <Collapsible
                      open={openItems.includes(item.id)}
                      onOpenChange={() => onToggleItem(item.id)}
                    >
                      <CollapsibleTrigger className="w-full">
                        <CardHeader className="text-left hover:bg-muted/15 transition-colors rounded-t-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-start gap-4">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <CardTitle className="text-lg">
                                    {item.question}
                                  </CardTitle>
                                  {item.isPopular && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs bg-blue-500/20 text-blue-400"
                                    >
                                      Popular
                                    </Badge>
                                  )}
                                  {item.hasVisual && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      📸 Visual Guide
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {item.tags.map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <ChevronDown
                              className={`w-5 h-5 text-muted-foreground transition-transform ${
                                openItems.includes(item.id) ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <CardContent className="pt-0 bg-muted/15 rounded-b-lg">
                          {item.hasVisual && item.visualAssets && (
                            <div className="mb-6 space-y-4">
                              {item.visualAssets.map((asset, index) => (
                                <div key={index} className="p-6 bg-background/60 rounded-lg border border-border/50">
                                  <div className="space-y-3">
                                    <img
                                      src={asset.src}
                                      alt={asset.alt}
                                      className="w-full rounded-lg border border-border/30 shadow-sm"
                                      loading="lazy"
                                    />
                                    {asset.caption && (
                                      <p className="text-sm text-muted-foreground text-center italic">
                                        {asset.caption}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="prose prose-invert max-w-none">
                            <div className="whitespace-pre-line text-foreground leading-relaxed">
                              {renderAnswerWithLinks(item.answer)}
                            </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-border/50">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-muted-foreground">
                                Was this helpful?
                              </p>
                              <div className="flex gap-2">
                                <button className="text-xs px-3 py-1 rounded-md bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">
                                  👍 Yes
                                </button>
                                <button className="text-xs px-3 py-1 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                                  👎 No
                                </button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
} 