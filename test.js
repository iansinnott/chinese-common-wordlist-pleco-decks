const { parseCSV } = require('./tocfl-8000.js');

test('parseCSV', () => {
  expect(() => {
    parseCSV(3);
  }).toThrow(TypeError);

  const data = `
a,b,c
hey,there,you
my,name,is
  `.trim();

  expect(parseCSV(data)).toEqual([
    { a: 'hey', b: 'there', c: 'you' },
    { a: 'my', b: 'name', c: 'is' },
  ]);
});
