/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/axios';
import { Table, Button, Space, Popconfirm, message, Input, Pagination, Card } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';

type Product = { id: string; name: string; sku?: string; price: number; stockQuantity?: number; createdAt?: string };

export default function ProductsList() {
  const qClient = useQueryClient();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [term, setTerm] = useState('');

  const { data, isLoading } = useQuery<{ data: Product[]; meta: any }, Error>({
    queryKey: ['admin', 'products', page, limit, term],
    queryFn: async () => {
      const params: any = { page, limit };
      if (term) params.search = term;
      const res = await axiosInstance.get('/product', { params });
      return { data: res.data.data as Product[], meta: res.data.meta };
    },
    staleTime: 5000,
  });

  const products = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page, limit };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => axiosInstance.delete(`/product/${id}`),
    onSuccess: () => {
      message.success('Product deleted');
      qClient.invalidateQueries({ predicate: (q) => Array.isArray(q.queryKey) && (q.queryKey as any[])[0] === 'admin' && (q.queryKey as any[])[1] === 'products' });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to delete product';
      message.error(msg);
    },
  });

  const columns: ColumnsType<Product> = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (p) => `$${Number(p).toFixed(2)}` },
    { title: 'Stock', dataIndex: 'stockQuantity', key: 'stock' },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (d) => d ? new Date(d).toLocaleString() : '' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Product) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/admin/products/${record.id}/edit`)}>Edit</Button>
          <Popconfirm title="Delete this product?" onConfirm={() => deleteMutation.mutate(record.id)} okText="Yes" cancelText="No">
            <Button danger type="text">Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card title="Products (Admin)" extra={<Button type="primary" onClick={() => navigate('/admin/products/create')}>Create</Button>} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Input.Search placeholder="Search products" allowClear enterButton onSearch={(v) => { setTerm(v); setPage(1); }} style={{ width: 360 }} />
        </div>

        <Table<Product>
          columns={columns}
          dataSource={products}
          rowKey={(r) => r.id}
          loading={isLoading}
          pagination={false}
        />

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>Page {meta.page} of {meta.totalPages ?? Math.ceil((meta.total || 0) / limit)}</div>
          <Pagination current={page} pageSize={limit} total={meta.total} onChange={(p, ps) => { setPage(p); setLimit(ps); }} />
        </div>
      </Card>
    </div>
  );
}
