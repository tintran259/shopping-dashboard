import { OptionDisplayType, ProductStatus } from '@/types';

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  [ProductStatus.ACTIVE]: 'Đang bán',
  [ProductStatus.DRAFT]: 'Nháp',
  [ProductStatus.PREORDER]: 'Đặt trước',
  [ProductStatus.OUT_OF_STOCK]: 'Hết hàng',
  [ProductStatus.DISCONTINUED]: 'Ngừng bán',
};

export const OPTION_DISPLAY_LABEL: Record<OptionDisplayType, string> = {
  [OptionDisplayType.SWATCH]: 'Ô màu (swatch)',
  [OptionDisplayType.PILL]: 'Nút (pill)',
  [OptionDisplayType.DROPDOWN]: 'Danh sách xổ (dropdown)',
};
