// Reusable components for the FAQ page
import { Search } from "lucide-react";

interface SearchInputProps {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export const SearchInput = ({
  placeholder,
  value,
  onChange,
  className = "",
}: SearchInputProps) => {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 z-10" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full h-10 pl-10 pr-4 text-sm bg-muted/60 border border-muted-foreground/20 rounded-lg 
                   placeholder:text-muted-foreground text-foreground
                   focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:bg-muted/80
                   hover:border-muted-foreground/30 hover:bg-muted/70 transition-all duration-200
                   shadow-sm hover:shadow-md focus:shadow-md search-input-custom"
      />
    </div>
  );
}; 