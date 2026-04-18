const videoInput = document.getElementById('videoUrl');
const loader = document.getElementById('loader');

// Fitur Paste Otomatis
document.getElementById('btnPaste').addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        videoInput.value = text;
    } catch (e) { videoInput.focus(); }
});

// Fitur Download Video (Multi-Platform)
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
    } catch (e) {
        alert("Error koneksi ke downloader.");
    }
    hideLoader();
});

// Fitur AI Content Factory (Versi Perbaikan Final)
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
                // Model Universal akan mendeteksi Bahasa Indonesia secara otomatis
                speech_models: ["universal-3-pro", "universal-2"], 
                auto_highlights: true,
                summarization: true,
                summary_type: "bullets"
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
                alert("AI mengalami gangguan: " + (data.error || "Proses gagal."));
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
    document.getElementById('aiSummary').innerText = data.summary || "Berhasil membedah isi konten.";
    
    const container = document.getElementById('aiHighlights');
    container.innerHTML = '<p class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Momen Penting:</p>';
    
    if (data.auto_highlights_result && data.auto_highlights_result.results) {
        data.auto_highlights_result.results.forEach(item => {
            const el = document.createElement('div');
            el.className = "bg-slate-50 p-3 rounded-xl border flex justify-between text-[11px] font-bold text-indigo-600 mb-2 slide-up";
            el.innerHTML = `<span># ${item.text}</span> <span class="text-slate-400">${(item.timestamps[0].start / 1000).toFixed(0)}s</span>`;
            container.appendChild(el);
        });
    }
}

function showLoader(text) {
    document.getElementById('loaderText').innerText = text;
    loader.classList.remove('hidden');
}
function hideLoader() { loader.classList.add('hidden'); }
