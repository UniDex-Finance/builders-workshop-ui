"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { Header } from "../../shared/Header";
import { Sidebar } from "./Sidebar";
import { FAQContent } from "./FAQContent";
import { ContactSection } from "./ContactSection";
import { SearchInput } from "./components";
import { faqData, categories } from "./data";

export function FAQDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    "getting-started",
  ]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const filteredFAQs = faqData.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesCategory =
      activeCategory === "all" || item.category === activeCategory;
    const matchesTag =
      !activeTag ||
      item.tags.some((tag) =>
        tag.toLowerCase().includes(activeTag.toLowerCase())
      );

    return matchesSearch && matchesCategory && matchesTag;
  });

  const toggleItem = (itemId: string) => {
    setOpenItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleAndScrollToItem = (itemId: string) => {
    setOpenItems((prev) => {
      const isCurrentlyOpen = prev.includes(itemId);
      if (!isCurrentlyOpen) {
        return [...prev, itemId];
      }
      return prev;
    });

    setTimeout(() => {
      const element = document.getElementById(`faq-item-${itemId}`);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const selectCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    setActiveTag(null);
    if (categoryId !== "all" && !expandedCategories.includes(categoryId)) {
      setExpandedCategories((prev) => [...prev, categoryId]);
    }
  };

  const selectTag = (categoryId: string, tagId: string) => {
    setActiveCategory(categoryId);
    setActiveTag(tagId);
  };

  const getActiveTitle = () => {
    if (activeTag) {
      const category = categories.find((cat) => cat.id === activeCategory);
      const tag = category?.tags.find((t) => t.id === activeTag);
      return tag ? `${category?.label} → ${tag.label}` : "Help Center";
    }
    const category = categories.find((cat) => cat.id === activeCategory);
    return category?.label || "Help Center";
  };

  const popularFAQs = faqData.filter((item) => item.isPopular);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      
      {/* Mobile Header with Search and Menu Button */}
      <div className="md:hidden border-b border-border/50 bg-card/30">
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-lg hover:bg-card/50 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          <div className="flex-1">
            <SearchInput
              placeholder="Search help articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-1 bg-background text-foreground">
        {/* Desktop Sidebar - Only show on desktop */}
        <div className="hidden md:block">
          <Sidebar
            categories={categories}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeCategory={activeCategory}
            activeTag={activeTag}
            expandedCategories={expandedCategories}
            onSelectCategory={selectCategory}
            onSelectTag={selectTag}
            onToggleCategory={toggleCategory}
          />
        </div>

        {/* Mobile Bottom Sheet */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-sm border-t border-border/50 rounded-t-2xl max-h-[80vh] flex flex-col"
            >
              {/* Drag Handle */}
              <div className="flex justify-center py-3">
                <div className="w-12 h-1 bg-muted-foreground/40 rounded-full" />
              </div>
              
              {/* Sheet Content */}
              <div className="flex-1 overflow-y-auto px-4 pb-8">
                <h3 className="text-lg font-semibold mb-4">Browse Categories</h3>
                
                {/* Categories */}
                <div className="space-y-2">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    const isExpanded = expandedCategories.includes(category.id);
                    const isActive = activeCategory === category.id && !activeTag;

                    return (
                      <div key={category.id}>
                        <div className="flex items-center">
                          <button
                            onClick={() => {
                              selectCategory(category.id);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                              isActive
                                ? "bg-primary/20 text-primary border border-primary/30"
                                : "hover:bg-card/50 text-foreground"
                            }`}
                          >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            <span className="flex-1 text-left">{category.label}</span>
                          </button>

                          {category.tags.length > 0 && (
                            <button
                              onClick={() => toggleCategory(category.id)}
                              className="p-2 ml-2 rounded-md hover:bg-card/50 transition-colors"
                            >
                              <ChevronDown
                                className={`w-4 h-4 text-muted-foreground transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          )}
                        </div>

                        {/* Sub-tags */}
                        {category.tags.length > 0 && isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="ml-8 mt-2 space-y-1"
                          >
                            {category.tags.map((tag) => {
                              const isTagActive =
                                activeCategory === category.id &&
                                activeTag === tag.id;

                              return (
                                <button
                                  key={tag.id}
                                  onClick={() => {
                                    selectTag(category.id, tag.id);
                                    setIsMobileMenuOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2 rounded-md text-sm transition-all ${
                                    isTagActive
                                      ? "bg-primary/15 text-primary border border-primary/20"
                                      : "hover:bg-card/40 text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  {tag.label}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-8 py-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {getActiveTitle()}
                </h1>
                <p className="text-muted-foreground">
                  {activeTag
                    ? `Focused help for ${categories
                        .find((c) => c.id === activeCategory)
                        ?.tags.find((t) => t.id === activeTag)
                        ?.label?.toLowerCase()}`
                    : activeCategory === "all"
                    ? "Everything you need to know about trading on UniDex"
                    : `Learn about ${categories
                        .find((c) => c.id === activeCategory)
                        ?.label?.toLowerCase()}`}
                </p>
              </div>
            </motion.div>

            {/* FAQ Content */}
            <FAQContent
              filteredFAQs={filteredFAQs}
              openItems={openItems}
              onToggleItem={toggleItem}
              onToggleAndScrollToItem={toggleAndScrollToItem}
              activeCategory={activeCategory}
              searchTerm={searchTerm}
              activeTag={activeTag}
              popularFAQs={popularFAQs}
            />

            {/* Contact Section */}
            <ContactSection />
          </div>
        </div>
      </div>
    </div>
  );
}
