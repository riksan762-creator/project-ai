const videoInput = document.getElementById('videoUrl');
const loader = document.getElementById('loader');

// 1. Fitur Paste
document.getElementById('btnPaste').addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        videoInput.value = text;
    } catch (e) { videoInput.focus(); }
});

// 2. Fitur Download (TikTok Only)
document.getElementById('btnDownload').addEventListener('click', async () => {
    const url = videoInput.value.trim();
    if(!url) return alert("Tempel link videonya dulu!");
    
    if(url.includes('youtube.com') || url.includes('youtu.be')) {
        return alert("Fitur Download saat ini fokus ke TikTok. Untuk YouTube, silakan langsung klik 'Bedah Isi'!");
    }

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

// 3. Fitur Bedah Isi (Support TikTok & YouTube)
document.getElementById('btnAi').addEventListener('click', async () => {
    const url = videoInput.value.trim();
    if(!url) return alert("Masukkan link video!");

    showLoader("Menyiapkan Bedah Isi (Podcast Mode)...");
    
    try {
        let finalMediaUrl = url;

        // LOGIKA DETEKSI TIKTOK
        if (url.includes('tiktok.com')) {
            const tikRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
            const tikJson = await tikRes.json();
            if (tikJson.data && tikJson.data.play) {
                finalMediaUrl = tikJson.data.play;
            } else {
                throw new Error("Gagal mengekstrak video TikTok.");
            }
        } 
        // LOGIKA DETEKSI YOUTUBE
        else if (url.includes('youtube.com') || url.includes('youtu.be')) {
            // Catatan: AssemblyAI butuh link stream. 
            // Untuk YouTube, kita kirim linknya langsung, biarkan API Backend/AssemblyAI yang menghandle.
            finalMediaUrl = url; 
        }

        // KIRIM KE BACKEND AI
        const aiRes = await fetch('/api/process-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audio_url: finalMediaUrl,
                speech_models: ["universal-3-pro", "universal-2"],
                language_detection: true,
                // SETTING KHUSUS PODCAST (Agar hasilnya lebih dalam)
                summarization: true,
                summary_model: "informative",
                summary_type: "bullets" // Hasil berupa poin-poin penting
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
            
            // Berikan update teks di loader agar user tahu AI sedang bekerja
            if(data.status === 'processing') {
                document.getElementById('loaderText').innerText = "AI sedang mendengarkan podcast...";
            }

            if (data.status === 'completed') {
                clearInterval(interval);
                showAiResult(data);
            } else if (data.status === 'error') {
                clearInterval(interval);
                alert("AI Gagal Bedah Podcast: " + (data.error || "Durasi terlalu panjang atau link tidak didukung."));
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

    // Tampilan Khusus Bedah Isi ala Podcast
    const summaryHTML = `
        <div class="space-y-4">
            <div class="flex items-center gap-2 mb-2">
                <span class="bg-red-500 text-white text-[10px] px-2 py-1 rounded-full uppercase font-bold">Podcast Summary</span>
                <span class="text-slate-400 text-[10px]">Bedah Isi By Riksan AI</span>
            </div>
            <div class="text-slate-700 text-sm leading-relaxed border-l-4 border-red-500 pl-4">
                ${data.summary ? data.summary.replace(/\n/g, '<br>') : "AI tidak menemukan poin penting."}
            </div>
            <div class="mt-4 pt-4 border-t border-dashed border-slate-200">
                <p class="text-[11px] text-slate-400 italic font-medium">Kesimpulan Otomatis Berdasarkan Model Universal-3-Pro</p>
            </div>
        </div>
    `;
    summaryBox.innerHTML = summaryHTML;
}

function showLoader(text) {
    document.getElementById('loaderText').innerText = text;
    loader.classList.remove('hidden');
}
function hideLoader() { loader.classList.add('hidden'); }
