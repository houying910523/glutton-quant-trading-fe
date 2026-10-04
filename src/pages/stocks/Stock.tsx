import {useEffect, useState} from 'react';
import {Button, Input, Layout, PaginationProps, Table, TableColumnProps, Tabs} from '@arco-design/web-react';
import {Api, StockListParams} from '@/asset/api';
import StockDetail from "@/pages/stocks/StockDetail";
import Selection from "@/pages/stocks/Selection";

function createTableColumn(onDetailClick: (item: Stock) => void) {
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

export function StockListTabPanel({optional}: {optional?: boolean}) {

  const [stockList, setStockList] = useState<Stock[]>([]);
  const [keyword, setKeyword] = useState<string>('');
  const [pagination, setPagination] = useState({
    total: 0,
    showTotal: true,
    pageSize: 40,
    current: 1,
  });
  const [loading, setLoading] = useState(false);

  const requestStockList = async (params: StockListParams) => {
    setLoading(true);

    const getStockList = async () => {
      if (optional) {
        return await Api.Stock.listOptional(params) as StockListResponse
      } else {
        return await Api.Stock.list(params) as StockListResponse;
      }
    }
    const stockList = await getStockList();

    const data = stockList.stocks.map(stock => {
      return {
        ...stock,
        key: stock.symbol,
      }
    });
    setStockList(data);
    setPagination({
      total: stockList.total,
      pageSize: params.pageSize ?? 20,
      current: params.pageNo ?? 1,
      showTotal: true,
    });
    setLoading(false);
  }

  const handlePaginationChange = async (pagination: PaginationProps) => {
    setLoading(true);
    const params: StockListParams = {
      symbol: '',
      name: '',
      pageNo: pagination.current,
      pageSize: pagination.pageSize,
    }
    if (/^\d+$/.test(keyword)) {
      params.symbol = keyword;
    } else {
      params.name = keyword;
    }
    await requestStockList(params);
  }

  useEffect(() => {
    handlePaginationChange(pagination).then(() => {})
  }, [keyword]);

  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  const onDetailClick = (item: Stock) => {
    setSelectedStock(item);
  }
  const columns = createTableColumn(onDetailClick);

  return (
    <Layout style={{height: '100%'}}>
      <Layout.Sider style={{width: '30%'}}>
        <Input.Search
          style={{ width: '100%' }}
          allowClear
          placeholder='Enter stock name or symbol'
          searchButton='Search'
          onSearch={async (value) => {
            setKeyword(value);
            await handlePaginationChange(pagination);
          }}
        />
        <Table
          style={{marginTop: '10px', height: 'auto'}}
          columns={columns}
          stripe
          scroll={{y: '700px'}}
          data={stockList}
          pagination={pagination}
          onChange={handlePaginationChange}
          loading={loading} />
      </Layout.Sider>
      <Layout.Content style={{width: '70%', margin: '0 5px'}}>
        <div>
          {selectedStock && (
            <StockDetail stock={selectedStock} />
          )}
        </div>
      </Layout.Content>
    </Layout>
  )
}

export function Stock() {
  return (
    <Tabs defaultActiveTab='all' className='stock-tabs'>
      <Tabs.TabPane key='all' title="所有股票" style={{height: '100%'}}>
        <StockListTabPanel />
      </Tabs.TabPane>
      <Tabs.TabPane key='optional' title="自选股票" >
        <StockListTabPanel optional />
      </Tabs.TabPane>
      <Tabs.TabPane key='selection' title="智能选股" >
        <Selection />
      </Tabs.TabPane>
     </Tabs>
  )
}