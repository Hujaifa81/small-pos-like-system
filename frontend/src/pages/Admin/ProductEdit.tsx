/* eslint-disable @typescript-eslint/no-explicit-any */
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/axios';
import { Form, Input, InputNumber, Button, Card, message } from 'antd';
import { useEffect } from 'react';

type FormValues = { name: string; sku?: string; price: number; stockQuantity?: number };

export default function ProductEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qClient = useQueryClient();
  const [form] = Form.useForm<FormValues>();

  const { data, isLoading } = useQuery<FormValues | null, Error, FormValues | null>({
    queryKey: ['admin', 'product', id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/product/${id}`);
      return (res.data?.data as FormValues) ?? null;
    },
    enabled: !!id,
  });

  const updateMut = useMutation({
    mutationFn: async (vals: FormValues) => axiosInstance.patch(`/product/${id}`, vals),
    onSuccess: () => {
      message.success('Product updated');
      qClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      navigate('/admin/products');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to update product';
      message.error(msg);
    },
  });

  useEffect(() => {
    if (data && !isLoading) {
      form.setFieldsValue({ name: data.name, sku: data.sku, price: Number(data.price ?? 0), stockQuantity: data.stockQuantity ?? 0 });
    }
  }, [data, isLoading, form]);

  const onFinish = (vals: FormValues) => updateMut.mutate(vals);

  return (
    <Card title={`Edit Product ${id}`}>
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ price: 0, stockQuantity: 0 }}>
        <Form.Item name="name" label="Name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="sku" label="SKU">
          <Input />
        </Form.Item>
        <Form.Item name="price" label="Price" rules={[{ required: true }]}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="stockQuantity" label="Stock Quantity">
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={updateMut.status === 'pending'}>
            Save
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
