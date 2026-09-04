import { Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { CurrentUser, DefController, DefGet, DefPost, DefPut } from '~/common/core/decorator';
import { JwtAuthGuard, PermissionGuard } from '~/common/guards';
import { ExcelImportBatchDto, PaginationDto, UserDto } from '~/dto';
import { CreateMediaAssetDto, FilterMediaAssetDto } from '../dto';
import { MediaService } from '../service/media.service';

@ApiBearerAuth()
@ApiTags('Admin - Media')
@UseGuards(JwtAuthGuard, PermissionGuard)
@DefController('media')
export class AdminMediaController {
  constructor(private readonly service: MediaService) {}

  @DefPost('assets/pagination')
  @ApiOperation({ summary: 'Phân trang media asset' })
  paginationAssets(@Body() body: PaginationDto<FilterMediaAssetDto>) {
    return this.service.paginationAssets(body);
  }

  @DefPost('assets')
  @ApiOperation({ summary: 'Đăng ký media asset sau upload' })
  createAsset(@Body() dto: CreateMediaAssetDto, @CurrentUser() user: UserDto) {
    return this.service.createAsset(dto, user);
  }

  @SkipThrottle()
  @DefPost('assets/import')
  @ApiOperation({ summary: 'Nhập Excel media asset' })
  importAssets(@Body() dto: ExcelImportBatchDto, @CurrentUser() user: UserDto) {
    return this.service.importAssets(dto, user);
  }

  @DefPost('assets/export-excel')
  @ApiOperation({ summary: 'Xuất Excel media asset' })
  exportAssets(@Body() body: PaginationDto<FilterMediaAssetDto>) {
    return this.service.exportAssets(body);
  }

  @DefGet('assets/:id')
  @ApiOperation({ summary: 'Chi tiết media asset' })
  findAsset(@Param('id') id: string) {
    return this.service.findAsset(id);
  }

  @DefPut('assets/deactivate/:id')
  @ApiOperation({ summary: 'Ngưng media asset' })
  deactivateAsset(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.deactivateAsset(id, user);
  }

  @DefPut('assets/activate/:id')
  @ApiOperation({ summary: 'Kích hoạt media asset' })
  activateAsset(@Param('id') id: string, @CurrentUser() user: UserDto) {
    return this.service.activateAsset(id, user);
  }
}
