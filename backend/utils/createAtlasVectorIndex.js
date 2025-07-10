const axios = require('axios');

const ATLAS_PUBLIC_KEY ='xdtkykra';
const ATLAS_PRIVATE_KEY ='56a76096-8f74-4b41-9567-37f86028a9b2';
const PROJECT_ID ='681220c220a7a871d2e86351'; // Set in your .env
const CLUSTER_NAME ='Cluster0'; // Set in your .env

async function createAtlasVectorIndex() {
  if (!ATLAS_PUBLIC_KEY || !ATLAS_PRIVATE_KEY || !PROJECT_ID || !CLUSTER_NAME) {
    console.error('Atlas API credentials or project/cluster info missing.');
    return;
  }
  const url = `https://cloud.mongodb.com/api/atlas/v1.0/groups/${PROJECT_ID}/clusters/${CLUSTER_NAME}/fts/indexes`;
  const data = {
    collectionName: "stockmasteritems",
    database: "test",
    name: "embedding_vector_index",
    mappings: {
      dynamic: false,
      fields: {
        embedding: {
          type: "knnVector",
          dimensions: 384,
          similarity: "cosine"
        }
      }
    }
  };

  try {
    const response = await axios.post(url, data, {
      auth: {
        username: ATLAS_PUBLIC_KEY,
        password: ATLAS_PRIVATE_KEY
      }
    });
    console.log("Atlas vector index created:", response.data);
  } catch (err) {
    if (err.response && err.response.data) {
      // If index already exists, log and continue
      if (err.response.data.errorCode === 'ATLAS_SEARCH_INDEX_ALREADY_EXISTS') {
        console.log('Atlas vector index already exists.');
      } else {
        console.error("Atlas vector index creation failed:", err.response.data);
      }
    } else {
      console.error("Atlas vector index creation failed:", err.message);
    }
  }
}

module.exports = createAtlasVectorIndex; 