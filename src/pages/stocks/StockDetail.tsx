import {Button, Card, Descriptions} from "@arco-design/web-react";
import Utils from "@/asset/utils";
import {IconStar} from "@arco-design/web-react/icon";
import KlineChart from "@/pages/stocks/KlineChart";


function StockDetail({
  stock
}: {stock: Stock | null}) {
  if (!stock) {
    return null;
  }
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
  const cardTitle = (
    <div>
      <span>
        {stock.name} ({stock.symbol})
      </span>
      <span style={{float: 'right'}}>
        <Button type="secondary" icon={<IconStar />}>添加自选</Button>
        {/*<Button type="secondary" status="warning" icon={<IconStarFill />}>取消自选</Button>*/}
      </span>
    </div>
  )
  const endDate = Utils.formatDate(new Date());
  const startDate = Utils.fromTimestamp(new Date().getTime() - 365 * 24 * 60 * 60 * 1000);
  return (
    <div>
      <Card
        style={{ width: '100%' }}
        title={cardTitle}
      >
        <Descriptions colon=' :' layout='inline-horizontal' data={data} column={4} />
      </Card>
      <Card style={{ width: '100%', marginTop: '12px' }}>
        <KlineChart
          stock={stock}
          startDate={startDate}
          endDate={endDate}
          withIndicators={true}
          style={{ width: '100%', height: 580 }}
        />
      </Card>
    </div>
  );
}

export default StockDetail;
