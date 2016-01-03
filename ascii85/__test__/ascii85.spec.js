/* global describe, it */
import { encode, decode } from '../index.js';
import { assert } from 'chai';

describe('ascii85 encoder/decoder', () => {
    const validate = cases => {
        cases.forEach(c => {
            assert.equal(encode(c[0]), c[1]);
            assert.equal(decode(c[1]), c[0]);
        });
    };

    it('basics', () => {
        validate([
            ['h', '<~BE~>'],
            ['he', '<~BOq~>'],
            ['hel', '<~BOtu~>'],
            ['hell', '<~BOu!r~>'],
            ['hello', '<~BOu!rDZ~>']
        ]);
    });

    it('whitespaces', () => {
        validate([
            [' ', '<~+9~>'],
            [' \n', '<~+:8~>'],
            ['    ', '<~+<VdL~>'],
            ['    \n\n', '<~+<VdL$46~>']
        ]);
    });

    it('null bytes', () => {
        validate([
            ['\0', '<~!!~>'],
            ['\0\0', '<~!!!~>'],
            ['\0\0\0', '<~!!!!~>'],
            ['\0\0\0\0', '<~z~>'],
            ['\0\0\0\0\0', '<~z!!~>']
        ]);
    });

    it('random binary data', () => {
        const maxBytes = 2048;
        let i = 5;

        while (i--) {
            let input = '';
            let bytes = Math.max(256, Math.random() * maxBytes | 0);
            while (bytes--) {
                // random ASCII byte
                input += String.fromCharCode(Math.random() * 255 | 0);
            }
            assert.equal(input, decode(encode(input)));
        }
    });
});
