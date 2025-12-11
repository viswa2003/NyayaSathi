/* eslint-disable no-console */
require('dotenv').config();
const mongoose = require('mongoose');
const { getEmbedding } = require('../services/embeddingService');
const Law = require('../models/Law');

const MONGO_URI = process.env.MONGO_URI;
const FORCE_REEMBED = process.argv.includes('--force'); // Check for --force flag

function composeLawText(law) {
  const parts = [
    law.act_name,
    `Section ${law.section_number}: ${law.title}`,
    law.description,
    law.simplified_description,
    law.punishment && law.punishment !== 'Not specified' ? `Punishment: ${law.punishment}` : '',
    Array.isArray(law.keywords) ? law.keywords.join(', ') : '',
  ].filter(Boolean);
  return parts.join('\n\n');
}

async function run() {
  if (!MONGO_URI) throw new Error('MONGO_URI missing in env');

  await mongoose.connect(MONGO_URI, { dbName: process.env.MONGO_DB_NAME || undefined });
  console.log('MongoDB connected');

  // Smart query: only missing embeddings OR force re-embed all
  const query = FORCE_REEMBED 
    ? {} 
    : {
        $or: [
          { embeddings: { $exists: false } },
          { embeddings: null },
          { embeddings: [] }
        ]
      };

  console.log(FORCE_REEMBED ? '⚠️  Force re-embedding ALL documents' : '✓ Only embedding missing documents');

  // Snapshot IDs upfront to avoid shifting windows as docs are updated
  const ids = await Law.find(query).select('_id').lean();
  const totalCount = ids.length;
  console.log(`Found ${totalCount} laws to process`);

  // Process in batches to avoid cursor timeout
  const BATCH_SIZE = 50;
  let processed = 0;
  let embedded = 0;

  for (let start = 0; start < totalCount; start += BATCH_SIZE) {
    const batchIds = ids.slice(start, start + BATCH_SIZE).map(d => d._id);
    const batch = await Law.find({ _id: { $in: batchIds } })
      .select('_id act_name section_number title description simplified_description punishment keywords')
      .lean(); // Use lean for better performance

    console.log(`\nProcessing batch ${Math.floor(start / BATCH_SIZE) + 1}/${Math.ceil(totalCount / BATCH_SIZE)} (${batch.length} laws)...`);

    for (const doc of batch) {
      const text = composeLawText(doc);
      if (!text) {
        console.warn(`Skipping ${doc._id}: empty text`);
        processed++;
        continue;
      }
      try {
        const emb = await getEmbedding(text);
        await Law.updateOne({ _id: doc._id }, { $set: { embeddings: emb } });
        embedded++;
        processed++;
        if (embedded % 10 === 0 || embedded === totalCount) console.log(`  Embedded ${embedded}/${totalCount} laws...`);
        await new Promise(r => setTimeout(r, 150)); // gentle throttle
      } catch (err) {
        console.error(`  Failed ${doc._id}: ${err.message}`);
        processed++;
      }
    }
  }

  console.log(`\n✓ Done. Embedded ${embedded} out of ${processed} law documents.`);
  await mongoose.disconnect();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});