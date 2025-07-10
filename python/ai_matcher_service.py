import os
import time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from thefuzz import process as fuzzy_process
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = "test"
COLLECTION_NAME = "stockmasteritems"
EMBEDDING_FIELD = "embedding"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

app = FastAPI()
mongo_client = MongoClient(MONGO_URI)
db = mongo_client[DB_NAME]
collection = db[COLLECTION_NAME]

model = None
master_items = []
item_texts = []
item_embeddings = None

class MatchRequest(BaseModel):
    descriptions: List[str]  # List of PO item descriptions to match
    top_n: Optional[int] = 3

class MatchResult(BaseModel):
    method: str
    matches: List[dict]

def get_item_text(item):
    # You can customize this to include more fields if needed
    return f"{item.get('itemCode', '')} {item.get('description', '')}"

def load_master_items_and_embeddings():
    global master_items, item_texts, item_embeddings
    print("Loading master items from MongoDB...")
    master_items = list(collection.find({}))
    item_texts = [get_item_text(item) for item in master_items]
    # Generate embeddings for items missing them
    missing = [i for i, item in enumerate(master_items) if not item.get(EMBEDDING_FIELD)]
    if missing:
        print(f"Generating embeddings for {len(missing)} items missing embeddings...")
        texts_to_embed = [item_texts[i] for i in missing]
        new_embeddings = model.encode(texts_to_embed, show_progress_bar=True)
        for idx, emb in zip(missing, new_embeddings):
            collection.update_one({"_id": master_items[idx]["_id"]}, {"$set": {EMBEDDING_FIELD: emb.tolist()}})
            master_items[idx][EMBEDDING_FIELD] = emb.tolist()
    # Load all embeddings into memory
    item_embeddings = [item.get(EMBEDDING_FIELD) for item in master_items]
    print(f"Loaded {len(master_items)} master items with embeddings.")

def clean_item(item):
    # Convert ObjectId to string for JSON serialization
    item = dict(item)  # Make a copy to avoid mutating the original
    if '_id' in item:
        item['_id'] = str(item['_id'])
    return item

@app.on_event("startup")
def startup_event():
    global model
    print("Loading embedding model...")
    model = SentenceTransformer(EMBEDDING_MODEL)
    load_master_items_and_embeddings()

@app.post("/refresh")
def refresh():
    load_master_items_and_embeddings()
    return {"status": "refreshed", "count": len(master_items)}

@app.post("/match", response_model=List[MatchResult])
def match_items(req: MatchRequest):
    if not master_items or not item_embeddings:
        raise HTTPException(status_code=500, detail="Master items or embeddings not loaded.")
    results = []
    for desc in req.descriptions:
        # Vector search
        try:
            query_emb = model.encode(desc)
            sims = cosine_similarity([query_emb], item_embeddings)[0]
            top_indices = sims.argsort()[-req.top_n:][::-1]
            matches = [{"item": clean_item(master_items[i]), "score": float(sims[i]), "method": "vector"} for i in top_indices]
            method = "vector"
        except Exception as e:
            print("Vector search failed, falling back to fuzzy:", e)
            choices = {text: item for text, item in zip(item_texts, master_items)}
            top_matches = fuzzy_process.extract(desc, choices.keys(), limit=req.top_n)
            matches = [{"item": clean_item(choices[text]), "score": score / 100.0, "method": "fuzzy"} for text, score in top_matches]
            method = "fuzzy"
        results.append({"method": method, "matches": matches})
    return results 