import * as crypto from 'crypto'

function sign(signValues: any[]): string {
  return crypto.createHash('sha256').update(signValues.join('')).digest('hex');
}

export default {sign}
