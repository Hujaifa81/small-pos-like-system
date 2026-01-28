import { Form, Input, InputNumber, Button, Card, message } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../../lib/axios';
import { useNavigate } from 'react-router-dom';

type FormValues = { name: string; sku?: string; price: number; stockQuantity?: number };

export default function ProductCreate() {
  const [form] = Form.useForm<FormValues>();
  const qClient = useQueryClient();
  const navigate = useNavigate();

  const createMut = useMutation({
    mutationFn: async (vals: FormValues) => axiosInstance.post('/product', vals),
    onSuccess: () => {
      message.success('Product created');
      qClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      navigate('/admin/products');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'Failed to create product';
      message.error(msg);
    },
  });

  const onFinish = (values: FormValues) => createMut.mutate(values);

  return (
    <Card title="Create Product">
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
          <Button type="primary" htmlType="submit" loading={createMut.status === 'pending'}>
            Create
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
