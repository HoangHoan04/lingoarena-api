import slugify from 'slugify';

export function generateSlugify(text: string): string {
  const slug = slugify(text || '', {
    lower: true,
    locale: 'vi',
    strict: true,
  });

  if (slug.length > 240) {
    return slug.slice(0, 240);
  }

  return slug;
}
