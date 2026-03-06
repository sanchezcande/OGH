import { put } from '@vercel/blob';
import prisma from '../../../src/lib/prisma';
import { verifyToken } from '../../../src/lib/auth';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4.5mb',
        },
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const decoded = verifyToken(req);
    if (!decoded) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const { title, summary, content, lang, slug, image } = req.body;

        if (!title || !content || !lang || !slug) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Note: In a real production scenario with large images, 
        // you might want to use client-side uploading to Vercel Blob 
        // to avoid Serverless Function execution limits.
        // For now, we'll assume the image is already a URL or we handle a small base64.
        // However, the prompt mentioned "form and upload", so let's handle the blob part.

        // If the image is a base64 string, we upload it to Vercel Blob here.
        let imageUrl = image;
        if (image && image.startsWith('data:')) {
            const buffer = Buffer.from(image.split(',')[1], 'base64');
            const filename = `blog/${slug}-${Date.now()}.png`;
            const blob = await put(filename, buffer, {
                access: 'public',
            });
            imageUrl = blob.url;
        }

        const article = await prisma.article.upsert({
            where: {
                slug_lang: {
                    slug,
                    lang,
                },
            },
            update: {
                title,
                summary,
                content,
                image: imageUrl,
                thumbnail: imageUrl,
            },
            create: {
                title,
                summary,
                content,
                slug,
                lang,
                image: imageUrl,
                thumbnail: imageUrl,
            },
        });

        return res.status(200).json(article);
    } catch (error) {
        console.error('Error creating article:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}
