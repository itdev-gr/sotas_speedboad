import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blogSchema = z.object({
	title: z.string(),
	metaTitle: z.string().optional(),
	metaDescription: z.string(),
	excerpt: z.string().optional(),
	image: z.string().default('/images/IMG_6416.jpeg'),
	imageAlt: z.string().optional(),
	pubDate: z.coerce.date(),
	updatedDate: z.coerce.date().optional(),
	order: z.number().optional(),
	category: z.string().optional(),
});

const blog = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
	schema: blogSchema,
});

const blogI18n = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/blog-i18n' }),
	schema: blogSchema.extend({
		locale: z.enum(['de', 'fr', 'it', 'ru', 'el']),
		sourceSlug: z.string(),
		sourceHash: z.string(),
		translatedAt: z.coerce.date().optional(),
	}),
});

export const collections = { blog, blogI18n };
