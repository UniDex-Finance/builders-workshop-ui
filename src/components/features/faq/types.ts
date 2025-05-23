// FAQ-related TypeScript interfaces and types
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
  hasVisual?: boolean;
  isPopular?: boolean;
  visualAssets?: {
    type: 'image' | 'gif';
    src: string;
    alt: string;
    caption?: string;
  }[];
}

export interface Category {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: Tag[];
}

export interface Tag {
  id: string;
  label: string;
} 