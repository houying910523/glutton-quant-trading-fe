import {Button, TableColumnProps} from "@arco-design/web-react";
import {Stock} from "@/pages/stocks/Stock";

export function createTableColumn(onDetailClick: (item: Stock) => void) {
  const columns: TableColumnProps[] = [
    {
      title: '股票名称',
      dataIndex: 'name',
    },
    {
      title: '股票代码',
      dataIndex: 'symbol',
    },
    {
      title: '交易所',
      dataIndex: 'exchange',
    },
    {
      title: '上市日期',
      dataIndex: 'listed_at',
      render: (text: string) => {
        return text ?? '-';
      },
      width: 120,
    },
    {
      title: '操作',
      render: (col: any, item: Stock, index: number) => {
        return (
          <div>
            <Button size="mini" type="primary" onClick={() => onDetailClick(item)}>详情</Button>
        </div>
      );
      }
    }
  ];

  return columns;
}
