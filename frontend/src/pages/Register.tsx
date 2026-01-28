/* eslint-disable @typescript-eslint/no-explicit-any */
// React import not required with the new JSX transform
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../lib/axios';

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export default function Register() {
  const navigate = useNavigate();

  const registerMutation = useMutation<any, Error, RegisterPayload>({
    mutationFn: async (payload) => axiosInstance.post('/auth/register', payload),
    onSuccess: () => {
      message.success('Registration successful — please log in');
      navigate('/login');
    },
    onError: (err) => {
      console.error(err);
      message.error('Registration failed');
    },
  });

  const onFinish = (values: any) => {
    const payload: RegisterPayload = {
      name: values.name,
      email: values.email,
      password: values.password,
    };
    registerMutation.mutate(payload);
  };

  const isSubmitting = registerMutation.status === 'pending';

  return (
    <div style={{ width: '100%' }}>
      <Card style={{ width: 480, position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
        <Typography.Title level={4}>Create an account</Typography.Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="Full name" rules={[{ required: true, message: 'Please enter your name' }]}>
            <Input placeholder="Hujaifa" />
          </Form.Item>

          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
            <Input placeholder="hujaifa@gmail.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter a strong password' }, { min: 8 }]}
            hasFeedback
          >
            <Input.Password placeholder="A strong password" />
          </Form.Item>

          <Form.Item
            name="confirm"
            label="Confirm Password"
            dependencies={["password"]}
            hasFeedback
            rules={[
              { required: true, message: 'Please confirm your password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isSubmitting} block>
              Create account
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
