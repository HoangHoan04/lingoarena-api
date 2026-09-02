import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '~/common/guards';
import { UploadFileService } from './upload-file.service';

@ApiBearerAuth()
@ApiTags('UploadFile')
@UseGuards(JwtAuthGuard)
@Controller('upload-file')
export class UploadFileController {
  constructor(private readonly service: UploadFileService) {}

  @ApiOperation({ summary: 'Upload single file - tự động phân loại' })
  @Post('upload-single')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(@UploadedFile() file: Express.Multer.File) {
    return await this.service.uploadSingle(file);
  }

  @ApiOperation({ summary: 'Upload multiple files - tự động phân loại' })
  @Post('upload-multi')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadMulti(@UploadedFiles() files: Array<Express.Multer.File>) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Danh sách file trống');
    }
    return await this.service.uploadMulti(files);
  }

  @ApiOperation({ summary: 'Upload ảnh' })
  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return await this.service.uploadImage(file);
  }

  @ApiOperation({ summary: 'Upload audio' })
  @Post('upload-audio')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    return await this.service.uploadAudio(file);
  }

  @ApiOperation({ summary: 'Upload document' })
  @Post('upload-document')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    return await this.service.uploadDocument(file);
  }

  @ApiOperation({
    summary: 'Upload file lên Catbox.moe (miễn phí, không giới hạn)',
  })
  @Post('upload-catbox')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCatbox(@UploadedFile() file: Express.Multer.File) {
    return await this.service.uploadCatbox(file);
  }

  @ApiOperation({ summary: 'Upload từ URL lên Catbox.moe' })
  @Post('upload-catbox-url')
  async uploadCatboxUrl(@Body('url') url: string) {
    return await this.service.uploadToCatboxFromUrl(url);
  }
}
