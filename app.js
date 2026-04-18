const videoInput = document.getElementById('videoUrl');
const loader = document.getElementById('loader');

// 1. Fitur Paste
document.getElementById('btnPaste').addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        videoInput.value = text;
    } catch (e) { videoInput.focus(); }
});

// 2. Fitur Download (Optimasi Safari & Chrome)
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
            
            downloadBtn.onclick = async (e) => {
                e.preventDefault();
                showLoader("Mengunduh File...");
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
                } catch (err) { window.open(videoUrl, '_blank'); }
                hideLoader();
            };
            document.getElementById('videoResult').classList.remove('hidden');
            document.getElementById('aiResult').classList.add('hidden');
        }
    } catch (e) { alert("Gagal mengambil data video."); }
    hideLoader();
});

// 3. Fitur Bedah Isi (Deep Analysis Mode)
document.getElementById('btnAi').addEventListener('click', async () => {
    const url = videoInput.value.trim();
    if(!url) return alert("Masukkan link video!");

    showLoader("Mengekstrak Media...");
    try {
        const tikRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const tikJson = await tikRes.json();
        if (!tikJson.data || !tikJson.data.play) throw new Error("Gagal ambil file video.");

        const directUrl = tikJson.data.play;

        const aiRes = await fetch('/api/process-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audio_url: directUrl,
                speech_models: ["universal-3-pro"], // Pakai model tertinggi
                language_detection: true,
                summarization: true,
                summary_model: "informative",
                summary_type: "bullets"
            })
        });
        
        const initialData = await aiRes.json();
        if(initialData.id) checkAiStatus(initialData.id);
        else throw new Error("Gagal inisialisasi AI");
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
                document.getElementById('loaderText').innerText = "Riksan AI sedang memahami konten...";
            }
            if (data.status === 'completed') {
                clearInterval(interval);
                showAiResult(data);
            }
        } catch (e) { clearInterval(interval); }
    }, 3000);
}

// 4. DISPLAY RESULT: GACOR, RAPIH, DETAIL
function showAiResult(data) {
    hideLoader();
    document.getElementById('videoResult').classList.add('hidden');
    document.getElementById('aiResult').classList.remove('hidden');
    
    const summaryBox = document.getElementById('aiSummary');
    const title = document.getElementById('videoTitle').innerText;

    // Bersihkan teks summary dari AI
    const rawData = data.summary || data.text || "";
    const points = rawData.split(/[•\n]/).filter(p => p.trim().length > 5);

    summaryBox.innerHTML = `
        <div class="space-y-5 animate-slide-up">
            <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 rounded-3xl text-white shadow-xl">
                <div class="flex items-center gap-2 mb-3">
                    <div class="bg-white/20 p-2 rounded-lg">🤖</div>
                    <h4 class="font-black text-xs uppercase tracking-[0.2em]">Kesimpulan Eksekutif</h4>
                </div>
                <p class="text-sm leading-relaxed font-medium">
                    Berdasarkan analisis mendalam, video <b>"${title}"</b> ini berfokus pada penyampaian pesan mengenai inti konten yang terstruktur. AI menyimpulkan bahwa informasi ini sangat relevan untuk dipahami secara cepat melalui poin-poin di bawah ini.
                </p>
            </div>

            <div class="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                <h4 class="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-5 flex items-center gap-2">
                    <span class="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span> Detail Poin Penting
                </h4>
                <div class="space-y-4">
                    ${points.map(p => `
                        <div class="flex gap-4 group">
                            <div class="flex-none w-1 h-auto bg-indigo-200 group-hover:bg-indigo-500 transition-colors rounded-full"></div>
                            <p class="text-slate-600 text-sm leading-relaxed">${p.trim()}</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="bg-white p-4 rounded-2xl border-2 border-dashed border-slate-100 text-center">
                <p class="text-[10px] text-slate-400 font-bold uppercase mb-1">Pesan Utama Konten:</p>
                <p class="text-indigo-600 text-xs font-bold italic">"${points[0] ? points[0].substring(0, 100) + '...' : 'Konten Informatif'}"</p>
            </div>
        </div>
    `;
}

function showLoader(text) {
    document.getElementById('loaderText').innerText = text;
    loader.classList.remove('hidden');
}
function hideLoader() { loader.classList.add('hidden'); }
