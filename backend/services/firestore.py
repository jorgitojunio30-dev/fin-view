from config.firebase import db
from datetime import datetime
from google.cloud.firestore import SERVER_TIMESTAMP

def get_user_collection_ref(user_id: str, collection_name: str):
    return db.collection("users").document(user_id).collection(collection_name)

def get_all_documents(user_id: str, collection_name: str):
    docs = get_user_collection_ref(user_id, collection_name).stream()
    result = []
    for doc in docs:
        data = doc.to_dict()
        data['id'] = doc.id
        result.append(data)
    return result

def get_document(user_id: str, collection_name: str, doc_id: str):
    doc_ref = get_user_collection_ref(user_id, collection_name).document(doc_id)
    doc = doc_ref.get()
    if doc.exists:
        data = doc.to_dict()
        data['id'] = doc.id
        return data
    return None

def create_document(user_id: str, collection_name: str, data: dict):
    doc_data = data.copy()
    doc_data['createdAt'] = SERVER_TIMESTAMP
    doc_ref = get_user_collection_ref(user_id, collection_name).document()
    doc_ref.set(doc_data)
    return doc_ref.id

def update_document(user_id: str, collection_name: str, doc_id: str, data: dict):
    doc_ref = get_user_collection_ref(user_id, collection_name).document(doc_id)
    if not doc_ref.get().exists:
        return False
    doc_ref.update(data)
    return True

def delete_document(user_id: str, collection_name: str, doc_id: str):
    doc_ref = get_user_collection_ref(user_id, collection_name).document(doc_id)
    if not doc_ref.get().exists:
        return False
    doc_ref.delete()
    return True

def query_documents(user_id: str, collection_name: str, filters: list):
    """
    filters: list of tuples (field, operator, value)
    """
    query = get_user_collection_ref(user_id, collection_name)
    for field, op, val in filters:
        query = query.where(field, op, val)
    
    docs = query.stream()
    result = []
    for doc in docs:
        data = doc.to_dict()
        data['id'] = doc.id
        result.append(data)
    return result

def batch_update_documents(user_id: str, collection_name: str, filters: list, data: dict):
    query = get_user_collection_ref(user_id, collection_name)
    for field, op, val in filters:
        query = query.where(field, op, val)
    
    docs = list(query.stream())
    count = 0
    # Firestore batch limit is 500 operations
    BATCH_SIZE = 500
    for i in range(0, len(docs), BATCH_SIZE):
        batch = db.batch()
        chunk = docs[i:i + BATCH_SIZE]
        for doc in chunk:
            batch.update(doc.reference, data)
            count += 1
        batch.commit()
    return count

def batch_delete_documents(user_id: str, collection_name: str, filters: list):
    query = get_user_collection_ref(user_id, collection_name)
    for field, op, val in filters:
        query = query.where(field, op, val)
    
    docs = list(query.stream())
    count = 0
    # Firestore batch limit is 500 operations
    BATCH_SIZE = 500
    for i in range(0, len(docs), BATCH_SIZE):
        batch = db.batch()
        chunk = docs[i:i + BATCH_SIZE]
        for doc in chunk:
            batch.delete(doc.reference)
            count += 1
        batch.commit()
    return count
