import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../ui/table";
import { useTradeHistory } from "../../../../hooks/use-trade-history";
import { Bitcoin } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../ui/tooltip";
import { useMemo } from "react";

interface TradeHistory {
  pair: string;
  isLong: boolean;
  size: string;
  margin: string;
  entryPrice: string;
  closePrice: string;
  pnl: string;
  date: string;
}

const formatShortDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return {
    date: new Intl.DateTimeFormat("en-US", {
      month: "numeric",
      day: "numeric",
      year: "2-digit",
    }).format(date),
    time: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date),
  };
};

const formatFullDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true,
  }).format(date);
};

export function TradesContent() {
  const { trades, loading, error } = useTradeHistory();

  const formattedTrades = useMemo(
    () =>
      trades.map((trade) => ({
        ...trade,
        shortDate: formatShortDate(trade.date),
        fullDate: formatFullDate(trade.date),
      })),
    [trades]
  );

  const formatNumber = (value: string) => {
    return Number(value).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const calculatePnlPercentage = (pnl: string, margin: string) => {
    const pnlValue = parseFloat(pnl);
    const marginValue = parseFloat(margin);
    return ((pnlValue / marginValue) * 100).toFixed(2);
  };

  return (
    <>
      <TableHeader>
        <TableRow>
          <TableHead>Market</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Margin</TableHead>
          <TableHead>Entry Price</TableHead>
          <TableHead>Close Price</TableHead>
          <TableHead>PnL</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {error ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-short">
              {error.message}
            </TableCell>
          </TableRow>
        ) : loading ? (  // Changed this condition
          <TableRow>
            <TableCell colSpan={7} className="text-center">
              Loading trades...
            </TableCell>
          </TableRow>
        ) : trades.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center">
              No trade history
            </TableCell>
          </TableRow>
        ) : (
          <>
            {formattedTrades.map((trade, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div>{trade.pair}</div>
                  <div
                    className={trade.isLong ? "text-long" : "text-short"}
                  >
                    {(
                      parseFloat(trade.size) / parseFloat(trade.margin)
                    ).toFixed(1)}
                    x {trade.isLong ? "Long" : "Short"}
                  </div>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex flex-col">
                        <span>{formatShortDate(trade.date).date}</span>
                        <span className="text-xs text-zinc-400">
                          {formatShortDate(trade.date).time}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>{trade.fullDate}</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>${formatNumber(trade.size)}</span>
                    <span className="text-xs text-zinc-400">
                      {(
                        parseFloat(trade.size) / parseFloat(trade.entryPrice)
                      ).toFixed(6)}{" "}
                      {trade.pair.split("/")[0]}
                    </span>
                  </div>
                </TableCell>
                <TableCell>${formatNumber(trade.margin)}</TableCell>
                <TableCell>${formatNumber(trade.entryPrice)}</TableCell>
                <TableCell>${formatNumber(trade.closePrice)}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span
                      className={
                        Number(trade.pnl) >= 0
                          ? "text-long"
                          : "text-short"
                      }
                    >
                      {Number(trade.pnl) >= 0 ? "+$" : "-$"}
                      {Math.abs(Number(trade.pnl)).toFixed(2)}
                    </span>
                    <span
                      className={`text-xs ${
                        Number(trade.pnl) >= 0
                          ? "text-long"
                          : "text-short"
                      }`}
                    >
                      {Number(trade.pnl) >= 0 ? "+" : ""}
                      {calculatePnlPercentage(trade.pnl, trade.margin)}%
                    </span>
                  </div>{" "}
                </TableCell>{" "}
              </TableRow>
            ))}{" "}
          </>
        )}{" "}
      </TableBody>{" "}
    </>
  );
}
