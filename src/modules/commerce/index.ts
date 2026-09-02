import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ChildModule } from '~/common/core/decorator';
import { ProductRepo, ProductPriceRepo, ProductEntitlementRepo, CouponRepo, OrderRepo, OrderItemRepo, PaymentTransactionRepo, PaymentWebhookEventRepo, SubscriptionRepo, UserEntitlementRepo, ReferralCodeRepo, ReferralEventRepo, CouponRedemptionRepo, InvoiceRepo, OrganizationSubscriptionRepo } from '~/repositories';
import { TypeOrmExModule } from '~/typeorm';
import { ActionLogModule } from '../action-log';
import { GamificationModule } from '../gamification';
import { CommerceService } from './service';

@ChildModule({
  providers: [CommerceService],
  controllers: [],
  imports: [
    TypeOrmExModule.forCustomRepository([ProductRepo, ProductPriceRepo, ProductEntitlementRepo, CouponRepo, OrderRepo, OrderItemRepo, PaymentTransactionRepo, PaymentWebhookEventRepo, SubscriptionRepo, UserEntitlementRepo, ReferralCodeRepo, ReferralEventRepo, CouponRedemptionRepo, InvoiceRepo, OrganizationSubscriptionRepo]),
    ActionLogModule,
    GamificationModule,
  ],
  exports: [CommerceService],
})
export class CommerceModule implements NestModule {
  configure(_consumer: MiddlewareConsumer) {}
}
