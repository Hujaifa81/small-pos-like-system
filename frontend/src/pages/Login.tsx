/* eslint-disable @typescript-eslint/no-explicit-any */
// React import not required with the new JSX transform
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../lib/axios';

type LoginPayload = {
  email: string;
  password: string;
};

export default function Login() {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const loginMutation = useMutation<any, Error, LoginPayload>({
    mutationFn: async (payload) => axiosInstance.post('/auth/login', payload),
    onSuccess: (res) => {
      message.success('Login successful');
      const user = res?.data?.data?.user ?? null;
      const token = res?.data?.data?.access_token ?? null;
      if (token) {
        try {
          localStorage.setItem('access_token', token);
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (e) {
          console.error('Failed to store access_token in localStorage', e);
        }
      }
      if (user) {
        queryClient.setQueryData(['user', 'me'], user);
        const role = user?.role;
        if (role === 'CASHIER') {
          navigate('/app/sales/mine');
        } else if (role === 'ADMIN') {
          navigate('/admin/products/create');
        } else {
          navigate('/app');
        }
        return;
      }
      (async () => {
        try {
          const r = await axiosInstance.get('/user/me');
          const u = r.data?.data ?? null;
          if (u) {
            queryClient.setQueryData(['user', 'me'], u);
            const role = u?.role;
            if (role === 'CASHIER') {
              navigate('/app/sales');
            } else if (role === 'ADMIN') {
              navigate('/admin/products/create');
            } else {
              navigate('/app');
            }
            return;
          }
        } catch (e) {
          console.error('Failed to fetch /user/me after login', e);
        }
        message.error('Failed to load user profile');
      })();
    },
    onError: (err: any) => {
      console.error('Login error', err?.response ?? err);
      const status = err?.response?.status ?? null;
      const serverMsg = err?.response?.data?.message ?? null;
      const msg = serverMsg ?? (status ? `Login failed (status ${status})` : 'Login failed');
      message.error(msg);
    },
  });

  const onFinish = (values: any) => {
    const payload: LoginPayload = { email: values.email, password: values.password };
    
    loginMutation.mutate(payload);
  };

  const isSubmitting = loginMutation.status === 'pending';

  return (
    <div style={{ width: '100%' }}>
      <Card style={{ width: 420, position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        <Typography.Title level={4} style={{ marginBottom: 8 }}>Sign in</Typography.Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Please enter your email' }]}>
            <Input placeholder="user@gmail.com" />
          </Form.Item>

          <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please enter your password' }]}>
            <Input.Password placeholder="Your password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isSubmitting} block>
              Sign in
            </Button>
          </Form.Item>

          <Form.Item>
            <Button
              type="default"
              onClick={() => loginMutation.mutate({ email: 'hujaifa@gmail.com', password: '123456@aA' })}
              disabled={isSubmitting}
              block
            >
              Demo login
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginTop: 8 }}>
            Don't have an account? <Link to="/register">Register</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
