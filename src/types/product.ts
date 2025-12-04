export interface ProductData {
  id: string;
  name: string;
  originalPrice: string;
  discountPrice: string;
  hasCoupon: boolean;
  couponName: string;
  productLink: string;
  productImage: string | null;
  scheduledTime: Date | null;
  storeName: string;
  createdAt: Date;
}

export interface MessageHistoryItem extends ProductData {
  generatedMessage: string;
}
