"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Header } from "../../shared/Header";
import { Sidebar } from "./Sidebar";
import { FAQContent } from "./FAQContent";
import { ContactSection } from "./ContactSection";
import { faqData, categories } from "./data";

export function FAQDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([
    "getting-started",
  ]);

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

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <div className="flex flex-1 bg-background text-foreground">
        {/* Sidebar */}
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
