import { Injectable } from '@nestjs/common';
import { CREATE_SUCCESS, UPDATE_SUCCESS } from '~/common/constants';
import { DefTransaction } from '~/common/core/decorator';
import { NSConfig } from '~/common/enums';
import { PaginationDto, UserDto } from '~/dto';
import { UserRepo } from '~/repositories';
import { I18nCustomService } from '../i18n-custom-module/i18n.service';
import { SubscribeDTO } from './dto/subscribe.dto';

export interface INotifyCreate {
  lstCustomerId?: string[];
  lstUserId?: string[];
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  callbackUrl?: string;
  category: string;
  colorType?: string;
}

export interface INotifyCreateAdmin {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  callbackUrl?: string;
  category: string;
  colorType?: string;
  notifyPermissionType: string;
}

@Injectable()
export class NotifyService {
  constructor(
    private userRepo: UserRepo,
    private readonly i18n: I18nCustomService,
  ) {}

  /** Thêm mới dữ liệu */
  @DefTransaction()
  async createNotifyWeb(data: INotifyCreate): Promise<any> {
    return { message: CREATE_SUCCESS };
  }

  @DefTransaction()
  async createNotifyMobile(data: INotifyCreate): Promise<any> {
    return { message: CREATE_SUCCESS };
  }

  /** Gửi thông báo tới admin */
  @DefTransaction()
  async createNotifyAdmin(data: INotifyCreateAdmin): Promise<any> {
    return { message: CREATE_SUCCESS };
  }

  @DefTransaction()
  async subscribeFcmToken(user: UserDto, body: SubscribeDTO) {}

  /** Đánh dấu tất cả là đã đọc ( web user) */
  async updateSeenAll(user: UserDto) {
    return {
      message: UPDATE_SUCCESS,
      status_code: NSConfig.EApiStatusCode.SUCCESS,
    };
  }

  /** Đánh dấu tất cả là đã đọc ( web học viện) */
  async updateSeenAllWebAcademy(user: UserDto) {
    return {
      message: UPDATE_SUCCESS,
      status_code: NSConfig.EApiStatusCode.SUCCESS,
    };
  }

  /** Đánh dấu thông báo là đã đọc */
  async updateSeenListNotify(user: UserDto, data: { lstId: string[] }) {
    return {
      message: UPDATE_SUCCESS,
      status_code: NSConfig.EApiStatusCode.SUCCESS,
    };
  }

  /** Lấy số thông báo chưa đọc của user */
  async findCountNotiNotSeen(user: UserDto) {}

  /** Phân trang */
  async pagination(user: UserDto, { where, skip, take }: PaginationDto) {}

  /** Phân trang cho Academy (chỉ lấy CLASS category) */
  async paginationAcademy(user: UserDto, { where, skip, take }: PaginationDto) {}
}
