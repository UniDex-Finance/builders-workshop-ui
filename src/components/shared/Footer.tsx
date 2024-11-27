import React from "react";

export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between h-10 px-4 border-t bg-background border-border py-2">
      <div className="flex items-center space-x-2">
        <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded">
          Operational
        </span>
        <span className="hidden text-sm sm:inline text-muted-foreground">
          Arb1
        </span>
        <span className="hidden text-sm sm:inline text-muted-foreground">
          Upcoming Maintenance
        </span>
      </div>
      <div className="text-sm text-muted-foreground">Need Help?</div>
    </footer>
  );
}
