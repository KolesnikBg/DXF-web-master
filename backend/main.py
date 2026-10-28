import uuid
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

