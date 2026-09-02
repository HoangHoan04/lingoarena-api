export namespace NSConfig {
  export enum ETypeField {
    TEXT = 'TEXT',
    NUMBER = 'NUMBER',
    BOOLEAN = 'BOOLEAN',
    DATE = 'DATE',
    JSON = 'JSON',
  }
  export enum EStatus {
    INACTIVE = 'INACTIVE',
    ACTIVE = 'ACTIVE',
  }
  export enum EApiMethod {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
  }
  export enum EApiStatusCode {
    SUCCESS = 200,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500,
  }

  export enum EApiLDocumentLang {
    VNI = 'vni',
    EN = 'en',
  }

  export enum ETemplateZalo {
    ZNS_TEMPLATE_ID_SEND_OTP = '',
  }

  export enum EOTPSendMethod {
    ZALO = 'ZALO',
    EMAIL = 'EMAIL',
  }
}
