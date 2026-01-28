/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
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
        navigate('/app');
        return;
      }
      // fallback: try /user/me if response didn't include user
      (async () => {
        try {
          const r = await axiosInstance.get('/user/me');
          const u = r.data?.data ?? null;
          if (u) {
            queryClient.setQueryData(['user', 'me'], u);
            navigate('/app');
            return;
          }
        } catch (e) {
          console.error('Failed to fetch /user/me after login', e);
        }
        message.error('Failed to load user profile');
      })();
    },
    onError: (err: any) => {
      console.error(err);
      const msg = err?.response?.data?.message ?? 'Login failed';
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
        </Form>
      </Card>
    </div>
  );
}
