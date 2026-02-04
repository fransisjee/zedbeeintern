from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import json
import models, schemas, database
from routers.auth import get_current_user
from utils import sync_user_to_files

router = APIRouter(
    prefix="/api/config",
    tags=["config"]
)

@router.get("", response_model=schemas.ConfigResponse)
def get_config(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    config = db.query(models.Configuration).filter(models.Configuration.user_id == current_user.id).first()
    if not config:
        return {"data": {}} # Return empty if no config
    
    try:
        data = json.loads(config.data)
        return {"data": data}
    except:
        return {"data": {}}

@router.put("")
def update_config(config_in: schemas.ConfigUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    config = db.query(models.Configuration).filter(models.Configuration.user_id == current_user.id).first()
    
    json_data = json.dumps(config_in.data)
    
    if config:
        config.data = json_data
    else:
        new_config = models.Configuration(user_id=current_user.id, data=json_data)
        db.add(new_config)
    
    db.commit()
    sync_user_to_files(current_user, db)
    return {"message": "Configuration saved"}
