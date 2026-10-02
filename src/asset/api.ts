import axios from 'axios';

axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.headers.get['Content-Type'] = 'application/x-www-form-urlencoded';

const doPost = (url: string, params: any) => axios.post(url, params).then(res => res.data);

const doGet = async (url: string, params: any) => {
  if (params) {
    let del = "?";
    for (let item in params) {
      url = url + del + item + '=' + params[item];
      del = "&";
    }
  }
  const res = await axios.get(url, params);
  return res.data;
};

function validate(response: any) {
  if (response.code !== 200 || !response.success) {
    throw new Error(response.msg);
  }
  return response.data;
}

// eslint-disable-next-line no-unused-vars
const post = (url: string) => {
  return (params: any) => doPost('/api' + url, params).then(validate)
}
const get = (url: string) => {
  return (params: any) => doGet('/api' + url, params).then(validate)
}

export type StockListParams = {
  symbol?: string,
  name?: string,
  pageNo?: number,
  pageSize?: number,
}

export const Api = {
  Stock: {
    list: ({symbol, name, pageNo, pageSize}: StockListParams) => get('/stock/list')({symbol, name, page_no: pageNo, page_size: pageSize}),
    daily: ({stockId, startDate, endDate}: {stockId: number, startDate: string, endDate: string}) => get('/stock/daily')({stock_id: stockId, start_date: startDate, end_date: endDate}),
  }
}
