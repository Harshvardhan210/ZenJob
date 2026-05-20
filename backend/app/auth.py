import os
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import Request, HTTPException, status
import logging

logger = logging.getLogger(__name__)

# Initialize Firebase Admin
# Expecting the service account JSON to be placed in the backend directory
cred_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "firebase-adminsdk.json")
try:
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin initialized successfully.")
    else:
        logger.warning(f"Firebase Admin SDK JSON not found at {cred_path}. Authentication will fail until it is provided.")
except Exception as e:
    logger.warning(f"Failed to initialize Firebase Admin: {str(e)}")

async def get_current_user(request: Request) -> str:
    """Dependency to verify the Firebase ID token in the Authorization header."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = auth_header.split(" ")[1]
    try:
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token["uid"]
        return uid
    except Exception as e:
        logger.error(f"Token verification failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
