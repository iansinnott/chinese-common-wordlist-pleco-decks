const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

/**
 * Get list of all links to subpage lists with the actual character entries
 */
const getListLinks = async page => {
  await page.goto(
    'https://en.wiktionary.org/wiki/Appendix:Mandarin_Frequency_lists'
  );

  const links = await page.evaluate(() => {
    const nodeList = document.querySelectorAll('#mw-content-text a');
    return Array.from(nodeList).map(x => x.href);
  });

  return links;
};

const entriesFromUrl = async (page, url) => {
  await page.goto(url);

  return await page.evaluate(() => {
    const parseFromList = () => {
      // Entries look like "校門, 校门 (xiàomén) - school gate"
      // So [1],[2],[3],[4] will be trad,simpl,pinyin,definition
      // NOTE: This RE needs to be defined in the browser context
      const wikiListRe = /^(.+),\s(.+)\s\((.+)\)\s-\s(.+)$/i;

      const nodeList = document.querySelectorAll('#mw-content-text ol li');
      return Array.from(nodeList).map(x => {
        // NOTE: [0] will be the full string
        // NOTE: This will throw if not matched
        let match = [];
        try {
          match = x.innerText.match(wikiListRe);
        } catch (err) {
          console.log('[OH NO]:', err);
        }

        const [_, traditional, simplified, pinyin, definition] = match;

        return { traditional, simplified, pinyin, definition };
      });
    };

    const parseFromTable = () => {
      const nodeList = document.querySelectorAll('.wikitable tr');
      return Array.from(nodeList)
        .map(tr => Array.from(tr.children).map(x => x.innerText))
        .slice(1) // Remove header row
        .map(([traditional, simplified, pinyin, definition]) => {
          return { traditional, simplified, pinyin, definition };
        });
    };

    // Some very redimentary logic since hte first page is formatted as a
    // <table> while the rest are just lists
    if (
      document.title === 'Appendix:Mandarin Frequency lists/1-1000 - Wiktionary'
    ) {
      return parseFromTable();
    } else {
      return parseFromList();
    }
  });
};

const formatFlashcards = json => {
  let body = '//Wiki 10K';

  Object.keys(json).forEach(k => {
    const list = json[k];
    list.forEach(item => {
      body += '\n';
      body += item.traditional;
    });
  });

  return body;
};

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  let entries = {};

  if (fs.existsSync(path.resolve('./tmp/wiki10k.json'))) {
    console.log('[INFO]: Already have links. Not pulling from remote site');
    entries = require('./tmp/wiki10k.json');
  } else {
    const links = await getListLinks(page);

    for (let i = 0; i < links.length; i++) {
      const url = links[i];
      entries[url] = await entriesFromUrl(page, url);
    }

    fs.writeFileSync(
      path.resolve('./tmp/wiki10k.json'),
      JSON.stringify(entries, null, 2)
    );
  }

  await browser.close();

  const flashcards = formatFlashcards(entries);

  fs.writeFileSync(path.resolve('./tmp/wiki10kflashcards.txt'), flashcards);
})();
