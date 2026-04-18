const videoInput = document.getElementById('videoUrl');
const loader = document.getElementById('loader');

// 1. Fitur Paste Otomatis
document.getElementById('btnPaste').addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        videoInput.value = text;
    } catch (e) { videoInput.focus(); }
});

// 2. Fitur Download Video (TikWM API)
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
            alert("Video tidak ditemukan. Pastikan link benar.");
        }
    } catch (e) {
        alert("Error koneksi ke downloader.");
    }
    hideLoader();
});

// 3. Fitur AI (BEDAH ISI) - FIXED SESUAI DOKUMENTASI TERBARU
document.getElementById('btnAi').addEventListener('click', async () => {
    const url = videoInput.value.trim();
    if(!url) return alert("Masukkan link video untuk dibedah!");

    showLoader("AI Sedang Membedah Konten...");
    try {
        const start = await fetch('/api/process-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audio_url: url,
                // Perbaikan Utama: Menggunakan format Plural & Array sesuai screenshot error
                speech_models: ["universal-3-pro", "universal-2"], 
                language_detection: true, 
                summarization: true,
                summary_model: "informative",
                summary_type: "bullets"
            })
        });
        
        const initialData = await start.json();
        if(initialData.id) {
            checkAiStatus(initialData.id);
        } else {
            // Menangkap pesan error detail dari server
            throw new Error(initialData.error || initialData.message || "Gagal inisialisasi AI");
        }
    } catch (e) {
        alert("Gagal: " + e.message);
        hideLoader();
    }
});

// 4. Fungsi Polling (Cek Status AI)
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
                alert("AI Gagal: " + (data.error || "Proses gagal."));
                hideLoader();
            }
        } catch (e) {
            clearInterval(interval);
            hideLoader();
        }
    }, 3000); // Cek setiap 3 detik sesuai standar dokumen
}

// 5. Menampilkan Hasil Bedah AI
function showAiResult(data) {
    hideLoader();
    document.getElementById('videoResult').classList.add('hidden');
    document.getElementById('aiResult').classList.remove('hidden');
    
    const summaryBox = document.getElementById('aiSummary');
    // Jika summarization aktif, tampilkan summary. Jika tidak, tampilkan transkrip teks biasa.
    summaryBox.innerHTML = `
        <div class="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 text-slate-700 text-sm leading-relaxed slide-up">
            ${data.summary ? data.summary.replace(/\n/g, '<br>') : (data.text || "Hasil tidak tersedia.")}
        </div>
    `;
}

// Helper: Tampilkan/Sembunyikan Loader
function showLoader(text) {
    document.getElementById('loaderText').innerText = text;
    loader.classList.remove('hidden');
}
function hideLoader() { loader.classList.add('hidden'); }
