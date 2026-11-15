from fastapi import FastAPI

app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}

# path parameters
@app.get("/items/{item_id}")
async def read_item(item_id: int): # with type annotations. If parameter cannot be converted into int. Error message will automatically return.
    return {"item_id": item_id}

# path parameters where parameter is a path as well. :path basically says it can be any string that looks like a path
@app.get("/files/{file_path:path}")
async def read_file(file_path: str):
    return {"file_path": file_path}