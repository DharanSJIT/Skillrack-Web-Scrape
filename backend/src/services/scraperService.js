import { addExtra } from "puppeteer-extra";
import puppeteerCore from "puppeteer-core";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
// Force Vercel to trace and bundle these dependencies
import "puppeteer-extra-plugin-user-preferences";
import "puppeteer-extra-plugin-user-data-dir";

const puppeteer = addExtra(puppeteerCore);
puppeteer.use(StealthPlugin());
import chromium from "@sparticuz/chromium";
import * as cheerio from "cheerio";

function buildProfileFromHtml(html, url, id) {
  const $ = cheerio.load(html);

  const rawText = $("div.ui.four.wide.center.aligned.column")
    .text()
    .trim()
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!rawText.length) {
    return null;
  }

  const name = rawText[0] || "Not found";
  const rollNumber = rawText[2] || "Not found";
  const dept = rawText[4] || "Not found";
  const college = rawText[6] || "Not found";
  const yearInfo = rawText[8] || "Not found";
  const yearMatch = yearInfo.match(/\d{4}$/);
  const year = yearMatch ? yearMatch[0] : "Not found";

  const codeTutor =
    parseInt($('div:contains("DT")').next().find(".value").text().trim(), 10) ||
    0;
  const codeTrack =
    parseInt(
      $('div:contains("CODE TEST")').next().find(".value").text().trim(),
      10,
    ) || 0;
  const codeTest =
    parseInt(
      $('div:contains("PROGRAMS SOLVED")').next().find(".value").text().trim(),
      10,
    ) || 0;
  const dt =
    parseInt($('div:contains("DC")').next().find(".value").text().trim(), 10) ||
    0;
  const dc =
    parseInt(
      $('div:contains("CODE TRACK")').next().find(".value").text().trim(),
      10,
    ) || 0;

  const points = codeTrack * 2 + codeTest * 30 + dt * 20 + dc * 2;
  const totalSolved = dt + codeTutor + dc + codeTrack + codeTest;

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
  const timeout = setTimeout(() => controller.abort(), 10000);

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
    // Extract the resume id from the URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const id = pathParts[2]; // ID is the third part in /profile/ID/...
    console.log("Extracted ID:", id);

    // Fast path for serverless: try plain HTTP first to avoid expensive browser startup.
    try {
      console.log("Attempting direct HTML fetch...");
      const html = await fetchHtmlDirect(url);
      const fastResult = buildProfileFromHtml(html, url, id);
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
      timeout: 15000,
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
      if (blockedTypes.has(request.resourceType())) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Use DOM load instead of network idle to avoid hanging on persistent connections.
    console.log("Navigating to skillrack...");
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForSelector("div.ui.four.wide.center.aligned.column", {
      timeout: 7000,
    });

    const data = await page.content();
    const browserResult = buildProfileFromHtml(data, url, id);

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
