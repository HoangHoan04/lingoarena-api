import { Injectable, NotFoundException } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { enumData } from '~/common/enums/base.enum';
import { transformKeys } from '~/common/helpers';
import { PaginationDto, UserDto } from '~/dto';
import { OrderEntity, ProductEntity } from '~/entities';
import {
  ProductRepo,
  ProductPriceRepo,
  ProductEntitlementRepo,
  CouponRepo,
  OrderRepo,
  OrderItemRepo,
  PaymentTransactionRepo,
  PaymentWebhookEventRepo,
  SubscriptionRepo,
  UserEntitlementRepo,
  ReferralCodeRepo,
  ReferralEventRepo,
} from '~/repositories';
import { UnaccentILike } from '~/typeorm/custom-operator';
import { ActionLogService } from '../../action-log/action-log.service';
import { GamificationService } from '../../gamification/service';
import { I18nCustomService } from '../../i18n-custom-module/i18n.service';
import { CreateOrderDto, CreateProductDto, FilterCommerceDto, UpdateProductDto } from '../dto';

@Injectable()
export class CommerceService {
  constructor(
    private readonly productRepo: ProductRepo,
    private readonly productPriceRepo: ProductPriceRepo,
    private readonly productEntitlementRepo: ProductEntitlementRepo,
    private readonly couponRepo: CouponRepo,
    private readonly orderRepo: OrderRepo,
    private readonly orderItemRepo: OrderItemRepo,
    private readonly paymentTransactionRepo: PaymentTransactionRepo,
    private readonly paymentWebhookEventRepo: PaymentWebhookEventRepo,
    private readonly subscriptionRepo: SubscriptionRepo,
    private readonly userEntitlementRepo: UserEntitlementRepo,
    private readonly referralCodeRepo: ReferralCodeRepo,
    private readonly referralEventRepo: ReferralEventRepo,
    private readonly gamificationService: GamificationService,
    private readonly i18n: I18nCustomService,
    private readonly actionLogService: ActionLogService,
  ) {}

  private actorName(user: UserDto) {
    return user.fullName || user.name || user.username || user.email || 'Admin';
  }

  private async writeLog(
    user: UserDto,
    actionType: string,
    entityType: string,
    entityId: string,
    description: string,
    dataAfter: Record<string, unknown> = {},
  ) {
    await this.actionLogService.create({
      entityId,
      entityType,
      actionType,
      createdBy: user.id,
      actorCode: user.username || user.email || user.id,
      actorName: this.actorName(user),
      description,
      dataBefore: '{}',
      dataAfter: JSON.stringify(dataAfter),
    });
  }

