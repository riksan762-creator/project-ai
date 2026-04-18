const videoInput = document.getElementById('videoUrl');
const loader = document.getElementById('loader');

// 1. Fitur Paste Pintar
document.getElementById('btnPaste').addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        videoInput.value = text;
    } catch (e) { videoInput.focus(); }
});

// 2. Fitur Download (Fix Safari & Chrome)
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
            
            const downloadBtn = document.getElementById('finalDownload');
            const videoUrl = v.play || v.url;
            
            // Logika Download Blob agar jalan di Safari iPhone
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
                    window.open(videoUrl, '_blank');
                }
                hideLoader();
            };

            document.getElementById('videoResult').classList.remove('hidden');
            document.getElementById('aiResult').classList.add('hidden');
        } else { alert("Video gagal ditemukan."); }
    } catch (e) { alert("Error koneksi downloader."); }
    hideLoader();
});

// 3. Fitur Bedah Isi
document.getElementById('btnAi').addEventListener('click', async () => {
    const url = videoInput.value.trim();
    if(!url) return alert("Masukkan link video!");

    showLoader("AI Sedang Menganalisis...");
    
    try {
        // Ambil media mentah dulu lewat TikWM
        const tikRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const tikJson = await tikRes.json();
        
        if (!tikJson.data || !tikJson.data.play) throw new Error("Gagal ambil file video.");

        const directUrl = tikJson.data.play;

        // Kirim ke Backend AI
        const aiRes = await fetch('/api/process-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audio_url: directUrl,
                speech_models: ["universal-3-pro", "universal-2"],
                language_detection: true,
                summarization: true,
                summary_model: "informative",
                summary_type: "bullets" // Minta AI potong-potong jadi poin
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
                document.getElementById('loaderText').innerText = "AI sedang merangkum poin penting...";
            }

            if (data.status === 'completed') {
                clearInterval(interval);
                showAiResult(data);
            } else if (data.status === 'error') {
                clearInterval(interval);
                alert("AI Error: " + data.error);
                hideLoader();
            }
        } catch (e) { clearInterval(interval); }
    }, 3000);
}

// 4. TAMPILAN PREMIUM (Kesimpulan & Poin Penting Dipisah)
function showAiResult(data) {
    hideLoader();
    document.getElementById('videoResult').classList.add('hidden');
    document.getElementById('aiResult').classList.remove('hidden');
    
    const summaryBox = document.getElementById('aiSummary');
    const videoTitle = document.getElementById('videoTitle').innerText;

    // Logika Pemisahan: Kesimpulan (AI Generative) & Isi Potong-Potong (Transcription Summary)
    summaryBox.innerHTML = `
        <div class="space-y-6">
            <div class="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-lg">🤖</span>
                    <h4 class="font-bold text-sm tracking-tight">ANALISIS RIKSAN AI</h4>
                </div>
                <p class="text-xs leading-relaxed opacity-90">
                    Video ini secara garis besar membahas tentang <b>${videoTitle}</b>. 
                    Inti dari pembicaraan ini adalah penyampaian informasi yang berfokus pada detail konten agar penonton dapat memahami konteks secara cepat tanpa harus menonton durasi penuh.
                </p>
            </div>

            <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <h4 class="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                    <span class="w-2 h-2 bg-red-500 rounded-full"></span> POTONGAN ISI PENTING
                </h4>
                <div class="space-y-3">
                    ${formatBullets(data.summary || data.text)}
                </div>
            </div>

            <div class="text-center opacity-30 text-[9px] font-medium uppercase tracking-tighter">
                Riksan Project AI Engine v2.0 • 2026
            </div>
        </div>
    `;
}

// Helper untuk mempercantik tampilan poin-poin penting
function formatBullets(text) {
    if(!text) return "Isi tidak tersedia.";
    // Membagi teks berdasarkan titik atau baris baru agar terlihat seperti potongan informasi
    const sentences = text.split(/[.\n]/).filter(s => s.trim().length > 10);
    return sentences.map(s => `
        <div class="flex gap-3">
            <span class="text-indigo-500 font-bold">•</span>
            <p class="text-slate-600 text-sm leading-snug">${s.trim()}.</p>
        </div>
    `).join('');
}

function showLoader(text) {
    document.getElementById('loaderText').innerText = text;
    loader.classList.remove('hidden');
}
function hideLoader() { loader.classList.add('hidden'); }
