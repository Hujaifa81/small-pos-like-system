/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMemo, useRef, useState, useEffect } from 'react';
import { axiosInstance } from '../../lib/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Row,
  Col,
  AutoComplete,
  Input,
  Button,
  Table,
  Typography,
  Card,
  Space,
  InputNumber,
  Modal,
  Select,
  message,
  Spin,
} from 'antd';
import type { InputRef } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';

type Product = {
  id: string;
  name: string;
  sku?: string;
  price: number | string;
  stockQuantity?: number;
};

type CartItem = {
  product: Product;
  quantity: number;
};

export default function SalesCreate() {
  const [term, setTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [payMethod, setPayMethod] = useState<'CASH' | 'CARD'>('CASH');
  const qClient = useQueryClient();
  const searchRef = useRef<InputRef | null>(null);

  const [debouncedTerm, setDebouncedTerm] = useState(term);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(term), 250);
    return () => clearTimeout(t);
  }, [term]);


  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | undefined>(undefined);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [totalPages, setTotalPages] = useState<number | undefined>(undefined);

  const { data: suggestions = [], isFetching: isSearching } = useQuery<Product[], Error>({
    queryKey: ['products', 'search', debouncedTerm],
    queryFn: async () => {
      if (!debouncedTerm || debouncedTerm.length < 1) return [] as Product[];
      const res = await axiosInstance.get('/product', {
        params: { search: debouncedTerm, page: 1, limit: 12 },
      });
      return (res.data?.data ?? []) as Product[];
    },
    enabled: debouncedTerm.length > 0,
  });

  const { data: browse = [], isFetching: isBrowsing } = useQuery<Product[], Error>({
    queryKey: ['products', 'browse', debouncedTerm, page, limit, sortBy, sortOrder, minPrice, maxPrice],
    queryFn: async () => {
      const params: any = { page, limit };
      if (debouncedTerm) params.search = debouncedTerm;
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;
      if (typeof minPrice === 'number') params.minPrice = minPrice;
      if (typeof maxPrice === 'number') params.maxPrice = maxPrice;
      const res = await axiosInstance.get('/product', { params });
        try {
          const meta = res.data?.meta;
          if (meta) {
            const pages = meta.pages ?? meta.totalPages ?? (typeof meta.total === 'number' ? Math.ceil(meta.total / limit) : undefined);
            setTotalPages(typeof pages === 'number' ? pages : undefined);
          } else {
            setTotalPages(undefined);
          }
        } catch (e) {
          setTotalPages(undefined);
        }
      return (res.data?.data ?? []) as Product[];
    },
    enabled: true,
  });

  const [productToAdd, setProductToAdd] = useState<Product | null>(null);
  const [qtyToAdd, setQtyToAdd] = useState<number>(1);

  const subtotal = useMemo(() => cart.reduce((s, it) => s + Number(it.product.price) * it.quantity, 0), [cart]);

  function addToCart(product: Product, qty = 1) {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.product.id === product.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: Math.min((copy[idx].quantity ?? 0) + qty, product.stockQuantity ?? 99999) };
        return copy;
      }
      return [...prev, { product, quantity: Math.min(qty, product.stockQuantity ?? qty) }];
    });
    setTerm('');
    searchRef.current?.focus();
  }

  function updateQty(productId: string, qty: number) {
    setCart((prev) => prev.map((it) => (it.product.id === productId ? { ...it, quantity: Math.max(1, qty) } : it)));
  }

  function removeItem(productId: string) {
    setCart((prev) => prev.filter((it) => it.product.id !== productId));
  }

  const saleMutation = useMutation({
    mutationFn: async (payload: { items: { productId: string; quantity: number }[] }) =>
      axiosInstance.post('/sales', payload),
    onMutate: async (vars: any) => {
      const salesPredicate = (q: any) => Array.isArray(q.queryKey) && (q.queryKey as any[])[0] === 'sales' && (q.queryKey as any[])[1] === 'mine';
      await qClient.cancelQueries({ predicate: salesPredicate });

      const previous = qClient.getQueriesData({ predicate: salesPredicate }) as Array<[any, any]>;

      const total = cart.reduce((s, it) => s + Number(it.product.price) * it.quantity, 0);
      const items = (vars.items || []).map((i: any) => ({ id: `temp-${Math.random().toString(36).slice(2)}`, productId: i.productId, quantity: i.quantity, price: Number(cart.find((c) => c.product.id === i.productId)?.product.price ?? 0) }));
      const optimisticSale = { id: `temp-${Date.now()}`, total, createdAt: new Date().toISOString(), items };

      // apply optimistic update to each matching query
      previous.forEach(([query]) => {
        try {
          qClient.setQueryData(query.queryKey, (old: any) => {
            if (!old) return old;
            const oldMeta = old.meta ?? {};
            const newMeta = { ...oldMeta, total: (oldMeta.total ?? 0) + 1 };
            return { data: [optimisticSale, ...(old.data ?? [])], meta: newMeta };
          });
        } catch (e) {
          // ignore per-query failures
        }
      });

      const snapshot = { cart };
      setCart([]);
      return { previous, snapshot };
    },
    onSuccess: () => {
      setCheckoutOpen(false);
      message.success('Sale created');
    },
    onError: (err: any, _vars, context: any) => {
      if (context?.snapshot?.cart) setCart(context.snapshot.cart);
      // rollback previous queries if present
      if (context?.previous) {
        (context.previous as Array<[any, any]>).forEach(([query, data]) => {
          try {
            qClient.setQueryData(query.queryKey, data);
          } catch (e) {
            // ignore
          }
        });
      }
      const msg = err?.response?.data?.message ?? 'Failed to create sale';
      message.error(msg);
    },
    onSettled: () => {
      qClient.invalidateQueries({ queryKey: ['sales'] });
      qClient.invalidateQueries({ queryKey: ['sales', 'mine'] });
      // Invalidate product queries so browse/search lists refresh with updated stock
      try {
        qClient.invalidateQueries({ predicate: (query) => Array.isArray(query.queryKey) && (query.queryKey as any[])[0] === 'products' });
      } catch (e) {
        // fallback: invalidate browse key explicitly
        qClient.invalidateQueries({ queryKey: ['products', 'browse'] });
      }
    },
  });

  const handleCheckout = async () => {
    if (cart.length === 0) return message.warning('Cart is empty');
    try {
      await saleMutation.mutateAsync({ items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })) });
    } catch (e) {
      // handled in onError
    }
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: ['product', 'name'],
      key: 'name',
      render: (_: any, record: CartItem) => (
        <div>
          <div style={{ fontWeight: 600 }}>{record.product.name}</div>
          <div style={{ color: '#666', fontSize: 12 }}>{record.product.sku}</div>
        </div>
      ),
    },
    {
      title: 'Price',
      dataIndex: ['product', 'price'],
      key: 'price',
      render: (p: any) => `$${Number(p).toFixed(2)}`,
    },
    {
      title: 'Qty',
      key: 'qty',
      render: (_: any, record: CartItem) => (
        <InputNumber min={1} max={record.product.stockQuantity ?? 99999} value={record.quantity} onChange={(v) => updateQty(record.product.id, Number(v) || 1)} />
      ),
    },
    {
      title: 'Total',
      key: 'total',
      render: (_: any, record: CartItem) => `$${(Number(record.product.price) * record.quantity).toFixed(2)}`,
    },
    {
      title: '',
      key: 'actions',
      render: (_: any, record: CartItem) => (
        <Button type="text" danger onClick={() => removeItem(record.product.id)}>
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 18 }}>
        <Col>
          <Typography.Title level={3} style={{ margin: 0 }}>
            <ShoppingCartOutlined style={{ marginRight: 8 }} /> Create Sale
          </Typography.Title>
          <Typography.Text type="secondary">Fast checkout for cashiers</Typography.Text>
        </Col>
        <Col>
          <Space>
            <Button
              type="primary"
              onClick={() => setCheckoutOpen(true)}
              disabled={cart.length === 0 || saleMutation.status === 'pending'}
              loading={saleMutation.status === 'pending'}
            >
              {saleMutation.status === 'pending' ? 'Processing...' : `Checkout ($${subtotal.toFixed(2)})`}
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={14}>
          <Card>
            <AutoComplete
              style={{ width: '100%' }}
              value={term}
              onSearch={(v) => setTerm(v)}
              options={suggestions.map((s) => ({ value: s.id, label: `${s.name} — $${Number(s.price).toFixed(2)} — ${s.stockQuantity ?? 0} in stock` }))}
              notFoundContent={term && !isSearching ? 'No results' : undefined}
              onSelect={(value) => {
                const found = suggestions.find((s) => s.id === value);
                if (found) addToCart(found);
              }}
              filterOption={false}
            >
              <Input ref={searchRef} placeholder="Search product name or SKU and press enter" onPressEnter={() => {
                if (suggestions[0]) addToCart(suggestions[0]);
              }} />
            </AutoComplete>
            {/* Filters / sorting / pagination controls */}
            <div style={{ marginTop: 12, marginBottom: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', overflowX: 'auto', paddingBottom: 6 }}>
                <InputNumber placeholder="Min" min={0} value={minPrice} onChange={(v) => { setMinPrice(v === undefined ? undefined : Number(v)); setPage(1); }} />
                <InputNumber placeholder="Max" min={0} value={maxPrice} onChange={(v) => { setMaxPrice(v === undefined ? undefined : Number(v)); setPage(1); }} />
                <Select placeholder="Sort by" style={{ width: 110 }} allowClear value={sortBy} onChange={(v) => { setSortBy(v); setPage(1); }} options={[{ value: 'name', label: 'Name' }, { value: 'price', label: 'Price' }, { value: 'stockQuantity', label: 'Stock' }]} />
                <Select placeholder="Order" style={{ width: 90 }} allowClear value={sortOrder} onChange={(v) => { setSortOrder(v as any); setPage(1); }} options={[{ value: 'asc', label: 'Asc' }, { value: 'desc', label: 'Desc' }]} />
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                  <Select
                    value={limit}
                    onChange={(v) => { setLimit(Number(v)); setPage(1); }}
                    options={[{ value: 6, label: '6' }, { value: 12, label: '12' }, { value: 24, label: '24' }]}
                    style={{ width: 90, minWidth: 70 }}
                  />
                </div>
              </div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                <Button
                  onClick={() => setPage((p) => {
                    if (typeof totalPages === 'number') return Math.min(totalPages, p + 1);
                    return p + 1;
                  })}
                  disabled={typeof totalPages === 'number' ? page >= totalPages : false}
                >
                  Next
                </Button>
              </div>
            </div>

        
            <div style={{ marginTop: 6 }}>
              {isBrowsing ? (
                <div style={{ textAlign: 'center', padding: 20 }}><Spin /></div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {browse.map((p) => (
                    <Card size="small" key={p.id} style={{ cursor: 'pointer' }} onClick={() => { setProductToAdd(p); setQtyToAdd(1); }}>
                      <div style={{ fontWeight: 600 }}>{p.name}</div>
                      <div style={{ color: '#666', fontSize: 12 }}>${Number(p.price).toFixed(2)} — {p.stockQuantity ?? 0} in stock</div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <Table
                rowKey={(r: CartItem) => r.product.id}
                dataSource={cart}
                columns={columns}
                pagination={false}
                locale={{ emptyText: 'Cart is empty' }}
              />
            </div>
          </Card>
        </Col>

        <Col span={10}>
          <Card title="Summary">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>Items</div>
              <div>{cart.length}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>Subtotal</div>
              <div style={{ fontWeight: 700 }}>${subtotal.toFixed(2)}</div>
            </div>
            <Button
              block
              type="primary"
              onClick={() => setCheckoutOpen(true)}
              disabled={cart.length === 0 || saleMutation.status === 'pending'}
              loading={saleMutation.status === 'pending'}
            >
              {saleMutation.status === 'pending' ? 'Processing...' : 'Checkout'}
            </Button>
          </Card>
        </Col>
      </Row>

      <Modal
        title={productToAdd ? `Add ${productToAdd.name}` : 'Add product'}
        open={!!productToAdd}
        onOk={() => {
          if (productToAdd) addToCart(productToAdd, qtyToAdd);
          setProductToAdd(null);
        }}
        onCancel={() => setProductToAdd(null)}
        okText="Add"
      >
        {productToAdd && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{productToAdd.name}</div>
              <div style={{ color: '#666', fontSize: 12 }}>${Number(productToAdd.price).toFixed(2)}</div>
            </div>
            <div>
              <InputNumber min={1} max={productToAdd.stockQuantity ?? 99999} value={qtyToAdd} onChange={(v) => setQtyToAdd(Number(v) || 1)} />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="Complete Sale"
        open={checkoutOpen}
        onOk={handleCheckout}
        onCancel={() => setCheckoutOpen(false)}
        okText="Confirm"
        cancelText="Cancel"
        confirmLoading={saleMutation.status === 'pending'}
        okButtonProps={{ disabled: saleMutation.status === 'pending' }}
      >
        <div style={{ marginBottom: 12 }}>
          <Typography.Text strong>Payment method</Typography.Text>
          <div style={{ marginTop: 8 }}>
            <Select value={payMethod} onChange={(v) => setPayMethod(v)} style={{ width: 200 }} options={[{ value: 'CASH', label: 'Cash' }, { value: 'CARD', label: 'Card' }]} />
          </div>
        </div>

        <div>
          <Typography.Text strong>Amount</Typography.Text>
          <div style={{ marginTop: 8, fontSize: 18, fontWeight: 700 }}>${subtotal.toFixed(2)}</div>
        </div>
      </Modal>
    </div>
  );
}
