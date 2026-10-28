import uuid
import io
import ezdxf
import logging

from fastapi import FastAPI, File, HTTPException, UploadFile

logging.basicConfig(
    level=logging.DEBUG,
    format="%(levelname)s:\t  %(message)s",
)
logger = logging.getLogger(__name__)


app = FastAPI(title="DXF-web-master Service")

# файлы списком, не хочу бд использовать
# ИСПРАВИТЬ НА БД НУЖНО БУДЕТ когданибудь потом
files = {}


# данные из ezdxf приводит в нормальный тип -> JSON
def clean(value):

    # значение нормальные сразу вернем
    if value is None or isinstance(value, (str, int, float)):
        logger.debug("Стандартное число")
        return  value

    # вектор или точка 
    if hasattr(value, "x") and hasattr(value, "y"):
        logger.debug("Значение числами")
        return {
            "x": value.x,
            "y": value.y,

            # баг с плоскими объектами, ставлю 0 по умолчанию
            "z": getattr(value, "z", 0),
        }

    # рекурсивная обработка словаря (если массив пршел)
    if isinstance(value, dict):
        logger.debug("Словарь пришел")
        return {str(k): clean(v) for k, v in value.items()}

    # список или кортеж
    if isinstance(value, (list, tuple)):
        logger.debug("Список или словарь пришел")
        return [clean(v) for v in value]

    # пришло что-то не понятное
    logger.debug(str(value))
    return str(value)


# подсчет кол-во сушностей каждого вида
def count_types(doc):

    # кол-во сушностей каждого типа
    result = {}

    for entity in doc.modelspace():
        entity_type = entity_type.dxftype().upper()
        # прибавляем уели уже есть такой тип
        result[entity_type] = result.get(entity_type, 0) + 1

    return result

"""
Эндпоинты
"""

# загрузка файлов и возврат id файла и список сущностей с их кол-вом
@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    # file - загруженный файл
    
    data = await file.read()

    try:
        doc = ezdxf.read(io.BytesIO(data))
    except Exception:
        raise HTTPException(status_code=400, detail="Не удалось прочитать файл")

    # генерация id файла, все по взрослому ;)
    file_id = uuid.uuid4().hex

    files[file_id] = doc

    return {
        "file_id": file_id,
        "types": count_types(doc),
    }

# получение типов сушностей
@app.get("/api/types/{file_id}")
def get_types(file_id: str):

    # поиск файла по id
    doc = files.get(file_id)

    if not doc:
        raise HTTPException(status_code=404, detail="Файл не найден")

    return {
        "types": count_types(doc),
    }