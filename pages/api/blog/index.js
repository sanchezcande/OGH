import prisma from '../../../src/lib/prisma';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { lang = 'es', search = '' } = req.query;

    try {
        const articles = await prisma.article.findMany({
            where: {
                lang: lang,
                OR: [
                    { title: { contains: search } },
                    { summary: { contains: search } },
                ],
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return res.status(200).json(articles);
    } catch (error) {
        console.error('API Blog Index Error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
