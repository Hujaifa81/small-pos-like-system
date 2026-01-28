import MySales from "../pages/User/MySales";
import SalesCreate from "../pages/User/SalesCreate";
import type { ISidebarItem } from "../types";


export const userSidebarItems: ISidebarItem[] = [
  {
    title: 'Sales',
    items: [
      { title: 'Create Sale',
         url: 'sales/create', 
         component: SalesCreate },
      { title: 'My Sales', 
        url: 'sales', 
        component: MySales },
    ],
  },
];
