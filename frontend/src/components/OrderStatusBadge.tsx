// frontend/src/components/OrderStatusBadge.tsx

import { OrderStatus, PaymentStatus } from '../types';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const statusConfig = {
    pending: { label: 'Pending', className: 'badge-warning' },
    processing: { label: 'Processing', className: 'badge-info' },
    shipped: { label: 'Shipped', className: 'badge-info' },
    delivered: { label: 'Delivered', className: 'badge-success' },
    cancelled: { label: 'Cancelled', className: 'badge-danger' },
  };

  const config = statusConfig[status];

  return (
    <span className={`badge ${config.className}`}>
      {config.label}
    </span>
  );
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const statusConfig = {
    pending: { label: 'Pending', className: 'badge-warning' },
    completed: { label: 'Paid', className: 'badge-success' },
    failed: { label: 'Failed', className: 'badge-danger' },
  };

  const config = statusConfig[status];

  return (
    <span className={`badge ${config.className}`}>
      {config.label}
    </span>
  );
}