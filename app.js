const videoInput = document.getElementById('videoUrl');
const loader = document.getElementById('loader');

// 1. Fitur Paste Otomatis
document.getElementById('btnPaste').addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        videoInput.value = text;
    } catch (e) { videoInput.focus(); }
});

// 2. Fitur Download Video
document.getElementById('btnDownload').addEventListener('click', async () => {
    const url = videoInput.value.trim();
    if(!url) return alert("Tempel link videonya dulu, Bos!");

    showLoader("Mencari Video...");
    try {
        const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        if(json.data) {
            const v = json.data;
            document.getElementById('thumb').src = v.cover || v.thumbnail;
            document.getElementById('videoTitle').innerText = v.title || "Video Ditemukan";
            document.getElementById('finalDownload').href = v.play || v.url;
            document.getElementById('videoResult').classList.remove('hidden');
            document.getElementById('aiResult').classList.add('hidden');
        } else {
            alert("Video tidak ditemukan atau private.");
        }
    } catch (e) { alert("Error koneksi downloader."); }
    hideLoader();
});

// 3. Fitur AI (BEDAH ISI) - FIX 100% SESUAI DOKUMENTASI
document.getElementById('btnAi').addEventListener('click', async () => {
    const url = videoInput.value.trim();
    if(!url) return alert("Masukkan link video dulu!");

    showLoader("AI Sedang Membedah Konten...");
    try {
        const start = await fetch('/api/process-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audio_url: url,
                speech_model: "best",      // Gunakan 'best' agar summarization aktif
                language_code: "id",       // Paksa ke Bahasa Indonesia
                summarization: true,       // Aktifkan rangkuman
                summary_model: "informative",
                summary_type: "bullets"
            })
        });
        
        const initialData = await start.json();
        if(initialData.id) {
            checkAiStatus(initialData.id);
        } else {
            throw new Error(initialData.error || "Gagal inisialisasi AI");
        }
    } catch (e) {
        alert("Gagal: " + e.message);
        hideLoader();
    }
});

async function checkAiStatus(id) {
    const interval = setInterval(async () => {
        try {
            const res = await fetch(`/api/process-ai?id=${id}`);
            const data = await res.json();

            if (data.status === 'completed') {
                clearInterval(interval);
                showAiResult(data);
            } else if (data.status === 'error') {
                clearInterval(interval);
                alert("AI Gagal: " + (data.error || "Pastikan link video benar."));
                hideLoader();
            }
        } catch (e) {
            clearInterval(interval);
            hideLoader();
        }
    }, 3000);
}

function showAiResult(data) {
    hideLoader();
    document.getElementById('videoResult').classList.add('hidden');
    document.getElementById('aiResult').classList.remove('hidden');
    
    const summaryBox = document.getElementById('aiSummary');
    // Menampilkan hasil rangkuman dengan rapi
    summaryBox.innerHTML = `<div class="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-slate-700 leading-relaxed">
        ${data.summary ? data.summary.replace(/\n/g, '<br>') : 'Hasil tidak ditemukan.'}
    </div>`;
}

function showLoader(text) {
    document.getElementById('loaderText').innerText = text;
    loader.classList.remove('hidden');
}
function hideLoader() { loader.classList.add('hidden'); }
