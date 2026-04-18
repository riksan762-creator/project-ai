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
        } else { alert("Video tidak ditemukan."); }
    } catch (e) { alert("Error koneksi."); }
    hideLoader();
});

// 3. Fitur Bedah Isi (Support YouTube & TikTok)
document.getElementById('btnAi').addEventListener('click', async () => {
    const url = videoInput.value.trim();
    if(!url) return alert("Masukkan link video/podcast!");

    showLoader("Mengekstrak Media...");
    
    try {
        let finalMediaUrl = "";

        // JEMBATAN TIKTOK (TikWM)
        if (url.includes('tiktok.com')) {
            const tikRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
            const tikJson = await tikRes.json();
            if (tikJson.data && tikJson.data.play) {
                finalMediaUrl = tikJson.data.play;
            } else { throw new Error("Gagal ambil video TikTok."); }
        } 
        // JEMBATAN YOUTUBE (Cobalt API)
        else if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    url: url,
                    downloadMode: 'audio', // Ambil audio saja biar cepat & hemat
                    audioFormat: 'mp3'
                })
            });
            const cobaltJson = await cobaltRes.json();
            if (cobaltJson.url) {
                finalMediaUrl = cobaltJson.url;
            } else { throw new Error("YouTube API sedang sibuk, coba lagi nanti."); }
        } else {
            throw new Error("Link tidak didukung. Gunakan TikTok atau YouTube.");
        }

        // KIRIM KE BACKEND AI
        showLoader("AI Sedang Mendengarkan...");
        const aiRes = await fetch('/api/process-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                audio_url: finalMediaUrl,
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
    
    // Tampilan ala Podcast Summary
    summaryBox.innerHTML = `
        <div class="border-l-4 border-red-500 pl-4 py-1">
            <p class="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-2">Podcast Insight</p>
            <div class="text-slate-700 text-sm leading-relaxed">
                ${data.summary ? data.summary.replace(/\n/g, '<br>') : data.text}
            </div>
        </div>
    `;
}

function showLoader(text) {
    document.getElementById('loaderText').innerText = text;
    loader.classList.remove('hidden');
}
function hideLoader() { loader.classList.add('hidden'); }
