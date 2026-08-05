import { createHash } from 'node:crypto';
import { getCollection, type CollectionEntry } from 'astro:content';
import {
	DEFAULT_LOCALE,
	LOCALES,
	SITE_URL,
	localizePath,
	type Locale,
} from '../i18n/config';

export type BlogEntry = CollectionEntry<'blog'> | CollectionEntry<'blogI18n'>;
export type EnglishBlogEntry = CollectionEntry<'blog'>;
export type TranslatedBlogEntry = CollectionEntry<'blogI18n'>;

/** Internal site paths that appear in blog markdown links. */
export const BLOG_INTERNAL_PATHS = [
	'/',
	'/contact',
	'/faq',
	'/tours',
	'/license-free-rent',
	'/rent-with-skipper',
	'/private-yachting',
	'/special-celebrations',
	'/recommended-routes',
	'/navagio-shipwreck-boat-tour',
	'/blue-caves-boat-tour',
	'/keri-caves-turtle-island-boat-tour',
	'/sunset-boat-tour',
	'/blog',
] as const;

export function hashBlogSource(raw: string): string {
	return createHash('sha256').update(raw).digest('hex');
}

export function localizeBlogLinks(markdown: string, locale: Locale): string {
	let out = markdown;
	for (const path of BLOG_INTERNAL_PATHS) {
		const localized = localizePath(path, locale);
		out = out.replaceAll(`](${path})`, `](${localized})`);
		out = out.replaceAll(`](${path}/)`, `](${localized})`);
	}
	if (locale !== DEFAULT_LOCALE) {
		out = out.replaceAll('](/blog/', `](/${locale}/blog/`);
	}
	return out;
}

export function getBlogSlug(post: BlogEntry): string {
	return post.collection === 'blog' ? post.id : post.data.sourceSlug;
}

export async function getEnglishBlogPosts(): Promise<EnglishBlogEntry[]> {
	return (await getCollection('blog')).sort(compareBlogPosts);
}

export async function getTranslatedBlogPosts(locale: Locale): Promise<TranslatedBlogEntry[]> {
	if (locale === DEFAULT_LOCALE) return [];
	return (await getCollection('blogI18n'))
		.filter((post) => post.data.locale === locale)
		.sort(compareBlogPosts);
}

export async function getBlogPostsForLocale(locale: Locale): Promise<BlogEntry[]> {
	if (locale === DEFAULT_LOCALE) return getEnglishBlogPosts();

	const english = await getEnglishBlogPosts();
	const translated = await getTranslatedBlogPosts(locale);
	const translatedSlugs = new Set(translated.map((post) => post.data.sourceSlug));

	// Show every English post on localized indexes; untranslated slugs use EN content
	// until auto-translation generates blog-i18n files.
	const fallbacks = english.filter((post) => !translatedSlugs.has(post.id));
	return [...translated, ...fallbacks].sort(compareBlogPosts);
}

/** Whether a locale has a dedicated blog-i18n file for this slug. */
export async function hasBlogTranslation(slug: string, locale: Locale): Promise<boolean> {
	if (locale === DEFAULT_LOCALE) return true;
	const translated = await getCollection('blogI18n');
	return translated.some((post) => post.data.sourceSlug === slug && post.data.locale === locale);
}

export async function getBlogPostForLocale(
	slug: string,
	locale: Locale,
): Promise<{ post: BlogEntry; isFallback: boolean } | null> {
	if (locale === DEFAULT_LOCALE) {
		const english = await getCollection('blog');
		const post = english.find((entry) => entry.id === slug);
		return post ? { post, isFallback: false } : null;
	}

	const translated = await getCollection('blogI18n');
	const localized = translated.find(
		(entry) => entry.data.sourceSlug === slug && entry.data.locale === locale,
	);
	if (localized) return { post: localized, isFallback: false };

	const english = await getCollection('blog');
	const fallback = english.find((entry) => entry.id === slug);
	return fallback ? { post: fallback, isFallback: true } : null;
}

export async function getAvailableBlogLocales(slug: string): Promise<Locale[]> {
	const locales: Locale[] = [DEFAULT_LOCALE];
	const translated = await getCollection('blogI18n');
	for (const post of translated) {
		if (post.data.sourceSlug === slug && !locales.includes(post.data.locale)) {
			locales.push(post.data.locale);
		}
	}
	return LOCALES.filter((locale) => locales.includes(locale));
}

export function compareBlogPosts(a: BlogEntry, b: BlogEntry): number {
	const diff = b.data.pubDate.getTime() - a.data.pubDate.getTime();
	if (diff !== 0) return diff;
	return (a.data.order ?? 999) - (b.data.order ?? 999);
}

