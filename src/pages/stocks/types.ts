type Stock = {
  id: number;
  name: string;
  symbol: string;
  exchange: string;
  listed_at: string;
}

type StockListResponse = {
  total: number;
  stocks: Stock[];
}