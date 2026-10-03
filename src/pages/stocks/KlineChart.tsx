import {ComponentPropsWithoutRef, useEffect, useState} from 'react'
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
const ONE_DAY_MS = 24 * 60 * 60 * 1000;


type IndicatorPanelProps = {
  chart: Chart | null
  stock: Stock
  startDate: string
  endDate: string
  indicatorOptions: IndicatorOption[]
}

async function renderIndicator(
  chart: Chart,
  stockId: number,
  indicator: IndicatorOption,
  startDate: string,
  endDate: string,
  paneId: string,
) {
  if (!chart) {
    return;
  }
  const pointMap = new Map<number, Record<string, number | null>>();
  let loadedStart = Utils.toTimestamp(startDate);
  let loadedEnd = Utils.toTimestamp(endDate);
  let pendingLoad: Promise<void> | null = null;

  const mergeIndicatorPoints = (rows: any[]) => {
    const indicatorPoints = deserializeIndicatorDetail(rows);
    indicatorPoints.forEach((point) => {
      pointMap.set(point.timestamp, point.values);
    });
  };

  const loadIndicatorRange = async (rangeStart: number, rangeEnd: number) => {
    if (rangeStart > rangeEnd) {
      return;
    }
    const detail = await Api.Indicator.detail({
      stockId,
      startDate: Utils.fromTimestamp(rangeStart),
      endDate: Utils.fromTimestamp(rangeEnd),
      names: indicator.outputColumns.join(','),
    });
    mergeIndicatorPoints(detail);
  };

  await loadIndicatorRange(loadedStart, loadedEnd);

  const ensureIndicatorData = async (dataList: KLineData[]) => {
    if (dataList.length === 0) {
      return;
    }
    if (pendingLoad) {
      await pendingLoad;
    }

    const rangeStart = dataList[0].timestamp;
    const rangeEnd = dataList[dataList.length - 1].timestamp;
    const missingRanges: Array<[number, number]> = [];

    if (rangeStart < loadedStart) {
      missingRanges.push([rangeStart, loadedStart - ONE_DAY_MS]);
    }
    if (rangeEnd > loadedEnd) {
      missingRanges.push([loadedEnd + ONE_DAY_MS, rangeEnd]);
    }
    if (missingRanges.length === 0) {
      return;
    }

    const currentLoad = (async () => {
      for (const [missingStart, missingEnd] of missingRanges) {
        await loadIndicatorRange(missingStart, missingEnd);
      }
      loadedStart = Math.min(loadedStart, rangeStart);
      loadedEnd = Math.max(loadedEnd, rangeEnd);
    })();

    pendingLoad = currentLoad;
    try {
      await currentLoad;
    } finally {
      if (pendingLoad === currentLoad) {
        pendingLoad = null;
      }
    }
  };

  registerIndicator({
    name: indicator.name,
    shortName: indicator.name,
    series: 'normal',
    figures: indicator.outputColumns.map((key) => ({
      key,
      title: `${key}: `,
      type: 'line',
    })),
    calc: async (dataList) => {
      await ensureIndicatorData(dataList);
      return dataList.map((item) => {
        const values = pointMap.get(item.timestamp);
        return indicator.outputColumns.reduce<Record<string, number | null>>((acc, key) => {
          acc[key] = values?.[key] ?? null;
          return acc;
        }, {});
      });
    },
  });
  // const paneId = indicator.attachKline ? CHART_MAIN_PANE_ID : CHART_EXTRA_PANE_ID;
  chart.removeIndicator({ paneId });
  const indicatorId = chart.createIndicator({
    name: indicator.name,
    shortName: indicator.name,
    paneId: paneId,
  });
  if (indicatorId) {
    chart.setPaneOptions({
      id: CHART_EXTRA_PANE_ID,
      minHeight: 120,
      height: 140,
    });
  }
}

function IndicatorPanel({
  chart,
  stock,
  startDate,
  endDate,
  indicatorOptions,
}: IndicatorPanelProps) {
  if (!chart) {
    console.log('chart is null')
    return;
  }

  const [activeTab, setActiveTab] = useState(indicatorOptions[0]?.indicatorId || '')
  const onIndicatorChange = (key: string) => {
    if (!chart) {
      return;
    }
    const indicator = indicatorOptions.find((item) => item.indicatorId === key);
    if (!indicator) {
      return;
    }
    renderIndicator(chart, stock.id, indicator, startDate, endDate, CHART_EXTRA_PANE_ID).then(() => setActiveTab(key));
  }

  return (
    <Tabs
      activeTab={activeTab}
      defaultActiveTab={activeTab}
      onChange={onIndicatorChange}
      style={{ marginTop: '12px' }}
    >
    {indicatorOptions.map((item) => {
      return (
        <Tabs.TabPane key={item.indicatorId} title={item.name} />
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
  const [chart, setChart] = useState<Chart | null>(null)

  const [klineIndicators, setKlineIndicators] = useState<IndicatorOption[]>([]);
  const [nonKlineIndicators, setNonKlineIndicators] = useState<IndicatorOption[]>([]);
  const [activeTab, setActiveTab] = useState('')

  // 初始化图表
  useEffect(() => {
    const chart: Chart | null = init('chart')
    if (!chart) {
      return;
    }
    setChart(chart)
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
      setChart(null)
      dispose('chart')
    }
  }, [stock, startDate, endDate])

  // 加载所有指标
  useEffect(() => {
    let cancelled = false;

    Api.Indicator.list()
      .then((data) => {
        if (cancelled) {
          return;
        }
        const options = deserializeIndicatorOptions(data);
        const klineOptions = options.filter(item => item.attachKline);
        const nonKlineOptions = options.filter(item => !item.attachKline);

        setKlineIndicators(klineOptions);
        setNonKlineIndicators(nonKlineOptions);
        setActiveTab(klineOptions[0]?.indicatorId || '');
      })
      .catch((error) => {
        if (!cancelled) {
          console.error(error);
          setKlineIndicators([]);
          setNonKlineIndicators([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!chart || !activeTab) {
      return;
    }
    if (chart.getIndicators({ paneId: CHART_MAIN_PANE_ID }).length > 0) {
      return;
    }
    const indicator = klineIndicators.find((item) => item.indicatorId === activeTab);
    if (!indicator) {
      return;
    }
    renderIndicator(chart, stock.id, indicator, startDate, endDate, CHART_MAIN_PANE_ID).then(() => {});
  }, [chart, activeTab, klineIndicators, stock.id, startDate, endDate]);

  const onIndicatorChange = (key: string) => {
    if (!chart) {
      return;
    }
    const indicator = klineIndicators.find((item) => item.indicatorId === key);
    if (!indicator) {
      return;
    }
    renderIndicator(chart, stock.id, indicator, startDate, endDate, CHART_MAIN_PANE_ID).then(() => setActiveTab(key));
  }

  return (
    <div>
      <Tabs
        activeTab={activeTab}
        onChange={onIndicatorChange}
        style={{ marginTop: '0px' }}
      >
        {klineIndicators.map((item) => {
          return (
            <Tabs.TabPane key={item.indicatorId} title={item.name} />
          )
        })}
      </Tabs>
      <div id="chart" {...divProps} />
      {withIndicators && (
        <IndicatorPanel
          chart={chart}
          stock={stock}
          startDate={startDate}
          endDate={endDate}
          indicatorOptions={nonKlineIndicators}
        />
      )}
    </div>
  )
}

export default KlineChart
