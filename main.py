import os
import telebot
import google.generativeai as genai

# المفاتيح (حطها جوه Environment Variables في الموقع أفضل)
TOKEN = "8390087750:AAH-Ho8Fn30Y4VzkN1iiq4f52ufeDMJUj10"
G_KEY = "AIzaSyDEKVqnMmakL6wZtmxOUVdbRiNnMPJMPd8"

bot = telebot.TeleBot(TOKEN)
genai.configure(api_key=G_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

@bot.message_handler(content_types=['photo'])
def handle(message):
    try:
        # تحميل ومعالجة
        raw = bot.download_file(bot.get_file(message.photo[-1].file_id).file_path)
        with open("img.jpg", "wb") as f: f.write(raw)
        
        # ذكاء اصطناعي
        res = model.generate_content([genai.upload_file("img.jpg"), "لخص الصورة"])
        bot.reply_to(message, res.text)
    except Exception as e:
        bot.reply_to(message, str(e))

# تشغيل مستمر
if __name__ == "__main__":
    bot.infinity_polling()
