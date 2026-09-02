const REGEX_PASSWORD: RegExp = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()\-+=_])[^\s]{8,20}$/;
const WHITESPACE_REGEX: RegExp = /^\S+$/;
export const REGEX_PATTERN = {
  REGEX_PASSWORD,
  WHITESPACE_REGEX,
};

export const REGEX_BASE64_IMAGE: RegExp =
  /<img[^>]+src="data:image\/([^;]+);base64,([^"]+)"[^>]*>/gi;
