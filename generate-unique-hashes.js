// Helper script to generate unique IPFS-like hashes for testing
// Run with: node generate-unique-hashes.js <count>

const crypto = require('crypto');

function generateUniqueIPFSHash() {
    // Generate a random hash that looks like an IPFS CID
    const randomBytes = crypto.randomBytes(32);
    const base58chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let hash = 'Qm';

    for (let i = 0; i < 44; i++) {
        const randomIndex = randomBytes[i % 32] % base58chars.length;
        hash += base58chars[randomIndex];
    }

    return hash;
}

const count = parseInt(process.argv[2]) || 5;

console.log(`\nGenerating ${count} unique IPFS-like hashes:\n`);
console.log('Copy these into your CSV file:\n');

for (let i = 0; i < count; i++) {
    console.log(generateUniqueIPFSHash());
}

console.log('\n✅ Done! Use these hashes in your CSV to avoid "AlreadyExists" errors.\n');
