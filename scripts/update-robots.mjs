import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: ['.env.local', '.env'] });

// Get the site URL from environment variable
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

if (!siteUrl) {
    console.warn('⚠️  NEXT_PUBLIC_SITE_URL is not set in environment variables');
    console.warn('⚠️  robots.txt will not be updated');
    process.exit(0);
}

try {
    // Read robots.txt
    const robotsPath = join(process.cwd(), 'public', 'robots.txt');
    let robotsContent = readFileSync(robotsPath, 'utf8');

    // Replace the placeholder with actual site URL
    robotsContent = robotsContent.replaceAll('{{SITE_URL}}', siteUrl);

    // The file is written in place, so a previous build already consumed the
    // placeholder — rewrite the absolute Sitemap line too.
    robotsContent = robotsContent.replace(
        /^Sitemap: \S+$/m,
        `Sitemap: ${siteUrl.replace(/\/$/, '')}/sitemap.xml`,
    );

    // Write back to robots.txt
    writeFileSync(robotsPath, robotsContent, 'utf8');

    console.log('✅ robots.txt updated successfully');
    console.log(`   Site URL: ${siteUrl}`);
} catch (error) {
    console.error('❌ Error updating robots.txt:', error.message);
    process.exit(1);
}
