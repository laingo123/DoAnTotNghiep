const EXCHANGE_RATE = 25000;

const vndFormatter = new Intl.NumberFormat('vi-VN');

export const formatVNDFromUSD = (amountUsd: number) => {
  const amountVnd = Math.round(amountUsd * EXCHANGE_RATE);
  return `${vndFormatter.format(amountVnd)}đ`;
};

export const formatVND = (amountVnd: number) => `${vndFormatter.format(Math.round(amountVnd))}đ`;

export const usdToVnd = (amountUsd: number) => Math.round(amountUsd * EXCHANGE_RATE);