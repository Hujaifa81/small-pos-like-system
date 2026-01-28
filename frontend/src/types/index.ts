import type { ComponentType } from 'react';

export type IResponse<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
};

export interface ISidebarItem {
  title: string;
  items: {
    title: string;
    url: string;
    component: ComponentType;
  }[];
}

export type TRole = 'ADMIN' | 'CASHIER';

