import { useState, useEffect } from 'react';

// Define asset classes and their pairs
const EQUITY_PAIRS = ['SPY/USD', 'QQQ/USD'];
const FX_PAIRS = ['NZD/USD', 'CHF/USD', 'AUD/USD', 'USD/JPY', 'USD/CAD', 'EUR/USD', 'GBP/USD'];
const METAL_PAIRS = ['XAU/USD', 'XAG/USD'];
const COMMODITY_PAIRS = ['WTI/USD']; // Specifically WTI/USD

// Define market hours constants
// Equities (ET)
const EQUITY_OPEN_HOUR_ET = 9;
const EQUITY_OPEN_MINUTE_ET = 30;
const EQUITY_CLOSE_HOUR_ET = 16;
const EQUITY_CLOSE_MINUTE_ET = 0;
const EQUITY_TIMEZONE = 'America/New_York';

// FX (ET) - Sunday 5 PM to Friday 5 PM
const FX_OPEN_DAY_ET = 0; // Sunday
const FX_OPEN_HOUR_ET = 17;
const FX_CLOSE_DAY_ET = 5; // Friday
const FX_CLOSE_HOUR_ET = 17;
const FX_TIMEZONE = 'America/New_York';

// Metals (ET) - Sunday 6 PM to Friday 5 PM
const METAL_OPEN_DAY_ET = 0; // Sunday
const METAL_OPEN_HOUR_ET = 18;
const METAL_CLOSE_DAY_ET = 5; // Friday
const METAL_CLOSE_HOUR_ET = 17;
const METAL_TIMEZONE = 'America/New_York';
// Metal Daily Break (Mon-Thu 5 PM - 6 PM ET)
const METAL_BREAK_START_HOUR_ET = 17;
const METAL_BREAK_END_HOUR_ET = 18;

// Commodities (WTI/USD - UTC/GMT)
// Open: Sunday 23:00 UTC
// Close: Friday 21:45 UTC
// Break: Mon-Fri 22:00-23:00 UTC
const WTI_OPEN_DAY_UTC = 0; // Sunday
const WTI_OPEN_HOUR_UTC = 23;
const WTI_CLOSE_DAY_UTC = 5; // Friday
const WTI_CLOSE_HOUR_UTC = 21;
const WTI_CLOSE_MINUTE_UTC = 45;
const WTI_BREAK_START_HOUR_UTC = 22;
const WTI_BREAK_END_HOUR_UTC = 23;


interface MarketHoursInfo {
  status: 'open' | 'closed' | 'break' | null; // Added 'break' status
  timeRemaining: string | null;
  nextEventTime: Date | null;
  nextEventLabel: 'Opens' | 'Closes' | 'Break Ends' | null; // Label for the next event
}

// Helper function to get current time parts in a specific timezone
function getCurrentTimeParts(timeZone: string): { year: number, month: number, day: number, hours: number, minutes: number, seconds: number, dayOfWeek: number } {
    const now = new Date();
    // Get year, month, day, hour, minute, second parts in the target timezone
    const formatter = new Intl.DateTimeFormat('en-CA', { // Use locale providing YYYY-MM-DD HH:mm:ss parts
        timeZone: timeZone,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    });
    const parts = formatter.formatToParts(now);
    const getPart = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value || '0';

    const year = parseInt(getPart('year'));
    const month = parseInt(getPart('month')) - 1; // Month is 0-indexed in Date object
    const dayOfMonth = parseInt(getPart('day'));
    const hours = parseInt(getPart('hour'));
    const minutes = parseInt(getPart('minute'));
    const seconds = parseInt(getPart('second'));

    // Construct a Date object representing the exact time in the target timezone
    // using UTC constructor to avoid local offset interference.
    const dateInTargetTimezone = new Date(Date.UTC(year, month, dayOfMonth, hours, minutes, seconds));

    // Get the day of the week (0=Sunday, 6=Saturday) *for that specific moment in the target timezone*
    // by inspecting the UTC day of the constructed date.
    const dayOfWeek = dateInTargetTimezone.getUTCDay();

    return { year, month, day: dayOfMonth, hours, minutes, seconds, dayOfWeek };
}

