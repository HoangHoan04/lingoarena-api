import { enumData } from '../common/enums/base.enum';
import { dataSource } from '../typeorm/typeorm.config';

async function ensureProduct() {
  const existing = await dataSource.query(`SELECT id FROM products WHERE code = $1 AND "isDeleted" = false LIMIT 1`, [
    'TEST-PACK-MINI',
  ]);
  if (existing[0]?.id) {
    await dataSource.query(
      `UPDATE products
       SET name = $2, "productType" = $3, description = $4, status = 'active', "isRecurring" = false
       WHERE id = $1`,
      [
        existing[0].id,
        'Test Pack Mini',
        enumData.PRODUCT_TYPE.TEST_PACKAGE.code,
        'Gói đề luyện mini dùng cho checkout sandbox.',
      ],
    );
    return existing[0].id as string;
  }
  const inserted = await dataSource.query(
    `INSERT INTO products (code, name, "productType", description, status, "isRecurring", "isDeleted", version, "createdAt")
     VALUES ($1, $2, $3, $4, 'active', false, false, 0, NOW()) RETURNING id`,
    [
      'TEST-PACK-MINI',
      'Test Pack Mini',
      enumData.PRODUCT_TYPE.TEST_PACKAGE.code,
      'Gói đề luyện mini dùng cho checkout sandbox.',
    ],
  );
  return inserted[0].id as string;
}

async function ensurePrice(productId: string) {
  const existing = await dataSource.query(
    `SELECT id FROM product_prices WHERE "productId" = $1 AND currency = 'VND' AND amount = 10000 AND "isDeleted" = false LIMIT 1`,
    [productId],
  );
  if (existing[0]?.id) {
    await dataSource.query(`UPDATE product_prices SET "isActive" = true WHERE id = $1`, [existing[0].id]);
    return existing[0].id as string;
  }
  const inserted = await dataSource.query(
    `INSERT INTO product_prices ("productId", currency, amount, "billingInterval", "countryCode", "startsAt", "isActive", "isDeleted", version, "createdAt")
     VALUES ($1, 'VND', 10000, 1, 'VN', NOW(), true, false, 0, NOW()) RETURNING id`,
    [productId],
  );
  return inserted[0].id as string;
}

async function ensureEntitlement(productId: string) {
  const assessment = await dataSource.query(`SELECT id FROM assessments WHERE slug = $1 AND "isDeleted" = false LIMIT 1`, [
    'toeic-mini-part5',
  ]);
  const resourceType = assessment[0]?.id
    ? enumData.ENTITLEMENT_RESOURCE_TYPE.ASSESSMENT.code
    : enumData.ENTITLEMENT_RESOURCE_TYPE.ALL_ACCESS.code;
  const resourceId = assessment[0]?.id || null;
  const existing = await dataSource.query(
    `SELECT id FROM product_entitlements WHERE "productId" = $1 AND "resourceType" = $2 AND COALESCE("resourceId"::text, '') = COALESCE($3::text, '') AND "isDeleted" = false LIMIT 1`,
    [productId, resourceType, resourceId],
  );
  if (existing[0]?.id) return existing[0].id as string;
  const inserted = await dataSource.query(
    `INSERT INTO product_entitlements ("productId", "resourceType", "resourceId", "accessLevel", "usageLimit", "durationDays", "isDeleted", version, "createdAt")
     VALUES ($1, $2, $3, $4, 0, 0, false, 0, NOW()) RETURNING id`,
    [productId, resourceType, resourceId, enumData.ACCESS_LEVEL.FULL.code],
  );
  return inserted[0].id as string;
}

export async function seedCommerce() {
  const productId = await ensureProduct();
  await ensurePrice(productId);
  await ensureEntitlement(productId);
}

async function run() {
  await dataSource.initialize();
  try {
    await seedCommerce();
    console.log('Commerce seed completed');
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  run().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
