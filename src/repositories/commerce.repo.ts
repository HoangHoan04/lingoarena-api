import {
  CouponEntity,
  CouponRedemptionEntity,
  InvoiceEntity,
  OrderEntity,
  OrderItemEntity,
  OrganizationSubscriptionEntity,
  PaymentTransactionEntity,
  PaymentWebhookEventEntity,
  ProductEntity,
  ProductEntitlementEntity,
  ProductPriceEntity,
  ReferralCodeEntity,
  ReferralEventEntity,
  SubscriptionEntity,
  UserEntitlementEntity,
} from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(ProductEntity)
export class ProductRepo extends PrimaryRepo<ProductEntity> {}

@CustomRepository(ProductPriceEntity)
export class ProductPriceRepo extends PrimaryRepo<ProductPriceEntity> {}

@CustomRepository(ProductEntitlementEntity)
export class ProductEntitlementRepo extends PrimaryRepo<ProductEntitlementEntity> {}

@CustomRepository(CouponEntity)
export class CouponRepo extends PrimaryRepo<CouponEntity> {}

@CustomRepository(OrderEntity)
export class OrderRepo extends PrimaryRepo<OrderEntity> {}

@CustomRepository(OrderItemEntity)
export class OrderItemRepo extends PrimaryRepo<OrderItemEntity> {}

@CustomRepository(PaymentTransactionEntity)
export class PaymentTransactionRepo extends PrimaryRepo<PaymentTransactionEntity> {}

@CustomRepository(PaymentWebhookEventEntity)
export class PaymentWebhookEventRepo extends PrimaryRepo<PaymentWebhookEventEntity> {}

@CustomRepository(SubscriptionEntity)
export class SubscriptionRepo extends PrimaryRepo<SubscriptionEntity> {}

@CustomRepository(UserEntitlementEntity)
export class UserEntitlementRepo extends PrimaryRepo<UserEntitlementEntity> {}

@CustomRepository(ReferralCodeEntity)
export class ReferralCodeRepo extends PrimaryRepo<ReferralCodeEntity> {}

@CustomRepository(ReferralEventEntity)
export class ReferralEventRepo extends PrimaryRepo<ReferralEventEntity> {}

@CustomRepository(CouponRedemptionEntity)
export class CouponRedemptionRepo extends PrimaryRepo<CouponRedemptionEntity> {}

@CustomRepository(InvoiceEntity)
export class InvoiceRepo extends PrimaryRepo<InvoiceEntity> {}

@CustomRepository(OrganizationSubscriptionEntity)
export class OrganizationSubscriptionRepo extends PrimaryRepo<OrganizationSubscriptionEntity> {}
