import { useState } from "react";

export default function App() {
    // хранит файл инпута
    const [file, setFile] = useState(null);
    
    // id файла с бэка вида "h34bnd2"
    const [fileId, setFileId] = useState("");

    // список типов сущностей
    const [types, setTypes] = useState({});

    // тип сущности что выбрал пользователь
    const [selectedType, setSelectedType] = useState("");

    // объекты, которые вернул бэк
    const [items, setItems] = useState([]);

    // сообщение для пользователя (исправлено имя функции на setMessage)
    const [message, setMessage] = useState("");

    // отправка формы на бэк
    async function upload(e) {
        // без перезагрузки
        e.preventDefault();

        // файл не выбран
        if (!file) {
            setMessage("Выберите файл формата DXF");
            return;
        }

        // форма для отправки данных с сайта
        const formData = new FormData();
        formData.append("file", file);

        // отправка файла на сервер
        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
        });

        // ответ сервера
        const data = await response.json();

        if (!response.ok) {
            setMessage(data.detail || "Ошибка загрузки файла");
            return;
        }
        
        // id файла
        setFileId(data.file_id);
        // список типов сущностей
        setTypes(data.types || {});

        // сброс типа и списка объектов, для загрузки нового файла
        setSelectedType("");
        setItems([]);

        setMessage("Файл загружен");
    }

    async function loadTypes() {
        const response = await fetch(`/api/types/${fileId}`);
        const data = await response.json();
        
        if (response.ok) {
            setTypes(data.types || {});
            setMessage("типы сущностей получены");
        } else {
            setMessage(data.detail || "Ошибка получения типов");
        }
    }

    // получение объектов выбранного типа
    async function loadEntities(type) {
        setSelectedType(type);

        const response = await fetch(`/api/entities/${fileId}/${type}`);

        // ответ
        const data = await response.json();

        // сохранение списка объектов
        setItems(data.items || []);
    }

    // возврат интерфейса
    return (
        <div style={{ padding: "20px" }}>
            <h1>DXF-web-master</h1>
            
            {/* Форма загрузки файла */}
            <form onSubmit={upload}>
                <input type="file" accept=".dxf" onChange={e => setFile(e.target.files[0])} />
                <button type="submit">Загрузить</button>
            </form>
            
            <p>{message}</p>
            
            {fileId && (
                <button onClick={loadTypes}>
                    Получить типы сущностей
                </button>
            )}
            
            <h2>Типы</h2>
            <ul>
                {Object.entries(types).map(([type, count]) => (
                    <li key={type}>
                        {type}: {count}{" "}
                        <button onClick={() => loadEntities(type)}>
                            Показать
                        </button>
                    </li>
                ))}
            </ul>
            
            {selectedType && (
                <>
                    <h2>Объекты: {selectedType}</h2>
                    <pre>{JSON.stringify(items, null, 2)}</pre>
                </>
            )}
        </div>
    );
}