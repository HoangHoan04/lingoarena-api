import { ContentTaxonomyEntity, TaxonomyEntity } from '~/entities';
import { CustomRepository } from '~/typeorm';
import { PrimaryRepo } from './primary.repo';

@CustomRepository(TaxonomyEntity)
export class TaxonomyRepo extends PrimaryRepo<TaxonomyEntity> {}

@CustomRepository(ContentTaxonomyEntity)
export class ContentTaxonomyRepo extends PrimaryRepo<ContentTaxonomyEntity> {}
