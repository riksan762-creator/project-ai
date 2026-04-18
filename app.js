const videoInput = document.getElementById('videoUrl');
const loader = document.getElementById('loader');

// 1. Fitur Paste
document.getElementById('btnPaste').addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        videoInput.value = text;
    } catch (e) { videoInput.focus(); }
});

// 2. Fitur Download (Hanya untuk Preview & Simpan)
document.getElementById('btnDownload').addEventListener('click', async () => {
    const url = videoInput.value.trim();
    if(!url) return alert("Tempel link videonya dulu!");
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
        } else { alert("Video tidak ditemukan."); }
    } catch (e) { alert("Error koneksi."); }
    hideLoader();
});

// 3. Fitur Bedah Isi (LOGIKA AUTO-FIX UNTUK TIKTOK)
document.getElementById('btnAi').addEventListener('click', async () => {
    const url = videoInput.value.trim();
    if(!url) return alert("Masukkan link video!");

    showLoader("Mengekstrak File & Menganalisis...");
    
    try {
        // STEP 1: Ambil link .mp4 asli dari TikWM (Agar tidak error text/html)
        const tikRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const tikJson = await tikRes.json();
        
        if (!tikJson.data || !tikJson.data.play) {
            throw new Error("Gagal mengambil file video asli. Pastikan link TikTok benar.");
        }

        const directVideoUrl = tikJson.data.play; // Ini link file murni

        // STEP 2: Kirim link file murni ke Backend AI
        const aiRes = await fetch('/api/process-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audio_url: directVideoUrl, // PENTING: Mengirim file, bukan link web
                speech_models: ["universal-3-pro", "universal-2"],
                language_detection: true,
                summarization: true,
                summary_model: "informative",
                summary_type: "bullets"
            })
        });
        
        const initialData = await aiRes.json();
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
                alert("AI Gagal: " + (data.error || "Cek link video."));
                hideLoader();
            }
        } catch (e) { clearInterval(interval); }
    }, 3000);
}

function showAiResult(data) {
    hideLoader();
    document.getElementById('videoResult').classList.add('hidden');
    document.getElementById('aiResult').classList.remove('hidden');
    const summaryBox = document.getElementById('aiSummary');
    // Menampilkan summary jika ada, jika tidak tampilkan text transkrip
    summaryBox.innerText = data.summary || data.text || "Hasil tidak tersedia.";
}

function showLoader(text) {
    document.getElementById('loaderText').innerText = text;
    loader.classList.remove('hidden');
}
function hideLoader() { loader.classList.add('hidden'); }
