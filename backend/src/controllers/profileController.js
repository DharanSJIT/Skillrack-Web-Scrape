import { fetchData } from '../services/scraperService.js';

export const fetchProfile = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    if (!url.includes('skillrack.com') || !url.includes('profile')) {
      return res.status(400).json({ error: 'Invalid SkillRack profile URL' });
    }

    const data = await fetchData(url);

    if (!data) {
      return res.status(500).json({ error: 'Failed to fetch profile data' });
    }

    // Response Data is now built securely directly from the scraper returns, 
    // without needing to mutate from the spread operator (already done in service).
    res.json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
