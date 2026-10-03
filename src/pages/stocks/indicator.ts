import Utils from "@/asset/utils";

export type IndicatorOption = {
  id: number
  indicatorId: string
  name: string
  outputColumns: string[]
  description: string
}

export type IndicatorPoint = {
  timestamp: number
  values: Record<string, number | null>
}

export function deserializeIndicatorOptions(raw: any[]): IndicatorOption[] {
  return raw.map(item => {
    return {
      id: item.id,
      indicatorId: item.indicator_id,
      name: item.indicator_name,
      outputColumns: item.output_columns,
      description: item.description
    }
  })
}

export function deserializeIndicatorDetail(rows: any[]): IndicatorPoint[] {
  return rows
    .map((row) => {
      let timestamp = Utils.toTimestamp(row['trade_date']);
      return {
        timestamp,
        values: row as Record<string, number | null>,
      };
    });
}
