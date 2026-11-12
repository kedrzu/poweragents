import path from 'node:path';

// Serves the app's static build (`nuxt generate`) the way a static host does: a file when one
// exists, else the SPA's `200.html`, so a deep link opens the app at that route.
const root = path.resolve(import.meta.dirname, '../../app/.output/public');

Bun.serve({
    port: Number(process.env.PORT),
    async fetch(request) {
        const file = Bun.file(path.join(root, new URL(request.url).pathname));
        if (await file.exists()) {
            return new Response(file);
        }

        return new Response(Bun.file(path.join(root, '200.html')), { headers: { 'content-type': 'text/html' } });
    },
});
