/**
 * @jest-environment node
 */

const sign = require('./signHelper');

const merNo = '12318';
const gatewayNo = '12318002';
const signKey = '12345678';

test('sign should create a sha256 hash', () => {
  const hash = sign([
    merNo,
    gatewayNo,
    signKey,
  ]);
  expect(hash).toBe('113d17feec190065cf33154b4878777eac0eb3f88d1b95b5f7a507e6e22e7a1e');
});
