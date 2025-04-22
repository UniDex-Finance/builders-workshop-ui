import { useState, useEffect } from 'react';
import { HEATMAP_CATEGORIES, HeatmapCategory } from '../lib/heatmap-categories';

// Define the structure for a single time point in the chart data
export interface CategoryPerformancePoint {
  time: number; // Unix timestamp (or just an index for simulation)
  [key: string]: number; // Category name -> average performance %
}

// Simulate historical data generation
const generateSimulatedData = (): CategoryPerformancePoint[] => {
  const categories = HEATMAP_CATEGORIES.filter(cat => cat !== "Other");
  const data: CategoryPerformancePoint[] = [];
  const points = 50; // Number of data points to simulate over 24h
  const now = Date.now();
  const startTime = now - (24 * 60 * 60 * 1000); // Start time: 24 hours ago
  const interval = (24 * 60 * 60 * 1000) / (points - 1); // Time interval between points

  // --- Create the starting point (t=0, value=0%) ---
  const startPoint: CategoryPerformancePoint = { time: startTime };
  categories.forEach(cat => {
      startPoint[cat] = 0; // All categories start at 0% change
  });
  data.push(startPoint);

  // --- Generate subsequent points based on cumulative change ---
  for (let i = 1; i < points; i++) {
    const time = startTime + i * interval;
    const point: CategoryPerformancePoint = { time };
    const prevPoint = data[i - 1];

    categories.forEach(cat => {
      // Get the previous cumulative percentage
      const prevValue = prevPoint[cat];
      // Simulate a small random change for this interval
      const change = (Math.random() - 0.5) * 0.5; // Random fluctuation for the step
      // Add the change to the previous cumulative value
      point[cat] = parseFloat((prevValue + change).toFixed(2));
    });
    data.push(point);
  }

  return data;
};

// The dummy hook
export function useCategoryPerformanceHistory() {
  const [data, setData] = useState<CategoryPerformancePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate async fetch
    setLoading(true);
    const timer = setTimeout(() => {
      try {
        setData(generateSimulatedData());
        setError(null);
      } catch (err) {
        setError("Failed to generate simulated data.");
        setData([]);
      } finally {
        setLoading(false);
      }
    }, 500); // Simulate network delay

    return () => clearTimeout(timer);
  }, []);

  return { data, loading, error };
} 