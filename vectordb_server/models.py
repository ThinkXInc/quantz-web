from pydantic import BaseModel
from typing import Dict, List, Union, Optional

class Metadata(BaseModel):
    material_id: str
    user_id: Optional[str] = None
    keywords: Optional[List[str]] = []
    text: Optional[str] = None
    title: Optional[str] = None

