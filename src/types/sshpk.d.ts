declare module 'sshpk' {
  export function parseKey(data: string | Buffer, format: string): Key;
  export function parsePrivateKey(data: string | Buffer, format: string): PrivateKey;
  export function parseSignature(data: string | Buffer, algorithm: string, format: string): Signature;

  export class Key {
    type: string;
    size: number;
    comment?: string;
    fingerprint(algorithm?: string): Fingerprint;
    createVerify(algorithm: string): Verifier;
    toBuffer(format?: string): Buffer;
    toString(format?: string): string;
  }

  export class PrivateKey extends Key {
    createSign(algorithm: string): Signer;
  }

  export class Fingerprint {
    toString(format?: string): string;
  }

  export class Verifier {
    update(data: Buffer | string): void;
    verify(signature: Signature | Buffer | string, format?: string): boolean;
  }

  export class Signer {
    update(data: Buffer | string): void;
    sign(): Signature;
  }

  export class Signature {
    toBuffer(format?: string): Buffer;
    toString(format?: string): string;
  }
}
