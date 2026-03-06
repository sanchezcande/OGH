require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding blog articles to MySQL...');

    const locales = ['en', 'es'];

    for (const lang of locales) {
        const filePath = path.join(__dirname, '..', 'src', 'locales', lang, 'translation.json');
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`);
            continue;
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const articles = data.articles || [];

        console.log(`Processing ${articles.length} articles for lang: ${lang}`);

        for (const article of articles) {
            await prisma.article.upsert({
                where: {
                    slug_lang: {
                        slug: article.slug,
                        lang: lang,
                    },
                },
                update: {
                    title: article.title,
                    summary: article.summary,
                    content: article.content,
                    image: article.image,
                    thumbnail: article.thumbnail,
                },
                create: {
                    slug: article.slug,
                    lang: lang,
                    title: article.title,
                    summary: article.summary,
                    content: article.content,
                    image: article.image,
                    thumbnail: article.thumbnail,
                },
            });
        }
    }

    console.log('Seeding completed successfully.');
}

main()
    .catch((e) => {
        console.error('Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
