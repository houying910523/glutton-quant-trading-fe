type Stock = {
  id: number;
  name: string;
  symbol: string;
  exchange: string;
  listed_at: string;
  optional: number;
}

type StockListResponse = {
  total: number;
  stocks: Stock[];
}