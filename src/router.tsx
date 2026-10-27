import {RouteObject} from 'react-router';
import {Stock} from "@/pages/stocks/Stock";

type RouteItem = RouteObject & {
  name: string;
}
const router: RouteItem[] = [
  {
    path: '/',
    name: '首页',
    id: 'index',
    element: <h3>Index</h3>,
  },
  {
    path: '/stock',
    name: '股票',
    id: 'stock',
    element: <Stock />,
  },
  {
    path: '/factors',
    name: '因子',
    id: 'factor',
    element: <h3>因子</h3>,
  },
  {
    path: '/strategies',
    name: '策略',
    id: 'strategy',
    element: <h3>策略</h3>,
  },
];


export default router;
