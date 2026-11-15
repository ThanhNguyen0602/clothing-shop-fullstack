const ORDER_STATUS = {
  PENDING_PAYMENT: "Chờ thanh toán",
  PENDING_CONFIRMATION: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  PROCESSING: "Đang chuẩn bị",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  DELIVERY_FAILED: "Giao thất bại",
  REFUND_REQUESTED: "Yêu cầu hoàn tiền",
  REFUNDED: "Đã hoàn tiền"
};

const PAYMENT_STATUS = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thất bại",
  REFUNDED: "Đã hoàn tiền"
};

// Buoc tiep theo hop le cho Manager (khop orderWorkflowService o backend).
const NEXT_STATUS = {
  PENDING_CONFIRMATION: "CONFIRMED",
  CONFIRMED: "PROCESSING",
  PROCESSING: "SHIPPING",
  SHIPPING: "DELIVERED",
  DELIVERED: "COMPLETED"
};

// Khop rule huy don o backend: chua xu ly va chua thanh toan thanh cong.
const canCancel = (order) =>
  ["PENDING_PAYMENT", "PENDING_CONFIRMATION", "CONFIRMED"].includes(order.order_status) &&
  ["UNPAID", "FAILED"].includes(order.payment_status);

const ATTEMPT_STATUS = { PENDING: "Đang chờ", SUCCESS: "Thành công", FAILED: "Thất bại" };

const statusTone = (status) => {
  if (["COMPLETED", "PAID", "DELIVERED", "SUCCESS", "ACTIVE", "VISIBLE"].includes(status)) return "success";
  if (["CANCELLED", "FAILED", "DELIVERY_FAILED", "LOCKED", "DISABLED", "HIDDEN",
    "INACTIVE", "DISCONTINUED"].includes(status)) return "danger";
  if (["SHIPPING", "PROCESSING", "CONFIRMED"].includes(status)) return "info";

  return "warning";
};

export { ORDER_STATUS, PAYMENT_STATUS, ATTEMPT_STATUS, NEXT_STATUS, canCancel, statusTone };
