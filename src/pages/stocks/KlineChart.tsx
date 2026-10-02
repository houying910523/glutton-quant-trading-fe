import {ComponentPropsWithoutRef, useEffect, useState} from 'react'
import {init, dispose, Chart, DataLoaderGetBarsParams, KLineData} from 'klinecharts'
import {Api} from "@/asset/api";
import Utils from "@/asset/utils";

type KlineChartProps = {
  stock: Stock
  startDate: string
  endDate: string
} & ComponentPropsWithoutRef<'div'>

function KlineChart({
  stock,
  startDate,
  endDate,
  ...props
}: KlineChartProps) {
  const listedAt = Utils.toTimestamp(stock.listed_at)
  const requestStockDaily = async (start: string, end: string) => {
    return await Api.Stock.daily({stockId: stock.id, startDate: start, endDate: end})
  }
  useEffect(() => {
    const chart: Chart | null = init('chart')
    if (!chart) {
      return;
    }
    chart.setSymbol({ ticker: stock.symbol })
    chart.setPeriod({ span: 1, type: 'day' })
    chart.setStyles({
      grid: {
        show: false
      },
      candle: {
        priceMark: {
          last: {
            show: false,
          }
        }
      }
    })
    chart.createIndicator({ name: 'MA', paneId: 'candle_pane' })
    chart.createIndicator('VOL')
    chart.setDataLoader({
      getBars: async ({ type,
                        timestamp,
                        callback
      }: DataLoaderGetBarsParams) => {
        let start = Utils.toTimestamp(startDate)
        let end = Utils.toTimestamp(endDate)
        if (type === 'forward' && timestamp) {
          start = timestamp - 360 * 24 * 60 * 60 * 1000
          end = timestamp - 24 * 60 * 60 * 1000
        }
        const data = await requestStockDaily(Utils.fromTimestamp(start), Utils.fromTimestamp(end))
        if (!data) {
          return callback([]);
        }
        const bars = data.map((item: any) => {
          item.timestamp = Utils.toTimestamp(item.trade_date);
          return item
        }).sort((a: KLineData, b: KLineData) => a.timestamp - b.timestamp)
        callback(bars, {
          forward: start > listedAt,
          backward: false
        })
      }
    })

    return () => {
      dispose('chart')
    }
  }, [stock])

  return <div id="chart" {...props} />
}

export default KlineChart