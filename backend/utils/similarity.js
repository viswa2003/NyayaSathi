/*
 * =======================================================
 * NYAYASATHI: SIMILARITY UTILS
 * =======================================================
 *
 * This file contains helper functions for vector math,
 * like calculating cosine similarity.
 */

/**
 * Calculates the dot product of two vectors.
 * @param {number[]} vecA - The first vector.
 * @param {number[]} vecB - The second vector.
 * @returns {number} The dot product.
 */
function dotProduct(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must be the same length');
  }
  let product = 0;
  for (let i = 0; i < vecA.length; i++) {
    product += vecA[i] * vecB[i];
  }
  return product;
}

/**
 * Calculates the magnitude (length) of a vector.
 * @param {number[]} vec - The vector.
 * @returns {number} The magnitude.
 */
function magnitude(vec) {
  let sumOfSquares = 0;
  for (let i = 0; i < vec.length; i++) {
    sumOfSquares += vec[i] * vec[i];
  }
  return Math.sqrt(sumOfSquares);
}

/**
 * Calculates the cosine similarity between two vectors.
 * Returns a score between -1 and 1 (or 0 and 1 for these embeddings).
 * A score of 1 means they are identical.
 * @param {number[]} vecA - The first vector.
 * @param {number[]} vecB - The second vector.
 * @returns {number} The cosine similarity score.
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must be the same length');
  }
  const A = magnitude(vecA);
  const B = magnitude(vecB);
  if (A === 0 || B === 0) return 0;
  return dotProduct(vecA, vecB) / (A * B);
}

module.exports = { cosineSimilarity };