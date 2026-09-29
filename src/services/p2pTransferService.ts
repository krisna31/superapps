import Peer, { DataConnection } from 'peerjs';

export interface P2PFileTransferMeta {
  type: 'FILE_HEADER';
  name: string;
  size: number;
  mime: string;
}

export interface P2PFileChunk {
  type: 'FILE_CHUNK';
  chunk: ArrayBuffer;
  index: number;
  total: number;
}

export interface P2PFileComplete {
  type: 'FILE_COMPLETE';
}

export type P2PMessage = P2PFileTransferMeta | P2PFileChunk | P2PFileComplete;

const CHUNK_SIZE = 16 * 1024; // 16 KB chunks for reliable WebRTC data channel transfer

export class P2PTransferManager {
  private peer: Peer | null = null;
  public peerId: string = '';

  public init(customId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create random 6-character room ID if not supplied
      const id = customId || 'super-' + Math.random().toString(36).substring(2, 8);
      this.peer = new Peer(id, {
        debug: 1,
      });

      this.peer.on('open', (assignedId) => {
        this.peerId = assignedId;
        resolve(assignedId);
      });

      this.peer.on('error', (err) => {
        console.error('PeerJS error:', err);
        reject(err);
      });
    });
  }

  public onIncomingConnection(
    onProgress: (received: number, total: number, fileName: string) => void,
    onComplete: (fileBlob: Blob, fileName: string) => void
  ) {
    if (!this.peer) return;

    this.peer.on('connection', (conn: DataConnection) => {
      let fileMeta: P2PFileTransferMeta | null = null;
      let chunks: ArrayBuffer[] = [];
      let totalReceived = 0;

      conn.on('data', (data: any) => {
        const msg = data as P2PMessage;
        if (msg.type === 'FILE_HEADER') {
          fileMeta = msg;
          chunks = [];
          totalReceived = 0;
          onProgress(0, msg.size, msg.name);
        } else if (msg.type === 'FILE_CHUNK') {
          chunks.push(msg.chunk);
          totalReceived += msg.chunk.byteLength;
          if (fileMeta) {
            onProgress(totalReceived, fileMeta.size, fileMeta.name);
          }
        } else if (msg.type === 'FILE_COMPLETE') {
          if (fileMeta) {
            const blob = new Blob(chunks, { type: fileMeta.mime || 'application/octet-stream' });
            onComplete(blob, fileMeta.name);
          }
        }
      });
    });
  }

  public async sendFile(
    targetPeerId: string,
    file: File,
    onProgress: (sent: number, total: number) => void
  ): Promise<void> {
    if (!this.peer) throw new Error('Peer not initialized');

    return new Promise((resolve, reject) => {
      const conn = this.peer!.connect(targetPeerId, { reliable: true });

      conn.on('open', async () => {
        try {
          // 1. Send Header
          const header: P2PFileTransferMeta = {
            type: 'FILE_HEADER',
            name: file.name,
            size: file.size,
            mime: file.type,
          };
          conn.send(header);

          // 2. Send Chunks
          const buffer = await file.arrayBuffer();
          const totalChunks = Math.ceil(buffer.byteLength / CHUNK_SIZE);
          let offset = 0;

          for (let i = 0; i < totalChunks; i++) {
            const chunkSlice = buffer.slice(offset, offset + CHUNK_SIZE);
            offset += CHUNK_SIZE;

            conn.send({
              type: 'FILE_CHUNK',
              chunk: chunkSlice,
              index: i,
              total: totalChunks,
            });

            onProgress(Math.min(offset, buffer.byteLength), buffer.byteLength);
            // Brief pause to allow the browser's WebRTC buffer to drain
            if (i % 20 === 0) {
              await new Promise((r) => setTimeout(r, 10));
            }
          }

          // 3. Send Complete
          conn.send({ type: 'FILE_COMPLETE' });
          resolve();
        } catch (err) {
          reject(err);
        }
      });

      conn.on('error', (err) => {
        reject(err);
      });
    });
  }

  public destroy() {
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }
  }
}