  private orderNumber() {
    return `LA${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }

  private expiresAt(durationDays?: number) {
    if (!durationDays) return undefined;
    const date = new Date();
    date.setDate(date.getDate() + durationDays);
    return date;
  }

  async paginationProducts(body: PaginationDto<FilterCommerceDto>, userOnly = false) {
    const { skip = 0, take = 20, where = {} as FilterCommerceDto } = body;
    const whereCon: FindOptionsWhere<ProductEntity> = {
      isDeleted: false,
      ...(userOnly ? { status: 'active' } : {}),
    };
    if (where.status && !userOnly) whereCon.status = where.status;
    if (where.keyword) whereCon.name = UnaccentILike(`%${where.keyword}%`);
    const [data, total] = await this.productRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { createdAt: 'DESC' },
      relations: { prices: true, entitlements: true },
    });
    return { data: transformKeys(data), total };
  }

  async findProduct(id: string) {
    const item = await this.productRepo.findOne({
      where: { id, isDeleted: false },
      relations: { prices: true, entitlements: true },
    });
    if (!item) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.product'));
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(item) };
  }

  async createProduct(dto: CreateProductDto, user: UserDto) {
    const product = await this.productRepo.save(
      this.productRepo.create({
        id: uuidv4(),
        code: dto.code.trim(),
        name: dto.name.trim(),
        productType: dto.productType,
        description: dto.description,
        thumbnailUrl: dto.thumbnailUrl,
        status: dto.status || 'active',
        isRecurring: dto.isRecurring ?? false,
        createdBy: user.id,
      }),
    );
    await this.replaceProductChildren(product.id, dto, user.id);
    await this.writeLog(user, enumData.ACTION_LOG.CREATE.code, 'ProductEntity', product.id, `Tạo sản phẩm: ${product.name}`);
    return this.findProduct(product.id);
  }

  async updateProduct(id: string, dto: UpdateProductDto, user: UserDto) {
    const product = await this.productRepo.findOne({ where: { id, isDeleted: false } });
    if (!product) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.product'));
    Object.assign(product, {
      code: dto.code?.trim() ?? product.code,
      name: dto.name?.trim() ?? product.name,
      productType: dto.productType ?? product.productType,
      description: dto.description,
      thumbnailUrl: dto.thumbnailUrl,
      status: dto.status ?? product.status,
      isRecurring: dto.isRecurring ?? product.isRecurring,
      updatedBy: user.id,
    });
    await this.productRepo.save(product);
    await this.replaceProductChildren(id, dto, user.id);
    await this.writeLog(user, enumData.ACTION_LOG.UPDATE.code, 'ProductEntity', id, `Cập nhật sản phẩm: ${product.name}`);
    return this.findProduct(id);
  }

  async deactivateProduct(id: string, user: UserDto) {
    const product = await this.productRepo.findOne({ where: { id, isDeleted: false } });
    if (!product) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.product'));
    product.isDeleted = true;
    product.deletedAt = new Date();
    product.updatedBy = user.id;
    await this.productRepo.save(product);
    await this.writeLog(user, enumData.ACTION_LOG.DEACTIVATE.code, 'ProductEntity', id, `Ngưng sản phẩm: ${product.name}`);
    return { message: this.i18n.commonTranslate('remove_success'), data: { id } };
  }

  async activateProduct(id: string, user: UserDto) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.product'));
    product.isDeleted = false;
    product.deletedAt = null;
    product.updatedBy = user.id;
    await this.productRepo.save(product);
    await this.writeLog(user, enumData.ACTION_LOG.ACTIVATE.code, 'ProductEntity', id, `Kích hoạt sản phẩm: ${product.name}`);
    return this.findProduct(id);
  }

  private async replaceProductChildren(productId: string, dto: CreateProductDto, userId: string) {
    if (dto.prices) {
      await this.productPriceRepo.update({ productId }, { isDeleted: true, deletedAt: new Date(), updatedBy: userId });
      await this.productPriceRepo.save(
        dto.prices.map(price =>
          this.productPriceRepo.create({
            id: uuidv4(),
            productId,
            currency: price.currency || 'VND',
            amount: price.amount,
            originalAmount: price.originalAmount,
            billingPeriod: price.billingPeriod,
            billingInterval: price.billingInterval ?? 1,
            countryCode: price.countryCode || 'VN',
            startsAt: price.startsAt ? new Date(price.startsAt) : new Date(),
            endsAt: price.endsAt ? new Date(price.endsAt) : undefined,
            isActive: price.isActive ?? true,
            createdBy: userId,
          }),
        ),
      );
    }
    if (dto.entitlements) {
      await this.productEntitlementRepo.update({ productId }, { isDeleted: true, deletedAt: new Date(), updatedBy: userId });
      await this.productEntitlementRepo.save(
        dto.entitlements.map(entitlement =>
          this.productEntitlementRepo.create({
            id: uuidv4(),
            productId,
            resourceType: entitlement.resourceType,
            resourceId: entitlement.resourceId,
            accessLevel: entitlement.accessLevel || enumData.ACCESS_LEVEL.FULL.code,
            usageLimit: entitlement.usageLimit ?? 0,
            durationDays: entitlement.durationDays ?? 0,
            createdBy: userId,
          }),
        ),
      );
    }
  }

  async paginationOrders(body: PaginationDto<FilterCommerceDto>) {
    const { skip = 0, take = 20, where = {} as FilterCommerceDto } = body;
    const whereCon: FindOptionsWhere<OrderEntity> = { isDeleted: false };
    if (where.status) whereCon.status = where.status;
    if (where.keyword) whereCon.orderNumber = UnaccentILike(`%${where.keyword}%`);
    const [data, total] = await this.orderRepo.findAndCount({
      where: whereCon,
      skip,
      take: take || 20,
      order: { createdAt: 'DESC' },
      relations: { user: true, items: { product: true, price: true }, transactions: true },
    });
    return { data: transformKeys(data), total };
  }

  async findOrder(id: string, user?: UserDto) {
    const order = await this.orderRepo.findOne({
      where: { id, isDeleted: false, ...(user ? { userId: user.id } : {}) },
      relations: { user: true, items: { product: true, price: true }, transactions: true },
    });
    if (!order) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.order'));
    return { message: this.i18n.commonTranslate('find_success'), data: transformKeys(order) };
  }

  async createOrder(dto: CreateOrderDto, user: UserDto) {
    const product = await this.productRepo.findOne({
      where: { id: dto.productId, status: 'active', isDeleted: false },
      relations: { entitlements: true },
    });
    if (!product) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.product'));
    const price = await this.productPriceRepo.findOne({
      where: { id: dto.priceId, productId: dto.productId, isActive: true, isDeleted: false },
    });
    if (!price) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.product_price'));
    const amount = Number(price.amount || 0);
    const order = await this.orderRepo.save(
      this.orderRepo.create({
        id: uuidv4(),
        orderNumber: this.orderNumber(),
        userId: user.id,
        status: enumData.ORDER_STATUS.PENDING.code,
        currency: price.currency || 'VND',
        subtotalAmount: amount,
        discountAmount: 0,
        taxAmount: 0,
        totalAmount: amount,
        placedAt: new Date(),
        createdBy: user.id,
      }),
    );
    await this.orderItemRepo.save(
      this.orderItemRepo.create({
        id: uuidv4(),
        orderId: order.id,
        productId: product.id,
        priceId: price.id,
        productSnapshotJson: {
          code: product.code,
          name: product.name,
          productType: product.productType,
          price: { amount: price.amount, currency: price.currency },
        },
        quantity: 1,
        unitAmount: amount,
        discountAmount: 0,
        totalAmount: amount,
        createdBy: user.id,
      }),
    );
    return this.findOrder(order.id, user);
  }

  async paySandbox(orderId: string, user: UserDto) {
    const order = await this.orderRepo.findOne({
      where: { id: orderId, userId: user.id, isDeleted: false },
      relations: { items: { product: { entitlements: true } } },
    });
    if (!order) throw new NotFoundException(this.i18n.commonTranslate('entity_not_found.order'));
    if (order.status !== enumData.ORDER_STATUS.COMPLETED.code) {
      order.status = enumData.ORDER_STATUS.COMPLETED.code;
      order.paidAt = new Date();
      order.updatedBy = user.id;
      await this.orderRepo.save(order);
      await this.paymentTransactionRepo.save(
        this.paymentTransactionRepo.create({
          id: uuidv4(),
          orderId: order.id,
          provider: 'sandbox',
          providerTransactionId: `sandbox_${order.id}`,
          transactionType: 'payment',
          status: enumData.PAYMENT_STATUS.CAPTURED.code,
          amount: order.totalAmount,
          currency: order.currency,
          paymentMethodType: 'sandbox',
          providerPayload: { paidAt: order.paidAt },
          idempotencyKey: `sandbox_pay_${order.id}`,
          processedAt: order.paidAt,
          createdBy: user.id,
        }),
      );
      const entitlements = (order.items || []).flatMap(item => item.product?.entitlements || []);
      await this.userEntitlementRepo.save(
        entitlements
          .filter(item => !item.isDeleted)
          .map(item =>
            this.userEntitlementRepo.create({
              id: uuidv4(),
              userId: user.id,
              resourceType: item.resourceType,
              resourceId: item.resourceId,
              accessLevel: item.accessLevel,
              sourceType: enumData.ENTITLEMENT_SOURCE_TYPE.ORDER.code,
              sourceId: order.id,
              usageLimit: item.usageLimit ?? 0,
              usageCount: 0,
              startsAt: order.paidAt,
              expiresAt: this.expiresAt(item.durationDays),
              status: enumData.ENTITLEMENT_STATUS.ACTIVE.code,
              createdBy: user.id,
            }),
          ),
      );
      await this.gamificationService.awardPoints(user.id, 20, enumData.POINT_REASON.PURCHASE.code, 'order', order.id, 'Thanh toán sandbox');
    }
    return this.findOrder(order.id, user);
  }

  async getMyOrders(user: UserDto) {
    const data = await this.orderRepo.find({
      where: { userId: user.id, isDeleted: false },
      order: { createdAt: 'DESC' },
      relations: { items: { product: true, price: true }, transactions: true },
    });
    return { data: transformKeys(data) };
  }

  async getMyEntitlements(user: UserDto) {
    const data = await this.userEntitlementRepo.find({
      where: { userId: user.id, isDeleted: false },
      order: { createdAt: 'DESC' },
    });
    return { data: transformKeys(data) };
  }
}
