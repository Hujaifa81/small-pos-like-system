/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/axios';
import {
  Card,
  Table,
  Button,
  DatePicker,
  InputNumber,
  Space,
  Typography,
  Drawer,
  List,
  Spin,
  Pagination,
  Select,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';

type SaleItem = { id: string; productId: string; quantity: number; price: number };
type Sale = { id: string; total: number; createdAt: string; items: SaleItem[] };

export default function MySales() {
  

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [dateRange, setDateRange] = useState<any>(null);
  const [minTotal, setMinTotal] = useState<number | undefined>(undefined);
  const [maxTotal, setMaxTotal] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(undefined);

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const { data, isLoading, isError } = useQuery<{ data: Sale[]; meta: any }, Error>({
    queryKey: [
      'sales',
      'mine',
      page,
      limit,
      sortBy,
      sortOrder,
      minTotal,
      maxTotal,
      dateRange?.[0]?.toISOString?.(),
      dateRange?.[1]?.toISOString?.(),
    ],
    queryFn: async () => {
      const params: any = { page, limit };
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;
      if (typeof minTotal === 'number') params.minTotal = minTotal;
      if (typeof maxTotal === 'number') params.maxTotal = maxTotal;
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.dateFrom = dateRange[0].toISOString();
        params.dateTo = dateRange[1].toISOString();
      }
      const res = await axiosInstance.get('/sales', { params });
      return { data: res.data.data as Sale[], meta: res.data.meta };
    },
    
  });

  const sales = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1, limit };

  const columns: ColumnsType<Sale> = [
    { title: 'Sale ID', dataIndex: 'id', key: 'id' },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (d) => new Date(d).toLocaleString(),
      sorter: true,
    },
    { title: 'Items', dataIndex: 'items', key: 'items', render: (items: SaleItem[]) => items.length },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (t: number) => `$${Number(t).toFixed(2)}`,
      sorter: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Sale) => (
        <Space>
          <Button size="small" onClick={() => setSelectedSale(record)}>
            View
          </Button>
        </Space>
      ),
    },
  ];

  function onTableChange(_pagination: TablePaginationConfig, _filters: any, sorter: any) {
    if (sorter?.columnKey === 'date') {
      setSortBy('createdAt');
      setSortOrder(sorter.order === 'ascend' ? 'asc' : sorter.order === 'descend' ? 'desc' : undefined);
    }
    if (sorter?.columnKey === 'total') {
      setSortBy('total');
      setSortOrder(sorter.order === 'ascend' ? 'asc' : sorter.order === 'descend' ? 'desc' : undefined);
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      <Card title={<Typography.Title level={4}>My Sales</Typography.Title>} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <DatePicker.RangePicker value={dateRange as any} onChange={(r) => setDateRange(r)} />
          <InputNumber placeholder="Min total" min={0} value={minTotal} onChange={(v) => setMinTotal(v === undefined ? undefined : Number(v))} />
          <InputNumber placeholder="Max total" min={0} value={maxTotal} onChange={(v) => setMaxTotal(v === undefined ? undefined : Number(v))} />
          <Select
            value={limit}
            onChange={(v) => {
              setLimit(Number(v));
              setPage(1);
            }}
            style={{ width: 100 }}
            options={[{ value: 6, label: '6' }, { value: 12, label: '12' }, { value: 24, label: '24' }]}
          />
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : isError ? (
          <div>Error loading sales</div>
        ) : (
          <>
            <Table<Sale>
              columns={columns}
              dataSource={sales}
              rowKey={(r) => r.id}
              pagination={false}
              onChange={onTableChange}
            />

            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Typography.Text>Page {meta.page} of {meta.totalPages ?? Math.ceil((meta.total || 0) / limit)}</Typography.Text>
              </div>
              <Pagination current={page} pageSize={limit} total={meta.total} onChange={(p, ps) => { setPage(p); setLimit(ps); }} />
            </div>
          </>
        )}
      </Card>

      <Drawer open={!!selectedSale} onClose={() => setSelectedSale(null)} width={520} title={`Sale ${selectedSale?.id}`}>
        {selectedSale && (
          <List
            dataSource={selectedSale.items}
            renderItem={(it) => (
              <List.Item>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{it.productId}</div>
                    <div style={{ color: '#666' }}>{it.quantity} × ${Number(it.price).toFixed(2)}</div>
                  </div>
                  <div style={{ fontWeight: 700 }}>${(it.quantity * Number(it.price)).toFixed(2)}</div>
                </div>
              </List.Item>
            )}
          />
        )}
      </Drawer>
    </div>
  );
}


