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

  const cursor = Law.find(query)
    .select('_id act_name section_number title description simplified_description punishment keywords')
    .cursor();

  let count = 0;
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    const text = composeLawText(doc);
    if (!text) {
      console.warn(`Skipping ${doc._id}: empty text`);
      continue;
    }
    try {
      const emb = await getEmbedding(text);
      await Law.updateOne({ _id: doc._id }, { $set: { embeddings: emb } });
      count++;
      if (count % 10 === 0) console.log(`Embedded ${count} laws...`);
      await new Promise(r => setTimeout(r, 150)); // gentle throttle
    } catch (err) {
      console.error(`Failed ${doc._id}: ${err.message}`);
    }
  }

  console.log(`Done. Embedded ${count} law documents.`);
  await mongoose.disconnect();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});