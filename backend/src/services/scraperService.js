import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import * as cheerio from "cheerio";

const puppeteer = puppeteerCore;

const profileSelectors = [
  "div.ui.four.wide.center.aligned.column",
  "div.four.wide.center.aligned.column",
  "div.ui.four.wide.column",
  "div[class*='four wide'][class*='aligned']",
];

function normalizeSkillrackUrl(inputUrl) {
  const parsed = new URL(inputUrl);
  if (
    parsed.hostname.endsWith("skillrack.com") &&
    parsed.protocol === "http:"
  ) {
    parsed.protocol = "https:";
  }
  return parsed.toString();
}

function buildProfileFromHtml(html, url, id) {
  const $ = cheerio.load(html);

  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const titleText = $("title").text().trim();

  const isCloudflareChallenge =
    /cloudflare|attention required|verify you are human|checking your browser/i.test(
      `${titleText} ${bodyText}`,
    );

  const isSkillrackRateLimitBlock =
    /blocked automated access|retry after\s*1\s*-\s*2\s*minutes|retry after\s*\d+\s*minutes/i.test(
      bodyText,
    );

  if (isCloudflareChallenge) {
    throw new Error(
      "Skillrack blocked automated access (Cloudflare challenge). Exact counts are unavailable right now.",
    );
  }

  if (isSkillrackRateLimitBlock) {
    throw new Error(
      "Skillrack blocked automated access for this IP/session. This can last longer than 1-2 minutes. Try again later or from a different network.",
    );
  }

  const getTextByLabel = (labelPattern) => {
    const regex = new RegExp(
      `(?:${labelPattern})\\s*[:\\-]?\\s*([^:|]{2,120})`,
      "i",
    );
    const match = bodyText.match(regex);
    return match ? match[1].trim() : "";
  };

  const getNumberByLabel = (labelPattern) => {
    const regex = new RegExp(`(?:${labelPattern})\\s*[:\\-]?\\s*(\\d+)`, "i");
    const match = bodyText.match(regex);
    return match ? parseInt(match[1], 10) : 0;
  };

  let rawText = [];
  for (const selector of profileSelectors) {
    const candidate = $(selector)
      .first()
      .text()
      .trim()
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);

    if (candidate.length > rawText.length) {
      rawText = candidate;
    }
  }

  const hasProfileHints =
    rawText.length > 0 ||
    /roll|department|college|programs solved|code track|code test|skillrack/i.test(
      bodyText,
    );

  if (!hasProfileHints) {
    return null;
  }

  const titleName = titleText.includes("-")
    ? titleText.split("-")[0].trim()
    : titleText;

  const name =
    rawText[0] ||
    getTextByLabel("name") ||
    (titleName && !/skillrack/i.test(titleName) ? titleName : "") ||
    "Not found";
  const rollNumber =
    rawText[2] || getTextByLabel("roll\\s*number") || "Not found";
  const dept = rawText[4] || getTextByLabel("department|dept") || "Not found";
  const college =
    rawText[6] || getTextByLabel("college|institution") || "Not found";
  const yearInfo =
    rawText[8] ||
    getTextByLabel("year(?:\\s*of\\s*study)?|batch") ||
    "Not found";
  const yearMatch = yearInfo.match(/\d{4}$/);
  const year = yearMatch ? yearMatch[0] : "Not found";

  const codeTutorFromDom =
    parseInt($('div:contains("DT")').next().find(".value").text().trim(), 10) ||
    0;
  const codeTrackFromDom =
    parseInt(
      $('div:contains("CODE TEST")').next().find(".value").text().trim(),
      10,
    ) || 0;
  const codeTestFromDom =
    parseInt(
      $('div:contains("PROGRAMS SOLVED")').next().find(".value").text().trim(),
      10,
    ) || 0;
  const dtFromDom =
    parseInt($('div:contains("DC")').next().find(".value").text().trim(), 10) ||
    0;
  const dcFromDom =
    parseInt(
      $('div:contains("CODE TRACK")').next().find(".value").text().trim(),
      10,
    ) || 0;

  const codeTutor =
    codeTutorFromDom || getNumberByLabel("\\bDT\\b|daily\\s*test");
  const codeTrack =
    codeTrackFromDom || getNumberByLabel("code\\s*test|tests?\\s*completed");
  const codeTest =
    codeTestFromDom || getNumberByLabel("programs?\\s*solved|code\\s*tutor");
  const dt = dtFromDom || getNumberByLabel("\\bDC\\b|daily\\s*challenge");
  const dc = dcFromDom || getNumberByLabel("code\\s*track");

  const points = codeTrack * 2 + codeTest * 30 + dt * 20 + dc * 2;
  const totalSolved = dt + codeTutor + dc + codeTrack + codeTest;

  const looksInvalidProfile =
    /not found/i.test(name) &&
    /not found/i.test(rollNumber) &&
    /not found/i.test(dept) &&
    /not found/i.test(college) &&
    codeTutor === 0 &&
    codeTrack === 0 &&
    codeTest === 0 &&
    dt === 0 &&
    dc === 0;

  if (looksInvalidProfile) {
    throw new Error(
      "Could not extract exact counts from Skillrack profile page. Try again in a minute.",
    );
  }

  const date = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: true,
  });
  const lastFetched = date.split(",")[1]?.trim() || date;

  return {
    id,
    name,
    dept,
    year,
    college,
    codeTutor,
    codeTrack,
    codeTest,
    dt,
    dc,
    points,
    totalSolved,
    lastFetched,
    url,
    yearInfo,
    rollNumber,
  };
}

