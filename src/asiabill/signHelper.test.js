/**
 * @jest-environment node
 */

const sign = require('./signHelper');

const merNo = '12318';
const gatewayNo = '12318001';
const signKey = '12345678';

test('sign should create a sha256 hash', () => {
  const hash = sign([
    merNo,
    gatewayNo,
    signKey,
  ]);
  expect(hash).toBe('d693a4acdc09a5173fe35fdb3b09f4c5def9ad9498efbe6a6eeb731ed29a476c');
});
