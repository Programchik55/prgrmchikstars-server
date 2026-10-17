const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Подключение к MongoDB (замени на свою ссылку из Шага 1)
const MONGO_URI = process.env.MONGO_URI || "ТВОЯ_ССЫЛКА_ИЗ_MONGODB";
mongoose.connect(MONGO_URI)
  .then(() => console.log("БД подключена"))
  .catch(err => console.error("Ошибка БД:", err));

// Схема пользователя
const UserSchema = new mongoose.Schema({
    telegramId: { type: String, required: true, unique: true },
    balance: { type: Number, default: 0 }
});
const User = mongoose.model('User', UserSchema);

// 1. Ссылка для Adsgram (Reward URL / Postback)
// Adsgram отправляет GET или POST запрос при успешном просмотре
app.all('/api/adsgram-reward', async (req, res) => {
    try {
        const userId = req.query.userid || req.body.userid; // ID пользователя в Telegram
        const secret = req.query.secret || req.body.secret; // Твой секретный ключ из Adsgram (если настроен)

        if (!userId) {
            return res.status(400).send("No userId provided");
        }

        // Находим пользователя и добавляем +1 Star к балансу
        let user = await User.findOne({ telegramId: userId });
        if (!user) {
            user = new User({ telegramId: userId, balance: 1 });
        } else {
            user.balance += 1;
        }
        await user.save();

        console.log(`[Adsgram] Начислена 1 Star пользователю: ${userId}`);
        return res.status(200).send("OK");
    } catch (error) {
        console.error("Ошибка Postback:", error);
        return res.status(500).send("Server Error");
    }
});

// 2. Эндпоинт для Mini App (Получить баланс)
app.get('/api/get-balance/:id', async (req, res) => {
    let user = await User.findOne({ telegramId: req.params.id });
    if (!user) {
        user = new User({ telegramId: req.params.id, balance: 0 });
        await user.save();
    }
    res.json({ balance: user.balance });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
