import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
	schema: z.object({
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
	}),
});

export const collections = { blog };
