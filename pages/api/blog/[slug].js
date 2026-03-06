import prisma from '../../../src/lib/prisma';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { slug, lang = 'es' } = req.query;

    if (!slug) {
        return res.status(400).json({ message: 'Slug is required' });
    }

    try {
        const article = await prisma.article.findUnique({
            where: {
                slug_lang: {
                    slug: slug,
                    lang: lang,
                },
            },
        });

        if (!article) {
            return res.status(404).json({ message: 'Article not found' });
        }

        return res.status(200).json(article);
    } catch (error) {
        console.error('API Blog Slug Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
