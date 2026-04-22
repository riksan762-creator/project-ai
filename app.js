const videoInput = document.getElementById('videoUrl');
const loader = document.getElementById('loader');

// 1. Fitur Paste Pintar
document.getElementById('btnPaste').addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        videoInput.value = text;
    } catch (e) { videoInput.focus(); }
});

// 2. Logika Universal: Ambil Data Media
async function getMediaData(url) {
    if (url.includes('tiktok.com')) {
        const res = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
        const json = await res.json();
        if (!json.data) throw new Error("Video tidak ditemukan atau privat.");
        return {
            directUrl: json.data.play, // Ini link video mentah (.mp4)
            title: json.data.title || "TikTok Video",
            thumb: json.data.cover
        };
    } else {
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

// 3. Tombol Bedah Isi (LOGIKA BARU & PINTAR)
document.getElementById('btnAi').addEventListener('click', async () => {
    const url = videoInput.value.trim();
    if(!url) return alert("Tempel link videonya dulu!");

    showLoader("Mencari file mentah...");
    
    try {
        // STEP 1: Ambil directUrl dulu (Penting agar tidak Transcoding Failed)
        const media = await getMediaData(url);
        
        if(!media.directUrl) throw new Error("Gagal ambil file video.");

        showLoader("Riksan AI Menganalisis...");

        // STEP 2: Kirim directUrl ke Backend
        const aiRes = await fetch('/api/process-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio_url: media.directUrl })
        });
        
        const initialData = await aiRes.json();
        if(initialData.id) checkAiStatus(initialData.id);
        else throw new Error(initialData.error || "Gagal inisialisasi AI");

    } catch (e) {
        alert("Gagal: " + e.message);
        hideLoader();
    }
});

// 4. Cek Status Berkala
async function checkAiStatus(id) {
    const interval = setInterval(async () => {
        try {
            const res = await fetch(`/api/process-ai?id=${id}`);
            const data = await res.json();
            
            if (data.status === 'processing') {
                document.getElementById('loaderText').innerText = "Riksan AI sedang menyimpulkan...";
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

// 5. Tampilan Hasil
function showAiResult(data) {
    hideLoader();
    document.getElementById('videoResult').classList.add('hidden');
    document.getElementById('aiResult').classList.remove('hidden');
    
    const summaryBox = document.getElementById('aiSummary');
    const rawData = data.summary || data.text || "Tidak ada kesimpulan.";
    const points = rawData.split(/[•\n]/).filter(p => p.trim().length > 5);

    summaryBox.innerHTML = `
        <div class="space-y-6">
            <div class="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl">
                <h4 class="font-bold text-[10px] uppercase tracking-widest mb-1">🤖 Kesimpulan Riksan AI</h4>
                <p class="text-[13px] leading-relaxed opacity-90">AI telah berhasil membedah isi video untuk Anda.</p>
            </div>
            <div class="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
                <div class="space-y-4">
                    ${points.map(p => `
                        <div class="flex gap-3 border-l-4 border-indigo-500 pl-4 py-1">
                            <p class="text-slate-600 text-[13px] leading-relaxed">${p.trim()}.</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function showLoader(text) {
    document.getElementById('loaderText').innerText = text;
    loader.classList.remove('hidden');
}
function hideLoader() { loader.classList.add('hidden'); }
