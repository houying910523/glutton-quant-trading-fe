import {useEffect, useRef, useState} from 'react';
import {Input, Layout, PaginationProps, Table, Tabs} from '@arco-design/web-react';
import {Api, StockListParams} from '@/asset/api';
import StockDetail from "@/pages/stocks/StockDetail";
import Selection from "@/pages/stocks/Selection";
import {createTableColumn} from "@/pages/stocks/common";


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
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [tableScrollY, setTableScrollY] = useState(400);
  const listPanelRef = useRef<HTMLDivElement>(null);
  const tableWrapperRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const updateTableScrollY = () => {
      const listPanel = listPanelRef.current;
      const tableWrapper = tableWrapperRef.current;
      if (!listPanel || !tableWrapper) {
        return;
      }

      const tableHeader = tableWrapper.querySelector<HTMLElement>('.arco-table-header');
      const pagination = tableWrapper.querySelector<HTMLElement>('.arco-table-pagination');
      const tableTop = tableWrapper.getBoundingClientRect().top;
      const panelBottom = listPanel.getBoundingClientRect().bottom;
      const headerHeight = tableHeader?.getBoundingClientRect().height ?? 0;
      const paginationHeight = pagination?.getBoundingClientRect().height ?? 0;
      const nextScrollY = Math.max(
        120,
        Math.floor(panelBottom - tableTop - headerHeight - paginationHeight),
      );

      setTableScrollY((current) => current === nextScrollY ? current : nextScrollY);
    };

    updateTableScrollY();
    const resizeObserver = new ResizeObserver(updateTableScrollY);
    if (listPanelRef.current) {
      resizeObserver.observe(listPanelRef.current);
    }
    window.addEventListener('resize', updateTableScrollY);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateTableScrollY);
    };
  }, [stockList.length, pagination.total, pagination.pageSize, pagination.current]);

  const onDetailClick = (item: Stock) => {
    setSelectedStock(item);
  }
  const columns = createTableColumn(onDetailClick);

  return (
    <Layout style={{height: '100%', minHeight: 0}}>
      <Layout.Sider style={{width: '30%', minHeight: 0}}>
        <div className='stock-list-panel' ref={listPanelRef}>
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
          <div ref={tableWrapperRef} style={{marginTop: '10px'}}>
            <Table
              style={{height: 'auto'}}
              columns={columns}
              stripe
              scroll={{y: tableScrollY}}
              data={stockList}
              pagination={pagination}
              onChange={handlePaginationChange}
              loading={loading} />
          </div>
        </div>
      </Layout.Sider>
      <Layout.Content style={{width: '70%', margin: '0 5px', minHeight: 0}}>
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
      <Tabs.TabPane key='optional' title="自选股票" style={{height: '100%'}}>
        <StockListTabPanel optional />
      </Tabs.TabPane>
      <Tabs.TabPane key='selection' title="智能选股" >
        <Selection />
      </Tabs.TabPane>
     </Tabs>
  )
}
