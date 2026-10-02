import {Button, Layout, Menu} from '@arco-design/web-react';
import '@/styles/app.less';
import router from '@/router';
import {BrowserRouter, Link, NavLink, useLocation, useRoutes} from "react-router";
import {useState} from "react";
import {IconArrowLeft} from "@arco-design/web-react/icon";

function AppRoutes() {
  return useRoutes(router);
}

function App() {
  const height = window.innerHeight;

  const TopMenu = (props: any) => {
    const location = useLocation();
    const selectedKeys = [
      router.find((item) => item.path === location.pathname)?.id || 'index',
    ];
    return (
      <Menu
        mode='vertical'
        theme='dark'
        selectedKeys={selectedKeys}
        {...props}
      >
        {router.map((item) => (
          <Menu.Item key={item.id || item.name} className="top-menu-item">
            <Link to={item.path ?? '/'} className="top-menu-item-link" >{item.name}</Link>
          </Menu.Item>
        ))}
      </Menu>
    )
  }

  return (
    <div className="app">
      <BrowserRouter>
        <Layout style={{height: height + 'px'}}>
          <Layout.Sider style={{width: '120px'}} >
            <div >
              <h4 style={{color: '#fff', textAlign: 'center'}}>Glutton Quant</h4>
            </div>
            <TopMenu style={{width: '100%'}}/>
          </Layout.Sider>
          <Layout.Content>
            <AppRoutes />
          </Layout.Content>
        </Layout>
      </BrowserRouter>
    </div>
  );
}

export default App;