async function fetchHtmlDirect(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.skillrack.com/",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Direct fetch failed with status ${response.status}`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchData(url) {
  let browser = null;
  try {
    console.log("Fetching data from URL:", url);
    const normalizedUrl = normalizeSkillrackUrl(url);

    // Extract the resume id from the URL
    const urlObj = new URL(normalizedUrl);
    const pathParts = urlObj.pathname.split("/");
    const id = pathParts[2]; // ID is the third part in /profile/ID/...
    console.log("Extracted ID:", id);

    // Fast path for serverless: try plain HTTP first to avoid expensive browser startup.
    try {
      console.log("Attempting direct HTML fetch...");
      const html = await fetchHtmlDirect(normalizedUrl);
      const fastResult = buildProfileFromHtml(html, normalizedUrl, id);
      if (fastResult) {
        console.log("Direct fetch parse succeeded.");
        return fastResult;
      }
      console.log(
        "Direct fetch parse did not find required fields. Falling back to browser.",
      );
    } catch (directError) {
      console.log("Direct fetch path failed:", directError.message);
    }

    // Determine if we are running locally or on Vercel
    const isLocal = !process.env.VERCEL_ENV && !process.env.VERCEL;

    console.log("Launching browser. isLocal:", isLocal);

    // For local macOS dev, point to the system Chrome
    // For Vercel, use sparticuz to download and locate the lambda-optimized Chromium
    const executablePath = isLocal
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : await chromium.executablePath();

    browser = await puppeteer.launch({
      args: isLocal ? [] : chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: isLocal ? true : chromium.headless,
      timeout: 10000,
    });

    const page = await browser.newPage();

    // Disguise as a real user
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
    );
    await page.setExtraHTTPHeaders({
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://www.skillrack.com/",
    });

    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const blockedTypes = new Set(["image", "font", "media", "stylesheet"]);
      const isMainNavigation =
        request.isNavigationRequest() && request.frame() === page.mainFrame();

      if (isMainNavigation) {
        request.continue();
        return;
      }

      if (blockedTypes.has(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Use DOM load instead of network idle to avoid hanging on persistent connections.
    console.log("Navigating to skillrack...");
    try {
      await page.goto(normalizedUrl, {
        waitUntil: "domcontentloaded",
        timeout: 12000,
      });
    } catch (navigationError) {
      if (
        String(navigationError.message || "").includes("ERR_BLOCKED_BY_CLIENT")
      ) {
        console.log(
          "Navigation was blocked by interception, retrying without interception...",
        );
        await page.setRequestInterception(false);
        await page.goto(normalizedUrl, {
          waitUntil: "domcontentloaded",
          timeout: 12000,
        });
      } else {
        throw navigationError;
      }
    }
    try {
      await page.waitForFunction(
        (selectors) =>
          selectors.some((selector) => document.querySelector(selector)),
        { timeout: 5000 },
        profileSelectors,
      );
    } catch {
      // Continue and attempt to parse full page HTML with fallback selectors.
      console.log(
        "Profile container selector not found quickly; parsing page anyway.",
      );
    }

    const data = await page.content();
    const browserResult = buildProfileFromHtml(data, normalizedUrl, id);

    if (!browserResult) {
      throw new Error("Unable to parse profile from Skillrack page.");
    }

    return browserResult;
  } catch (error) {
    console.error(`Error fetching data: ${error.message}`);
    console.error(`Status code: ${error.response?.status}`);
    console.error(`Network error: ${url}`);
    throw new Error(`Scraper failed: ${error.message}`);
  } finally {
    if (browser !== null) {
      await browser.close();
      console.log("Browser closed cleanly.");
    }
  }
}
