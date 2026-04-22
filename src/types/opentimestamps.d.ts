declare module 'javascript-opentimestamps' {
  export const Ops: {
    OpSHA256: new () => unknown
  }

  export class DetachedTimestampFile {
    static fromHash(op: unknown, hash: Buffer | Uint8Array): DetachedTimestampFile
    static deserialize(bytes: Buffer | Uint8Array): DetachedTimestampFile
    serializeToBytes(): Uint8Array
    fileDigest(): Uint8Array | Buffer
  }

  export function stamp(file: DetachedTimestampFile): Promise<void>
  export function upgrade(file: DetachedTimestampFile): Promise<boolean>
  export function verify(file: DetachedTimestampFile): Promise<{
    bitcoin?: { height: number; timestamp: number }
    litecoin?: { height: number; timestamp: number }
    ethereum?: { height: number; timestamp: number }
  } | null>
  export function info(file: DetachedTimestampFile): string
}