export function getDateLocale(locale: Locale): string {
	const map: Record<Locale, string> = {
		en: 'en-GB',
		de: 'de-DE',
		fr: 'fr-FR',
		it: 'it-IT',
		ru: 'ru-RU',
		el: 'el-GR',
	};
	return map[locale];
}

function schemaText(markdown: string): string {
	return markdown
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/<[^>]+>/g, ' ')
		.replace(/[*_`>#]/g, '')
		.replace(/^\s*[-+]\s+/gm, '')
		.replace(/\s+/g, ' ')
		.trim();
}

function extractFaqs(body: string): Array<{ q: string; a: string }> {
	const inlineFaqs = Array.from(
		body.matchAll(/\*\*([^*]+?[?;])\*\*\s*([^\n]+(?:\n(?!\n)[^\n]+)*)/g),
	).map((match) => ({ q: schemaText(match[1]), a: schemaText(match[2]) }));

	const headingFaqs = Array.from(
		body.matchAll(/^###\s+(.+?[?;])\s*\r?\n+([\s\S]*?)(?=^#{2,3}\s+|(?![\s\S]))/gm),
	).map((match) => ({ q: schemaText(match[1]), a: schemaText(match[2]) }));

	const unique = new Map<string, { q: string; a: string }>();
	for (const faq of [...inlineFaqs, ...headingFaqs]) {
		if (faq.q && faq.a) unique.set(faq.q.toLocaleLowerCase(), faq);
	}
	return Array.from(unique.values());
}

export function buildBlogPostMeta(post: BlogEntry, lang: Locale) {
	const s = blogStringsForMeta(lang);
	const p = (path: string) => localizePath(path, lang);
	const slug = getBlogSlug(post);
	const basePath = `/blog/${slug}`;
	const body = post.body ?? '';
	const wordCount = body.split(/\s+/).filter(Boolean).length;
	const readingMinutes = Math.max(1, Math.round(wordCount / 200));
	const faqs = extractFaqs(body);
	const canonical = `${SITE_URL}${p(basePath)}`;
	const heroImage = post.data.image;
	const published = post.data.pubDate.toISOString();
	const updated = (post.data.updatedDate ?? post.data.pubDate).toISOString();

	const articleSchema = {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: post.data.title,
		alternativeHeadline: post.data.metaTitle ?? post.data.title,
		description: post.data.metaDescription,
		image: [`${SITE_URL}${heroImage}`],
		datePublished: published,
		dateModified: updated,
		wordCount,
		timeRequired: `PT${readingMinutes}M`,
		inLanguage: lang,
		articleSection: post.data.category ?? 'Boat Rental Guides',
		keywords: [
			post.data.metaTitle ?? post.data.title,
			post.data.category ?? 'Boat Rental Guides',
			'Zakynthos boat rental',
			'Zante boat hire',
		].join(', '),
		author: {
			'@type': 'Person',
			name: 'Ilias',
			jobTitle: 'Founder & Skipper',
			image: `${SITE_URL}/images/ilias-avatar.jpg`,
			worksFor: { '@type': 'Organization', name: 'Sota Travel Zakynthos', url: SITE_URL },
		},
		publisher: {
			'@type': 'Organization',
			name: 'Sota Travel Zakynthos',
			logo: {
				'@type': 'ImageObject',
				url: `${SITE_URL}/images/sota-travel-logo.svg`,
			},
		},
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': canonical,
		},
		speakable: {
			'@type': 'SpeakableSpecification',
			cssSelector: ['.post-hero-title', '.post-prose p:first-of-type'],
		},
	};

	const breadcrumbSchema = {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [
			{ '@type': 'ListItem', position: 1, name: s.home, item: `${SITE_URL}${p('/')}` },
			{ '@type': 'ListItem', position: 2, name: s.blog, item: `${SITE_URL}${p('/blog')}` },
			{ '@type': 'ListItem', position: 3, name: post.data.title, item: canonical },
		],
	};

	const faqSchema =
		faqs.length > 0
			? {
					'@context': 'https://schema.org',
					'@type': 'FAQPage',
					mainEntity: faqs.map((f) => ({
						'@type': 'Question',
						name: f.q,
						acceptedAnswer: { '@type': 'Answer', text: f.a },
					})),
				}
			: null;

	return {
		slug,
		basePath,
		canonical,
		heroImage,
		published,
		updated,
		readingMinutes,
		articleSchema,
		breadcrumbSchema,
		faqSchema,
	};
}

function blogStringsForMeta(lang: Locale) {
	const strings = {
		en: { home: 'Home', blog: 'Blog' },
		de: { home: 'Start', blog: 'Blog' },
		fr: { home: 'Accueil', blog: 'Blog' },
		it: { home: 'Home', blog: 'Blog' },
		ru: { home: 'Главная', blog: 'Блог' },
		el: { home: 'Αρχική', blog: 'Blog' },
	};
	return strings[lang] ?? strings.en;
}
