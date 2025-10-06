const { shuffleArray } = require('../server');

test('shuffle returns same items', () => {
  const arr = [1,2,3,4,5];
  const out = shuffleArray(arr);
  expect(out.sort()).toEqual(arr.sort());
});
