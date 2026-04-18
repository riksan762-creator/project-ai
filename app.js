const videoInput = document.getElementById('videoUrl');
const loader = document.getElementById('loader');

// 1. Fitur Paste Pintar
document.getElementById('btnPaste').addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        videoInput.value = text;
    } catch (e) { videoInput.focus(); }
});

// 2. Logika Universal: Ambil Data Media (TikTok, YT, IG)
async function getMediaData(url) {
    // Gunakan Cobalt API karena mendukung multi-platform & bebas CORS jika lewat backend
    // Tapi untuk preview cepat, kita coba deteksi platform
    if (url.includes('tiktok.com')) {
        const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        return {
            directUrl: json.data.play,
            title: json.data.title || "TikTok Video",
            thumb: json.data.cover
        };
    } else {
        // Untuk YT & IG, kita panggil proxy backend kita agar tidak "Failed to Fetch"
        // Proxy ini nanti akan memanggil Cobalt API di sisi server
        const res = await fetch('/api/get-media', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url })
        });
        const json = await res.json();
        return {
            directUrl: json.url,
            title: "Media Terdeteksi",
            thumb: "https://cdn-icons-png.flaticon.com/512/1384/1384060.png"
        };
    }
}

// 3. Tombol Cari Video (Untuk Download & Preview)
document.getElementById('btnDownload').addEventListener('click', async () => {
    const url = videoInput.value.trim();
    if(!url) return alert("Tempel link videonya dulu!");
    
    showLoader("Mencari Media...");
    try {
        const media = await getMediaData(url);
        
        if(media.directUrl) {
            document.getElementById('thumb').src = media.thumb;
            document.getElementById('videoTitle').innerText = media.title;
            
            const downloadBtn = document.getElementById('finalDownload');
            
            // Fix Download untuk Safari/Chrome (Blob Method)
            downloadBtn.onclick = async (e) => {
                e.preventDefault();
                showLoader("Mengunduh File...");
                try {
                    const response = await fetch(media.directUrl);
                    const blob = await response.blob();
                    const blobUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = `RiksanProject-${Date.now()}.mp4`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } catch (err) { window.open(media.directUrl, '_blank'); }
                hideLoader();
            };

            document.getElementById('videoResult').classList.remove('hidden');
            document.getElementById('aiResult').classList.add('hidden');
        }
    } catch (e) { alert("Gagal memuat media. Cek link Anda."); }
    hideLoader();
});

// 4. Tombol Bedah Isi (AI Deep Analysis)
document.getElementById('btnAi').addEventListener('click', async () => {
    const url = videoInput.value.trim();
    if(!url) return alert("Masukkan link video!");

    showLoader("AI Sedang Menganalisis...");
    
    try {
        // Kirim URL mentah ke Backend. Biarkan Backend yang memproses download filenya
        // agar tidak terjadi "Failed to Fetch" di browser.
        const aiRes = await fetch('/api/process-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audio_url: url, // Backend akan otomatis membedah ini
                speech_models: ["universal-3-pro"],
                language_detection: true,
                summarization: true,
                summary_model: "informative",
                summary_type: "bullets"
            })
        });
        
        const initialData = await aiRes.json();
        if(initialData.id) checkAiStatus(initialData.id);
        else throw new Error(initialData.error || "Gagal inisialisasi AI");

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
                document.getElementById('loaderText').innerText = "Riksan AI sedang menyimpulkan isi...";
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

// 5. Tampilan Hasil AI (Rapih & Detail)
function showAiResult(data) {
    hideLoader();
    document.getElementById('videoResult').classList.add('hidden');
    document.getElementById('aiResult').classList.remove('hidden');
    
    const summaryBox = document.getElementById('aiSummary');
    const title = document.getElementById('videoTitle').innerText;

    // Memecah hasil AI menjadi poin-poin rapi
    const rawData = data.summary || data.text || "";
    const points = rawData.split(/[•\n]/).filter(p => p.trim().length > 10);

    summaryBox.innerHTML = `
        <div class="space-y-6">
            <div class="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl">
                <div class="flex items-center gap-2 mb-2">
                    <span class="text-lg">🤖</span>
                    <h4 class="font-bold text-[10px] uppercase tracking-widest">Kesimpulan Riksan AI</h4>
                </div>
                <p class="text-[13px] leading-relaxed opacity-90 italic">
                    "Video ini membahas <b>${title}</b>. AI telah menyaring percakapan penting dan merangkumnya khusus untuk Anda."
                </p>
            </div>

            <div class="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
                <h4 class="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span class="w-2 h-2 bg-red-500 rounded-full"></span> POIN-POIN UTAMA
                </h4>
                <div class="space-y-4">
                    ${points.map(p => `
                        <div class="flex gap-3 border-l-4 border-indigo-500 pl-4 py-1">
                            <p class="text-slate-600 text-[13px] leading-relaxed">${p.trim()}.</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="text-center opacity-20 text-[9px] font-bold uppercase tracking-[0.3em]">
                Riksan Project AI v2.0
            </div>
        </div>
    `;
}

function showLoader(text) {
    document.getElementById('loaderText').innerText = text;
    loader.classList.remove('hidden');
}
function hideLoader() { loader.classList.add('hidden'); }
