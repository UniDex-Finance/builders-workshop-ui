'use client'

import { Header } from "../../shared/Header";

export function ChangelogDashboard() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Changelog</h1>
          <p className="text-gray-400">
            Here you can find a list of recent changes and updates.
          </p>
          {/* Changelog content will go here */}
        </div>
      </div>
    </div>
  );
} 