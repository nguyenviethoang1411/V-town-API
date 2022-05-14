import React from 'react';
import AppPage from '../../@crema/hoc/AppPage';
import asyncComponent from '../../@crema/utility/asyncComponent';

const Customer: any = asyncComponent(
  () => import('../../modules/customers/Customers'),
);
export default AppPage(() => <Customer />);
