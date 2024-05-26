const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();

const cors = require('cors');

app.use(bodyParser.json());
app.use(cors());

class Database {
    constructor(dbFilePath) {
        this.dbFilePath = dbFilePath;
        this.db = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbFilePath, (err) => {
                if (err) {
                    console.error('Не получилось подключение к базе данных', err);
                    reject(err);
                } else {
                    console.log('Подключено к базе данных');
                    resolve(this.db);
                }
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Не удалось отключиться от базы данных', err);
                        reject(err);
                    } else {
                        console.log('Отключено от базы данных');
                        resolve();
                    }
                });
            } else {
                console.log('Нет соединения с базой данных');
                resolve();
            }
        });
    }

    createStatement(query) {
        return this.db.prepare(query, (err, stmt) => {
            if (err) {
                console.error('Ошибка при создании statement', err);
                reject(err);
            } else {
                return stmt;
            }
        });
    }
}

const db = new Database('E:\\Айин\\ИТМО\\ДИПЛОМНОЕ ПРОЕКТИРОВАНИЕ\\project_dictionary\\Chinook.db');

// 1. Добавить слова
app.post('/add/words', async (req, res) => {
    // 1.1 получить данные
    const { word, translation } = req.body;

    if (!word || !translation) {
        return res.status(400).json({ error: 'слово и его перевод не могут быть пустыми' });
    }

    try {
        // 1.2 соединение с базой данных
        await db.connect();
        // 1.3 подготовить данные для вставки
        const stmt = await db.createStatement('INSERT INTO Words (word, translation) VALUES (?, ?)');
        // 1.4 добавить данные в базу данных
        await stmt.run([word, translation]);
        await stmt.finalize();

        console.log('Добавлено слово');
        res.status(200).json({ message: 'Добавлено слово' });
        
    } catch (error) {
        console.error('Ошибка при добавлении слова в базу данных:', error);
        res.status(500).json({ error: 'Ошибка при добавлении слова в базу данных' });
    } 
});

// 2. Удалить слова
app.delete('/del/words/:id', async (req, res) => {
    // 2.1 получить id слова, которое нужно удалить
    const id = req.params.id;
    try {
        // 2.2 соединение с базой данных
        await db.connect();
        // 2.3 подготовить данные для удаления
        const stmt = await db.createStatement('DELETE FROM Words WHERE id = ?');
        // 2.4 удалить данные из базы данных
        await stmt.run([id]);
        await stmt.finalize();
    
        console.log('Удалено слово');
        res.status(200).json({ message: 'Удалено слово' });
    } catch (error) {
        console.error('Ошибка при удалении слова из базы данных:', error);
        res.status(500).json({ error: 'Ошибка при удалении слова из базы данных' });
    }
})

// 3. Получить список слов 
app.get('/get/words', async (req, res) => {
    try {
        // 3.1 соединение с базой данных
        await db.connect()
        // 3.2 подготовить данные для получения
        const stmt = await db.createStatement('SELECT * FROM Words');
        // 3.3 получить все данные из базы данных
        stmt.all((err, rows) => {
            if (err) {
                console.error('Ошибка при получении слов из базы данных:', err);
                res.status(500).json({ error: 'Ошибка при получении слов из базы данных' });
            } else {
                console.log('Получен список слов:', rows);
                res.status(200).json({ message: 'Получен список слов', data: rows });
            }
        })
    } catch (error) {
        console.error('Ошибка при получении слов из базы данных:', error);
        res.status(500).json({ error: 'Ошибка при получении слов из базы данных' });
    }
})

// 4. Выделить слова, которые не нужно повторить
app.patch('/repeat/words/:id', async (req, res) => {
    // 4.1 получить id слова, которое не нужно повторить
    const id = req.params.id
    try {
        // 4.2 соединение с базой данных
        await db.connect()
        // 4.2 подготовить данные для изменения repeat value
        const stmt = await db.createStatement('UPDATE Words Set repeat = 0 Where id = ?');
        await stmt.run([id]);
        await stmt.finalize();

        console.log('Слово запомнено');
        res.status(200).json({ message: 'Слово запомнено' });
    } catch (error) {
        console.error('Ошибка при отметки слова для повторения:', error);
        res.status(500).json({ error: 'Ошибка при отметки слова для повторения' });
    }
})

// 5. Заново поставить repeat = 1 для всех слов
app.put('/repeat/again/words', async (req, res) => {
    try {
        await db.connect();
        const stmt = await db.createStatement('UPDATE Words Set repeat = ?');
        await stmt.run([1]);
        await stmt.finalize();

        console.log('Все слова можно заново повторять');
        res.status(200).json({ message: 'Все слова можно заново повторять' });     
    } catch (error) {
        console.error('Ошибка при отметки всех слов для повторения:', error);
        res.status(500).json({ error: 'Ошибка при отметки всех слов для повторения' });
    }
})


app.listen(3000, () => {
    console.log('Сервер запущен на порту 3000');
});
