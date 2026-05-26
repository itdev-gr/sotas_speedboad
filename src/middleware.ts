import { defineMiddleware } from 'astro:middleware';
import { verifySession } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
	const pathname = context.url.pathname;
	if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
		const session = await verifySession(context.request);
		if (!session) {
			return context.redirect('/login');
		}
		context.locals.session = session;
	}
	return next();
});
