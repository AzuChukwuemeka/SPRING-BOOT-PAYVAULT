const BASE = 'https://spring-boot-payvault.onrender.com/api';

export interface User {
  id: number;
  name: string;
  email: string;
  balance: number;
  createdAt: string;
}

export interface Transaction {
  id: number;
  senderId: number;
  receiverId: number;
  senderName: string;
  receiverName: string;
  amount: number;
  note: string | null;
  status: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.message || 'Request failed');
  return json.data;
}

export const api = {
  getUsers: () => request<User[]>('/users'),
  getUser: (id: number) => request<User>(`/users/${id}`),
  createUser: (body: { name: string; email: string; initialBalance: number }) =>
    request<User>('/users', { method: 'POST', body: JSON.stringify(body) }),

  getTransactions: () => request<Transaction[]>('/payments/transactions'),
  getUserTransactions: (id: number) => request<Transaction[]>(`/users/${id}/transactions`),
  sendPayment: (body: { senderId: number; receiverId: number; amount: number; note?: string }) =>
    request<Transaction>('/payments/send', { method: 'POST', body: JSON.stringify(body) }),
};
