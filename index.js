const fs = require('fs');
const path = require('path');
const { pipe } = require('ramda');

const parseCSV = string => {
  if (typeof string !== 'string') {
    throw new TypeError('parseCSV requires a string');
  }

  const delimeter = ',';

  let head = '';
  let body = '';

  for (let i = 0; i < string.length; i++) {
    if (string[i] === '\n') {
      head = string.slice(0, i);
      body = string.slice(i + 1); // Add 1 to skip this newline
      break;
    }
  }

  const headers = head.split(delimeter);
  const rows = body.split('\n').map(row => row.split(delimeter));

  return rows.reduce((agg, row) => {
    const obj = {};

    for (let i = 0; i < row.length; i++) {
      const key = headers[i];
      const val = row[i];
      obj[key] = val;
    }

    return agg.concat([obj]);
  }, []);
};

const main = () => {
  const fileList = [
    './raw/TOCFL Wordlist - 入門級.csv',
    './raw/TOCFL Wordlist - 基礎級.csv',
    './raw/TOCFL Wordlist - 流利級.csv',
    './raw/TOCFL Wordlist - 準備級一級.csv',
    './raw/TOCFL Wordlist - 準備級二級.csv',
    './raw/TOCFL Wordlist - 進階級.csv',
    './raw/TOCFL Wordlist - 高階級.csv',
  ];

  const output = fileList
    .map(x => path.resolve(x))
    .map(x => fs.readFileSync(x, { encoding: 'utf8' }))
    .map(x => parseCSV(x));

  fs.writeFileSync('tmp/output.json', JSON.stringify(output, null, 2));

  const dict = output.reduce((dict, list) => {
    list.forEach(x => {
      dict[x['詞彙']] = x;
    });

    return dict;
  }, {});

  fs.writeFileSync('tmp/dict.json', JSON.stringify(dict, null, 2));

  let flashfile = '//TOCFL 8000';

  Object.keys(dict).forEach(k => {
    const v = dict[k];
    flashfile += '\n';
    flashfile += k + '\t' + v['漢語拼音'];
  });

  fs.writeFileSync('tmp/flashfile.txt', flashfile);

  console.log(flashfile.split('\n').length);
};

if (require.main === module) main();

module.exports = {
  parseCSV,
};
