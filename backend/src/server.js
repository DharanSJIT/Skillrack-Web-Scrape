import app from './app.js';
import { fetchData } from './services/scraperService.js';

const PORT = process.env.PORT || 3000;

// CLI support
async function main() {
  let url = process.argv[2];

  if (!url) {
    // Start the web server
    app.listen(PORT, () => {
      console.log(`SkillRack Profile Scraper server is running on http://localhost:${PORT}`);
      console.log(`Open your browser and go to http://localhost:${PORT} to use the web interface`);
    });
    return;
  }

  // Validate URL format
  if (!url.includes('skillrack.com') || !url.includes('profile')) {
    console.error('Error: Please provide a valid SkillRack profile URL');
    console.error('Example: https://www.skillrack.com/profile/... or https://www.skillrack.com/faces/resume.xhtml?id=...');
    process.exit(1);
  }

  await fetchData(url);
}

// Run the script
main().catch(console.error);
