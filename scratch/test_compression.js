function bufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function compressString(str) {
  const stream = new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'));
  const response = new Response(stream);
  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  return bufferToBase64(buffer);
}

async function decompressString(base64Str) {
  const buffer = base64ToBuffer(base64Str);
  const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
  const response = new Response(stream);
  return await response.text();
}

async function run() {
  const original = JSON.stringify({
    test: "hello world!",
    data: Array(1000).fill("some repeated data to compress").join(" ")
  });
  console.log("Original length:", original.length);
  
  const compressed = await compressString(original);
  console.log("Compressed length:", compressed.length);
  console.log("Compression ratio:", (compressed.length / original.length * 100).toFixed(2) + "%");
  
  const decompressed = await decompressString(compressed);
  console.log("Decompressed match:", decompressed === original);
}

run().catch(console.error);
