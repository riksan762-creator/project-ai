const videoInput = document.getElementById('videoUrl');
const loader = document.getElementById('loader');

// 1. Fitur Paste Pintar
document.getElementById('btnPaste').addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        videoInput.value = text;
    } catch (e) { videoInput.focus(); }
});

// 2. Fitur Download (Universal: TikTok, YT, IG)
document.getElementById('btnDownload').addEventListener('click', async () => {
    const url = videoInput.value.trim();
    if(!url) return alert("Tempel link videonya dulu!");
    
    showLoader("Mencari Media...");
    try {
        let finalMediaUrl = "";
        let title = "Video Ditemukan";

        if (url.includes('tiktok.com')) {
            const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
            const json = await res.json();
            finalMediaUrl = json.data.play;
            title = json.data.title || "TikTok Video";
            document.getElementById('thumb').src = json.data.cover;
        } 
        else if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('instagram.com')) {
            // Pakai Cobalt API untuk YT & IG
            const res = await fetch('https://api.cobalt.tools/api/json', {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url, videoQuality: '720' })
            });
            const json = await res.json();
            if(json.url) {
                finalMediaUrl = json.url;
                document.getElementById('thumb').src = "https://cdn-icons-png.flaticon.com/512/1384/1384060.png"; // Placeholder
            } else { throw new Error("Gagal mengambil data dari YouTube/IG."); }
        }

        if(finalMediaUrl) {
            document.getElementById('videoTitle').innerText = title;
            const downloadBtn = document.getElementById('finalDownload');
            
            downloadBtn.onclick = async (e) => {
                e.preventDefault();
                showLoader("Menyiapkan File...");
                try {
                    const response = await fetch(finalMediaUrl);
                    const blob = await response.blob();
                    const blobUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = blobUrl;
                    a.download = `RiksanProject-${Date.now()}.mp4`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                } catch (err) { window.open(finalMediaUrl, '_blank'); }
                hideLoader();
            };

            document.getElementById('videoResult').classList.remove('hidden');
            document.getElementById('aiResult').classList.add('hidden');
        }
    } catch (e) { alert("Error: " + e.message); }
    hideLoader();
});

// 3. Fitur Bedah Isi (Deep Analysis Universal)
document.getElementById('btnAi').addEventListener('click', async () => {
    const url = videoInput.value.trim();
    if(!url) return alert("Masukkan link video!");

    showLoader("Mengekstrak Media...");
    
    try {
        let directUrl = "";

        // LOGIKA EXTRACTION MEDIA
        if (url.includes('tiktok.com')) {
            const tikRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
            const tikJson = await tikRes.json();
            directUrl = tikJson.data.play;
        } else {
            // Gunakan Cobalt untuk ambil audio saja (biar analisis AI lebih cepat)
            const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url, downloadMode: 'audio', audioFormat: 'mp3' })
            });
            const cobaltJson = await cobaltRes.json();
            directUrl = cobaltJson.url;
        }

        if (!directUrl) throw new Error("Gagal mengambil file media asli.");

        // KIRIM KE BACKEND AI
        showLoader("AI Sedang Menganalisis...");
        const aiRes = await fetch('/api/process-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audio_url: directUrl,
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
                document.getElementById('loaderText').innerText = "AI sedang menyusun poin penting...";
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

// 4. TAMPILAN PREMIUM
function showAiResult(data) {
    hideLoader();
    document.getElementById('videoResult').classList.add('hidden');
    document.getElementById('aiResult').classList.remove('hidden');
    
    const summaryBox = document.getElementById('aiSummary');
    const videoTitle = document.getElementById('videoTitle').innerText;

    summaryBox.innerHTML = `
        <div class="space-y-6">
            <div class="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl">
                <div class="flex items-center gap-2 mb-3">
                    <span class="bg-white/20 p-2 rounded-xl">🤖</span>
                    <h4 class="font-bold text-xs uppercase tracking-widest">Kesimpulan Riksan AI</h4>
                </div>
                <p class="text-sm leading-relaxed opacity-95">
                    Analisis mendalam untuk konten <b>"${videoTitle}"</b> telah selesai. 
                    AI kami menyimpulkan bahwa isi media ini berfokus pada informasi strategis yang bisa Anda pelajari melalui poin-poin di bawah ini tanpa harus menonton seluruh durasi.
                </p>
            </div>

            <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <h4 class="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-5 flex items-center gap-2">
                    <span class="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> POTONGAN POIN PENTING
                </h4>
                <div class="space-y-4">
                    ${formatBullets(data.summary || data.text)}
                </div>
            </div>

            <div class="text-center opacity-30 text-[9px] font-bold uppercase tracking-widest">
                Riksan Project • 2026
            </div>
        </div>
    `;
}

function formatBullets(text) {
    if(!text) return "Isi tidak tersedia.";
    const sentences = text.split(/[•\n]/).filter(s => s.trim().length > 10);
    return sentences.map(s => `
        <div class="flex gap-4 border-l-2 border-indigo-100 pl-4 hover:border-indigo-500 transition-all">
            <p class="text-slate-600 text-[13px] leading-relaxed">${s.trim()}.</p>
        </div>
    `).join('');
}

function showLoader(text) {
    document.getElementById('loaderText').innerText = text;
    loader.classList.remove('hidden');
}
function hideLoader() { loader.classList.add('hidden'); }