// Helper to format remaining time
function formatTimeRemaining(diffMillis: number): string {
     if (diffMillis <= 0) return '00:00:00';
     const totalSeconds = Math.floor(diffMillis / 1000);
     const hours = Math.floor(totalSeconds / 3600);
     const minutes = Math.floor((totalSeconds % 3600) / 60);
     const seconds = totalSeconds % 60;
     return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}


export function useMarketHours(pair: string): MarketHoursInfo {
  const [marketInfo, setMarketInfo] = useState<MarketHoursInfo>({
    status: null,
    timeRemaining: null,
    nextEventTime: null,
    nextEventLabel: null,
  });

  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    const calculateMarketInfo = () => {
      try {
        const now = new Date(); // Current local time
        let status: MarketHoursInfo['status'] = null;
        let timeRemaining: string | null = null;
        let nextEventTime: Date | null = null;
        let nextEventLabel: MarketHoursInfo['nextEventLabel'] = null;

        // Determine asset class
        let assetClass: 'equity' | 'fx' | 'metal' | 'commodity' | 'other' = 'other';
        if (EQUITY_PAIRS.includes(pair)) assetClass = 'equity';
        else if (FX_PAIRS.includes(pair)) assetClass = 'fx';
        else if (METAL_PAIRS.includes(pair)) assetClass = 'metal';
        else if (COMMODITY_PAIRS.includes(pair)) assetClass = 'commodity';


        if (assetClass === 'equity') {
          const etParts = getCurrentTimeParts(EQUITY_TIMEZONE);
          const nowET = new Date(Date.UTC(etParts.year, etParts.month, etParts.day, etParts.hours, etParts.minutes, etParts.seconds));
          const dayET = etParts.dayOfWeek; // 0 = Sunday, 6 = Saturday

          const marketOpenTimeTodayET = new Date(Date.UTC(etParts.year, etParts.month, etParts.day, EQUITY_OPEN_HOUR_ET, EQUITY_OPEN_MINUTE_ET, 0));
          const marketCloseTimeTodayET = new Date(Date.UTC(etParts.year, etParts.month, etParts.day, EQUITY_CLOSE_HOUR_ET, EQUITY_CLOSE_MINUTE_ET, 0));

          if (dayET > 0 && dayET < 6) { // Weekday
            if (nowET >= marketOpenTimeTodayET && nowET < marketCloseTimeTodayET) {
              status = 'open';
              nextEventTime = marketCloseTimeTodayET;
              nextEventLabel = 'Closes';
            } else {
              status = 'closed';
              if (nowET < marketOpenTimeTodayET) {
                nextEventTime = marketOpenTimeTodayET;
                nextEventLabel = 'Opens';
              } else { // After close
                nextEventTime = new Date(marketOpenTimeTodayET);
                nextEventTime.setUTCDate(nextEventTime.getUTCDate() + (dayET === 5 ? 3 : 1)); // Next weekday
                 nextEventLabel = 'Opens';
              }
            }
          } else { // Weekend
            status = 'closed';
            nextEventTime = new Date(marketOpenTimeTodayET);
            nextEventTime.setUTCDate(nextEventTime.getUTCDate() + (dayET === 0 ? 1 : 2)); // Monday
            nextEventLabel = 'Opens';
          }

        } else if (assetClass === 'fx') {
          const tz = FX_TIMEZONE;
          const openDay = FX_OPEN_DAY_ET;
          const openHour = FX_OPEN_HOUR_ET;
          const closeDay = FX_CLOSE_DAY_ET;
          const closeHour = FX_CLOSE_HOUR_ET;

          const etParts = getCurrentTimeParts(tz);
          const nowET = new Date(Date.UTC(etParts.year, etParts.month, etParts.day, etParts.hours, etParts.minutes, etParts.seconds));
          // const dayET = etParts.dayOfWeek; // Not strictly needed for FX logic as written

          // --- FX Logic (Simplified based on original approach) ---
          // Calculate the latest past open time (Sunday 5 PM ET)
          let lastOpenTime = new Date(nowET);
          lastOpenTime.setUTCHours(openHour, 0, 0, 0);
          while (lastOpenTime.getUTCDay() !== openDay) {
              lastOpenTime.setUTCDate(lastOpenTime.getUTCDate() - 1);
          }
          if (nowET < lastOpenTime) {
              lastOpenTime.setUTCDate(lastOpenTime.getUTCDate() - 7);
          }

          // Calculate the next future close time (Friday 5 PM ET)
          let nextCloseTime = new Date(nowET);
          nextCloseTime.setUTCHours(closeHour, 0, 0, 0);
           while (nextCloseTime.getUTCDay() !== closeDay) {
               nextCloseTime.setUTCDate(nextCloseTime.getUTCDate() + 1);
           }
           if (nowET >= nextCloseTime) {
               nextCloseTime.setUTCDate(nextCloseTime.getUTCDate() + 7);
           }

          // Calculate the next future open time (Next Sunday 5 PM ET)
           let nextOpenTime = new Date(nowET);
           nextOpenTime.setUTCHours(openHour, 0, 0, 0);
           while (nextOpenTime.getUTCDay() !== openDay) {
               nextOpenTime.setUTCDate(nextOpenTime.getUTCDate() + 1);
           }
            if (nowET >= nextOpenTime) {
                 nextOpenTime.setUTCDate(nextOpenTime.getUTCDate() + 7);
            }

           // Determine status based on whether now is between the last open and next close
           if (nowET >= lastOpenTime && nowET < nextCloseTime) {
             status = 'open';
             nextEventTime = nextCloseTime; // Next event is always weekly close when open
             nextEventLabel = 'Closes';
           } else {
             status = 'closed';
             nextEventTime = nextOpenTime; // Next event is always next weekly open when closed
             nextEventLabel = 'Opens';
           }

        } else if (assetClass === 'metal') {
           const tz = METAL_TIMEZONE;
           const openDay = METAL_OPEN_DAY_ET;
           const openHour = METAL_OPEN_HOUR_ET;
           const closeDay = METAL_CLOSE_DAY_ET;
           const closeHour = METAL_CLOSE_HOUR_ET;

           const etParts = getCurrentTimeParts(tz);
           const nowET = new Date(Date.UTC(etParts.year, etParts.month, etParts.day, etParts.hours, etParts.minutes, etParts.seconds));
           const dayET = etParts.dayOfWeek; // 0 = Sun, 1=Mon, ..., 6=Sat

           // Calculate weekly open/close/next open times (similar to FX but with metal hours)
           let lastOpenTime = new Date(nowET);
           lastOpenTime.setUTCHours(openHour, 0, 0, 0);
           while (lastOpenTime.getUTCDay() !== openDay) { lastOpenTime.setUTCDate(lastOpenTime.getUTCDate() - 1); }
           if (nowET < lastOpenTime) { lastOpenTime.setUTCDate(lastOpenTime.getUTCDate() - 7); }

           let nextCloseTime = new Date(nowET);
           nextCloseTime.setUTCHours(closeHour, 0, 0, 0);
           while (nextCloseTime.getUTCDay() !== closeDay) { nextCloseTime.setUTCDate(nextCloseTime.getUTCDate() + 1); }
           if (nowET >= nextCloseTime) { nextCloseTime.setUTCDate(nextCloseTime.getUTCDate() + 7); }

           let nextOpenTime = new Date(nowET);
           nextOpenTime.setUTCHours(openHour, 0, 0, 0);
           while (nextOpenTime.getUTCDay() !== openDay) { nextOpenTime.setUTCDate(nextOpenTime.getUTCDate() + 1); }
           if (nowET >= nextOpenTime) { nextOpenTime.setUTCDate(nextOpenTime.getUTCDate() + 7); }

           // Check if within the main weekly open window
           const isWithinWeeklyWindow = nowET >= lastOpenTime && nowET < nextCloseTime;

           if (isWithinWeeklyWindow) {
                // Check for daily break (Mon-Thu 5pm-6pm ET)
                const isBreakDay = dayET >= 1 && dayET <= 4; // Monday to Thursday
                let isBreakTime = false;
                let breakStartTimeToday: Date | null = null;
                let breakEndTimeToday: Date | null = null;

                if (isBreakDay) {
                     breakStartTimeToday = new Date(nowET);
                     breakStartTimeToday.setUTCHours(METAL_BREAK_START_HOUR_ET, 0, 0, 0);
                     breakEndTimeToday = new Date(nowET);
                     breakEndTimeToday.setUTCHours(METAL_BREAK_END_HOUR_ET, 0, 0, 0);

                     if (nowET >= breakStartTimeToday && nowET < breakEndTimeToday) {
                         isBreakTime = true;
                     }
                }

                if (isBreakTime && breakEndTimeToday) {
                     status = 'break';
                     nextEventTime = breakEndTimeToday;
                     nextEventLabel = 'Break Ends';
                } else {
                     status = 'open';
                     // Determine next event: break start or weekly close
                     if (isBreakDay && breakStartTimeToday && nowET < breakStartTimeToday) {
                         // It's Mon-Thu, before the break starts
                         nextEventTime = breakStartTimeToday;
                         nextEventLabel = 'Closes'; // Treat break start as a close event
                     } else {
                         // It's past break time (Mon-Thu), or it's Friday/Sunday within the window
                         nextEventTime = nextCloseTime;
                         nextEventLabel = 'Closes';
                     }
                }
           } else {
                // Outside the main weekly window
                status = 'closed';
                nextEventTime = nextOpenTime;
                nextEventLabel = 'Opens';
           }

        } else if (assetClass === 'commodity') { // WTI/USD specifically (UTC based)
           const nowUTC = new Date(); // Already in UTC effectively
           const dayUTC = nowUTC.getUTCDay(); // 0 = Sun, 6 = Sat
           const hoursUTC = nowUTC.getUTCHours();
           const minutesUTC = nowUTC.getUTCMinutes();
           const currentTimeValueUTC = hoursUTC * 60 + minutesUTC;

           // Calculate this week's open/close times in minutes from start of day
           const openTimeValueUTC = WTI_OPEN_HOUR_UTC * 60; // Sunday 23:00
           const closeTimeValueUTC = WTI_CLOSE_HOUR_UTC * 60 + WTI_CLOSE_MINUTE_UTC; // Friday 21:45
           const breakStartTimeValueUTC = WTI_BREAK_START_HOUR_UTC * 60; // 22:00
           const breakEndTimeValueUTC = WTI_BREAK_END_HOUR_UTC * 60; // 23:00

           let isOpen = false;
           let isBreak = false;

           if (dayUTC > WTI_OPEN_DAY_UTC && dayUTC < WTI_CLOSE_DAY_UTC) { // Monday to Thursday
               isOpen = true; // Definitely open unless it's break time
           } else if (dayUTC === WTI_OPEN_DAY_UTC && currentTimeValueUTC >= openTimeValueUTC) { // Sunday after open
               isOpen = true;
           } else if (dayUTC === WTI_CLOSE_DAY_UTC && currentTimeValueUTC < closeTimeValueUTC) { // Friday before close
               isOpen = true;
           }

           // Check for daily break (Monday to Friday)
            if (isOpen && dayUTC >= 1 && dayUTC <= 5) {
                if (currentTimeValueUTC >= breakStartTimeValueUTC && currentTimeValueUTC < breakEndTimeValueUTC) {
                    isBreak = true;
                    isOpen = false; // Not considered open during break
                }
            }

            // Determine status and next event
            if (isBreak) {
                status = 'break';
                nextEventTime = new Date(nowUTC);
                nextEventTime.setUTCHours(WTI_BREAK_END_HOUR_UTC, 0, 0, 0);
                // If break end time is already past for today, it means the next event is tomorrow's break end (unlikely scenario if checking every second)
                if (nowUTC >= nextEventTime) {
                    nextEventTime.setUTCDate(nextEventTime.getUTCDate() + 1);
                }
                 nextEventLabel = 'Break Ends';
            } else if (isOpen) {
                 status = 'open';
                 // Next event is either daily break start or Friday close
                 const potentialBreakStartTime = new Date(nowUTC);
                 potentialBreakStartTime.setUTCHours(WTI_BREAK_START_HOUR_UTC, 0, 0, 0);

                 const potentialCloseTime = new Date(nowUTC);
                 potentialCloseTime.setUTCHours(WTI_CLOSE_HOUR_UTC, WTI_CLOSE_MINUTE_UTC, 0, 0);
                 while (potentialCloseTime.getUTCDay() !== WTI_CLOSE_DAY_UTC) {
                     potentialCloseTime.setUTCDate(potentialCloseTime.getUTCDate() + 1);
                 }
                  if (nowUTC >= potentialCloseTime) { // Already past this week's close? Look to next week.
                     potentialCloseTime.setUTCDate(potentialCloseTime.getUTCDate() + 7);
                 }


                 if (dayUTC >= 1 && dayUTC <= 5 && nowUTC < potentialBreakStartTime) {
                      // Before break today
                      nextEventTime = potentialBreakStartTime;
                      nextEventLabel = 'Closes'; // Treat break start as a close for simplicity
                 } else {
                      // After break today OR on Sunday/Friday open period
                      // Next event is the weekly close
                      nextEventTime = potentialCloseTime;
                      nextEventLabel = 'Closes';
                 }


            } else { // Closed (Weekend or outside Sun/Fri window)
                status = 'closed';
                 // Find next Sunday open time
                nextEventTime = new Date(nowUTC);
                nextEventTime.setUTCHours(WTI_OPEN_HOUR_UTC, 0, 0, 0);
                 while (nextEventTime.getUTCDay() !== WTI_OPEN_DAY_UTC) {
                     nextEventTime.setUTCDate(nextEventTime.getUTCDate() + 1);
                 }
                if (nowUTC >= nextEventTime) { // Already past this week's Sunday open? Look to next week.
                    nextEventTime.setUTCDate(nextEventTime.getUTCDate() + 7);
                }
                nextEventLabel = 'Opens';
            }

        } else {
           // Asset class 'other' or not found
           status = null;
           timeRemaining = null;
           nextEventTime = null;
           nextEventLabel = null;
        }


        // Calculate time remaining if nextEventTime is set
        if (nextEventTime) {
             // Use the appropriate 'now' time based on timezone context
             const nowForDiff = (assetClass === 'equity' || assetClass === 'fx' || assetClass === 'metal')
                 ? new Date(Date.UTC(getCurrentTimeParts(assetClass === 'equity' ? EQUITY_TIMEZONE : (assetClass === 'fx' ? FX_TIMEZONE : METAL_TIMEZONE)).year, getCurrentTimeParts(assetClass === 'equity' ? EQUITY_TIMEZONE : (assetClass === 'fx' ? FX_TIMEZONE : METAL_TIMEZONE)).month, getCurrentTimeParts(assetClass === 'equity' ? EQUITY_TIMEZONE : (assetClass === 'fx' ? FX_TIMEZONE : METAL_TIMEZONE)).day, getCurrentTimeParts(assetClass === 'equity' ? EQUITY_TIMEZONE : (assetClass === 'fx' ? FX_TIMEZONE : METAL_TIMEZONE)).hours, getCurrentTimeParts(assetClass === 'equity' ? EQUITY_TIMEZONE : (assetClass === 'fx' ? FX_TIMEZONE : METAL_TIMEZONE)).minutes, getCurrentTimeParts(assetClass === 'equity' ? EQUITY_TIMEZONE : (assetClass === 'fx' ? FX_TIMEZONE : METAL_TIMEZONE)).seconds)) // Reconstruct ET/relevant TZ time
                 : new Date(); // Use current UTC for WTI
           const diffMillis = nextEventTime.getTime() - nowForDiff.getTime();
           timeRemaining = formatTimeRemaining(diffMillis);

           if (diffMillis <= 0) {
               // Time reached 0, force recalculation slightly delayed
               // This prevents stale state if interval fires slightly late
               setTimeout(calculateMarketInfo, 50);
           }
        }


        setMarketInfo({ status, timeRemaining, nextEventTime, nextEventLabel });

      } catch (error) {
        console.error("Error calculating market hours:", error);
        setMarketInfo({ status: null, timeRemaining: '--:--:--', nextEventTime: null, nextEventLabel: null });
      }
    };

    // Initial calculation only if pair is provided
    if (pair) {
        calculateMarketInfo();
        intervalId = setInterval(calculateMarketInfo, 1000); // Update every second
    } else {
        // Clear info if no pair is selected
         setMarketInfo({ status: null, timeRemaining: null, nextEventTime: null, nextEventLabel: null });
    }


    // Cleanup interval on component unmount or pair change
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [pair]); // Rerun effect when the pair changes

  return marketInfo;
} 