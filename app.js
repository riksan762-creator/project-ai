const videoInput = document.getElementById('videoUrl');
const loader = document.getElementById('loader');

// Fitur Paste Otomatis
document.getElementById('btnPaste').addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        videoInput.value = text;
    } catch (e) { videoInput.focus(); }
});

// Fitur Download Video
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
            alert("Video tidak ditemukan.");
        }
    } catch (e) { alert("Error koneksi."); }
    hideLoader();
});

// Fitur AI Content Factory (FIX: Menambahkan summary_model)
document.getElementById('btnAi').addEventListener('click', async () => {
    const url = videoInput.value.trim();
    if(!url) return alert("Masukkan link video untuk dibedah!");

    showLoader("AI Sedang Menganalisis...");
    try {
        const start = await fetch('/api/process-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audio_url: url,
                speech_models: ["universal-3-pro", "universal-2"],
                summarization: true,
                summary_type: "bullets",
                summary_model: "informative" // TAMBAHKAN BARIS INI BIAR GA EROR
            })
        });
        
        const initialData = await start.json();
        if(initialData.id) {
            checkAiStatus(initialData.id);
        } else {
            throw new Error(initialData.error || initialData.message || "Gagal inisialisasi AI");
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
                alert("AI Gagal memproses.");
                hideLoader();
            }
        } catch (e) { clearInterval(interval); }
    }, 3000);
}

function showAiResult(data) {
    hideLoader();
    document.getElementById('videoResult').classList.add('hidden');
    document.getElementById('aiResult').classList.remove('hidden');
    document.getElementById('aiSummary').innerText = data.summary || "Berhasil membedah isi konten.";
    
    const container = document.getElementById('aiHighlights');
    container.innerHTML = '<p class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hasil Bedah AI:</p>';
    
    // Tampilkan rangkuman dalam format teks rapi
    const el = document.createElement('div');
    el.className = "bg-slate-50 p-4 rounded-xl border text-[13px] text-slate-700 leading-relaxed slide-up";
    el.innerText = data.summary;
    container.appendChild(el);
}

function showLoader(text) {
    document.getElementById('loaderText').innerText = text;
    loader.classList.remove('hidden');
}
function hideLoader() { loader.classList.add('hidden'); }
