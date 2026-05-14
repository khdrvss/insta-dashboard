from fastapi import APIRouter
router = APIRouter()

@router.get("/status")
async def auth_status():
    return {"authenticated": True, "message": "Auth handled by Clerk on the Next.js layer"}
