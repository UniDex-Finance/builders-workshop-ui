// Sidebar navigation component - Desktop only
import { ChevronDown } from "lucide-react";
import { SearchInput } from "./components";
import { Category } from "./types";
import {
  Collapsible,
  CollapsibleContent,
} from "../../ui/collapsible";

interface SidebarProps {
  categories: Category[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeCategory: string;
  activeTag: string | null;
  expandedCategories: string[];
  onSelectCategory: (categoryId: string) => void;
  onSelectTag: (categoryId: string, tagId: string) => void;
  onToggleCategory: (categoryId: string) => void;
}

export function Sidebar({
  categories,
  searchTerm,
  setSearchTerm,
  activeCategory,
  activeTag,
  expandedCategories,
  onSelectCategory,
  onSelectTag,
  onToggleCategory,
}: SidebarProps) {
  return (
    <div className="w-80 bg-card/30 border-r border-border/50 flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-6 border-b border-border/50">
        <SearchInput
          placeholder="Search help articles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Navigation Categories - Now takes up all remaining space */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {categories.map((category) => {
          const Icon = category.icon;
          const isExpanded = expandedCategories.includes(category.id);
          const isActive = activeCategory === category.id && !activeTag;

          return (
            <div key={category.id}>
              <div className="flex items-center">
                <button
                  onClick={() => onSelectCategory(category.id)}
                  className={`flex-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary/20 text-primary border border-primary/30"
                      : "hover:bg-card/50 text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{category.label}</span>
                </button>

                {category.tags.length > 0 && (
                  <button
                    onClick={() => onToggleCategory(category.id)}
                    className="p-1 ml-1 rounded-md hover:bg-card/50 transition-colors"
                  >
                    <ChevronDown
                      className={`w-3 h-3 text-muted-foreground transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                )}
              </div>

              {/* Sub-tags */}
              {category.tags.length > 0 && (
                <Collapsible open={isExpanded}>
                  <CollapsibleContent>
                    <div className="ml-7 mt-1 space-y-1">
                      {category.tags.map((tag) => {
                        const isTagActive =
                          activeCategory === category.id &&
                          activeTag === tag.id;

                        return (
                          <button
                            key={tag.id}
                            onClick={() => onSelectTag(category.id, tag.id)}
                            className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-all ${
                              isTagActive
                                ? "bg-primary/15 text-primary border border-primary/20"
                                : "hover:bg-card/40 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {tag.label}
                          </button>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 