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
PO_COLLECTION_NAME = "purchaseorders"  # NEW: PO collection
EMBEDDING_FIELD = "embedding"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

app = FastAPI()
mongo_client = MongoClient(MONGO_URI)
db = mongo_client[DB_NAME]
collection = db[COLLECTION_NAME]
po_collection = db[PO_COLLECTION_NAME]  # NEW: PO collection

model = None
master_items = []
item_texts = []
item_embeddings = None

# NEW: PO master variables
po_items = []
po_item_texts = []
po_item_embeddings = None

class MatchRequest(BaseModel):
    descriptions: List[str]  # List of PO item descriptions to match
    top_n: Optional[int] = 3

class MatchResult(BaseModel):
    method: str
    matches: List[dict]

def get_item_text(item):
    # You can customize this to include more fields if needed
    return f"{item.get('itemCode', '')} {item.get('description', '')}"

def get_po_item_text(item):
    # Use only name and description for fuzzy and vector matching
    return f"{item.get('name', '')} {item.get('description', '')}"

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

# NEW: Load PO items and embeddings
def load_po_items_and_embeddings():
    global po_items, po_item_texts, po_item_embeddings
    print("Loading PO items from MongoDB...")
    
    # Get all POs and extract their items
    all_pos = list(po_collection.find({}))
    po_items = []
    
    for po in all_pos:
        if po.get('itemsOrdered') and isinstance(po['itemsOrdered'], list):
            for item in po['itemsOrdered']:
                # Add PO reference to item
                item_with_po = {
                    **item,
                    'poId': str(po['_id']),
                    'poNumber': po.get('purchaseOrderNo', ''),
                    'poDate': po.get('purchaseOrderDate', '')
                }
                po_items.append(item_with_po)
    
    po_item_texts = [get_po_item_text(item) for item in po_items]
    
    # Generate embeddings for PO items missing them
    missing = [i for i, item in enumerate(po_items) if not item.get(EMBEDDING_FIELD)]
    if missing:
        print(f"Generating embeddings for {len(missing)} PO items missing embeddings...")
        texts_to_embed = [po_item_texts[i] for i in missing]
        new_embeddings = model.encode(texts_to_embed, show_progress_bar=True)
        for idx, emb in zip(missing, new_embeddings):
            po_items[idx][EMBEDDING_FIELD] = emb.tolist()
    
    # Load all PO embeddings into memory
    po_item_embeddings = [item.get(EMBEDDING_FIELD) for item in po_items]
    print(f"Loaded {len(po_items)} PO items with embeddings.")

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
    load_po_items_and_embeddings()  # NEW: Load PO items

@app.post("/refresh")
def refresh():
    load_master_items_and_embeddings()
    return {"status": "refreshed", "count": len(master_items)}

# NEW: Refresh PO embeddings
@app.post("/refresh-po")
def refresh_po():
    all_pos = list(po_collection.find({}))
    total_pos = len(all_pos)
    total_items = 0
    print(f"[refresh-po] Found {total_pos} purchase orders to process.")
    for po in all_pos:
        updated_items = []
        po_id = po.get('_id')
        items = po.get('itemsOrdered', [])
        print(f"[refresh-po] Processing PO _id={po_id}, itemsOrdered count={len(items)}")
        for idx, item in enumerate(items):
            text = get_po_item_text(item)
            print(f"[refresh-po]   Item {idx} text for embedding: '{text}'")
            emb = model.encode([text])[0].tolist()
            print(f"[refresh-po]   Item {idx} embedding (first 5 values): {emb[:5]}")
            item['embedding'] = emb
            updated_items.append(item)
            total_items += 1
        if updated_items:
            result = po_collection.update_one(
                {'_id': po_id},
                {'$set': {'itemsOrdered': updated_items}}
            )
            print(f"[refresh-po]   Updated PO _id={po_id}, matched={result.matched_count}, modified={result.modified_count}")
    load_po_items_and_embeddings()
    print(f"[refresh-po] Completed. Processed {total_pos} POs, {total_items} items.")
    return {"status": "refreshed", "purchase_orders": total_pos, "items": total_items}

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

# NEW: Match PO items
@app.post("/match-po", response_model=List[MatchResult])
def match_po_items(req: MatchRequest):
    if not po_items or not po_item_embeddings:
        raise HTTPException(status_code=500, detail="PO items or embeddings not loaded.")
    results = []
    for desc in req.descriptions:
        # Vector search
        try:
            query_emb = model.encode(desc)
            sims = cosine_similarity([query_emb], po_item_embeddings)[0]
            top_indices = sims.argsort()[-req.top_n:][::-1]
            matches = [{"item": clean_item(po_items[i]), "score": float(sims[i]), "method": "vector"} for i in top_indices]
            method = "vector"
        except Exception as e:
            print("Vector search failed, falling back to fuzzy:", e)
            choices = {text: item for text, item in zip(po_item_texts, po_items)}
            top_matches = fuzzy_process.extract(desc, choices.keys(), limit=req.top_n)
            matches = [{"item": clean_item(choices[text]), "score": score / 100.0, "method": "fuzzy"} for text, score in top_matches]
            method = "fuzzy"
        results.append({"method": method, "matches": matches})
    return results 