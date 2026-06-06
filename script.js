// تحويل ملف الصورة إلى صيغة Base64 ليفهمها الـ API
function fileToGenerativePart(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64Data = reader.result.split(',')[1];
            resolve({
                inlineData: { data: base64Data, mimeType: file.type },
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function processImage() {
    const imageFile = document.getElementById('imageUpload').files[0];
    const statusArea = document.getElementById('statusArea');
    const submitBtn = document.getElementById('submitBtn');

    if (!imageFile) {
        showStatus("❌ يرجى اختيار صورة الأسئلة أولاً!", "error");
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerText = "جاري قراءة وتحليل الصورة... 🧠";
    showStatus("يتم الآن استدعاء الذكاء الاصطناعي لتحليل ورقة الأسئلة...", "loading");

    try {
        // 1. تحضير الصورة والبرومبت الحصين لمنع أخطاء الرموز والأسئلة الفارغة
        const imagePart = await fileToGenerativePart(imageFile);
        
        const systemPrompt = `أنت مساعد ذكاء اصطناعي خبير في تحليل أوراق الاختبارات التعليمية (OCR). اقرأ الصورة المرفقة واستخرج الأسئلة والاختيارات بدقة عالية وحولها لكائن JSON نقي تماماً بدون أي مقدمات أو شروحات جانبية.
        يجب استخدام الهيكل التالي للـ JSON:
        {
          "title": "عنوان الاختبار المستنتج"،
          "questions": [
            {
              "question_text": "نص السؤال (قم بتحويل الرموز الرياضية المعقدة مثل القسمة إلى نصوص أو رموز بسيطة مثل '/')",
              "choices": ["الاختيار 1", "الاختيار 2", "الاختيار 3", "الاختيار 4"],
              "correct_answer": "نص الإجابة الصحيحة المطابق تماماً لأحد الاختيارات، وإذا لم تكن هناك إجابة واضحة ومحلولة في الصورة اترك الحقل فارغاً هكذا ''"
            }
          ]
        }`;

        // 2. هنا نقوم باستدعاء الـ API من Netlify Functions لتأمين المفاتيح
        // قمنا بتحويل المسار ليكون ديناميكياً وآمناً
        const response = await fetch('/.netlify/functions/process-quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: systemPrompt,
                image: imagePart
            })
        });

        const result = await response.json();

        if (result.status === "success") {
            showStatus(`
                🎉 تم إنشاء الاختبار بنجاح!<br><br>
                <a href="${result.formUrl}" target="_blank">📝 اضغط هنا لتعديل وفحص الاختبار</a><br><br>
                <a href="${result.publishedUrl}" target="_blank">🔗 اضغط هنا لرابط حل الطلاب</a>
            `, "success");
        } else {
            showStatus("❌ حدث خطأ: " + result.message, "error");
        }

    } catch (error) {
        showStatus("❌ حدث خطأ أثناء الاتصال: " + error.message, "error");
        console.error(error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = "بدء المعالجة والإنشاء 🚀";
    }
}

function showStatus(message, type) {
    statusArea.style.display = "block";
    statusArea.innerHTML = message;
    statusArea.className = type;
}
