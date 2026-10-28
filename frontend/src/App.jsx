import { useState } from "react";

export default function App() {

    // хранит файл инпута
    const [file, setFile] = useState(null);
    
    // id файла с бэка вида "h34bnd2"
    const [fileId, setFileId] = useState("");

    // список типов сушностей
    const [types, setTypes] = useState({});

    // тип сушности что выбрал пользователь
    const [selectedType, setSelectedType] = useState("");

    // объекты, которые вернул бэк
    const [items, setItems] = useState([]);

    // сообщение для пользователя
    const [message, setMassage] = useState("");


    // отправка формы на бэк
    async function upload(e) {
        // без перезагрузки
        e.preventDefault();

        // файл не выбран
        if (!file) {
            setMassage("Выберете файл формата DXF");
            return;
        }

        // форма для отпавки данных с сайта
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
            setMassage("Ошибка загрузки файла");
            return;
        }
        
        // id файла
        setFileId(data.file_id);
        // список типов сушностей
        setTypes(data.types || {});

        // сброс тип и список объектов, для загрузки нового файла
        setSelectedType("");
        setItems([]);

        setMassage("Файл загружен");
    }

    // получение объектов выбранного типа
    async function loadEntities(type) {
        setSelectedType(type);

        // отпрвака запроса 
        const response = await fetch('/api/entities/${fileId}/${type}');

        // ответ
        const data = await response.json();

        // сохранение списка объектов
        setItems(data.items || []);
        
    }

    // возврат интерфейса
    return (
        <div>
            <h1>DXF-web-master</h1>
            {/* Форма загрузки файла */}
            <form onSubmit={upload}>
                <input type="file" accept=".dxf" onChange={e => setFile(e.target.files[0])} />
                <button type="submit">Загрузить</button>
            </form>
            <p>{massage}</p>
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