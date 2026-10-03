import {ComponentPropsWithoutRef, ReactNode, useEffect, useRef, useState} from 'react'
import {Chart, DataLoaderGetBarsParams, dispose, init, KLineData, registerIndicator} from 'klinecharts'
import {Api} from "@/asset/api";
import Utils from "@/asset/utils";
import {
  deserializeIndicatorDetail,
  deserializeIndicatorOptions,
  IndicatorOption,
} from "@/pages/stocks/indicator";
import {Tabs} from "@arco-design/web-react";

type KlineChartProps = {
  stock: Stock
  startDate: string
  endDate: string
  withIndicators?: boolean
} & ComponentPropsWithoutRef<'div'>

const CHART_MAIN_PANE_ID = 'candle_pane';
const CHART_VOLUME_PANE_ID = 'volume_pane';
const CHART_EXTRA_PANE_ID = 'extra_indicator_pane';


function registerIndicatorPanel(
  chart: Chart | null,
  stock: Stock,
  startDate: string,
  endDate: string,
): ReactNode | null {
  if (!chart) {
    return null;
  }

  const [indicatorOptions, setIndicatorOptions] = useState<IndicatorOption[]>([]);

  useEffect(() => {
    let cancelled = false;

    Api.Indicator.list()
      .then((data) => {
        if (cancelled) {
          return;
        }
        const options = deserializeIndicatorOptions(data);
        setIndicatorOptions(options);
      })
      .catch((error) => {
        if (!cancelled) {
          console.error(error);
          setIndicatorOptions([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const requestIndicator = async (key: string) => {
    const indicator = indicatorOptions.find((item) => item.indicatorId === key);
    if (!indicator) {
      return;
    }
    const detail = await Api.Indicator.detail({
      stockId: stock.id,
      startDate,
      endDate,
      names: indicator.outputColumns.join(','),
    });
    const indicatorPoints = deserializeIndicatorDetail(detail);
    if (indicatorPoints.length === 0) {
      return;
    }
    registerIndicator({
      name: indicator.name,
      shortName: indicator.name,
      series: 'normal',
      figures: indicator.outputColumns.map((key) => ({
        key,
        title: `${key}: `,
        type: 'line',
      })),
      calc: (dataList) => {
        const pointMap = new Map(
          indicatorPoints.map((point) => [point.timestamp, point.values])
        );
        return dataList.map((item) => {
          const values = pointMap.get(item.timestamp);
          return indicator.outputColumns.reduce<Record<string, number | null>>((acc, key) => {
            acc[key] = values?.[key] ?? null;
            return acc;
          }, {});
        });
      },
    });
    const indicatorId = chart.createIndicator({
      name: indicator.name,
      shortName: indicator.name,
      paneId: CHART_EXTRA_PANE_ID,
    });
    if (indicatorId) {
      chart.setPaneOptions({
        id: CHART_EXTRA_PANE_ID,
        minHeight: 120,
        height: 140,
      });
    }
  };

  useEffect(() => {
    chart.removeIndicator({ paneId: CHART_EXTRA_PANE_ID });
    if (!indicatorOptions || indicatorOptions.length === 0) {
      return;
    }
    requestIndicator(indicatorOptions[0].indicatorId).then(() => {});
  }, [stock.id, startDate, endDate]);

  const onIndicatorChange = (key: string) => {
    chart.removeIndicator({ paneId: CHART_EXTRA_PANE_ID });
    requestIndicator(key).then(() => {});
  }
  return (
    <Tabs
      activeTab={indicatorOptions[0].indicatorId}
      onChange={(key) => onIndicatorChange(key)}
      style={{ marginTop: '12px' }}
    >
    {indicatorOptions.map((item) => {
      return (
        <Tabs.TabPane key={item.indicatorId} title={item.name}>
        </Tabs.TabPane>
      )
    })}
  </Tabs>
  )
}

function KlineChart({
  stock,
  startDate,
  endDate,
  withIndicators = true,
  ...divProps
}: KlineChartProps) {
  const listedAt = Utils.toTimestamp(stock.listed_at)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    const chart: Chart | null = init('chart')
    if (!chart) {
      return;
    }
    chartRef.current = chart
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
    chart.createIndicator({ name: 'MA', paneId: CHART_MAIN_PANE_ID })
    chart.createIndicator({ name: 'VOL', paneId: CHART_VOLUME_PANE_ID })
    chart.setPaneOptions({
      id: CHART_VOLUME_PANE_ID,
      minHeight: 100,
      height: 120,
    });
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
        const data = await Api.Stock.daily({
          stockId: stock.id,
          startDate: Utils.fromTimestamp(start),
          endDate: Utils.fromTimestamp(end),
        })
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
  }, [stock, startDate, endDate])

  let indicatorTabs: ReactNode | null = null
  if (withIndicators) {
    indicatorTabs = registerIndicatorPanel(chartRef.current, stock, startDate, endDate)
  }

  return (
    <div>
      <div id="chart" {...divProps} />
      {withIndicators && indicatorTabs}
    </div>
  )
}

export default KlineChart
