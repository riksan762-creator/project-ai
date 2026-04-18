const videoInput = document.getElementById('videoUrl');
const loader = document.getElementById('loader');

// 1. Fitur Paste Pintar
document.getElementById('btnPaste').addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        videoInput.value = text;
    } catch (e) { videoInput.focus(); }
});

// 2. Fitur Download (Fix for Safari & Chrome)
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
            
            // Link Download Langsung
            const downloadBtn = document.getElementById('finalDownload');
            const videoUrl = v.play || v.url;
            
            // Trick agar Safari bisa download (Blob Method)
            downloadBtn.onclick = async (e) => {
                e.preventDefault();
                showLoader("Menyiapkan File...");
                try {
                    const response = await fetch(videoUrl);
                    const blob = await response.blob();
                    const blobUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = `RiksanProject-${Date.now()}.mp4`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } catch (err) {
                    window.open(videoUrl, '_blank'); // Fallback
                }
                hideLoader();
            };

            document.getElementById('videoResult').classList.remove('hidden');
            document.getElementById('aiResult').classList.add('hidden');
        } else { alert("Video tidak ditemukan."); }
    } catch (e) { alert("Error koneksi."); }
    hideLoader();
});

// 3. Fitur Bedah Isi (Logic High-Level)
document.getElementById('btnAi').addEventListener('click', async () => {
    const url = videoInput.value.trim();
    if(!url) return alert("Masukkan link video!");

    showLoader("AI Sedang Menganalisis...");
    
    try {
        // Step 1: Ambil media mentah
        const tikRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const tikJson = await tikRes.json();
        
        if (!tikJson.data || !tikJson.data.play) {
            throw new Error("Gagal mengekstrak video. Cek linknya lagi.");
        }

        const directVideoUrl = tikJson.data.play;

        // Step 2: Kirim ke AssemblyAI via Backend
        const aiRes = await fetch('/api/process-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audio_url: directVideoUrl,
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
            
            if (data.status === 'processing') {
                showLoader("AI Sedang Merangkum...");
            }

            if (data.status === 'completed') {
                clearInterval(interval);
                showAiResult(data);
            } else if (data.status === 'error') {
                clearInterval(interval);
                alert("AI Gagal: " + data.error);
                hideLoader();
            }
        } catch (e) { clearInterval(interval); }
    }, 3000);
}

// 4. Tampilan Hasil Bedah Isi (Premium Style)
function showAiResult(data) {
    hideLoader();
    document.getElementById('videoResult').classList.add('hidden');
    document.getElementById('aiResult').classList.remove('hidden');
    
    const summaryBox = document.getElementById('aiSummary');
    
    // Logika Kesimpulan Video
    const rawSummary = data.summary || data.text || "Gagal merangkum.";
    const titleVideo = document.getElementById('videoTitle').innerText;

    summaryBox.innerHTML = `
        <div class="space-y-4 animate-fade-in">
            <div class="bg-indigo-600/10 p-3 rounded-xl border border-indigo-500/20">
                <h4 class="text-indigo-600 font-bold text-xs uppercase tracking-widest mb-1">📌 Kesimpulan Riksan AI</h4>
                <p class="text-slate-700 text-sm font-medium">Video ini membahas tentang "${titleVideo}".</p>
            </div>
            
            <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <h4 class="text-slate-400 text-[10px] font-bold uppercase mb-3">Insight Utama:</h4>
                <div class="text-slate-600 text-sm leading-relaxed">
                    ${rawSummary.replace(/\n/g, '<br>')}
                </div>
            </div>
            
            <div class="flex items-center justify-between px-2">
                <span class="text-[9px] text-slate-400">Model: Universal-3-Pro</span>
                <button onclick="location.reload()" class="text-[9px] text-indigo-500 font-bold uppercase">Bedah Video Lain</button>
            </div>
        </div>
    `;
}

function showLoader(text) {
    document.getElementById('loaderText').innerText = text;
    loader.classList.remove('hidden');
}
function hideLoader() { loader.classList.add('hidden'); }
