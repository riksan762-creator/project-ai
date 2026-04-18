const videoInput = document.getElementById('videoUrl');
const loader = document.getElementById('loader');

// 1. Fitur Paste
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
            
            // Link download menggunakan metode Blob agar support Safari iOS
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
                } catch (err) { window.open(videoUrl, '_blank'); }
                hideLoader();
            };
            document.getElementById('videoResult').classList.remove('hidden');
            document.getElementById('aiResult').classList.add('hidden');
        }
    } catch (e) { alert("Error koneksi."); }
    hideLoader();
});

// 3. Fitur Bedah Isi (Deep Analysis Logic)
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
                speech_models: ["universal-3-pro"], // Pakai model paling cerdas
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
                document.getElementById('loaderText').innerText = "Riksan AI sedang memahami konteks...";
            }
            if (data.status === 'completed') {
                clearInterval(interval);
                showAiResult(data);
            }
        } catch (e) { clearInterval(interval); }
    }, 3000);
}

// 4. DISPLAY RESULT: KESIMPULAN + POIN PENTING (RAPIH & DETAIL)
function showAiResult(data) {
    hideLoader();
    document.getElementById('videoResult').classList.add('hidden');
    document.getElementById('aiResult').classList.remove('hidden');
    
    const summaryBox = document.getElementById('aiSummary');
    const title = document.getElementById('videoTitle').innerText;

    // Memecah teks menjadi poin-poin rapi
    const rawData = data.summary || data.text || "";
    const points = rawData.split(/[•\n]/).filter(p => p.trim().length > 10);

    summaryBox.innerHTML = `
        <div class="space-y-6 animate-fade-in">
            <div class="bg-gradient-to-br from-indigo-700 to-indigo-900 p-5 rounded-[2rem] text-white shadow-xl border border-white/10">
                <div class="flex items-center gap-2 mb-3">
                    <span class="bg-white/20 p-2 rounded-xl">🧠</span>
                    <h4 class="font-black text-[10px] uppercase tracking-[0.2em] text-indigo-200">Executive Summary</h4>
                </div>
                <p class="text-sm leading-relaxed font-medium">
                    Berdasarkan bedah konten <b>"${title}"</b>, sistem kami menyimpulkan bahwa video ini memiliki pesan inti yang kuat mengenai topik tersebut. AI telah mengekstrak detail paling krusial agar Anda bisa memahami isinya dalam waktu kurang dari 1 menit.
                </p>
            </div>

            <div class="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div class="absolute top-0 right-0 p-4 opacity-5">
                    <svg width="60" height="60" viewBox="0 0 24 24"><path fill="currentColor" d="M14 17h3m-3-4h3m-6-4h9M5 21V5q0-.825.588-1.413T7 3h10q.825 0 1.413.588T19 5v16l-7-3l-7 3Z"/></svg>
                </div>
                
                <h4 class="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-5 flex items-center gap-2">
                    <span class="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Insight Utama Konten
                </h4>
                
                <div class="space-y-5">
                    ${points.map(p => `
                        <div class="flex gap-4">
                            <div class="mt-1.5 flex-none w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
                            <p class="text-slate-600 text-[13px] leading-relaxed font-medium">${p.trim()}</p>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="bg-indigo-50/50 p-4 rounded-2xl border-2 border-dashed border-indigo-100">
                <p class="text-[9px] text-indigo-400 font-black uppercase text-center mb-1 tracking-widest">Inti Pesan Video</p>
                <p class="text-indigo-800 text-sm font-bold text-center italic leading-snug">
                    "${points[0] ? points[0].substring(0, 120) + '...' : 'Konten ini menyajikan informasi edukatif dan ringkas.'}"
                </p>
            </div>
            
            <div class="pt-2 flex justify-center">
                <button onclick="location.reload()" class="bg-slate-100 text-slate-500 text-[10px] px-6 py-2 rounded-full font-bold uppercase tracking-widest hover:bg-slate-200 transition-all">Bedah Video Lain</button>
            </div>
        </div>
    `;
}

function showLoader(text) {
    document.getElementById('loaderText').innerText = text;
    loader.classList.remove('hidden');
}
function hideLoader() { loader.classList.add('hidden'); }
