import {useEffect, useState} from 'react';
import {Button, Card, Descriptions} from "@arco-design/web-react";
import Utils from "@/asset/utils";
import {IconStar, IconStarFill} from "@arco-design/web-react/icon";
import KlineChart from "@/pages/stocks/KlineChart";
import {Api} from "@/asset/api";


function StockDetail({
  stock
}: {stock: Stock | null}) {
  if (!stock) {
    return null;
  }
  const [optional, setOptional] = useState(stock.optional);

  useEffect(() => {
    setOptional(stock.optional);
  }, [stock.id]);

  const data = [
    {
      label: '股票代码',
      value: stock.symbol,
    },
    {
      label: '股票名称',
      value: stock.name,
    },
    {
      label: '上市日期',
      value: stock.listed_at,
    },
    {
      label: '市场',
      value: Utils.formatExchange(stock.exchange),
    }
  ]

  const addOptional = async () => {
    const success = await Api.Stock.optional({stockId: stock.id, action: 'add'});
    if (success) {
      stock.optional = 1;
      setOptional(1);
    }
  }
  const removeOptional = async () => {
    const success = await Api.Stock.optional({stockId: stock.id, action: 'remove'});
    if (success) {
      stock.optional = 0;
      setOptional(0);
    }
  }
  const cardTitle = (
    <div>
      <span>
        {stock.name} ({stock.symbol})
      </span>
      <span style={{float: 'right'}}>
        {optional === 0 && (<Button type="secondary" icon={<IconStar />} onClick={addOptional}>添加自选</Button>)}
        {optional === 1 && (<Button type="secondary" status="warning" icon={<IconStarFill />} onClick={removeOptional}>取消自选</Button>)}
      </span>
    </div>
  )
  const endDate = Utils.formatDate(new Date());
  const startDate = Utils.fromTimestamp(new Date().getTime() - 365 * 24 * 60 * 60 * 1000);
  return (
    <div>
      <Card style={{ width: '100%'}}>
        <KlineChart
          stock={stock}
          startDate={startDate}
          endDate={endDate}
          withIndicators={true}
          style={{ width: '100%', height: 650 }}
        />
      </Card>
    </div>
  );
}

export default StockDetail;
