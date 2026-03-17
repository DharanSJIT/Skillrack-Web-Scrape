import axios from 'axios';
import * as cheerio from 'cheerio';

export async function fetchData(url) {
  try {
    console.log('Fetching data from URL:', url);
    // Extract the resume id from the URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const id = pathParts[2]; // ID is the third part in /profile/ID/...
    console.log('Extracted ID:', id);

    const { data } = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"macOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      }
    });
    const $ = cheerio.load(data);

    console.log('Page HTML length:', data.length);
    console.log('First 1000 characters of HTML:', data.substring(0, 1000));

    // Extract data from the page
    const rawText = $('div.ui.four.wide.center.aligned.column').text().trim().split('\n');
    console.log('Raw text array:', rawText);
    const name = rawText[0]?.trim() || 'Not found';
    const rollNumber = rawText[2]?.trim() || 'Not found';
    const dept = rawText[4]?.trim() || 'Not found';
    const college = rawText[6]?.trim() || 'Not found';
    const yearInfo = rawText[8]?.trim() || 'Not found';
    const yearMatch = yearInfo.match(/\d{4}$/);
    const year = yearMatch ? yearMatch[0] : 'Not found';
    const codeTutor = parseInt($('div:contains("DT")').next().find('.value').text().trim()) || 0;
    const codeTrack = parseInt($('div:contains("CODE TEST")').next().find('.value').text().trim()) || 0;
    const codeTest = parseInt($('div:contains("PROGRAMS SOLVED")').next().find('.value').text().trim()) || 0;
    const dt = parseInt($('div:contains("DC")').next().find('.value').text().trim()) || 0;
    const dc = parseInt($('div:contains("CODE TRACK")').next().find('.value').text().trim()) || 0;

    // Calculate points
    const points = codeTrack * 2 + codeTest * 30 + dt * 20 + dc * 2;

    // Total Solved = Daily Challenge (dt) + Daily Test (codeTutor) + Code Track (dc) + Code Test (codeTrack) + Code Tutor (codeTest/Programs Solved)
    const totalSolved = dt + codeTutor + dc + codeTrack + codeTest;

    // Format last fetched date
    const date = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });
    const lastFetched = date.split(',')[1].trim();

    // Display results in console
    console.log('\n=== SkillRack Profile Data ===');
    console.log(`Name: ${name}`);
    console.log(`Roll Number: ${rollNumber}`);
    console.log(`Department: ${dept}`);
    console.log(`Year Info: ${yearInfo}`);
    console.log(`College: ${college}`);
    console.log('\n=== Points Breakdown ===');
    console.log(`Code Tutor: ${codeTutor}`);
    console.log(`Code Track: ${codeTrack} (${codeTrack} x 2 = ${codeTrack * 2} points)`);
    console.log(`Code Test: ${codeTest} (${codeTest} x 30 = ${codeTest * 30} points)`);
    console.log(`DT: ${dt} (${dt} x 20 = ${dt * 20} points)`);
    console.log(`DC: ${dc} (${dc} x 2 = ${dc * 2} points)`);
    console.log('\n=== Summary ===');
    console.log(`Total Points: ${points}`);
    console.log(`Profile URL: ${url}`);
    console.log(`Last Fetched: ${lastFetched}`);
    console.log('============================\n');

    return {
      id, name, dept, year, college,
      codeTutor, codeTrack, codeTest, dt, dc,
      points, totalSolved, lastFetched, url, yearInfo, rollNumber
    };
  } catch (error) {
    console.error(`Error fetching data: ${error.message}`);
    console.error(`Status code: ${error.response?.status}`);
    console.error(`Network error: ${url}`);
    // Instead of completely suppressing it into 'null', we re-throw to Controller
    throw new Error(`Scraper failed: ${error.message}`);
  }
}
