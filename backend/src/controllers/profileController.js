import { fetchData } from "../services/scraperService.js";

export const fetchProfile = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    if (!url.includes("skillrack.com") || !url.includes("profile")) {
      return res.status(400).json({ error: "Invalid SkillRack profile URL" });
    }

    const requestTimeoutMs = Number(process.env.SCRAPER_TIMEOUT_MS || 58000);
    const data = await Promise.race([
      fetchData(url),
      new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Scraper timed out. Please try again.")),
          requestTimeoutMs,
        );
      }),
    ]);

    if (!data) {
      return res.status(500).json({ error: "Failed to fetch profile data" });
    }

    // Response Data is now built securely directly from the scraper returns,
    // without needing to mutate from the spread operator (already done in service).
    res.json(data);
  } catch (error) {
    console.error("API Error:", error.message || error);
    const message = error.message || "Internal server error";
    const lower = message.toLowerCase();
    const isTimeout = lower.includes("timed out");
    const isBlocked =
      lower.includes("cloudflare") ||
      lower.includes("blocked automated access") ||
      lower.includes("retry after");

    const statusCode = isTimeout ? 504 : isBlocked ? 503 : 500;
    const code = isTimeout
      ? "SCRAPER_TIMEOUT"
      : isBlocked
        ? "UPSTREAM_BLOCKED"
        : "SCRAPER_ERROR";

    res.status(statusCode).json({ error: message, code });
  }
};
